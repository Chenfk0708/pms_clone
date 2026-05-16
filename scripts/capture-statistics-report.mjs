import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'baobiao--tongji-baobiao--tongji-gailan'
const targetUrl = 'https://minsubao.localhome.cn/statistics/report'
const cloneUrl = process.env.PMS_CLONE_URL ?? 'http://127.0.0.1:4173/statistics/report'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const url = mode === 'clone' ? cloneUrl : targetUrl
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

if (!fsSync.existsSync(chromeExecutablePath)) {
  throw new Error(`Missing Chrome executable: ${chromeExecutablePath}`)
}

if (mode === 'target' && !fsSync.existsSync(storageState)) {
  throw new Error(`Missing storageState: ${storageState}`)
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
    const result = await captureSide(browser, mode, url, mode === 'target' ? { storageState } : {})
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await browser.close()
  }
} finally {
  if (previewProcess) {
    previewProcess.kill()
  }
}

async function captureSide(browser, side, pageUrl, contextOptions = {}) {
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
        url: sanitizeUrl(response.url()),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        contentType: response.headers()['content-type'] ?? '',
      })
    })

    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await waitForSurface(page)

    const bodyText = await page.locator('body').innerText().catch(() => '')
    const isLoginBlocked = isBlocked(page.url(), bodyText)

    const defaultScreenshotPath = path.join(artifactDirs.screenshots, `default-${side}-${stamp}-viewport.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `default-${side}-${stamp}-full.png`)
    const htmlPath = path.join(artifactDirs.dom, `default-${side}-${stamp}-page.html`)
    const statePath = path.join(artifactDirs.styles, `default-${side}-${stamp}-facts.json`)
    const networkPath = path.join(artifactDirs.network, `default-${side}-${stamp}-responses.json`)

    await page.screenshot({ path: defaultScreenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(htmlPath, await page.content(), 'utf8')

    const states = {
      default: await extractFacts(page),
    }
    const interactions = []

    if (!isLoginBlocked) {
      for (const action of interactionActions()) {
        interactions.push(await runInteraction(page, side, pageUrl, action))
      }
    }

    await fs.writeFile(
      statePath,
      JSON.stringify(
        {
          taskId,
          side,
          stamp,
          url: page.url(),
          title: await page.title(),
          isLoginBlocked,
          bodyText: bodyText.slice(0, 9000),
          states,
          interactions,
          artifacts: {
            defaultScreenshotPath,
            fullScreenshotPath,
            htmlPath,
            statePath,
            networkPath,
          },
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
          taskId,
          side,
          stamp,
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
      bodyPreview: bodyText.slice(0, 1400),
      metrics: states.default.metrics,
      buttons: states.default.buttons.slice(0, 80),
      inputs: states.default.inputs.slice(0, 40),
      tableHeaders: states.default.tableHeaders,
      capturedInteractions: interactions.map((item) => ({
        slug: item.slug,
        label: item.label,
        found: item.found,
        clicked: item.clicked,
        urlChanged: item.urlChanged,
        textChanged: item.textChanged,
      })),
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

function interactionActions() {
  return [
    { slug: 'future-tab', label: '远期分析' },
    { slug: 'today-filter', label: '今天' },
    { slug: 'month-filter', label: '本月' },
    { slug: 'store-filter', label: '全部门店' },
    { slug: 'room-type-filter', label: '房型' },
    { slug: 'channel-filter', label: '渠道' },
    { slug: 'tag-filter', label: '房型标签' },
    { slug: 'income-chart-tab', label: '营业收入' },
    { slug: 'occ-chart-tab', label: '入住率OCC' },
    { slug: 'adr-chart-tab', label: '平均房费ADR' },
    { slug: 'revpar-chart-tab', label: 'RevPAR' },
  ]
}

async function runInteraction(page, side, pageUrl, action) {
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await waitForSurface(page)

  const before = await summarizeTransientState(page)
  const clickResult = await clickByText(page, action.label)
    await page.waitForTimeout(500)
  const after = await summarizeTransientState(page)

  const screenshotPath = path.join(artifactDirs.screenshots, `${action.slug}-${side}-${stamp}-viewport.png`)
  const htmlPath = path.join(artifactDirs.dom, `${action.slug}-${side}-${stamp}-page.html`)
  const statePath = path.join(artifactDirs.styles, `${action.slug}-${side}-${stamp}-facts.json`)

  await page.screenshot({ path: screenshotPath, fullPage: false })
  await fs.writeFile(htmlPath, await page.content(), 'utf8')
  await fs.writeFile(
    statePath,
    JSON.stringify(
      {
        taskId,
        side,
        stamp,
        action,
        before,
        after,
        facts: await extractFacts(page),
      },
      null,
      2,
    ),
    'utf8',
  )

  return {
    slug: action.slug,
    label: action.label,
    found: Boolean(clickResult.found),
    clicked: Boolean(clickResult.clicked),
    textChanged: before.bodyText !== after.bodyText,
    urlChanged: before.url !== after.url,
    clickResult,
    screenshotPath,
    htmlPath,
    statePath,
  }
}

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.length > 120 ||
          text.includes('统计概览') ||
          text.includes('统计总览') ||
          text.includes('营业统计') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(500)
}

async function clickByText(page, label) {
  const matchers = [
    () => page.getByRole('button', { name: new RegExp(escapeRegExp(label)) }),
    () => page.getByRole('tab', { name: new RegExp(escapeRegExp(label)) }),
    () => page.getByRole('combobox', { name: new RegExp(escapeRegExp(label)) }),
    () => page.getByRole('option', { name: new RegExp(escapeRegExp(label)) }),
    () => page.getByLabel(label, { exact: false }),
    () => page.getByPlaceholder(label, { exact: false }),
    () => page.getByText(label, { exact: false }),
  ]

  for (const makeLocator of matchers) {
    const locator = makeLocator()
    const count = await locator.count().catch(() => 0)
    for (let index = 0; index < Math.min(count, 10); index += 1) {
      const item = locator.nth(index)
      const box = await item.boundingBox().catch(() => null)
      if (!box || box.width < 1 || box.height < 1) continue
      const text = ((await item.textContent().catch(() => '')) ?? '').trim().replace(/\s+/g, ' ')
      await item.click({ timeout: 4_000 }).catch(async () => {
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

async function extractFacts(page) {
  return page.evaluate(() => {
    const styleProps = [
      'display',
      'position',
      'width',
      'height',
      'padding',
      'margin',
      'fontSize',
      'fontWeight',
      'lineHeight',
      'color',
      'backgroundColor',
      'border',
      'borderRadius',
      'boxShadow',
      'overflow',
      'gridTemplateColumns',
      'alignItems',
      'justifyContent',
      'gap',
    ]

    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim()
    const visible = (element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const stylesOf = (element) => {
      const computed = window.getComputedStyle(element)
      return Object.fromEntries(styleProps.map((prop) => [prop, computed[prop]]))
    }
    const describe = (element) => {
      const rect = element.getBoundingClientRect()
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.getAttribute('class') || '').slice(0, 220),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        placeholder: element.getAttribute('placeholder'),
        text: normalize(element.innerText || element.textContent).slice(0, 640),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        styles: stylesOf(element),
      }
    }

    const bodyText = document.body?.innerText || ''
    const controls = Array.from(
      document.querySelectorAll('button,a,input,textarea,select,[role="button"],[role="tab"],[role="combobox"]'),
    )
      .filter(visible)
      .slice(0, 240)
      .map(describe)

    const buttons = Array.from(document.querySelectorAll('button,[role="button"],a'))
      .filter(visible)
      .map((element) => normalize(element.innerText || element.textContent || element.getAttribute('aria-label')))
      .filter(Boolean)
      .slice(0, 180)

    const inputs = Array.from(document.querySelectorAll('input,textarea,select'))
      .filter(visible)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value,
      }))
      .slice(0, 80)

    const tableHeaders = Array.from(document.querySelectorAll('th,.ant-table-thead .ant-table-cell,[class*="table__head"] > div'))
      .map((element) => normalize(element.innerText || element.textContent))
      .filter(Boolean)
      .slice(0, 120)

    const headings = Array.from(document.querySelectorAll('h1,h2,h3,[class*="title"],[class*="Title"]'))
      .filter(visible)
      .slice(0, 80)
      .map(describe)

    const keyElements = Array.from(
      document.querySelectorAll(
        [
          '.ant-layout',
          '.ant-menu',
          '.ant-card',
          '.ant-tabs',
          '.ant-table-wrapper',
          '.ant-select',
          '.ant-picker',
          '.topbar',
          '.sidebar',
          '.page-content',
          '.page-header',
          '.toolbar-card',
          '.report-section',
          '.report-business-grid',
          '.report-chart',
          '.chart-stage',
          '.donut',
        ].join(','),
      ),
    )
      .filter(visible)
      .slice(0, 160)
      .map(describe)

    const visibleElements = Array.from(document.querySelectorAll('main *, .ant-layout-content *, body > div *'))
      .filter(visible)
      .slice(0, 360)
      .map(describe)

    const assets = Array.from(document.querySelectorAll('img,svg,canvas'))
      .filter(visible)
      .slice(0, 120)
      .map((element) => ({
        ...describe(element),
        src: element.getAttribute('src'),
        alt: element.getAttribute('alt'),
      }))

    const metrics = {
      hasReportText: bodyText.includes('统计概览') || bodyText.includes('统计总览'),
      hasBusinessStats: bodyText.includes('营业统计') || bodyText.includes('营业收入'),
      hasOperationStats: bodyText.includes('入住率OCC') || bodyText.includes('RevPAR'),
      hasChart: Boolean(document.querySelector('canvas,svg,.echarts,.chart-stage,.ant-tabs')),
    }

    return {
      url: location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
      },
      bodyText,
      metrics,
      controls,
      buttons,
      inputs,
      tableHeaders,
      headings,
      keyElements,
      visibleElements,
      assets,
    }
  })
}

async function summarizeTransientState(page) {
  return page.evaluate(() => {
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim()
    const visibleTexts = (selector) =>
      Array.from(document.querySelectorAll(selector))
        .filter((node) => {
          const rect = node.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        })
        .map((node) => normalize(node.textContent))
        .filter(Boolean)
        .slice(0, 60)

    return {
      url: window.location.href,
      bodyText: document.body.innerText.slice(0, 9000),
      dialogs: visibleTexts('[role="dialog"],.ant-modal,.ant-drawer'),
      dropdowns: visibleTexts('.ant-select-dropdown,.ant-dropdown,.ant-picker-dropdown,[role="listbox"]'),
      selectedText: visibleTexts('.is-selected,.is-active,.ant-select-selection-item,.ant-picker-cell-selected,.ant-tabs-tab-active'),
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
  while (Date.now() - started < 25_000) {
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

function isBlocked(pageUrl, bodyText) {
  return (
    bodyText.includes('账号登录') ||
    bodyText.includes('请按住滑块') ||
    bodyText.includes('登录密码') ||
    pageUrl.includes('/home') ||
    pageUrl.includes('/login')
  )
}

function sanitizeUrl(input) {
  try {
    const url = new URL(input)
    for (const key of [...url.searchParams.keys()]) {
      if (/token|secret|key|auth|sign|session|cookie/i.test(key)) {
        url.searchParams.set(key, '[redacted]')
      }
    }
    return url.toString()
  } catch {
    return input.replace(/([?&][^=]*(token|secret|key|auth|sign|session|cookie)[^=]*=)[^&]+/gi, '$1[redacted]')
  }
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
