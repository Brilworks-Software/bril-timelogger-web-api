import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET - Get timeline for a user (can be own timeline or admin viewing another user)
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
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');

    const supabase = createServerClient();

    // Get the target user
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username, name, email')
      .eq('username', username)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is viewing their own timeline or is admin
    if (user.userId !== targetUser.id && user.role !== 'ROLE_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: You can only view your own timeline' },
        { status: 403 }
      );
    }

    // Build query for tracker sessions
    let query = supabase
      .from('tracker_sessions')
      .select(`
        id,
        start_time,
        end_time,
        total_duration,
        active_duration,
        idle_duration,
        logout_reason,
        session_status,
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
      `, { count: 'exact' })
      .eq('user_id', targetUser.id);

    // Apply date filters
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    // Apply project filter
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Apply task filter
    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    // Apply sorting (newest first)
    query = query.order('start_time', { ascending: false });

    // Apply pagination
    const from = page * size;
    const to = from + size - 1;
    query = query.range(from, to);

    const { data: sessions, error, count } = await query;

    if (error) {
      console.error('Error fetching timeline:', error);
      return NextResponse.json(
        { message: 'Error fetching timeline' },
        { status: 500 }
      );
    }

    // Get pauses for each session
    const sessionIds = sessions?.map(s => s.id) || [];
    let pauses: any[] = [];
    if (sessionIds.length > 0) {
      const { data: pausesData } = await supabase
        .from('tracker_pauses')
        .select('session_id, start_time, end_time, duration, reason')
        .in('session_id', sessionIds);
      pauses = pausesData || [];
    }

    // Group pauses by session
    const pausesBySession = pauses.reduce((acc: any, pause: any) => {
      if (!acc[pause.session_id]) {
        acc[pause.session_id] = [];
      }
      acc[pause.session_id].push({
        startTime: pause.start_time,
        endTime: pause.end_time,
        duration: pause.duration,
        reason: pause.reason,
      });
      return acc;
    }, {});

    // Format response
    const formattedSessions = sessions?.map(session => {
      const totalDurationMinutes = (session.total_duration || 0) / (1000 * 60);
      const activeDurationMinutes = (session.active_duration || 0) / (1000 * 60);
      const idleDurationMinutes = (session.idle_duration || 0) / (1000 * 60);
      const activityPercentage = totalDurationMinutes > 0
        ? (activeDurationMinutes / totalDurationMinutes) * 100
        : 0;

      return {
        sessionId: session.id,
        startTime: session.start_time,
        endTime: session.end_time,
        logoutReason: session.logout_reason || null,
        totalDuration: totalDurationMinutes,
        activeDuration: activeDurationMinutes,
        idleDuration: idleDurationMinutes,
        activityPercentage,
        pauses: pausesBySession[session.id] || [],
        project: session.projects ? {
          id: session.projects.id,
          name: session.projects.name,
        } : null,
        task: session.tasks ? {
          id: session.tasks.id,
          name: session.tasks.name,
        } : null,
      };
    }) || [];

    const totalPages = Math.ceil((count || 0) / size);

    return NextResponse.json({
      content: formattedSessions,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: {
          empty: false,
          sorted: true,
          unsorted: false,
        },
        offset: from,
        paged: true,
        unpaged: false,
      },
      last: page >= totalPages - 1,
      totalElements: count || 0,
      totalPages,
      size,
      number: page,
      sort: {
        empty: false,
        sorted: true,
        unsorted: false,
      },
      first: page === 0,
      numberOfElements: formattedSessions.length,
      empty: formattedSessions.length === 0,
    });
  } catch (error: any) {
    console.error('Timeline GET error:', error);
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

