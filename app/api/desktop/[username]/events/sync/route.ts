import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateDesktopRequest } from '@/lib/auth/desktop';

// POST /api/desktop/{username}/events/sync - Sync multiple events
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    const body = await request.json();
    const events = Array.isArray(body) ? body : body.events || [];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { message: 'events array is required' },
        { status: 400 }
      );
    }

    // Get first event's sessionId if available for fallback auth
    const firstSessionId = events[0]?.sessionId || null;

    // Authenticate with fallback support for expired tokens
    const authResult = await authenticateDesktopRequest(request, username, firstSessionId);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const supabase = createServerClient();

    const processedEvents = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneDayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Process each event in order
    for (const event of events) {
      const { eventId, eventType, timestamp, sessionId, payload } = event;

      if (!eventId || !eventType || !timestamp) {
        processedEvents.push({
          eventId: eventId || 'unknown',
          processed: false,
          error: 'Missing required fields',
        });
        continue;
      }

      const eventTimestamp = new Date(timestamp);

      // Validate timestamp
      if (eventTimestamp < oneDayAgo || eventTimestamp > oneDayAhead) {
        processedEvents.push({
          eventId,
          processed: false,
          error: 'Event timestamp is out of bounds',
        });
        continue;
      }

      // Verify session if provided
      if (sessionId) {
        const { data: session } = await supabase
          .from('tracker_sessions')
          .select('id, user_id')
          .eq('id', sessionId)
          .eq('user_id', authResult.user.id)
          .single();

        if (!session) {
          processedEvents.push({
            eventId,
            processed: false,
            error: 'Session not found',
          });
          continue;
        }
      }

      // Store processed event
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
        processedEvents.push({
          eventId,
          processed: false,
          error: 'Error processing event',
        });
        continue;
      }

      processedEvents.push({
        eventId,
        eventType,
        timestamp: eventTimestamp.toISOString(),
        sessionId: sessionId || null,
        processed: true,
        processedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(processedEvents);
  } catch (error: any) {
    console.error('Sync events error:', error);
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

