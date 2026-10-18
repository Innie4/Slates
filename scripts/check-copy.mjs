import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];
let files = 0;
// This is a narrow regression guard. Plain-language editorial review still requires a reader.
const unwanted = /\u2014|\b(?:seamless(?:ly)?|delve|leverage|revolutioniz\w*|game.chang\w*|cutting.edge|transformative|unlock your|elevate your|next.level|empower your)\b/gi;
function inspect(file) {
  files++;
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(unwanted)) failures.push(`${file}:${content.slice(0, match.index).split('\n').length}: ${match[0]}`);
}
function scan(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (/\.(?:tsx?|css)$/.test(file)) inspect(file);
  }
}
scan('src');
inspect('index.html');
assert.equal(failures.length, 0, `Product copy needs review:\n${failures.join('\n')}`);
console.log(`Copy checks: ${files} source files, no em dashes or listed stock phrases.`);
