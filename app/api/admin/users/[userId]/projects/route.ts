import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET - Get all projects assigned to a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    // Await params (Next.js 15+ requirement)
    const { userId } = await params;

    const supabase = createServerClient();

    const { data: userProjects, error } = await supabase
      .from('user_projects')
      .select(`
        id,
        assigned_at,
        projects (
          id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user projects:', error);
      return NextResponse.json(
        { message: 'Error fetching user projects' },
        { status: 500 }
      );
    }

    return NextResponse.json(userProjects || []);
  } catch (error: any) {
    console.error('User projects GET error:', error);
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

// POST - Assign projects to a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    // Await params (Next.js 15+ requirement)
    const { userId } = await params;

    const body = await request.json();
    const { projectIds } = body;

    if (!Array.isArray(projectIds)) {
      return NextResponse.json(
        { message: 'projectIds must be an array' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify all projects exist
    if (projectIds.length > 0) {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .in('id', projectIds);

      if (projectsError) {
        return NextResponse.json(
          { message: 'Error verifying projects' },
          { status: 500 }
        );
      }

      if (projects.length !== projectIds.length) {
        return NextResponse.json(
          { message: 'One or more projects not found' },
          { status: 404 }
        );
      }
    }

    // Remove existing assignments
    const { error: deleteError } = await supabase
      .from('user_projects')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error removing existing assignments:', deleteError);
      return NextResponse.json(
        { message: 'Error updating assignments' },
        { status: 500 }
      );
    }

    // Add new assignments
    if (projectIds.length > 0) {
      const assignments = projectIds.map((projectId: string) => ({
        user_id: userId,
        project_id: projectId,
      }));

      const { error: insertError } = await supabase
        .from('user_projects')
        .insert(assignments);

      if (insertError) {
        console.error('Error assigning projects:', insertError);
        return NextResponse.json(
          { message: 'Error assigning projects' },
          { status: 500 }
        );
      }
    }

    // Fetch updated assignments
    const { data: userProjects, error: fetchError } = await supabase
      .from('user_projects')
      .select(`
        id,
        assigned_at,
        projects (
          id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching updated assignments:', fetchError);
    }

    return NextResponse.json(userProjects || []);
  } catch (error: any) {
    console.error('User projects POST error:', error);
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

