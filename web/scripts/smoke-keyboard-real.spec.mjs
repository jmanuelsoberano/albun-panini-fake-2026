import { expect, test } from '@playwright/test';

const origin = process.env.HOSTING_ORIGIN ?? 'http://127.0.0.1:5000';

async function activeElement(page) {
  return page.evaluate(() => {
    const element = document.activeElement;

    if (!element) {
      return {};
    }

    return {
      ariaLabel: element.getAttribute('aria-label') ?? '',
      className: element.getAttribute('class') ?? '',
      id: element.getAttribute('id') ?? '',
      placeholder: element.getAttribute('placeholder') ?? '',
      role: element.getAttribute('role') ?? '',
      tagName: element.tagName,
      text: element.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      type: element.getAttribute('type') ?? '',
    };
  });
}

async function tabUntil(page, predicate, label, maxTabs = 80) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press('Tab');
    const active = await activeElement(page);

    if (predicate(active)) {
      return active;
    }
  }

  throw new Error(`Could not focus ${label} within ${maxTabs} Tab presses.`);
}

test('collection route supports real keyboard navigation and dialogs', async ({ page }) => {
  await page.goto(`${origin}/coleccion?qa=keyboard-real`, { waitUntil: 'networkidle' });
  await expect(page.locator('.sticker-card')).toHaveCount(240);

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  await tabUntil(
    page,
    (active) => active.tagName === 'INPUT' && active.placeholder.includes('Pais, jugador'),
    'collection search input',
  );

  await tabUntil(page, (active) => active.role === 'tab' && active.text === 'Cromos', 'Cromos tab');

  await tabUntil(
    page,
    (active) => active.role === 'button' && active.className.includes('sticker-card'),
    'first sticker card',
  );

  await page.keyboard.press('Enter');
  const dialog = page.locator('app-sticker-detail-dialog [role="dialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('app-sticker-detail-dialog .close-btn')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          document.querySelector('app-sticker-detail-dialog')?.contains(document.activeElement),
        ),
      ),
    )
    .toBe(true);

  await page.keyboard.press('Shift+Tab');
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          document.querySelector('app-sticker-detail-dialog')?.contains(document.activeElement),
        ),
      ),
    )
    .toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
