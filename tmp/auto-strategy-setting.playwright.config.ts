import { defineConfig, devices } from '@playwright/test'

const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

export default defineConfig({
  testDir: '../tests',
  testMatch: /auto-strategy-setting\.spec\.ts/,
  timeout: 60_000,
  use: {
    baseURL: process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:4313',
    trace: 'on-first-retry',
    headless: true,
    launchOptions: {
      executablePath: chromeExecutablePath,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
