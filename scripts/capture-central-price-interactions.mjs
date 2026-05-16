import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'fangtai--fangjia-guanli--zhongyang-jiage'
const targetUrl = 'https://minsubao.localhome.cn/houseManage/houseCale'
const cloneUrl = process.env.PMS_CLONE_URL ?? 'http://127.0.0.1:4173/houseManage/houseCale'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const stamp = formatStamp(new Date())
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
  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: true,
  })

  try {
    const target = await captureSide(browser, 'target', targetUrl, { storageState })
    await ensurePreviewServer(cloneUrl)
    const clone = await captureSide(browser, 'clone', cloneUrl)

    const summary = {
      stamp,
      taskId,
      target: {
        url: target.url,
        isLoginBlocked: target.isLoginBlocked,
        interactionCount: target.interactions.length,
        artifacts: target.artifacts,
      },
      clone: {
        url: clone.url,
        isLoginBlocked: clone.isLoginBlocked,
        interactionCount: clone.interactions.length,
        artifacts: clone.artifacts,
      },
    }

    console.log(JSON.stringify(summary, null, 2))
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

    await gotoWithPreviewRetry(page, side, url)
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
    await page.waitForTimeout(1_000)

    const bodyText = await page.locator('body').innerText().catch(() => '')
    const isLoginBlocked = isBlocked(page.url(), bodyText)

    const defaultScreenshotPath = path.join(artifactDirs.screenshots, `interactions-default-${side}-${stamp}.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `interactions-full-${side}-${stamp}.png`)
    const htmlPath = path.join(artifactDirs.dom, `interactions-default-${side}-${stamp}.html`)
    const statePath = path.join(artifactDirs.styles, `interactions-${side}-${stamp}.json`)
    const networkPath = path.join(artifactDirs.network, `interactions-${side}-${stamp}.json`)

    await page.screenshot({ path: defaultScreenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(htmlPath, await page.content(), 'utf8')

    const defaultState = await extractState(page)
    const interactions = []

    for (const action of interactionActions()) {
      await resetPage(page, side, url)
      const result = await runInteraction(page, side, action)
      interactions.push(result)
    }

    await fs.writeFile(
      statePath,
      JSON.stringify(
        {
          side,
          title: await page.title(),
          url: page.url(),
          isLoginBlocked,
          bodyText: bodyText.slice(0, 5000),
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
      url: page.url(),
      isLoginBlocked,
      interactions,
      artifacts: {
        defaultScreenshotPath,
        fullScreenshotPath,
        htmlPath,
        statePath,
        networkPath,
      },
    }
  } finally {
    await context.close()
  }
}

async function runInteraction(page, side, action) {
  const before = await summarizeTransientState(page)
  const clickResult =
    action.kind === 'price-cell'
      ? await clickFirstPriceCell(page)
      : await clickByVisibleLabel(page, action.label)

  await page.waitForTimeout(800)

  if (action.option) {
    const optionResult = await clickByVisibleLabel(page, action.option)
    clickResult.optionResult = optionResult
    await page.waitForTimeout(500)
  }

  const after = await summarizeTransientState(page)
  const screenshotPath = path.join(artifactDirs.screenshots, `${action.slug}-${side}-${stamp}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: false })

  return {
    slug: action.slug,
    label: action.label,
    found: Boolean(clickResult.found),
    clicked: Boolean(clickResult.clicked),
    urlChanged: before.url !== after.url,
    textChanged: before.bodyText !== after.bodyText,
    clickResult,
    before,
    after,
    screenshotPath,
  }
}

async function resetPage(page, side, url) {
  await gotoWithPreviewRetry(page, side, url)
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
  await page.waitForTimeout(700)
}

function interactionActions() {
  return [
    { slug: 'settings', label: '价格设置' },
    { slug: 'planning', label: '价格规划' },
    { slug: 'channel-filter', label: '渠道', option: '携程' },
    { slug: 'room-filter', label: '房型' },
    { slug: 'room-tag-filter', label: '房型标签' },
    { slug: 'price-cell', label: 'first visible price cell', kind: 'price-cell' },
  ]
}

