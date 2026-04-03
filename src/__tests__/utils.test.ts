/**
 * utils.test.ts
 *
 * Unit tests for the `cn()` utility function from `src/lib/utils`.
 * Verifies class merging, Tailwind conflict resolution, and falsy value handling.
 */

import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn', () => {
  it('returns a single class name', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('joins multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts correctly (last class wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles conditional objects', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ foo: true, bar: true })).toBe('foo bar');
  });

  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });
});
