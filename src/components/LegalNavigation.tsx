import LegalMobileNavigation from './LegalMobileNavigation';
import LegalBackLink from './LegalBackLink';
import LegalNavigationLinks, { type LegalPage } from './LegalNavigationLinks';
import { Card } from './ui/card';
import { Text } from './ui/typography';
import { EntryReveal } from './ui/entry-reveal';

export type { LegalPage } from './LegalNavigationLinks';

export default function LegalNavigation({ page }: { page: LegalPage }) {
  return (
    <EntryReveal kind="navigation" asChild>
      <aside className="legal-sidebar">
        <LegalBackLink />
        <LegalMobileNavigation selectedValue={page} />
        <div className="legal-navigation-group">
          <Text variant="muted">Informationen</Text>
          <Card as="nav" aria-label="Informationsseiten" className="legal-navigation p-1.5">
            <LegalNavigationLinks page={page} />
          </Card>
        </div>
      </aside>
    </EntryReveal>
  );
}
