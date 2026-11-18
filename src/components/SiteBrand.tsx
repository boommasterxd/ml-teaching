'use client';

import Link from './IntentLink';
import SiteLogo from './SiteLogo';
import { ActionFeedback } from './ui/action-feedback';

function scrollHome() {
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export default function SiteBrand() {
  return (
    <ActionFeedback>
      <Link
        href="/"
        className="site-brand"
        aria-label="ML Teaching – Startseite"
        onNavigate={(event) => {
          const { pathname, search, hash } = window.location;
          if (pathname !== '/' || search) return;
          event.preventDefault();
          if (!hash) {
            scrollHome();
            return;
          }
          // Cancel any smooth scroll after the browser processes the fragment change.
          window.addEventListener('hashchange', () => requestAnimationFrame(scrollHome), {
            once: true,
          });
          window.location.hash = '#';
        }}
      >
        <SiteLogo className="brand-mark" />
        <span>ML Teaching</span>
      </Link>
    </ActionFeedback>
  );
}
