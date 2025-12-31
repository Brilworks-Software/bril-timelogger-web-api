import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET - Get inactivity log report
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { message: 'fromDate and toDate are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Build query for idle events
    let query = supabase
      .from('tracker_idle_events')
      .select(`
        id,
        start_time,
        end_time,
        duration,
        session_id,
        tracker_sessions!inner (
          user_id,
          project_id,
          task_id,
          users (
            id,
            username,
            name,
            email
          ),
          projects (
            id,
            name
          ),
          tasks (
            id,
            name
          )
        )
      `)
      .gte('start_time', fromDate)
      .lte('start_time', toDate);

    // Apply project filter
    if (projectId) {
      query = query.eq('tracker_sessions.project_id', projectId);
    }

    // Apply task filter
    if (taskId) {
      query = query.eq('tracker_sessions.task_id', taskId);
    }

    query = query.order('start_time', { ascending: false });

    const { data: idleEvents, error } = await query;

    if (error) {
      console.error('Error fetching inactivity log:', error);
      return NextResponse.json(
        { message: 'Error fetching inactivity log' },
        { status: 500 }
      );
    }

    // Format response
    const formattedEntries = idleEvents?.map(event => {
      const session = event.tracker_sessions;
      const durationMinutes = (event.duration || 0) / (1000 * 60);
      
      return {
        userEmail: session?.users?.email || '',
        date: event.start_time ? new Date(event.start_time).toISOString().split('T')[0] : '',
        startTime: event.start_time || '',
        endTime: event.end_time || '',
        duration: durationMinutes,
        type: 'IDLE',
        reason: 'User inactivity',
        project: session?.projects ? {
          id: session.projects.id,
          name: session.projects.name,
        } : null,
        task: session?.tasks ? {
          id: session.tasks.id,
          name: session.tasks.name,
        } : null,
      };
    }) || [];

    return NextResponse.json(formattedEntries);
  } catch (error: any) {
    console.error('Inactivity log error:', error);
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

