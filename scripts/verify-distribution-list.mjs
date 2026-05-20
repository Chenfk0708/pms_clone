import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { chromium, expect } from '@playwright/test'

const execFileAsync = promisify(execFile)

const TASK_ID = 'juhe-fenxiao--fenxiao--fenxiao-liebiao'
const LOCAL_URL =
  process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:56130/channels/distribution/distributionSecond'
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const CDP_PORT = Number(process.env.PMS_VERIFY_CDP_PORT ?? 56138)
const STAMP =
  process.env.PMS_VERIFY_STAMP ??
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
  return path.join(root, `verify-local-fixedchrome-${STAMP}-${suffix}.${extension}`)
}

async function waitForCdpReady(port, timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (response.ok) return
    } catch {
      // Keep polling until the Chrome DevTools endpoint is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Chrome CDP endpoint did not become ready on port ${port}`)
}

function stableText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

async function summarizeResponse(response) {
  const contentType = response.headers()['content-type'] || ''
  if (!contentType.includes('application/json')) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function collectPageFacts(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-testid="distribution-list-contract"]')
    return {
      url: location.href,
      title: document.title,
      bodyTextSample: (document.body?.innerText || '').slice(0, 2000),
      rootAttributes: root
        ? {
            provider: root.getAttribute('data-provider'),
            request: root.getAttribute('data-request'),
            endpointCampFlow: root.getAttribute('data-endpoint-camp-flow'),
            endpointRoomCategories: root.getAttribute('data-endpoint-room-categories'),
            endpointUndistributed: root.getAttribute('data-endpoint-undistributed'),
          }
        : null,
    }
  })
}

