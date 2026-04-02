import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn', () => {
  it('gibt einen einzelnen Klassennamen zurück', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('verbindet mehrere Klassennamen', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('überschreibt Tailwind-Konflikte korrekt (spätere Klasse gewinnt)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('ignoriert falsy-Werte', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('verarbeitet bedingte Objekte', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ foo: true, bar: true })).toBe('foo bar');
  });

  it('gibt leeren String zurück wenn keine Argumente', () => {
    expect(cn()).toBe('');
  });
});
