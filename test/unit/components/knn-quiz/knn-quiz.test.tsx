import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import KnnQuiz from '@/components/knn-quiz/KnnQuiz';
import {
  installBrowserHost,
  installSliderLayout,
  restoreBrowserHost,
} from '../../helpers/browser-host';

function rankedPoints() {
  const distance = (point: HTMLElement) => {
    const match = point.getAttribute('aria-label')?.match(/Abstand zur Raute: ([\d,]+) Einheiten/);
    if (!match) throw new Error('The point has no accessible distance.');
    return Number(match[1].replace(',', '.'));
  };
  return screen
    .getAllByRole<HTMLButtonElement>('button', { name: /^(Hund|Katze), Punkt / })
    .sort((left, right) => distance(left) - distance(right));
}

function classChoice(name: 'Hund' | 'Katze' | 'Gleichstand') {
  return screen.getByRole<HTMLButtonElement>('button', { name });
}

function plottedData() {
  return rankedPoints().map((point) => [
    point.getAttribute('aria-label'),
    point.style.left,
    point.style.top,
  ]);
}

function chooseNeighbors(count: number) {
  const points = rankedPoints().slice(0, count);
  for (const point of points) fireEvent.click(point);
  const dogs = points.filter((point) => point.getAttribute('aria-label')!.startsWith('Hund'));
  if (dogs.length === count / 2) return 'Gleichstand';
  return dogs.length > count / 2 ? 'Hund' : 'Katze';
}

beforeEach(() => {
  installBrowserHost();
  installSliderLayout();
  let seed = 17;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  });
});
afterEach(() => {
  cleanup();
  restoreBrowserHost();
});

