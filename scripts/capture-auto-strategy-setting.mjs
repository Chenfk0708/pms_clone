import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'shezhi--tongyong-shezhi--zidong-celue-shezhi'
const TARGET_URL = 'https://minsubao.localhome.cn/setting/IntelligenceSetting'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/setting/IntelligenceSetting'
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

async function visible(locator) {
  return (await locator.count().catch(() => 0)) > 0 && (await locator.first().isVisible().catch(() => false))
}

async function clickByText(page, labels) {
  for (const label of labels) {
    const candidates = [
      page.getByRole('button', { name: new RegExp(label.split('').join('\\s*')) }).first(),
      page.getByText(label, { exact: true }).first(),
      page.locator(`label:has-text("${label}")`).first(),
      page.locator(`.ant-switch:near(:text("${label}"))`).first(),
    ]
    for (const locator of candidates) {
      if (!(await visible(locator))) continue
      await locator.click({ timeout: 2500 }).catch(() => null)
      await page.waitForTimeout(900)
      return label
    }
  }
  return null
}

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('自动策略设置') ||
          text.includes('智能保洁') ||
          text.includes('自动创建') ||
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
  if (state === 'first-toggle') {
    let clicked = await clickByText(page, ['自动创建', '开启', '关闭'])
    if (!clicked) {
      const firstSwitch = page.getByRole('switch').first()
      if (await visible(firstSwitch)) {
        const wasChecked = await firstSwitch.getAttribute('aria-checked').catch(() => null)
        await firstSwitch.click({ timeout: 2500 }).catch(() => null)
        if (mode === 'clone' && wasChecked === 'true') {
          await page.waitForTimeout(200)
          await firstSwitch.click({ timeout: 2500 }).catch(() => null)
        }
        await page.waitForTimeout(900)
        clicked = 'first-switch'
      }
    }
    interactions.push({ action: 'toggle-first-switch', clicked })
  }
  if (state === 'time-setting') {
    interactions.push({ action: 'open-time-setting', clicked: await clickByText(page, ['设置保洁时段', '设置时段', '保洁时段']) })
  }
  if (state === 'subscribe') {
    interactions.push({ action: 'click-subscribe', clicked: await clickByText(page, ['订阅开通', '立即开通']) })
  }
  if (state === 'chat-collapsed') {
    interactions.push({ action: 'collapse-chat', clicked: await clickByText(page, ['收起']) })
  }
  return interactions
}

async function screenshotFirst(page, selectors, suffix) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if (!(await visible(locator))) continue
    const outputPath = fileFor(artifactRoots.screenshots, suffix, 'png')
    await locator.screenshot({ path: outputPath }).catch(() => null)
    return outputPath
  }
  return null
}

async function extractFacts(page, interactions, componentScreenshots) {
  return page.evaluate(
    ({ capturedInteractions, capturedComponentScreenshots }) => {
      const props = [
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
      ]
      const isVisible = (element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      }
      const describe = (element) => {
        const rect = element.getBoundingClientRect()
        const computed = window.getComputedStyle(element)
        const styles = {}
        for (const prop of props) styles[prop] = computed[prop]
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 180),
          text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 520),
          role: element.getAttribute('role'),
          placeholder: element.getAttribute('placeholder'),
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
      const elements = [...document.querySelectorAll('body *')].filter(isVisible)
      const controls = elements
        .filter((element) =>
          /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(element.tagName) ||
          element.getAttribute('role') ||
          String(element.className || '').includes('ant-switch') ||
          String(element.className || '').includes('ant-select'),
        )
        .map(describe)
        .slice(0, 280)
      const keyElements = elements
        .map(describe)
        .filter((item) => /自动|策略|保洁|房态|延期|退房|入住|换房|取消|时段|密码|订阅|开通|保存|取消|全部会话/.test(item.text))
        .slice(0, 180)
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,.ant-card-head-title')]
        .filter(isVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
      const switches = [...document.querySelectorAll('.ant-switch,[role="switch"]')].filter(isVisible).map(describe)
      const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')].filter(isVisible).map(describe)
      return {
        url: location.href,
        title: document.title,
        bodyLength: bodyText.length,
        bodyTextSample: bodyText.slice(0, 14000),
        isLoginBlocked: bodyText.includes('账号登录') || bodyText.includes('请按住滑块'),
        hasBusinessText:
          bodyText.includes('自动策略设置') || bodyText.includes('自动创建') || bodyText.includes('智能保洁'),
        interactions: capturedInteractions,
        componentScreenshots: capturedComponentScreenshots,
        headings,
        controls,
        keyElements,
        switches,
        dialogs,
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
    network.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
      resourceType: response.request().resourceType(),
      contentType: response.headers()['content-type'] ?? '',
    })
  })
  await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await waitForSurface(page)
  const interactions = await applyState(page)

  const viewportScreenshot = fileFor(artifactRoots.screenshots, 'viewport', 'png')
  const fullScreenshot = fileFor(artifactRoots.screenshots, 'full', 'png')
  await page.screenshot({ path: viewportScreenshot })
  await page.screenshot({ path: fullScreenshot, fullPage: true })

  const componentScreenshots = []
  for (const output of [
    await screenshotFirst(page, ['main', '.page-content', '.setting-content', '.ant-card'], 'main-component'),
    await screenshotFirst(page, ['.ant-modal', '.ant-drawer', '[role="dialog"]'], 'dialog-component'),
  ]) {
    if (output) componentScreenshots.push(output)
  }

  const facts = await extractFacts(page, interactions, componentScreenshots)
  const domFile = fileFor(artifactRoots.dom, 'page', 'html')
  const styleFile = fileFor(artifactRoots.styles, 'facts', 'json')
  const networkFile = fileFor(artifactRoots.network, 'responses', 'json')

  await fs.writeFile(domFile, await page.content(), 'utf8')
  await fs.writeFile(styleFile, JSON.stringify({ mode, state, stamp, facts }, null, 2), 'utf8')
  await fs.writeFile(networkFile, JSON.stringify({ mode, state, stamp, url: page.url(), responses: network }, null, 2), 'utf8')

  console.log(
    JSON.stringify(
      {
        mode,
        state,
        stamp,
        url: page.url(),
        isLoginBlocked: facts.isLoginBlocked,
        hasBusinessText: facts.hasBusinessText,
        headings: facts.headings,
        switches: facts.switches.length,
        dialogs: facts.dialogs.length,
        interactions,
        screenshots: [viewportScreenshot, fullScreenshot],
        componentScreenshots,
        dom: domFile,
        styles: styleFile,
        network: networkFile,
        bodySample: normalizeText(facts.bodyTextSample).slice(0, 2600),
      },
      null,
      2,
    ),
  )

  await context.close()
} finally {
  await browser.close()
}
