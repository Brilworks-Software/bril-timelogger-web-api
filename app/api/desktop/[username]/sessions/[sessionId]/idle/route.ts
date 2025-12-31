import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// POST /api/desktop/{username}/sessions/{sessionId}/idle - Log an idle event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; sessionId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username, sessionId } = await params;

    const { searchParams } = new URL(request.url);
    const durationParam = searchParams.get('duration');
    const duration = durationParam ? parseInt(durationParam, 10) : null;

    if (!duration || duration <= 0) {
      return NextResponse.json(
        { message: 'duration parameter is required and must be greater than 0' },
        { status: 400 }
      );
    }

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
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', dbUser.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    // Create idle event
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 1000);
    const idleDuration = duration * 1000; // Convert to milliseconds

    const { data: idleEvent, error: idleError } = await supabase
      .from('tracker_idle_events')
      .insert({
        session_id: sessionId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: idleDuration,
      })
      .select()
      .single();

    if (idleError) {
      console.error('Error creating idle event:', idleError);
      return NextResponse.json(
        { message: 'Error creating idle event' },
        { status: 500 }
      );
    }

    // Update session idle duration
    const { data: currentSession } = await supabase
      .from('tracker_sessions')
      .select('idle_duration')
      .eq('id', sessionId)
      .single();

    if (currentSession) {
      await supabase
        .from('tracker_sessions')
        .update({
          idle_duration: (currentSession.idle_duration || 0) + idleDuration,
        })
        .eq('id', sessionId);
    }

    return NextResponse.json({
      id: idleEvent.id,
      sessionId: idleEvent.session_id,
      startTime: idleEvent.start_time,
      endTime: idleEvent.end_time,
      duration: idleEvent.duration,
    });
  } catch (error: any) {
    console.error('Log idle event error:', error);
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

// GET /api/desktop/{username}/sessions/{sessionId}/idle - Get unresolved idle events
export async function GET(
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
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', dbUser.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    // Get unresolved idle events (events without end_time are considered unresolved)
    const { data: idleEvents, error: idleError } = await supabase
      .from('tracker_idle_events')
      .select('id, session_id, start_time, end_time, duration')
      .eq('session_id', sessionId)
      .is('end_time', null)
      .order('start_time', { ascending: false });

    if (idleError) {
      console.error('Error fetching idle events:', idleError);
      return NextResponse.json(
        { message: 'Error fetching idle events' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      (idleEvents || []).map(event => ({
        id: event.id,
        sessionId: event.session_id,
        startTime: event.start_time,
        endTime: event.end_time,
        duration: event.duration,
      }))
    );
  } catch (error: any) {
    console.error('Get idle events error:', error);
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

