import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao'
const targetUrl = 'https://minsubao.localhome.cn/customer/staffList'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4189/customer/staffList'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv[2] ?? 'target'
const stateArg = process.argv.find((arg) => arg.startsWith('--state='))
const cloneState = stateArg ? stateArg.split('=')[1] : 'default'
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

  if (side === 'clone') {
    await page.addInitScript((state) => {
      window.localStorage.setItem('pms.staffList.provider', 'mock')
      if (state === 'empty' || state === 'error') {
        window.localStorage.setItem('pms.staffList.mockState', state)
        return
      }
      window.localStorage.removeItem('pms.staffList.mockState')
    }, cloneState)
  }

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
            text.includes('企微员工') ||
            text.includes('员工姓名') ||
            text.includes('员工列表') ||
            text.includes('客户数') ||
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

    const stateName = side === 'clone' ? cloneState : 'default'
    const defaultScreenshotPath = path.join(artifactDirs.screenshots, `${stateName}-${side}-${stamp}.png`)
    const fullScreenshotPath = path.join(artifactDirs.screenshots, `full-${stateName}-${side}-${stamp}.png`)
    const domPath = path.join(artifactDirs.dom, `${stateName}-${side}-${stamp}.html`)
    const stylePath = path.join(artifactDirs.styles, `${stateName}-${side}-${stamp}.json`)
    const networkPath = path.join(artifactDirs.network, `${stateName}-${side}-${stamp}.json`)

    await page.screenshot({ path: defaultScreenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })
    await fs.writeFile(domPath, await page.content(), 'utf8')

    const states = { default: await extractFacts(page) }
    if (stateName === 'default') {
      for (const label of [
        '展开',
        '收起',
        '重 置',
        '查 询',
        '同步企微员工',
        '添加员工',
        '新建员工',
        '立即开通',
        '商品详情',
        '导出数据',
        '导出',
        '授权',
        '前往授权',
      ]) {
        await tryClickAndCapture(page, states, side, stamp, label)
      }
      await captureFirstDropdown(page, side, stamp, stateName)
    }

    await fs.writeFile(
      stylePath,
      JSON.stringify(
        {
          side,
          mode,
          state: stateName,
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
    await fs.writeFile(
      networkPath,
      JSON.stringify(
        {
          capturedAt: stamp,
          side,
          state: stateName,
          diagnostics: states.default.contract,
          forbiddenTermsFound: ['mock 数据', 'mock provider', '未接入', '阻塞', '后端接口未完成'].filter((term) =>
            states.default.bodyText.includes(term),
          ),
          responses: network,
        },
        null,
        2,
      ),
      'utf8',
    )

    const defaultFacts = states.default
    return {
      side,
      state: stateName,
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
      buttons: defaultFacts.buttons.slice(0, 60),
      inputs: defaultFacts.inputs.slice(0, 30),
      tableHeaders: defaultFacts.tableHeaders,
    }
  } finally {
    await context.close()
  }
}

async function tryClickAndCapture(page, states, side, stamp, label) {
  const roleLocator = page.getByRole('button', { name: label }).first()
  const textLocator = page.getByText(label, { exact: true }).first()
  const locator = (await roleLocator.count().catch(() => 0)) > 0 ? roleLocator : textLocator
  if ((await locator.count().catch(() => 0)) === 0) return

  try {
    await locator.click({ timeout: 2500 })
    await page.waitForTimeout(800)
    const clickStateName = label.replace(/\s+/g, '')
    const screenshotPath = path.join(artifactDirs.screenshots, `${clickStateName}-${side}-${stamp}.png`)
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

async function captureFirstDropdown(page, side, stamp, stateName) {
  const combobox = page.locator('.ant-select-selector, button[aria-haspopup="listbox"], [role="combobox"]').first()
  if ((await combobox.count().catch(() => 0)) === 0) return

  await combobox.click({ timeout: 2500 }).catch(() => {})
  await page.waitForTimeout(500)
  const dropdownScreenshotPath = path.join(artifactDirs.screenshots, `first-dropdown-${stateName}-${side}-${stamp}.png`)
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
      .slice(0, 180)
      .map(describe)

    const tableHeaders = Array.from(document.querySelectorAll('th,.ant-table-thead .ant-table-cell,.staff-list-table__head > div'))
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

    const buttons = Array.from(document.querySelectorAll('button,[role="button"]'))
      .map((element) => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 160)

    const keyElements = Array.from(
      document.querySelectorAll('.ant-form,.ant-card,.ant-table,.ant-empty,.ant-select,.page-content,.staffList,.customer-staff,.staff-list-page'),
    )
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
      contract: (() => {
        const node = document.querySelector('[data-testid="staff-list-contract"]')
        if (!node) return null
        try {
          return JSON.parse(node.textContent || '{}')
        } catch {
          return {
            raw: node.textContent || '',
          }
        }
      })(),
      controls,
      inputs,
      buttons,
      tableHeaders,
      keyElements,
    }
  })
}
