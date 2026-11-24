import { headerLegalLinks, type LegalPage } from '@/content/site-navigation';
import Link from './IntentLink';
import { legalPageIcons } from './site-navigation-icons';
import { DropdownMenuContent, DropdownMenuGroup, DropdownMenuLinkItem } from './ui/dropdown-menu';

export default function LegalMobileMenu({ selectedValue }: { selectedValue: LegalPage }) {
  return (
    <DropdownMenuContent align="end" selectedValue={selectedValue} data-legal-mobile-menu="">
      <DropdownMenuGroup>
        {headerLegalLinks.map(({ id, href, label }) => {
          const Icon = legalPageIcons[id];
          return (
            <DropdownMenuLinkItem
              key={id}
              highlightValue={id}
              className="legal-page-link min-h-11"
              render={
                <Link
                  href={href}
                  aria-current={selectedValue === id ? 'page' : undefined}
                  navigationIcon={{ content: <Icon aria-hidden="true" />, position: 'start' }}
                />
              }
            >
              {label}
            </DropdownMenuLinkItem>
          );
        })}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
