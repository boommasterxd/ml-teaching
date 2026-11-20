import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AnimateIcon, useAnimateIconContext } from '@animate-ui/react/icons';
import { ReducedMotionContext } from '@animate-ui/react/utils/motion';
import { Brain } from '@/components/animated-icon-fallbacks';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

function TriggerState() {
  const { active } = useAnimateIconContext();
  return <output aria-label="Icon animation state">{active ? 'active' : 'rest'}</output>;
}

describe('project glyphs through the public Animate UI icon core', () => {
  it('responds to whole-control hover through the core and returns to its rest drawing', async () => {
    const { container } = render(
      <AnimateIcon animateOnHover className="contents">
        <button>
          <Brain aria-hidden="true" />
          Choose example
        </button>
        <TriggerState />
      </AnimateIcon>,
    );
    const group = container.querySelector('svg g') as SVGGElement;
    const rest = group.style.transform;
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Choose example' }), {
      pointerType: 'mouse',
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Icon animation state').textContent).toBe('active'),
    );
    await waitFor(() => expect(group.style.transform).not.toBe(rest));
    fireEvent.pointerLeave(screen.getByRole('button', { name: 'Choose example' }), {
      pointerType: 'mouse',
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Icon animation state').textContent).toBe('rest'),
    );
    await waitFor(() => expect(group.style.transform).toBe(rest));
  });

  it('keeps the original glyph at rest when reduced motion suppresses the same trigger', async () => {
    const { container } = render(
      <ReducedMotionContext value="always">
        <AnimateIcon animateOnHover className="contents">
          <button>
            <Brain aria-hidden="true" />
            Choose example
          </button>
          <TriggerState />
        </AnimateIcon>
      </ReducedMotionContext>,
    );
    const group = container.querySelector('svg g') as SVGGElement;
    const rest = group.style.transform;
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Choose example' }), {
      pointerType: 'mouse',
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Icon animation state').textContent).toBe('rest'),
    );
    expect(group.style.transform).toBe(rest);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });
});
