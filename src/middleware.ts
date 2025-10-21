import { createServerClient, type CookieOptions } from      
  '@supabase/ssr';
  import { NextResponse, type NextRequest } from
  'next/server';

  export async function middleware(request: NextRequest) {    
    // Allow widget script to be publicly accessible
    if (request.nextUrl.pathname === '/api/widget-script')    
   {
      return NextResponse.next();
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options:
  CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {      
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Refresh session if expired
    const { data: { user } } = await
  supabase.auth.getUser();

    // Check if the route requires authentication
    const isAdminRoute =
  request.nextUrl.pathname.startsWith('/admin');
    const isAuthRoute =
  request.nextUrl.pathname.startsWith('/login') ||

  request.nextUrl.pathname.startsWith('/signup');

    // Redirect to login if accessing admin without auth      
    if (isAdminRoute && !user) {
      const redirectUrl = new URL('/login', request.url);     
      redirectUrl.searchParams.set('redirect',
  request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

  // Redirect to admin if accessing auth pages while logged in
  if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/admin',
  request.url));
    }

    return response;
  }

  export const config = {
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|widget|donation).*)',        
    ],
  };