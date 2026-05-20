import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji'
const TARGET_URL = 'https://minsubao.localhome.cn/statistics/presale'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? ''
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const stateArg = process.argv.find((arg) => arg.startsWith('--state='))
const state = stateArg ? stateArg.split('=')[1] : 'default'
const stamp = process.env.PMS_CAPTURE_STAMP ?? new Date().toISOString().replace(/\D/g, '').slice(0, 14)

const artifactRoots = {
  screenshots: path.resolve('artifacts/screenshots', TASK_ID),
  dom: path.resolve('artifacts/dom-snapshots', TASK_ID),
  styles: path.resolve('artifacts/style-dumps', TASK_ID),
  network: path.resolve('artifacts/network', TASK_ID),
}

for (const directory of Object.values(artifactRoots)) {
  await fs.mkdir(directory, { recursive: true })
}

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stamp}-${suffix}.${extension}`)
}

function normalizeText(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

function summarizeValue(value, depth = 0) {
  if (value === null) return null
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      sample: value.slice(0, 2).map((item) => summarizeValue(item, depth + 1)),
    }
  }
  if (typeof value === 'object') {
    if (depth >= 3) return { type: 'object', keys: Object.keys(value).slice(0, 24) }
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 40)
        .map(([key, item]) => [key, summarizeValue(item, depth + 1)]),
    )
  }
  if (typeof value === 'string') {
    if (/token|cookie|authorization|password|mobile/i.test(value)) return '[redacted]'
    return value.length > 180 ? `${value.slice(0, 180)}...` : value
  }
  return value
}

function parsePostData(request) {
  const body = request.postData()
  if (!body) return null

  try {
    return summarizeValue(JSON.parse(body))
  } catch {
    return normalizeText(body).slice(0, 300)
  }
}

function shouldCapturePayload(url) {
  return (
    url.includes('/order/report/get') ||
    url.includes('/report/store/management/get') ||
    url.includes('/select/poi/page/get') ||
    url.includes('/roomCategories/page/get') ||
    url.includes('/orders/strongReminder/page/get') ||
    url.includes('/edition/resource/get') ||
    url.includes('/paymentTypes/get')
  )
}

function captureUrlForState() {
  if (mode !== 'clone') return TARGET_URL
  if (!LOCAL_URL) throw new Error('PMS_LOCAL_URL is required when running clone capture for presale sales report')
  if (state === 'loading') {
    const url = new URL(LOCAL_URL)
    url.searchParams.set('mockDelayMs', '5000')
    return url.toString()
  }
  if (state !== 'success' && state !== 'empty' && state !== 'error') return LOCAL_URL

  const url = new URL(LOCAL_URL)
  url.searchParams.set('mockState', state)
  return url.toString()
}

async function isVisible(locator) {
  return (await locator.count().catch(() => 0)) > 0 && (await locator.first().isVisible().catch(() => false))
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const candidates = [
      page.getByRole('button', { name: new RegExp(label) }).first(),
      page.getByRole('link', { name: new RegExp(label) }).first(),
      page.getByText(label, { exact: true }).first(),
      page.locator(`[aria-label*="${label}"]`).first(),
      page.locator(`input[placeholder*="${label}"]`).first(),
      page.locator(`.ant-select-selector:has-text("${label}")`).first(),
    ]

    for (const locator of candidates) {
      if (!(await isVisible(locator))) continue

      try {
        await locator.click({ timeout: 2500 })
        await page.waitForTimeout(900)
        return label
      } catch {
        // Try the next candidate.
      }
    }
  }

  return null
}

async function clickSelectByIndex(page, index, action) {
  const selector = page.locator('.ant-select-selector').nth(index)
  if (!(await isVisible(selector))) return { action, clicked: null, reason: `select-${index}-not-visible` }

  await selector.click({ timeout: 2500 })
  await page.waitForTimeout(900)
  return { action, clicked: `select-${index}` }
}

async function waitForBusinessSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('预售券销售统计') ||
          text.includes('经营指标') ||
          text.includes('增长趋势分析') ||
          text.includes('小程序订单来源分析') ||
          text.includes('查看明细数据') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 30_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1800)
}

async function applyState(page) {
  const interactions = []

  if (state === 'date-range') {
    const dateInput = page
      .locator('input[placeholder*="开始"], input[placeholder*="日期"], input[placeholder*="选择"], input[class*="picker"]')
      .first()
    if (await isVisible(dateInput)) {
      await dateInput.click({ timeout: 2500 }).catch(() => {})
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-date-picker', clicked: 'first-date-input' })
    } else {
      const clicked = await clickFirstVisible(page, ['今天', '昨天', '本周', '本月', '日期'])
      interactions.push({ action: 'open-date-picker-fallback', clicked })
    }
  }

  if (state === 'store-dropdown') {
    const clicked = await clickFirstVisible(page, ['全部门店', '门店'])
    interactions.push({ action: 'open-store-dropdown', clicked })
  }

  if (state === 'first-select') interactions.push(await clickSelectByIndex(page, 0, 'open-first-select'))
  if (state === 'second-select') interactions.push(await clickSelectByIndex(page, 1, 'open-second-select'))
  if (state === 'third-select') interactions.push(await clickSelectByIndex(page, 2, 'open-third-select'))

  if (state === 'collapsed') {
    const clicked = await clickFirstVisible(page, ['收起'])
    interactions.push({ action: 'click-collapse', clicked })
  }

  if (state === 'expanded') {
    const clicked = await clickFirstVisible(page, ['展开'])
    interactions.push({ action: 'click-expand', clicked })
  }

  if (state === 'description') {
    const clicked = await clickFirstVisible(page, ['说明', '描述'])
    interactions.push({ action: 'open-description', clicked })
  }

  if (state === 'detail-link') {
    const clicked = await clickFirstVisible(page, ['查看明细数据'])
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1200)
    interactions.push({ action: 'open-detail-data', clicked, url: page.url() })
  }

  if (state === 'orders-tab') {
    const clicked = await clickFirstVisible(page, ['订单数'])
    interactions.push({ action: 'switch-trend-dimension', clicked, url: page.url() })
  }

  if (state === 'query') {
    const input = page.locator('input[placeholder*="搜索"], input[placeholder*="订单"], input[type="text"]').last()
    if (await isVisible(input)) {
      await input.fill('预售券')
      interactions.push({ action: 'fill-keyword', value: '预售券' })
    }

    const clicked = await clickFirstVisible(page, ['查询', '搜索'])
    interactions.push({ action: 'click-query', clicked })
  }

  return interactions
}

async function screenshotFirstVisible(page, selectors, suffix) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if (!(await isVisible(locator))) continue

    try {
      const outputPath = fileFor(artifactRoots.screenshots, suffix, 'png')
      await locator.screenshot({ path: outputPath })
      return { selector, outputPath }
    } catch {
      // Try the next selector.
    }
  }

  return null
}

async function extractFacts(page, interactions, componentScreenshots) {
  return page.evaluate(
    ({ capturedInteractions, capturedComponentScreenshots }) => {
      const styleProps = [
        'display',
        'position',
        'width',
        'height',
        'minHeight',
        'padding',
        'margin',
        'fontSize',
        'fontWeight',
        'lineHeight',
        'letterSpacing',
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

      function elementVisible(element) {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      }

      function describe(element) {
        const rect = element.getBoundingClientRect()
        const computed = window.getComputedStyle(element)
        const styles = {}
        for (const prop of styleProps) styles[prop] = computed[prop]

        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 220),
          id: element.id || null,
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
          styles,
        }
      }

      const bodyText = document.body?.innerText || ''
      const visibleElements = [...document.querySelectorAll('body *')].filter(elementVisible).slice(0, 520).map(describe)
      const controls = [
        ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
      ]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 300)
      const buttons = [...document.querySelectorAll('button,[role="button"],a')]
        .filter(elementVisible)
        .map((element) => ({
          text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
            .replace(/\s+/g, ' ')
            .trim(),
          href: element.getAttribute('href'),
          className: String(element.className || '').slice(0, 180),
        }))
        .filter((item) => item.text)
        .slice(0, 200)
      const inputs = [...document.querySelectorAll('input,textarea')]
        .filter(elementVisible)
        .map((element) => ({
          type: element.getAttribute('type'),
          placeholder: element.getAttribute('placeholder'),
          ariaLabel: element.getAttribute('aria-label'),
          value: element.value,
        }))
        .slice(0, 120)
      const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,[role="columnheader"]')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 200)
      const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 60)
      const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 60)
      const options = [...document.querySelectorAll('[role="option"],.ant-select-item-option,.ant-dropdown-menu-item,li')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 220)
      const keyElements = visibleElements.filter((item) =>
        /预售券|销售统计|经营指标|增长趋势分析|小程序订单来源分析|交易额|订单数|暂无数据|查看明细数据/.test(item.text),
      )
      const serviceContract = document.querySelector('[data-testid="presale-sales-service-contract"]')

      return {
        url: location.href,
        title: document.title,
        bodyLength: bodyText.length,
        bodyTextSample: bodyText.slice(0, 10000),
        isLoginBlocked:
          bodyText.includes('账号登录') || bodyText.includes('账户登录') || bodyText.includes('请按住滑块') || bodyText.includes('登录其他登录方式'),
        hasBusinessText:
          bodyText.includes('预售券销售统计') ||
          bodyText.includes('经营指标') ||
          bodyText.includes('增长趋势分析') ||
          bodyText.includes('小程序订单来源分析'),
        interactions: capturedInteractions,
        componentScreenshots: capturedComponentScreenshots,
        controls,
        buttons,
        inputs,
        tableHeaders,
        dialogs,
        dropdowns,
        options,
        keyElements,
        serviceContract: serviceContract
          ? {
              provider: serviceContract.getAttribute('data-provider'),
              state: serviceContract.getAttribute('data-state'),
              text: (serviceContract.textContent || '').trim(),
            }
          : null,
        visibleElements,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
      }
    },
    { capturedInteractions: interactions, capturedComponentScreenshots: componentScreenshots },
  )
}

async function main() {
  if (mode === 'target') await fs.access(STORAGE_STATE)
  await fs.access(CHROME_PATH)

  const network = []
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })

  try {
    const context = await browser.newContext({
      ...(mode === 'target' ? { storageState: STORAGE_STATE } : {}),
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    })
    const page = await context.newPage()
    page.on('response', async (response) => {
      const request = response.request()
      const entry = {
        url: response.url(),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        contentType: response.headers()['content-type'] ?? '',
        postData: parsePostData(request),
      }

      if (shouldCapturePayload(response.url())) {
        try {
          if ((response.headers()['content-type'] || '').includes('application/json')) {
            entry.responseSummary = summarizeValue(await response.json())
          } else {
            entry.responseSummary = normalizeText(await response.text()).slice(0, 600)
          }
        } catch (error) {
          entry.responseSummaryError = error instanceof Error ? error.message : String(error)
        }
      }

      network.push(entry)
    })

    await page.goto(captureUrlForState(), {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    if (state === 'loading') {
      await page.waitForTimeout(400)
    } else {
      await waitForBusinessSurface(page)
    }
    const interactions = await applyState(page)

    const viewportScreenshot = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullScreenshot = fileFor(artifactRoots.screenshots, 'full', 'png')
    await page.screenshot({ path: viewportScreenshot })
    await page.screenshot({ path: fullScreenshot, fullPage: true })

    const componentScreenshots = []
    const metricsShot = await screenshotFirstVisible(
      page,
      ['.presale-sales-kpi-section', '[aria-label="预售券经营指标"]', '.presale-sales-metrics'],
      'component-metrics',
    )
    if (metricsShot) componentScreenshots.push(metricsShot)

    const trendShot = await screenshotFirstVisible(
      page,
      ['.presale-sales-trend', '[aria-label="增长趋势分析"]'],
      'component-trend',
    )
    if (trendShot) componentScreenshots.push(trendShot)

    const sourceShot = await screenshotFirstVisible(
      page,
      ['.presale-sales-source', '[aria-label="小程序订单来源分析"]', '.presale-sales-source-table-wrap'],
      'component-source',
    )
    if (sourceShot) componentScreenshots.push(sourceShot)

    const facts = await extractFacts(page, interactions, componentScreenshots)
    const domFile = fileFor(artifactRoots.dom, 'page', 'html')
    const styleFile = fileFor(artifactRoots.styles, 'facts', 'json')
    const networkFile = fileFor(artifactRoots.network, 'responses', 'json')

    await fs.writeFile(domFile, await page.content(), 'utf8')
    await fs.writeFile(styleFile, JSON.stringify({ mode, state, stamp, facts }, null, 2), 'utf8')
    await fs.writeFile(
      networkFile,
      JSON.stringify({ mode, state, stamp, url: page.url(), responses: network }, null, 2),
      'utf8',
    )

    console.log(
      JSON.stringify(
        {
          mode,
          state,
          stamp,
          url: page.url(),
          isLoginBlocked: facts.isLoginBlocked,
          hasBusinessText: facts.hasBusinessText,
          bodyLength: facts.bodyLength,
          buttons: facts.buttons.slice(0, 90),
          inputs: facts.inputs.slice(0, 50),
          tableHeaders: facts.tableHeaders.slice(0, 100),
          options: facts.options.slice(0, 90),
          interactions,
          componentScreenshots,
          serviceContract: facts.serviceContract,
          screenshots: [viewportScreenshot, fullScreenshot],
          dom: domFile,
          styles: styleFile,
          network: networkFile,
          bodySample: normalizeText(facts.bodyTextSample).slice(0, 2200),
        },
        null,
        2,
      ),
    )

    await context.close()
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
