import { defineConfig, devices } from '@playwright/test';

// Port rieng cho worktree nay, de khong dung lai `next dev` cua repo chinh.
// playwright.config.ts goc dat reuseExistingServer: true + port 3000, nen neu
// mot dev server khac dang giu 3000 thi Playwright se DUNG LAI server do va e2e
// se test code cu. Doi port la cach tach biet that su.
// Co the ghi de bang bien moi truong PW_PORT.
const PORT = Number(process.env.PW_PORT ?? 3001);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
