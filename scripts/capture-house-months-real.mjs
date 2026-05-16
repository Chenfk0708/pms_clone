import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'fangtai--fangtai-guanli--yuefangtai'
const targetUrl = 'https://minsubao.localhome.cn/houseManage/months'
const cloneUrl = process.env.PMS_CLONE_URL ?? 'http://127.0.0.1:4173/houseManage/months'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const useCloneStorageState = process.env.PMS_CLONE_USE_STORAGE_STATE === '1'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const pageUrl = mode === 'clone' ? cloneUrl : targetUrl
const stamp = process.env.PMS_CAPTURE_STAMP ?? formatStamp(new Date())
const artifactDirs = {
  screenshots: path.resolve('artifacts/screenshots', taskId),
  dom: path.resolve('artifacts/dom-snapshots', taskId),
  styles: path.resolve('artifacts/style-dumps', taskId),
  network: path.resolve('artifacts/network', taskId),
  interactionMatrix: path.resolve('artifacts/interaction-matrix', taskId),
}

for (const dir of Object.values(artifactDirs)) {
  await fs.mkdir(dir, { recursive: true })
}

let previewProcess = null
let cloneHudsonAccessToken = ''

try {
  if (mode === 'clone') {
    await ensurePreviewServer(cloneUrl)
  }

  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: true,
    args: buildLaunchArgs(pageUrl),
  })

  try {
    if (mode === 'clone' && useCloneStorageState) {
      cloneHudsonAccessToken = await captureHudsonAccessToken()
    }
    const result = await captureSide(browser, mode, pageUrl, mode === 'target' || useCloneStorageState ? { storageState } : {})
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
  const responses = []
  const context = await browser.newContext({
    ...contextOptions,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })

  try {
    if (side === 'clone' && cloneHudsonAccessToken) {
      await context.addInitScript((token) => {
        window.localStorage.setItem('pms.hudsonAccessToken', token)
      }, cloneHudsonAccessToken)
    }
    const page = await context.newPage()
    if (side === 'clone' && useCloneStorageState) {
      const cookieHeader = await buildHudsonCookieHeader(storageState)
      if (cloneHudsonAccessToken) {
        await page.route('https://hudson-prod.localhome.cn/**', async (route) => {
          const headers = buildHudsonProxyHeaders(route.request().headers(), cloneHudsonAccessToken)
          const response = await route.fetch({
            headers,
          })
          await route.fulfill({ response })
        })
      } else if (cookieHeader) {
        await page.route('https://hudson-prod.localhome.cn/**', async (route) => {
          await route.continue({
            headers: {
              ...route.request().headers(),
              cookie: cookieHeader,
            },
          })
        })
      }
    }
    page.on('response', async (response) => {
      const request = response.request()
      const responseUrl = response.url()
      if (!shouldKeepNetworkRecord(responseUrl, request.resourceType())) return

      responses.push({
        url: responseUrl,
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        request: summarizeRequest(request),
        response: await summarizeResponse(response),
      })
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1_200)

    const bodyText = await page.locator('body').innerText().catch(() => '')
    const isLoginBlocked = isBlocked(page.url(), bodyText)
    const defaultState = await extractState(page)
    const interactions = []

    if (!isLoginBlocked) {
      for (const action of interactionActions()) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
        await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
        await page.keyboard.press('Escape').catch(() => {})
        await page.waitForTimeout(600)
        interactions.push(await runInteraction(page, side, action))
      }
    }

    const screenshotPath = path.join(artifactDirs.screenshots, `real-data-${side}-${stamp}-viewport.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `real-data-${side}-${stamp}-full.png`)
    const htmlPath = path.join(artifactDirs.dom, `real-data-${side}-${stamp}.html`)
    const stylePath = path.join(artifactDirs.styles, `real-data-${side}-${stamp}.json`)
    const networkPath = path.join(artifactDirs.network, `real-data-${side}-${stamp}.json`)
    const matrixPath = path.join(artifactDirs.interactionMatrix, 'interaction-matrix.md')

    await page.screenshot({ path: screenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(htmlPath, await page.content(), 'utf8')
    await fs.writeFile(
      stylePath,
      JSON.stringify(
        {
          side,
          url: page.url(),
          title: await page.title(),
          isLoginBlocked,
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
          url: page.url(),
          title: await page.title(),
          isLoginBlocked,
          responses,
        },
        null,
        2,
      ),
      'utf8',
    )
    await fs.writeFile(matrixPath, buildInteractionMatrix(side, interactions, responses), 'utf8')

    return {
      stamp,
      taskId,
      side,
      finalUrl: page.url(),
      isLoginBlocked,
      businessTextFound: bodyText.includes('月房态') && bodyText.includes('批量设脏'),
      artifacts: {
        screenshotPath,
        fullScreenshotPath,
        htmlPath,
        stylePath,
        networkPath,
        matrixPath,
      },
      keptResponseCount: responses.length,
      interactions,
    }
  } finally {
    await context.close()
  }
}

async function captureHudsonAccessToken() {
  const tokenBrowser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: true,
  })
  const context = await tokenBrowser.newContext({
    storageState,
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  try {
    const page = await context.newPage()
    const tokenPromise = new Promise((resolve) => {
      const timer = setTimeout(() => resolve(''), 15_000)
      page.on('request', (request) => {
        if (!request.url().includes('hudson-prod.localhome.cn/roomStatuses/rooms/get')) return
        const token = request.headers()['hudson-access-token'] ?? ''
        clearTimeout(timer)
        resolve(token)
      })
    })
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    return await tokenPromise
  } finally {
    await context.close()
    await tokenBrowser.close()
  }
}

async function runInteraction(page, side, action) {
  const before = await summarizeTransientState(page)
  const result = await action.run(page)
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
  await page.waitForTimeout(600)
  const after = await summarizeTransientState(page)

  const screenshotPath = path.join(artifactDirs.screenshots, `real-data-${action.slug}-${side}-${stamp}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: false })

  return {
    slug: action.slug,
    label: action.label,
    result,
    urlChanged: before.url !== after.url,
    textChanged: before.bodyText !== after.bodyText,
    before,
    after,
    screenshotPath,
  }
}

