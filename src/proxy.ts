import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/config/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 31536000,
    sameSite: 'lax',
    path: '/',
  },
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
