import { readFileSync, readdirSync, statSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const fail = (message) => {
  console.error(`Versión inválida: ${message}`);
  process.exitCode = 1;
};
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version))
  fail('package.json no contiene SemVer');
if (pkg.version !== lock.version || pkg.version !== lock.packages?.['']?.version)
  fail('package y lock no coinciden');
const config = readFileSync('src/config/gameConfig.ts', 'utf8');
const menu = readFileSync('src/scenes/MenuScene.ts', 'utf8');
if (!config.includes('version: __APP_VERSION__')) fail('gameConfig no usa __APP_VERSION__');
const main = readFileSync('src/main.ts', 'utf8');
for (const contract of ["`One More Floor v${__APP_VERSION__}`", "'data-app-version', __APP_VERSION__", "'data-save-schema', '11'", "'data-tower-ruleset', '2'"]) if (!main.includes(contract)) fail(`falta metadata ${contract}`);
if (!menu.includes('__APP_VERSION__')) fail('MenuScene no usa __APP_VERSION__');
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
for (const file of ['src', 'index.html', 'package.json', 'README.md']) {
  const commandTarget = file === 'src' ? walk('src') : [file];
  for (const name of commandTarget) {
    const path = name;
    if (/\.(test|spec)\.ts$/.test(path)) continue;
    if (/v1\.2\.[012]/.test(readFileSync(path, 'utf8'))) fail(`versión visible antigua en ${path}`);
  }
}
if (!process.exitCode) console.log(`Versión central verificada: ${pkg.version}`);
