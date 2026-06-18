import { expect, test } from '@playwright/test';

const origin = process.env.HOSTING_ORIGIN ?? 'http://127.0.0.1:5000';
const mexicoText = /M.*xico/;

test('tournament routes expose groups, scoreboards, scorers, and bracket rounds', async ({
  page,
}) => {
  await page.goto(`${origin}/torneo/grupos?qa=tournament`, { waitUntil: 'networkidle' });
  await expect(page.locator('.group-board')).toHaveCount(12);
  await expect(page.locator('.standing-head').filter({ hasText: 'PJ' })).toHaveCount(12);
  await expect(page.locator('.standing-head').filter({ hasText: 'PTS' })).toHaveCount(12);
  await expect(page.locator('.group-board .match-card')).toHaveCount(72);
  await expect(page.locator('body')).toContainText(mexicoText);

  await page.goto(`${origin}/torneo/partidos?qa=tournament`, { waitUntil: 'networkidle' });
  await expect(page.locator('.match-card')).toHaveCount(104);
  await expect(page.getByRole('tab', { name: 'Ronda de 32' })).toBeVisible();
  await expect(page.locator('.scorers-panel li')).toHaveCount(8);
  await expect(page.locator('body')).toContainText('Lionel Messi');

  await page.goto(`${origin}/torneo/llaves?qa=tournament`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Ronda de 32', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Octavos', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cuartos', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Semifinales', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tercer lugar', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Final', exact: true })).toBeVisible();
  await expect(page.locator('.bracket-match')).toHaveCount(32);

  await page.goto(`${origin}/torneo/partidos/M01?qa=tournament`, { waitUntil: 'networkidle' });
  await expect(page.locator('.match-center')).toBeVisible();
  await expect(page.locator('.timeline li')).toHaveCount(2);
  await expect(page.locator('.match-center a[href="/torneo/equipos/T28"]').first()).toBeVisible();

  await page.goto(`${origin}/torneo/equipos/T28?qa=tournament`, { waitUntil: 'networkidle' });
  await expect(page.locator('.team-summary article')).toHaveCount(4);
  await expect(page.locator('body')).toContainText(mexicoText);
  await expect(page.locator('.album-link')).toBeVisible();

  await page.goto(`${origin}/coleccion?q=M%C3%A9xico&qa=tournament`, {
    waitUntil: 'networkidle',
  });
  await expect(page.locator('input[type="search"]')).toHaveValue(mexicoText);
  await expect(page.locator('.sticker-card')).toHaveCount(5);
});
