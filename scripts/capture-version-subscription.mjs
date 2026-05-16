import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'yingyong-dingyue--quanyi-yu-dingyue--banben-dingyue'
const TARGET_URL = 'https://minsubao.localhome.cn/version/subscriptionCenter'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/version/subscriptionCenter'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const state = process.argv.includes('--interaction') ? 'interaction' : 'default'
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

function compactText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

async function waitForPageSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('版本订阅') ||
          text.includes('订阅中心') ||
          text.includes('应用订阅') ||
          text.includes('权益') ||
          text.includes('购买') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1600)
}

async function extractPageFacts(page) {
  return page.evaluate(() => {
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
      'alignItems',
      'justifyContent',
      'gap',
    ]

    function textOf(element) {
      return (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim()
    }

    function isVisible(element) {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    function summarizeElement(element) {
      const rect = element.getBoundingClientRect()
      const computed = window.getComputedStyle(element)
      const styles = {}
      for (const prop of styleProps) styles[prop] = computed[prop]
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 180),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        placeholder: element.getAttribute('placeholder'),
        text: textOf(element).slice(0, 360),
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
    const visibleElements = [...document.querySelectorAll('body *')].filter(isVisible).slice(0, 420).map(summarizeElement)
    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .filter(isVisible)
      .map((element) => ({
        text: (textOf(element) || element.getAttribute('aria-label') || '').trim(),
        href: element.getAttribute('href'),
        className: String(element.className || '').slice(0, 140),
      }))
      .filter((item) => item.text)
      .slice(0, 220)
    const inputs = [...document.querySelectorAll('input,textarea,[contenteditable="true"]')]
      .filter(isVisible)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value || element.textContent || '',
      }))
      .slice(0, 80)
    const tables = [...document.querySelectorAll('table,.ant-table,.ant-table-wrapper,[role="table"]')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 60)
    const businessElements = visibleElements.filter((item) =>
      /版本|订阅|权益|套餐|高级版|旗舰版|畅享版|购买|续费|升级|开通|到期|金额|明细|协议|路客商城/.test(item.text),
    )

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 10000),
      isLoginBlocked: bodyText.includes('账号登录') || bodyText.includes('请按住滑块') || bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('版本订阅') || bodyText.includes('订阅中心') || bodyText.includes('应用订阅') || bodyText.includes('权益'),
      buttons,
      inputs,
      tables,
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

async function clickFirstMatching(page, patterns) {
  for (const pattern of patterns) {
    const locator = page.getByText(pattern, { exact: false }).first()
    if ((await locator.count()) === 0) continue
    try {
      await locator.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      return { label: String(pattern), clicked: true, url: page.url() }
    } catch (error) {
      return { label: String(pattern), error: error.message }
    }
  }
  return { clicked: false }
}

async function runInteractionSweep(page) {
  const interactions = []
  const groups = [
    [/立即购买/, /立即开通/, /订阅开通/, /去续费/],
    [/商品详情/, /查看详情/, /详情/],
    [/购买协议/, /产品服务购买协议/, /协议/],
    [/我的权益/],
    [/置换权益/],
    [/应用订阅/],
    [/路客商城/],
  ]

  for (const patterns of groups) {
    const result = await clickFirstMatching(page, patterns)
    interactions.push({ patterns: patterns.map(String), result })
    const safeName = patterns[0].source.replace(/[\\/:*?"<>|]+/g, '-')
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, `after-${safeName}`, 'png') }).catch(() => {})
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(300)
  }

  return interactions
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
        contentType: response.headers()['content-type'] ?? '',
      })
    })

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await waitForPageSurface(page)

    const interactions = state === 'interaction' ? await runInteractionSweep(page) : []
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'full', 'png'), fullPage: true })
    fs.writeFileSync(fileFor(artifactRoots.dom, 'page', 'html'), await page.content())

    const facts = await extractPageFacts(page)
    fs.writeFileSync(
      fileFor(artifactRoots.styles, 'facts', 'json'),
      JSON.stringify({ mode, state, stamp, interactions, facts }, null, 2),
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
          buttons: facts.buttons.slice(0, 70),
          inputs: facts.inputs.slice(0, 20),
          tableCount: facts.tables.length,
          businessElements: facts.businessElements.slice(0, 30),
          screenshots: [
            fileFor(artifactRoots.screenshots, 'viewport', 'png'),
            fileFor(artifactRoots.screenshots, 'full', 'png'),
          ],
          dom: fileFor(artifactRoots.dom, 'page', 'html'),
          styles: fileFor(artifactRoots.styles, 'facts', 'json'),
          network: fileFor(artifactRoots.network, 'responses', 'json'),
          interactionCount: interactions.length,
          bodySample: compactText(facts.bodyTextSample).slice(0, 2200),
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
