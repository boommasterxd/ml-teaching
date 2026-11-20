/**
 * loadWithRetry.test.ts
 *
 * Unit tests for the loadWithRetry utility. Covers first-attempt success,
 * retry after failure, max-attempt exhaustion, AbortSignal cancellation,
 * and exponential backoff timing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadWithRetry } from '@/hooks/useModelLoader';

describe('loadWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately on the first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const controller = new AbortController();

    const result = await loadWithRetry(
      fn,
      { maxAttempts: 3, baseDelayMs: 1000 },
      controller.signal,
    );

    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries after failure and resolves on the second attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('result');
    const controller = new AbortController();

    const promise = loadWithRetry(fn, { maxAttempts: 3, baseDelayMs: 100 }, controller.signal);
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after all attempts are exhausted', async () => {
    const error = new Error('persistent error');
    const fn = vi.fn().mockRejectedValue(error);
    const controller = new AbortController();

    const promise = loadWithRetry(fn, { maxAttempts: 3, baseDelayMs: 100 }, controller.signal);
    // Attach rejection handler before advancing timers to avoid unhandled rejection warnings.
    const assertion = expect(promise).rejects.toThrow('persistent error');
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new DOMException('aborted', 'AbortError'));

    const fn = vi.fn().mockResolvedValue('result');

    await expect(
      loadWithRetry(fn, { maxAttempts: 3, baseDelayMs: 1000 }, controller.signal),
    ).rejects.toThrow();
    expect(fn).not.toHaveBeenCalled();
  });

  it('aborts during the retry delay', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network error'));
    const controller = new AbortController();

    const promise = loadWithRetry(fn, { maxAttempts: 3, baseDelayMs: 1000 }, controller.signal);
    // Attach rejection handler before aborting and advancing timers to avoid unhandled rejection warnings.
    const assertion = expect(promise).rejects.toThrow();

    // Abort the signal while waiting after the first failure.
    controller.abort(new DOMException('aborted', 'AbortError'));
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('doubles the wait time with each attempt (exponential backoff)', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('error 1'))
      .mockRejectedValueOnce(new Error('error 2'))
      .mockResolvedValueOnce('result');
    const controller = new AbortController();
    const baseDelay = 1000;

    const promise = loadWithRetry(
      fn,
      { maxAttempts: 3, baseDelayMs: baseDelay },
      controller.signal,
    );

    // After first failure: delay = 1000ms (baseDelay * 2^0)
    await vi.advanceTimersByTimeAsync(baseDelay - 1);
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);

    // After second failure: delay = 2000ms (baseDelay * 2^1)
    await vi.advanceTimersByTimeAsync(baseDelay * 2 - 1);
    expect(fn).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result).toBe('result');
  });
});
