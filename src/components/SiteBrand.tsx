'use client';

import Link from 'next/link';
import SiteLogo from './SiteLogo';
import { ActionFeedback } from './ui/action-feedback';

export default function SiteBrand() {
  return (
    <ActionFeedback>
      <Link href="/" className="site-brand" aria-label="ML Teaching – Startseite">
        <SiteLogo className="brand-mark" />
        <span>ML Teaching</span>
      </Link>
    </ActionFeedback>
  );
}
