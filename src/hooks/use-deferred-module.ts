'use client';

import { useCallback, useRef, useState } from 'react';

/** Keep preparation independent of activation and reuse each in-flight import. */
export function useDeferredModule<T>(load: () => Promise<T>, initialModule?: T) {
  const [module, setModule] = useState(() => initialModule);
  const [failed, setFailed] = useState(false);
  const requested = useRef(initialModule !== undefined);

  const prepare = useCallback(() => {
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
  }, [load]);

  return { module, failed, prepare };
}
