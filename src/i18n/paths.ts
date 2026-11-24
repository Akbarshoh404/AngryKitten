/**
 * Locale and URL helpers. Kept free of JSON imports so they can be unit-tested with
 * plain `node --test` (see tests/paths.test.ts).
 */
export const locales = ['en', 'uz', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Normalises a built or requested pathname: "/ru.html" -> "/ru", "/work/index.html" -> "/work". */
function normalise(pathname: string): string {
  return pathname.replace(/\.html$/, '').replace(/\/index$/, '') || '/';
}

/** Reads the locale from a URL pathname ("/uz/work" -> "uz", "/ru.html" -> "ru", "/work" -> "en"). */
export function getLocaleFromPath(pathname: string): Locale {
  const first = normalise(pathname).split('/').filter(Boolean)[0];
  return isLocale(first) ? first : defaultLocale;
}

/** Strips the locale prefix: "/uz/work" -> "/work", "/uz" and "/uz.html" -> "/". */
export function stripLocale(pathname: string): string {
  const parts = normalise(pathname).split('/').filter(Boolean);
  if (isLocale(parts[0])) parts.shift();
  return '/' + parts.join('/');
}

/** Prefixes a site path with the locale ("/work", "uz" -> "/uz/work"). Keeps hash and query. */
export function localizePath(path: string, locale: Locale): string {
  const match = path.match(/^([^?#]*)(.*)$/);
  const base = match?.[1] || '/';
  const rest = match?.[2] ?? '';
  const clean = base.startsWith('/') ? base : `/${base}`;
  if (locale === defaultLocale) return clean + rest;
  return (clean === '/' ? `/${locale}` : `/${locale}${clean}`) + rest;
}
