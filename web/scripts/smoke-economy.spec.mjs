import { expect, test } from '@playwright/test';

const origin = process.env.HOSTING_ORIGIN ?? 'http://127.0.0.1:5000';

test('missions and pack opening communicate rewards and pack impact', async ({ page }) => {
  await page.goto(`${origin}/retos?qa=economy`, { waitUntil: 'networkidle' });
  await expect(page.locator('.challenge-card')).toHaveCount(4);
  await expect(page.getByText('Recompensa: 25 monedas')).toHaveCount(4);
  await expect(page.locator('.challenge-card a').filter({ hasText: 'Iniciar sesión' })).toHaveCount(
    4,
  );

  await page.goto(`${origin}/coleccion?qa=economy&devTools=1`, { waitUntil: 'networkidle' });
  await page.getByText('Herramientas QA').click();
  await page.getByRole('button', { name: 'Abrir sobre de prueba' }).click();

  await expect(page.locator('app-pack-dialog .dialog')).toBeVisible();
  await expect(page.locator('.pack-summary')).toContainText('nuevos');
  await expect(page.locator('.pack-summary')).toContainText('repetidos');
  await expect(page.locator('app-pack-dialog app-sticker-card')).toHaveCount(5);
});
