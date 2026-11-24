import { expect, type Locator, type Page, type Route } from '@playwright/test';
import { expectAccessible, settleEntryAnimations } from './browser-checks';

export async function expectAlignedTrainingCards(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  const cards = page.locator('[aria-labelledby="training-images"] [data-slot="card"]');
  await expect(cards).toHaveCount(2);
  await expect
    .poll(() =>
      cards.evaluateAll((nodes) => {
        const [first, second] = nodes.map((node) => node.getBoundingClientRect());
        return Math.abs(first.bottom - second.bottom) + Math.abs(first.top - second.top);
      }),
    )
    .toBeLessThan(1);
}

export async function captureSetupDialog(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  const workspaceLayout = () =>
    page.locator('.training-workspace').evaluate((workspace) => ({
      height: Math.round(workspace.getBoundingClientRect().height),
      scroll: window.scrollY,
      visiblePanels: [...workspace.querySelectorAll('.training-panels [data-entry-admission]')]
        .filter((panel) => {
          const { top, bottom } = panel.getBoundingClientRect();
          return top < innerHeight && bottom > 0;
        })
        .map((panel) => ({
          admission: panel.getAttribute('data-entry-admission'),
          top: Math.round(panel.getBoundingClientRect().top),
        })),
    }));
  const initialLayout = await workspaceLayout();
  const original = await dialog.evaluateHandle((content) => ({
    content,
    overlay: content.closest('[data-slot="dialog-overlay"]'),
  }));
  async function expectStableWorkspace() {
    expect(await workspaceLayout()).toEqual(initialLayout);
  }
  async function expectSameDialog() {
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expectStableWorkspace();
    const retainsFocus = () =>
      original.evaluate(({ content, overlay }) =>
        Boolean(
          overlay?.isConnected &&
          overlay.contains(content) &&
          content.contains(document.activeElement),
        ),
      );
    await expect.poll(retainsFocus).toBe(true);
    for (const key of ['Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      expect(await retainsFocus()).toBe(true);
    }
  }
  return { expectSameDialog, expectStableWorkspace };
}

export async function prepareModelConsent(page: Page, remember = false) {
  const dialog = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(dialog).toBeVisible();
  const required = dialog.getByRole('checkbox', { name: /^Ich stimme zu/ });
  await expect(required).toHaveCount(2);
  for (const checkbox of await required.all()) {
    await checkbox.focus();
    await page.keyboard.press('Space');
  }
  if (remember)
    await dialog
      .getByRole('checkbox', { name: 'Für 30 Minuten in diesem Tab merken' })
      .press('Space');
  return dialog.getByRole('button', { name: 'Zustimmen', exact: true });
}

export async function grantModelConsent(page: Page, remember = false) {
  await (await prepareModelConsent(page, remember)).click();
}

type ConsentRequestState = { submitted: boolean; earlyAttempts: number };

export async function observeModelConsentRequests(page: Page, modelDirectory: string) {
  await page.addInitScript((directory) => {
    const state: ConsentRequestState = { submitted: false, earlyAttempts: 0 };
    Object.assign(window, { modelConsentRequests: state });
    const fetchRequest = window.fetch.bind(window);
    window.fetch = (resource, options) => {
      const url = resource instanceof Request ? resource.url : String(resource);
      if (url.startsWith(directory) && !state.submitted) {
        state.earlyAttempts += 1;
        return Promise.reject(new Error('Model request before consent submission'));
      }
      return fetchRequest(resource, options);
    };
  }, modelDirectory);
  async function state() {
    return page.evaluate(
      () =>
        (window as unknown as { modelConsentRequests: ConsentRequestState }).modelConsentRequests,
    );
  }
  async function submit(button: Locator) {
    await button.evaluate((element) => {
      element.addEventListener(
        'click',
        (event) => {
          if (event.isTrusted && element instanceof HTMLButtonElement && !element.disabled) {
            (
              window as unknown as { modelConsentRequests: ConsentRequestState }
            ).modelConsentRequests.submitted = true;
          }
        },
        { capture: true, once: true },
      );
    });
    await button.click();
  }
  return { state, submit };
}

export async function expectLoadingWithdrawalFocus(page: Page, dialog: Locator) {
  const action = await dialog.getByRole('button', { name: /widerrufen/ }).elementHandle();
  for (const reducedMotion of ['reduce', 'no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion });
    await settleEntryAnimations(page);
    expect(await action.evaluate((node) => node === document.activeElement)).toBe(true);
  }
  expect(
    await action.evaluate((button) => {
      const { outlineWidth, outlineOffset } = getComputedStyle(button);
      const outset = parseFloat(outlineWidth) + parseFloat(outlineOffset);
      const control = button.getBoundingClientRect();
      if (!button.matches(':focus-visible') || parseFloat(outlineWidth) === 0) return false;
      for (let ancestor = button.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const clip = getComputedStyle(ancestor);
        if (clip.overflow !== 'clip') continue;
        const bounds = ancestor.getBoundingClientRect();
        const clearance = Math.min(
          control.left - bounds.left,
          bounds.right - control.right,
          control.top - bounds.top,
          bounds.bottom - control.bottom,
        );
        if (clearance + (parseFloat(clip.overflowClipMargin) || 0) < outset) return false;
      }
      return true;
    }),
    'the entire keyboard focus outline fits inside the dialog step',
  ).toBe(true);
}

export function trainingSettingsTrigger(page: Page) {
  return page.getByRole('contentinfo').getByRole('button', {
    name: 'Einstellungen zum Bildtraining',
    exact: true,
  });
}

export async function confirmTrainingWithdrawal(page: Page) {
  const loading = page.getByRole('dialog', { name: /Lade KI-Modelle/ });
  const settings = page.getByRole('alertdialog', { name: 'Einstellungen zum Bildtraining' });
  const settingUp = await loading.isVisible();
  if (!settingUp) {
    await trainingSettingsTrigger(page).press('Enter');
    await expect(settings).toBeVisible();
    await expectAccessible(page);
  }
  const withdrawal = (settingUp ? loading : settings).getByRole('button', {
    name: 'Einwilligung widerrufen',
    exact: true,
  });
  await withdrawal.focus();
  await page.keyboard.press('Enter');
  const confirmation = page.getByRole('dialog', { name: 'Einwilligung widerrufen', exact: true });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.locator('[data-slot="alert-dialog-content"]')).toHaveCount(0);
  await expect
    .poll(() => confirmation.evaluate((dialog) => dialog.contains(document.activeElement)))
    .toBe(true);
  await expectAccessible(page);
  return confirmation;
}

export async function withdrawTrainingConsent(page: Page, afterWithdrawal?: () => Promise<void>) {
  await page.evaluate(() => {
    document.documentElement.dataset.withdrawalProbe = 'current-document';
  });
  const confirmation = await confirmTrainingWithdrawal(page);
  await afterWithdrawal?.();
  await confirmation
    .getByRole('button', { name: 'Training verlassen', exact: true })
    .press('Enter');
  await expect(confirmation).toBeHidden();
  await expect(page).toHaveURL('/');
  await expect(page.locator('html')).toHaveAttribute('data-withdrawal-probe', 'current-document');

  await page
    .getByRole('link', { name: 'Eigenes Bildmodell trainieren', exact: true })
    .press('Enter');
  const consent = page.getByRole('dialog', { name: 'Einwilligung zur Datenverarbeitung' });
  await expect(consent).toBeVisible();
  await expect(page).toHaveURL('/');
  const choices = consent.getByRole('checkbox');
  await expect(choices).toHaveCount(3);
  for (const choice of await choices.all()) await expect(choice).not.toBeChecked();
  await expect(consent.getByRole('button', { name: 'Zustimmen', exact: true })).toBeDisabled();
}

export async function withdrawWithActiveCamera(page: Page) {
  const tracks = await page.evaluateHandle(() => {
    const cameraTracks = new Set(
      [...document.querySelectorAll('video')].flatMap(({ srcObject }) =>
        srcObject instanceof MediaStream ? srcObject.getTracks() : [],
      ),
    );
    if (!cameraTracks.size || [...cameraTracks].some((track) => track.readyState !== 'live'))
      throw new Error('The training workspace has no live camera tracks.');
    return [...cameraTracks];
  });
  try {
    await withdrawTrainingConsent(page, async () => {
      expect(
        await tracks.evaluate((all) => all.every((track) => track.readyState === 'ended')),
      ).toBe(true);
      await expect(page.locator('video')).toHaveCount(0);
    });
  } finally {
    await tracks.dispose();
  }
}

export async function expectEmptyTrainingAfterConsent(page: Page) {
  await grantModelConsent(page);
  await page.getByRole('button', { name: 'Ohne Kamera fortfahren' }).click();
  await expect(page.getByText('0 / 10 Bilder', { exact: true })).toHaveCount(2);
  const steps = page.getByRole('navigation', { name: 'Trainingsablauf' });
  for (const name of ['Training', 'Vorhersage']) {
    await expect(steps.getByRole('button', { name, exact: true })).toBeDisabled();
  }
}

export async function expectHeaderLayout(page: Page) {
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
  const brand = navigation.getByRole('link', { name: 'ML Teaching – Startseite', exact: true });
  const start = navigation.getByRole('link', { name: 'Startseite', exact: true });
  const legal = navigation.getByRole('button', { name: 'Rechtliches', exact: true });
  const theme = navigation.getByRole('switch', { name: 'Dunkle Darstellung' });
  // Hydration replaces the static desktop menu with the interactive controls.
  await expect
    .poll(async () => {
      const [brandBox, startBox, legalBox, themeBox] = await Promise.all(
        [brand, start, legal, theme].map((control) => control.boundingBox()),
      );
      if (!brandBox || !startBox || !legalBox || !themeBox) return null;
      return {
        brandBeforeStart: brandBox.x + brandBox.width < startBox.x,
        legalBeforeTheme: legalBox.x + legalBox.width < themeBox.x,
      };
    })
    .toEqual({ brandBeforeStart: true, legalBeforeTheme: true });
}

export async function expectThemeControlAlignment(page: Page) {
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
  await expect
    .poll(() =>
      navigation.evaluate((header) => {
        const track = header.querySelector('[data-theme-switch]');
        const thumb = track?.querySelector('[data-slot="switch-thumb"]');
        const menu = header.querySelector('button[aria-label="Darstellung einstellen"]');
        const visibleIcon = (control?: Element | null) =>
          [...(control?.querySelectorAll('svg') ?? [])].find(
            (icon) => icon.getBoundingClientRect().height > 0,
          );
        const parts = [header, track, thumb, visibleIcon(thumb), menu, visibleIcon(menu)];
        const boxes = parts.map((part) => part?.getBoundingClientRect());
        if (boxes.some((box) => !box?.height)) return null;
        const centers = boxes.map((box) => box!.y + box!.height / 2);
        return {
          aligned: Math.max(...centers) - Math.min(...centers) <= 0.5,
          fullTrackHeight: (boxes[1]?.height ?? 0) + 0.001 >= 24,
        };
      }),
    )
    .toEqual({ aligned: true, fullTrackHeight: true });
}

export async function settleLandingReveals(page: Page) {
  const position = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  for (const card of await page.locator('[data-scroll-reveal]').all()) {
    await card.scrollIntoViewIfNeeded();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await expect(card).toHaveCSS('opacity', '1');
  }
  await page.evaluate(({ x, y }) => scrollTo({ left: x, top: y, behavior: 'instant' }), position);
}

export async function openThemeMenu(page: Page) {
  const trigger = page.getByRole('button', { name: 'Darstellung einstellen', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'Darstellung einstellen' });
  await expect(menu).toBeVisible();
  return menu;
}

export async function expectThemeMenuTriggers(page: Page) {
  const trigger = page.getByRole('button', { name: 'Darstellung einstellen', exact: true });
  const menu = page.getByRole('menu', { name: 'Darstellung einstellen' });
  for (const activation of ['Space', 'ArrowDown', 'pointer']) {
    await trigger.focus();
    if (activation === 'pointer') await trigger.click();
    else await page.keyboard.press(activation);
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  }
}

export async function expectTrainingCompletion(page: Page) {
  const panel = page.getByRole('region', { name: 'Training', exact: true });
  const action = panel.getByRole('button');
  const height = await panel.evaluate((element) => element.clientHeight);
  await expect(action).toHaveAccessibleName('Modell trainieren');
  await action.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Training läuft' })).toBeVisible();
  await expect(action).toBeFocused();
  await expect(action).toHaveAccessibleName('Weiter zur Vorhersage');
  await expect(action).toBeFocused();
  expect(await panel.evaluate((element) => element.clientHeight)).toBe(height);

  const theme = page.getByRole('switch', { name: 'Dunkle Darstellung' });
  await theme.focus();
  await page.keyboard.press('Space');
  await expect(theme).toBeChecked();
  await expect(
    page.getByRole('status').filter({ hasText: 'Training abgeschlossen' }),
  ).toBeVisible();
  await expect(action).toBeEnabled();
  await expectAccessible(page);
}

export async function revealBottomTrainingButton(page: Page) {
  const next = page.getByRole('button', { name: 'Weiter zum Training' });
  const addClass = page.getByRole('button', { name: 'Neue Klasse hinzufügen' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await next
    .first()
    .evaluate((button) => button.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await expect(next.first()).toBeInViewport();
  await expect(addClass).toBeInViewport();
  await expect(next).toHaveCount(1);
  await addClass.focus();
  await page.keyboard.press('Tab');
  await expect(next.and(page.locator(':focus'))).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 844 });
  await addClass.scrollIntoViewIfNeeded();
  await expect(next).toHaveCount(2);
  await expect(next.first()).not.toBeInViewport();
  await expect(next.last()).toBeInViewport();
  return next.last();
}

export async function openDeferredTrainingStep(
  page: Page,
  trigger: Locator,
  heading: Locator,
  whileLoading?: () => Promise<void>,
) {
  const asset = '**/_next/static/chunks/*.js';
  const pending = Promise.withResolvers<void>();
  let loading = false;
  async function hold(route: Route) {
    loading = true;
    await pending.promise;
    await route.continue();
  }

  await page.route(asset, hold);
  try {
    await trigger.focus();
    await expect.poll(() => loading).toBe(true);
    await expect(heading).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('status').filter({ hasText: 'Ansicht wird geladen' }),
    ).toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(heading).toHaveCount(0);
    await whileLoading?.();
    pending.resolve();
    await expect(heading).toBeFocused();
  } finally {
    pending.resolve();
    await page.unroute(asset, hold);
  }
}

export async function expectKeyboardCapture(page: Page) {
  const capture = page.getByRole('button', { name: 'Aufnehmen', exact: true }).first();
  const stop = page.getByRole('button', { name: 'Aufnahme stoppen', exact: true });
  await capture.focus();
  await page.keyboard.press('Enter');
  await expect(stop).toBeFocused();
  await expect(page.getByText(/^[1-9] \/ 10 Bilder$/).first()).toBeVisible();
  await page.keyboard.press('Space');
  await expect(capture).toBeFocused();
  await expect(stop).toHaveCount(0);
}

export async function expectPreviewDeletion(
  page: Page,
  expectAccessible: (page: Page) => Promise<void>,
) {
  const gallery = page.getByRole('region', { name: /Trainingsbilder von Klasse 1:/ });
  await gallery.getByRole('button', { name: 'Bild 1 vergrößern', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Bild 1 aus Klasse 1' });
  await expectAccessible(page);
  await preview.getByRole('button', { name: 'Bild löschen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Name für Klasse 2: Klasse 2' })).toBeFocused();
  await expect(page.getByText('9 / 10 Bilder', { exact: true })).toHaveCount(1);
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(1);
}

export async function expectCancelledResetKeepsImages(page: Page) {
  const reset = page.getByRole('button', { name: /^Bilder der Klasse 1:/ });
  await reset.click();
  await expect(
    page.getByRole('alertdialog', { name: 'Bilder dieser Klasse löschen?' }),
  ).toBeVisible();
  // Keep the pointer away from links and buttons that scroll into view during keyboard use.
  await page.mouse.move(1, 1);
  await page.keyboard.press('Escape');
  await expect(reset).toBeFocused();
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest('[inert], [aria-hidden="true"], [data-closed]')),
    ),
  ).toBe(false);
  await page.getByRole('button', { name: 'Neue Klasse hinzufügen' }).press('Enter');
  const name = page.getByRole('textbox', { name: 'Name für Klasse 3: Klasse 3' });
  await expect(name).toBeFocused();
  await expect(name).toBeInViewport();
  await page.getByRole('button', { name: 'Klasse 3: Klasse 3 löschen', exact: true }).click();
  const remove = page.getByRole('alertdialog', { name: 'Klasse löschen?' });
  await page.mouse.move(1, 1);
  await remove.getByRole('button', { name: 'Löschen', exact: true }).press('Enter');
  await expect(page.getByRole('textbox')).toHaveCount(2);
  await expect(page.getByText('10 Bilder', { exact: true })).toHaveCount(2);
}
