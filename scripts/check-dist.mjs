#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';

const failures = [];
const fail = (message) => failures.push(message);
const root = resolve('dist');
if (!existsSync(resolve(root, 'index.html'))) fail('falta dist/index.html');
const files = existsSync(root) ? readdirSync(root, { recursive: true }).filter((name) => statSync(resolve(root, name)).isFile()) : [];
const text = files.map((name) => [name, readFileSync(resolve(root, name), 'utf8')]);
const all = text.map(([, value]) => value).join('\n');
const html = text.find(([name]) => name === 'index.html')?.[1] ?? '';
if ((html.match(/<title>One More Floor<\/title>/g) ?? []).length !== 1) fail('el título no es exactamente One More Floor');
if (!all.includes('1.2.3')) fail('la versión esperada no aparece');
if (/1\.2\.[012]/.test(all)) fail('aparece una versión antigua');
if (files.some((name) => name.endsWith('.map'))) fail('hay sourcemaps no habilitados');
for (const forbidden of ['__OMF_E2E__', 'Enemy Lab']) if (all.includes(forbidden)) fail(`contenido prohibido: ${forbidden}`);
for (const name of files) if (/(?:save|checkpoint|playwright-report|test-results|report\.html)/i.test(name)) fail(`artifact prohibido: ${name}`);
const embeddedBinary = new RegExp('data:' + '[^;]+;' + 'base64|<' + 'image(?:\\s|>)', 'i');
if (embeddedBinary.test(all)) fail('hay contenido binario incrustado');
if (/(?:file:\/\/|[A-Z]:\\|\/(?:home|Users|workspace|root)\/)/.test(all)) fail('hay una ruta local absoluta');
for (const match of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
  const reference = match[1];
  if (/^(?:https?:|mailto:)/.test(reference)) continue;
  const asset = resolve(dirname(resolve(root, 'index.html')), reference.replace(/^\//, ''));
  if (!existsSync(asset)) fail(`asset inexistente: ${relative(root, asset)}`);
}
try {
  const release = JSON.parse(readFileSync(resolve(root, 'release.json'), 'utf8'));
  const expected = { name: 'One More Floor', version: '1.2.3', saveSchema: 11, towerRuleset: 2, environment: 'production' };
  for (const [key, value] of Object.entries(expected)) if (release[key] !== value) fail(`release.json: ${key} inválido`);
  if (!(release.commit === 'local' || /^[0-9a-f]{7,64}$/i.test(release.commit))) fail('release.json: commit inválido');
  if (Object.keys(release).sort().join(',') !== 'commit,environment,name,saveSchema,towerRuleset,version') fail('release.json contiene campos no autorizados');
} catch (error) { fail(`release.json inválido: ${error.message}`); }
if (failures.length) { console.error(`Build de producción inválida:\n${failures.join('\n')}`); process.exitCode = 1; }
else console.log(`Build de producción verificada: ${files.length} archivos textuales.`);