function interactionActions() {
  return [
    {
      slug: 'room-filter',
      label: '房型筛选',
      run: async (page) => clickByText(page, '房型'),
    },
    {
      slug: 'tag-filter',
      label: '房型标签筛选',
      run: async (page) => clickByText(page, '房型标签'),
    },
    {
      slug: 'batch-dirty-clean',
      label: '批量设脏/净',
      run: async (page) => clickByText(page, '批量设脏/净'),
    },
    {
      slug: 'batch-open-close',
      label: '批量开/关房',
      run: async (page) => clickByText(page, '批量开/关房'),
    },
    {
      slug: 'more-settings',
      label: '更多设置',
      run: async (page) => clickByText(page, '更多设置'),
    },
    {
      slug: 'booking-detail',
      label: '订单详情入口',
      run: async (page) => clickFirstVisible(page, ['陈家辉', '刘翻红', '张张', '详情']),
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
    () => page.getByRole('option', { name: new RegExp(label) }),
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

function shouldKeepNetworkRecord(url, resourceType) {
  if (resourceType !== 'fetch' && resourceType !== 'xhr' && resourceType !== 'document') return false
  return (
    url.includes('/houseManage/months') ||
    url.includes('hudson-prod.localhome.cn/camps/get') ||
    url.includes('hudson-prod.localhome.cn/roomStatuses') ||
    url.includes('hudson-prod.localhome.cn/roomCategories') ||
    url.includes('hudson-prod.localhome.cn/rooms/get') ||
    url.includes('hudson-prod.localhome.cn/select/poi/page/get') ||
    url.includes('hudson-prod.localhome.cn/order/report/get') ||
    url.includes('hudson-prod.localhome.cn/menu/optionJsons/get') ||
    url.includes('hudson-prod.localhome.cn/actionExec')
  )
}

function summarizeRequest(request) {
  const url = new URL(request.url())
  const postData = request.postData()
  const parsedBody = parseJson(postData)

  return {
    headers: summarizeHeaders(request.headers()),
    queryKeys: Array.from(url.searchParams.keys()).sort(),
    bodyKeys: parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody) ? Object.keys(parsedBody).sort() : [],
    bodyShape: summarizeJson(parsedBody),
    bodyValues: summarizeBodyValues(parsedBody),
  }
}

function summarizeHeaders(headers) {
  const summary = {
    keys: Object.keys(headers).sort(),
    values: {},
  }

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    if (lowerKey === 'hudson-access-token' || lowerKey === 'authorization' || lowerKey === 'cookie') {
      summary.values[lowerKey] = {
        present: Boolean(value),
        length: typeof value === 'string' ? value.length : 0,
      }
      continue
    }

    if (
      lowerKey.startsWith('app_') ||
      lowerKey === 'content-type' ||
      lowerKey === 'origin' ||
      lowerKey === 'referer' ||
      lowerKey === 'sec-fetch-site' ||
      lowerKey === 'sec-fetch-mode' ||
      lowerKey === 'sec-fetch-dest'
    ) {
      summary.values[lowerKey] = value
    }
  }

  return summary
}

function buildHudsonProxyHeaders(requestHeaders, token) {
  const headers = { ...requestHeaders }
  delete headers.origin
  delete headers['sec-fetch-dest']
  delete headers['sec-fetch-mode']
  delete headers['sec-fetch-site']

  headers.referer = `${new URL(targetUrl).origin}/`
  headers.app_device = 'web'
  headers.app_platform = '2'
  headers.app_source = '1'
  headers.app_system = 'v4.10.7'
  headers.app_version = '4.10.7'
  headers['hudson-access-token'] = token

  return headers
}

function summarizeBodyValues(value, depth = 0) {
  if (depth > 2) return summarizeJson(value, depth)
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      sample: value.length ? summarizeBodyValues(value[0], depth + 1) : undefined,
    }
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 20)
        .map(([key, child]) => [key, summarizeBodyValues(child, depth + 1)]),
    )
  }
  if (typeof value === 'string') return value.length > 80 ? { type: 'string', length: value.length } : value
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return { type: typeof value }
}

