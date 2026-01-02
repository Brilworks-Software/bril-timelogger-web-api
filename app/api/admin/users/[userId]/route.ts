import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET - Get a single user with project/task assignments
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

    // Get user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, name, email, role, account_non_locked, default_project_id, default_task_id, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { message: 'Error fetching user' },
        { status: 500 }
      );
    }

    // Get user projects
    const { data: userProjects } = await supabase
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

    // Get tasks from assigned projects (tasks are automatically available through projects)
    let userTasks: any[] = [];
    if (userProjects && userProjects.length > 0) {
      const projectIds = userProjects.map((up: any) => up.projects.id);
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          id,
          name,
          description,
          project_id,
          is_active,
          created_at,
          updated_at,
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

    if (userData.default_project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', userData.default_project_id)
        .single();
      defaultProject = project;
    }

    if (userData.default_task_id) {
      const { data: task } = await supabase
        .from('tasks')
        .select('id, name, description, project_id')
        .eq('id', userData.default_task_id)
        .single();
      defaultTask = task;
    }

    return NextResponse.json({
      id: userData.id,
      username: userData.username,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      accountNonLocked: userData.account_non_locked,
      companyId: (userData as any).company_id || null,
      defaultProjectId: userData.default_project_id,
      defaultTaskId: userData.default_task_id,
      defaultProject,
      defaultTask,
      projects: userProjects || [],
      tasks: userTasks || [],
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
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

// PUT - Update a user with optional project/task assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    // Await params (Next.js 15+ requirement)
    const { userId } = await params;

    const body = await request.json();
    const { username, password, name, email, role, accountNonLocked, companyId, projectIds } = body;

    const supabase = createServerClient();

    // Verify user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if username is being changed and if new username already exists
    if (username && username !== existingUser.username) {
      const { data: usernameCheck } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (usernameCheck) {
        return NextResponse.json(
          { message: 'Username already exists' },
          { status: 409 }
        );
      }
    }

    // Validate password if provided
    if (password && password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (accountNonLocked !== undefined) updateData.account_non_locked = accountNonLocked;
    // Skip company_id for now - column doesn't exist (migration 003 needs to be run)
    // if (companyId !== undefined) updateData.company_id = companyId || null;

    // Hash password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, name, email, role, account_non_locked, created_at, updated_at')
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { message: 'Error updating user' },
        { status: 500 }
      );
    }

    // Update project assignments if provided
    if (projectIds !== undefined) {
      // Remove existing assignments
      await supabase
        .from('user_projects')
        .delete()
        .eq('user_id', userId);

      // Add new assignments
      if (Array.isArray(projectIds) && projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .in('id', projectIds)
          .eq('is_active', true);

        if (projects && projects.length > 0) {
          const assignments = projects.map((project: any) => ({
            user_id: userId,
            project_id: project.id,
          }));

          await supabase.from('user_projects').insert(assignments);
        }
      }
    }

    // Note: Tasks are automatically available through assigned projects
    // No need to assign tasks directly

    // Fetch updated user with assignments
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
      .eq('user_id', userId);

    const { data: userTasks } = await supabase
      .from('user_tasks')
      .select(`
        id,
        assigned_at,
        tasks (
          id,
          name,
          description,
          project_id,
          is_active,
          projects (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId);

    // Get default project and task details
    let defaultProject = null;
    let defaultTask = null;

    if (updatedUser.default_project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', updatedUser.default_project_id)
        .single();
      defaultProject = project;
    }

    if (updatedUser.default_task_id) {
      const { data: task } = await supabase
        .from('tasks')
        .select('id, name, description, project_id')
        .eq('id', updatedUser.default_task_id)
        .single();
      defaultTask = task;
    }

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      accountNonLocked: updatedUser.account_non_locked,
      companyId: (updatedUser as any).company_id || null,
      defaultProjectId: updatedUser.default_project_id,
      defaultTaskId: updatedUser.default_task_id,
      defaultProject,
      defaultTask,
      projects: userProjects || [],
      tasks: userTasks || [],
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    });
  } catch (error: any) {
    console.error('Update user error:', error);
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

// DELETE - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    // Await params (Next.js 15+ requirement)
    const { userId } = await params;

    const supabase = createServerClient();

    // Verify user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting yourself
    if (user.userId === userId) {
      return NextResponse.json(
        { message: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { message: 'Error deleting user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      id: userId,
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
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

