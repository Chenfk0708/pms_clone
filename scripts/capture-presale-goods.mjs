import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'shoumai-chanpin--yushouquan--yushouquan'
const TARGET_URL = 'https://minsubao.localhome.cn/mallManagement/goodsManagement'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/mallManagement/goodsManagement'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const stateArg = process.argv.find((arg) => arg.startsWith('--state='))
const state = stateArg?.split('=')[1] ?? 'default'
const stamp =
  process.env.PMS_CAPTURE_STAMP ??
  new Date().toISOString().replace(/\D/g, '').slice(0, 14)

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

function compactText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

async function waitForBusinessSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('商品名称') ||
          text.includes('新增预售券') ||
          text.includes('门店管理') ||
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

async function clickByText(page, label) {
  const target = page.getByText(label, { exact: true }).first()
  if ((await target.count()) === 0) return false
  await target.click({ timeout: 3000 })
  await page.waitForTimeout(900)
  return true
}

async function clickFirstMatchingButton(page, pattern) {
  const button = page.locator('button').filter({ hasText: pattern }).first()
  if ((await button.count()) === 0) return false
  await button.click({ timeout: 3000 })
  await page.waitForTimeout(900)
  return true
}

async function runState(page) {
  const interactions = []

  if (state === 'channel-dropdown') {
    const opened = await clickFirstMatchingButton(page, /请选择渠道|渠道/)
    interactions.push({ action: 'open:channel-dropdown', opened })
  }

  if (state === 'type-dropdown') {
    const opened = await clickFirstMatchingButton(page, /卡券类型|全部/)
    interactions.push({ action: 'open:type-dropdown', opened })
  }

  if (state === 'status-tabs') {
    for (const label of ['销售中', '已售罄', '仓库中']) {
      const clicked = await clickByText(page, label)
      interactions.push({ action: `click:${label}`, clicked })
    }
  }

  if (state === 'expanded') {
    const clicked = await clickByText(page, '全部展开')
    interactions.push({ action: 'click:全部展开', clicked })
  }

  if (state === 'search') {
    const input = page.locator('input[placeholder*="商品"], input[placeholder*="搜索"], input[type="text"]').first()
    if ((await input.count()) > 0) {
      await input.fill('券')
      interactions.push({ action: 'fill:search', value: '券' })
    }
    const queried = await clickByText(page, '搜 索')
    interactions.push({ action: 'click:搜 索', clicked: queried })
  }

  if (state === 'new-dialog') {
    const clicked = await clickByText(page, '新增预售券')
    interactions.push({ action: 'click:新增预售券', clicked })
  }

  return interactions
}

async function extractPageFacts(page, interactions) {
  return page.evaluate((capturedInteractions) => {
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
      'gridTemplateColumns',
    ]

    function summarizeElement(element) {
      const rect = element.getBoundingClientRect()
      const computed = window.getComputedStyle(element)
      const styles = {}
      for (const prop of styleProps) styles[prop] = computed[prop]
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 160),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        placeholder: element.getAttribute('placeholder'),
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 220),
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
      .slice(0, 260)
      .map(summarizeElement)

    const buttons = [...document.querySelectorAll('button,[role="button"]')]
      .map((element) => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim())
      .filter(Boolean)
      .slice(0, 140)

    const inputs = [...document.querySelectorAll('input,textarea,[contenteditable="true"]')]
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value || element.textContent || '',
      }))
      .slice(0, 80)

    const tables = [...document.querySelectorAll('table,.ant-table,.data-table,[role="table"]')]
      .map(summarizeElement)
      .slice(0, 20)

    const tabTexts = [...document.querySelectorAll('button,[role="tab"],.ant-tabs-tab')]
      .map((element) => (element.innerText || element.textContent || '').trim())
      .filter((text) => ['全部', '销售中', '已售罄', '仓库中'].includes(text))

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 4000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('商品名称') &&
        bodyText.includes('新增预售券') &&
        bodyText.includes('门店管理'),
      buttons,
      inputs,
      tables,
      tabTexts,
      visibleElements,
      interactions: capturedInteractions,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  }, interactions)
}

async function main() {
  if (mode === 'target' && !fs.existsSync(STORAGE_STATE)) {
    throw new Error(`Missing storageState: ${STORAGE_STATE}`)
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
    const interactions = await runState(page)
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'full', 'png'), fullPage: true })

    const html = await page.content()
    fs.writeFileSync(fileFor(artifactRoots.dom, 'page', 'html'), html)

    const facts = await extractPageFacts(page, interactions)
    fs.writeFileSync(
      fileFor(artifactRoots.styles, 'facts', 'json'),
      JSON.stringify({ mode, state, stamp, facts }, null, 2),
    )
    fs.writeFileSync(
      fileFor(artifactRoots.network, 'responses', 'json'),
      JSON.stringify({ mode, state, stamp, url: page.url(), responses: network }, null, 2),
    )

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
          buttons: facts.buttons.slice(0, 40),
          inputs: facts.inputs.slice(0, 16),
          tabs: facts.tabTexts,
          screenshots: [
            fileFor(artifactRoots.screenshots, 'viewport', 'png'),
            fileFor(artifactRoots.screenshots, 'full', 'png'),
          ],
          dom: fileFor(artifactRoots.dom, 'page', 'html'),
          styles: fileFor(artifactRoots.styles, 'facts', 'json'),
          network: fileFor(artifactRoots.network, 'responses', 'json'),
          bodySample: compactText(facts.bodyTextSample).slice(0, 800),
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
