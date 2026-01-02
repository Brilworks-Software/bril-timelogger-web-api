import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET - Get all tasks assigned to a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    // Await params (Next.js 15+ requirement)
    const { userId } = await params;

    const supabase = createServerClient();

    const { data: userTasks, error } = await supabase
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
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false });

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

// POST - Assign tasks to a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    // Await params (Next.js 15+ requirement)
    const { userId } = await params;

    const body = await request.json();
    const { taskIds } = body;

    if (!Array.isArray(taskIds)) {
      return NextResponse.json(
        { message: 'taskIds must be an array' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify all tasks exist
    if (taskIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .in('id', taskIds);

      if (tasksError) {
        return NextResponse.json(
          { message: 'Error verifying tasks' },
          { status: 500 }
        );
      }

      if (tasks.length !== taskIds.length) {
        return NextResponse.json(
          { message: 'One or more tasks not found' },
          { status: 404 }
        );
      }
    }

    // Remove existing assignments
    const { error: deleteError } = await supabase
      .from('user_tasks')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error removing existing assignments:', deleteError);
      return NextResponse.json(
        { message: 'Error updating assignments' },
        { status: 500 }
      );
    }

    // Add new assignments
    if (taskIds.length > 0) {
      const assignments = taskIds.map((taskId: string) => ({
        user_id: userId,
        task_id: taskId,
      }));

      const { error: insertError } = await supabase
        .from('user_tasks')
        .insert(assignments);

      if (insertError) {
        console.error('Error assigning tasks:', insertError);
        return NextResponse.json(
          { message: 'Error assigning tasks' },
          { status: 500 }
        );
      }
    }

    // Fetch updated assignments
    const { data: userTasks, error: fetchError } = await supabase
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
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching updated assignments:', fetchError);
    }

    return NextResponse.json(userTasks || []);
  } catch (error: any) {
    console.error('User tasks POST error:', error);
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

