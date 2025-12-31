import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/desktop/{username}/sessions/total-time-today - Get total time tracked today
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('timezone') || 'UTC';

    const supabase = createServerClient();

    // Await params (Next.js 15+ requirement)
    const { username } = await params;

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

    // Get start and end of today in the specified timezone
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);

    // Get all sessions for today
    const { data: sessions, error: sessionsError } = await supabase
      .from('tracker_sessions')
      .select('total_duration, active_duration, idle_duration')
      .eq('user_id', dbUser.id)
      .gte('start_time', startOfToday.toISOString())
      .lte('start_time', endOfToday.toISOString());

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { message: 'Error fetching sessions' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalActiveSeconds = (sessions || []).reduce((sum, session) => {
      return sum + ((session.active_duration || 0) / 1000); // Convert from milliseconds to seconds
    }, 0);

    const totalIdleSeconds = (sessions || []).reduce((sum, session) => {
      return sum + ((session.idle_duration || 0) / 1000);
    }, 0);

    const totalSeconds = (sessions || []).reduce((sum, session) => {
      return sum + ((session.total_duration || 0) / 1000);
    }, 0);

    return NextResponse.json({
      totalActiveSeconds: Math.round(totalActiveSeconds),
      totalIdleSeconds: Math.round(totalIdleSeconds),
      totalSeconds: Math.round(totalSeconds),
      timezone: timezone,
    });
  } catch (error: any) {
    console.error('Get total time today error:', error);
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

