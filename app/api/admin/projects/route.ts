import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET - List all projects with pagination and search
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '10');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'name,asc';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const supabase = createServerClient();

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
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

    const { data: projects, error, count } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { message: 'Error fetching projects' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / size);

    return NextResponse.json({
      content: projects || [],
      totalElements: count || 0,
      totalPages,
      size,
      number: page,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  } catch (error: any) {
    console.error('Projects GET error:', error);
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

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'Project name is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description: description || null,
        is_active: isActive !== undefined ? isActive : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { message: 'Error creating project' },
        { status: 500 }
      );
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('Projects POST error:', error);
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

