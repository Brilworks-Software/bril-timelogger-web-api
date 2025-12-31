import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET - Get user productivity report
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

    // Build query for tracker sessions
    let query = supabase
      .from('tracker_sessions')
      .select(`
        id,
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

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching user productivity:', error);
      return NextResponse.json(
        { message: 'Error fetching user productivity' },
        { status: 500 }
      );
    }

    // Group by user and calculate productivity metrics
    const userProductivityMap = new Map<string, {
      userName: string;
      totalActiveHours: number;
      totalHours: number;
      sessionCount: number;
    }>();

    sessions?.forEach(session => {
      const userName = session.users?.name || session.users?.username || 'Unknown';
      
      if (!userProductivityMap.has(userName)) {
        userProductivityMap.set(userName, {
          userName,
          totalActiveHours: 0,
          totalHours: 0,
          sessionCount: 0,
        });
      }

      const entry = userProductivityMap.get(userName)!;
      entry.totalActiveHours += (session.active_duration || 0) / (1000 * 60 * 60);
      entry.totalHours += (session.total_duration || 0) / (1000 * 60 * 60);
      entry.sessionCount += 1;
    });

    // Calculate productivity scores
    const entries = Array.from(userProductivityMap.values()).map(entry => {
      const efficiency = entry.totalHours > 0
        ? (entry.totalActiveHours / entry.totalHours) * 100
        : 0;

      // Productivity score: combination of hours worked and efficiency
      // Normalize to 0-100 scale
      const hoursScore = Math.min(entry.totalActiveHours * 10, 50); // Max 50 points for hours
      const efficiencyScore = efficiency * 0.5; // Max 50 points for efficiency
      const score = Math.min(hoursScore + efficiencyScore, 100);

      return {
        userName: entry.userName,
        score: Math.round(score),
        activeHours: parseFloat(entry.totalActiveHours.toFixed(2)),
        efficiency: parseFloat(efficiency.toFixed(1)),
      };
    }).sort((a, b) => b.score - a.score); // Sort by score descending

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('User productivity error:', error);
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

