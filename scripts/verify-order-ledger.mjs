import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import net from 'node:net'
import { chromium } from '@playwright/test'

const TASK_ID = 'baobiao--shouzhi-mingxibiao--shouzhi-mingxi'
const ROUTE = '/statistics/orderLedger'
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const DIST_ROOT = path.resolve(process.env.PMS_ORDER_LEDGER_DIST ?? 'tmp/order-ledger-dist')
const SERVER_SCRIPT = path.resolve('tmp/serve-spa.mjs')
const BASE_URL = process.env.PMS_TEST_BASE_URL
const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)

const artifactRoots = {
  screenshots: path.resolve('artifacts/screenshots', TASK_ID),
  dom: path.resolve('artifacts/dom-snapshots', TASK_ID),
  styles: path.resolve('artifacts/style-dumps', TASK_ID),
  network: path.resolve('artifacts/network', TASK_ID),
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function fileFor(root, label, suffix, extension) {
  return path.join(root, `${label}-clone-${stamp}-${suffix}.${extension}`)
}

async function ensureDirs() {
  for (const directory of Object.values(artifactRoots)) {
    await fs.mkdir(directory, { recursive: true })
  }
}

async function readDiagnostics(page) {
  const locator = page.locator('#order-ledger-diagnostics')
  await locator.waitFor({ state: 'attached', timeout: 15_000 })
  const [provider, state, requestRaw] = await Promise.all([
    locator.getAttribute('data-provider'),
    locator.getAttribute('data-state'),
    locator.getAttribute('data-request'),
  ])
  return {
    provider,
    state,
    request: requestRaw ? JSON.parse(requestRaw) : null,
  }
}

async function waitForPageReady(page) {
  await page.waitForSelector('#order-ledger-diagnostics', { state: 'attached', timeout: 15_000 })
  await page.waitForFunction(() => !document.querySelector('.order-ledger-loading'), null, { timeout: 15_000 })
}

async function collapseChatDock(page) {
  const collapse = page.locator('.chat-dock__collapse').first()
  if (await collapse.count()) {
    await collapse.click().catch(() => {})
  }
}

async function setProvider(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.orderLedgerProvider', 'mock')
    window.localStorage.removeItem('pms.orderLedgerMockState')
  })
}