describe('KNN neighbor exercise', () => {
  it('starts with K=3 and explains rejected distant points without counting them', async () => {
    render(<KnnQuiz />);
    expect(screen.getByText('K = 3 · 0 von 3 gefunden')).toBeTruthy();
    expect((await screen.findByRole('slider')).getAttribute('aria-valuenow')).toBe('3');
    expect(classChoice('Hund').disabled).toBe(true);
    expect(classChoice('Katze').disabled).toBe(true);
    const distant = rankedPoints().at(-1)!;
    const status = screen.getByRole('status');
    fireEvent.click(distant);
    expect(distant.getAttribute('aria-pressed')).toBe('false');
    expect(distant.getAttribute('aria-invalid')).toBe('true');
    expect(status.textContent).toMatch(/^Fehlversuch 1: Punkt \d+ gehört nicht/);
    expect((await screen.findByRole('tooltip')).textContent).toContain(
      'Wähle einen Punkt näher an der Raute.',
    );
    fireEvent.click(distant);
    expect(status.textContent).toMatch(/^Fehlversuch 2: Punkt \d+ gehört nicht/);
    fireEvent.scroll(document);
    expect(screen.getByRole('tooltip').textContent).toContain(
      'Wähle einen Punkt näher an der Raute.',
    );
    expect(distant.getAttribute('aria-invalid')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(distant.hasAttribute('aria-invalid')).toBe(false);
    fireEvent.click(distant);
    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toMatch(/^Fehlversuch 3: Punkt \d+ gehört nicht/);
    expect(screen.getByText('K = 3 · 0 von 3 gefunden')).toBeTruthy();
    fireEvent.click(rankedPoints()[0]);
    expect(screen.getByText('K = 3 · 1 von 3 gefunden')).toBeTruthy();
    expect(distant.hasAttribute('aria-invalid')).toBe(false);
  });

  it('exposes the plot symbols as entries in a named legend', () => {
    render(<KnnQuiz />);
    const legend = screen.getByRole('list', { name: 'Legende' });
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Hund', 'Katze', 'Neues Bild']);
  });

  it('allows deselection and unlocks class answers only for the complete nearest set', () => {
    render(<KnnQuiz />);
    const [first, second, third] = rankedPoints();
    fireEvent.click(first);
    fireEvent.click(first);
    expect(first.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('status').textContent).toBe('0 von 3 Nachbarn gefunden.');
    fireEvent.click(second);
    fireEvent.click(third);
    expect(classChoice('Hund').disabled).toBe(true);
    fireEvent.click(first);
    expect(classChoice('Hund').disabled).toBe(false);
    expect(classChoice('Katze').disabled).toBe(false);
    fireEvent.click(second);
    expect(classChoice('Hund').disabled).toBe(true);
    expect(screen.getByText('K = 3 · 2 von 3 gefunden')).toBeTruthy();
  });

  it('allows correction of a wrong class and confirms the winning vote before freezing answers', () => {
    render(<KnnQuiz />);
    const winner = chooseNeighbors(3);
    fireEvent.click(classChoice(winner === 'Hund' ? 'Katze' : 'Hund'));
    expect(screen.getByText('Zähle noch einmal.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('wie viele Stimmen');
    expect(classChoice(winner).disabled).toBe(false);
    fireEvent.click(classChoice(winner));
    expect(screen.getByText('Richtig zugeordnet!')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      `Richtig zugeordnet! 2 von 3 Nachbarn stimmen für ${winner}.`,
    );
    expect(screen.queryByText('Zähle noch einmal.')).toBeNull();
    expect(classChoice('Hund').disabled).toBe(true);
    expect(classChoice('Katze').disabled).toBe(true);
    fireEvent.click(rankedPoints()[0]);
    expect(screen.getByText('K = 3 · 3 von 3 gefunden')).toBeTruthy();
  });

  it('clears progress when K changes by keyboard and starts a fresh round with the chosen K', async () => {
    render(<KnnQuiz />);
    const inputImage = screen
      .getByRole('img', { name: /Generiertes Beispielbild/ })
      .getAttribute('src');
    const initialPoints = plottedData();
    fireEvent.click(classChoice(chooseNeighbors(3)));
    const slider = await screen.findByRole('slider');
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(screen.getByText('K = 1 · 0 von 1 gefunden')).toBeTruthy();
    expect(plottedData()).toEqual(initialPoints);
    expect(screen.getByRole('img', { name: /Generiertes Beispielbild/ }).getAttribute('src')).toBe(
      inputImage,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(classChoice('Hund').disabled).toBe(true);
    const singleNeighbor = chooseNeighbors(1);
    fireEvent.click(classChoice(singleNeighbor));
    expect(screen.getByRole('status').textContent).toBe(
      `Richtig zugeordnet! Der nächste Nachbar stimmt für ${singleNeighbor}.`,
    );
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(screen.getByText('K = 2 · 0 von 2 gefunden')).toBeTruthy();
    expect(screen.getByRole('img', { name: /Generiertes Beispielbild/ }).getAttribute('src')).toBe(
      inputImage,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(chooseNeighbors(2)).toBe('Gleichstand');
    fireEvent.click(classChoice('Gleichstand'));
    expect(screen.getByRole('status').textContent).toBe(
      'Gleichstand erkannt! Hund und Katze haben je 1 Stimme.',
    );
    for (let k = 3; k <= 10; k += 1) {
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(slider.getAttribute('aria-valuenow')).toBe(String(k));
    }
    expect(plottedData()).toEqual(initialPoints);
    const answer = chooseNeighbors(10);
    expect(classChoice(answer).disabled).toBe(false);
    fireEvent.click(classChoice(answer));
    expect(screen.getByRole('status').textContent).toMatch(
      /^(Richtig zugeordnet!|Gleichstand erkannt!)/,
    );
    const previous = plottedData();
    fireEvent.click(screen.getByRole('button', { name: 'Neue Runde' }));
    expect(screen.getByText('K = 10 · 0 von 10 gefunden')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(classChoice('Hund').disabled).toBe(true);
    expect(plottedData()).not.toEqual(previous);
    expect(rankedPoints().every((point) => point.getAttribute('aria-pressed') === 'false')).toBe(
      true,
    );
  });
});
