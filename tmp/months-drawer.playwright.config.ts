import { defineConfig, devices } from '@playwright/test'

const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

export default defineConfig({
  testDir: '../tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4291',
    trace: 'on-first-retry',
    headless: true,
    launchOptions: {
      executablePath: chromeExecutablePath,
    },
  },
  webServer: {
    command: 'node ./serve-spa.mjs ./months-drawer-dist 4291',
    url: 'http://127.0.0.1:4291',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
