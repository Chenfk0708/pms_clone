import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'shezhi--tongyong-shezhi--paixu-shezhi'
const TARGET_URL = 'https://minsubao.localhome.cn/setting/sortSetting'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/setting/sortSetting'
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

function looseLabelPattern(label) {
  return label
    .split('')
    .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s*')
}

async function locatorVisible(locator) {
  return (await locator.count().catch(() => 0)) > 0 && (await locator.first().isVisible().catch(() => false))
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const pattern = looseLabelPattern(label)
    const candidates = [
      page.getByRole('button', { name: new RegExp(pattern) }).first(),
      page.getByRole('tab', { name: new RegExp(pattern) }).first(),
      page.getByRole('link', { name: new RegExp(pattern) }).first(),
      page.getByText(label, { exact: true }).first(),
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
          text.includes('排序设置') ||
          text.includes('排序') ||
          text.includes('拖动') ||
          text.includes('房型') ||
          text.includes('房间') ||
          text.includes('保存') ||
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

  if (state === 'second-tab') {
    const tabs = page.locator('[role="tab"], .ant-tabs-tab, button')
    const count = await tabs.count().catch(() => 0)
    if (count > 1) {
      await tabs.nth(1).click({ timeout: 2500 }).catch(() => {})
      await page.waitForTimeout(900)
      interactions.push({ action: 'click-second-tab', clicked: 1 })
    }
  }

  if (state === 'primary-action') {
    interactions.push({
      action: 'click-primary-action',
      clicked: await clickFirstVisible(page, ['保存排序', '保存', '排 序', '排序', '编辑排序']),
    })
  }

  if (state === 'first-dropdown') {
    const select = page.locator('.ant-select-selector, [role="combobox"], [aria-haspopup="listbox"]').first()
    if (await locatorVisible(select)) {
      await select.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-first-select', clicked: 'select-0' })
    }
  }

  if (state === 'chat-collapsed') {
    interactions.push({ action: 'collapse-chat', clicked: await clickFirstVisible(page, ['收起']) })
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
      const visibleElements = [...document.querySelectorAll('body *')].filter(elementVisible).slice(0, 620).map(describe)
      const controls = [
        ...document.querySelectorAll(
          'button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"],[role="tab"]',
        ),
      ]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 320)
      const buttons = [...document.querySelectorAll('button,[role="button"],a,[role="tab"]')]
        .filter(elementVisible)
        .map((element) => ({
          text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
            .replace(/\s+/g, ' ')
            .trim(),
          href: element.getAttribute('href'),
          className: String(element.className || '').slice(0, 180),
        }))
        .filter((item) => item.text)
        .slice(0, 220)
      const inputs = [...document.querySelectorAll('input,textarea')]
        .filter(elementVisible)
        .map((element) => ({
          type: element.getAttribute('type'),
          placeholder: element.getAttribute('placeholder'),
          ariaLabel: element.getAttribute('aria-label'),
          value: element.value,
        }))
        .slice(0, 140)
      const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,[role="columnheader"]')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 220)
      const tableRows = [...document.querySelectorAll('tbody tr,.ant-table-row,[role="row"],li,.ant-list-item')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 140)
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
        /排序|房型|房间|渠道|订单|拖动|保存|重置|取消|新增|编辑|启用|停用|暂无数据|全部会话/.test(item.text),
      )

      return {
        url: location.href,
        title: document.title,
        bodyLength: bodyText.length,
        bodyTextSample: bodyText.slice(0, 12000),
        isLoginBlocked:
          bodyText.includes('账号登录') ||
          bodyText.includes('账户登录') ||
          bodyText.includes('请按住滑块') ||
          bodyText.includes('登录其他登录方式'),
        hasBusinessText: bodyText.includes('排序设置') || bodyText.includes('排序') || bodyText.includes('拖动'),
        interactions: capturedInteractions,
        componentScreenshots: capturedComponentScreenshots,
        controls,
        buttons,
        inputs,
        tableHeaders,
        tableRows,
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
    const toolbarShot = await screenshotFirstVisible(
      page,
      ['main form', '.ant-form', '.toolbar-card', '.sort-setting-toolbar', '.ant-card:has(button)'],
      'component-toolbar',
    )
    if (toolbarShot) componentScreenshots.push(toolbarShot)
    const listShot = await screenshotFirstVisible(
      page,
      ['.ant-table-wrapper', '.ant-list', 'table', '.sort-setting-list', '.sort-setting-table', '.ant-card'],
      'component-list',
    )
    if (listShot) componentScreenshots.push(listShot)
    const dialogShot = await screenshotFirstVisible(page, ['.ant-modal', '.ant-drawer', '[role="dialog"]'], 'component-dialog')
    if (dialogShot) componentScreenshots.push(dialogShot)
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
          tableRows: facts.tableRows.slice(0, 35),
          options: facts.options.slice(0, 80),
          dialogs: facts.dialogs.slice(0, 10),
          interactions,
          componentScreenshots,
          screenshots: [viewportScreenshot, fullScreenshot],
          dom: domFile,
          styles: styleFile,
          network: networkFile,
          bodySample: normalizeText(facts.bodyTextSample).slice(0, 2400),
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
