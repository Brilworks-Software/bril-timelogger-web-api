import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/desktop/{username}/sessions/active - Check if user has an active session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    const supabase = createServerClient();

    // Get user by username
    const { data: desktopUser, error: userError } = await supabase
      .from('users')
      .select('id, username, account_non_locked')
      .eq('username', username)
      .single();

    if (userError || !desktopUser) {
      return NextResponse.json(
        { message: 'User not found', hasActiveSession: false },
        { status: 404 }
      );
    }

    if (!desktopUser.account_non_locked) {
      return NextResponse.json(
        { message: 'Account is locked', hasActiveSession: false },
        { status: 403 }
      );
    }

    // Check for active session
    const { data: activeSession, error: sessionError } = await supabase
      .from('tracker_sessions')
      .select(`
        id,
        start_time,
        updated_at,
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
      .eq('user_id', desktopUser.id)
      .eq('session_status', 'ACTIVE')
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !activeSession) {
      return NextResponse.json({
        hasActiveSession: false,
        session: null,
      });
    }

    return NextResponse.json({
      hasActiveSession: true,
      session: {
        id: activeSession.id,
        startTime: activeSession.start_time,
        lastHeartbeat: activeSession.updated_at,
        project: activeSession.projects ? {
          id: activeSession.projects.id,
          name: activeSession.projects.name,
        } : null,
        task: activeSession.tasks ? {
          id: activeSession.tasks.id,
          name: activeSession.tasks.name,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Check active session error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { message: error.message, hasActiveSession: false },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error', hasActiveSession: false },
      { status: 500 }
    );
  }
}

