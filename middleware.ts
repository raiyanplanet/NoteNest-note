import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log('Middleware called for path:', req.nextUrl.pathname);

  // Allow access to login page
  if (req.nextUrl.pathname === '/admin/login') {
    console.log('Allowing access to login page');
    return NextResponse.next();
  }

  // For all other admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log('Checking admin session');
    const adminSession = req.cookies.get('admin');
    console.log('Admin session:', adminSession);

    if (!adminSession) {
      console.log('No admin session, redirecting to login');
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 