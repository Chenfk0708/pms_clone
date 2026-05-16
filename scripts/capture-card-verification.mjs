import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'dingdan--yushouquan-dingdan--kaquan-hexiao'
const targetUrl = 'https://minsubao.localhome.cn/mallManagement/verificationManagement'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/mallManagement/verificationManagement'
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
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('卡券核销') ||
          text.includes('核销状态') ||
          text.includes('券码') ||
          text.includes('暂无数据') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    ).catch(() => {})
    await page.waitForTimeout(1800)

    const defaultScreenshotPath = path.join(artifactDirs.screenshots, `default-${side}-${stamp}.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `full-${side}-${stamp}.png`)
    const domPath = path.join(artifactDirs.dom, `default-${side}-${stamp}.html`)
    const stylePath = path.join(artifactDirs.styles, `default-${side}-${stamp}.json`)
    const networkPath = path.join(artifactDirs.network, `default-${side}-${stamp}.json`)

    await page.screenshot({ path: defaultScreenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(domPath, await page.content(), 'utf8')

    const defaultFacts = await extractFacts(page)

    const states = {}
    states.default = defaultFacts

    const clickableLabels = ['核 销', '展开', '收起', '重 置', '重置', '查 询', '查询', '导出明细']
    for (const label of clickableLabels) {
      const locator = page.getByText(label, { exact: true }).first()
      if ((await locator.count().catch(() => 0)) === 0) continue
      try {
        await locator.click({ timeout: 2000 })
        await page.waitForTimeout(500)
        states[`afterClick:${label}`] = await extractFacts(page)
        if (label === '展开' || label === '核 销') {
          const stateName = label === '核 销' ? 'verify-modal' : 'expanded'
          const stateScreenshotPath = path.join(artifactDirs.screenshots, `${stateName}-${side}-${stamp}.png`)
          await page.screenshot({ path: stateScreenshotPath, fullPage: false })
          states[`afterClick:${label}`].screenshotPath = stateScreenshotPath
        }
      } catch (error) {
        states[`afterClick:${label}`] = { error: error.message }
      }
    }

    await captureFirstDropdown(page, side)

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
      isLoginBlocked: /请按住滑块|账号登录|登录/.test(defaultFacts.bodyText),
      artifactPaths: {
        defaultScreenshotPath,
        fullScreenshotPath,
        domPath,
        stylePath,
        networkPath,
      },
      visibleTextSample: defaultFacts.bodyText.slice(0, 1600),
      buttons: defaultFacts.buttons.slice(0, 40),
      inputs: defaultFacts.inputs.slice(0, 20),
      tableHeaders: defaultFacts.tableHeaders,
    }
  } finally {
    await context.close()
  }
}

async function captureFirstDropdown(page, side) {
  const combobox = page.locator('.ant-select-selector, button[aria-haspopup="listbox"]').first()
  if ((await combobox.count().catch(() => 0)) === 0) return

  await combobox.click({ timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(500)
  const dropdownScreenshotPath = path.join(artifactDirs.screenshots, `first-dropdown-${side}-${stamp}.png`)
  await page.screenshot({ path: dropdownScreenshotPath, fullPage: false }).catch(() => {})
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
    ]

    function stylesOf(element) {
      const computed = window.getComputedStyle(element)
      return Object.fromEntries(styleProps.map((prop) => [prop, computed[prop]]))
    }

    function describe(element) {
      const rect = element.getBoundingClientRect()
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 180),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        placeholder: element.getAttribute('placeholder'),
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 260),
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
      document.querySelectorAll('button,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      })
      .slice(0, 140)
      .map(describe)

    const tableHeaders = Array.from(document.querySelectorAll('th,.ant-table-thead .ant-table-cell,.card-verify-table__head > div'))
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const tableTexts = Array.from(document.querySelectorAll('table,.ant-table,.card-verify-table,.presale-order-table'))
      .slice(0, 8)
      .map(describe)

    const inputs = Array.from(document.querySelectorAll('input,textarea'))
      .map((element) => ({
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value,
      }))
      .slice(0, 80)

    const buttons = Array.from(document.querySelectorAll('button,[role="button"]'))
      .map((element) => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 120)

    const keyElements = Array.from(
      document.querySelectorAll('.ant-form,.ant-card,.ant-table,.ant-empty,.ant-select,.page-content,.card-verify-page,.presale-order-page'),
    )
      .slice(0, 60)
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
      tableTexts,
      keyElements,
    }
  })
}
