import { defineConfig, devices } from '@playwright/test'

const port = 4345
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

export default defineConfig({
  testDir: '../tests',
  timeout: 60_000,
  use: {
    baseURL: process.env.PMS_TEST_BASE_URL ?? `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
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
