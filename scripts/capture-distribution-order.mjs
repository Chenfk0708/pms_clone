import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'juhe-fenxiao--fenxiao--juhe-fenxiao-dingdan'
const TARGET_URL = 'https://minsubao.localhome.cn/channels/distribution/distributionOrderSettlement'
const LOCAL_URL =
  process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/channels/distribution/distributionOrderSettlement'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const state = process.argv.includes('--expanded')
  ? 'expanded'
  : process.argv.includes('--dropdown')
    ? 'dropdown'
    : process.argv.includes('--interaction')
      ? 'interaction'
      : process.argv.includes('--empty')
        ? 'empty'
        : process.argv.includes('--error')
          ? 'error'
          : process.argv.includes('--detail')
            ? 'detail'
            : 'default'
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
    if (depth >= 3) return { type: 'object', keys: Object.keys(value).slice(0, 20) }
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 40)
        .map(([key, item]) => [key, summarizeValue(item, depth + 1)]),
    )
  }
  if (typeof value === 'string') {
    if (/token|cookie|authorization|password|passwd|mobile/i.test(value)) return '[redacted]'
    return value.length > 160 ? `${value.slice(0, 160)}...` : value
  }
  return value
}

function summarizeJson(payload) {
  return summarizeValue(payload)
}

function parsePostData(request) {
  const body = request.postData()
  if (!body) return null
  try {
    return summarizeJson(JSON.parse(body))
  } catch {
    return normalizeText(body).slice(0, 300)
  }
}

function shouldCapturePayload(url) {
  return (
    url.includes('hudson-prod.localhome.cn/order/report/get') ||
    url.includes('hudson-prod.localhome.cn/report/flows/get') ||
    url.includes('hudson-prod.localhome.cn/camps/get') ||
    url.includes('hudson-prod.localhome.cn/channels/get') ||
    url.includes('hudson-prod.localhome.cn/select/calChannel4Order/get') ||
    url.includes('hudson-prod.localhome.cn/paymentTypes/get') ||
    url.includes('hudson-prod.localhome.cn/rooms/get')
  )
}

async function waitForBusinessSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('聚合分销订单') ||
          text.includes('分销订单') ||
          text.includes('订单状态') ||
          text.includes('结算状态') ||
          text.includes('分销渠道') ||
          text.includes('暂无数据') ||
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
      if ((await locator.count().catch(() => 0)) === 0) continue
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

async function runStateSetup(page) {
  const interactions = []
  if (state === 'expanded') {
    const expanded = await clickFirstVisible(page, ['展开'])
    interactions.push({ action: 'click-expand', clicked: expanded })
  }
  if (state === 'dropdown') {
    const dropdown = await clickFirstVisible(page, ['结算状态', '分销渠道', '订单状态', '渠道'])
    interactions.push({ action: 'open-dropdown', clicked: dropdown })
  }
  if (state === 'interaction') {
    const keywordInputs = page.locator(
      'input[placeholder*="订单"], input[placeholder*="姓名"], input[placeholder*="手机号"], input[placeholder*="搜索"], input[placeholder*="关键词"]',
    )
    for (let index = 0; index < (await keywordInputs.count().catch(() => 0)); index += 1) {
      const keyword = keywordInputs.nth(index)
      if (!(await keyword.isVisible().catch(() => false))) continue
      await keyword.fill('205')
      interactions.push({ action: 'fill-keyword', value: '205', index })
      break
    }
    const dropdown = await clickFirstVisible(page, ['订单状态', '分销渠道', '结算状态', '渠道'])
    interactions.push({ action: 'open-dropdown', clicked: dropdown })
    const query = await clickFirstVisible(page, ['查 询', '搜 索', '查询', '搜索'])
    interactions.push({ action: 'click-query', clicked: query })
  }
  if (state === 'detail') {
    const orderButton = page.locator('.distribution-order-link').first()
    if ((await orderButton.count().catch(() => 0)) > 0) {
      await orderButton.click({ timeout: 3000 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-detail', clicked: true })
    } else {
      interactions.push({ action: 'open-detail', clicked: false })
    }
  }
  return interactions
}

function localUrlForState() {
  if (mode !== 'clone') return TARGET_URL
  if (state !== 'empty' && state !== 'error') return LOCAL_URL
  const url = new URL(LOCAL_URL)
  url.searchParams.set('mockState', state)
  return url.toString()
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
      'justifyContent',
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
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
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
    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
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
      .slice(0, 80)
    const tableHeaders = [...document.querySelectorAll('th,.ant-table-thead th,[role="columnheader"]')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    const options = [
      ...document.querySelectorAll('[role="option"],.ant-select-item-option,.ant-dropdown-menu-item,li'),
    ]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 140)
    const businessElements = visibleElements.filter((item) =>
      /聚合分销订单|分销订单|订单状态|结算状态|分销渠道|订单金额|暂无数据|导出明细/.test(item.text),
    )

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
        bodyText.includes('聚合分销订单') ||
        (bodyText.includes('订单状态') && bodyText.includes('分销')),
      buttons,
      inputs,
      tableHeaders,
      options,
      businessElements,
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
    page.on('response', async (response) => {
      const request = response.request()
      const entry = {
        url: response.url(),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        postData: parsePostData(request),
      }

      if (shouldCapturePayload(response.url())) {
        try {
          const contentType = response.headers()['content-type'] || ''
          if (contentType.includes('application/json')) {
            entry.responseSummary = summarizeJson(await response.json())
          } else {
            entry.responseSummary = normalizeText(await response.text()).slice(0, 500)
          }
        } catch (error) {
          entry.responseSummaryError = error instanceof Error ? error.message : String(error)
        }
      }

      network.push(entry)
    })

    await page.goto(localUrlForState(), {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)
    const interactions = await runStateSetup(page)
    const facts = await extractFacts(page)

    const viewportScreenshot = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullScreenshot = fileFor(artifactRoots.screenshots, 'full', 'png')
    const domFile = fileFor(artifactRoots.dom, 'page', 'html')
    const styleFile = fileFor(artifactRoots.styles, 'facts', 'json')
    const networkFile = fileFor(artifactRoots.network, 'responses', 'json')

    await page.screenshot({ path: viewportScreenshot })
    await page.screenshot({ path: fullScreenshot, fullPage: true })
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
          buttons: facts.buttons.slice(0, 50),
          inputs: facts.inputs.slice(0, 20),
          tableHeaders: facts.tableHeaders.slice(0, 60),
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
