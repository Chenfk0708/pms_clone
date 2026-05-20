import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'scrm--huiyuan-zhongxin--huiyuan-quanyi'
const targetUrl = 'https://minsubao.localhome.cn/scrm/memberCenter/equity'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/scrm/memberCenter/equity'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const closeTimeoutMs = 5_000
let closeTimedOut = false

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
  await closeWithTimeout('browser', () => browser.close())
  if (closeTimedOut) {
    setTimeout(() => process.exit(0), 0)
  }
}

async function closeWithTimeout(label, close) {
  let timeoutId
  try {
    await Promise.race([
      close(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} close timed out`)), closeTimeoutMs)
      }),
    ])
  } catch (error) {
    closeTimedOut = true
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[capture-member-equity] ${message}`)
  } finally {
    clearTimeout(timeoutId)
  }
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
            text.includes('会员权益') ||
            text.includes('权益') ||
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

    const states = { default: await extractFacts(page) }
    for (const label of [
      '添 加',
      '排 序',
      '新增权益',
      '新建权益',
      '添加权益',
      '添加',
      '排序',
      '会员权益',
      '编辑',
      '删除',
      '启用',
      '禁用',
      '重置',
      '查询',
    ]) {
      const roleLocator = page.getByRole('button', { name: label }).first()
      const textLocator = page.getByText(label, { exact: true }).first()
      const locator = (await roleLocator.count().catch(() => 0)) > 0 ? roleLocator : textLocator
      if ((await locator.count().catch(() => 0)) === 0) continue
      try {
        await locator.click({ timeout: 2000 })
        await page.waitForTimeout(700)
        const stateName = label.replace(/\s+/g, '')
        const screenshotPath = path.join(artifactDirs.screenshots, `${stateName}-${side}-${stamp}.png`)
        await page.screenshot({ path: screenshotPath, fullPage: false })
        states[`afterClick:${label}`] = {
          ...(await extractFacts(page)),
          screenshotPath,
        }
        await page.keyboard.press('Escape').catch(() => {})
        await page.waitForTimeout(300)
      } catch (error) {
        states[`afterClick:${label}`] = { error: error.message }
      }
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

    const defaultFacts = states.default
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
      visibleTextSample: defaultFacts.bodyText.slice(0, 2000),
      buttons: defaultFacts.buttons.slice(0, 80),
      inputs: defaultFacts.inputs.slice(0, 30),
      tableHeaders: defaultFacts.tableHeaders,
    }
  } finally {
    await closeWithTimeout('page', () => page.close({ runBeforeUnload: false }))
    await closeWithTimeout('context', () => context.close())
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

    const isVisible = (element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }

    const bodyText = document.body?.innerText || ''
    const controls = Array.from(
      document.querySelectorAll('button,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
    )
      .filter(isVisible)
      .slice(0, 180)
      .map(describe)

    const tableHeaders = Array.from(document.querySelectorAll('th,.ant-table-thead .ant-table-cell'))
      .filter(isVisible)
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const tableTexts = Array.from(document.querySelectorAll('table,.ant-table'))
      .filter(isVisible)
      .slice(0, 10)
      .map(describe)

    const inputs = Array.from(document.querySelectorAll('input,textarea'))
      .filter(isVisible)
      .map((element) => ({
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value,
      }))
      .slice(0, 80)

    const buttons = Array.from(document.querySelectorAll('button,[role="button"]'))
      .filter(isVisible)
      .map((element) =>
        (element.innerText || element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
      )
      .filter(Boolean)
      .slice(0, 160)

    const keyElements = Array.from(
      document.querySelectorAll(
        '.ant-form,.ant-card,.ant-table,.ant-empty,.ant-select,.ant-modal,.ant-drawer,.page-content,.member,.equity,.benefit',
      ),
    )
      .filter(isVisible)
      .slice(0, 100)
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
