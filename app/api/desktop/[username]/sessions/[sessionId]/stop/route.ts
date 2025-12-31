import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// Helper function to validate desktop user
async function validateDesktopUser(username: string) {
  const supabase = createServerClient();
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, account_non_locked')
    .eq('username', username)
    .single();

  if (userError || !user || !user.account_non_locked) {
    return { valid: false, error: 'User not found or account is locked', status: 403 };
  }

  return { valid: true, user };
}

// POST /api/desktop/{username}/sessions/{sessionId}/stop - Stop a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; sessionId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username, sessionId } = await params;

    const validation = await validateDesktopUser(username);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: validation.status || 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');

    if (!reason) {
      return NextResponse.json(
        { message: 'reason is required for stop action' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get session and verify it belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('tracker_sessions')
      .select('id, user_id, start_time, session_status')
      .eq('id', sessionId)
      .eq('user_id', validation.user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    // Allow stopping sessions that are ACTIVE or PAUSED
    if (session.session_status !== 'ACTIVE' && session.session_status !== 'PAUSED') {
      return NextResponse.json(
        { message: `Session cannot be stopped. Current status: ${session.session_status}` },
        { status: 400 }
      );
    }

    // If session is paused, close any active pauses
    if (session.session_status === 'PAUSED') {
      const { data: activePauses, error: pausesError } = await supabase
        .from('tracker_pauses')
        .select('id, start_time')
        .eq('session_id', sessionId)
        .is('end_time', null);

      if (!pausesError && activePauses && activePauses.length > 0) {
        const pauseEndTime = new Date().toISOString();
        for (const pause of activePauses) {
          const pauseStartTime = new Date(pause.start_time);
          const pauseDuration = new Date(pauseEndTime).getTime() - pauseStartTime.getTime();
          
          await supabase
            .from('tracker_pauses')
            .update({
              end_time: pauseEndTime,
              duration: pauseDuration,
            })
            .eq('id', pause.id);
        }
      }
    }

    const endTime = new Date().toISOString();
    const startTime = new Date(session.start_time);
    const totalDuration = new Date(endTime).getTime() - startTime.getTime();

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('tracker_sessions')
      .update({
        session_status: 'STOPPED',
        end_time: endTime,
        logout_reason: reason,
        total_duration: totalDuration,
      })
      .eq('id', sessionId)
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
      .single();

    if (updateError) {
      console.error('Error stopping session:', updateError);
      return NextResponse.json(
        { message: 'Error stopping session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updatedSession.id,
      userId: updatedSession.user_id,
      sessionStatus: updatedSession.session_status,
      startTime: updatedSession.start_time,
      endTime: updatedSession.end_time,
      totalDuration: updatedSession.total_duration,
      activeDuration: updatedSession.active_duration,
      idleDuration: updatedSession.idle_duration,
      logoutReason: updatedSession.logout_reason,
      project: updatedSession.projects ? {
        id: updatedSession.projects.id,
        name: updatedSession.projects.name,
      } : null,
      task: updatedSession.tasks ? {
        id: updatedSession.tasks.id,
        name: updatedSession.tasks.name,
      } : null,
    });
  } catch (error: any) {
    console.error('Stop session error:', error);
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

