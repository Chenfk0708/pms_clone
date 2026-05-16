import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju'
const targetUrl = 'https://minsubao.localhome.cn/channels/globalRadar/globalData'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/channels/globalRadar/globalData'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv[2] ?? 'target'
const runInteractions = process.argv.includes('--interaction')
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

if (!fsSync.existsSync(chromeExecutablePath)) {
  throw new Error(`Missing Chrome executable: ${chromeExecutablePath}`)
}

if ((mode === 'target' || mode === 'both') && !fsSync.existsSync(storageState)) {
  throw new Error(`Missing storageState: ${storageState}`)
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
      url: sanitizeUrl(response.url()),
      method: request.method(),
      status: response.status(),
      resourceType: request.resourceType(),
      contentType: response.headers()['content-type'] ?? '',
    })
  })

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await waitForSurface(page)

    const defaultScreenshotPath = path.join(artifactDirs.screenshots, `default-${side}-${stamp}.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `full-${side}-${stamp}.png`)
    const domPath = path.join(artifactDirs.dom, `default-${side}-${stamp}.html`)
    const stylePath = path.join(artifactDirs.styles, `default-${side}-${stamp}.json`)
    const networkPath = path.join(artifactDirs.network, `default-${side}-${stamp}.json`)

    await page.screenshot({ path: defaultScreenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(domPath, await page.content(), 'utf8')

    const states = {
      default: await extractFacts(page),
    }

    if (runInteractions) {
      for (const [label, stateName] of [
        ['携程', 'tab-ctrip'],
        ['美团', 'tab-meituan'],
        ['立即开通', 'open-now'],
        ['全域数据', 'nav-global-data'],
        ['配置中心', 'nav-global-setting'],
        ['数据与配置', 'nav-data-config'],
        ['全部门店', 'store-filter'],
        ['刷新', 'refresh'],
      ]) {
        await captureClickState(page, url, states, side, label, stateName)
      }

      await captureHoverState(page, states, side)
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
      isLoginBlocked: states.default.isLoginBlocked,
      hasGlobalRadarText: states.default.hasGlobalRadarText,
      bodyLength: states.default.bodyText.length,
      artifactPaths: {
        defaultScreenshotPath,
        fullScreenshotPath,
        domPath,
        stylePath,
        networkPath,
      },
      visibleTextSample: states.default.bodyText.slice(0, 2400),
      buttons: states.default.buttons.slice(0, 120),
      inputs: states.default.inputs.slice(0, 40),
      tableHeaders: states.default.tableHeaders,
      keyElements: states.default.keyElements.slice(0, 40),
      capturedStates: Object.keys(states),
    }
  } finally {
    await context.close()
  }
}

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.length > 80 ||
          text.includes('全域数据') ||
          text.includes('AI全域雷达') ||
          text.includes('服务质量') ||
          text.includes('数据与配置') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1500)
}

async function captureClickState(page, url, states, side, label, stateName) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await waitForSurface(page)

  const locator = page.getByText(label, { exact: true }).first()
  if ((await locator.count().catch(() => 0)) === 0) {
    states[stateName] = { missing: label }
    return
  }

  try {
    await locator.click({ timeout: 2500 })
    await page.waitForTimeout(900)
    const screenshotPath = path.join(artifactDirs.screenshots, `${stateName}-${side}-${stamp}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: false })
    states[stateName] = {
      label,
      screenshotPath,
      ...(await extractFacts(page)),
    }
  } catch (error) {
    states[stateName] = { label, error: error.message }
  }
}

async function captureHoverState(page, states, side) {
  await page.goto(side === 'target' ? targetUrl : cloneUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await waitForSurface(page)

  const candidates = page.locator('button,a,[role="button"],.ant-card,.radar-card').filter({ hasText: /.+/ })
  if ((await candidates.count().catch(() => 0)) === 0) {
    states.hover = { missing: 'interactive candidate' }
    return
  }

  try {
    await candidates.first().hover({ timeout: 2500 })
    await page.waitForTimeout(500)
    const screenshotPath = path.join(artifactDirs.screenshots, `hover-${side}-${stamp}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: false })
    states.hover = {
      screenshotPath,
      ...(await extractFacts(page)),
    }
  } catch (error) {
    states.hover = { error: error.message }
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
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 520),
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
      .slice(0, 220)
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
      .slice(0, 180)

    const keyElements = Array.from(
      document.querySelectorAll(
        [
          '.ant-layout',
          '.ant-menu',
          '.ant-card',
          '.ant-empty',
          '.ant-tabs',
          '.ant-table-wrapper',
          '.ant-modal',
          '.ant-drawer',
          '.topbar',
          '.sidebar',
          '.page-content',
          '.radar-page',
          '.radar-tabs',
          '.radar-card',
          '.radar-banner',
        ].join(','),
      ),
    )
      .filter(isVisible)
      .slice(0, 120)
      .map(describe)

    const visibleElements = Array.from(document.querySelectorAll('main *, .ant-layout-content *, body > div *'))
      .filter(isVisible)
      .slice(0, 320)
      .map(describe)

    const assets = Array.from(document.querySelectorAll('img,svg,canvas'))
      .filter(isVisible)
      .slice(0, 100)
      .map((element) => ({
        ...describe(element),
        src: element.getAttribute('src'),
        alt: element.getAttribute('alt'),
      }))

    const backgroundImages = Array.from(document.querySelectorAll('*'))
      .filter(isVisible)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 120),
        backgroundImage: window.getComputedStyle(element).backgroundImage,
      }))
      .filter((item) => item.backgroundImage && item.backgroundImage !== 'none')
      .slice(0, 100)

    const selectors = {}
    for (const selector of [
      'body',
      '.topbar',
      '.sidebar',
      '.page-content',
      '.ant-layout',
      '.ant-layout-content',
      '.ant-menu',
      '.ant-card',
      '.radar-page',
      '.radar-tabs',
      '.radar-card',
      '.radar-banner',
    ]) {
      const element = document.querySelector(selector)
      if (element && isVisible(element)) selectors[selector] = describe(element)
    }

    return {
      url: location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
      },
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式') ||
        bodyText.includes('登录'),
      hasGlobalRadarText:
        bodyText.includes('AI全域雷达') ||
        bodyText.includes('全域数据') ||
        bodyText.includes('服务质量') ||
        bodyText.includes('数据与配置'),
      bodyText,
      controls,
      inputs,
      buttons,
      tableHeaders,
      keyElements,
      visibleElements,
      assets,
      backgroundImages,
      selectors,
    }
  })
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
