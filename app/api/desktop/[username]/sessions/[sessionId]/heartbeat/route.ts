import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// POST /api/desktop/{username}/sessions/{sessionId}/heartbeat - Update session heartbeat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; sessionId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username, sessionId } = await params;

    const supabase = createServerClient();

    // Get user
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
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
      .eq('id', sessionId)
      .eq('user_id', dbUser.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    // Calculate current durations for active sessions
    let activeDuration = session.active_duration || 0;
    let totalDuration = session.total_duration || 0;

    if (session.session_status === 'ACTIVE') {
      // Calculate current total duration from start_time to now
      const startTime = new Date(session.start_time);
      const currentTime = new Date();
      totalDuration = currentTime.getTime() - startTime.getTime();

      // Get total pause duration for this session
      const { data: pauses, error: pausesError } = await supabase
        .from('tracker_pauses')
        .select('duration')
        .eq('session_id', sessionId)
        .not('duration', 'is', null);

      let totalPauseDuration = 0;
      if (!pausesError && pauses) {
        totalPauseDuration = pauses.reduce((sum, pause) => sum + (pause.duration || 0), 0);
      }

      // Calculate active_duration: total_duration - idle_duration - total_pause_duration
      const idleDuration = session.idle_duration || 0;
      activeDuration = Math.max(0, totalDuration - idleDuration - totalPauseDuration);
    }

    // Update session updated_at and calculated durations (heartbeat)
    const { data: updatedSession, error: updateError } = await supabase
      .from('tracker_sessions')
      .update({ 
        updated_at: new Date().toISOString(),
        total_duration: totalDuration,
        active_duration: activeDuration,
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
      console.error('Error updating heartbeat:', updateError);
      return NextResponse.json(
        { message: 'Error updating heartbeat' },
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
    console.error('Heartbeat error:', error);
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

