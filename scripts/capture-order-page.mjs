import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'dingdan--zhusu-dingdan--zhusu-dingdan'
const TARGET_URL = 'https://minsubao.localhome.cn/order/house-order/list'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/order/house-order/list'
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

function stableText(text) {
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
          text.includes('住宿订单') ||
          text.includes('订单号') ||
          text.includes('录入订单') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(2500)
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

    const visibleElements = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      })
      .slice(0, 220)
      .map(summarizeElement)

    const bodyText = document.body?.innerText || ''
    const buttons = [...document.querySelectorAll('button,[role="button"]')]
      .map((element) => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim())
      .filter(Boolean)
      .slice(0, 120)
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

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 3000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasOrderPageText: bodyText.includes('住宿订单') || bodyText.includes('订单号'),
      buttons,
      inputs,
      tables,
      visibleElements,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  })
}

async function clickIfVisible(page, label, note) {
  const target = page.getByText(label, { exact: true }).first()
  if ((await target.count()) === 0) return false
  try {
    await target.click({ timeout: 2000 })
    await page.waitForTimeout(900)
    return true
  } catch (error) {
    return { note, error: error.message }
  }
}

async function runInteractionSweep(page) {
  const interactions = []

  for (const label of ['展开', '收起']) {
    const result = await clickIfVisible(page, label, label)
    if (result) interactions.push({ action: `click:${label}`, result })
  }

  const orderSearch = page.locator('input[placeholder*="订单"], input[placeholder*="姓名"], input[placeholder*="手机"]').first()
  if ((await orderSearch.count()) > 0) {
    await orderSearch.fill('张')
    const queryClicked = await clickIfVisible(page, '查询', 'query after keyword')
    interactions.push({ action: 'fill:keyword 张', queryClicked })
    await page.waitForTimeout(900)
  }

  for (const label of ['全部', '今日新单', '今日预抵', '今日在住', '待排房']) {
    const result = await clickIfVisible(page, label, label)
    if (result) interactions.push({ action: `quick-filter:${label}`, result })
  }

  const detailTargets = [
    page.getByText('详情', { exact: true }).first(),
    page.locator('button:has-text("详情")').first(),
    page.locator('tbody tr').first(),
    page.locator('.ant-table-row').first(),
    page.locator('.data-table__row').first(),
  ]
  for (const locator of detailTargets) {
    if ((await locator.count()) === 0) continue
    try {
      await locator.click({ timeout: 2500 })
      await page.waitForTimeout(1200)
      interactions.push({ action: 'open:first-detail-or-row', result: true })
      break
    } catch (error) {
      interactions.push({ action: 'open:first-detail-or-row', result: false, error: error.message })
    }
  }

  return interactions
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

    const interactions = state === 'interaction' ? await runInteractionSweep(page) : []
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'full', 'png'), fullPage: true })

    const html = await page.content()
    fs.writeFileSync(fileFor(artifactRoots.dom, 'page', 'html'), html)

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
          hasOrderPageText: facts.hasOrderPageText,
          buttons: facts.buttons.slice(0, 30),
          inputs: facts.inputs.slice(0, 12),
          screenshots: [
            fileFor(artifactRoots.screenshots, 'viewport', 'png'),
            fileFor(artifactRoots.screenshots, 'full', 'png'),
          ],
          dom: fileFor(artifactRoots.dom, 'page', 'html'),
          styles: fileFor(artifactRoots.styles, 'facts', 'json'),
          network: fileFor(artifactRoots.network, 'responses', 'json'),
          interactionCount: interactions.length,
          bodySample: stableText(facts.bodyTextSample).slice(0, 600),
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
