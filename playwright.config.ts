import { defineConfig, devices } from '@playwright/test';
const deployed = Boolean(process.env.OMF_BASE_URL);
export default defineConfig({
  testDir: './e2e',
  testIgnore: deployed ? undefined : '**/deployed.spec.ts',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.OMF_BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  webServer: deployed
    ? undefined
    : {
        command: 'VITE_E2E=true npm run build && npm run preview -- --host 127.0.0.1',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 960, height: 540 } },
    },
  ],
});
