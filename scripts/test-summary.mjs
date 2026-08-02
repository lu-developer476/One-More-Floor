#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const run = (label, command, count = false) => {
  const result = spawnSync(command, { shell: true, encoding: 'utf8' });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const matches = [...output.matchAll(/(\d+)\s+(?:tests?|passed)/gi)].map((match) => Number(match[1]));
  const suffix = count && matches.length ? ` (${Math.max(...matches)} PASS)` : '';
  console.log(`${label}: ${result.status === 0 ? `PASS${suffix}` : 'FAIL'}`);
  return result.status === 0;
};
const ok = [
  run('Static checks', 'npm run verify:static'),
  run('E2E', 'npm run test:e2e', true),
  run('UI runtime', 'npm run check:ui:runtime'),
];
if (ok.some((value) => !value)) process.exitCode = 1;
