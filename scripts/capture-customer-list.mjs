import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'scrm--kehu-guanli--kehu-liebiao'
const targetUrl = 'https://minsubao.localhome.cn/customer/list'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/customer/list'
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
    await page
      .waitForFunction(
        () => {
          const text = document.body?.innerText || ''
          return (
            text.includes('客户列表') ||
            text.includes('客户搜索') ||
            text.includes('添加客户') ||
            text.includes('客户信息') ||
            text.includes('暂无数据') ||
            text.includes('账号登录') ||
            text.includes('请按住滑块')
          )
        },
        null,
        { timeout: 20_000 },
      )
      .catch(() => {})
    await page.waitForTimeout(1800)

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

    await tryClickAndCapture(page, states, side, stamp, '展开', 'expanded')
    await tryClickAndCapture(page, states, side, stamp, '添加客户', 'add-customer')
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
      isLoginBlocked: /请按住滑块|账号登录|登录/.test(states.default.bodyText),
      artifactPaths: {
        defaultScreenshotPath,
        fullScreenshotPath,
        domPath,
        stylePath,
        networkPath,
      },
      visibleTextSample: states.default.bodyText.slice(0, 1800),
      buttons: states.default.buttons.slice(0, 60),
      inputs: states.default.inputs.slice(0, 30),
      tableHeaders: states.default.tableHeaders,
    }
  } finally {
    await context.close()
  }
}

async function tryClickAndCapture(page, states, side, stamp, label, stateName) {
  const locator = await findAction(page, label)
  if ((await locator.count().catch(() => 0)) === 0) return

  try {
    await locator.click({ timeout: 2500 })
    await page.waitForTimeout(700)
    const screenshotPath = path.join(artifactDirs.screenshots, `${stateName}-${side}-${stamp}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: false })
    states[stateName] = {
      ...(await extractFacts(page)),
      screenshotPath,
    }
  } catch (error) {
    states[stateName] = { error: error.message }
  }
}

async function findAction(page, label) {
  const button = page.getByRole('button', { name: new RegExp(`^${escapeRegExp(label)}`) }).first()
  if ((await button.count().catch(() => 0)) > 0) return button
  return page.getByText(label, { exact: true }).first()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function captureFirstDropdown(page, side) {
  const combobox = page.locator('.ant-select-selector, button[aria-haspopup="listbox"], [role="combobox"]').first()
  if ((await combobox.count().catch(() => 0)) === 0) return

  await combobox.click({ timeout: 2500 }).catch(() => {})
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
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 320),
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
      .slice(0, 160)
      .map(describe)

    const tableHeaders = Array.from(document.querySelectorAll('th,.ant-table-thead .ant-table-cell,.customer-list-table__head > div'))
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const tables = Array.from(document.querySelectorAll('table,.ant-table,.customer-list-table'))
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
      .slice(0, 140)

    const keyElements = Array.from(
      document.querySelectorAll('.ant-form,.ant-card,.ant-table,.ant-empty,.ant-select,.page-content,.customer-list-page'),
    )
      .slice(0, 80)
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
      tables,
      keyElements,
    }
  })
}
