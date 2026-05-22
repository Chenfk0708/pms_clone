import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { buildPmsAuthSummary, collectPmsAuthProbe, defaultProbeApiUrl } from './pms-auth-probe.mjs'

const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const authStatePath = path.resolve('playwright/.auth/pms-user.json')
const logPath = path.resolve('tmp/refresh-pms-auth-result.json')
const startUrl = process.env.PMS_TARGET_URL ?? 'https://minsubao.localhome.cn/home'
const probeApiUrl = process.env.PMS_AUTH_API_URL ?? defaultProbeApiUrl
const pollIntervalMs = 2_000
const timeoutMs = 10 * 60 * 1_000

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  await fs.mkdir(path.dirname(authStatePath), { recursive: true })
  await fs.mkdir(path.dirname(logPath), { recursive: true })

  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: false,
  })

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    })

    const page = await context.newPage()
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {})

    const deadline = Date.now() + timeoutMs
    let lastResult = null

    while (Date.now() < deadline) {
      const probe = await collectPmsAuthProbe(page, probeApiUrl)
      const summary = buildPmsAuthSummary(probe)

      lastResult = {
        checkedAt: new Date().toISOString(),
        startUrl,
        probeApiUrl,
        probe,
        summary,
      }

      await fs.writeFile(logPath, JSON.stringify(lastResult, null, 2), 'utf8')

      if (summary.authenticated) {
        await context.storageState({ path: authStatePath })
        console.log(
          JSON.stringify(
            {
              ok: true,
              authStatePath,
              logPath,
              ...lastResult,
            },
            null,
            2,
          ),
        )
        return
      }

      await delay(pollIntervalMs)
    }

    console.error(
      JSON.stringify(
        {
          ok: false,
          reason: 'timeout',
          authStatePath,
          logPath,
          lastResult,
        },
        null,
        2,
      ),
    )
    process.exitCode = 2
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
