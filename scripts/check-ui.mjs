import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const tokens = read('src/ui/UiTokens.ts');
const requiredTokens = ['background','elevated','panel','selected','border','focus','text','secondary','disabled','primary','warning','danger','success','deltaPositive','deltaNegative'];
const missing = requiredTokens.filter((token) => !new RegExp(`\\b${token}:`).test(tokens));
if (missing.length) throw new Error(`Tokens ausentes: ${missing.join(', ')}`);
if (!/body:\s*16/.test(tokens) || !/hitHeight:\s*44/.test(tokens) || !/safe:\s*24/.test(tokens)) throw new Error('Mínimos de legibilidad incompletos.');
const registered = [...read('src/config/gameConfig.ts').matchAll(/^\s{4}([A-Z][A-Za-z]+Scene),$/gm)].map((match) => match[1]);
const requiredScenes = ['MenuScene','HelpScene','CreditsScene','SettingsScene','ControlsScene','FloorSelectScene','RunSetupScene','TowerSetupScene','PauseScene','ResultsScene','TowerFloorResultsScene','TowerResultsScene','AnalyticsScene','UIScene'];
for (const scene of requiredScenes) {
  if (!registered.includes(scene)) throw new Error(`${scene} no está registrada.`);
  const source = read(`src/scenes/${scene}.ts`);
  if (!source.includes('ScreenShell')) throw new Error(`${scene} no usa el sistema de diseño compartido.`);
  if (/fontSize:\s*['"](?:1[0-5])px/.test(source)) throw new Error(`${scene} conserva texto principal menor a 16 px.`);
  if (/legacy scene|migrate later|temporary exemption/i.test(source)) throw new Error(`${scene} contiene una excepción legacy.`);
}
const settings = read('src/scenes/SettingsScene.ts');
for (const copy of ['AUDIO','IMAGEN Y ACCESIBILIDAD','JUGABILIDAD','CONTROLES','DATOS LOCALES','ZONA DE PELIGRO','SACUDIDA DE CÁMARA','RESTAURAR AJUSTES']) if (!settings.includes(copy)) throw new Error(`Ajustes sin ${copy}.`);
const controls = read('src/scenes/ControlsScene.ts');
for (const copy of ['MOVER A LA IZQUIERDA','SALTAR','VOLVER / CANCELAR','MOVIMIENTO','SISTEMA','NAVEGACIÓN']) if (!controls.includes(copy)) throw new Error(`Controles sin copy humano: ${copy}.`);
const hud = read('src/scenes/UIScene.ts');
for (const copy of ['SALTO EXTRA','DASH','PRÓXIMO']) if (!hud.includes(copy)) throw new Error(`HUD sin ${copy}.`);
const kit = read('src/ui/UiKit.ts');
if (!kit.includes('hitHeight') || !kit.includes('useHandCursor') || !kit.includes('destructive')) throw new Error('Hit areas, pointer o acciones destructivas incompletas.');
if (!read('index.html').includes('<title>One More Floor</title>')) throw new Error('El título del navegador cambió.');
console.log(`UI v1.1.1: ${requiredScenes.length} escenas migradas, safe area, foco, targets, peligro y copy verificados.`);
