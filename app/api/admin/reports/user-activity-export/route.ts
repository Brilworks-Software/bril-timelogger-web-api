import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET - Export user activity report (returns CSV/Excel)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const format = searchParams.get('format') || 'XLSX';
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { message: 'fromDate and toDate are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

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
      `)
      .gte('start_time', fromDate)
      .lte('start_time', toDate);

    // Apply project filter
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Apply task filter
    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    query = query.order('start_time', { ascending: false });

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching user activity:', error);
      return NextResponse.json(
        { message: 'Error fetching user activity' },
        { status: 500 }
      );
    }

    // Group by user and date
    const userActivityMap = new Map<string, {
      userName: string;
      date: string;
      activeTime: number;
      idleTime: number;
      totalTime: number;
    }>();

    sessions?.forEach(session => {
      const sessionDate = session.start_time ? new Date(session.start_time).toISOString().split('T')[0] : '';
      const userName = session.users?.name || session.users?.username || 'Unknown';
      const key = `${userName}_${sessionDate}`;

      if (!userActivityMap.has(key)) {
        userActivityMap.set(key, {
          userName,
          date: sessionDate,
          activeTime: 0,
          idleTime: 0,
          totalTime: 0,
        });
      }

      const entry = userActivityMap.get(key)!;
      entry.activeTime += (session.active_duration || 0) / (1000 * 60 * 60); // Convert to hours
      entry.idleTime += (session.idle_duration || 0) / (1000 * 60 * 60);
      entry.totalTime += (session.total_duration || 0) / (1000 * 60 * 60);
    });

    // Format entries
    const entries = Array.from(userActivityMap.values()).map(entry => {
      const activityPercentage = entry.totalTime > 0
        ? (entry.activeTime / entry.totalTime) * 100
        : 0;

      return {
        userName: entry.userName,
        date: entry.date,
        activeTime: `${entry.activeTime.toFixed(2)}h`,
        idleTime: `${entry.idleTime.toFixed(2)}h`,
        totalTime: `${entry.totalTime.toFixed(2)}h`,
        activityPercentage: activityPercentage.toFixed(1),
      };
    });

    // Generate CSV
    if (format === 'CSV' || format === 'csv') {
      const headers = ['User Name', 'Date', 'Active Time', 'Idle Time', 'Total Time', 'Activity %'];
      const csvRows = [
        headers.join(','),
        ...entries.map(e => [
          `"${e.userName}"`,
          e.date,
          e.activeTime,
          e.idleTime,
          e.totalTime,
          `${e.activityPercentage}%`,
        ].join(','))
      ];

      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });

      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="user-activity-${fromDate}-to-${toDate}.csv"`,
        },
      });
    }

    // For XLSX, return JSON (frontend can use a library to convert)
    // Or you could use a library like exceljs here
    return NextResponse.json({
      entries,
      format: 'XLSX',
      message: 'XLSX format not yet implemented, returning JSON. Use CSV format for download.',
    });
  } catch (error: any) {
    console.error('User activity export error:', error);
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

