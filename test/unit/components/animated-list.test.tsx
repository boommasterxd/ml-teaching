import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

beforeEach(() => {
  installBrowserHost();
  // JSDOM cannot restore scroll after Motion measures the exiting row.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(restoreBrowserHost);

function RemovableClasses() {
  const [classes, setClasses] = useState(['Rot', 'Blau']);
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <>
      <h1 ref={heading} tabIndex={-1}>
        Klassen
      </h1>
      <AnimatedList>
        {classes.map((name) => (
          <AnimatedListItem key={name} emptyFocus={heading}>
            <button
              onClick={() => setClasses((current) => current.filter((item) => item !== name))}
            >
              {name} löschen
            </button>
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </>
  );
}

describe('removable class controls', () => {
  it('retires exiting controls immediately and moves focus to a neighbor or the empty heading', async () => {
    render(<RemovableClasses />);
    const first = screen.getByRole('button', { name: 'Rot löschen' });
    const last = screen.getByRole('button', { name: 'Blau löschen' });
    first.focus();
    fireEvent.click(first);
    expect(first.closest('[inert][aria-hidden="true"]')).not.toBeNull();
    expect(document.activeElement).toBe(last);
    fireEvent.click(last);
    expect(last.closest('[inert][aria-hidden="true"]')).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Klassen' }));
    await waitFor(() => {
      expect(first.isConnected).toBe(false);
      expect(last.isConnected).toBe(false);
    });
  });
});
