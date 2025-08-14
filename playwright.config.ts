import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'line',
  use: { baseURL: 'http://localhost:5173' },
  webServer: { command: 'vite --host --force', url: 'http://localhost:5173/studio', reuseExistingServer: !process.env.CI, timeout: 120000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
