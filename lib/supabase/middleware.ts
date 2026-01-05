import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  // const supabase = createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  //     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  //   {
  //     cookies: {
  //       getAll() {
  //         return request.cookies.getAll();
  //       },
  //       setAll(cookiesToSet: any) {
  //         cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
  //           request.cookies.set(name, value)
  //         );
  //         supabaseResponse = NextResponse.next({
  //           request,
  //         });
  //         cookiesToSet.forEach(
  //           ({ name, value, options }: { name: string; value: string; options?: any }) =>
  //             supabaseResponse.cookies.set(name, value, options)
  //         );
  //       },
  //     },
  //   }
  // );

  // Check for JWT token in cookies for authentication
  let tokenCookie = request.cookies.get('token');
  let tokenValue: string | undefined = tokenCookie?.value;
  if (!tokenValue) {
    // Try to extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      tokenValue = authHeader.substring(7);
    }
  }
  // If no token and not on login/auth page, redirect to login
  if (
    !tokenValue &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
