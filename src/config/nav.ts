import type { I18nKey } from '../i18n/utils';

export type NavItem = { key: I18nKey; href: string };

/** Primary navigation (desktop bar, mobile menu, footer "Studio" column). */
export const mainNav: NavItem[] = [
  { key: 'nav.work', href: '/work' },
  { key: 'nav.services', href: '/services' },
  { key: 'nav.studio', href: '/studio' },
  { key: 'nav.contact', href: '/contact' },
];

/** Where every "Start a project" button points. */
export const ctaHref = '/contact#start';

/** True when `current` (locale-stripped) is `href` or inside it. */
export function isActive(current: string, href: string): boolean {
  return current === href || current.startsWith(`${href}/`);
}
