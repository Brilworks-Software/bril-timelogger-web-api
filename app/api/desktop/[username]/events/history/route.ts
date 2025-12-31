import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/desktop/{username}/events/history - Get event history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('timezone') || 'UTC';
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!startTime || !endTime) {
      return NextResponse.json(
        { message: 'startTime and endTime are required (ISO-8601 format)' },
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

    // Get activity logs for the time range
    const { data: activityLogs, error: logsError } = await supabase
      .from('tracker_activity_logs')
      .select('id, session_id, activity_type, description, timestamp')
      .eq('user_id', dbUser.id)
      .gte('timestamp', startTime)
      .lte('timestamp', endTime)
      .order('timestamp', { ascending: false });

    if (logsError) {
      console.error('Error fetching event history:', logsError);
      return NextResponse.json(
        { message: 'Error fetching event history' },
        { status: 500 }
      );
    }

    // Parse event data from description
    const events = (activityLogs || []).map(log => {
      let payload = null;
      try {
        const parsed = JSON.parse(log.description || '{}');
        payload = parsed.payload || null;
      } catch (e) {
        // Description is not JSON, use as-is
      }

      return {
        id: log.id,
        sessionId: log.session_id,
        eventType: log.activity_type,
        timestamp: log.timestamp,
        payload,
      };
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Get event history error:', error);
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

