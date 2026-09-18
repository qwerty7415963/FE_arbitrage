export const locales = ['vi', 'en'] as const;
export const defaultLocale = 'vi' as const;
export type Locale = (typeof locales)[number];