async function openScenario(context, baseUrl, query = '') {
  const page = await context.newPage()
  const responses = []

  page.on('response', async (response) => {
    const request = response.request()
    responses.push({
      url: response.url(),
      status: response.status(),
      method: request.method(),
      resourceType: request.resourceType(),
      contentType: response.headers()['content-type'] ?? '',
    })
  })

  await setProvider(page)
  await page.goto(`${baseUrl}${ROUTE}${query}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await waitForPageReady(page)
  await collapseChatDock(page)
  return { page, responses }
}

async function captureScenario(page, label, responses, assertions) {
  const diagnostics = await readDiagnostics(page)
  const bodyText = await page.locator('body').innerText()
  const screenshotPath = fileFor(artifactRoots.screenshots, label, 'viewport', 'png')
  const fullPath = fileFor(artifactRoots.screenshots, label, 'full', 'png')
  const domPath = fileFor(artifactRoots.dom, label, 'page', 'html')
  const stylePath = fileFor(artifactRoots.styles, label, 'facts', 'json')
  const networkPath = fileFor(artifactRoots.network, label, 'responses', 'json')

  await page.screenshot({ path: screenshotPath })
  await page.screenshot({ path: fullPath, fullPage: true })
  await fs.writeFile(domPath, await page.content(), 'utf8')
  await fs.writeFile(
    stylePath,
    JSON.stringify(
      {
        label,
        url: page.url(),
        diagnostics,
        assertions,
        bodyTextSample: bodyText.slice(0, 4000),
      },
      null,
      2,
    ),
    'utf8',
  )
  await fs.writeFile(
    networkPath,
    JSON.stringify(
      {
        label,
        url: page.url(),
        responses,
      },
      null,
      2,
    ),
    'utf8',
  )

  return {
    label,
    diagnostics,
    screenshotPath,
    fullPath,
    domPath,
    stylePath,
    networkPath,
  }
}

async function waitForRequestMatch(page, matcher, message) {
  await page.waitForFunction(
    (predicateSource) => {
      const el = document.querySelector('#order-ledger-diagnostics')
      const raw = el?.getAttribute('data-request')
      if (!raw) return false
      const request = JSON.parse(raw)
      return Function('request', `return (${predicateSource})(request)`)(request)
    },
    matcher.toString(),
    { timeout: 10_000 },
  )
  const diagnostics = await readDiagnostics(page)
  assert(matcher(diagnostics.request), message)
}

async function verifyDefaultState(page) {
  const diagnostics = await readDiagnostics(page)
  assert(diagnostics.provider === 'mock', '默认 provider 不是 mock')
  assert(diagnostics.state === 'success', '默认 state 不是 success')
  assert(diagnostics.request?.campId === '1796067693589061634', '默认 campId 不匹配')
  assert(diagnostics.request?.beginTime === '2026-05-18', '默认 beginTime 不匹配')
  assert(diagnostics.request?.endTime === '2026-05-19', '默认 endTime 不匹配')
  await page.waitForSelector('a[href="/statistics/report"].is-active', { timeout: 10_000 })
  await page.waitForSelector('a[href="/statistics/orderLedger"].is-active', { timeout: 10_000 })
  await page.waitForSelector('.order-ledger-summary', { timeout: 10_000 })
  await page.waitForSelector('.order-ledger-table tbody tr', { timeout: 10_000 })
  const bodyText = await page.locator('body').innerText()
  assert(!/未接入|阻塞|后端未就绪|mock 数据|provider/i.test(bodyText), '页面正文出现开发态文案')
  assert(bodyText.includes('2056357481704235009'), '默认列表未显示首条订单号')
  return {
    provider: diagnostics.provider,
    state: diagnostics.state,
    request: diagnostics.request,
    routeShell: 'topnav:/statistics/report + sidebar:/statistics/orderLedger',
  }
}

async function verifyFilterInteractions(page) {
  const assertions = []

  await page.locator('.order-ledger-select-field').nth(0).locator('button').click()
  await page.locator('.order-ledger-options [role="option"]').nth(2).click()
  await waitForRequestMatch(page, (request) => request.isIncome === 0, '类型=支出 未映射到 isIncome=0')
  assertions.push('类型=支出 -> isIncome=0')
  await page.waitForSelector('.order-ledger-empty', { timeout: 10_000 })

  await page.locator('.order-ledger-actions .is-outline').click()
  await waitForRequestMatch(
    page,
    (request) => request.isIncome === null && request.type === null,
    '重置后 request 未恢复默认类型/来源',
  )
  assertions.push('重置 -> isIncome/type 复位')

  await page.locator('.order-ledger-select-field').nth(1).locator('button').click()
  await page.locator('.order-ledger-options [role="option"]').nth(1).click()
  await waitForRequestMatch(page, (request) => request.type === 1, '来源=住宿订单 未映射到 type=1')
  assertions.push('来源=住宿订单 -> type=1')

  await page.locator('.order-ledger-select-field').nth(0).locator('button').click()
  await page.locator('.order-ledger-options [role="option"]').nth(1).click()
  await waitForRequestMatch(page, (request) => request.isIncome === 1, '类型=收入 未映射到 isIncome=1')

  await page.locator('.order-ledger-select-field').nth(2).locator('button').click()
  await page.locator('.order-ledger-project-panel input[type="checkbox"]').first().check()
  await page.locator('.order-ledger-project-actions .is-primary').click()
  await waitForRequestMatch(
    page,
    (request) => request.isIncome === 1 && Array.isArray(request.paymentTypeIds) && request.paymentTypeIds[0] === '1',
    '项目=房费 未映射到 paymentTypeIds=["1"]',
  )
  assertions.push('类型=收入 + 项目=房费 -> paymentTypeIds=["1"]')

  await page.locator('.order-ledger-select-field').nth(3).locator('button').click()
  await page.locator('.order-ledger-options [role="option"]').nth(1).click()
  await waitForRequestMatch(
    page,
    (request) => Array.isArray(request.paymentWayIds) && request.paymentWayIds[0] === '2',
    '支付方式=微信 未映射到 paymentWayIds=["2"]',
  )
  assertions.push('支付方式=微信 -> paymentWayIds=["2"]')

  await page.locator('.order-ledger-room-select').click()
  await page.locator('.order-ledger-room-group').nth(1).locator('input[type="checkbox"]').check()
  await page.locator('.order-ledger-room-dialog footer .is-primary').click()
  await waitForRequestMatch(
    page,
    (request) => Array.isArray(request.roomIds) && request.roomIds[0] === '1796425099544543234',
    '房间选择 未映射到目标 roomId',
  )
  assertions.push('房间 -> roomIds=["1796425099544543234"]')

  await page.locator('.order-ledger-actions .is-primary').click()
  await page.waitForSelector('.order-ledger-notice', { timeout: 10_000 })
  const notice = await page.locator('.order-ledger-notice').innerText()
  assert(/order-ledger-export-20260519-001/.test(notice), '导出反馈未返回固定任务号')
  assertions.push('导出 -> mock taskId 返回')

  return assertions
}

async function verifyDetailAndRoutes(page) {
  const assertions = []

  await page.locator('.order-ledger-table tbody tr').first().locator('td').last().locator('button').click()
  await page.waitForSelector('.order-ledger-drawer', { timeout: 10_000 })
  await page.waitForSelector('.order-ledger-payment-dialog', { timeout: 10_000 })
  assertions.push('首行详情 -> 详情抽屉 + 收款记录对话同时可见')

  await page.locator('.order-ledger-more-actions > button').click()
  await page.locator('.order-ledger-more-menu button').nth(0).click()
  await page.waitForURL(/\/order\/house-order\/list$/, { timeout: 10_000 })
  assertions.push('更多操作 -> 查看订单页')

  await page.goBack({ waitUntil: 'domcontentloaded' })
  await waitForPageReady(page)
  await collapseChatDock(page)
  await page.locator('.order-ledger-table tbody tr').first().locator('td').last().locator('button').click()
  await page.locator('.order-ledger-more-actions > button').click()
  await page.locator('.order-ledger-more-menu button').nth(1).click()
  await page.waitForURL(/\/statistics\/roomSituation$/, { timeout: 10_000 })
  assertions.push('更多操作 -> 查看房态页')

  await page.goBack({ waitUntil: 'domcontentloaded' })
  await waitForPageReady(page)
  await collapseChatDock(page)
  await page.locator('.order-ledger-table tbody tr').first().locator('td').last().locator('button').click()
  await page.waitForSelector('.order-ledger-drawer', { timeout: 10_000 })
  await page.waitForSelector('.order-ledger-payment-dialog', { timeout: 10_000 })
  assertions.push('回到收支明细后重新打开详情，供本地 clone 取证')

  return assertions
}

async function verifyEmptyState(page) {
  const diagnostics = await readDiagnostics(page)
  assert(diagnostics.state === 'empty', 'empty 场景 data-state 不为 empty')
  await page.waitForSelector('.order-ledger-empty', { timeout: 10_000 })
  const text = await page.locator('.order-ledger-summary').innerText()
  assert(/0\.00/.test(text), 'empty 场景汇总未归零')
  return ['mockState=empty -> 空态与零汇总']
}

async function verifyErrorState(page) {
  const diagnostics = await readDiagnostics(page)
  assert(diagnostics.state === 'error', 'error 场景 data-state 不为 error')
  await page.waitForSelector('.order-ledger-error', { timeout: 10_000 })
  await page.waitForSelector('.order-ledger-error button', { timeout: 10_000 })
  return ['mockState=error -> 错误反馈与重试入口']
}

async function getAvailablePort(start = 4194) {
  let port = start
  while (port < start + 50) {
    const free = await new Promise((resolve) => {
      const server = net.createServer()
      server.once('error', () => resolve(false))
      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(true))
      })
    })
    if (free) return port
    port += 1
  }
  throw new Error(`Unable to find free port from ${start}`)
}

async function startServer() {
  if (BASE_URL) {
    return { baseUrl: BASE_URL, stop: async () => {} }
  }

  await fs.access(DIST_ROOT)
  await fs.access(SERVER_SCRIPT)
  const port = await getAvailablePort()
  const server = spawn(process.execPath, [SERVER_SCRIPT, DIST_ROOT, String(port)], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Static server did not start on port ${port}`))
    }, 15_000)

    server.stdout.on('data', (chunk) => {
      const text = String(chunk)
      if (text.includes(`ready:${port}`)) {
        clearTimeout(timer)
        resolve()
      }
    })

    server.stderr.on('data', (chunk) => {
      const text = String(chunk)
      if (text.trim()) {
        console.error(text)
      }
    })

    server.on('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`Static server exited before ready with code ${code}`))
    })
  })

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    stop: async () => {
      server.kill()
      await new Promise((resolve) => server.once('exit', resolve))
    },
  }
}

