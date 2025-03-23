import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (Vercel static files)
     * - favicon
     * - public files
    */
    '/((?!_next|static|favicon.ico).*)',
  ],
};
