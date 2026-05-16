import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'fangtai--fangjia-guanli--qita-jiage'
const targetUrl = 'https://minsubao.localhome.cn/houseManage/otherPrice'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-')

const artifactDirs = {
  screenshots: path.resolve('artifacts/screenshots', taskId),
  dom: path.resolve('artifacts/dom-snapshots', taskId),
  styles: path.resolve('artifacts/style-dumps', taskId),
  network: path.resolve('artifacts/network', taskId),
}

for (const dir of Object.values(artifactDirs)) {
  await fs.mkdir(dir, { recursive: true })
}

const network = []
const relevantEndpointPatterns = [
  '/camps/get',
  '/camp/get',
  '/channels/get',
  '/select/poi/page/get',
  '/select/poi/get',
  '/roomCategories/page/get',
  '/weiRoomCategories/page/get',
  '/select/calChannel4RoomCategory/get',
  '/roomCategoryRules/get',
  '/roomCategoryFlow/discount/remind/get',
  '/roomCategoryPricings/get',
  '/rooms/get',
  '/paymentTypes/get/v2',
]

function safePostData(request) {
  const raw = request.postData()
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw.slice(0, 500)
  }
}

function summarizePayload(value, depth = 0) {
  if (value === null || value === undefined) return value
  if (depth > 6) return Array.isArray(value) ? `[Array(${value.length})]` : '[Object]'
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      sample: value.slice(0, 2).map((item) => summarizePayload(item, depth + 1)),
    }
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    return Object.fromEntries(entries.slice(0, 12).map(([key, item]) => [key, summarizePayload(item, depth + 1)]))
  }
  if (typeof value === 'string') return value.length > 120 ? `${value.slice(0, 120)}...` : value
  return value
}

const browser = await chromium.launch({
  executablePath: chromeExecutablePath,
  headless: true,
})

try {
  const context = await browser.newContext({
    storageState,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  const page = await context.newPage()

  page.on('response', async (response) => {
    const request = response.request()
    const url = response.url()
    const isRelevant = relevantEndpointPatterns.some((pattern) => url.includes(pattern))
    const entry = {
      url: response.url(),
      status: response.status(),
      method: request.method(),
      resourceType: request.resourceType(),
      contentType: response.headers()['content-type'] ?? '',
      requestBody: isRelevant ? safePostData(request) : undefined,
    }
    if (isRelevant && (entry.contentType.includes('json') || request.resourceType() === 'fetch')) {
      try {
        entry.responseSummary = summarizePayload(await response.json())
      } catch (error) {
        entry.responseSummary = { readError: error.message.split('\n')[0] }
      }
    }
    network.push(entry)
  })

  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45_000 })
  await page.waitForTimeout(2_000)

  const title = await page.title()
  const url = page.url()
  const bodyText = await page.locator('body').innerText().catch(() => '')
  const isLoginBlocked =
    bodyText.includes('账号登录') ||
    bodyText.includes('请按住滑块') ||
    url.includes('/home') ||
    url.includes('/login')

  const screenshotPath = path.join(artifactDirs.screenshots, `default-target-${stamp}.png`)
  const fullScreenshotPath = path.join(artifactDirs.screenshots, `full-target-${stamp}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: false })
  await page.screenshot({ path: fullScreenshotPath, fullPage: true })

  const html = await page.content()
  const htmlPath = path.join(artifactDirs.dom, `default-target-${stamp}.html`)
  await fs.writeFile(htmlPath, html, 'utf8')

  const state = await page.evaluate(() => {
    const sample = Array.from(document.querySelectorAll('button,input,[role="button"],.ant-select,.ant-picker')).slice(0, 80)
    const samples = sample.map((node) => {
      const rect = node.getBoundingClientRect()
      const style = window.getComputedStyle(node)
      return {
        tag: node.tagName,
        className: node.getAttribute('class') ?? '',
        role: node.getAttribute('role') ?? '',
        text: (node.textContent ?? node.getAttribute('placeholder') ?? '').trim().slice(0, 120),
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
          background: style.backgroundColor,
          border: style.border,
          borderRadius: style.borderRadius,
          fontSize: style.fontSize,
          padding: style.padding,
        },
      }
    })

    return {
      title: document.title,
      location: window.location.href,
      bodyText: document.body.innerText.slice(0, 4000),
      samples,
    }
  })

  const interactions = []
  const clickLabels = ['杂费设置', '活动设置', '渠道', '房型', '设置']
  for (const label of clickLabels) {
    const beforeUrl = page.url()
    const beforeText = await page.locator('body').innerText().catch(() => '')
    const locator = page.getByText(label, { exact: false }).first()
    const count = await locator.count().catch(() => 0)
    if (!count) {
      interactions.push({ label, found: false })
      continue
    }
    await locator.click({ timeout: 5_000 }).catch((error) => {
      interactions.push({ label, found: true, clicked: false, error: error.message.split('\n')[0] })
    })
    await page.waitForTimeout(700)
    const afterText = await page.locator('body').innerText().catch(() => '')
    interactions.push({
      label,
      found: true,
      clicked: true,
      urlChanged: page.url() !== beforeUrl,
      textChanged: afterText !== beforeText,
      visibleDialog: await page.locator('.ant-modal:visible,.ant-drawer:visible,[role="dialog"]:visible').count().catch(() => 0),
      visibleDropdown: await page.locator('.ant-select-dropdown:visible,.ant-dropdown:visible,.ant-picker-dropdown:visible').count().catch(() => 0),
    })
    await page.keyboard.press('Escape').catch(() => {})
  }

  const stylePath = path.join(artifactDirs.styles, `default-target-${stamp}.json`)
  await fs.writeFile(
    stylePath,
    JSON.stringify(
      {
        title,
        url,
        isLoginBlocked,
        bodyText: bodyText.slice(0, 4000),
        state,
        interactions,
      },
      null,
      2,
    ),
    'utf8',
  )

  const networkPath = path.join(artifactDirs.network, `default-target-${stamp}.json`)
  const relevantNetworkPath = path.join(artifactDirs.network, `default-target-${stamp}-relevant.json`)
  await fs.writeFile(
    networkPath,
    JSON.stringify(
      {
        title,
        url,
        isLoginBlocked,
        responses: network,
      },
      null,
      2,
    ),
    'utf8',
  )
  await fs.writeFile(
    relevantNetworkPath,
    JSON.stringify(
      {
        title,
        url,
        isLoginBlocked,
        responses: network.filter((entry) => relevantEndpointPatterns.some((pattern) => entry.url.includes(pattern))),
      },
      null,
      2,
    ),
    'utf8',
  )

  console.log(
    JSON.stringify(
      {
        title,
        url,
        isLoginBlocked,
        bodyPreview: bodyText.slice(0, 500),
        artifacts: {
          screenshotPath,
          fullScreenshotPath,
          htmlPath,
          stylePath,
          networkPath,
          relevantNetworkPath,
        },
        interactions,
      },
      null,
      2,
    ),
  )
} finally {
  await browser.close()
}
