import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// POST /api/desktop/{username}/events/sync - Sync multiple events
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
    const events = Array.isArray(body) ? body : body.events || [];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { message: 'events array is required' },
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
          .eq('user_id', dbUser.id)
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
          user_id: dbUser.id,
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

