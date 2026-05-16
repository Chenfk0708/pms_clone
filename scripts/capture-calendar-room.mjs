import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const TASK_ID = 'shoumai-chanpin--rilifang--rilifang'
const TARGET_URL = 'https://minsubao.localhome.cn/setting/localRoomTypeProductionSetting'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/setting/localRoomTypeProductionSetting'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const state = process.argv.includes('--interaction') ? 'interaction' : 'default'
const stamp =
  process.env.PMS_CAPTURE_STAMP ??
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(new Date())
    .reduce((parts, part) => {
      parts[part.type] = part.value
      return parts
    }, {})

const stampText =
  typeof stamp === 'string'
    ? stamp
    : `${stamp.year}${stamp.month}${stamp.day}-${stamp.hour}${stamp.minute}${stamp.second}`

const artifactDirs = {
  screenshots: path.resolve('artifacts/screenshots', TASK_ID),
  dom: path.resolve('artifacts/dom-snapshots', TASK_ID),
  styles: path.resolve('artifacts/style-dumps', TASK_ID),
  network: path.resolve('artifacts/network', TASK_ID),
}

for (const directory of Object.values(artifactDirs)) {
  fs.mkdirSync(directory, { recursive: true })
}

let previewProcess = null

try {
  if (mode === 'target' && !fs.existsSync(STORAGE_STATE)) {
    throw new Error(`Missing storageState: ${STORAGE_STATE}`)
  }

  if (mode === 'clone') {
    await ensurePreviewServer(LOCAL_URL)
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
        contentType: response.headers()['content-type'] ?? '',
      })
    })

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)

    const interactions = state === 'interaction' ? await runInteractionSweep(page) : []

    const screenshotPath = fileFor(artifactDirs.screenshots, 'viewport', 'png')
    const fullScreenshotPath = fileFor(artifactDirs.screenshots, 'full', 'png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })

    const htmlPath = fileFor(artifactDirs.dom, 'page', 'html')
    fs.writeFileSync(htmlPath, await page.content(), 'utf8')

    const facts = await extractPageFacts(page)
    const stylePath = fileFor(artifactDirs.styles, 'facts', 'json')
    fs.writeFileSync(
      stylePath,
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode,
          state,
          stamp: stampText,
          url: page.url(),
          isLoginBlocked: isBlocked(page.url(), facts.bodyText),
          interactions,
          facts,
        },
        null,
        2,
      ),
      'utf8',
    )

    const networkPath = fileFor(artifactDirs.network, 'responses', 'json')
    fs.writeFileSync(
      networkPath,
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode,
          state,
          stamp: stampText,
          url: page.url(),
          responses: network,
        },
        null,
        2,
      ),
      'utf8',
    )

    console.log(
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode,
          state,
          stamp: stampText,
          url: page.url(),
          isLoginBlocked: isBlocked(page.url(), facts.bodyText),
          bodyLength: facts.bodyText.length,
          bodySample: stableText(facts.bodyText).slice(0, 900),
          topButtons: facts.buttons.slice(0, 40),
          inputs: facts.inputs.slice(0, 20),
          selects: facts.selects.slice(0, 20),
          tableHeaders: facts.tableHeaders.slice(0, 40),
          productRows: facts.productRows.slice(0, 12),
          interactions,
          artifacts: {
            screenshotPath,
            fullScreenshotPath,
            htmlPath,
            stylePath,
            networkPath,
          },
        },
        null,
        2,
      ),
    )

    await context.close()
  } finally {
    await browser.close()
  }
} finally {
  if (previewProcess) previewProcess.kill()
}

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stampText}-${suffix}.${extension}`)
}

async function waitForBusinessSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 18_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('本地房型产品') ||
          text.includes('房型产品') ||
          text.includes('产品系数') ||
          text.includes('售卖') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1800)
}

async function runInteractionSweep(page) {
  const interactions = []

  for (const action of [
    { slug: 'add-product', labels: ['添加产品', '新增产品', '新增'] },
    { slug: 'store-select', labels: ['天落会宿公寓(前海壹方城宝安中心店)', '全部门店', '门店'] },
    { slug: 'status-select', labels: ['全部状态', '上架状态', '售卖状态'] },
    { slug: 'first-expand', labels: ['展开'] },
    { slug: 'first-edit-room-type', labels: ['编辑房型'] },
    { slug: 'first-price-management', labels: ['房价管理'] },
  ]) {
    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)
    const before = await summarizeTransientState(page)
    const result = await clickFirstVisibleLabel(page, action.labels)
    await page.waitForTimeout(800)
    const after = await summarizeTransientState(page)
    const screenshotPath = fileFor(artifactDirs.screenshots, action.slug, 'png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    interactions.push({
      slug: action.slug,
      labels: action.labels,
      result,
      urlChanged: before.url !== after.url,
      textChanged: before.bodyText !== after.bodyText,
      before,
      after,
      screenshotPath,
    })
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(300)
  }

  return interactions
}

async function clickFirstVisibleLabel(page, labels) {
  for (const label of labels) {
    const locators = [
      page.getByRole('button', { name: label, exact: true }),
      page.getByRole('combobox', { name: label, exact: false }),
      page.getByText(label, { exact: true }),
      page.getByText(label, { exact: false }),
    ]

    for (const locator of locators) {
      const count = await locator.count().catch(() => 0)
      for (let index = 0; index < Math.min(count, 8); index += 1) {
        const item = locator.nth(index)
        const box = await item.boundingBox().catch(() => null)
        if (!box || box.width < 1 || box.height < 1) continue
        const text = (await item.textContent().catch(() => ''))?.trim() ?? ''
        await item.click({ timeout: 4_000 }).catch(async () => {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        })
        return { found: true, clicked: true, label, text: text.slice(0, 160), box: roundBox(box) }
      }
    }
  }

  return { found: false, clicked: false, labels }
}

async function summarizeTransientState(page) {
  return page.evaluate(() => {
    const visibleTexts = (selector) =>
      Array.from(document.querySelectorAll(selector))
        .filter((node) => {
          const rect = node.getBoundingClientRect()
          const style = getComputedStyle(node)
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
        })
        .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 40)

    return {
      url: location.href,
      bodyText: document.body.innerText.slice(0, 4000),
      dialogs: visibleTexts('[role="dialog"],.ant-modal,.ant-drawer,.modal,.drawer'),
      dropdowns: visibleTexts('.ant-select-dropdown,.ant-dropdown,.ant-picker-dropdown,[role="listbox"],.dropdown'),
      active: visibleTexts('.is-active,.ant-tabs-tab-active,.ant-select-selection-item,.active'),
    }
  })
}

async function extractPageFacts(page) {
  return page.evaluate(() => {
    const bodyText = document.body?.innerText || ''
    const visible = (node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const normalize = (text) => String(text || '').replace(/\s+/g, ' ').trim()
    const readStyle = (node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return {
        tag: node.tagName.toLowerCase(),
        className: String(node.className || '').slice(0, 180),
        role: node.getAttribute('role'),
        ariaLabel: node.getAttribute('aria-label'),
        placeholder: node.getAttribute('placeholder'),
        text: normalize(node.textContent).slice(0, 240),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        styles: {
          display: style.display,
          position: style.position,
          padding: style.padding,
          margin: style.margin,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          color: style.color,
          backgroundColor: style.backgroundColor,
          border: style.border,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          overflow: style.overflow,
          gridTemplateColumns: style.gridTemplateColumns,
        },
      }
    }

    const buttons = Array.from(document.querySelectorAll('button,[role="button"],a'))
      .filter(visible)
      .map((node) => normalize(node.textContent || node.getAttribute('aria-label')))
      .filter(Boolean)
      .slice(0, 160)

    const inputs = Array.from(document.querySelectorAll('input,textarea'))
      .filter(visible)
      .map((node) => ({
        type: node.getAttribute('type'),
        placeholder: node.getAttribute('placeholder'),
        ariaLabel: node.getAttribute('aria-label'),
        value: node.value || '',
        rect: readStyle(node).rect,
      }))

    const selects = Array.from(document.querySelectorAll('.ant-select,[role="combobox"],select,[class*="select"]'))
      .filter(visible)
      .map(readStyle)
      .slice(0, 80)

    const tableHeaders = Array.from(document.querySelectorAll('th,.ant-table-thead .ant-table-cell,[role="columnheader"],.table-head *'))
      .filter(visible)
      .map((node) => normalize(node.textContent))
      .filter(Boolean)
      .slice(0, 80)

    const productRows = Array.from(document.querySelectorAll('tr,.ant-table-row,[role="row"],.product-row,.table-row'))
      .filter(visible)
      .map((node) => normalize(node.textContent))
      .filter((text) => text.length > 5)
      .slice(0, 80)

    const elementSamples = Array.from(document.querySelectorAll('body *'))
      .filter(visible)
      .slice(0, 260)
      .map(readStyle)

    return {
      title: document.title,
      location: location.href,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        devicePixelRatio,
      },
      bodyText,
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        location.href.includes('/home') ||
        location.href.includes('/login'),
      buttons,
      inputs,
      selects,
      tableHeaders,
      productRows,
      elementSamples,
    }
  })
}

async function ensurePreviewServer(url) {
  if (await canFetch(url)) return

  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  previewProcess = spawn(command, ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  })

  const started = Date.now()
  while (Date.now() - started < 20_000) {
    if (await canFetch(url)) return
    await delay(500)
  }

  throw new Error(`Local preview server did not become ready at ${url}`)
}

async function canFetch(url) {
  try {
    const response = await fetch(url, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}

function isBlocked(url, bodyText) {
  return (
    bodyText.includes('账号登录') ||
    bodyText.includes('请按住滑块') ||
    bodyText.includes('登录密码') ||
    url.includes('/home') ||
    url.includes('/login')
  )
}

function stableText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function roundBox(box) {
  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