async function clickByVisibleLabel(page, label) {
  const candidates = [
    () => page.getByRole('button', { name: label, exact: true }),
    () => page.getByRole('tab', { name: label, exact: true }),
    () => page.getByRole('option', { name: label, exact: true }),
    () => page.getByText(label, { exact: true }),
    () => page.locator(`text="${label}"`),
  ]

  for (const getLocator of candidates) {
    const locator = getLocator()
    const count = await locator.count().catch(() => 0)
    for (let index = 0; index < Math.min(count, 8); index += 1) {
      const item = locator.nth(index)
      const box = await item.boundingBox().catch(() => null)
      if (!box || box.width < 1 || box.height < 1) continue

      const text = (await item.textContent().catch(() => ''))?.trim() ?? ''
      await item.click({ timeout: 5_000 }).catch(async () => {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      })

      return {
        found: true,
        clicked: true,
        strategy: 'label',
        label,
        text: text.slice(0, 120),
        box: roundBox(box),
      }
    }
  }

  return { found: false, clicked: false, strategy: 'label', label }
}

async function clickFirstPriceCell(page) {
  const target = await page.evaluate(() => {
    const selectors = ['button.price-cell', '.price-cell-button', '.ant-table-cell', 'td', '[class*="cell"]']
    const candidates = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    const seen = new Set()

    for (const node of candidates) {
      if (seen.has(node)) continue
      seen.add(node)

      const text = (node.textContent ?? '').trim()
      const rect = node.getBoundingClientRect()
      if (!text || rect.width < 32 || rect.height < 20) continue
      if (rect.x < 230 || rect.y < 260) continue
      if (!/[0-9]{2,4}|-/.test(text)) continue

      return {
        text: text.slice(0, 120),
        box: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      }
    }

    return null
  })

  if (!target) {
    return { found: false, clicked: false, strategy: 'price-cell' }
  }

  await page.mouse.click(target.box.x + target.box.width / 2, target.box.y + target.box.height / 2)
  return {
    found: true,
    clicked: true,
    strategy: 'price-cell',
    text: target.text,
    box: roundBox(target.box),
  }
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
        text: (node.textContent ?? node.getAttribute('placeholder') ?? '').trim().slice(0, 160),
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
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          padding: style.padding,
        },
      }
    }

    const controls = Array.from(document.querySelectorAll('button,input,select,[role="button"],[role="tab"],[role="option"],.ant-select,.price-cell'))
      .slice(0, 120)
      .map(readNode)

    const roomGroups = Array.from(document.querySelectorAll('.price-grid__group, .ant-table-row-level-0, [class*="group"]'))
      .slice(0, 30)
      .map((node) => readNode(node))

    return {
      title: document.title,
      location: window.location.href,
      bodyText: document.body.innerText.slice(0, 5000),
      controls,
      roomGroups,
    }
  })
}

async function summarizeTransientState(page) {
  return page.evaluate(() => {
    const texts = (selector) =>
      Array.from(document.querySelectorAll(selector))
        .filter((node) => {
          const rect = node.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
        .map((node) => (node.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 240))
        .filter(Boolean)
        .slice(0, 20)

    return {
      url: window.location.href,
      bodyText: document.body.innerText.slice(0, 5000),
      dialogs: texts('[role="dialog"],.ant-modal,.ant-drawer,.price-modal'),
      dropdowns: texts('.ant-select-dropdown,.ant-dropdown,.ant-picker-dropdown,.price-filter-popover,[role="listbox"]'),
      selectedText: texts('.is-selected,.is-active,.ant-select-selection-item'),
    }
  })
}

async function ensurePreviewServer(url) {
  if (await canFetch(url)) return

  if (previewProcess && previewProcess.exitCode === null) {
    const restarted = Date.now()
    while (Date.now() - restarted < 8_000) {
      if (await canFetch(url)) return
      await delay(500)
    }
  }

  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  previewProcess = spawn(command, ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  })

  const started = Date.now()
  while (Date.now() - started < 20_000) {
    if (await canFetch(url)) return
    await delay(500)
  }

  throw new Error(`Local preview server did not become ready at ${url}`)
}

async function gotoWithPreviewRetry(page, side, url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (side !== 'clone' || attempt > 0 || !message.includes('ERR_CONNECTION_REFUSED')) {
        throw error
      }

      await ensurePreviewServer(url)
      await delay(1_000)
    }
  }
}

async function canFetch(url) {
  try {
    const response = await fetch(url, { method: 'GET' })
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
