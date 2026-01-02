import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateDesktopRequest } from '@/lib/auth/desktop';

// POST /api/desktop/{username}/activity-logs/log - Log user activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const keyboardActivityPercent = searchParams.get('keyboardActivityPercent');
    const mouseActivityPercent = searchParams.get('mouseActivityPercent');

    if (!sessionId || !keyboardActivityPercent || !mouseActivityPercent) {
      return NextResponse.json(
        { message: 'sessionId, keyboardActivityPercent, and mouseActivityPercent are required' },
        { status: 400 }
      );
    }

    const keyboardPercent = parseFloat(keyboardActivityPercent);
    const mousePercent = parseFloat(mouseActivityPercent);

    if (isNaN(keyboardPercent) || isNaN(mousePercent) ||
        keyboardPercent < 0 || keyboardPercent > 100 ||
        mousePercent < 0 || mousePercent > 100) {
      return NextResponse.json(
        { message: 'Activity percentages must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Authenticate with fallback support for expired tokens
    const authResult = await authenticateDesktopRequest(request, username, sessionId);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const supabase = createServerClient();

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('tracker_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', authResult.user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    // Calculate average activity percentage
    const averageActivityPercent = (keyboardPercent + mousePercent) / 2;

    // Create activity log
    const { data: activityLog, error: activityError } = await supabase
      .from('tracker_activity_logs')
      .insert({
        session_id: sessionId,
        user_id: authResult.user.id,
        activity_type: 'USER_ACTIVITY',
        description: `Keyboard: ${keyboardPercent}%, Mouse: ${mousePercent}%, Average: ${averageActivityPercent.toFixed(2)}%`,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (activityError) {
      console.error('Error creating activity log:', activityError);
      return NextResponse.json(
        { message: 'Error creating activity log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: activityLog.id,
      sessionId: activityLog.session_id,
      userId: activityLog.user_id,
      activityType: activityLog.activity_type,
      description: activityLog.description,
      timestamp: activityLog.timestamp,
    });
  } catch (error: any) {
    console.error('Log activity error:', error);
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

