import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const port = Number(process.env.PMS_TEST_PORT ?? 43380)
const externalBaseURL = process.env.PMS_TEST_BASE_URL
const chromeExecutablePath = process.env.PMS_CHROME_PATH ?? resolveBundledChromiumPath()

function resolveBundledChromiumPath() {
  const browserRoot = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright')
  if (!fs.existsSync(browserRoot)) {
    throw new Error(`Playwright browser directory not found: ${browserRoot}`)
  }

  const candidates = fs
    .readdirSync(browserRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('chromium-'))
    .map((entry) => path.join(browserRoot, entry.name, 'chrome-win64', 'chrome.exe'))
    .filter((candidate) => fs.existsSync(candidate))
    .sort()

  const executablePath = candidates.at(-1)
  if (!executablePath) {
    throw new Error(`No bundled Chromium executable found under: ${browserRoot}`)
  }

  return executablePath
}

export default defineConfig({
  testDir: path.resolve(__dirname, '../tests'),
  timeout: 60_000,
  use: {
    baseURL: externalBaseURL ?? `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    headless: true,
    launchOptions: { executablePath: chromeExecutablePath },
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: `npx vite --config tmp/pre-sale-coupon-mall.vite.config.ts --host 127.0.0.1 --port ${port} --strictPort`,
        url: `http://127.0.0.1:${port}/statistics/preSaleCouponMall`,
        reuseExistingServer: false,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
