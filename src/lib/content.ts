import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/utils';

type Localized<T> = { en: T; uz?: Partial<T>; ru?: Partial<T> };

/** Picks the text for a locale, falling back to English field by field. */
export function localized<T extends object>(text: Localized<T>, locale: Locale): T {
  if (locale === 'en') return text.en;
  return { ...text.en, ...(text[locale] ?? {}) } as T;
}

/** True when a locale has no translation of its own yet (shows English). */
export function isFallback(text: Localized<object>, locale: Locale): boolean {
  return locale !== 'en' && !text[locale];
}

export const playUrl = (packageId: string) =>
  `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageId)}`;

export async function getApps() {
  const apps = await getCollection('apps');
  return apps.sort((a, b) => a.data.order - b.data.order);
}
export const liveApps = async () => (await getApps()).filter((a) => a.data.status === 'live');
export const comingApps = async () => (await getApps()).filter((a) => a.data.status === 'coming');

export async function getServices() {
  return (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
}
export async function getTeam() {
  return (await getCollection('team')).sort((a, b) => a.data.order - b.data.order);
}
export async function getFaqs() {
  return (await getCollection('faqs')).sort((a, b) => a.data.order - b.data.order);
}

export type App = CollectionEntry<'apps'>;
