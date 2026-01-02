/**
 * Script to create an admin user
 * 
 * Usage:
 *   node scripts/create-admin-user.js <username> <password> <email> <name>
 * 
 * Example:
 *   node scripts/create-admin-user.js admin admin123 admin@brilworks.com "Administrator"
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually (since dotenv might not be installed)
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

async function createAdminUser(username, password, email, name) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single();

    if (existingUser) {
      console.error(`❌ Error: User with username "${username}" already exists`);
      process.exit(1);
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the user
    console.log('👤 Creating admin user...');
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        name: name || 'Administrator',
        email: email || `${username}@brilworks.com`,
        role: 'ROLE_ADMIN',
        account_non_locked: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user:', error.message);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 User Details:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
    console.log('\n🔑 You can now login with these credentials at /login');
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('📝 Usage: node scripts/create-admin-user.js <username> <password> [email] [name]');
  console.log('\nExample:');
  console.log('  node scripts/create-admin-user.js admin admin123 admin@brilworks.com "Administrator"');
  console.log('\nOr with minimal arguments:');
  console.log('  node scripts/create-admin-user.js admin admin123');
  process.exit(1);
}

const [username, password, email, name] = args;

// Validate username
if (!username || username.length < 3) {
  console.error('❌ Error: Username must be at least 3 characters long');
  process.exit(1);
}

// Validate password
if (!password || password.length < 6) {
  console.error('❌ Error: Password must be at least 6 characters long');
  process.exit(1);
}

createAdminUser(username, password, email, name);

