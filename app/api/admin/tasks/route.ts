import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET - List all tasks with pagination and search
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '10');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'name,asc';
    const projectId = searchParams.get('projectId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const supabase = createServerClient();

    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          name
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply project filter
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Apply active filter
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Apply sorting
    const [sortField, sortOrder] = sort.split(',');
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = page * size;
    const to = from + size - 1;
    query = query.range(from, to);

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { message: 'Error fetching tasks' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / size);

    return NextResponse.json({
      content: tasks || [],
      totalElements: count || 0,
      totalPages,
      size,
      number: page,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  } catch (error: any) {
    console.error('Tasks GET error:', error);
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

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const body = await request.json();
    const { name, description, projectId, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'Task name is required' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { message: 'Project ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        name,
        description: description || null,
        project_id: projectId,
        is_active: isActive !== undefined ? isActive : true,
      })
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { message: 'Error creating task' },
        { status: 500 }
      );
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Tasks POST error:', error);
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

