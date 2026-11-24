import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import PredictionPointCloud from '@/components/PredictionPointCloud';
import { ML } from '@/constants';
import { installThemeHost, restoreThemeHost } from '../helpers/theme-host';
import { makeClasses } from '../helpers/training-data';

beforeEach(() => {
  installThemeHost();
});
afterEach(() => {
  cleanup();
  restoreThemeHost();
});

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

it('shows the selected classes together and keeps the camera point when none are selected', async () => {
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
    <PredictionPointCloud
      area={createRef()}
      classes={classes}
      points={points}
      position={{ x: 0, y: 0 }}
    />,
  );
  const paths = () =>
    Array.from(
      container.querySelectorAll('[data-slot="prediction-training-points"] path'),
      (path) => path.getAttribute('d'),
    );
  const all = paths();
  expect(all).toHaveLength(ML.MAX_CLASSES);
  const camera = container.querySelector('[data-slot="prediction-live-point"]');
  expect(camera).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Klassenfilter: Alle Klassen' }));
  const filters = within(await screen.findByRole('menu', { name: 'Klassenfilter' }));
  const allClasses = filters.getByRole('menuitemcheckbox', { name: 'Alle Klassen' });
  const choice = filters.getByRole('menuitemcheckbox', { name: 'Klasse 15' });
  const other = filters.getByRole('menuitemcheckbox', { name: 'Klasse 1' });
  fireEvent.click(allClasses);
  expect(paths()).toEqual([]);
  expect(container.querySelector('[data-slot="prediction-live-point"]')).toBe(camera);
  fireEvent.click(choice);
  expect(paths()).toEqual([all.at(-1)]);
  fireEvent.click(other);
  expect(paths()).toEqual([all[0], all.at(-1)]);
  expect(allClasses.getAttribute('aria-checked')).toBe('mixed');
  fireEvent.click(choice);
  expect(paths()).toEqual([all[0]]);
  fireEvent.click(allClasses);
  expect(paths()).toEqual(all);
});
