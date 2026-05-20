import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'baobiao--tongji-baobiao--shouru-baobiao'
const TARGET_URL = 'https://minsubao.localhome.cn/statistics/stay'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/statistics/stay'
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

function resolveCloneMockState() {
  if (state === 'empty' || state === 'error') return state
  return 'success'
}

async function isVisible(locator) {
  return (await locator.count().catch(() => 0)) > 0 && (await locator.first().isVisible().catch(() => false))
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const candidates = [
      page.getByRole('button', { name: new RegExp(label) }).first(),
      page.getByText(label, { exact: true }).first(),
      page.locator(`input[placeholder*="${label}"]`).first(),
      page.locator(`[aria-label*="${label}"]`).first(),
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

async function waitForBusinessSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('收入报表') ||
          text.includes('营业收入') ||
          text.includes('房费') ||
          text.includes('渠道') ||
          text.includes('房型') ||
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

  if (state.startsWith('mode-')) {
    const modeLabelMap = {
      'mode-day': '按日',
      'mode-month': '按月',
      'mode-store': '按门店',
      'mode-channel': '按渠道',
      'mode-room-type': '按房型',
      'mode-room': '按房间',
      'mode-checkout': '按退房时间',
    }
    const label = modeLabelMap[state]
    if (label) {
      const modeControl = page.getByText(label, { exact: true }).first()
      if (await isVisible(modeControl)) {
        await modeControl.click({ timeout: 2500 })
        await page.waitForTimeout(1500)
        interactions.push({ action: 'switch-report-mode', clicked: label })
      }
    }
  }

  if (state === 'collapsed') {
    const clicked = await clickFirstVisible(page, ['收起'])
    interactions.push({ action: 'click-collapse', clicked })
  }

  if (state === 'expanded') {
    const clicked = await clickFirstVisible(page, ['展开'])
    interactions.push({ action: 'click-expand', clicked })
  }

  if (state === 'date-range') {
    const dateInput = page.locator('input[placeholder="开始日期"]').first()
    if (await isVisible(dateInput)) {
      await dateInput.click({ timeout: 2500 }).catch(() => {})
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-start-date-picker', clicked: '开始日期' })
    } else {
      const clicked = await clickFirstVisible(page, ['本月', '上月', '本周', '今天', '昨天'])
      interactions.push({ action: 'change-date-preset', clicked })
    }
  }

  if (state === 'store-dropdown') {
    const clicked = await clickFirstVisible(page, ['全部门店', '门店'])
    interactions.push({ action: 'open-store-dropdown', clicked })
  }

  if (state === 'room-type-dropdown') {
    const select = page.locator('.ant-select-selector').nth(0)
    if (await isVisible(select)) {
      await select.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-room-type-dropdown', clicked: 'select-0' })
    } else {
      const clicked = await clickFirstVisible(page, ['房型'])
      interactions.push({ action: 'open-room-type-dropdown', clicked })
    }
  }

  if (state === 'channel-dropdown') {
    const select = page.locator('.ant-select-selector').nth(1)
    if (await isVisible(select)) {
      await select.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-channel-dropdown', clicked: 'select-1' })
    } else {
      const clicked = await clickFirstVisible(page, ['渠道'])
      interactions.push({ action: 'open-channel-dropdown', clicked })
    }
  }

  if (state === 'room-group-dropdown') {
    const select = page.locator('.ant-select-selector').nth(2)
    if (await isVisible(select)) {
      await select.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-room-group-dropdown', clicked: 'select-2' })
    } else {
      const clicked = await clickFirstVisible(page, ['房型分组'])
      interactions.push({ action: 'open-room-group-dropdown', clicked })
    }
  }

  if (state === 'query') {
    const inputs = page.locator('input[placeholder*="订单"], input[placeholder*="搜索"], input[placeholder*="房型"], input[placeholder*="渠道"], input[type="text"]')
    for (let index = 0; index < (await inputs.count().catch(() => 0)); index += 1) {
      const input = inputs.nth(index)
      if (!(await input.isVisible().catch(() => false))) continue
      await input.fill('携程')
      interactions.push({ action: 'fill-keyword', value: '携程', index })
      break
    }
    const clicked = await clickFirstVisible(page, ['查询', '搜索', '查 询', '搜 索'])
    interactions.push({ action: 'click-query', clicked })
  }

  if (state === 'description') {
    const clicked = await clickFirstVisible(page, ['说 明', '说明'])
    interactions.push({ action: 'open-description', clicked })
  }

  if (state === 'download-detail') {
    const detail = page.getByRole('button', { name: '下载订单明细' }).first()
    if (await isVisible(detail)) {
      await detail.click({ timeout: 2500 })
      await page.waitForTimeout(1200)
      interactions.push({ action: 'click-download-order-detail', clicked: 'first-row' })
    }
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
          text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 420),
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
      const visibleElements = [...document.querySelectorAll('body *')].filter(elementVisible).slice(0, 500).map(describe)
      const controls = [
        ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
      ]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 280)
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
        .slice(0, 180)
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
        .slice(0, 180)
      const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 50)
      const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 50)
      const options = [...document.querySelectorAll('[role="option"],.ant-select-item-option,.ant-dropdown-menu-item,li')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 180)
      const keyElements = visibleElements.filter((item) =>
        /收入报表|营业收入|收入|房费|佣金|渠道|房型|门店|暂无数据|导出|查询|统计|订单/.test(item.text),
      )

      return {
        url: location.href,
        title: document.title,
        bodyLength: bodyText.length,
        bodyTextSample: bodyText.slice(0, 10000),
        isLoginBlocked:
          bodyText.includes('账号登录') ||
          bodyText.includes('账户登录') ||
          bodyText.includes('请按住滑块') ||
          bodyText.includes('登录其他登录方式'),
        hasBusinessText:
          bodyText.includes('收入报表') ||
          bodyText.includes('营业收入') ||
          bodyText.includes('房费'),
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
    if (mode === 'clone') {
      await context.addInitScript((mockState) => {
        window.localStorage.setItem('pms.incomeReport.provider', 'mock')
        window.localStorage.setItem('pms.incomeReport.state', mockState)
      }, resolveCloneMockState())
    }
    const page = await context.newPage()
    page.on('response', (response) => {
      const request = response.request()
      network.push({
        url: response.url(),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        contentType: response.headers()['content-type'] ?? '',
      })
    })

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)
    const interactions = await applyState(page)

    const viewportScreenshot = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullScreenshot = fileFor(artifactRoots.screenshots, 'full', 'png')
    await page.screenshot({ path: viewportScreenshot })
    await page.screenshot({ path: fullScreenshot, fullPage: true })

    const componentScreenshots = []
    const filterShot = await screenshotFirstVisible(
      page,
      ['.income-report-query', 'main form', '.ant-form', '.ant-card:has(input)', '.toolbar-card', '.report-filter-card'],
      'component-filters',
    )
    if (filterShot) componentScreenshots.push(filterShot)
    const tableShot = await screenshotFirstVisible(
      page,
      ['.income-report-table-wrap', '.ant-table-wrapper', '.ant-table', 'table', '.income-report-table', '.report-table'],
      'component-table',
    )
    if (tableShot) componentScreenshots.push(tableShot)
    const dropdownShot = await screenshotFirstVisible(
      page,
      ['.ant-select-dropdown', '.ant-dropdown', '[role="listbox"]'],
      'component-dropdown',
    )
    if (dropdownShot) componentScreenshots.push(dropdownShot)

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
          buttons: facts.buttons.slice(0, 80),
          inputs: facts.inputs.slice(0, 40),
          tableHeaders: facts.tableHeaders.slice(0, 90),
          options: facts.options.slice(0, 80),
          interactions,
          componentScreenshots,
          screenshots: [viewportScreenshot, fullScreenshot],
          dom: domFile,
          styles: styleFile,
          network: networkFile,
          bodySample: normalizeText(facts.bodyTextSample).slice(0, 1800),
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
