import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/desktop/{username}/screenshots/{sessionId} - Get screenshots for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; sessionId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username, sessionId } = await params;

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

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('tracker_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', dbUser.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    // Get screenshots for session
    const { data: screenshots, error: screenshotsError } = await supabase
      .from('tracker_screenshots')
      .select('id, session_id, user_id, image_url, captured_at')
      .eq('session_id', sessionId)
      .order('captured_at', { ascending: false });

    if (screenshotsError) {
      console.error('Error fetching screenshots:', screenshotsError);
      return NextResponse.json(
        { message: 'Error fetching screenshots' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      (screenshots || []).map(screenshot => ({
        id: screenshot.id,
        sessionId: screenshot.session_id,
        userId: screenshot.user_id,
        imageUrl: screenshot.image_url,
        capturedAt: screenshot.captured_at,
      }))
    );
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

