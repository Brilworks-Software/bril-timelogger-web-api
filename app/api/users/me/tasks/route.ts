import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET - Get all tasks assigned to the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const supabase = createServerClient();

    let query = supabase
      .from('user_tasks')
      .select(`
        id,
        assigned_at,
        tasks (
          id,
          name,
          description,
          project_id,
          is_active,
          created_at,
          updated_at,
          projects (
            id,
            name
          )
        )
      `)
      .eq('user_id', user.userId);

    // Filter by project if provided
    if (projectId) {
      query = query.eq('tasks.project_id', projectId);
    }

    const { data: userTasks, error } = await query.order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tasks:', error);
      return NextResponse.json(
        { message: 'Error fetching user tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json(userTasks || []);
  } catch (error: any) {
    console.error('User tasks GET error:', error);
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

