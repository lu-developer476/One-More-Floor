#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { inspectTrackedFile } from './text-only-policy.mjs';

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const failures = [];
for (const path of files) {
  const content = readFileSync(path, 'utf8');
  for (const issue of inspectTrackedFile(path, content, statSync(path).size)) failures.push(`${path}: ${issue}`);
}
if (failures.length) {
  console.error(`Política text-only incumplida:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else console.log(`Política text-only: ${files.length} archivos versionados válidos.`);
