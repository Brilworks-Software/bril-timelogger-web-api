import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// POST /api/desktop/{username}/files/screenshots - Upload a screenshot file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAuth(user);

    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const file = formData.get('file') as File;

    if (!sessionId || !file) {
      return NextResponse.json(
        { message: 'sessionId and file are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'File must be an image' },
        { status: 400 }
      );
    }

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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create screenshot record with image data
    const { data: screenshot, error: screenshotError } = await supabase
      .from('tracker_screenshots')
      .insert({
        session_id: sessionId,
        user_id: dbUser.id,
        image_data: buffer,
        captured_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (screenshotError) {
      console.error('Error creating screenshot:', screenshotError);
      return NextResponse.json(
        { message: 'Error creating screenshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: screenshot.id,
      sessionId: screenshot.session_id,
      userId: screenshot.user_id,
      imageUrl: screenshot.image_url || null,
      capturedAt: screenshot.captured_at,
    });
  } catch (error: any) {
    console.error('Upload screenshot file error:', error);
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

