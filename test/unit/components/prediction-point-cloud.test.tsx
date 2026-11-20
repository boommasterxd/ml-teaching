import { afterEach, beforeEach, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import PredictionPointCloud from '@/components/PredictionPointCloud';
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
  expect(screen.queryByRole('heading', heading)).toBeNull();
  fireEvent.click(trigger);
  expect(document.activeElement).toBe(screen.getByRole('heading', heading));
  expect(screen.getByText('Kamerabild: Noch kein Punkt im Diagramm.')).toBeTruthy();
  expect(screen.getByRole('list').textContent).toContain(
    'Rot: 2 Trainingsbilder (1 oben links, 1 in der Mitte).',
  );
  expect(screen.getByRole('list').textContent).toContain(
    'Blau: 2 Trainingsbilder (2 unten rechts).',
  );

  rerender(<PredictionPointCloud {...props} position={{ x: 0, y: 0 }} />);
  expect(screen.getByText('Kamerabild: Noch kein Punkt im Diagramm.')).toBeTruthy();
  fireEvent.click(trigger);
  expect(screen.getByText('Kamerabild: Im Ausschnitt, in der Mitte.')).toBeTruthy();
  expect(screen.getByRole('list').textContent).toContain('Nächstes Beispiel: am Kamerapunkt.');

  rerender(<PredictionPointCloud {...props} position={{ x: 5, y: 0 }} />);
  expect(screen.getByText('Kamerabild: Im Ausschnitt, in der Mitte.')).toBeTruthy();
  fireEvent.click(trigger);
  expect(
    screen.getByText('Kamerabild: Außerhalb des Ausschnitts, mittig rechts am Rand markiert.'),
  ).toBeTruthy();
  expect(screen.getByRole('list').textContent).toMatch(/Rot:.*85,5\s% der Diagrammbreite/);
});
