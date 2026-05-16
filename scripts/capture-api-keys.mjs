import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'shezhi--qiye-shezhi--api-keys'
const TARGET_URL = 'https://minsubao.localhome.cn/CompanySetting/Apikeys'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/CompanySetting/Apikeys'
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

function redactSecrets(value) {
  return String(value ?? '')
    .replace(/(access[_-]?key|secret|token|api[_-]?key|apikey)(["':=\s]+)([^"',\s<]{6,})/gi, '$1$2[REDACTED]')
    .replace(/\b1[3-9]\d{9}\b/g, '[REDACTED_PHONE]')
    .replace(/\b(?:sk|ak|rk|api)[_-]?[A-Za-z0-9]{16,}\b/g, '[REDACTED_KEY]')
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[REDACTED_TOKEN]')
}

function redactObject(value) {
  return JSON.parse(JSON.stringify(value), (_key, item) => (typeof item === 'string' ? redactSecrets(item) : item))
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
      page.getByRole('link', { name: new RegExp(pattern) }).first(),
      page.getByText(label, { exact: true }).first(),
      page.locator(`[aria-label*="${label}"]`).first(),
      page.locator(`.ant-select-selector:has-text("${label}")`).first(),
    ]
    for (const locator of candidates) {
      if (!(await locatorVisible(locator))) continue
      try {
        await locator.click({ timeout: 3000 })
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
          text.includes('API keys') ||
          text.includes('API key') ||
          text.includes('Apikey') ||
          text.includes('企业设置') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 30_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1600)
}

async function applyState(page) {
  const interactions = []

  if (state === 'create-blocked' || state === 'primary-blocked') {
    await page.route('**/*', async (route) => {
      const request = route.request()
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
        interactions.push({
          action: 'blocked-mutating-request',
          method: request.method(),
          url: request.url(),
        })
        await route.abort('blockedbyclient')
        return
      }
      await route.continue()
    })
    const clicked = await clickFirstVisible(page, ['获取API keys', '获取API key', '新增', '新 增', '创建', '生成'])
    interactions.push({ action: 'open-create-with-mutations-blocked', clicked })
    await page.waitForTimeout(1600)
  }

  if (state === 'create' || state === 'primary-action') {
    const clicked = await clickFirstVisible(page, ['新增', '新 增', '创建', '添加', '生成', '创建 API key'])
    interactions.push({ action: 'open-create', clicked })
  }

  if (state === 'copy-action') {
    const clicked = await clickFirstVisible(page, ['复制', '查看', '显示'])
    interactions.push({ action: 'copy-or-reveal', clicked })
  }

  if (state === 'delete-action') {
    const clicked = await clickFirstVisible(page, ['删除', '移除'])
    interactions.push({ action: 'open-delete-confirm', clicked })
  }

  if (state === 'first-select') {
    const select = page.locator('.ant-select-selector,[role="combobox"]').first()
    if (await locatorVisible(select)) {
      await select.click({ timeout: 3000 }).catch(async () => select.click({ force: true, timeout: 3000 }).catch(() => {}))
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-first-select', clicked: true })
    } else {
      interactions.push({ action: 'open-first-select', clicked: false })
    }
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
      // Try another selector.
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
      const visibleElements = [...document.querySelectorAll('body *')].filter(elementVisible).slice(0, 560).map(describe)
      const controls = [
        ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
      ]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 320)
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
        .slice(0, 220)
      const inputs = [...document.querySelectorAll('input,textarea')]
        .filter(elementVisible)
        .map((element) => ({
          type: element.getAttribute('type'),
          placeholder: element.getAttribute('placeholder'),
          ariaLabel: element.getAttribute('aria-label'),
          value: element.value,
        }))
        .slice(0, 150)
      const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,[role="columnheader"]')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 220)
      const tableRows = [...document.querySelectorAll('tr,.ant-table-row,[role="row"]')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 100)
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
        .slice(0, 200)
      const keyElements = visibleElements.filter((item) =>
        /API|key|keys|密钥|企业设置|创建|新增|删除|启用|禁用|复制|暂无数据|更新时间|调用/.test(item.text),
      )

      return {
        url: location.href,
        title: document.title,
        bodyLength: bodyText.length,
        bodyTextSample: bodyText.slice(0, 14000),
        isLoginBlocked:
          bodyText.includes('账号登录') ||
          bodyText.includes('账户登录') ||
          bodyText.includes('请按住滑块') ||
          bodyText.includes('登录其他登录方式'),
        hasBusinessText:
          bodyText.includes('API keys') ||
          bodyText.includes('API key') ||
          bodyText.includes('企业设置') ||
          bodyText.includes('Apikey'),
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
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true })

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
    const actionShot = await screenshotFirstVisible(
      page,
      ['.ant-card:has(button)', '.ant-form', 'main form', '[class*="filter"]', '[class*="toolbar"]'],
      'component-actions',
    )
    if (actionShot) componentScreenshots.push(actionShot)
    const tableShot = await screenshotFirstVisible(
      page,
      ['.ant-table-wrapper', '.ant-table', 'table', '[role="table"]'],
      'component-table',
    )
    if (tableShot) componentScreenshots.push(tableShot)
    const dialogShot = await screenshotFirstVisible(
      page,
      ['.ant-modal', '.ant-drawer', '[role="dialog"]'],
      'component-dialog',
    )
    if (dialogShot) componentScreenshots.push(dialogShot)

    const rawHtml = await page.content()
    const facts = await extractFacts(page, interactions, componentScreenshots)
    const domFile = fileFor(artifactRoots.dom, 'page', 'html')
    const styleFile = fileFor(artifactRoots.styles, 'facts', 'json')
    const networkFile = fileFor(artifactRoots.network, 'responses', 'json')
    const safeFacts = redactObject(facts)

    await fs.writeFile(domFile, redactSecrets(rawHtml), 'utf8')
    await fs.writeFile(styleFile, JSON.stringify({ mode, state, stamp, facts: safeFacts }, null, 2), 'utf8')
    await fs.writeFile(
      networkFile,
      JSON.stringify({ mode, state, stamp, url: page.url(), responses: redactObject(network) }, null, 2),
      'utf8',
    )

    console.log(
      JSON.stringify(
        {
          mode,
          state,
          stamp,
          url: page.url(),
          isLoginBlocked: safeFacts.isLoginBlocked,
          hasBusinessText: safeFacts.hasBusinessText,
          bodyLength: safeFacts.bodyLength,
          buttons: safeFacts.buttons.slice(0, 90),
          inputs: safeFacts.inputs.slice(0, 60),
          tableHeaders: safeFacts.tableHeaders.slice(0, 130),
          tableRows: safeFacts.tableRows.slice(0, 14),
          options: safeFacts.options.slice(0, 90),
          interactions,
          componentScreenshots,
          screenshots: [viewportScreenshot, fullScreenshot],
          dom: domFile,
          styles: styleFile,
          network: networkFile,
          bodySample: redactSecrets(normalizeText(safeFacts.bodyTextSample)).slice(0, 2400),
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
