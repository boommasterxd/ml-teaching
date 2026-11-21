import { afterEach, beforeEach, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import PredictionPointCloud from '@/components/PredictionPointCloud';
import { ML } from '@/constants';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';
import { makeClasses } from '../helpers/training-data';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

it('describes the shown projection on request and keeps the snapshot stable across frames', () => {
  const props = {
    area: createRef<HTMLDivElement>(),
    classes: makeClasses(2),
    points: [
      { classId: 'red', x: -1, y: 1 },
      { classId: 'red', x: 0, y: 0 },
      { classId: 'blue', x: 1, y: -1 },
      { classId: 'blue', x: 1, y: -1 },
    ],
  };
  const { rerender } = render(<PredictionPointCloud {...props} position={null} />);
  const trigger = screen.getByRole('button', { name: 'Diagramm beschreiben' });
  const heading = { name: 'Diagrammbeschreibung' };
  const details = () =>
    within(screen.getByRole('heading', heading).parentElement!).getByRole('list');
  const classShapes = screen.getByRole('list', { name: 'Legende' }).querySelectorAll('li path');
  expect(classShapes[1].getAttribute('d')).not.toBe(classShapes[2].getAttribute('d'));
  expect(screen.queryByRole('heading', heading)).toBeNull();
  fireEvent.click(trigger);
  expect(document.activeElement).toBe(screen.getByRole('heading', heading));
  expect(screen.getByText('Kamerabild: Noch kein Punkt im Diagramm.')).toBeTruthy();
  expect(details().textContent).toContain('Rot: 2 Trainingsbilder (1 oben links, 1 in der Mitte).');
  expect(details().textContent).toContain('Blau: 2 Trainingsbilder (2 unten rechts).');

  rerender(<PredictionPointCloud {...props} position={{ x: 0, y: 0 }} />);
  expect(screen.getByText('Kamerabild: Noch kein Punkt im Diagramm.')).toBeTruthy();
  fireEvent.click(trigger);
  expect(screen.getByText('Kamerabild: Im Ausschnitt, in der Mitte.')).toBeTruthy();
  expect(details().textContent).toContain('Nächstes Beispiel: am Kamerapunkt.');

  rerender(<PredictionPointCloud {...props} position={{ x: 5, y: 0 }} />);
  expect(screen.getByText('Kamerabild: Im Ausschnitt, in der Mitte.')).toBeTruthy();
  fireEvent.click(trigger);
  expect(
    screen.getByText('Kamerabild: Außerhalb des Ausschnitts, mittig rechts am Rand markiert.'),
  ).toBeTruthy();
  expect(details().textContent).toMatch(/Rot:.*85,5\s% der Diagrammbreite/);
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
