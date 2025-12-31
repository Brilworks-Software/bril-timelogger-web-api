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

// POST /api/desktop/{username}/sessions/{sessionId}/pause - Pause a session
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
        { message: 'reason is required for pause action' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('tracker_sessions')
      .select('id, user_id, session_status')
      .eq('id', sessionId)
      .eq('user_id', validation.user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.session_status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Session is not active' },
        { status: 400 }
      );
    }

    // Create pause record
    const pauseStartTime = new Date().toISOString();
    const { data: pause, error: pauseError } = await supabase
      .from('tracker_pauses')
      .insert({
        session_id: sessionId,
        start_time: pauseStartTime,
        reason: reason,
        duration: 0,
      })
      .select()
      .single();

    if (pauseError) {
      console.error('Error creating pause:', pauseError);
      return NextResponse.json(
        { message: 'Error pausing session' },
        { status: 500 }
      );
    }

    // Update session status to PAUSED
    await supabase
      .from('tracker_sessions')
      .update({ session_status: 'PAUSED' })
      .eq('id', sessionId);

    return NextResponse.json({
      id: pause.id,
      sessionId: pause.session_id,
      startTime: pause.start_time,
      endTime: pause.end_time,
      duration: pause.duration,
      reason: pause.reason,
    });
  } catch (error: any) {
    console.error('Pause session error:', error);
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

