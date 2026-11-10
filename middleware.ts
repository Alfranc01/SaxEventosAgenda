export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/agenda/:path*',
    '/eventos/nuevo',
    '/eventos/[id]/editar',
    '/finanzas/:path*',
    '/',
  ],
};
