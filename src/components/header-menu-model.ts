import { learningPaths } from '@/lib/learning-paths';
import {
  headerLearningGroups,
  headerLegalLinks,
  type HeaderNavGroup,
  type HeaderNavLink,
} from '@/content/site-navigation';

export const home: HeaderNavLink = { id: 'home', label: 'Startseite', href: '/' };
const hub: HeaderNavLink = { id: 'hub', label: 'Lernlabor-Übersicht', href: learningPaths.hub };
const legalGroup: HeaderNavGroup = { label: 'Rechtliches', links: headerLegalLinks };
const desktopMenus = [
  { label: 'Lernlabor', groups: [{ label: '', links: [hub] }, ...headerLearningGroups] },
  { label: 'Rechtliches', groups: [legalGroup] },
];
const mobileMenus = [
  {
    label: 'Menü',
    groups: [{ label: '', links: [home, hub] }, ...headerLearningGroups, legalGroup],
  },
];

export interface HeaderMenuOpening {
  label: string;
  reason: 'hover' | 'press' | 'first';
}

export function headerMenus(mobile?: boolean) {
  return mobile ? mobileMenus : desktopMenus;
}

export function containsCurrentPage(groups: readonly HeaderNavGroup[], pathname: string) {
  return groups.some((group) => group.links.some((link) => link.href === pathname));
}

export function currentHeaderItem(pathname: string) {
  if (pathname === home.href) return home.href;
  return desktopMenus.find(({ groups }) => containsCurrentPage(groups, pathname))?.label;
}

export function findHeaderTrigger(root: Element, label: string) {
  return root.querySelector<HTMLButtonElement>(
    `button[data-header-control="${CSS.escape(label)}"]`,
  );
}
