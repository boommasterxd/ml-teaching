'use client';

import Link from './IntentLink';
import SiteLogo from './SiteLogo';
import { ActionFeedback } from './ui/action-feedback';

function scrollHome() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
}

export default function SiteBrand() {
  return (
    <ActionFeedback>
      <Link
        href="/"
        transitionTypes={['nav-back']}
        className="site-brand"
        aria-label="ML Teaching – Startseite"
        onNavigate={(event) => {
          const { pathname, search, hash } = window.location;
          if (pathname !== '/' || search) return;
          event.preventDefault();
          if (hash) window.history.pushState(null, '', '/');
          scrollHome();
        }}
      >
        <SiteLogo className="brand-mark" />
        <span>ML Teaching</span>
      </Link>
    </ActionFeedback>
  );
}
