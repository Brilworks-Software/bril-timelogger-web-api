import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';

// GET - Search users (for autocomplete/search functionality)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    requireAdmin(user);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const supabase = createServerClient();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, name, email, role, account_non_locked')
      .or(`name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { message: 'Error searching users' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      users?.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        accountNonLocked: u.account_non_locked,
        companyId: (u as any).company_id || null,
      })) || []
    );
  } catch (error: any) {
    console.error('User search error:', error);
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

