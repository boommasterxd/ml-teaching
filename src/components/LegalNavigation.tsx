import { headerLegalLinks, type LegalPage } from '@/content/site-navigation';
import AnimatedLink from './AnimatedLink';
import LegalMobileNavigation from './LegalMobileNavigation';
import LegalBackLink from './LegalBackLink';
import LegalDesktopNavigation from './LegalDesktopNavigation';
import { legalPageIcons } from './site-navigation-icons';
import { Card } from './ui/card';
import { Text } from './ui/typography';
import { EntryReveal } from './ui/entry-reveal';

function InitialLegalLinks({ page }: { page: LegalPage }) {
  return (
    <ul className="flex list-none flex-col gap-1">
      {headerLegalLinks.map(({ id, href, label }) => {
        const Icon = legalPageIcons[id];
        return (
          <li key={id}>
            <AnimatedLink
              href={href}
              variant="ghost"
              aria-current={page === id ? 'page' : undefined}
              className="legal-page-link"
              navigationIcon={{
                content: <Icon data-icon="inline-start" aria-hidden="true" />,
                position: 'start',
              }}
            >
              {label}
            </AnimatedLink>
          </li>
        );
      })}
    </ul>
  );
}

export default function LegalNavigation({ page }: { page: LegalPage }) {
  return (
    <EntryReveal kind="navigation" asChild>
      <aside className="legal-sidebar">
        <LegalBackLink />
        <LegalMobileNavigation selectedValue={page} />
        <div className="legal-navigation-group">
          <Text variant="muted">Informationen</Text>
          <Card as="nav" aria-label="Informationsseiten" className="legal-navigation">
            <LegalDesktopNavigation page={page}>
              <InitialLegalLinks page={page} />
            </LegalDesktopNavigation>
          </Card>
        </div>
      </aside>
    </EntryReveal>
  );
}
