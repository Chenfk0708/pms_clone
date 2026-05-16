import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const authStatePath = path.resolve('playwright/.auth/pms-user.json')
const targetUrl = process.env.PMS_TARGET_URL ?? 'https://minsubao.localhome.cn/houseManage/logs/price'
const cdpUrl = process.env.PMS_CDP_URL ?? 'http://127.0.0.1:9222'

async function summarizePage(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {})
  const currentUrl = page.url()
  const expectedText = currentUrl.includes('/houseManage/logs/price') ? '日志关键词' : '路客云6TS5的店铺'
  await page
    .waitForFunction(
      (text) => document.body?.innerText?.includes(text) || false,
      expectedText,
      { timeout: 20_000 },
    )
    .catch(() => {})

  const bodyText = await page.locator('body').innerText().catch(() => '')
  const needsSlider = bodyText.includes('请按住滑块，拖动到最右边')
  const hasLoginForm = bodyText.includes('账号登录') || bodyText.includes('登 录')
  const isPmsRoute = ['/workspace', '/houseManage/', '/cleanManage/'].some((route) => currentUrl.includes(route))
  const loggedIn =
    bodyText.includes('路客云6TS5的店铺') &&
    isPmsRoute

  return {
    currentUrl,
    title: await page.title().catch(() => ''),
    bodyLength: bodyText.length,
    needsSlider,
    hasLoginForm,
    loggedIn,
    bodySample: bodyText.slice(0, 300),
  }
}

async function tryConnectExistingChrome() {
  const browser = await chromium.connectOverCDP(cdpUrl)
  try {
    const context = browser.contexts()[0]
    if (!context) throw new Error('CDP Chrome 中没有可用 browser context')

    const page =
      context.pages().find((candidate) => candidate.url().includes('minsubao.localhome.cn')) ??
      (await context.newPage())

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    const result = await summarizePage(page)
    if (result.loggedIn) {
      await context.storageState({ path: authStatePath })
    }

    return {
      mode: 'connectOverCDP',
      cdpUrl,
      authStatePath,
      ...result,
      message: result.loggedIn
        ? '已复用 9222 Chrome 登录态，并刷新 Playwright storageState。'
        : result.needsSlider
          ? '9222 Chrome 打开目标页后仍出现滑块，需要人工完成验证。'
          : '9222 Chrome 可连接，但尚未进入 PMS 后台。',
    }
  } finally {
    await browser.close()
  }
}

async function verifyStorageState() {
  if (!fs.existsSync(authStatePath)) {
    throw new Error(`storageState 不存在：${authStatePath}`)
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
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    const result = await summarizePage(page)
    await context.close()

    return {
      mode: 'newContextStorageState',
      authStatePath,
      ...result,
      message: result.loggedIn
        ? 'Playwright storageState 可用，目标页可进入后台。'
        : result.needsSlider
          ? 'storageState 已失效或不足，目标页触发滑块验证。'
          : 'storageState 未能进入 PMS 后台。',
    }
  } finally {
    await browser.close()
  }
}

async function main() {
  fs.mkdirSync(path.dirname(authStatePath), { recursive: true })

  try {
    const result = await tryConnectExistingChrome()
    if (result.loggedIn) {
      console.log(JSON.stringify(result, null, 2))
      return
    }

    console.error(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(`connectOverCDP failed: ${error.message}`)
  }

  const result = await verifyStorageState()
  console.log(JSON.stringify(result, null, 2))
  if (!result.loggedIn) process.exitCode = 2
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
