import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/desktop/{username}/projects - Get all projects assigned to the user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    const supabase = createServerClient();

    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    // Get user by username
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, username, account_non_locked')
      .eq('username', username)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if account is locked
    if (!dbUser.account_non_locked) {
      return NextResponse.json(
        { message: 'Account is locked' },
        { status: 403 }
      );
    }

    // Verify the authenticated user matches the username in the path
    if (user.userId !== dbUser.id && user.role !== 'ROLE_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: You can only access your own projects' },
        { status: 403 }
      );
    }

    // Get all projects assigned to the user
    const { data: userProjects, error } = await supabase
      .from('user_projects')
      .select(`
        id,
        assigned_at,
        projects (
          id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', dbUser.id)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user projects:', error);
      return NextResponse.json(
        { message: 'Error fetching user projects' },
        { status: 500 }
      );
    }

    return NextResponse.json(userProjects || []);
  } catch (error: any) {
    console.error('Desktop projects GET error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

