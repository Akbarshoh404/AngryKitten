import en from './en.json';
import uz from './uz.json';
import ru from './ru.json';

import { defaultLocale, isLocale, locales, type Locale } from './paths';

export { defaultLocale, getLocaleFromPath, isLocale, localizePath, locales, stripLocale } from './paths';
export type { Locale } from './paths';

export const localeLabels: Record<Locale, { short: string; name: string; hreflang: string }> = {
  en: { short: 'EN', name: 'English', hreflang: 'en' },
  uz: { short: 'UZ', name: 'Oʻzbekcha', hreflang: 'uz' },
  ru: { short: 'RU', name: 'Русский', hreflang: 'ru' },
};

type Dict = typeof en;
const dictionaries: Record<Locale, Dict> = { en, uz, ru };

/** Dot-path keys of the English dictionary, e.g. "nav.work". */
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown> ? Paths<T[K], `${P}${K}.`> : `${P}${K}`;
}[keyof T & string];
export type I18nKey = Paths<Dict>;

function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}

/** Returns a translator bound to a locale. Falls back to English for missing keys. */
export function useTranslations(locale: Locale) {
  return function t(key: I18nKey, vars?: Record<string, string | number>): string {
    let value = lookup(dictionaries[locale], key) ?? lookup(dictionaries.en, key) ?? key;
    if (vars) {
      for (const [name, v] of Object.entries(vars)) value = value.replaceAll(`{${name}}`, String(v));
    }
    return value;
  };
}

function deepMerge(base: unknown, over: unknown): unknown {
  if (Array.isArray(base)) {
    const arr = Array.isArray(over) ? over : [];
    return base.map((item, i) => deepMerge(item, arr[i]));
  }
  if (base && typeof base === 'object') {
    const out: Record<string, unknown> = {};
    const o = (over && typeof over === 'object' ? over : {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(base)) out[k] = deepMerge(v, o[k]);
    return out;
  }
  return typeof over === typeof base ? over : base;
}

/** The whole dictionary for a locale (English fills any gaps). Use for lists and structured copy. */
export function getDict(locale: Locale): Dict {
  return (locale === 'en' ? en : deepMerge(en, dictionaries[locale])) as Dict;
}

/** Replaces {name} placeholders in a string. */
export function fill(value: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), value);
}

/** Static paths for pages generated once per locale under src/pages/[...lang]/. */
export function localeStaticPaths() {
  return locales.map((locale) => ({
    params: { lang: locale === defaultLocale ? undefined : locale },
    props: { locale },
  }));
}

/** Resolve the locale from a [...lang] route param. */
export function localeFromParam(param: string | undefined): Locale {
  return isLocale(param) ? param : defaultLocale;
}
