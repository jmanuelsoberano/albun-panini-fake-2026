import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('../src/app/', import.meta.url));
const webSrcDir = fileURLToPath(new URL('../src/', import.meta.url));

function forbiddenWord(parts) {
  return new RegExp(`\\b${parts.join('')}\\b`, 'i');
}

const forbiddenPatterns = [
  forbiddenWord(['fict', 'ici', '[oa]s?']),
  forbiddenWord(['fan', 'made']),
  forbiddenWord(['no ', 'ofi', 'cial']),
  forbiddenWord(['inven', 'tad', '[oa]s?']),
  forbiddenWord(['fa', 'ke']),
  forbiddenWord(['fiction', 'al']),
  forbiddenWord(['fictit', 'ious']),
];

const requiredPatterns = [
  /\bMéxico\b/,
  /\bArgentina\b/,
  /\bBrasil\b/,
  /\bLionel Messi\b/,
  /\bCristiano Ronaldo\b/,
  /\bMexico City Stadium\b/,
  /\bNew York New Jersey Stadium\b/,
  /\bGrupo A\b/,
  /\bRonda de 32\b/,
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

const files = (await listFiles(webSrcDir)).filter(
  (file) => /\.(ts|html)$/.test(file) && !file.endsWith('.spec.ts'),
);
const appFiles = files.filter((file) => file.startsWith(appDir));
const failures = [];
const allContent = (await Promise.all(appFiles.map((file) => readFile(file, 'utf8')))).join('\n');

for (const file of files) {
  const content = await readFile(file, 'utf8');

  for (const pattern of forbiddenPatterns) {
    const match = pattern.exec(content);
    if (match?.index !== undefined) {
      failures.push(
        `${relative(process.cwd(), file)}:${lineNumberFor(content, match.index)} contains ${pattern}`,
      );
    }
  }
}

for (const pattern of requiredPatterns) {
  if (!pattern.test(allContent)) {
    failures.push(`missing required real-world content ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error('Real World Cup content smoke failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Real World Cup content smoke passed.');
