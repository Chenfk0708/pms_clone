import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'shezhi--xinxi-weihu--xinxi-gailan'
const TARGET_URL =
  process.env.PMS_TARGET_URL ?? 'https://minsubao.localhome.cn/InformationMaintenance/informationOverview'
const LOCAL_URL =
  process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/InformationMaintenance/informationOverview'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const state = process.argv.includes('--interaction') ? 'interaction' : 'default'
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

function safeName(label) {
  return label.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
}

function stableText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('信息概览') ||
          text.includes('门店信息') ||
          text.includes('门店流量') ||
          text.includes('数字化门店') ||
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

async function screenshotComponent(page, name, selector) {
  const locator = page.locator(selector).first()
  if ((await locator.count()) === 0) return false
  try {
    await locator.screenshot({ path: fileFor(artifactRoots.screenshots, `component-${name}`, 'png') })
    return true
  } catch {
    return false
  }
}

async function extractFacts(page) {
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
      'backgroundImage',
      'border',
      'borderRadius',
      'boxShadow',
      'overflow',
      'gridTemplateColumns',
      'gridTemplateRows',
      'alignItems',
      'justifyContent',
      'gap',
    ]

    function textOf(element) {
      return (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim()
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

    const visibleElements = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      })
      .slice(0, 420)
      .map(summarizeElement)

    const bodyText = document.body?.innerText || ''
    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .map((element) => ({
        text: textOf(element) || element.getAttribute('aria-label') || '',
        href: element.getAttribute('href'),
        className: String(element.className || '').slice(0, 140),
      }))
      .filter((item) => item.text)
      .slice(0, 220)

    const headings = [...document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')]
      .map((element) => summarizeElement(element))
      .slice(0, 80)

    const informationElements = visibleElements.filter((item) =>
      /门店|流量|数字化|信息|完善度|能力|同行|上架|导入|新增|去完善|房型|资质|图片|视频|OTA|社媒|私域/.test(
        item.text,
      ),
    )

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 8000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('信息概览') &&
        bodyText.includes('门店信息') &&
        bodyText.includes('门店流量') &&
        bodyText.includes('数字化门店'),
      buttons,
      headings,
      informationElements,
      visibleElements,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  })
}

async function clickFirstVisibleText(page, label) {
  const locator = page.getByText(label, { exact: true }).first()
  if ((await locator.count()) === 0) return false
  try {
    await locator.click({ timeout: 2500 })
    await page.waitForTimeout(800)
    return true
  } catch (error) {
    return { error: error.message }
  }
}

async function runInteractionSweep(page) {
  const interactions = []
  const labels = ['修改 >', '去完善', '一键导入', '一键新增', '查看更多 >', '查看详情', '立即预订']
  for (const label of labels) {
    const result = await clickFirstVisibleText(page, label)
    if (result) {
      interactions.push({ action: `click:${label}`, result, url: page.url() })
      await page.screenshot({
        path: fileFor(artifactRoots.screenshots, `after-${safeName(label)}`, 'png'),
      })
    }
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
      })
    })

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForSurface(page)

    const interactions = state === 'interaction' ? await runInteractionSweep(page) : []
    const componentScreenshots = {
      summary: await screenshotComponent(page, 'summary', '.settings-summary, .ant-card:has-text("门店：")'),
      storeInfo: await screenshotComponent(page, 'store-info', '.settings-panel:has-text("门店信息"), .ant-card:has-text("信息完善度")'),
      traffic: await screenshotComponent(page, 'traffic', '.settings-panel:has-text("门店流量"), .ant-card:has-text("流量获取能力")'),
      phone: await screenshotComponent(page, 'phone-preview', '.phone-preview, .phone-view, .mini-program-preview'),
    }
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'full', 'png'), fullPage: true })

    fs.writeFileSync(fileFor(artifactRoots.dom, 'page', 'html'), await page.content())

    const facts = await extractFacts(page)
    fs.writeFileSync(
      fileFor(artifactRoots.styles, 'facts', 'json'),
      JSON.stringify({ mode, state, stamp, interactions, componentScreenshots, facts }, null, 2),
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
          isLoginBlocked: facts.isLoginBlocked,
          hasBusinessText: facts.hasBusinessText,
          bodyLength: facts.bodyLength,
          buttons: facts.buttons.slice(0, 60),
          headings: facts.headings.slice(0, 30),
          componentScreenshots,
          screenshots: [
            fileFor(artifactRoots.screenshots, 'viewport', 'png'),
            fileFor(artifactRoots.screenshots, 'full', 'png'),
          ],
          dom: fileFor(artifactRoots.dom, 'page', 'html'),
          styles: fileFor(artifactRoots.styles, 'facts', 'json'),
          network: fileFor(artifactRoots.network, 'responses', 'json'),
          interactionCount: interactions.length,
          bodySample: stableText(facts.bodyTextSample).slice(0, 1600),
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
