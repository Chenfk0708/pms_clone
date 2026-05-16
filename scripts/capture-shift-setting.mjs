import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'shezhi--tongyong-shezhi--jiaojieban-shezhi'
const TARGET_URL = 'https://minsubao.localhome.cn/setting/shiftSetting'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/setting/shiftSetting'
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
    const locators = [
      page.getByRole('button', { name: new RegExp(label.replace(/\s+/g, '\\s*')) }).first(),
      page.getByText(label, { exact: true }).first(),
    ]
    for (const locator of locators) {
      if (!(await visible(locator))) continue
      await locator.click({ timeout: 3000 }).catch(() => null)
      await page.waitForTimeout(900)
      return label
    }
  }
  return null
}

async function applyState(page) {
  const interactions = []
  if (state === 'add-shift') {
    const clicked = await clickByText(page, ['班次设置', '点击新增'])
    interactions.push({ action: 'open-shift-dialog', clicked })
  }
  if (state === 'add-item') {
    const clicked = await clickByText(page, ['添加物品'])
    interactions.push({ action: 'open-item-dialog', clicked })
  }
  if (state === 'collapsed') {
    const clicked = await clickByText(page, ['收 起', '收起'])
    interactions.push({ action: 'collapse-chat', clicked })
  }
  return interactions
}

async function screenshotFirst(page, selectors, suffix) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if (!(await visible(locator))) continue
    const outputPath = fileFor(artifactRoots.screenshots, suffix, 'png')
    await locator.screenshot({ path: outputPath }).catch(() => null)
    return { selector, outputPath }
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
        'alignItems',
        'justifyContent',
        'gap',
      ]

      function isVisible(element) {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      }

      function describe(element) {
        const rect = element.getBoundingClientRect()
        const computed = window.getComputedStyle(element)
        const styles = {}
        for (const prop of styleProps) styles[prop] = computed[prop]
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 220),
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          placeholder: element.getAttribute('placeholder'),
          text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500),
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
      const controls = [
        ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
      ]
        .filter(isVisible)
        .map(describe)
        .slice(0, 240)
      const keyElements = [...document.querySelectorAll('body *')]
        .filter(isVisible)
        .map(describe)
        .filter((item) => /班次设置|交班物品|最近更新时间|班次名称|开始时间|结束时间|班次成员|添加物品|暂无/.test(item.text))
        .slice(0, 120)
      const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,[role="columnheader"]')]
        .filter(isVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 120)
      const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
        .filter(isVisible)
        .map(describe)
        .slice(0, 50)

      return {
        url: location.href,
        title: document.title,
        bodyLength: bodyText.length,
        bodyTextSample: bodyText.slice(0, 12000),
        isLoginBlocked: /账号登录|账户登录|请按住滑块|验证码/.test(bodyText),
        hasBusinessText: /班次设置|交班物品|交接班设置/.test(bodyText),
        interactions: capturedInteractions,
        componentScreenshots: capturedComponentScreenshots,
        controls,
        keyElements,
        tableHeaders,
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

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => null)
    await page
      .waitForFunction(() => /班次设置|交班物品|账号登录|请按住滑块/.test(document.body?.innerText || ''), null, {
        timeout: 30_000,
      })
      .catch(() => null)
    await page.waitForTimeout(1800)

    const interactions = await applyState(page)

    const viewportScreenshot = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullScreenshot = fileFor(artifactRoots.screenshots, 'full', 'png')
    await page.screenshot({ path: viewportScreenshot })
    await page.screenshot({ path: fullScreenshot, fullPage: true })

    const componentScreenshots = []
    for (const shot of [
      await screenshotFirst(page, ['main', '[class*="shiftSettingPage"]', '.ant-card', '.page-content'], 'component-main'),
      await screenshotFirst(page, ['.ant-table-wrapper', '.ant-table', 'table'], 'component-table'),
      await screenshotFirst(page, ['.ant-modal,.ant-drawer,[role="dialog"]'], 'component-dialog'),
    ]) {
      if (shot) componentScreenshots.push(shot)
    }

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
          interactions,
          tableHeaders: facts.tableHeaders,
          controls: facts.controls.slice(0, 80),
          keyElements: facts.keyElements.slice(0, 60),
          dialogs: facts.dialogs,
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
