import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Query user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (!user.account_non_locked) {
      return NextResponse.json(
        { message: 'Account is locked' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    // Create user session in Supabase
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        client_type: 'web',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
    }

    // Register user movement
    await supabase.from('user_movements').insert({
      user_id: user.id,
      movement_type: 'Ingreso a la Web',
      description: `Usuario ingresa a la aplicacion web a las ${new Date().toISOString()}`,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      created_at: new Date().toISOString(),
    });

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        accountNonLocked: user.account_non_locked,
      },
    });

    // Set token in cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

