import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const username = searchParams.get('username');
    const timezone = searchParams.get('timezone') || 'UTC';

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { message: 'fromDate and toDate are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Build query for dashboard stats
    let query = supabase
      .from('tracker_sessions')
      .select(`
        id,
        user_id,
        start_time,
        end_time,
        total_duration,
        active_duration,
        idle_duration,
        users!inner(id, username, name, email)
      `)
      .gte('start_time', fromDate)
      .lte('start_time', toDate);

    if (username) {
      query = query.eq('users.username', username);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      return NextResponse.json(
        { message: 'Error fetching dashboard stats' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalSessions = sessions?.length || 0;
    const totalHours = sessions?.reduce((sum, session) => {
      return sum + (session.total_duration || 0);
    }, 0) || 0;
    const totalActiveHours = sessions?.reduce((sum, session) => {
      return sum + (session.active_duration || 0);
    }, 0) || 0;
    const totalIdleHours = sessions?.reduce((sum, session) => {
      return sum + (session.idle_duration || 0);
    }, 0) || 0;

    const stats = {
      totalSessions,
      totalHours: totalHours / (1000 * 60 * 60), // Convert to hours
      totalActiveHours: totalActiveHours / (1000 * 60 * 60),
      totalIdleHours: totalIdleHours / (1000 * 60 * 60),
      averageSessionDuration: totalSessions > 0 ? (totalHours / totalSessions) / (1000 * 60 * 60) : 0,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { message: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

