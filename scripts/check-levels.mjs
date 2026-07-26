import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/config/levelConfig.ts', import.meta.url), 'utf8');
const errors = [];
for (let floor = 1; floor <= 5; floor += 1) {
  const tag = `floor${String(floor).padStart(2, '0')}`;
  for (const suffix of ['anchor-start'])
    if (!source.includes(`${tag}-${suffix}`))
      errors.push(`floor-${String(floor).padStart(2, '0')}: missing ${tag}-${suffix}`);
}
for (const suffix of ['split-entry', 'split-core', 'split-final'])
  if (!source.includes(`}-` + suffix)) errors.push(`levels: base missing ${suffix}`);
const ids = [...source.matchAll(/id:\s*['`]([^'`${}]+)['`]/g)].map((match) => match[1]);
for (const id of new Set(ids))
  if (ids.filter((candidate) => candidate === id).length > 1)
    errors.push(`levels: duplicate explicit id ${id}`);
if (!source.includes('targetTimeMs < level.durationMs'))
  errors.push('levels: target/duration validation missing');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log('Niveles: 5 pisos con anchors y splits estructuralmente válidos.');
