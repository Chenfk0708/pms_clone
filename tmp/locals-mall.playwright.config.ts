import { defineConfig, devices } from '@playwright/test'

const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const baseURL = process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:43311'

export default defineConfig({
  testDir: '../tests',
  testMatch: /locals-mall\.spec\.ts/,
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    headless: true,
    launchOptions: {
      executablePath: chromeExecutablePath,
    },
  },
  webServer: process.env.PMS_TEST_BASE_URL
    ? undefined
    : {
        command: 'npx.cmd vite --config tmp/locals-mall.vite.config.ts --host 127.0.0.1 --port 43311 --strictPort',
        url: 'http://127.0.0.1:43311/version/localsMall',
        reuseExistingServer: false,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
