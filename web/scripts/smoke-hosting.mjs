import { access, readdir, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const origin = process.env.HOSTING_ORIGIN ?? 'http://127.0.0.1:5000';
const repoDir = new URL('../../', import.meta.url);
const distDir = new URL('../dist/web/browser/', import.meta.url);
const requiredRoutes = [
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
const forbiddenDistPaths = ['firebase-config.js', 'content/private-content.json', 'private-assets'];
const requiredGitIgnoreEntries = [
  'public/firebase-config.js',
  'web/public/firebase-config.js',
  'public/content/private-content.json',
  'public/private-assets/',
];

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fetchText(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(new URL(path, origin), { signal: controller.signal });
    const body = await response.text();
    return {
      body,
      contentType: response.headers.get('content-type') ?? '',
      ok: response.ok,
      status: response.status,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyDist() {
  const indexPath = new URL('index.html', distDir);
  assert(await exists(indexPath), 'Missing Angular build index.html. Run npm run build first.');

  const indexHtml = await readFile(indexPath, 'utf8');
  assert(
    indexHtml.includes('<app-root'),
    'Build index.html does not contain the Angular root component.',
  );

  for (const relativePath of forbiddenDistPaths) {
    const fullPath = new URL(relativePath, distDir);
    assert(
      !(await exists(fullPath)),
      `Private or local-only asset leaked into dist: ${relativePath}`,
    );
  }

  const files = await readdir(distDir);
  assert(
    files.some((file) => file.startsWith('main-') && file.endsWith('.js')),
    'Missing hashed Angular main bundle.',
  );

  const cleanupWorkerPath = new URL('service-worker.js', distDir);
  assert(await exists(cleanupWorkerPath), 'Missing cleanup service-worker.js in Angular dist.');

  const cleanupWorker = await readFile(cleanupWorkerPath, 'utf8');
  assert(
    cleanupWorker.includes('fan-global-2026-cleanup') && cleanupWorker.includes('unregister'),
    'Cleanup service worker is missing the unregister/cache cleanup marker.',
  );
}

async function verifyRepoGuards() {
  const firebaseConfig = JSON.parse(await readFile(new URL('firebase.json', repoDir), 'utf8'));
  assert(
    firebaseConfig.hosting?.public === 'web/dist/web/browser',
    'firebase.json hosting.public must point to web/dist/web/browser for the Angular cutover.',
  );

  const gitignore = await readFile(new URL('.gitignore', repoDir), 'utf8');
  for (const entry of requiredGitIgnoreEntries) {
    assert(
      gitignore.includes(entry),
      `.gitignore is missing required private/local guard: ${entry}`,
    );
  }
}

async function verifyHosting() {
  let entryHtml = '';

  for (const route of requiredRoutes) {
    const response = await fetchText(route);
    assert(
      response.ok,
      `${route} returned HTTP ${response.status}. Is Firebase Hosting Emulator running?`,
    );
    assert(response.contentType.includes('text/html'), `${route} did not return HTML.`);
    assert(response.body.includes('<app-root'), `${route} did not serve the Angular index.html.`);

    if (!entryHtml) {
      entryHtml = response.body;
    }
  }

  const scriptSources = [...entryHtml.matchAll(/<script\s+[^>]*src="([^"]+\.js)"/g)].map(
    (match) => match[1],
  );
  assert(scriptSources.length > 0, 'Hosted index.html does not reference an Angular JS bundle.');

  for (const source of scriptSources) {
    const bundleResponse = await fetchText(source);
    assert(bundleResponse.ok, `Hosted JS bundle ${source} returned HTTP ${bundleResponse.status}.`);
    assert(
      bundleResponse.contentType.includes('javascript'),
      `Hosted JS bundle ${source} was not served as JavaScript.`,
    );
    assert(
      !bundleResponse.body.includes('<app-root'),
      `Hosted JS bundle ${source} was rewritten to index.html.`,
    );
  }

  const configResponse = await fetchText('/firebase-config.js');
  assert(
    !configResponse.contentType.includes('javascript'),
    '/firebase-config.js is being served as JavaScript from the production build.',
  );

  const hostingConfigResponse = await fetchText('/__/firebase/init.json');
  assert(hostingConfigResponse.ok, '/__/firebase/init.json was not served by Hosting.');
  assert(
    hostingConfigResponse.contentType.includes('json'),
    '/__/firebase/init.json must be served as JSON.',
  );
  const hostingConfig = JSON.parse(hostingConfigResponse.body);
  for (const key of ['apiKey', 'appId', 'authDomain', 'projectId']) {
    assert(
      typeof hostingConfig[key] === 'string' && hostingConfig[key],
      `/__/firebase/init.json is missing ${key}.`,
    );
  }

  const serviceWorkerResponse = await fetchText('/service-worker.js');
  assert(serviceWorkerResponse.ok, '/service-worker.js was not served by Hosting.');
  assert(
    serviceWorkerResponse.contentType.includes('javascript'),
    '/service-worker.js must be served as JavaScript, not rewritten to index.html.',
  );
  assert(
    serviceWorkerResponse.body.includes('fan-global-2026-cleanup') &&
      serviceWorkerResponse.body.includes('unregister'),
    '/service-worker.js does not contain the cleanup worker expected for stale registrations.',
  );
}

try {
  await verifyRepoGuards();
  await verifyDist();
  await verifyHosting();
  console.log(`Angular Hosting smoke passed against ${origin}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
