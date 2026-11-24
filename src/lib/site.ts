import site from '../content/site.json';
import type { Locale } from '../i18n/utils';

type Translated = { en: string; uz?: string; ru?: string };
const pick = (v: Translated, locale: Locale) => v[locale] ?? v.en;

/** Facts from site.json that read differently per language (English fallback). */
export function siteText(locale: Locale) {
  return {
    address: pick(site.address, locale),
    replyTime: pick(site.replyTime, locale),
    pressReplyTime: pick(site.pressReplyTime, locale),
  };
}
