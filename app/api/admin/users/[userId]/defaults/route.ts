import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET - Get default project and task for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const supabase = createServerClient();

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, default_project_id, default_task_id')
      .eq('id', params.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
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

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching user defaults:', error);
      return NextResponse.json(
        { message: 'Error fetching user defaults' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      defaultProjectId: userData.default_project_id,
      defaultTaskId: userData.default_task_id,
      defaultProject,
      defaultTask,
    });
  } catch (error: any) {
    console.error('User defaults GET error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { message: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Set default project and/or task for a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const body = await request.json();
    const { defaultProjectId, defaultTaskId } = body;

    const supabase = createServerClient();

    // Verify user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', params.userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify default project exists (if provided)
    if (defaultProjectId !== null && defaultProjectId !== undefined) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', defaultProjectId)
        .single();

      if (projectError || !project) {
        return NextResponse.json(
          { message: 'Default project not found' },
          { status: 404 }
        );
      }
    }

    // Verify default task exists and belongs to default project (if both provided)
    if (defaultTaskId !== null && defaultTaskId !== undefined) {
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id, project_id')
        .eq('id', defaultTaskId)
        .single();

      if (taskError || !task) {
        return NextResponse.json(
          { message: 'Default task not found' },
          { status: 404 }
        );
      }

      // If default project is also set, verify task belongs to it
      if (defaultProjectId !== null && defaultProjectId !== undefined && task.project_id !== defaultProjectId) {
        return NextResponse.json(
          { message: 'Default task must belong to the default project' },
          { status: 400 }
        );
      }
    }

    // Update user defaults
    const updateData: any = {};
    if (defaultProjectId !== undefined) {
      updateData.default_project_id = defaultProjectId || null;
    }
    if (defaultTaskId !== undefined) {
      updateData.default_task_id = defaultTaskId || null;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', params.userId)
      .select('id, default_project_id, default_task_id')
      .single();

    if (updateError) {
      console.error('Error updating user defaults:', updateError);
      return NextResponse.json(
        { message: 'Error updating user defaults' },
        { status: 500 }
      );
    }

    // Fetch project and task details if they exist
    let defaultProject = null;
    let defaultTask = null;

    if (updatedUser.default_project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', updatedUser.default_project_id)
        .single();
      defaultProject = project;
    }

    if (updatedUser.default_task_id) {
      const { data: task } = await supabase
        .from('tasks')
        .select('id, name, description, project_id')
        .eq('id', updatedUser.default_task_id)
        .single();
      defaultTask = task;
    }

    return NextResponse.json({
      defaultProjectId: updatedUser.default_project_id,
      defaultTaskId: updatedUser.default_task_id,
      defaultProject,
      defaultTask,
    });
  } catch (error: any) {
    console.error('User defaults PUT error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { message: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

