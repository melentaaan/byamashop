import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de bout en bout sur la version de production (vite build + preview),
 * en mode démonstration (données dans le navigateur, aucun service externe).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: 3,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4174', trace: 'off', locale: 'fr-FR', timezoneId: 'Africa/Dakar' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } }, testIgnore: /mobile\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /(mobile|a11y)\.spec/ },
  ],
  webServer: {
    command: 'VITE_DEMO_MODE=true npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
