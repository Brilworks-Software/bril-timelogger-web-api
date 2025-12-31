import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// POST /api/desktop/{username}/events - Process a single event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    const body = await request.json();
    const { eventId, eventType, timestamp, sessionId, payload } = body;

    if (!eventId || !eventType || !timestamp) {
      return NextResponse.json(
        { message: 'eventId, eventType, and timestamp are required' },
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

    // Validate timestamp (should be within reasonable bounds)
    const eventTimestamp = new Date(timestamp);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneDayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (eventTimestamp < oneDayAgo || eventTimestamp > oneDayAhead) {
      return NextResponse.json(
        { message: 'Event timestamp is out of bounds' },
        { status: 422 }
      );
    }

    // If sessionId is provided, verify it belongs to user
    if (sessionId) {
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
    }

    // Store processed event (simplified - you may want a separate table for processed events)
    // For now, we'll log it as an activity log
    const { data: processedEvent, error: processError } = await supabase
      .from('tracker_activity_logs')
      .insert({
        session_id: sessionId || null,
        user_id: dbUser.id,
        activity_type: eventType,
        description: JSON.stringify({ eventId, payload }),
        timestamp: eventTimestamp.toISOString(),
      })
      .select()
      .single();

    if (processError) {
      console.error('Error processing event:', processError);
      return NextResponse.json(
        { message: 'Error processing event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      eventId,
      eventType,
      timestamp: eventTimestamp.toISOString(),
      sessionId: sessionId || null,
      processed: true,
      processedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Process event error:', error);
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

