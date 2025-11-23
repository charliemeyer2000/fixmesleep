import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip auth for API routes and auth endpoint itself
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check if user has valid auth cookie
  const authCookie = request.cookies.get('dashboard_auth');
  
  if (!authCookie?.value) {
    // Redirect to login if not authenticated
    if (request.nextUrl.pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // If authenticated and trying to access login, redirect to dashboard
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

