import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// Helper function to validate desktop user
async function validateDesktopUser(username: string, request: NextRequest) {
  const supabase = createServerClient();
  
  // Get user by username
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, account_non_locked')
    .eq('username', username)
    .single();

  if (userError || !user) {
    return { valid: false, error: 'User not found or account is locked', status: 403 };
  }

  if (!user.account_non_locked) {
    return { valid: false, error: 'Account is locked', status: 403 };
  }

  // Check for active desktop sessions (if X-Client-Type is desktop)
  const clientType = request.headers.get('X-Client-Type');
  if (clientType?.toLowerCase() === 'desktop') {
    const { data: activeSessions } = await supabase
      .from('tracker_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_status', 'ACTIVE')
      .limit(1);

    if (activeSessions && activeSessions.length > 0) {
      return { valid: false, error: 'Active session already exists', status: 409 };
    }
  }

  return { valid: true, user };
}

// GET /api/desktop/{username}/sessions/active - Get active session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    // Validate desktop user
    const validation = await validateDesktopUser(username, request);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: validation.status || 403 }
      );
    }

    const supabase = createServerClient();

    // Get active session
    const { data: session, error } = await supabase
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
      .eq('user_id', validation.user.id)
      .eq('session_status', 'ACTIVE')
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (error || !session) {
      // Return 204 No Content when no active session exists
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Get active session error:', error);
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

