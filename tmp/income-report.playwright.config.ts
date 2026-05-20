import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PMS_TEST_PORT ?? 4193)
const externalBaseURL = process.env.PMS_TEST_BASE_URL
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

export default defineConfig({
  testDir: '../tests',
  timeout: 30_000,
  use: {
    baseURL: externalBaseURL ?? `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    headless: true,
    launchOptions: {
      executablePath: chromeExecutablePath,
    },
  },
  webServer: externalBaseURL
    ? undefined
    : {
      command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
      url: `http://127.0.0.1:${port}/statistics/stay`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
