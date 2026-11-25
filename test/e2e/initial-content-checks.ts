import { expect, type Locator } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';
import { INITIAL_QUIZ_ROUND } from '../../src/lib/recognition-quiz';

export async function expectReadable(content: Locator) {
  await content.scrollIntoViewIfNeeded();
  await expect(content).toBeVisible();
  await expect
    .poll(() =>
      content.evaluate((element) => {
        for (let node: Element | null = element; node; node = node.parentElement) {
          if (Number(getComputedStyle(node).opacity) === 0) return false;
        }
        return element.getClientRects().length > 0;
      }),
    )
    .toBe(true);
}

export async function expectReadableLink(link: Locator, href: string) {
  await expectReadable(link);
  await expect(link).toHaveAttribute('href', href);
}

async function expectHomeLearningAreas(main: Locator) {
  const learningAreas = main.getByRole('region', { name: 'Zwei Arten, wie KI lernt', exact: true });
  await expectReadable(learningAreas.getByRole('heading', { name: 'Zwei Arten, wie KI lernt' }));
  await expect(learningAreas).toHaveAttribute('id', 'lernbereiche');

  const images = learningAreas.getByRole('region', { name: 'Bilderkennung', exact: true });
  await expectReadable(images.getByRole('heading', { name: 'Bilderkennung', exact: true }));
  await expectReadable(images.getByRole('img', { name: 'Bilderkennung anhand von Bildmerkmalen' }));
  const practice = images.getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true });
  await expectReadableLink(practice, learningPaths.imagePractice);
  await expect(practice).toBeEnabled();

  const rewards = learningAreas.getByRole('region', {
    name: 'Lernen durch Belohnung',
    exact: true,
  });
  await expectReadable(
    rewards.getByRole('heading', { name: 'Lernen durch Belohnung', exact: true }),
  );
  await expectReadable(rewards.getByRole('img', { name: /^Ein Agent, zwei mögliche Ziele/ }));
  const pending = rewards.getByRole('button', { name: 'Noch nicht verfügbar', exact: true });
  await expectReadable(pending);
  await expect(pending).toBeDisabled();
  await expect(rewards.getByRole('link')).toHaveCount(0);
}

async function expectSectionText(main: Locator, name: string, text: RegExp) {
  const section = main.getByRole('region', { name, exact: true });
  await expectReadable(section.getByText(text));
  return section;
}

async function expectHomeContent(main: Locator) {
  await expectReadable(main.getByText(/Trainiere eine KI mit deinen Bildern/));
  await expectReadableLink(
    main.getByRole('link', { name: 'Lernlabor', exact: true }),
    learningPaths.hub,
  );
  await expectReadableLink(
    main.getByRole('link', { name: 'Mini-Experimente', exact: true }),
    '#lernbereiche',
  );
  await expectSectionText(
    main,
    'Was ist künstliche Intelligenz?',
    /können Computer zum Beispiel Bilder zuordnen/,
  );
  await expectSectionText(main, 'Warum Kinder KI kennenlernen sollten.', /Warum kommt die KI/);
  await expectHomeLearningAreas(main);
  for (const name of ['Was KI kann und wo sie Grenzen hat.', 'KI lernen, ohne Vorwissen.']) {
    const section = main.getByRole('region', { name, exact: true });
    await expectReadable(section.getByRole('heading', { name, exact: true }));
    await expectReadable(section.getByRole('heading', { level: 3 }).first());
    await expectReadable(section.getByRole('paragraph').first());
  }
  const action = main.getByRole('region', { name: 'Was möchtest du deiner KI beibringen?' });
  await expectReadableLink(action.getByRole('link', { name: 'Zum Lernlabor' }), learningPaths.hub);
}

async function expectLearningHub(main: Locator) {
  await expectReadable(main.getByText(/Trainiere eine KI mit deinen Bildern/));
  await expectReadableLink(
    main.getByRole('link', { name: 'Bilderkennung verstehen' }),
    learningPaths.images,
  );
  await expectReadableLink(
    main.getByRole('link', { name: 'Eigenes Bildmodell trainieren' }),
    learningPaths.imagePractice,
  );
  const pending = main.getByRole('button', { name: 'Noch nicht verfügbar' });
  await expectReadable(pending);
  await expect(pending).toBeDisabled();
  const prompts = await expectSectionText(
    main,
    'Zum Weiterforschen',
    /Fotografiere eine Tasse auf einem Heft/,
  );
  await expectReadable(prompts.getByText(/Eine Spielfigur braucht sieben Schritte/i));
}

