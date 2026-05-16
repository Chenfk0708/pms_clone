import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'fangtai--fangjia-guanli--jvdao-prjia'
const targetUrl = 'https://minsubao.localhome.cn/houseManage/channelPrice'
const localUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/houseManage/channelPrice'
const captureLocal = process.env.PMS_CAPTURE_LOCAL === '1'
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

const browser = await chromium.launch({
  executablePath: chromeExecutablePath,
  headless: true,
})

try {
  const target = await capturePage('target', targetUrl, { storageState })
  const result = { stamp, target }

  if (captureLocal) {
    result.local = await capturePage('local', localUrl)
  }

  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}

async function capturePage(side, url, contextOptions = {}) {
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
    page.on('response', async (response) => {
      const request = response.request()
      const parsedUrl = new URL(response.url())
      const isHudson = parsedUrl.hostname === 'hudson-prod.localhome.cn'
      const isRelevantPriceRequest =
        parsedUrl.pathname.includes('/roomCategoryStatuses/otaPmsPriceChange/channel/get') ||
        parsedUrl.pathname.includes('/select/channel/switching/get') ||
        parsedUrl.pathname.includes('/select/roomCategoryProducts/parentProduct/page/get') ||
        parsedUrl.pathname.includes('/roomCategories/page/get') ||
        parsedUrl.pathname.includes('/roomCategoryGroups/get') ||
        parsedUrl.pathname.includes('/roomCategoryPrice/salePriceSetting/get')

      if (!isHudson && !isRelevantPriceRequest) return

      let responseSummary = null
      try {
        const contentType = response.headers()['content-type'] ?? ''
        if (contentType.includes('application/json')) {
          const payload = await response.json()
          responseSummary = summarizePayload(payload)
        }
      } catch (error) {
        responseSummary = { parseError: error instanceof Error ? error.message : String(error) }
      }

      network.push({
        url: response.url(),
        pathname: parsedUrl.pathname,
        method: request.method(),
        status: response.status(),
        resourceType: request.resourceType(),
        postData: parsePostData(request.postData()),
        responseSummary,
      })
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1_000)

    const bodyText = await page.locator('body').innerText().catch(() => '')
    const isLoginBlocked = isBlocked(page.url(), bodyText)
    const screenshotPath = path.join(artifactDirs.screenshots, `real-requests-${side}-${stamp}.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `real-requests-full-${side}-${stamp}.png`)
    const htmlPath = path.join(artifactDirs.dom, `real-requests-${side}-${stamp}.html`)
    const stylePath = path.join(artifactDirs.styles, `real-requests-${side}-${stamp}.json`)
    const networkPath = path.join(artifactDirs.network, `real-requests-${side}-${stamp}.json`)

    await page.screenshot({ path: screenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(htmlPath, await page.content(), 'utf8')
    await fs.writeFile(stylePath, JSON.stringify(await extractPageState(page), null, 2), 'utf8')
    await fs.writeFile(
      networkPath,
      JSON.stringify(
        {
          side,
          url: page.url(),
          title: await page.title(),
          isLoginBlocked,
          requests: network,
        },
        null,
        2,
      ),
      'utf8',
    )

    return {
      url: page.url(),
      isLoginBlocked,
      requestCount: network.length,
      artifacts: {
        screenshotPath,
        fullScreenshotPath,
        htmlPath,
        stylePath,
        networkPath,
      },
    }
  } finally {
    await context.close()
  }
}

function parsePostData(postData) {
  if (!postData) return null
  try {
    return redactSecrets(JSON.parse(postData))
  } catch {
    return postData.slice(0, 2000)
  }
}

function summarizePayload(payload) {
  if (payload === null || typeof payload !== 'object') return { type: typeof payload }
  const root = Array.isArray(payload) ? payload : payload.data ?? payload.result ?? payload

  return {
    rootKeys: Object.keys(payload).slice(0, 20),
    dataType: Array.isArray(root) ? 'array' : typeof root,
    dataLength: Array.isArray(root) ? root.length : undefined,
    dataKeys: root && !Array.isArray(root) && typeof root === 'object' ? Object.keys(root).slice(0, 20) : undefined,
    sample: redactSecrets(sampleValue(root)),
  }
}

function sampleValue(value) {
  if (Array.isArray(value)) return value.slice(0, 2).map(sampleValue)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 12)
      .map(([key, item]) => [key, Array.isArray(item) ? `array(${item.length})` : item && typeof item === 'object' ? Object.keys(item).slice(0, 8) : item]),
  )
}

function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (/token|cookie|password|passwd|secret|authorization|mobile|phone|mpQrUrl|appKey|accid/i.test(key)) {
        return [key, '[REDACTED]']
      }
      return [key, redactSecrets(item)]
    }),
  )
}

async function extractPageState(page) {
  return page.evaluate(() => {
    const controls = Array.from(document.querySelectorAll('button,input,select,[role="button"],[role="tab"],[role="option"],.ant-select'))
      .slice(0, 160)
      .map((node) => {
        const rect = node.getBoundingClientRect()
        const style = window.getComputedStyle(node)

        return {
          tag: node.tagName,
          className: node.getAttribute('class') ?? '',
          role: node.getAttribute('role') ?? '',
          ariaLabel: node.getAttribute('aria-label') ?? '',
          text: (node.textContent ?? node.getAttribute('placeholder') ?? '').trim().replace(/\s+/g, ' ').slice(0, 180),
          box: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          display: style.display,
        }
      })

    return {
      location: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.slice(0, 7000),
      controls,
    }
  })
}

function isBlocked(url, bodyText) {
  return (
    bodyText.includes('账号登录') ||
    bodyText.includes('登录密码') ||
    bodyText.includes('请按住滑块') ||
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
