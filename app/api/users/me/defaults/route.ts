import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET - Get default project and task for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    const supabase = createServerClient();

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, default_project_id, default_task_id')
      .eq('id', user.userId)
      .single();

    if (error) {
      console.error('Error fetching user defaults:', error);
      return NextResponse.json(
        { message: 'Error fetching user defaults' },
        { status: 500 }
      );
    }

    // Fetch project and task details if they exist
    let defaultProject = null;
    let defaultTask = null;

    if (userData.default_project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', userData.default_project_id)
        .single();
      defaultProject = project;
    }

    if (userData.default_task_id) {
      const { data: task } = await supabase
        .from('tasks')
        .select('id, name, description, project_id')
        .eq('id', userData.default_task_id)
        .single();
      defaultTask = task;
    }

    return NextResponse.json({
      defaultProjectId: userData.default_project_id,
      defaultTaskId: userData.default_task_id,
      defaultProject,
      defaultTask,
    });
  } catch (error: any) {
    console.error('User defaults GET error:', error);
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

