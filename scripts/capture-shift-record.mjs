import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'baobiao--jiaojieban--jiaojieban'
const TARGET_URL = 'https://minsubao.localhome.cn/statistics/shift/record'
const LOCAL_BASE_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4188/statistics/shift/record'
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

const relevantEndpoints = ['/shiftWorkReport/page/get', '/select/poi/page/get', '/campRoles/get']

for (const directory of Object.values(artifactRoots)) {
  await fs.mkdir(directory, { recursive: true })
}

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stamp}-${suffix}.${extension}`)
}

function normalizeText(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

function resolveLocalUrl() {
  const url = new URL(LOCAL_BASE_URL)
  if (state === 'empty' || state === 'error') {
    url.searchParams.set('mockState', state)
  } else {
    url.searchParams.delete('mockState')
  }
  return url.toString()
}

function summarizeJsonBody(value) {
  if (!value || typeof value !== 'object') return value
  const record = value
  if (Array.isArray(record)) {
    return {
      type: 'array',
      length: record.length,
      firstItemKeys: record[0] && typeof record[0] === 'object' ? Object.keys(record[0]).slice(0, 20) : [],
    }
  }

  const data = record.data && typeof record.data === 'object' ? record.data : null
  return {
    keys: Object.keys(record).slice(0, 20),
    success: 'success' in record ? record.success : undefined,
    code: 'code' in record ? record.code : undefined,
    message: 'message' in record ? record.message : undefined,
    errorCode: 'errorCode' in record ? record.errorCode : undefined,
    errorMsg: 'errorMsg' in record ? record.errorMsg : undefined,
    dataKeys: data ? Object.keys(data).slice(0, 20) : [],
    dataListLength: Array.isArray(data?.list) ? data.list.length : undefined,
    total: typeof data?.total === 'number' ? data.total : undefined,
    employeeCount: Array.isArray(data?.employees) ? data.employees.length : undefined,
  }
}

async function locatorVisible(locator) {
  return (await locator.count().catch(() => 0)) > 0 && (await locator.first().isVisible().catch(() => false))
}

async function waitForBusinessSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('交接班') ||
          text.includes('交班') ||
          text.includes('接班') ||
          text.includes('班次') ||
          text.includes('备用金') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 30_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1500)
}

async function applyState(page) {
  const interactions = []

  if (state === 'query') {
    const startDate = page.getByLabel('开始日期')
    const endDate = page.getByLabel('结束日期')
    const store = page.getByLabel('门店')
    const handover = page.getByLabel('交班人')
    if (await locatorVisible(startDate)) {
      await startDate.fill('2026-05-18')
      await endDate.fill('2026-05-18')
      await store.selectOption('1796425098638573570').catch(() => {})
      await handover.selectOption('1796067693261905922').catch(() => {})
      await page.getByRole('button', { name: '查询' }).click().catch(() => {})
      await page.waitForTimeout(900)
      interactions.push({
        action: 'query',
        startDate: '2026-05-18',
        endDate: '2026-05-18',
        storeId: '1796425098638573570',
        handoverUserId: '1796067693261905922',
      })
    }
  }

  if (state === 'detail') {
    const detailButton = page.getByRole('button', { name: /查看详情/ }).first()
    if (await locatorVisible(detailButton)) {
      await detailButton.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-detail' })
    }
  }

  if (state === 'settings') {
    const settingsButton = page.locator('.shift-record-actions .is-setting').first()
    if (await locatorVisible(settingsButton)) {
      await settingsButton.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-settings' })
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
      // Try the next selector.
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
      const visibleElements = [...document.querySelectorAll('body *')].filter(elementVisible).slice(0, 520).map(describe)
      const controls = [
        ...document.querySelectorAll('button,a,input,textarea,select,[role="button"],[role="combobox"]'),
      ]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 280)
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
        .slice(0, 180)
      const inputs = [...document.querySelectorAll('input,textarea,select')]
        .filter(elementVisible)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          type: element.getAttribute('type'),
          placeholder: element.getAttribute('placeholder'),
          ariaLabel: element.getAttribute('aria-label'),
          value: element.value,
        }))
        .slice(0, 120)
      const tableHeaders = [...document.querySelectorAll('th,[role="columnheader"]')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 180)
      const tableRows = [...document.querySelectorAll('tbody tr,[role="row"]')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 120)
      const dialogs = [...document.querySelectorAll('[role="dialog"]')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 50)
      const options = [...document.querySelectorAll('option,[role="option"]')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 180)
      const contractText = document.querySelector('[aria-label="交接班数据服务"]')?.textContent?.trim() || ''

      return {
        url: location.href,
        title: document.title,
        bodyLength: bodyText.length,
        bodyTextSample: bodyText.slice(0, 10000),
        isLoginBlocked:
          bodyText.includes('账号登录') ||
          bodyText.includes('账户登录') ||
          bodyText.includes('请按住滑块') ||
          bodyText.includes('登录其他登录方式'),
        hasBusinessText:
          bodyText.includes('交接班') ||
          bodyText.includes('交班') ||
          bodyText.includes('接班') ||
          bodyText.includes('班次'),
        serviceContractText: contractText,
        interactions: capturedInteractions,
        componentScreenshots: capturedComponentScreenshots,
        controls,
        buttons,
        inputs,
        tableHeaders,
        tableRows,
        dialogs,
        options,
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

async function captureResponse(response) {
  const url = response.url()
  const request = response.request()
  const requestBodyText = request.postData() || ''
  const isRelevant = relevantEndpoints.some((endpoint) => url.includes(endpoint))
  let responseBodyText = ''
  let responseSummary = null

  if (isRelevant) {
    try {
      responseBodyText = await response.text()
      responseSummary = summarizeJsonBody(JSON.parse(responseBodyText))
    } catch {
      responseSummary = { rawLength: responseBodyText.length }
    }
  }

  return {
    url,
    status: response.status(),
    method: request.method(),
    resourceType: request.resourceType(),
    contentType: response.headers()['content-type'] ?? '',
    requestBody: requestBodyText ? JSON.parse(requestBodyText) : null,
    responseSummary,
    responseBodySample: responseBodyText ? responseBodyText.slice(0, 2000) : '',
  }
}

async function main() {
  if (mode === 'target') await fs.access(STORAGE_STATE)
  await fs.access(CHROME_PATH)

  const network = []
  const responseTasks = []
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
      responseTasks.push(
        captureResponse(response)
          .then((entry) => {
            network.push(entry)
          })
          .catch(() => {
            network.push({
              url: response.url(),
              status: response.status(),
              method: response.request().method(),
              resourceType: response.request().resourceType(),
              contentType: response.headers()['content-type'] ?? '',
              requestBody: null,
              responseSummary: { captureError: true },
              responseBodySample: '',
            })
          }),
      )
    })

    await page.goto(mode === 'target' ? TARGET_URL : resolveLocalUrl(), {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)
    const interactions = await applyState(page)
    await Promise.allSettled(responseTasks)

    const viewportScreenshot = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullScreenshot = fileFor(artifactRoots.screenshots, 'full', 'png')
    await page.screenshot({ path: viewportScreenshot })
    await page.screenshot({ path: fullScreenshot, fullPage: true })

    const componentScreenshots = []
    const filterShot = await screenshotFirstVisible(page, ['.shift-record-query', 'main form'], 'component-filters')
    if (filterShot) componentScreenshots.push(filterShot)
    const tableShot = await screenshotFirstVisible(page, ['.shift-record-table-wrap', 'table'], 'component-table')
    if (tableShot) componentScreenshots.push(tableShot)
    const dialogShot = await screenshotFirstVisible(page, ['[role="dialog"]'], 'component-dialog')
    if (dialogShot) componentScreenshots.push(dialogShot)

    const facts = await extractFacts(page, interactions, componentScreenshots)
    const domFile = fileFor(artifactRoots.dom, 'page', 'html')
    const styleFile = fileFor(artifactRoots.styles, 'facts', 'json')
    const networkFile = fileFor(artifactRoots.network, 'responses', 'json')

    const matchedContracts = network.filter((entry) => relevantEndpoints.some((endpoint) => entry.url.includes(endpoint)))

    await fs.writeFile(domFile, await page.content(), 'utf8')
    await fs.writeFile(styleFile, JSON.stringify({ mode, state, stamp, facts }, null, 2), 'utf8')
    await fs.writeFile(
      networkFile,
      JSON.stringify(
        {
          mode,
          state,
          stamp,
          url: page.url(),
          hiddenServiceContract: facts.serviceContractText,
          matchedContracts,
          responses: network,
        },
        null,
        2,
      ),
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
          hiddenServiceContract: facts.serviceContractText,
          bodyLength: facts.bodyLength,
          buttons: facts.buttons.slice(0, 80),
          inputs: facts.inputs.slice(0, 50),
          tableHeaders: facts.tableHeaders.slice(0, 90),
          tableRows: facts.tableRows.slice(0, 30),
          options: facts.options.slice(0, 80),
          interactions,
          matchedContracts,
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
