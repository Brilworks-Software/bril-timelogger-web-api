import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateDesktopRequest } from '@/lib/auth/desktop';

// POST /api/desktop/{username}/events - Process a single event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
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

    // Authenticate with fallback support for expired tokens
    // If sessionId is provided, use it for fallback auth
    const authResult = await authenticateDesktopRequest(request, username, sessionId || null);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
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

    const supabase = createServerClient();

    // If sessionId is provided, verify it belongs to user
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('tracker_sessions')
        .select('id, user_id')
        .eq('id', sessionId)
        .eq('user_id', authResult.user.id)
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
        user_id: authResult.user.id,
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

