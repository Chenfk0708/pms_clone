import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng'
const TARGET_URL = 'https://minsubao.localhome.cn/smartHotel/smartHardware/mall'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/smartHotel/smartHardware/mall'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const stateArg = process.argv.find((arg) => arg.startsWith('--state='))
const state = stateArg ? stateArg.split('=')[1] : 'default'
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

function compact(text) {
  return text.replace(/\s+/g, ' ').trim()
}

async function waitForSmartHardwareMall(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('智能硬件') ||
          text.includes('智能门锁') ||
          text.includes('身份证') ||
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

async function clickFirst(page, locator, action) {
  if ((await locator.count().catch(() => 0)) === 0) return { action, found: false }
  try {
    await locator.first().click({ timeout: 4000 })
    await page.waitForTimeout(1000)
    return { action, found: true, clicked: true, url: page.url() }
  } catch (error) {
    return { action, found: true, clicked: false, error: error.message.split('\n')[0] }
  }
}

async function applyState(page) {
  if (state === 'first-primary') {
    return [
      await clickFirst(
        page,
        page.getByRole('button').filter({ hasText: /购买|订购|立即|详情|查看|去开通|申请|联系/ }),
        'click first primary action',
      ),
    ]
  }

  if (state === 'first-card') {
    const card = page.locator('.ant-card, [class*="card"], [class*="goods"], [class*="product"]').first()
    if ((await card.count().catch(() => 0)) > 0) {
      try {
        await card.click({ timeout: 4000 })
        await page.waitForTimeout(1000)
        return [{ action: 'click first visible card', found: true, clicked: true, url: page.url() }]
      } catch (error) {
        return [{ action: 'click first visible card', found: true, clicked: false, error: error.message.split('\n')[0] }]
      }
    }
    return [{ action: 'click first visible card', found: false }]
  }

  if (state === 'filter-dropdown') {
    const roleResult = await clickFirst(
      page,
      page.getByRole('button').filter({ hasText: /请选择|全部|类型|分类|品牌|状态/ }),
      'open first filter dropdown by role',
    )
    if (roleResult.clicked) return [roleResult]
    return [
      await clickFirst(
        page,
        page.locator('.ant-select,.ant-dropdown-trigger,[class*="select"]').first(),
        'open first filter dropdown by selector',
      ),
    ]
  }

  if (state === 'chat-collapsed') {
    return [await clickFirst(page, page.getByText('收起', { exact: true }), 'collapse chat dock')]
  }

  return []
}

async function extractFacts(page, interactions) {
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
      'gap',
    ]

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
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
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
      .filter(isVisible)
      .slice(0, 320)
      .map(summarizeElement)

    const tableHeaders = [...document.querySelectorAll('th,.ant-table-thead .ant-table-cell,[role="columnheader"]')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .map((element) => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim())
      .filter(Boolean)
      .slice(0, 140)

    const inputs = [...document.querySelectorAll('input,textarea')]
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        value: element.value || '',
      }))
      .slice(0, 80)

    const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 20)

    const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 20)

    const images = [...document.querySelectorAll('img')]
      .filter(isVisible)
      .map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        rect: summarizeElement(img).rect,
      }))
      .slice(0, 80)

    const cards = [...document.querySelectorAll('.ant-card,[class*="card"],[class*="goods"],[class*="product"]')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 40)

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 7000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasSmartHardwareText:
        bodyText.includes('智能硬件') || bodyText.includes('智能门锁') || bodyText.includes('身份证'),
      tableHeaders,
      buttons,
      inputs,
      dropdowns,
      dialogs,
      images,
      cards,
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
        contentType: response.headers()['content-type'] ?? '',
      })
    })

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForSmartHardwareMall(page)

    const interactions = await applyState(page)
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'full', 'png'), fullPage: true })

    fs.writeFileSync(fileFor(artifactRoots.dom, 'page', 'html'), await page.content())
    const facts = await extractFacts(page, interactions)
    fs.writeFileSync(fileFor(artifactRoots.styles, 'facts', 'json'), JSON.stringify(facts, null, 2))
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
          hasSmartHardwareText: facts.hasSmartHardwareText,
          tableHeaders: facts.tableHeaders,
          buttons: facts.buttons.slice(0, 40),
          inputs: facts.inputs.slice(0, 16),
          images: facts.images.slice(0, 12),
          cardCount: facts.cards.length,
          dropdownCount: facts.dropdowns.length,
          dialogCount: facts.dialogs.length,
          bodySample: compact(facts.bodyTextSample).slice(0, 1200),
          screenshots: [
            fileFor(artifactRoots.screenshots, 'viewport', 'png'),
            fileFor(artifactRoots.screenshots, 'full', 'png'),
          ],
          dom: fileFor(artifactRoots.dom, 'page', 'html'),
          styles: fileFor(artifactRoots.styles, 'facts', 'json'),
          network: fileFor(artifactRoots.network, 'responses', 'json'),
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
