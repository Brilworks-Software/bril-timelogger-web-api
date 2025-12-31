import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// POST /api/desktop/{username}/sessions/idle/{idleEventId}/resolve - Resolve an idle event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; idleEventId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username, idleEventId } = await params;

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

    // Get idle event and verify it belongs to user's session
    const { data: idleEvent, error: idleError } = await supabase
      .from('tracker_idle_events')
      .select(`
        id,
        session_id,
        start_time,
        end_time,
        duration,
        tracker_sessions!inner (
          user_id
        )
      `)
      .eq('id', idleEventId)
      .eq('tracker_sessions.user_id', dbUser.id)
      .single();

    if (idleError || !idleEvent) {
      return NextResponse.json(
        { message: 'Idle event not found' },
        { status: 404 }
      );
    }

    // Check if already resolved
    if (idleEvent.end_time) {
      return NextResponse.json(
        { message: 'Idle event already resolved' },
        { status: 400 }
      );
    }

    // Resolve the idle event by setting end_time
    const endTime = new Date().toISOString();
    const startTime = new Date(idleEvent.start_time);
    const duration = new Date(endTime).getTime() - startTime.getTime();

    const { data: resolvedEvent, error: resolveError } = await supabase
      .from('tracker_idle_events')
      .update({
        end_time: endTime,
        duration: duration,
      })
      .eq('id', idleEventId)
      .select()
      .single();

    if (resolveError) {
      console.error('Error resolving idle event:', resolveError);
      return NextResponse.json(
        { message: 'Error resolving idle event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: resolvedEvent.id,
      sessionId: resolvedEvent.session_id,
      startTime: resolvedEvent.start_time,
      endTime: resolvedEvent.end_time,
      duration: resolvedEvent.duration,
    });
  } catch (error: any) {
    console.error('Resolve idle event error:', error);
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

