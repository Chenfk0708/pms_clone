import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'fangtai--baojie-guanli--baojie-shezhi'
const targetUrl = 'https://minsubao.localhome.cn/cleanManage/cleanSetting'
const cloneUrl = process.env.PMS_CLONE_URL ?? 'http://127.0.0.1:4173/cleanManage/cleanSetting'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--target') ? 'target' : 'clone'
const stamp = process.env.PMS_CAPTURE_STAMP ?? formatStamp(new Date())
const url = mode === 'target' ? targetUrl : cloneUrl
const artifactDirs = {
  screenshots: path.resolve('artifacts/screenshots', taskId),
  dom: path.resolve('artifacts/dom-snapshots', taskId),
  styles: path.resolve('artifacts/style-dumps', taskId),
  network: path.resolve('artifacts/network', taskId),
}

for (const dir of Object.values(artifactDirs)) {
  await fs.mkdir(dir, { recursive: true })
}

let previewProcess = null

try {
  if (mode === 'clone') {
    await ensurePreviewServer(cloneUrl)
  }

  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: true,
  })

  try {
    const result = await captureSide(browser)
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await browser.close()
  }
} finally {
  if (previewProcess) previewProcess.kill()
}

async function captureSide(browser) {
  const network = []
  const context = await browser.newContext({
    ...(mode === 'target' ? { storageState } : {}),
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })

  try {
    const page = await context.newPage()
    page.on('response', (response) => {
      const request = response.request()
      network.push({
        url: redactUrl(response.url()),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        contentType: response.headers()['content-type'] ?? '',
        requestPostData: redactText(request.postData() ?? ''),
      })
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(800)

    const defaultResult = await saveState(page, 'default')
    const interactions = []

    if (mode === 'target') {
      interactions.push(await clickAndCapture(page, 'price-tab', '价格设置'))
      interactions.push(await clickAndCapture(page, 'subscribe', '订阅开通'))
    } else {
      interactions.push(await fillAndQuery(page))
      interactions.push(await clickAndCapture(page, 'refresh', '刷新'))
      interactions.push(await clickAndCapture(page, 'export', '导出'))
      interactions.push(await clickAndCapture(page, 'detail', '查看详情 退房保洁自动派单'))
      await page.getByRole('button', { name: '关闭详情' }).click().catch(() => {})
      interactions.push(await clickAndCapture(page, 'edit', '编辑 退房保洁自动派单'))
      await page.getByRole('button', { name: '取消' }).click().catch(() => {})
      interactions.push(await clickAndCapture(page, 'price-tab', '价格设置'))
      await page.goto(`${cloneUrl}?mockState=empty`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForTimeout(800)
      interactions.push(await saveState(page, 'empty'))
      await page.goto(`${cloneUrl}?mockState=error`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForTimeout(800)
      interactions.push(await saveState(page, 'error'))
    }

    const networkPath = path.join(artifactDirs.network, `clean-setting-${mode}-${stamp}.json`)
    await fs.writeFile(
      networkPath,
      JSON.stringify(
        {
          taskId,
          mode,
          stamp,
          url: page.url(),
          requestCount: network.length,
          requests: network,
        },
        null,
        2,
      ),
      'utf8',
    )

    return {
      taskId,
      mode,
      stamp,
      url: page.url(),
      defaultResult,
      interactions,
      networkPath,
    }
  } finally {
    await context.close()
  }
}

async function fillAndQuery(page) {
  await page.getByLabel('保洁日期').fill('2026-05-20')
  await page.getByLabel('门店').selectOption('qianhai')
  await page.getByLabel('策略状态').selectOption('enabled')
  await page.getByRole('button', { name: '查询' }).click()
  await page.waitForTimeout(800)
  return saveState(page, 'query')
}

async function clickAndCapture(page, slug, label) {
  const beforeUrl = page.url()
  const locator = page.getByRole('button', { name: label, exact: true })
  const buttonCount = await locator.count().catch(() => 0)
  const fallback = buttonCount > 0 ? locator.first() : page.getByText(label, { exact: false }).first()
  await fallback.click({ timeout: 8_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})
  await page.waitForTimeout(800)
  const state = await saveState(page, slug)
  return {
    ...state,
    label,
    beforeUrl,
    afterUrl: page.url(),
    urlChanged: beforeUrl !== page.url(),
  }
}

async function saveState(page, slug) {
  const screenshotPath = path.join(artifactDirs.screenshots, `${slug}-${mode}-${stamp}.png`)
  const fullScreenshotPath = path.join(artifactDirs.screenshots, `${slug}-${mode}-${stamp}-full.png`)
  const htmlPath = path.join(artifactDirs.dom, `${slug}-${mode}-${stamp}.html`)
  const factsPath = path.join(artifactDirs.styles, `${slug}-${mode}-${stamp}.json`)

  await page.screenshot({ path: screenshotPath, fullPage: false })
  await page.screenshot({ path: fullScreenshotPath, fullPage: true })
  await fs.writeFile(htmlPath, await page.content(), 'utf8')

  const facts = await page.evaluate(() => ({
    title: document.title,
    url: window.location.href,
    bodyText: document.body.innerText.slice(0, 6000),
    visibleButtons: Array.from(document.querySelectorAll('button'))
      .filter((node) => {
        const box = node.getBoundingClientRect()
        return box.width > 0 && box.height > 0
      })
      .map((node) => (node.textContent ?? '').trim().replace(/\s+/g, ' '))
      .slice(0, 80),
    controls: Array.from(document.querySelectorAll('input,select,[role="tab"],[role="dialog"],[role="alert"],[role="status"]'))
      .map((node) => {
        const box = node.getBoundingClientRect()
        return {
          tag: node.tagName,
          role: node.getAttribute('role') ?? '',
          ariaLabel: node.getAttribute('aria-label') ?? '',
          text: (node.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 180),
          value: 'value' in node ? node.value : '',
          box: {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
          },
        }
      })
      .slice(0, 120),
  }))

  await fs.writeFile(factsPath, JSON.stringify(facts, null, 2), 'utf8')
  return { slug, screenshotPath, fullScreenshotPath, htmlPath, factsPath }
}

async function ensurePreviewServer(serverUrl) {
  if (await canFetch(serverUrl)) return

  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const port = new URL(serverUrl).port || '4173'
  previewProcess = spawn(command, ['run', 'preview', '--', '--host', '127.0.0.1', '--port', port], {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  })

  const started = Date.now()
  while (Date.now() - started < 20_000) {
    if (await canFetch(serverUrl)) return
    await delay(500)
  }
  throw new Error(`Local preview server did not become ready at ${serverUrl}`)
}

async function canFetch(serverUrl) {
  try {
    const response = await fetch(serverUrl)
    return response.ok
  } catch {
    return false
  }
}

function redactUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl)
    for (const key of parsed.searchParams.keys()) {
      if (/token|cookie|session|accid|appkey|key|sig|auth|uid/i.test(key)) {
        parsed.searchParams.set(key, '[REDACTED]')
      }
    }
    return parsed.toString()
  } catch {
    return redactText(rawUrl)
  }
}

function redactText(text) {
  return text
    .replace(/("(?:token|cookie|sessionId|sessionSeq|accid|appKey|authorization)"\s*:\s*)"[^"]+"/gi, '$1"[REDACTED]"')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[REDACTED]')
}

function formatStamp(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})

  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
