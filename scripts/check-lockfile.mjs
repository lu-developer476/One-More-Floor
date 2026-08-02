#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const packageText = readFileSync('package.json', 'utf8');
const lockText = readFileSync('package-lock.json', 'utf8');
const failures = [];
const fail = (message) => failures.push(message);
if (/^(?:<{7}|={7}|>{7})/m.test(`${packageText}\n${lockText}`)) fail('hay conflictos sin resolver');
const pkg = JSON.parse(packageText);
const lock = JSON.parse(lockText);
const root = lock.packages?.[''];
if (lock.lockfileVersion !== 3) fail(`lockfileVersion ${lock.lockfileVersion}; se esperaba 3`);
if (pkg.name !== lock.name || pkg.name !== root?.name) fail('el nombre del paquete raíz no coincide');
if (pkg.version !== lock.version || pkg.version !== root?.version) fail('la versión de aplicación no coincide');
for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const [name, range] of Object.entries(pkg[group] ?? {})) {
    if (root?.[group]?.[name] !== range) fail(`${name} no coincide en ${group}`);
    if (!lock.packages?.[`node_modules/${name}`]) fail(`${name} no existe en el lockfile`);
  }
}
for (const [path, entry] of Object.entries(lock.packages ?? {})) {
  const values = [entry?.resolved, entry?.version, ...Object.values(entry?.dependencies ?? {})].filter(Boolean);
  for (const value of values) {
    const text = String(value);
    if (text.startsWith('file:')) fail(`${path || '<root>'} usa file:`);
    if (/^(?:git\+|git:|github:|gitlab:|bitbucket:|https?:\/\/github\.com\/.*\.git)/i.test(text)) fail(`${path || '<root>'} usa Git sin justificación`);
    if (/^http:\/\//i.test(text)) fail(`${path || '<root>'} usa HTTP inseguro`);
  }
}
if (failures.length) {
  console.error(`Lockfile inválido:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else console.log(`Lockfile reproducible: ${Object.keys(lock.packages).length - 1} paquetes, formato 3.`);
