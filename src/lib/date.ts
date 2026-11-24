import type { Locale } from '../i18n/utils';

// Node's ICU data for Uzbek is thin ("2026 M11"), so Uzbek dates are spelled out by hand
// following the standard "2026-yil 10-may" pattern. English and Russian use Intl.
const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];
const INTL: Record<Exclude<Locale, 'uz'>, string> = { en: 'en-GB', ru: 'ru-RU' };

/** "10 May 2026" · "2026-yil 10-may" · "10 мая 2026 г." Returns the input unchanged if it isn't a date. */
export function formatDate(value: string | Date, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (locale === 'uz') return `${date.getFullYear()}-yil ${date.getDate()}-${UZ_MONTHS[date.getMonth()]}`;
  return date.toLocaleDateString(INTL[locale], { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "Nov 2026" · "2026-yil noyabr" · "нояб. 2026 г." */
export function formatMonth(value: string | Date, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (locale === 'uz') return `${date.getFullYear()}-yil ${UZ_MONTHS[date.getMonth()]}`;
  return date.toLocaleDateString(INTL[locale], { month: 'short', year: 'numeric' });
}
