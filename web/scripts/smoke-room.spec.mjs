import { expect, test } from '@playwright/test';

const origin = process.env.HOSTING_ORIGIN ?? 'http://127.0.0.1:5000';
const forbiddenPublicText = [
  'Modo local',
  'Firebase',
  'emulador',
  'config',
  'Invitado local',
  'Abrir sobre local',
];

test('private room route stays public-safe and asks for sign-in', async ({ page }) => {
  await page.goto(`${origin}/sala?qa=room`, { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: 'Cambia repetidos con tu grupo.' })).toBeVisible();
  await expect(page.locator('.room-score')).toContainText('repetidos');
  await expect(page.locator('.room-score')).toContainText('faltantes');
  await expect(page.locator('.login-gate')).toBeVisible();
  await expect(
    page.locator('.login-gate').getByRole('link', { name: 'Iniciar sesión' }),
  ).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  for (const forbidden of forbiddenPublicText) {
    expect(bodyText).not.toContain(forbidden);
  }
});
