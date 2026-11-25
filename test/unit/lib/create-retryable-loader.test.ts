import { expect, it, vi } from 'vitest';
import { createRetryableLoader } from '@/lib/create-retryable-loader';

it('shares a module request, then retries a failure and reuses the loaded module', async () => {
  const initial = Promise.withResolvers<{ default: string }>();
  const loadedModule = { default: 'module' };
  const load = vi.fn<() => Promise<typeof loadedModule>>();
  load.mockReturnValueOnce(initial.promise).mockResolvedValueOnce(loadedModule);
  const request = createRetryableLoader(load);

  expect(load).not.toHaveBeenCalled();
  const first = request();
  const concurrent = request();
  expect(load).toHaveBeenCalledTimes(1);
  const failure = new Error('Module unavailable');
  initial.reject(failure);
  await expect(first).rejects.toBe(failure);
  await expect(concurrent).rejects.toBe(failure);

  await expect(request()).resolves.toBe(loadedModule);
  await expect(request()).resolves.toBe(loadedModule);
  expect(load).toHaveBeenCalledTimes(2);
});

it('keeps separate module requests independent', async () => {
  const first = createRetryableLoader(() => Promise.resolve('training'));
  const second = createRetryableLoader(() => Promise.resolve('prediction'));

  await expect(Promise.all([first(), second()])).resolves.toEqual(['training', 'prediction']);
});
