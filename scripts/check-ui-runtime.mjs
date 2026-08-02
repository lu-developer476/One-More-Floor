import { spawnSync } from 'node:child_process';
const result = spawnSync('npx', ['playwright', 'test', 'e2e/ui-runtime.spec.ts'], { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(result.status ?? 1);