async function summarizeResponse(response) {
  const contentType = response.headers()['content-type'] ?? ''
  if (!contentType.includes('json')) {
    return { contentType }
  }

  try {
    const json = await response.json()
    return {
      contentType,
      shape: summarizeJson(json),
      fieldKeys: json && typeof json === 'object' && !Array.isArray(json) ? Object.keys(json).sort() : [],
    }
  } catch (error) {
    return { contentType, parseError: error instanceof Error ? error.message : String(error) }
  }
}

function summarizeJson(value, depth = 0) {
  if (value === null) return { type: 'null' }
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      sample: value.length && depth < 2 ? summarizeJson(value[0], depth + 1) : undefined,
    }
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).slice(0, 20)
    return {
      type: 'object',
      keys: entries.map(([key]) => key),
      sample: depth < 2 ? Object.fromEntries(entries.map(([key, child]) => [key, summarizeJson(child, depth + 1)])) : undefined,
    }
  }
  return { type: typeof value }
}

function parseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { rawType: 'non-json', length: text.length }
  }
}

async function extractState(page) {
  return page.evaluate(() => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }
    const summarizeNode = (node) => {
      const rect = node.getBoundingClientRect()
      const style = window.getComputedStyle(node)
      return {
        tag: node.tagName,
        role: node.getAttribute('role') ?? '',
        ariaLabel: node.getAttribute('aria-label') ?? '',
        text: (node.textContent ?? node.getAttribute('placeholder') ?? '').trim().replace(/\s+/g, ' ').slice(0, 240),
        placeholder: node.getAttribute('placeholder') ?? '',
        box: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        style: {
          color: style.color,
          backgroundColor: style.backgroundColor,
          border: style.border,
          borderRadius: style.borderRadius,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
        },
      }
    }

    return {
      bodyText: document.body.innerText.slice(0, 6000),
      controls: Array.from(document.querySelectorAll('button,input,[role="button"],[role="menuitem"],[role="option"],.ant-select,.ant-dropdown,.ant-drawer'))
        .filter(visible)
        .slice(0, 180)
        .map(summarizeNode),
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
        .map((node) => (node.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 300))
        .filter(Boolean)
        .slice(0, 30)

    return {
      url: window.location.href,
      bodyText: document.body.innerText.slice(0, 6000),
      menus: visibleTexts('[role="menu"],.ant-dropdown,.ant-select-dropdown'),
      dialogs: visibleTexts('[role="dialog"],.ant-modal,.ant-drawer'),
      selectedText: visibleTexts('.ant-select-selection-item,.ant-radio-button-wrapper-checked,.is-active,[aria-selected="true"]'),
    }
  })
}

