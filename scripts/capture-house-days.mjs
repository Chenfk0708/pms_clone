import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'fangtai--fangtai-guanli--rifangtai'
const targetUrl = 'https://minsubao.localhome.cn/houseManage/days'
const cloneUrl = process.env.PMS_CLONE_URL ?? 'http://127.0.0.1:4173/houseManage/days'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const pageUrl = mode === 'clone' ? cloneUrl : targetUrl
const stamp = process.env.PMS_CAPTURE_STAMP ?? formatStamp(new Date())
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
    const result = await captureSide(browser, mode, pageUrl, mode === 'target' ? { storageState } : {})
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await browser.close()
  }
} finally {
  if (previewProcess) {
    previewProcess.kill()
  }
}

async function captureSide(browser, side, url, contextOptions = {}) {
  const network = []
  const context = await browser.newContext({
    ...contextOptions,
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
        url: response.url(),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        contentType: response.headers()['content-type'] ?? '',
      })
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1_000)

    const bodyText = await page.locator('body').innerText().catch(() => '')
    const isLoginBlocked = isBlocked(page.url(), bodyText)

    const defaultScreenshotPath = path.join(artifactDirs.screenshots, `default-${side}-${stamp}.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `full-${side}-${stamp}.png`)
    const htmlPath = path.join(artifactDirs.dom, `default-${side}-${stamp}.html`)
    const statePath = path.join(artifactDirs.styles, `default-${side}-${stamp}.json`)
    const networkPath = path.join(artifactDirs.network, `default-${side}-${stamp}.json`)

    await page.screenshot({ path: defaultScreenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(htmlPath, await page.content(), 'utf8')

    const defaultState = await extractState(page)
    const interactions = []

    if (!isLoginBlocked) {
      for (const action of interactionActions()) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
        await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
        await page.keyboard.press('Escape').catch(() => {})
        await page.waitForTimeout(700)
        interactions.push(await runInteraction(page, side, action))
      }
    }

    await fs.writeFile(
      statePath,
      JSON.stringify(
        {
          side,
          title: await page.title(),
          url: page.url(),
          isLoginBlocked,
          bodyText: bodyText.slice(0, 6000),
          defaultState,
          interactions,
        },
        null,
        2,
      ),
      'utf8',
    )

    await fs.writeFile(
      networkPath,
      JSON.stringify(
        {
          side,
          title: await page.title(),
          url: page.url(),
          isLoginBlocked,
          responses: network,
        },
        null,
        2,
      ),
      'utf8',
    )

    return {
      stamp,
      taskId,
      side,
      url: page.url(),
      isLoginBlocked,
      hasBusinessText: hasDayStatusText(bodyText),
      bodyPreview: bodyText.slice(0, 800),
      artifacts: {
        defaultScreenshotPath,
        fullScreenshotPath,
        htmlPath,
        statePath,
        networkPath,
      },
      interactions,
    }
  } finally {
    await context.close()
  }
}

async function runInteraction(page, side, action) {
  const before = await summarizeTransientState(page)
  const result = await action.run(page)
  await page.waitForTimeout(800)

  const after = await summarizeTransientState(page)
  const screenshotPath = path.join(artifactDirs.screenshots, `${action.slug}-${side}-${stamp}.png`)
  const htmlPath = path.join(artifactDirs.dom, `${action.slug}-${side}-${stamp}.html`)
  const statePath = path.join(artifactDirs.styles, `${action.slug}-${side}-${stamp}.json`)

  await page.screenshot({ path: screenshotPath, fullPage: false })
  await fs.writeFile(htmlPath, await page.content(), 'utf8')
  await fs.writeFile(
    statePath,
    JSON.stringify(
      {
        side,
        action: {
          slug: action.slug,
          label: action.label,
        },
        before,
        after,
        result,
      },
      null,
      2,
    ),
    'utf8',
  )

  return {
    slug: action.slug,
    label: action.label,
    textChanged: before.bodyText !== after.bodyText,
    urlChanged: before.url !== after.url,
    result,
    before,
    after,
    screenshotPath,
    htmlPath,
    statePath,
  }
}

function interactionActions() {
  return [
    {
      slug: 'settings',
      label: '更多设置',
      run: async (page) => clickByText(page, '更多设置'),
    },
    {
      slug: 'batch-clean',
      label: '批量设脏/净',
      run: async (page) => clickByText(page, '批量设脏/净'),
    },
    {
      slug: 'batch-open-close',
      label: '批量开/关房',
      run: async (page) => clickByText(page, '批量开/关房'),
    },
    {
      slug: 'view-room-number',
      label: '按房间号',
      run: async (page) => clickByText(page, '按房间号'),
    },
    {
      slug: 'order-detail',
      label: '房间详情',
      run: async (page) => clickFirstVisible(page, ['胡志深', '张祯', '观影大床房', '天落大床电竞套间', '详情']),
    },
  ]
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const result = await clickByText(page, label)
    if (result.clicked) return result
  }
  return { found: false, clicked: false, labels }
}

async function clickByText(page, label) {
  const candidates = [
    () => page.getByRole('button', { name: new RegExp(label) }),
    () => page.getByRole('menuitem', { name: new RegExp(label) }),
    () => page.getByRole('tab', { name: new RegExp(label) }),
    () => page.getByText(label, { exact: false }),
  ]

  for (const makeLocator of candidates) {
    const locator = makeLocator()
    const count = await locator.count().catch(() => 0)
    for (let index = 0; index < Math.min(count, 12); index += 1) {
      const item = locator.nth(index)
      const box = await item.boundingBox().catch(() => null)
      if (!box || box.width < 1 || box.height < 1) continue
      const text = ((await item.textContent().catch(() => '')) ?? '').trim().replace(/\s+/g, ' ')
      await item.click({ timeout: 5_000 }).catch(async () => {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      })
      return {
        found: true,
        clicked: true,
        label,
        text: text.slice(0, 180),
        box: roundBox(box),
      }
    }
  }

  return { found: false, clicked: false, label }
}

async function extractState(page) {
  return page.evaluate(() => {
    const readNode = (node) => {
      const rect = node.getBoundingClientRect()
      const style = window.getComputedStyle(node)
      return {
        tag: node.tagName,
        className: node.getAttribute('class') ?? '',
        role: node.getAttribute('role') ?? '',
        ariaLabel: node.getAttribute('aria-label') ?? '',
        text: (node.textContent ?? node.getAttribute('placeholder') ?? '').trim().replace(/\s+/g, ' ').slice(0, 260),
        placeholder: node.getAttribute('placeholder') ?? '',
        box: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        style: {
          display: style.display,
          color: style.color,
          backgroundColor: style.backgroundColor,
          border: style.border,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          padding: style.padding,
        },
      }
    }

    const selectors = [
      'button',
      'input',
      'select',
      '[role="button"]',
      '[role="dialog"]',
      '[role="menu"]',
      '[role="menuitem"]',
      '.ant-dropdown',
      '.ant-drawer',
      '.ant-select',
      '.day-status-page',
      '.day-room-group',
      '.day-booking-card',
      '.day-room-disabled',
      '.day-filter-panel',
      '.day-order-detail',
    ]

    return {
      title: document.title,
      location: window.location.href,
      bodyText: document.body.innerText.slice(0, 6000),
      controls: Array.from(document.querySelectorAll(selectors.join(','))).slice(0, 220).map(readNode),
      headings: Array.from(document.querySelectorAll('h1,h2,h3,[class*="title"],[class*="Title"]')).slice(0, 60).map(readNode),
    }
  })
}

async function summarizeTransientState(page) {
  return page.evaluate(() => {
    const visibleTexts = (selector) =>
      Array.from(document.querySelectorAll(selector))
        .filter((node) => {
          const rect = node.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
        .map((node) => (node.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 320))
        .filter(Boolean)
        .slice(0, 40)

    return {
      url: window.location.href,
      bodyText: document.body.innerText.slice(0, 6000),
      activeButtons: visibleTexts('button.is-active,[aria-pressed="true"]'),
      menus: visibleTexts('[role="menu"],.ant-dropdown,.day-popover-menu'),
      dialogs: visibleTexts('[role="dialog"],.ant-modal,.ant-drawer,.day-order-detail'),
      selectedText: visibleTexts('.is-selected,.is-active,.ant-select-selection-item'),
    }
  })
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

function isBlocked(url, bodyText) {
  return (
    bodyText.includes('账号登录') ||
    bodyText.includes('请按住滑块') ||
    bodyText.includes('登录密码') ||
    url.includes('/home') ||
    url.includes('/login')
  )
}

function hasDayStatusText(bodyText) {
  return bodyText.includes('日房态') && (bodyText.includes('批量设脏') || bodyText.includes('按房型'))
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

function roundBox(box) {
  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