async function expectImageContent(main: Locator) {
  await expectReadable(main.getByText(/Das neuronale Netz MobileNet findet Merkmale/));
  await expectReadableLink(
    main.getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true }),
    learningPaths.imagePractice,
  );
  const technique = await expectSectionText(main, 'MobileNet und KNN', /Du zeigst ein neues Bild/);
  await expectReadable(technique.getByRole('list', { name: 'Bausteine des Modells' }));
  await expectSectionText(
    main,
    'Vom Bild zur Zuordnung.',
    /Wähle Hund oder Katze\. Folge dem Bild/,
  );
  const steps = await expectSectionText(
    main,
    'So trainierst du dein Modell.',
    /Sammle Bilder, trainiere das Modell/,
  );
  for (const name of ['Bilder sammeln', 'Modell trainieren', 'Ergebnis testen']) {
    await expectReadable(steps.getByRole('heading', { name, exact: true }));
  }
  const tips = await expectSectionText(
    main,
    'Bessere Trainingsbilder',
    /Unterschiedliche Aufnahmen/,
  );
  await expectReadable(tips.getByRole('list', { name: 'Tipps für Trainingsbilder' }));
  const action = main.getByRole('region', { name: 'Trainiere deine eigenen Klassen.' });
  await expectReadableLink(
    action.getByRole('link', { name: 'Jetzt ausprobieren' }),
    learningPaths.imagePractice,
  );
}

async function expectImageExercises(main: Locator, phase: 'static' | 'hydrated') {
  const network = main.getByRole('list', { name: 'Vom Beispielbild zur Ausgabe' });
  for (const name of ['Beispielbild', 'MobileNet', 'KNN', 'Mehrheit gewinnt']) {
    await expectReadable(network.getByRole('heading', { name, exact: true }));
  }
  await expectReadable(main.getByRole('button', { name: 'Katzenbild zeigen' }));
  await expectReadable(main.getByRole('button', { name: 'Hundebild zeigen' }));
  const everyday = await expectSectionText(
    main,
    'Wo steckt Bilderkennung drin?',
    /Wähle die drei Beispiele/,
  );
  const choices = everyday.getByRole('button', { name: /^Auswählen: / });
  await expect(choices).toHaveCount(INITIAL_QUIZ_ROUND.length);
  for (const [index, example] of INITIAL_QUIZ_ROUND.entries()) {
    const choice = choices.nth(index);
    await expectReadable(choice);
    await expect(choice).toHaveAccessibleName(`Auswählen: ${example.title}`);
    await expect(choice).toHaveAccessibleDescription(example.description);
  }
  await expectReadable(everyday.getByText('0 von 3 gefunden', { exact: true }));
  const neighbors = await expectSectionText(
    main,
    'Welche Nachbarn zählen?',
    /Wähle die Punkte, die der Raute am nächsten sind/,
  );
  await expectReadable(neighbors.getByRole('heading', { name: 'Hund oder Katze?' }));
  if (phase === 'static') {
    await expectReadable(
      neighbors.getByRole('status').filter({ hasText: 'Die Übung wird geladen …' }),
    );
  } else {
    await expectReadable(neighbors.getByRole('slider'));
  }
}

const legalHeadings: Record<string, readonly (string | RegExp)[]> = {
  '/impressum': ['Adresse', 'Kontakt', 'Verbraucherstreitbeilegung'],
  '/datenschutz': [
    /^1\. Datenschutz auf einen Blick$/,
    /^2\. Hosting und Content Delivery Networks/,
    /^3\. Allgemeine Hinweise und Pflichtinformationen$/,
    /^4\. Datenerfassung auf dieser Website$/,
  ],
  '/barrierefreiheit': [
    'Unser Anspruch',
    'Umgesetzte Maßnahmen',
    'Bekannte Einschränkungen',
    'Feedback',
    'Stand',
  ],
};

async function expectLegalContent(main: Locator, path: string) {
  const article = main.getByRole('article');
  for (const name of legalHeadings[path]) {
    await expectReadable(article.getByRole('heading', { level: 2, name, exact: true }));
  }
  if (path === '/datenschutz') {
    for (const name of [
      'Kurz erklärt',
      'Vercel',
      'Hinweis zur verantwortlichen Stelle',
      'Einsatz von KI auf der Website',
    ]) {
      const heading = article.getByRole('heading', { name, exact: true });
      await expectReadable(heading);
      await expectReadable(heading.locator('..').getByRole('paragraph').first());
    }
  } else {
    for (const name of legalHeadings[path]) {
      const heading = article.getByRole('heading', { name, exact: true });
      await expectReadable(heading.locator('..').getByRole('paragraph').first());
    }
  }
}

export async function expectPublicMain(main: Locator, path: string, phase: 'static' | 'hydrated') {
  await expectReadable(main.getByRole('heading', { level: 1 }));
  switch (path) {
    case '/':
      await expectHomeContent(main);
      break;
    case learningPaths.hub:
      await expectLearningHub(main);
      break;
    case learningPaths.images:
      await expectImageContent(main);
      await expectImageExercises(main, phase);
      break;
    case learningPaths.qLearning:
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Q-Learning verstehen');
      await expectReadable(main.getByText('Die Einführung ist noch nicht verfügbar.'));
      await expectReadableLink(
        main.getByRole('link', { name: 'Zum Lernlabor' }),
        learningPaths.hub,
      );
      break;
    default:
      await expectLegalContent(main, path);
  }
}
