import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/desktop/{username}/activity-logs/session/{sessionId} - Get activity logs for a session
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

    // Get activity logs for session
    const { data: activityLogs, error: logsError } = await supabase
      .from('tracker_activity_logs')
      .select('id, session_id, user_id, activity_type, description, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false });

    if (logsError) {
      console.error('Error fetching activity logs:', logsError);
      return NextResponse.json(
        { message: 'Error fetching activity logs' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      (activityLogs || []).map(log => ({
        id: log.id,
        sessionId: log.session_id,
        userId: log.user_id,
        activityType: log.activity_type,
        description: log.description,
        timestamp: log.timestamp,
      }))
    );
  } catch (error: any) {
    console.error('Get activity logs error:', error);
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

