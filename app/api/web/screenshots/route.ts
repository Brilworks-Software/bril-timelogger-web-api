import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/web/screenshots - Get screenshots (for web interface)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '10');
    const username = searchParams.get('username');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!username) {
      return NextResponse.json(
        { message: 'username is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get target user
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is viewing their own screenshots or is admin
    if (user.userId !== targetUser.id && user.role !== 'ROLE_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: You can only view your own screenshots' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('tracker_screenshots')
      .select(`
        id,
        session_id,
        user_id,
        image_url,
        captured_at,
        tracker_sessions!inner (
          user_id,
          start_time,
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
        )
      `, { count: 'exact' })
      .eq('tracker_sessions.user_id', targetUser.id);

    // Apply date filters
    if (startDate) {
      query = query.gte('captured_at', startDate);
    }
    if (endDate) {
      query = query.lte('captured_at', endDate);
    }

    // Apply pagination
    const from = page * size;
    const to = from + size - 1;
    query = query.range(from, to);

    // Apply sorting
    query = query.order('captured_at', { ascending: false });

    const { data: screenshots, error, count } = await query;

    if (error) {
      console.error('Error fetching screenshots:', error);
      return NextResponse.json(
        { message: 'Error fetching screenshots' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / size);

    return NextResponse.json({
      content: (screenshots || []).map(screenshot => ({
        id: screenshot.id,
        sessionId: screenshot.session_id,
        userId: screenshot.user_id,
        imageUrl: screenshot.image_url,
        capturedAt: screenshot.captured_at,
        session: screenshot.tracker_sessions ? {
          startTime: screenshot.tracker_sessions.start_time,
          project: screenshot.tracker_sessions.projects ? {
            id: screenshot.tracker_sessions.projects.id,
            name: screenshot.tracker_sessions.projects.name,
          } : null,
          task: screenshot.tracker_sessions.tasks ? {
            id: screenshot.tracker_sessions.tasks.id,
            name: screenshot.tracker_sessions.tasks.name,
          } : null,
        } : null,
      })),
      totalElements: count || 0,
      totalPages,
      size,
      number: page,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  } catch (error: any) {
    console.error('Get screenshots error:', error);
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

