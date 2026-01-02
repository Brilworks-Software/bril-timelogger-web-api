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

  return { valid: true, user };
}

// Helper function to force stop active sessions using last heartbeat time
async function forceStopActiveSessions(userId: string) {
  const supabase = createServerClient();
  
  // Find all active sessions for the user with updated_at (last heartbeat)
  const { data: activeSessions, error: sessionsError } = await supabase
    .from('tracker_sessions')
    .select('id, start_time, updated_at, idle_duration')
    .eq('user_id', userId)
    .eq('session_status', 'ACTIVE');

  if (sessionsError || !activeSessions || activeSessions.length === 0) {
    return; // No active sessions to stop
  }

  // Force stop each active session
  for (const session of activeSessions) {
    const startTime = new Date(session.start_time);
    // Use updated_at (last heartbeat time) as end_time, or current time if updated_at is not available
    const lastHeartbeat = session.updated_at ? new Date(session.updated_at) : new Date();
    const endTime = lastHeartbeat;
    const totalDuration = endTime.getTime() - startTime.getTime();

    // Close any active pauses
    const { data: activePauses } = await supabase
      .from('tracker_pauses')
      .select('id, start_time')
      .eq('session_id', session.id)
      .is('end_time', null);

    if (activePauses && activePauses.length > 0) {
      const pauseEndTime = endTime.toISOString();
      for (const pause of activePauses) {
        const pauseStartTime = new Date(pause.start_time);
        const pauseDuration = endTime.getTime() - pauseStartTime.getTime();
        
        await supabase
          .from('tracker_pauses')
          .update({
            end_time: pauseEndTime,
            duration: pauseDuration,
          })
          .eq('id', pause.id);
      }
    }

    // Get total pause duration for this session
    const { data: pauses } = await supabase
      .from('tracker_pauses')
      .select('duration')
      .eq('session_id', session.id)
      .not('duration', 'is', null);

    let totalPauseDuration = 0;
    if (pauses) {
      totalPauseDuration = pauses.reduce((sum, pause) => sum + (pause.duration || 0), 0);
    }

    // Calculate active_duration: total_duration - idle_duration - total_pause_duration
    const idleDuration = session.idle_duration || 0;
    const activeDuration = Math.max(0, totalDuration - idleDuration - totalPauseDuration);

    // Update session with force stop
    await supabase
      .from('tracker_sessions')
      .update({
        session_status: 'STOPPED',
        end_time: endTime.toISOString(),
        logout_reason: 'FORCE_STOPPED_NEW_SESSION_STARTED',
        total_duration: totalDuration,
        active_duration: activeDuration,
      })
      .eq('id', session.id);
  }
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
    const { projectId, taskId, desktopAppVersion, forceStop } = body;

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

    // If forceStop is true, stop any active sessions before starting a new one
    if (forceStop === true) {
      await forceStopActiveSessions(desktopUser.id);
    }

    // Validate project - must be assigned to user
    const { data: userProject, error: userProjectError } = await supabase
      .from('user_projects')
      .select('project_id, projects(id, name, is_active)')
      .eq('user_id', desktopUser.id)
      .eq('project_id', projectId)
      .single();

    if (userProjectError || !userProject || !userProject.projects) {
      console.error('Project validation error:', {
        userProjectError,
        userProject,
        userId: desktopUser.id,
        projectId,
      });
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

    // Validate task - must exist, belong to the project, and be active
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, name, project_id, is_active')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('Task validation error:', {
        taskError,
        task,
        taskId,
      });
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    if (!task.is_active) {
      return NextResponse.json(
        { message: 'Task is not active' },
        { status: 400 }
      );
    }

    if (task.project_id !== projectId) {
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

