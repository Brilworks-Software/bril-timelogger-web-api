import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// Helper function to validate desktop user
async function validateDesktopUser(username: string, request: NextRequest) {
  const supabase = createServerClient();
  
  // Get user by username
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, account_non_locked')
    .eq('username', username)
    .single();

  if (userError || !user) {
    return { valid: false, error: 'User not found or account is locked', status: 403 };
  }

  if (!user.account_non_locked) {
    return { valid: false, error: 'Account is locked', status: 403 };
  }

  // Check for active desktop sessions (if X-Client-Type is desktop)
  const clientType = request.headers.get('X-Client-Type');
  if (clientType?.toLowerCase() === 'desktop') {
    const { data: activeSessions } = await supabase
      .from('tracker_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_status', 'ACTIVE')
      .limit(1);

    if (activeSessions && activeSessions.length > 0) {
      return { valid: false, error: 'Active session already exists', status: 409 };
    }
  }

  return { valid: true, user };
}

// POST /api/desktop/{username}/sessions/start - Start a new session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    // Validate desktop user
    const validation = await validateDesktopUser(username, request);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: validation.status || 403 }
      );
    }

    const desktopUser = validation.user;
    const body = await request.json();
    const { projectId, taskId, desktopAppVersion } = body;

    if (!projectId) {
      return NextResponse.json(
        { message: 'projectId is required' },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { message: 'taskId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Validate project - must be assigned to user
    const { data: userProject, error: userProjectError } = await supabase
      .from('user_projects')
      .select('projects(id, name, is_active)')
      .eq('user_id', desktopUser.id)
      .eq('projects.id', projectId)
      .single();

    if (userProjectError || !userProject || !userProject.projects) {
      return NextResponse.json(
        { message: 'Project not assigned to user or not found' },
        { status: 404 }
      );
    }

    if (!userProject.projects.is_active) {
      return NextResponse.json(
        { message: 'Project is not active' },
        { status: 400 }
      );
    }

    // Validate task - must be assigned to user and belong to the project
    const { data: userTask, error: userTaskError } = await supabase
      .from('user_tasks')
      .select('tasks(id, name, project_id, is_active)')
      .eq('user_id', desktopUser.id)
      .eq('tasks.id', taskId)
      .single();

    if (userTaskError || !userTask || !userTask.tasks) {
      return NextResponse.json(
        { message: 'Task not assigned to user or not found' },
        { status: 404 }
      );
    }

    if (!userTask.tasks.is_active) {
      return NextResponse.json(
        { message: 'Task is not active' },
        { status: 400 }
      );
    }

    if (userTask.tasks.project_id !== projectId) {
      return NextResponse.json(
        { message: 'Task does not belong to the specified project' },
        { status: 400 }
      );
    }

    // Use validated project and task IDs
    const finalProjectId = projectId;
    const finalTaskId = taskId;

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('tracker_sessions')
      .insert({
        user_id: desktopUser.id,
        session_status: 'ACTIVE',
        start_time: new Date().toISOString(),
        project_id: finalProjectId || null,
        task_id: finalTaskId || null,
        total_duration: 0,
        active_duration: 0,
        idle_duration: 0,
      })
      .select(`
        id,
        user_id,
        session_status,
        start_time,
        end_time,
        total_duration,
        active_duration,
        idle_duration,
        project_id,
        task_id,
        projects (
          id,
          name
        ),
        tasks (
          id,
          name
        )
      `)
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json(
        { message: 'Error creating session' },
        { status: 500 }
      );
    }

    // Create user session with desktop client type
    await supabase.from('user_sessions').insert({
      user_id: desktopUser.id,
      client_type: 'desktop',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      id: session.id,
      userId: session.user_id,
      sessionStatus: session.session_status,
      startTime: session.start_time,
      endTime: session.end_time,
      totalDuration: session.total_duration,
      activeDuration: session.active_duration,
      idleDuration: session.idle_duration,
      project: session.projects ? {
        id: session.projects.id,
        name: session.projects.name,
      } : null,
      task: session.tasks ? {
        id: session.tasks.id,
        name: session.tasks.name,
      } : null,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Start session error:', error);
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

// GET /api/desktop/{username}/sessions/active - Get active session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    // Validate desktop user
    const validation = await validateDesktopUser(username, request);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: validation.status || 403 }
      );
    }

    const supabase = createServerClient();

    // Get active session
    const { data: session, error } = await supabase
      .from('tracker_sessions')
      .select(`
        id,
        user_id,
        session_status,
        start_time,
        end_time,
        total_duration,
        active_duration,
        idle_duration,
        logout_reason,
        project_id,
        task_id,
        projects (
          id,
          name
        ),
        tasks (
          id,
          name
        )
      `)
      .eq('user_id', validation.user.id)
      .eq('session_status', 'ACTIVE')
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (error || !session) {
      return NextResponse.json(null, { status: 204 });
    }

    return NextResponse.json({
      id: session.id,
      userId: session.user_id,
      sessionStatus: session.session_status,
      startTime: session.start_time,
      endTime: session.end_time,
      totalDuration: session.total_duration,
      activeDuration: session.active_duration,
      idleDuration: session.idle_duration,
      logoutReason: session.logout_reason,
      project: session.projects ? {
        id: session.projects.id,
        name: session.projects.name,
      } : null,
      task: session.tasks ? {
        id: session.tasks.id,
        name: session.tasks.name,
      } : null,
    });
  } catch (error: any) {
    console.error('Get active session error:', error);
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

