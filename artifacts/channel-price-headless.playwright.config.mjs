import { defineConfig, devices } from '@playwright/test'

const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

export default defineConfig({
  testDir: '../tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:43437',
    headless: true,
    trace: 'on-first-retry',
    launchOptions: {
      executablePath: chromeExecutablePath,
    },
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 43437',
    url: 'http://127.0.0.1:43437/index.html',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
