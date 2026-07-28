import { defineConfig } from 'vite';
import packageJson from './package.json';

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(packageJson.version) },
  build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
  test: { exclude: ['e2e/**', 'node_modules/**', 'dist/**'] },
});
