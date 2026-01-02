import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '10');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'name,asc';

    const supabase = createServerClient();

    let query = supabase
      .from('users')
      .select('id, username, name, email, role, account_non_locked', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply sorting
    const [sortField, sortOrder] = sort.split(',');
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = page * size;
    const to = from + size - 1;
    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { message: 'Error fetching users' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / size);

    return NextResponse.json({
      content: users?.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        accountNonLocked: user.account_non_locked,
        companyId: (user as any).company_id || null,
      })) || [],
      totalElements: count || 0,
      totalPages,
      size,
      number: page,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  } catch (error: any) {
    console.error('Users error:', error);
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

// POST - Create a new user with optional project/task assignments
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const body = await request.json();
    const { username, password, name, email, role, accountNonLocked, companyId, projectIds } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { message: 'username, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const insertData: any = {
      username,
      password_hash: passwordHash,
      name,
      email: email || null,
      role: role || 'user',
      account_non_locked: accountNonLocked !== undefined ? accountNonLocked : true,
    };
    
    // Only include company_id if the column exists (migration 003 has been run)
    // For now, we'll skip it to avoid errors
    // if (companyId !== undefined) {
    //   insertData.company_id = companyId || null;
    // }
    
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert(insertData)
      .select('id, username, name, email, role, account_non_locked')
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { message: 'Error creating user' },
        { status: 500 }
      );
    }

    // Assign projects if provided
    if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
      // Verify all projects exist
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .in('id', projectIds)
        .eq('is_active', true);

      if (projectsError) {
        console.error('Error verifying projects:', projectsError);
      } else if (projects.length !== projectIds.length) {
        // Some projects not found, but continue with valid ones
        console.warn('Some projects not found, assigning only valid ones');
      }

      if (projects && projects.length > 0) {
        const assignments = projects.map((project: any) => ({
          user_id: newUser.id,
          project_id: project.id,
        }));

        await supabase.from('user_projects').insert(assignments);
      }
    }

    // Note: Tasks are automatically available through assigned projects
    // No need to assign tasks directly

    // Fetch user with assignments
    const { data: userProjects } = await supabase
      .from('user_projects')
      .select(`
        id,
        assigned_at,
        projects (
          id,
          name,
          description,
          is_active
        )
      `)
      .eq('user_id', newUser.id);

    // Get tasks from assigned projects (tasks are automatically available through projects)
    const { data: userProjectsData } = await supabase
      .from('user_projects')
      .select('project_id')
      .eq('user_id', newUser.id);

    let userTasks: any[] = [];
    if (userProjectsData && userProjectsData.length > 0) {
      const projectIds = userProjectsData.map((up: any) => up.project_id);
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          id,
          name,
          description,
          project_id,
          is_active,
          projects (
            id,
            name
          )
        `)
        .in('project_id', projectIds)
        .eq('is_active', true);
      userTasks = tasksData || [];
    }

    // Get default project and task details
    let defaultProject = null;
    let defaultTask = null;

    if (newUser.default_project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', newUser.default_project_id)
        .single();
      defaultProject = project;
    }

    if (newUser.default_task_id) {
      const { data: task } = await supabase
        .from('tasks')
        .select('id, name, description, project_id')
        .eq('id', newUser.default_task_id)
        .single();
      defaultTask = task;
    }

    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      accountNonLocked: newUser.account_non_locked,
      companyId: (newUser as any).company_id || null,
      defaultProjectId: newUser.default_project_id,
      defaultTaskId: newUser.default_task_id,
      defaultProject,
      defaultTask,
      projects: userProjects || [],
      tasks: userTasks || [], // Tasks from assigned projects
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create user error:', error);
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

