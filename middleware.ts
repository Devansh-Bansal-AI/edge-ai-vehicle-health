export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/fleet/:path*',
    '/diagnostics/:path*',
    '/maintenance/:path*',
    '/history/:path*',
  ],
};
