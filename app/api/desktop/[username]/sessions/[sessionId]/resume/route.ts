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

// POST /api/desktop/{username}/sessions/{sessionId}/resume - Resume a paused session
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

    const supabase = createServerClient();

    // Verify session exists and is paused
    const { data: session, error: sessionError } = await supabase
      .from('tracker_sessions')
      .select('id, user_id, session_status, start_time, idle_duration')
      .eq('id', sessionId)
      .eq('user_id', validation.user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.session_status !== 'PAUSED') {
      return NextResponse.json(
        { message: 'Session is not paused' },
        { status: 400 }
      );
    }

    // Get the most recent pause and end it
    const { data: pauses, error: pausesError } = await supabase
      .from('tracker_pauses')
      .select('id, start_time')
      .eq('session_id', sessionId)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1);

    if (pausesError || !pauses || pauses.length === 0) {
      return NextResponse.json(
        { message: 'No active pause found' },
        { status: 404 }
      );
    }

    const pause = pauses[0];
    const pauseEndTime = new Date().toISOString();
    const pauseStartTime = new Date(pause.start_time);
    const pauseDuration = new Date(pauseEndTime).getTime() - pauseStartTime.getTime();

    // Update pause
    const { data: updatedPause, error: pauseUpdateError } = await supabase
      .from('tracker_pauses')
      .update({
        end_time: pauseEndTime,
        duration: pauseDuration,
      })
      .eq('id', pause.id)
      .select()
      .single();

    if (pauseUpdateError) {
      console.error('Error updating pause:', pauseUpdateError);
      return NextResponse.json(
        { message: 'Error resuming session' },
        { status: 500 }
      );
    }

    // Calculate current total duration from start_time to now
    const startTime = new Date(session.start_time);
    const currentTime = new Date();
    const totalDuration = currentTime.getTime() - startTime.getTime();

    // Get total pause duration for this session (including the just-updated pause)
    const { data: allPauses, error: allPausesError } = await supabase
      .from('tracker_pauses')
      .select('duration')
      .eq('session_id', sessionId)
      .not('duration', 'is', null);

    let totalPauseDuration = 0;
    if (!allPausesError && allPauses) {
      totalPauseDuration = allPauses.reduce((sum, p) => sum + (p.duration || 0), 0);
    }

    // Calculate active_duration: total_duration - idle_duration - total_pause_duration
    const idleDuration = session.idle_duration || 0;
    const activeDuration = Math.max(0, totalDuration - idleDuration - totalPauseDuration);

    // Update session status to ACTIVE and recalculate active_duration
    await supabase
      .from('tracker_sessions')
      .update({ 
        session_status: 'ACTIVE',
        total_duration: totalDuration,
        active_duration: activeDuration,
      })
      .eq('id', sessionId);

    return NextResponse.json({
      id: updatedPause.id,
      sessionId: updatedPause.session_id,
      startTime: updatedPause.start_time,
      endTime: updatedPause.end_time,
      duration: updatedPause.duration,
      reason: updatedPause.reason,
    });
  } catch (error: any) {
    console.error('Resume session error:', error);
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

