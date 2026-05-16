import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '../tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4178',
    headless: true,
    launchOptions: {
      executablePath:
        process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
