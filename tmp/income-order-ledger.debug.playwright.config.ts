import { defineConfig, devices } from '@playwright/test'

const externalBaseURL = process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:4205'

export default defineConfig({
  testDir: '../tests',
  timeout: 30_000,
  use: {
    baseURL: externalBaseURL,
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
