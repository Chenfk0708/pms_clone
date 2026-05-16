import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const TASK_ID = 'shezhi--tongyong-shezhi--jiyibi-shezhi'
const TARGET_URL = 'https://minsubao.localhome.cn/setting/writeExpendSetting'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/setting/writeExpendSetting'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const stateArg = process.argv.find((arg) => arg.startsWith('--state='))
const state = stateArg ? stateArg.split('=')[1] : 'default'
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
  await fs.mkdir(directory, { recursive: true })
}

let previewProcess = null

try {
  if (mode === 'target') await fs.access(STORAGE_STATE)
  await fs.access(CHROME_PATH)
  if (mode === 'clone') await ensurePreviewServer(LOCAL_URL)

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

    const interactions = state === 'default' ? [] : await applyState(page, state)
    const componentScreenshots = []

    const screenshotPath = fileFor(artifactDirs.screenshots, 'viewport', 'png')
    const fullScreenshotPath = fileFor(artifactDirs.screenshots, 'full', 'png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })

    for (const [suffix, selectors] of [
      ['component-main', ['main', '.page-content']],
      ['component-form', ['form', '.ant-form', '.write-expend-setting-panel', '.settings-panel']],
      ['component-table', ['.ant-table-wrapper', '.ant-table', 'table', '.write-expend-setting-table']],
      ['component-dialog', ['.ant-modal', '.ant-drawer', '[role="dialog"]']],
      ['component-dropdown', ['.ant-select-dropdown', '.ant-dropdown', '[role="listbox"]']],
    ]) {
      const shot = await screenshotFirstVisible(page, selectors, suffix)
      if (shot) componentScreenshots.push(shot)
    }

    const htmlPath = fileFor(artifactDirs.dom, 'page', 'html')
    await fs.writeFile(htmlPath, await page.content(), 'utf8')

    const facts = await extractFacts(page, interactions, componentScreenshots)
    const stylePath = fileFor(artifactDirs.styles, 'facts', 'json')
    await fs.writeFile(
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
    await fs.writeFile(
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
          hasBusinessText: facts.hasBusinessText,
          bodyLength: facts.bodyText.length,
          bodySample: stableText(facts.bodyText).slice(0, 2600),
          buttons: facts.buttons.slice(0, 120),
          inputs: facts.inputs.slice(0, 70),
          switches: facts.switches.slice(0, 40),
          selects: facts.selects.slice(0, 60),
          tableHeaders: facts.tableHeaders.slice(0, 80),
          rows: facts.rows.slice(0, 70),
          dialogs: facts.dialogs.slice(0, 20),
          dropdowns: facts.dropdowns.slice(0, 20),
          options: facts.options.slice(0, 120),
          interactions,
          artifacts: {
            screenshotPath,
            fullScreenshotPath,
            htmlPath,
            stylePath,
            networkPath,
            componentScreenshots,
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
          text.includes('记一笔设置') ||
          text.includes('收入') ||
          text.includes('支出') ||
          text.includes('项目') ||
          text.includes('保存') ||
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

async function applyState(page, stateName) {
  const interactions = []
  const actionsByState = {
    add: [{ slug: 'add-item', labels: ['新增', '添加', '添加项目', '新增项目', '新 增'] }],
    edit: [{ slug: 'edit-first', labels: ['编辑', '修改'] }],
    delete: [{ slug: 'delete-first', labels: ['删除'] }],
    save: [{ slug: 'save-settings', labels: ['保存', '保 存'] }],
    dropdown: [{ slug: 'open-dropdown', labels: ['请选择', '全部', '收入', '支出', '项目'] }],
    switch: [{ slug: 'toggle-first-switch', labels: ['启用', '停用', '开关'] }],
    collapsed: [{ slug: 'collapse-chat', labels: ['收起'] }],
  }

  for (const action of actionsByState[stateName] ?? []) {
    const before = await summarizeState(page)
    const result = await clickFirstVisibleLabel(page, action.labels)
    await page.waitForTimeout(900)
    const after = await summarizeState(page)
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
    break
  }

  return interactions
}

async function clickFirstVisibleLabel(page, labels) {
  for (const label of labels) {
    const locators = [
      page.getByRole('button', { name: label, exact: true }),
      page.getByRole('link', { name: label, exact: true }),
      page.getByRole('menuitem', { name: label, exact: true }),
      page.getByRole('option', { name: label, exact: true }),
      page.getByText(label, { exact: true }),
      page.getByText(label, { exact: false }),
      page.locator('.ant-select-selector').filter({ hasText: label }),
      page.locator('.ant-switch,.switch,[role="switch"]').first(),
    ]

    for (const locator of locators) {
      const count = await locator.count().catch(() => 0)
      for (let index = 0; index < Math.min(count, 12); index += 1) {
        const item = locator.nth(index)
        const box = await item.boundingBox().catch(() => null)
        if (!box || box.width < 1 || box.height < 1) continue
        const text = (await item.textContent().catch(() => ''))?.trim() ?? ''
        await item.click({ timeout: 4_000 }).catch(async () => {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        })
        return { found: true, clicked: true, label, text: text.slice(0, 180), box: roundBox(box) }
      }
    }
  }

  return { found: false, clicked: false, labels }
}

async function screenshotFirstVisible(page, selectors, suffix) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if (!(await isVisible(locator))) continue
    try {
      const outputPath = fileFor(artifactDirs.screenshots, suffix, 'png')
      await locator.screenshot({ path: outputPath })
      return { selector, outputPath }
    } catch {
      // Continue to the next selector.
    }
  }
  return null
}

async function isVisible(locator) {
  return (await locator.count().catch(() => 0)) > 0 && (await locator.first().isVisible().catch(() => false))
}

async function summarizeState(page) {
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
        .slice(0, 80)

    return {
      url: location.href,
      bodyText: document.body.innerText.slice(0, 6000),
      dialogs: visibleTexts('[role="dialog"],.ant-modal,.ant-drawer,.modal,.drawer'),
      dropdowns: visibleTexts('.ant-select-dropdown,.ant-dropdown,.ant-picker-dropdown,[role="listbox"],.dropdown'),
      active: visibleTexts('.is-active,.ant-tabs-tab-active,.ant-select-selection-item,.active,.ant-switch-checked'),
    }
  })
}

async function extractFacts(page, interactions, componentScreenshots) {
  return page.evaluate(
    ({ capturedInteractions, capturedComponentScreenshots }) => {
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
          text: normalize(node.textContent).slice(0, 360),
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

      const bodyText = document.body?.innerText || ''
      const buttons = Array.from(document.querySelectorAll('button,[role="button"],a,[role="tab"]'))
        .filter(visible)
        .map((node) => normalize(node.textContent || node.getAttribute('aria-label')))
        .filter(Boolean)
        .slice(0, 200)
      const inputs = Array.from(document.querySelectorAll('input,textarea'))
        .filter(visible)
        .map((node) => ({
          type: node.getAttribute('type'),
          placeholder: node.getAttribute('placeholder'),
          ariaLabel: node.getAttribute('aria-label'),
          value: node.value || '',
          rect: readStyle(node).rect,
        }))
      const switches = Array.from(document.querySelectorAll('.ant-switch,.switch,[role="switch"]'))
        .filter(visible)
        .map(readStyle)
        .slice(0, 80)
      const selects = Array.from(document.querySelectorAll('.ant-select,[role="combobox"],select,[class*="select"]'))
        .filter(visible)
        .map(readStyle)
        .slice(0, 100)
      const tableHeaders = Array.from(
        document.querySelectorAll('th,.ant-table-thead .ant-table-cell,[role="columnheader"],.table-head *'),
      )
        .filter(visible)
        .map((node) => normalize(node.textContent))
        .filter(Boolean)
        .slice(0, 100)
      const rows = Array.from(document.querySelectorAll('tr,.ant-table-row,[role="row"],.table-row,.ant-card,label'))
        .filter(visible)
        .map((node) => normalize(node.textContent))
        .filter((text) => text.length > 2)
        .slice(0, 160)
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"],.ant-modal,.ant-drawer,.modal,.drawer'))
        .filter(visible)
        .map(readStyle)
        .slice(0, 60)
      const dropdowns = Array.from(
        document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,.ant-picker-dropdown,[role="listbox"],.dropdown'),
      )
        .filter(visible)
        .map(readStyle)
        .slice(0, 60)
      const options = Array.from(document.querySelectorAll('[role="option"],.ant-select-item-option,li,.ant-dropdown-menu-item'))
        .filter(visible)
        .map((node) => normalize(node.textContent))
        .filter(Boolean)
        .slice(0, 200)
      const elementSamples = Array.from(document.querySelectorAll('body *')).filter(visible).slice(0, 360).map(readStyle)

      return {
        title: document.title,
        location: location.href,
        viewport: {
          width: innerWidth,
          height: innerHeight,
          devicePixelRatio,
        },
        bodyText,
        hasBusinessText:
          bodyText.includes('记一笔设置') ||
          bodyText.includes('收入') ||
          bodyText.includes('支出') ||
          bodyText.includes('项目'),
        buttons,
        inputs,
        switches,
        selects,
        tableHeaders,
        rows,
        dialogs,
        dropdowns,
        options,
        elementSamples,
        interactions: capturedInteractions,
        componentScreenshots: capturedComponentScreenshots,
      }
    },
    { capturedInteractions: interactions, capturedComponentScreenshots: componentScreenshots },
  )
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
