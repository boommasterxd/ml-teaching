/**
 * usePageTitle.ts
 *
 * Custom React hook that updates the browser tab title for each page.
 * Appends a shared base title suffix to keep branding consistent across all routes.
 */
import { useEffect } from 'react';

const BASE_TITLE = 'KI Bilderkennung für Schüler';

/**
 * Sets `document.title` to `"{title} – {BASE_TITLE}"` whenever `title` changes.
 *
 * @param title - The page-specific part of the document title.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} – ${BASE_TITLE}`;
  }, [title]);
}
