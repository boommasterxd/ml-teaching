import { useEffect } from 'react';

const BASE_TITLE = 'KI Bilderkennung für Schüler';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} – ${BASE_TITLE}`;
  }, [title]);
}