async function main() {
  await ensureDirs()
  await fs.access(CHROME_PATH)

  const server = await startServer()
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })

  const results = []

  try {
    const defaultScenario = await openScenario(context, server.baseUrl)
    const defaultAssertions = await verifyDefaultState(defaultScenario.page)
    results.push(await captureScenario(defaultScenario.page, 'default', defaultScenario.responses, defaultAssertions))
    await defaultScenario.page.close()

    const interactionScenario = await openScenario(context, server.baseUrl)
    const interactionAssertions = await verifyFilterInteractions(interactionScenario.page)
    results.push(
      await captureScenario(interactionScenario.page, 'interaction', interactionScenario.responses, interactionAssertions),
    )
    await interactionScenario.page.close()

    const detailScenario = await openScenario(context, server.baseUrl)
    const detailAssertions = await verifyDetailAndRoutes(detailScenario.page)
    results.push(await captureScenario(detailScenario.page, 'detail', detailScenario.responses, detailAssertions))
    await detailScenario.page.close()

    const emptyScenario = await openScenario(context, server.baseUrl, '?mockState=empty')
    const emptyAssertions = await verifyEmptyState(emptyScenario.page)
    results.push(await captureScenario(emptyScenario.page, 'empty', emptyScenario.responses, emptyAssertions))
    await emptyScenario.page.close()

    const errorScenario = await openScenario(context, server.baseUrl, '?mockState=error')
    const errorAssertions = await verifyErrorState(errorScenario.page)
    results.push(await captureScenario(errorScenario.page, 'error', errorScenario.responses, errorAssertions))
    await errorScenario.page.close()

    console.log(
      JSON.stringify(
        {
          taskId: TASK_ID,
          route: ROUTE,
          baseUrl: server.baseUrl,
          stamp,
          scenarios: results,
          checks: [
            'default provider/state/request contract',
            'route shell active state',
            'filter parameter mapping',
            'export feedback',
            'detail drawer and payment dialog',
            'route handoff to order and room situation',
            'empty state',
            'error state',
          ],
          status: 'passed',
        },
        null,
        2,
      ),
    )
  } finally {
    await context.close()
    await browser.close()
    await server.stop()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
