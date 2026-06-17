import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('../src/app/', import.meta.url));

const forbiddenPatterns = [
  {
    pattern: /@NgModule\b/,
    reason: 'Use standalone Angular components/providers instead of NgModule declarations.',
  },
  {
    pattern: /\bBrowserModule\b|\bplatformBrowserDynamic\b/,
    reason: 'Bootstrap should stay on standalone application APIs.',
  },
  {
    pattern: /@Input\s*\(/,
    reason: 'Use signal-based input() for new Angular 22 components.',
  },
  {
    pattern: /@Output\s*\(|\bEventEmitter\b/,
    reason: 'Use output() for new Angular 22 component events.',
  },
  {
    pattern: /\*ngIf|\*ngFor|\*ngSwitch/,
    reason: 'Use built-in control flow blocks like @if, @for, and @switch.',
  },
  {
    pattern: /\bngClass\b|\bngStyle\b/,
    reason: 'Prefer class/style bindings for this app unless a specific directive is justified.',
  },
];

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(path) : path;
    }),
  );

  return files.flat();
}

function lineNumberFor(content, index) {
  return content.slice(0, index).split('\n').length;
}

function addFailure(failures, file, line, reason) {
  failures.push(`${relative(process.cwd(), file)}:${line} - ${reason}`);
}

const files = (await listFiles(appDir)).filter(
  (file) => /\.(ts|html)$/.test(file) && !file.endsWith('.spec.ts'),
);
const failures = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');

  for (const { pattern, reason } of forbiddenPatterns) {
    const match = pattern.exec(content);
    if (match?.index !== undefined) {
      addFailure(failures, file, lineNumberFor(content, match.index), reason);
    }
  }

  if (file.endsWith('.ts')) {
    const constructorPattern = /constructor\s*\(/g;
    for (const match of content.matchAll(constructorPattern)) {
      addFailure(
        failures,
        file,
        lineNumberFor(content, match.index ?? 0),
        'Use field initializers, inject(), or lifecycle hooks instead of constructors in Angular app code.',
      );
    }
  }

  if (file.endsWith('.component.ts') && content.includes('@Component(')) {
    const hasOnPush = content.includes('changeDetection: ChangeDetectionStrategy.OnPush');
    if (!hasOnPush) {
      addFailure(failures, file, 1, 'Component is missing ChangeDetectionStrategy.OnPush.');
    }
  }
}

if (failures.length > 0) {
  console.error('Angular 22 practice check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Angular 22 practice check passed.');
