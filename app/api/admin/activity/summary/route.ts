import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '10');
    const searchTerm = searchParams.get('searchTerm') || '';
    const status = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'totalHours,desc';

    const supabase = createServerClient();

    // Build query to get user activity summaries
    let query = supabase
      .from('tracker_sessions')
      .select(`
        user_id,
        users!inner(id, username, name, email),
        total_duration,
        active_duration,
        idle_duration,
        session_status
      `, { count: 'exact' });

    // Apply search filter
    if (searchTerm) {
      query = query.or(`users.name.ilike.%${searchTerm}%,users.email.ilike.%${searchTerm}%`);
    }

    // Apply status filter
    if (status) {
      query = query.eq('session_status', status.toUpperCase());
    }

    // Apply sorting
    const [sortField, sortOrder] = sort.split(',');
    query = query.order(sortField === 'totalHours' ? 'total_duration' : sortField, { 
      ascending: sortOrder === 'asc' 
    });

    // Apply pagination
    const from = page * size;
    const to = from + size - 1;
    query = query.range(from, to);

    const { data: sessions, error, count } = await query;

    if (error) {
      console.error('Error fetching activity summaries:', error);
      return NextResponse.json(
        { message: 'Error fetching activity summaries' },
        { status: 500 }
      );
    }

    // Group by user and calculate totals
    const userMap = new Map();
    sessions?.forEach((session: any) => {
      const userId = session.user_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          username: session.users.username,
          name: session.users.name,
          email: session.users.email,
          totalHours: 0,
          activeHours: 0,
          idleHours: 0,
          activityPercentage: 0,
          status: session.session_status,
        });
      }
      const userSummary = userMap.get(userId);
      userSummary.totalHours += (session.total_duration || 0) / (1000 * 60 * 60);
      userSummary.activeHours += (session.active_duration || 0) / (1000 * 60 * 60);
      userSummary.idleHours += (session.idle_duration || 0) / (1000 * 60 * 60);
    });

    // Calculate activity percentage
    userMap.forEach((summary) => {
      summary.activityPercentage = summary.totalHours > 0
        ? (summary.activeHours / summary.totalHours) * 100
        : 0;
    });

    const summaries = Array.from(userMap.values());
    const totalPages = Math.ceil((count || 0) / size);

    return NextResponse.json({
      content: summaries,
      totalElements: count || 0,
      totalPages,
      size,
      number: page,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  } catch (error: any) {
    console.error('Activity summary error:', error);
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

