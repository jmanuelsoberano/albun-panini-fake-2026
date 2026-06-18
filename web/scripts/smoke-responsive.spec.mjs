import { expect, test } from '@playwright/test';

const origin = process.env.HOSTING_ORIGIN ?? 'http://127.0.0.1:5000';
const routes = [
  '/inicio',
  '/coleccion',
  '/torneo',
  '/torneo/grupos',
  '/torneo/partidos',
  '/torneo/llaves',
  '/equipos',
  '/sedes',
  '/sala',
  '/retos',
];
const viewports = [
  { label: 'desktop', width: 1280, height: 900 },
  { label: 'mobile', width: 390, height: 844 },
];
const forbiddenPublicText = [
  'Modo local',
  'Modo Angular',
  'Firebase',
  'emulador',
  'config',
  'Invitado local',
  'Abrir sobre local',
  'Pegar 10 al azar',
  'web/public',
];

for (const viewport of viewports) {
  test.describe(`${viewport.label} responsive pass`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of routes) {
      test(`${route} has no document overflow`, async ({ page }) => {
        await page.goto(`${origin}${route}?qa=responsive`, { waitUntil: 'load' });
        await expect(page.locator('app-root')).toBeVisible();

        const result = await page.evaluate(() => ({
          bodyText: document.body.innerText,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          title: document.title,
        }));

        expect(result.scrollWidth, `${route} overflows at ${viewport.label}`).toBeLessThanOrEqual(
          result.clientWidth + 1,
        );
        expect(result.title).not.toContain('Angular');

        for (const forbidden of forbiddenPublicText) {
          expect(result.bodyText).not.toContain(forbidden);
        }
      });
    }
  });
}
