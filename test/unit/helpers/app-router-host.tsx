import { type ReactNode } from 'react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { vi } from 'vitest';

export const testRouter = {
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: 'unit-route',
};

/** Supply the framework boundary while exercising the actual native Link implementation. */
export function AppRouterHost({ children }: { children?: ReactNode }) {
  return <AppRouterContext.Provider value={testRouter}>{children}</AppRouterContext.Provider>;
}
