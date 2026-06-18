import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const distDir = fileURLToPath(new URL('../dist/web/browser/', import.meta.url));
const globalChecks = [
  ['.skip-link[href="#main-content"]', 1],
  ['main#main-content[tabindex="-1"]', 1],
];
const routeChecks = [
  {
    path: '/inicio',
    checks: [
      ['.home-panel', 5],
      ['.primary-action', 1],
      ['.score-slab', 1],
    ],
  },
  {
    path: '/coleccion',
    checks: [
      ['.sticker-card', 240],
      ['.sticker-card[role="button"][tabindex="0"][aria-label]', 240],
      ['input', 1],
      ['select', 3],
      ['button[role="tab"]', 2],
    ],
  },
  {
    path: '/torneo',
    checks: [
      ['.tournament-summary article', 4],
      ['.tournament-actions a', 3],
    ],
  },
  {
    path: '/equipos',
    checks: [
      ['.country-card', 48],
      ['.country-roster-total', 48],
    ],
  },
  {
    path: '/sedes',
    checks: [['.stadium-card', 16]],
  },
  {
    path: '/sala',
    checks: [
      ['.room-panel', 1],
      ['.login-gate a', 1],
    ],
  },
  {
    path: '/retos',
    checks: [['.challenge-card', 4]],
  },
];

process.on('warning', (warning) => {
  if (warning.name === 'MODULE_TYPELESS_PACKAGE_JSON') {
    return;
  }

  console.warn(warning);
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function mainBundleUrl() {
  const files = await readdir(distDir);
  const mainBundle = files.find((file) => /^main-.*\.js$/.test(file));
  assert(mainBundle, 'Missing Angular main bundle. Run npm run build first.');
  return pathToFileURL(join(distDir, mainBundle)).href;
}

function installDomGlobals(dom) {
  const globals = {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    customElements: dom.window.customElements,
    Node: dom.window.Node,
    Event: dom.window.Event,
    KeyboardEvent: dom.window.KeyboardEvent,
    MouseEvent: dom.window.MouseEvent,
    localStorage: dom.window.localStorage,
    location: dom.window.location,
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
  };

  for (const [name, value] of Object.entries(globals)) {
    globalThis[name] = value;
  }

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: dom.window.navigator,
  });

  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
}

async function renderRoute(route, bundleUrl, indexHtml) {
  const dom = new JSDOM(indexHtml, {
    pretendToBeVisual: true,
    runScripts: 'outside-only',
    url: `http://localhost${route.path}`,
  });

  installDomGlobals(dom);
  await import(`${bundleUrl}?route=${encodeURIComponent(route.path)}&t=${Date.now()}`);
  await waitFor(() => dom.window.document.querySelector(route.checks[0][0]), route.path);
  return dom;
}

async function waitFor(predicate, label) {
  const started = Date.now();

  while (Date.now() - started < 3000) {
    if (predicate()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Timed out waiting for Angular render on ${label}.`);
}

function accessibleName(element) {
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel) {
    return ariaLabel;
  }

  const id = element.getAttribute('id');
  if (id) {
    const label = [...element.ownerDocument.querySelectorAll('label[for]')].find(
      (item) => item.getAttribute('for') === id,
    );
    const labelText = label?.textContent?.trim();
    if (labelText) {
      return labelText;
    }
  }

  const wrappingLabel = element.closest('label')?.textContent?.trim();
  if (wrappingLabel) {
    return wrappingLabel;
  }

  return element.textContent?.trim() ?? '';
}

function focusableElements(document) {
  return [
    ...document.querySelectorAll(
      [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(','),
    ),
  ].filter((element) => !element.closest('[aria-hidden="true"]'));
}

function verifyFocusableNames(document, routePath) {
  const focusables = focusableElements(document);
  assert(focusables.length > 0, `${routePath} has no focusable elements.`);

  const unnamed = focusables.filter((element) => accessibleName(element).length === 0);
  assert(
    unnamed.length === 0,
    `${routePath} has unnamed focusable elements: ${unnamed
      .map((element) => element.tagName.toLowerCase())
      .join(', ')}`,
  );
}

function verifyRoute(route, dom) {
  const { document } = dom.window;

  for (const [selector, expectedCount] of [...globalChecks, ...route.checks]) {
    const count = document.querySelectorAll(selector).length;
    assert(
      count === expectedCount,
      `${route.path} expected ${expectedCount} elements for "${selector}", found ${count}.`,
    );
  }

  verifyFocusableNames(document, route.path);
}

async function verifyKeyboardDetail(dom) {
  const { document, KeyboardEvent } = dom.window;
  const firstSticker = document.querySelector('.sticker-card');
  assert(firstSticker, '/coleccion has no sticker card to test keyboard detail.');

  firstSticker.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'Enter',
    }),
  );

  await waitFor(
    () => document.querySelector('app-sticker-detail-dialog [role="dialog"]'),
    '/coleccion detail dialog',
  );

  const dialog = document.querySelector('app-sticker-detail-dialog [role="dialog"]');
  assert(dialog, 'Pressing Enter on a sticker card did not open the detail dialog.');
  assert(
    dialog.getAttribute('aria-labelledby'),
    'Sticker detail dialog is missing aria-labelledby.',
  );
}

const indexHtml = await readFile(join(distDir, 'index.html'), 'utf8');
const bundleUrl = await mainBundleUrl();

for (const route of routeChecks) {
  const dom = await renderRoute(route, bundleUrl, indexHtml);
  verifyRoute(route, dom);

  if (route.path === '/coleccion') {
    await verifyKeyboardDetail(dom);
  }

  dom.window.close();
}

console.log('Angular focusable smoke passed.');
