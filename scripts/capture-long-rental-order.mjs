import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'dingdan--zhusu-dingdan--changzu-dingdan'
const targetUrl = 'https://minsubao.localhome.cn/order/house-longRental-order/list'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/order/house-longRental-order/list'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const artifactDirs = {
  screenshots: path.resolve('artifacts/screenshots', taskId),
  dom: path.resolve('artifacts/dom-snapshots', taskId),
  styles: path.resolve('artifacts/style-dumps', taskId),
  network: path.resolve('artifacts/network', taskId),
}

const mode = process.argv[2] ?? 'target'
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')

for (const dir of Object.values(artifactDirs)) {
  await fs.mkdir(dir, { recursive: true })
}

const browser = await chromium.launch({
  executablePath: chromeExecutablePath,
  headless: true,
})

try {
  if (mode === 'target' || mode === 'both') {
    const result = await captureSide('target', targetUrl, { storageState })
    console.log(JSON.stringify(result, null, 2))
  }

  if (mode === 'clone' || mode === 'both') {
    const result = await captureSide('clone', cloneUrl, {})
    console.log(JSON.stringify(result, null, 2))
  }
} finally {
  await browser.close()
}

async function captureSide(side, url, contextOptions) {
  const network = []
  const context = await browser.newContext({
    ...contextOptions,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  const page = await context.newPage()

  page.on('response', (response) => {
    const request = response.request()
    network.push({
      url: response.url(),
      method: request.method(),
      status: response.status(),
      resourceType: request.resourceType(),
      contentType: response.headers()['content-type'] ?? '',
    })
  })

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1500)

    const defaultScreenshotPath = path.join(artifactDirs.screenshots, `default-${side}-${stamp}.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `full-${side}-${stamp}.png`)
    const domPath = path.join(artifactDirs.dom, `default-${side}-${stamp}.html`)
    const stylePath = path.join(artifactDirs.styles, `default-${side}-${stamp}.json`)
    const networkPath = path.join(artifactDirs.network, `default-${side}-${stamp}.json`)

    await page.screenshot({ path: defaultScreenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(domPath, await page.content(), 'utf8')

    const summary = await page.evaluate(() => {
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
        'zIndex',
      ]

      const styleOf = (element) => {
        const computed = window.getComputedStyle(element)
        return Object.fromEntries(styleProps.map((prop) => [prop, computed[prop]]))
      }

      const describe = (element) => {
        const rect = element.getBoundingClientRect()
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 180),
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240),
          placeholder: element.getAttribute('placeholder'),
          value: element.value,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          styles: styleOf(element),
        }
      }

      const selectors = [
        'body',
        '#root',
        '.ant-table',
        '.ant-table-wrapper',
        '.ant-table-thead',
        '.ant-table-tbody',
        '.ant-form',
        '.ant-btn',
        '.ant-tabs',
        '.ant-pagination',
        '.data-table',
        '.toolbar-card',
        '.table-card',
        '.page-content',
        '.page-header',
      ]

      const selectorMatches = Object.fromEntries(
        selectors.map((selector) => [
          selector,
          Array.from(document.querySelectorAll(selector))
            .slice(0, 8)
            .map((element) => describe(element)),
        ]),
      )

      const controls = Array.from(document.querySelectorAll('button,input,select,textarea,[role="button"],[role="tab"],[role="combobox"]'))
        .slice(0, 120)
        .map((element) => describe(element))

      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map((element) => describe(element))
      const tableTexts = Array.from(document.querySelectorAll('table, .ant-table, .data-table'))
        .slice(0, 6)
        .map((element) => describe(element))

      return {
        url: location.href,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: window.devicePixelRatio,
        },
        bodyText: (document.body.innerText || '').replace(/\s+\n/g, '\n').slice(0, 10000),
        headings,
        controls,
        tableTexts,
        selectorMatches,
      }
    })

    let expandedSummary = null
    const expandButton = page.getByText(/^展开$/).first()
    if (await expandButton.count().catch(() => 0)) {
      await expandButton.click().catch(() => {})
      await page.waitForTimeout(500)
      const expandedScreenshotPath = path.join(artifactDirs.screenshots, `expanded-${side}-${stamp}.png`)
      await page.screenshot({ path: expandedScreenshotPath, fullPage: false })
      expandedSummary = await page.evaluate(() => ({
        bodyText: (document.body.innerText || '').replace(/\s+\n/g, '\n').slice(0, 10000),
      }))
    }

    let detailSummary = null
    const detailButton = page.getByRole('button', { name: '详情' }).first()
    if (await detailButton.count().catch(() => 0)) {
      await detailButton.click().catch(() => {})
      await page.waitForTimeout(700)
      const detailScreenshotPath = path.join(artifactDirs.screenshots, `detail-${side}-${stamp}.png`)
      await page.screenshot({ path: detailScreenshotPath, fullPage: false })
      detailSummary = await page.evaluate(() => ({
        bodyText: (document.body.innerText || '').replace(/\s+\n/g, '\n').slice(0, 10000),
      }))
    }

    await fs.writeFile(
      stylePath,
      JSON.stringify(
        {
          ...summary,
          expandedSummary,
          detailSummary,
          artifacts: {
            defaultScreenshotPath,
            fullScreenshotPath,
            domPath,
            stylePath,
            networkPath,
          },
        },
        null,
        2,
      ),
      'utf8',
    )
    await fs.writeFile(networkPath, JSON.stringify({ capturedAt: stamp, responses: network }, null, 2), 'utf8')

    return {
      side,
      finalUrl: page.url(),
      isLoginBlocked: /请按住滑块|账号登录|登录/.test(summary.bodyText),
      artifactPaths: {
        defaultScreenshotPath,
        fullScreenshotPath,
        domPath,
        stylePath,
        networkPath,
      },
      visibleTextSample: summary.bodyText.slice(0, 1500),
    }
  } finally {
    await context.close()
  }
}
