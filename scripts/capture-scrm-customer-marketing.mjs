import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'scrm--yingxiao-tuiguang--kehu-yingxiao'
const targetUrl = 'https://minsubao.localhome.cn/scrm/marketing/customer'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/scrm/marketing/customer'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv[2] ?? 'target'
const stamp =
  process.env.PMS_CAPTURE_STAMP ?? new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')

const artifactDirs = {
  screenshots: path.resolve('artifacts/screenshots', taskId),
  dom: path.resolve('artifacts/dom-snapshots', taskId),
  styles: path.resolve('artifacts/style-dumps', taskId),
  network: path.resolve('artifacts/network', taskId),
}

for (const directory of Object.values(artifactDirs)) {
  await fs.mkdir(directory, { recursive: true })
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
    await page
      .waitForFunction(
        () => {
          const text = document.body?.innerText || ''
          return (
            text.includes('客户营销') ||
            text.includes('营销推广') ||
            text.includes('路客云SCRM顾问') ||
            text.includes('限时试用') ||
            text.includes('账号登录') ||
            text.includes('请按住滑块')
          )
        },
        null,
        { timeout: 20_000 },
      )
      .catch(() => {})
    await page.waitForTimeout(1200)

    const defaultScreenshotPath = path.join(artifactDirs.screenshots, `default-${side}-${stamp}.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `full-${side}-${stamp}.png`)
    const domPath = path.join(artifactDirs.dom, `default-${side}-${stamp}.html`)
    const stylePath = path.join(artifactDirs.styles, `default-${side}-${stamp}.json`)
    const networkPath = path.join(artifactDirs.network, `default-${side}-${stamp}.json`)

    const states = {
      default: await extractFacts(page),
    }

    await page.screenshot({ path: defaultScreenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(domPath, await page.content(), 'utf8')

    for (const action of [
      ['客户营销', 'nav-customer-marketing'],
      ['优惠券', 'nav-coupon'],
      ['全员营销', 'nav-full-marketing'],
      ['限时试用', 'trial'],
      ['前往企业微信授权', 'wechat-auth'],
    ]) {
      await tryClickAndCapture(page, states, side, stamp, action[0], action[1])
    }

    await fs.writeFile(
      stylePath,
      JSON.stringify(
        {
          side,
          mode,
          stamp,
          finalUrl: page.url(),
          states,
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
      isLoginBlocked: /请按住滑块|账号登录|登录其他登录方式/.test(states.default.bodyText),
      hasBusinessShell: /SCRM|客户营销|营销推广|路客云SCRM顾问/.test(states.default.bodyText),
      artifactPaths: {
        defaultScreenshotPath,
        fullScreenshotPath,
        domPath,
        stylePath,
        networkPath,
      },
      visibleTextSample: states.default.bodyText.slice(0, 2200),
      buttons: states.default.buttons.slice(0, 80),
      inputs: states.default.inputs.slice(0, 30),
      tableHeaders: states.default.tableHeaders,
      keyElements: states.default.keyElements.slice(0, 30),
    }
  } finally {
    await context.close()
  }
}

async function tryClickAndCapture(page, states, side, currentStamp, label, stateName) {
  const locator = page.getByText(label, { exact: true }).first()
  if ((await locator.count().catch(() => 0)) === 0) return

  try {
    await locator.click({ timeout: 2500 })
    await page.waitForTimeout(800)
    const screenshotPath = path.join(artifactDirs.screenshots, `${stateName}-${side}-${currentStamp}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: false })
    states[stateName] = {
      ...(await extractFacts(page)),
      screenshotPath,
    }
  } catch (error) {
    states[stateName] = { error: error.message }
  }
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
      'backgroundImage',
      'border',
      'borderRadius',
      'boxShadow',
      'overflow',
      'gridTemplateColumns',
      'alignItems',
      'justifyContent',
      'gap',
    ]

    function stylesOf(element) {
      const computed = window.getComputedStyle(element)
      return Object.fromEntries(styleProps.map((prop) => [prop, computed[prop]]))
    }

    function describe(element) {
      const rect = element.getBoundingClientRect()
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 220),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        placeholder: element.getAttribute('placeholder'),
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 420),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        styles: stylesOf(element),
      }
    }

    const isVisible = (element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }

    const bodyText = document.body?.innerText || ''
    const controls = Array.from(
      document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
    )
      .filter(isVisible)
      .slice(0, 180)
      .map(describe)

    const tableHeaders = Array.from(document.querySelectorAll('th,.ant-table-thead .ant-table-cell'))
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const inputs = Array.from(document.querySelectorAll('input,textarea'))
      .map((element) => ({
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value,
      }))
      .slice(0, 80)

    const buttons = Array.from(document.querySelectorAll('button,[role="button"],a'))
      .filter(isVisible)
      .map((element) =>
        (element.innerText || element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
      )
      .filter(Boolean)
      .slice(0, 160)

    const keyElements = Array.from(
      document.querySelectorAll(
        '.ant-layout,.ant-menu,.ant-card,.ant-empty,.ant-modal,.ant-drawer,.page-content,.scrm-page,.scrm_customer_page,.marketingCustomer',
      ),
    )
      .filter(isVisible)
      .slice(0, 100)
      .map(describe)

    const visibleElements = Array.from(document.querySelectorAll('main *, .ant-layout-content *, body > div *'))
      .filter(isVisible)
      .slice(0, 260)
      .map(describe)

    return {
      url: location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
      },
      bodyText,
      controls,
      inputs,
      buttons,
      tableHeaders,
      keyElements,
      visibleElements,
    }
  })
}
