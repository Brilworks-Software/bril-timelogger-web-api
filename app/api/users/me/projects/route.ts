import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET - Get all projects assigned to the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    const supabase = createServerClient();

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
      .eq('user_id', user.userId)
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
    console.error('User projects GET error:', error);
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

