import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'zhihui-jiudian--zhizhu-yu-yingjian--shenfenzheng-dukaki'
const TARGET_URL = 'https://minsubao.localhome.cn/smartHotel/smartHardware/IDCardReader'
const LOCAL_BASE_URL =
  process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/smartHotel/smartHardware/IDCardReader'
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

function buildUrl() {
  if (mode === 'target') return TARGET_URL
  if (state === 'empty') return `${LOCAL_BASE_URL}?mockState=empty`
  if (state === 'error') return `${LOCAL_BASE_URL}?mockState=error`
  return LOCAL_BASE_URL
}

async function waitForIdCardReader(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  if (mode === 'clone') {
    await page.waitForSelector('.smart-id-reader-page', { timeout: 30_000 })
  }
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('身份证读卡器') ||
          text.includes('请选择读卡器品牌') ||
          text.includes('请下载插件') ||
          text.includes('请调试读卡') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    )
    .catch((error) => {
      if (mode === 'clone') throw error
    })
  await page.waitForTimeout(1500)
}

async function clickIfVisible(page, locator, action) {
  const count = await locator.count().catch(() => 0)
  if (count === 0) return { action, found: false }

  try {
    await locator.first().click({ timeout: 5000 })
    await page.waitForTimeout(1200)
    return { action, found: true, clicked: true, url: page.url() }
  } catch (error) {
    return {
      action,
      found: true,
      clicked: false,
      error: error instanceof Error ? error.message.split('\n')[0] : String(error),
    }
  }
}

async function applyState(page) {
  const interactions = []

  if (state === 'detail') {
    interactions.push(
      await clickIfVisible(
        page,
        page.getByRole('button', { name: /查看详情/ }),
        'open first record detail drawer',
      ),
    )
    return interactions
  }

  if (state === 'interaction' || state === 'chat-collapsed') {
    interactions.push(
      await clickIfVisible(page, page.getByRole('button', { name: '华视', exact: true }), 'open brand list'),
    )
    interactions.push(
      await clickIfVisible(page, page.getByRole('option', { name: '精伦' }), 'switch brand to 精伦'),
    )
    interactions.push(
      await clickIfVisible(page, page.getByRole('button', { name: 'PMS助手下载' }), 'click download assistant'),
    )
    interactions.push(
      await clickIfVisible(page, page.getByRole('button', { name: '读身份证' }), 'read id card'),
    )
    return interactions
  }

  return interactions
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
      .slice(0, 360)
      .map(summarizeElement)

    const tableHeaders = [...document.querySelectorAll('th,.ant-table-thead .ant-table-cell,[role="columnheader"]')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .map((element) => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim())
      .filter(Boolean)
      .slice(0, 160)

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

    const serviceContract = document.querySelector('[data-testid="smart-id-reader-service-contract"]')
    const feedback = document.querySelector('.smart-id-reader-feedback [role="status"]')

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 9000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasIdCardReaderText:
        bodyText.includes('身份证读卡器') ||
        bodyText.includes('请选择读卡器品牌') ||
        bodyText.includes('最近读卡记录'),
      tableHeaders,
      buttons,
      inputs,
      dropdowns,
      dialogs,
      visibleElements,
      interactions: capturedInteractions,
      feedbackText: feedback?.textContent?.trim() || '',
      serviceContract: serviceContract
        ? {
            provider: serviceContract.getAttribute('data-provider'),
            mockState: serviceContract.getAttribute('data-mock-state'),
            deviceStatus: serviceContract.getAttribute('data-device-status'),
            recordCount: serviceContract.getAttribute('data-record-count'),
            summary: serviceContract.textContent?.trim() || '',
          }
        : null,
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

    await page.goto(buildUrl(), {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForIdCardReader(page)

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
          hasIdCardReaderText: facts.hasIdCardReaderText,
          tableHeaders: facts.tableHeaders,
          buttons: facts.buttons.slice(0, 48),
          inputs: facts.inputs.slice(0, 16),
          dropdownCount: facts.dropdowns.length,
          dialogCount: facts.dialogs.length,
          serviceContract: facts.serviceContract,
          feedbackText: facts.feedbackText,
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
