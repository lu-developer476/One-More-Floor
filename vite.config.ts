import { defineConfig } from 'vite';
import packageJson from './package.json';

const releaseManifest = () => ({
  name: 'release-manifest',
  generateBundle(this: { emitFile(file: { type: 'asset'; fileName: string; source: string }): void }) {
    const runtime = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
    const commit = runtime.process?.env?.GITHUB_SHA ?? runtime.process?.env?.RENDER_GIT_COMMIT ?? 'local';
    this.emitFile({
      type: 'asset',
      fileName: 'release.json',
      source: `${JSON.stringify({ name: 'One More Floor', version: packageJson.version, commit, saveSchema: 11, towerRuleset: 2, environment: 'production' }, null, 2)}\n`,
    });
  },
});

export default defineConfig({
  base: './',
  plugins: [releaseManifest()],
  define: { __APP_VERSION__: JSON.stringify(packageJson.version) },
  build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
  test: { exclude: ['e2e/**', 'node_modules/**', 'dist/**'] },
});
