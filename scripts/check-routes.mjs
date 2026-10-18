import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync('src/routes.tsx', 'utf8');
const routes = [...source.slice(source.indexOf('ALL_PATHS')).matchAll(/"(\/[^"\n]*)"/g)].map(match => match[1]);
assert.equal(routes.length, new Set(routes).size, 'Route manifest contains duplicate paths');
const roots = ['/app', '/estate', '/business', '/institution', '/operator', '/admin'];
const patterns = [...routes, ...roots].map(route => new RegExp(`^${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[a-z]+/g, '[^/]+')}/?$`));
const failures = [];
let checked = 0;
function check(value, file, position, content) {
  if (!value.startsWith('/') || value.startsWith('//') || /\.(svg|png|jpe?g|pdf|csv|webp)(?:\?|$)/i.test(value)) return;
  const path = value.split(/[?#]/)[0];
  checked++;
  if (!patterns.some(pattern => pattern.test(path))) {
    const line = content.slice(0, position).split('\n').length;
    failures.push(`${file}:${line}: ${value}`);
  }
}
function scan(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.tsx?$/.test(file)) continue;
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(/\b(?:to|href)\s*[:=]\s*\{?\s*(["'`])(\/[^"'`\n]*)\1/g)) {
      if (match[2].includes('${')) continue;
      check(match[2], file, match.index, content);
    }
  }
}
scan('src');
assert.equal(failures.length, 0, `Unconnected internal links:\n${failures.join('\n')}`);
console.log(`Route manifest: ${routes.length} unique routes. ${checked} static navigation destinations connected.`);
