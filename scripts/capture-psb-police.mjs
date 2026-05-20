import fs from 'node:fs'
import path from 'node:path'
import { chromium, devices } from '@playwright/test'

const TASK_ID = 'zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie'
const TARGET_URL = 'https://minsubao.localhome.cn/psb/list'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const DESKTOP_CHROME = devices['Desktop Chrome']

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

function resolveLocalUrl() {
  const configured = process.env.PMS_LOCAL_URL ?? process.env.PMS_TEST_BASE_URL
  if (!configured) {
    throw new Error(
      'Missing PMS_LOCAL_URL or PMS_TEST_BASE_URL for clone capture. Refusing to default to :4173.',
    )
  }

  return /\/psb\/list(?:[/?#]|$)/.test(configured)
    ? configured
    : new URL('/psb/list', configured).toString()
}

async function waitForPsbPage(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('PSB公安对接') ||
          text.includes('公安对接') ||
          text.includes('上报日志') ||
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

async function clickFirst(page, locator, action) {
  if ((await locator.count().catch(() => 0)) === 0) return { action, found: false }
  try {
    await locator.first().click({ timeout: 5000 })
    await page.waitForTimeout(1000)
    return { action, found: true, clicked: true, url: page.url() }
  } catch (error) {
    return { action, found: true, clicked: false, error: error.message.split('\n')[0] }
  }
}

async function applyState(page) {
  if (state === 'primary-action') {
    return [
      await clickFirst(
        page,
        page
          .getByRole('button')
          .filter({ hasText: /新\s*增|添加|接入|配置|绑定|立即|开通|授权|编辑|设置/ }),
        'click first primary action',
      ),
    ]
  }

  if (state === 'filter-dropdown') {
    const roleResult = await clickFirst(
      page,
      page.getByRole('button').filter({ hasText: /请选择|全部|状态|门店|城市|类型|平台|省份/ }),
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
    return [await clickFirst(page, page.getByText('收 起', { exact: true }), 'collapse chat dock')]
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
      'background',
      'border',
      'borderRadius',
      'boxShadow',
      'overflow',
      'gridTemplateColumns',
      'gap',
      'alignItems',
      'justifyContent',
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
        href: element.getAttribute('href'),
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 360),
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
      .slice(0, 380)
      .map(summarizeElement)

    const tableHeaders = [...document.querySelectorAll('th,.ant-table-thead .ant-table-cell,[role="columnheader"]')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const topNavActive = [...document.querySelectorAll('.topnav-link.is-active')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const sideNavActive = [...document.querySelectorAll('.sidebar-group-title.is-active,.sidebar-link.is-active')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const diagnosticsText =
      document.querySelector('[aria-label="PSB公安对接数据服务"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''

    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .map((element) => ({
        text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim(),
        href: element.getAttribute('href'),
        className: String(element.className || '').slice(0, 120),
      }))
      .filter((item) => item.text || item.href)
      .slice(0, 180)

    const inputs = [...document.querySelectorAll('input,textarea')]
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        value: element.value || '',
      }))
      .slice(0, 100)

    const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 20)

    const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 20)

    const cards = [...document.querySelectorAll('.ant-card,[class*="card"],[class*="panel"],[class*="table"],[class*="form"]')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 60)

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

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 9000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasPsbText: bodyText.includes('PSB公安对接') || bodyText.includes('公安对接'),
      topNavActive,
      sideNavActive,
      diagnosticsText,
      tableHeaders,
      buttons,
      inputs,
      dropdowns,
      dialogs,
      cards,
      images,
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
  const pageUrl = mode === 'target' ? TARGET_URL : resolveLocalUrl()

  const network = []
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })

  try {
    const context = await browser.newContext({
      ...DESKTOP_CHROME,
      ...(mode === 'target' ? { storageState: STORAGE_STATE } : {}),
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

    await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForPsbPage(page)

    const interactions = await applyState(page)
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'full', 'png'), fullPage: true })

    fs.writeFileSync(fileFor(artifactRoots.dom, 'page', 'html'), await page.content())
    const facts = {
      ...(await extractFacts(page, interactions)),
      state,
      responses: network,
    }
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
          hasPsbText: facts.hasPsbText,
          tableHeaders: facts.tableHeaders,
          buttons: facts.buttons.slice(0, 50),
          inputs: facts.inputs.slice(0, 24),
          dropdowns: facts.dropdowns.length,
          dialogs: facts.dialogs.length,
          cards: facts.cards.slice(0, 12),
          images: facts.images.slice(0, 12),
          bodySample: compact(facts.bodyTextSample).slice(0, 1600),
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
