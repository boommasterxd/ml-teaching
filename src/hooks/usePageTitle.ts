/**
 * Hook that sets the document title with a consistent base suffix.
 */
import { useEffect } from 'react';

const BASE_TITLE = 'KI Bilderkennung für Schüler';

/** Updates `document.title` to "{title} – {BASE_TITLE}" on mount and when `title` changes. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} – ${BASE_TITLE}`;
  }, [title]);
}
