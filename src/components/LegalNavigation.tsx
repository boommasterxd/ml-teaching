import AnimatedLink from './AnimatedLink';
import Link from './IntentLink';
import LegalMobileNavigation from './LegalMobileNavigation';
import { ArrowLeft } from './icons/arrow-left';
import { Gavel } from './icons/gavel';
import { LockKeyhole } from './icons/lock-keyhole';
import { Accessibility } from './icons/accessibility';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { Text } from './ui/typography';
import { EntryReveal } from './ui/entry-reveal';

const pages = [
  { id: 'imprint', href: '/impressum', title: 'Impressum', Icon: Gavel },
  { id: 'privacy', href: '/datenschutz', title: 'Datenschutz', Icon: LockKeyhole },
  {
    id: 'accessibility',
    href: '/barrierefreiheit',
    title: 'Barrierefreiheit',
    Icon: Accessibility,
  },
] as const;

export type LegalPage = (typeof pages)[number]['id'];

/** Static utility navigation keeps native links, intent preparation and shared icon feedback. */
export default function LegalNavigation({ page }: { page: LegalPage }) {
  return (
    <EntryReveal kind="navigation" asChild>
      <aside className="legal-sidebar">
        <AnimatedLink
          href="/"
          transitionTypes={['nav-back']}
          variant="ghost"
          size="sm"
          className="legal-back-link"
          aria-label="Zurück zur Startseite"
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Startseite
        </AnimatedLink>
        <LegalMobileNavigation>
          {pages.map(({ id, href, title, Icon }) => (
            <DropdownMenuItem key={id} asChild className="min-h-11">
              <Link href={href} aria-current={page === id ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                {title}
              </Link>
            </DropdownMenuItem>
          ))}
        </LegalMobileNavigation>
        <div className="legal-navigation-group">
          <Text variant="muted">Informationen</Text>
          <nav aria-label="Informationsseiten" className="legal-navigation">
            {pages.map(({ id, href, title, Icon }) => (
              <AnimatedLink
                key={id}
                href={href}
                variant={page === id ? 'secondary' : 'ghost'}
                aria-current={page === id ? 'page' : undefined}
                className="justify-start"
              >
                <Icon data-icon="inline-start" aria-hidden="true" />
                {title}
              </AnimatedLink>
            ))}
          </nav>
        </div>
      </aside>
    </EntryReveal>
  );
}
