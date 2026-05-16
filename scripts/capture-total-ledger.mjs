import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'baobiao--shouzhi-mingxibiao--shouzhi-huizong'
const TARGET_URL = 'https://minsubao.localhome.cn/statistics/totalLedger'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/statistics/totalLedger'
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

async function locatorVisible(locator) {
  return (await locator.count().catch(() => 0)) > 0 && (await locator.first().isVisible().catch(() => false))
}

function looseLabelPattern(label) {
  return label
    .split('')
    .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s*')
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const labelPattern = looseLabelPattern(label)
    const candidates = [
      page.getByRole('button', { name: new RegExp(labelPattern) }).first(),
      page.getByText(label, { exact: true }).first(),
      page.locator(`input[placeholder*="${label}"]`).first(),
      page.locator(`[aria-label*="${label}"]`).first(),
      page.locator(`.ant-select-selector:has-text("${label}")`).first(),
    ]
    for (const locator of candidates) {
      if (!(await locatorVisible(locator))) continue
      try {
        await locator.click({ timeout: 2500 })
        await page.waitForTimeout(900)
        return label
      } catch {
        // Try the next locator.
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
          text.includes('收支汇总') ||
          text.includes('收支') ||
          text.includes('收入') ||
          text.includes('支出') ||
          text.includes('余额') ||
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

  if (state === 'collapsed') {
    const clicked = await clickFirstVisible(page, ['收起'])
    interactions.push({ action: 'click-collapse', clicked })
  }

  if (state === 'expanded') {
    const clicked = await clickFirstVisible(page, ['展开'])
    interactions.push({ action: 'click-expand', clicked })
  }

  if (state === 'date-picker') {
    const dateInput = page.locator('input[placeholder*="开始"], input[placeholder*="日期"], input[placeholder*="时间"]').first()
    if (await locatorVisible(dateInput)) {
      await dateInput.click({ timeout: 2500 }).catch(() => {})
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-date-picker', clicked: 'first-date-input' })
    } else {
      const clicked = await clickFirstVisible(page, ['本月', '上月', '本周', '今天', '昨天'])
      interactions.push({ action: 'open-date-picker-fallback', clicked })
    }
  }

  if (state === 'store-dropdown') {
    const clicked = await clickFirstVisible(page, ['全部门店', '门店'])
    interactions.push({ action: 'open-store-dropdown', clicked })
  }

  if (state === 'income-type-dropdown') {
    const select = page.locator('.ant-select-selector, [role="combobox"]').nth(0)
    if (await locatorVisible(select)) {
      await select.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-first-select', clicked: 'select-0' })
    }
  }

  if (state === 'second-dropdown') {
    const select = page.locator('.ant-select-selector, [role="combobox"]').nth(1)
    if (await locatorVisible(select)) {
      await select.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-second-select', clicked: 'select-1' })
    }
  }

  if (state === 'query') {
    const inputs = page.locator('input[placeholder*="搜索"], input[placeholder*="关键"], input[placeholder*="名称"], input[type="text"]')
    for (let index = 0; index < (await inputs.count().catch(() => 0)); index += 1) {
      const input = inputs.nth(index)
      if (!(await input.isVisible().catch(() => false))) continue
      await input.fill('天落')
      interactions.push({ action: 'fill-keyword', value: '天落', index })
      break
    }
    const clicked = await clickFirstVisible(page, ['查询', '搜索', '查 询', '搜 索'])
    interactions.push({ action: 'click-query', clicked })
  }

  return interactions
}

async function screenshotFirstVisible(page, selectors, suffix) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if (!(await locatorVisible(locator))) continue
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
      const visibleElements = [...document.querySelectorAll('body *')].filter(elementVisible).slice(0, 520).map(describe)
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
      const tableRows = [...document.querySelectorAll('tbody tr,.ant-table-row,[role="row"]')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 120)
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
        /收支汇总|收支|收入|支出|余额|房费|其他消费|记一笔|门店|渠道|查询|导出|暂无数据|合计/.test(item.text),
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
        hasBusinessText: bodyText.includes('收支汇总') || bodyText.includes('收支') || bodyText.includes('收入'),
        interactions: capturedInteractions,
        componentScreenshots: capturedComponentScreenshots,
        controls,
        buttons,
        inputs,
        tableHeaders,
        tableRows,
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
      ['main form', '.ant-form', '.ant-card:has(input)', '.ledger-filter-card', '.report-filter-card', '.ant-space'],
      'component-filters',
    )
    if (filterShot) componentScreenshots.push(filterShot)
    const tableShot = await screenshotFirstVisible(
      page,
      ['.ant-table-wrapper', '.ant-table', 'table', '.ledger-table', '.report-table'],
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
          inputs: facts.inputs.slice(0, 50),
          tableHeaders: facts.tableHeaders.slice(0, 90),
          tableRows: facts.tableRows.slice(0, 20),
          options: facts.options.slice(0, 80),
          interactions,
          componentScreenshots,
          screenshots: [viewportScreenshot, fullScreenshot],
          dom: domFile,
          styles: styleFile,
          network: networkFile,
          bodySample: normalizeText(facts.bodyTextSample).slice(0, 2000),
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