function buildInteractionMatrix(side, interactions, responses) {
  const requestSummary = responses
    .filter((item) => item.url.includes('hudson-prod.localhome.cn'))
    .map((item) => `\`${new URL(item.url).pathname}\` ${item.method} ${item.status}`)
    .slice(0, 20)
    .join('<br>')

  const rows = interactions.map((item) => {
    const targetBehavior = item.result.clicked ? '点击后出现菜单、抽屉、跳转或文本变化' : '未找到可点击入口，记录为阻塞'
    const localStatus = side === 'clone' ? (item.textChanged || item.urlChanged ? '有反馈' : '需结合测试确认') : '待本地对齐'
    const acceptance = `Playwright: ${item.slug} 截图 + UI 状态断言`
    return `| ${item.label} | ${item.label} | ${targetBehavior} | ${requestSummary || '本次未触发新增业务请求'} | ${localStatus} | 接入真实请求或明确阻塞反馈 | ${acceptance} |`
  })

  return [
    '# 月房态交互矩阵',
    '',
    `- 任务：\`${taskId}\``,
    `- 采集侧：${side}`,
    `- 批次：${stamp}`,
    '',
    '| 区域 | 元素/按钮 | 目标站行为 | 触发请求 | 本地现状 | 改善动作 | 验收方式 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
}

async function ensurePreviewServer(serverUrl) {
  const healthUrl = previewHealthUrl(serverUrl)
  if (await canFetch(healthUrl)) return

  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const port = new URL(serverUrl).port || '4173'
  previewProcess = spawn(command, ['run', 'preview', '--', '--host', '127.0.0.1', '--port', port], {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  })

  const started = Date.now()
  while (Date.now() - started < 20_000) {
    if (await canFetch(healthUrl)) return
    await delay(500)
  }

  throw new Error(`Local preview server did not become ready at ${serverUrl}`)
}

function buildLaunchArgs(url) {
  if (mode !== 'clone') return []
  const hostname = new URL(url).hostname
  if (hostname === '127.0.0.1' || hostname === 'localhost') return []
  return [`--host-resolver-rules=MAP ${hostname} 127.0.0.1`]
}

function previewHealthUrl(serverUrl) {
  const url = new URL(serverUrl)
  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return serverUrl
  url.hostname = '127.0.0.1'
  return url.toString()
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

async function buildHudsonCookieHeader(storageStatePath) {
  if (!useCloneStorageState) return ''
  const rawState = await fs.readFile(storageStatePath, 'utf8').catch(() => '')
  const parsedState = parseJson(rawState)
  if (!parsedState || typeof parsedState !== 'object' || !Array.isArray(parsedState.cookies)) return ''

  const nowSeconds = Date.now() / 1000
  return parsedState.cookies
    .filter((cookie) => {
      if (!cookie || typeof cookie !== 'object') return false
      if (typeof cookie.name !== 'string' || typeof cookie.value !== 'string') return false
      if (typeof cookie.expires === 'number' && cookie.expires > 0 && cookie.expires < nowSeconds) return false
      const domain = typeof cookie.domain === 'string' ? cookie.domain.replace(/^\./, '') : ''
      return domain === 'hudson-prod.localhome.cn' || domain.endsWith('.localhome.cn') || domain === 'localhome.cn'
    })
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')
}
