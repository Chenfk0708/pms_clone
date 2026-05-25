import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { buildPmsAuthSummary, collectPmsAuthProbe, defaultProbeApiUrl } from './pms-auth-probe.mjs'

const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const authStatePath = path.resolve('playwright/.auth/pms-user.json')
const logPath = path.resolve('tmp/chrome-login-probe-result.json')
const targetUrl = process.env.PMS_TARGET_URL ?? 'https://minsubao.localhome.cn/workspace'
const cdpUrl = process.env.PMS_CDP_URL ?? 'http://127.0.0.1:9222'
const probeApiUrl = process.env.PMS_AUTH_API_URL ?? defaultProbeApiUrl

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
}

async function openOrReusePage(context) {
  return (
    context.pages().find((candidate) => candidate.url().includes('minsubao.localhome.cn')) ??
    context.pages()[0] ??
    (await context.newPage())
  )
}

async function runProbe(page) {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {})

  const probe = await collectPmsAuthProbe(page, probeApiUrl)
  const summary = buildPmsAuthSummary(probe)

  return {
    checkedAt: new Date().toISOString(),
    targetUrl,
    probeApiUrl,
    probe,
    summary,
  }
}

async function tryConnectExistingChrome() {
  const browser = await chromium.connectOverCDP(cdpUrl)

  try {
    const context = browser.contexts()[0]

    if (!context) {
      throw new Error('No browser context is available through the remote debugging port.')
    }

    const page = await openOrReusePage(context)
    const result = await runProbe(page)

    if (result.summary.authenticated) {
      await context.storageState({ path: authStatePath })
    }

    return {
      mode: 'connectOverCDP',
      cdpUrl,
      authStatePath,
      ...result,
    }
  } finally {
    await browser.close()
  }
}

async function verifyStorageState() {
  if (!fs.existsSync(authStatePath)) {
    throw new Error(`Storage state not found: ${authStatePath}`)
  }

  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: true,
  })

  try {
    const context = await browser.newContext({
      storageState: authStatePath,
      viewport: { width: 1440, height: 900 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    })

    const page = await context.newPage()
    const result = await runProbe(page)

    await context.close()

    return {
      mode: 'storageState',
      authStatePath,
      ...result,
    }
  } finally {
    await browser.close()
  }
}

async function main() {
  ensureParentDir(authStatePath)
  ensureParentDir(logPath)

  let cdpFailure = null
  let cdpResult = null

  try {
    cdpResult = await tryConnectExistingChrome()
    writeJson(logPath, cdpResult)

    if (cdpResult.summary.authenticated) {
      console.log(JSON.stringify(cdpResult, null, 2))
      return
    }
  } catch (error) {
    cdpFailure = error instanceof Error ? error.message : String(error)
  }

  const storageStateResult = await verifyStorageState()
  const finalResult = {
    cdpResult,
    ...storageStateResult,
    cdpFailure,
  }

  writeJson(logPath, finalResult)
  console.log(JSON.stringify(finalResult, null, 2))

  if (!finalResult.summary.authenticated) {
    process.exitCode = 2
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
