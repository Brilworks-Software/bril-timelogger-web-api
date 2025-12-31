import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/desktop/{username}/sessions/daily - Get daily sessions
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
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { message: 'date parameter is required (format: YYYY-MM-DD)' },
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

    // Parse date and create date range
    const date = new Date(dateParam);
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Get sessions for the day
    const { data: sessions, error: sessionsError } = await supabase
      .from('tracker_sessions')
      .select(`
        id,
        user_id,
        session_status,
        start_time,
        end_time,
        total_duration,
        active_duration,
        idle_duration,
        logout_reason,
        project_id,
        task_id,
        projects (
          id,
          name
        ),
        tasks (
          id,
          name
        )
      `)
      .eq('user_id', dbUser.id)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching daily sessions:', sessionsError);
      return NextResponse.json(
        { message: 'Error fetching daily sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      (sessions || []).map(session => ({
        id: session.id,
        userId: session.user_id,
        sessionStatus: session.session_status,
        startTime: session.start_time,
        endTime: session.end_time,
        totalDuration: session.total_duration,
        activeDuration: session.active_duration,
        idleDuration: session.idle_duration,
        logoutReason: session.logout_reason,
        project: session.projects ? {
          id: session.projects.id,
          name: session.projects.name,
        } : null,
        task: session.tasks ? {
          id: session.tasks.id,
          name: session.tasks.name,
        } : null,
      }))
    );
  } catch (error: any) {
    console.error('Get daily sessions error:', error);
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

