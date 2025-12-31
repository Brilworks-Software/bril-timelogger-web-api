import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
      role: string;
    };

    const supabase = createServerClient();

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, name, email, role, account_non_locked')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      accountNonLocked: user.account_non_locked,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }
}