async function startChrome() {
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Missing Chrome executable: ${CHROME_PATH}`)
  }

  const userDataDir = path.join(os.tmpdir(), `chrome-cdp-${TASK_ID}-${Date.now()}`)
  fs.mkdirSync(userDataDir, { recursive: true })

  const chrome = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--noerrdialogs',
      '--no-first-run',
      '--flag-switches-begin',
      '--flag-switches-end',
      '--do-not-de-elevate',
      'about:blank',
    ],
    {
      detached: false,
      stdio: 'ignore',
      windowsHide: true,
    },
  )

  console.error(`[verify-distribution-list] waiting for Chrome CDP on ${CDP_PORT}`)
  await waitForCdpReady(CDP_PORT)
  console.error('[verify-distribution-list] Chrome CDP is ready')

  return {
    pid: chrome.pid,
    async close() {
      if (chrome.pid) {
        try {
          await execFileAsync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'])
        } catch {
          // Ignore cleanup errors after the verification finishes.
        }
      }
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true })
      } catch {
        // Ignore Windows profile directory cleanup races.
      }
    },
  }
}

async function openFreshPage(browser) {
  const contexts = browser.contexts()
  const context =
    contexts[0] ??
    (await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    }))
  const existingPages = context.pages()
  const page = existingPages[0] ?? (await context.newPage())
  if (page.url() !== 'about:blank') {
    await page.goto('about:blank', { waitUntil: 'domcontentloaded', timeout: 20_000 })
  }
  return { context, page }
}

async function navigateTo(page, url) {
  console.error(`[verify-distribution-list] goto ${url}`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  console.error('[verify-distribution-list] domcontentloaded')
  await page.waitForSelector('[data-testid="distribution-list-contract"]', { timeout: 30_000 })
  console.error('[verify-distribution-list] root selector visible')
  const collapseButton = page.locator('.chat-dock__collapse').first()
  if (await collapseButton.count()) {
    await collapseButton.click().catch(() => {})
  }
  await page.waitForTimeout(300)
}

async function runSuccessFlow(page, summary) {
  console.error('[verify-distribution-list] run success flow')
  await navigateTo(page, LOCAL_URL)
  const root = page.getByTestId('distribution-list-contract')

  await expect(root).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByLabel('聚合分销侧边导航')).toContainText('分销列表')
  await expect(page.getByText('预计渠道订单')).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  await expect(
    page.getByRole('table', { name: '已分销房型表' }).getByText('顶层套房（浴缸巨幕电竞麻将）'),
  ).toBeVisible()

  await root.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('分销列表已刷新')

  await root.getByPlaceholder('搜索房型或原因').fill('观影')
  await root.getByRole('button', { name: '查询', exact: true }).click()
  await expect(root).toHaveAttribute('data-request', /观影/)
  await expect(page.getByRole('table', { name: '已分销房型表' })).toContainText('观影大床房')

  await page.getByRole('button', { name: '详情' }).first().click()
  await expect(page.getByRole('dialog', { name: '分销详情' })).toContainText('渠道同步')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await root.getByRole('button', { name: '房态管理' }).click()
  await expect(page).toHaveURL(/\/houseManage\/months$/)

  await navigateTo(page, LOCAL_URL)
  await root.getByRole('button', { name: '未分销', exact: true }).click()
  await expect(root.getByRole('button', { name: '未分销', exact: true })).toHaveClass(/is-active/)
  await root.getByRole('button', { name: '一键上架' }).click()
  await expect(page.getByRole('status')).toContainText('已创建上架任务')
  await root.getByRole('button', { name: '渠道导入完善' }).click()
  await page.getByRole('menuitem', { name: 'OTA 导入完善' }).click()
  await expect(page.getByRole('status')).toContainText('OTA 导入任务已创建')
  await root.getByRole('button', { name: '导出', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')

  await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'success-viewport', 'png') })
  await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'success-full', 'png'), fullPage: true })
  fs.writeFileSync(fileFor(artifactRoots.dom, 'success-page', 'html'), await page.content())
  summary.success = await collectPageFacts(page)
}

async function runEmptyFlow(page, summary) {
  console.error('[verify-distribution-list] run empty flow')
  await navigateTo(page, `${LOCAL_URL}?state=empty`)
  await expect(page.getByText('当前条件暂无分销房型')).toBeVisible()
  await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'empty-viewport', 'png') })
  fs.writeFileSync(fileFor(artifactRoots.dom, 'empty-page', 'html'), await page.content())
  summary.empty = await collectPageFacts(page)
}

async function runErrorFlow(page, summary) {
  console.error('[verify-distribution-list] run error flow')
  await navigateTo(page, `${LOCAL_URL}?state=error`)
  await expect(page.getByRole('alert')).toContainText('分销列表加载失败')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('status')).toContainText('分销列表已恢复')
  await expect(page.getByTestId('distribution-list-contract')).toHaveAttribute('data-provider', 'mock')
  await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'error-recovered-viewport', 'png') })
  fs.writeFileSync(fileFor(artifactRoots.dom, 'error-recovered-page', 'html'), await page.content())
  summary.errorRecovered = await collectPageFacts(page)
}

async function main() {
  const summary = {
    stamp: STAMP,
    chromePath: CHROME_PATH,
    cdpPort: CDP_PORT,
    localUrl: LOCAL_URL,
    steps: [],
    screenshots: [],
    domSnapshots: [],
    responses: [],
  }

  const chrome = await startChrome()
  console.error('[verify-distribution-list] connecting over CDP')
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`)
  console.error('[verify-distribution-list] connected over CDP')

  try {
    const { page } = await openFreshPage(browser)
    console.error('[verify-distribution-list] page is ready')
    page.on('response', async (response) => {
      summary.responses.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
        resourceType: response.request().resourceType(),
        responseJson: await summarizeResponse(response),
      })
    })

    await runSuccessFlow(page, summary)
    summary.steps.push('success')
    console.error('[verify-distribution-list] success flow done')

    await runEmptyFlow(page, summary)
    summary.steps.push('empty')
    console.error('[verify-distribution-list] empty flow done')

    await runErrorFlow(page, summary)
    summary.steps.push('error-recovered')
    console.error('[verify-distribution-list] error flow done')

    summary.screenshots = [
      fileFor(artifactRoots.screenshots, 'success-viewport', 'png'),
      fileFor(artifactRoots.screenshots, 'success-full', 'png'),
      fileFor(artifactRoots.screenshots, 'empty-viewport', 'png'),
      fileFor(artifactRoots.screenshots, 'error-recovered-viewport', 'png'),
    ]
    summary.domSnapshots = [
      fileFor(artifactRoots.dom, 'success-page', 'html'),
      fileFor(artifactRoots.dom, 'empty-page', 'html'),
      fileFor(artifactRoots.dom, 'error-recovered-page', 'html'),
    ]

    const factsPath = fileFor(artifactRoots.styles, 'verification-facts', 'json')
    const networkPath = fileFor(artifactRoots.network, 'verification-responses', 'json')
    fs.writeFileSync(
      factsPath,
      JSON.stringify(
        {
          ...summary,
          bodySamples: {
            success: stableText(summary.success?.bodyTextSample ?? '').slice(0, 500),
            empty: stableText(summary.empty?.bodyTextSample ?? '').slice(0, 500),
            errorRecovered: stableText(summary.errorRecovered?.bodyTextSample ?? '').slice(0, 500),
          },
        },
        null,
        2,
      ),
    )
    fs.writeFileSync(networkPath, JSON.stringify(summary.responses, null, 2))

    console.log(
      JSON.stringify(
        {
          stamp: STAMP,
          localUrl: LOCAL_URL,
          chromePath: CHROME_PATH,
          cdpPort: CDP_PORT,
          steps: summary.steps,
          screenshots: summary.screenshots,
          domSnapshots: summary.domSnapshots,
          factsPath,
          networkPath,
        },
        null,
        2,
      ),
    )
  } finally {
    await browser.close().catch(() => {})
    await chrome.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
