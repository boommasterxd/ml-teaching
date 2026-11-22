import { afterEach, beforeEach, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import PredictionPointCloud from '@/components/PredictionPointCloud';
import { ML } from '@/constants';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';
import { makeClasses } from '../helpers/training-data';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

it('distinguishes classes by shape and marks a camera point beyond the plot edge', () => {
  const props = {
    area: createRef<HTMLDivElement>(),
    classes: makeClasses(2),
    points: [
      { classId: 'red', x: -1, y: 1 },
      { classId: 'red', x: 0, y: 0 },
      { classId: 'blue', x: 1, y: -1 },
    ],
  };
  const { container, rerender } = render(
    <PredictionPointCloud {...props} position={{ x: 0, y: 0 }} />,
  );
  const legend = within(screen.getByRole('list', { name: 'Legende' }));
  const [, red, blue] = legend.getAllByRole('listitem');
  expect(red.querySelector('path')?.getAttribute('d')).not.toBe(
    blue.querySelector('path')?.getAttribute('d'),
  );
  const edgeMarker = () => container.querySelector('[data-slot="prediction-live-point"] circle');
  expect(edgeMarker()).toBeNull();

  rerender(<PredictionPointCloud {...props} position={{ x: 5, y: 0 }} />);
  expect(edgeMarker()).not.toBeNull();
});

it('isolates a class in a full diagram and restores all points on a second activation', () => {
  const examples = makeClasses(ML.MIN_IMAGES_PER_CLASS);
  const classes = Array.from({ length: ML.MAX_CLASSES }, (_, index) => ({
    ...examples[index % examples.length],
    id: `class-${index + 1}`,
    name: `Klasse ${index + 1}`,
  }));
  const points = classes.flatMap(({ id, images }, index) =>
    images.map((_, imageIndex) => ({ classId: id, x: index, y: imageIndex })),
  );
  const { container } = render(
    <PredictionPointCloud area={createRef()} classes={classes} points={points} position={null} />,
  );
  const paths = () =>
    Array.from(
      container.querySelectorAll('[data-slot="prediction-training-points"] path'),
      (path) => path.getAttribute('d'),
    );
  const all = paths();
  expect(all).toHaveLength(ML.MAX_CLASSES);
  const legend = within(screen.getByRole('list', { name: 'Legende' }));
  const choice = legend.getByRole('button', { name: /^Klasse 15\b/, pressed: false });
  choice.focus();
  fireEvent.click(choice);
  expect(legend.getByRole('button', { name: /^Klasse 15\b/, pressed: true })).toBe(choice);
  expect(document.activeElement).toBe(choice);
  expect(paths()).toEqual([all.at(-1)]);
  fireEvent.click(choice);
  expect(legend.getByRole('button', { name: /^Klasse 15\b/, pressed: false })).toBe(choice);
  expect(paths()).toEqual(all);
});
