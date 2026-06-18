import { expect, test } from '@playwright/test';

const origin = process.env.HOSTING_ORIGIN ?? 'http://127.0.0.1:5000';
const firebaseInitConfig = {
  apiKey: 'test-api-key',
  appId: 'test-app-id',
  authDomain: 'test.firebaseapp.com',
  projectId: 'test-project',
};
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

test('public collection route is read-only and prompts sign-in for play actions', async ({
  page,
}) => {
  await page.route('**/__/firebase/init.json', async (route) => {
    await route.fulfill({
      body: JSON.stringify(firebaseInitConfig),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto(`${origin}/coleccion?qa=auth-gate`, { waitUntil: 'networkidle' });
  await expect(page.locator('.sticker-card')).toHaveCount(240);

  const bodyText = await page.locator('body').innerText();
  for (const forbidden of forbiddenPublicText) {
    expect(bodyText).not.toContain(forbidden);
  }

  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByText('Solo lectura')).toBeVisible();

  const playButton = page.locator('app-session-panel button').filter({ hasText: 'Abrir sobre' });
  await expect(playButton).toHaveCount(1);
  await playButton.click();

  await expect(page.locator('app-pack-dialog')).toHaveCount(0);
  await expect(page.locator('app-session-panel [role="dialog"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Inicia sesión para jugar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeEnabled();
});
