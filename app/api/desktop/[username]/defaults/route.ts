import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAuth } from '@/lib/auth';

// GET /api/desktop/{username}/defaults - Get default project and task for the user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    console.log('[Defaults] Route called');
    const user = await getAuthUser(request);
    requireAuth(user);
    console.log('[Defaults] User authenticated:', user.userId, user.username);

    const supabase = createServerClient();

    // Await params (Next.js 15+ requirement)
    const { username } = await params;
    console.log('[Defaults] Username from params:', username);

    // Get user by username
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, username, account_non_locked')
      .eq('username', username)
      .single();

    if (userError) {
      console.error('Error fetching user by username:', userError);
      return NextResponse.json(
        { message: 'User not found', error: userError.message },
        { status: 404 }
      );
    }

    if (!dbUser) {
      console.error(`User not found in database: ${username}`);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if account is locked
    if (!dbUser.account_non_locked) {
      return NextResponse.json(
        { message: 'Account is locked' },
        { status: 403 }
      );
    }

    // Verify the authenticated user matches the username in the path
    if (user.userId !== dbUser.id && user.role !== 'ROLE_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: You can only access your own defaults' },
        { status: 403 }
      );
    }

    // Get the first assigned project (most recently assigned)
    const { data: userProjectsData, error: projectsError } = await supabase
      .from('user_projects')
      .select(`
        id,
        assigned_at,
        projects (
          id,
          name,
          description
        )
      `)
      .eq('user_id', dbUser.id)
      .order('assigned_at', { ascending: false })
      .limit(1);

    let defaultProject = null;
    let defaultTask = null;

    if (userProjectsData && userProjectsData.length > 0 && userProjectsData[0].projects) {
      const projectData = userProjectsData[0].projects;
      defaultProject = {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
      };

      // Get the first assigned task for this project (most recently assigned)
      const { data: userTasksData, error: tasksError } = await supabase
        .from('user_tasks')
        .select(`
          id,
          assigned_at,
          tasks (
            id,
            name,
            description,
            project_id
          )
        `)
        .eq('user_id', dbUser.id)
        .eq('tasks.project_id', defaultProject.id)
        .order('assigned_at', { ascending: false })
        .limit(1);

      if (userTasksData && userTasksData.length > 0 && userTasksData[0].tasks) {
        const taskData = userTasksData[0].tasks;
        defaultTask = {
          id: taskData.id,
          name: taskData.name,
          description: taskData.description,
          project_id: taskData.project_id,
        };
      }
    }

    return NextResponse.json({
      defaultProjectId: defaultProject?.id || null,
      defaultTaskId: defaultTask?.id || null,
      defaultProject,
      defaultTask,
    });
  } catch (error: any) {
    console.error('Desktop defaults GET error:', error);
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

