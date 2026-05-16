import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'baobiao--tongji-baobiao--xiaokuang-baobiao'
const TARGET_URL = 'https://minsubao.localhome.cn/statistics/sale'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/statistics/sale'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const stateArg = process.argv.find((arg) => arg.startsWith('--state='))
const state = stateArg?.split('=')[1] ?? 'default'
const stamp = process.env.PMS_CAPTURE_STAMP ?? new Date().toISOString().replace(/\D/g, '').slice(0, 14)

const artifactRoots = {
  screenshots: path.resolve('artifacts/screenshots', TASK_ID),
  dom: path.resolve('artifacts/dom-snapshots', TASK_ID),
  styles: path.resolve('artifacts/style-dumps', TASK_ID),
  network: path.resolve('artifacts/network', TASK_ID),
}

for (const directory of Object.values(artifactRoots)) {
  fs.mkdirSync(directory, { recursive: true })
}

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stamp}-${suffix}.${extension}`)
}

function normalizeText(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

async function waitForBusinessSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('销况报表') ||
          text.includes('销况') ||
          text.includes('销售') ||
          text.includes('订单数') ||
          text.includes('房型') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 25_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1800)
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const candidates = [
      page.getByRole('button', { name: new RegExp(label) }).first(),
      page.getByText(label, { exact: true }).first(),
      page.locator(`input[placeholder*="${label}"]`).first(),
    ]
    for (const locator of candidates) {
      if ((await locator.count()) === 0) continue
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

async function runStateSetup(page) {
  const interactions = []

  if (state === 'expanded') {
    const clicked = await clickFirstVisible(page, ['展开', '全部展开', '更多筛选'])
    interactions.push({ action: 'open-expanded-filters', clicked })
  }

  if (state === 'collapsed') {
    const clicked = await clickFirstVisible(page, ['收起'])
    interactions.push({ action: 'collapse-filters', clicked })
  }

  if (state === 'month-tab') {
    const clicked = await clickFirstVisible(page, ['按月'])
    interactions.push({ action: 'switch:month', clicked })
  }

  if (state === 'store-tab') {
    const clicked = await clickFirstVisible(page, ['按门店'])
    interactions.push({ action: 'switch:store', clicked })
  }

  if (state === 'channel-tab') {
    const clicked = await clickFirstVisible(page, ['按渠道'])
    interactions.push({ action: 'switch:channel', clicked })
  }

  if (state === 'room-type-tab') {
    const clicked = await clickFirstVisible(page, ['按房型'])
    interactions.push({ action: 'switch:room-type', clicked })
  }

  if (state === 'room-tab') {
    const clicked = await clickFirstVisible(page, ['按房间'])
    interactions.push({ action: 'switch:room', clicked })
  }

  if (state === 'date-picker') {
    const clicked = await clickFirstVisible(page, ['开始日期', '开始时间', '日期', '今天', '昨天'])
    interactions.push({ action: 'open-date-picker', clicked })
  }

  if (state === 'store-dropdown') {
    const clicked = await clickFirstVisible(page, ['全部门店', '门店'])
    interactions.push({ action: 'open-store-dropdown', clicked })
  }

  if (state === 'room-type-dropdown') {
    const clicked = await clickFirstVisible(page, ['房型'])
    interactions.push({ action: 'open-room-type-dropdown', clicked })
  }

  if (state === 'search') {
    const input = page.locator('input[placeholder*="搜索"], input[placeholder*="订单"], input[type="text"]:visible').last()
    if ((await input.count()) > 0) {
      try {
        await input.fill('携程', { timeout: 2500 })
        interactions.push({ action: 'fill-keyword', value: '携程' })
      } catch (error) {
        interactions.push({ action: 'fill-keyword-skipped', reason: error.message })
      }
    } else {
      interactions.push({ action: 'fill-keyword-skipped', reason: 'no visible keyword input' })
    }
    const clicked = await clickFirstVisible(page, ['查询', '搜索'])
    interactions.push({ action: 'click-search', clicked })
  }

  return interactions
}

async function extractFacts(page) {
  return page.evaluate(() => {
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
      'border',
      'borderRadius',
      'boxShadow',
      'overflow',
      'gridTemplateColumns',
      'alignItems',
      'gap',
    ]

    function summarizeElement(element) {
      const rect = element.getBoundingClientRect()
      const computed = window.getComputedStyle(element)
      const styles = {}
      for (const prop of styleProps) styles[prop] = computed[prop]
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 180),
        id: element.id || null,
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
        styles,
      }
    }

    const bodyText = document.body?.innerText || ''
    const visibleElements = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      })
      .slice(0, 320)
      .map(summarizeElement)

    const buttons = [...document.querySelectorAll('button,[role="button"]')]
      .map((element) => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim())
      .filter(Boolean)
      .slice(0, 160)

    const inputs = [...document.querySelectorAll('input,textarea,[contenteditable="true"]')]
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value || element.textContent || '',
      }))
      .slice(0, 100)

    const tableHeaders = [...document.querySelectorAll('th,.ant-table-thead th,[role="columnheader"],.sales-report-table__head > div')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const options = [...document.querySelectorAll('[role="option"],.ant-select-item-option,.ant-dropdown-menu-item,li')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 140)

    const headings = [...document.querySelectorAll('h1,h2,h3,.ant-card-head-title')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 6000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('销况报表') ||
        bodyText.includes('销售') ||
        bodyText.includes('订单数') ||
        bodyText.includes('房型'),
      headings,
      buttons,
      inputs,
      tableHeaders,
      options,
      visibleElements,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  })
}

async function main() {
  if (mode === 'target' && !fs.existsSync(STORAGE_STATE)) {
    throw new Error(`Missing storageState: ${STORAGE_STATE}`)
  }
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Missing Chrome executable: ${CHROME_PATH}`)
  }

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
      })
    })

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)
    const interactions = await runStateSetup(page)
    const facts = await extractFacts(page)

    const viewportScreenshot = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullScreenshot = fileFor(artifactRoots.screenshots, 'full', 'png')
    await page.screenshot({ path: viewportScreenshot })
    await page.screenshot({ path: fullScreenshot, fullPage: true })

    const domFile = fileFor(artifactRoots.dom, 'page', 'html')
    const styleFile = fileFor(artifactRoots.styles, 'facts', 'json')
    const networkFile = fileFor(artifactRoots.network, 'responses', 'json')

    fs.writeFileSync(domFile, await page.content())
    fs.writeFileSync(styleFile, JSON.stringify({ mode, state, stamp, interactions, facts }, null, 2))
    fs.writeFileSync(networkFile, JSON.stringify({ mode, state, stamp, url: page.url(), responses: network }, null, 2))

    console.log(
      JSON.stringify(
        {
          mode,
          state,
          stamp,
          url: page.url(),
          bodyLength: facts.bodyLength,
          isLoginBlocked: facts.isLoginBlocked,
          hasBusinessText: facts.hasBusinessText,
          headings: facts.headings.slice(0, 20),
          buttons: facts.buttons.slice(0, 50),
          inputs: facts.inputs.slice(0, 24),
          tableHeaders: facts.tableHeaders.slice(0, 50),
          options: facts.options.slice(0, 40),
          screenshots: [viewportScreenshot, fullScreenshot],
          dom: domFile,
          styles: styleFile,
          network: networkFile,
          interactions,
          bodySample: normalizeText(facts.bodyTextSample).slice(0, 1200),
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
