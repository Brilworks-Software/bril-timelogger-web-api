import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/desktop/{username}/events/status - Get session status
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
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { message: 'sessionId is required' },
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
      .select(`
        id,
        user_id,
        session_status,
        start_time,
        end_time,
        updated_at
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

    // Get latest events by type for this session
    const { data: activityLogs, error: logsError } = await supabase
      .from('tracker_activity_logs')
      .select('activity_type, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false });

    if (logsError) {
      console.error('Error fetching activity logs:', logsError);
    }

    // Group by event type and get latest
    const latestEvents: Record<string, any> = {};
    (activityLogs || []).forEach(log => {
      if (!latestEvents[log.activity_type] || 
          new Date(log.timestamp) > new Date(latestEvents[log.activity_type].timestamp)) {
        latestEvents[log.activity_type] = {
          eventType: log.activity_type,
          timestamp: log.timestamp,
        };
      }
    });

    return NextResponse.json({
      sessionId: session.id,
      sessionStatus: session.session_status,
      startTime: session.start_time,
      endTime: session.end_time,
      lastHeartbeat: session.updated_at,
      latestEvents: Object.values(latestEvents),
    });
  } catch (error: any) {
    console.error('Get session status error:', error);
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

