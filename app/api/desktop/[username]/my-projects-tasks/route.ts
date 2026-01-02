import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateDesktopRequest } from '@/lib/auth/desktop';

/**
 * @swagger
 * /desktop/{username}/my-projects-tasks:
 *   get:
 *     summary: Get all active projects and tasks assigned to a user
 *     description: Returns all active projects assigned to the user along with their related active tasks. Returns lightweight data (id and name only).
 *     tags: [Desktop]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user
 *     responses:
 *       200:
 *         description: List of projects with their tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: Project ID
 *                   name:
 *                     type: string
 *                     description: Project name
 *                   tasks:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Task ID
 *                         name:
 *                           type: string
 *                           description: Task name
 *             example:
 *               - id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "Project Alpha"
 *                 tasks:
 *                   - id: "223e4567-e89b-12d3-a456-426614174000"
 *                     name: "Task 1"
 *                   - id: "323e4567-e89b-12d3-a456-426614174000"
 *                     name: "Task 2"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Account locked or insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { username } = await params;

    // Authenticate with fallback support for expired tokens (no sessionId needed for read operation)
    const authResult = await authenticateDesktopRequest(request, username, null);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const supabase = createServerClient();
    const dbUser = authResult.user;

    // Note: For fallback auth, username already matches. For JWT auth, 
    // we trust the JWT token's userId matches the username in the path.

    // Get all active projects assigned to the user
    const { data: userProjects, error: projectsError } = await supabase
      .from('user_projects')
      .select(`
        projects (
          id,
          name,
          is_active
        )
      `)
      .eq('user_id', dbUser.id);

    if (projectsError) {
      console.error('Error fetching user projects:', projectsError);
      return NextResponse.json(
        { message: 'Error fetching user projects' },
        { status: 500 }
      );
    }

    if (!userProjects || userProjects.length === 0) {
      return NextResponse.json([]);
    }

    // Filter only active projects and extract project IDs
    const activeProjects = userProjects.filter(
      up => up.projects !== null && up.projects.is_active === true
    );

    if (activeProjects.length === 0) {
      return NextResponse.json([]);
    }

    const projectIds = activeProjects
      .map(up => up.projects!.id)
      .filter((id): id is string => id !== null && id !== undefined);

    if (projectIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get all active tasks for these projects
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        name,
        project_id
      `)
      .in('project_id', projectIds)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json(
        { message: 'Error fetching tasks' },
        { status: 500 }
      );
    }

    // Group tasks by project_id
    const tasksByProject = (tasks || []).reduce((acc: Record<string, any[]>, task) => {
      const projectId = task.project_id;
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push({
        id: task.id,
        name: task.name,
      });
      return acc;
    }, {});

    // Format response: lightweight projects with their tasks (only id and name)
    const formattedProjects = activeProjects.map(up => ({
      id: up.projects!.id,
      name: up.projects!.name,
      tasks: tasksByProject[up.projects!.id] || [],
    }));

    return NextResponse.json(formattedProjects);
  } catch (error: any) {
    console.error('My projects tasks GET error:', error);
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

