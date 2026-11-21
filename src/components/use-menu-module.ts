'use client';

import { useRef, useState } from 'react';

/** Keep preparation independent of activation and reuse each in-flight import. */
export function useMenuModule<T>(load: () => Promise<T>) {
  const [module, setModule] = useState<T>();
  const [failed, setFailed] = useState(false);
  const requested = useRef(false);

  function prepare() {
    if (requested.current) return;
    requested.current = true;
    setFailed(false);
    void load().then(
      (result) => setModule(() => result),
      () => {
        requested.current = false;
        setFailed(true);
      },
    );
  }

  return { module, failed, prepare };
}
