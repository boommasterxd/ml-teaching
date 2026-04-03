/**
 * loadWithRetry.test.ts
 *
 * Unit tests for the loadWithRetry utility. Covers first-attempt success,
 * retry after failure, max-attempt exhaustion, AbortSignal cancellation,
 * and exponential backoff timing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadWithRetry } from '../hooks/useModelLoader';

describe('loadWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('löst beim ersten Versuch direkt auf', async () => {
    const fn = vi.fn().mockResolvedValue('Ergebnis');
    const controller = new AbortController();

    const result = await loadWithRetry(fn, 3, 1000, controller.signal);

    expect(result).toBe('Ergebnis');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('wiederholt nach Fehler und löst beim zweiten Versuch auf', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Netzwerkfehler'))
      .mockResolvedValueOnce('Ergebnis');
    const controller = new AbortController();

    const promise = loadWithRetry(fn, 3, 100, controller.signal);
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe('Ergebnis');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('wirft nach Ausschöpfen aller Versuche', async () => {
    const error = new Error('Dauerhafter Fehler');
    const fn = vi.fn().mockRejectedValue(error);
    const controller = new AbortController();

    const promise = loadWithRetry(fn, 3, 100, controller.signal);
    // Rejection-Handler vor Timer-Advance anhängen, damit keine "unhandled rejection" entsteht
    const assertion = expect(promise).rejects.toThrow('Dauerhafter Fehler');
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('bricht sofort ab wenn Signal bereits abgebrochen ist', async () => {
    const controller = new AbortController();
    controller.abort(new DOMException('Abgebrochen', 'AbortError'));

    const fn = vi.fn().mockResolvedValue('Ergebnis');

    await expect(loadWithRetry(fn, 3, 1000, controller.signal)).rejects.toThrow();
    expect(fn).not.toHaveBeenCalled();
  });

  it('bricht während der Retry-Verzögerung ab', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Netzwerkfehler'));
    const controller = new AbortController();

    const promise = loadWithRetry(fn, 3, 1000, controller.signal);
    // Rejection-Handler vor Abort und Timer-Advance anhängen
    const assertion = expect(promise).rejects.toThrow();

    // Signal abbrennen während der Wartezeit nach dem ersten Fehler
    controller.abort(new DOMException('Abgebrochen', 'AbortError'));
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('verdoppelt die Wartezeit mit jedem Versuch (exponentielles Backoff)', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fehler 1'))
      .mockRejectedValueOnce(new Error('Fehler 2'))
      .mockResolvedValueOnce('Ergebnis');
    const controller = new AbortController();
    const baseDelay = 1000;

    const promise = loadWithRetry(fn, 3, baseDelay, controller.signal);

    // Nach erstem Fehler: Wartezeit = 1000ms (baseDelay * 2^0)
    await vi.advanceTimersByTimeAsync(baseDelay - 1);
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);

    // Nach zweitem Fehler: Wartezeit = 2000ms (baseDelay * 2^1)
    await vi.advanceTimersByTimeAsync(baseDelay * 2 - 1);
    expect(fn).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result).toBe('Ergebnis');
  });
});
