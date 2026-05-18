import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'dingdan--yushouquan-dingdan--yushouquan-dingdan'
const TARGET_URL = 'https://minsubao.localhome.cn/mallManagement/orderManagement'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/mallManagement/orderManagement'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH = process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const mode = process.argv.includes('--target') ? 'target' : 'clone'
const state = process.env.PMS_CAPTURE_STATE ?? 'success'
const stamp = process.env.PMS_CAPTURE_STAMP ?? new Date().toISOString().replace(/\D/g, '').slice(0, 14)

const roots = {
  screenshots: path.resolve('artifacts/screenshots', TASK_ID),
  dom: path.resolve('artifacts/dom-snapshots', TASK_ID),
  styles: path.resolve('artifacts/style-dumps', TASK_ID),
  network: path.resolve('artifacts/network', TASK_ID),
}

for (const directory of Object.values(roots)) fs.mkdirSync(directory, { recursive: true })

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stamp}-${suffix}.${extension}`)
}

function localUrlForState() {
  if (mode === 'target') return TARGET_URL
  if (state === 'empty' || state === 'error') return `${LOCAL_URL}?mockState=${state}`
  return LOCAL_URL
}

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return text.includes('预售券订单') || text.includes('账号登录') || text.includes('请按住滑块')
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(800)
}

async function extractFacts(page) {
  return page.evaluate(() => {
    const bodyText = document.body?.innerText || ''
    const forbiddenTerms = ['mock', 'provider', 'traceId', '未接入', '阻塞', '后端未就绪', '后端接口未完成', 'mock 数据']
    const pageText = document.querySelector('.presale-order-page')?.textContent || ''
    const contract = document.querySelector('[data-testid="presale-order-service-contract"]')
    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodySample: bodyText.replace(/\s+/g, ' ').trim().slice(0, 1600),
      isLoginBlocked: bodyText.includes('账号登录') || bodyText.includes('请按住滑块') || bodyText.includes('登录其他登录方式'),
      hasBusinessText: bodyText.includes('预售券订单') && (bodyText.includes('订单详情') || bodyText.includes('暂无数据')),
      forbiddenTermsFound: forbiddenTerms.filter((term) => pageText.toLowerCase().includes(term.toLowerCase())),
      buttons: [...document.querySelectorAll('button')]
        .map((button) => (button.innerText || button.getAttribute('aria-label') || '').trim())
        .filter(Boolean)
        .slice(0, 80),
      inputs: [...document.querySelectorAll('input')]
        .map((input) => ({
          type: input.getAttribute('type'),
          placeholder: input.getAttribute('placeholder'),
          ariaLabel: input.getAttribute('aria-label'),
          value: input.value,
        }))
        .slice(0, 40),
      contract: contract
        ? {
            provider: contract.getAttribute('data-provider'),
            responseState: contract.getAttribute('data-response-state'),
            traceId: contract.getAttribute('data-trace-id'),
            requestBody: contract.getAttribute('data-request-body'),
          }
        : null,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  })
}

async function main() {
  if (mode === 'target' && !fs.existsSync(STORAGE_STATE)) {
    throw new Error(`Missing storageState: ${STORAGE_STATE}`)
  }

  const responses = []
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
      responses.push({
        url: response.url(),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        postData: request.postData()?.slice(0, 2000) ?? null,
      })
    })

    await page.goto(localUrlForState(), { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await waitForSurface(page)

    if (state === 'detail') {
      await page.getByRole('button', { name: '订单详情' }).first().click().catch(() => {})
      await page.waitForTimeout(500)
    }

    await page.screenshot({ path: fileFor(roots.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(roots.screenshots, 'full', 'png'), fullPage: true })
    fs.writeFileSync(fileFor(roots.dom, 'page', 'html'), await page.content())

    const facts = await extractFacts(page)
    fs.writeFileSync(fileFor(roots.styles, 'facts', 'json'), JSON.stringify({ mode, state, stamp, facts }, null, 2))
    fs.writeFileSync(
      fileFor(roots.network, 'responses', 'json'),
      JSON.stringify({ mode, state, stamp, url: page.url(), responses }, null, 2),
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
          forbiddenTermsFound: facts.forbiddenTermsFound,
          contract: facts.contract,
          responseCount: responses.length,
          screenshots: [fileFor(roots.screenshots, 'viewport', 'png'), fileFor(roots.screenshots, 'full', 'png')],
          dom: fileFor(roots.dom, 'page', 'html'),
          styles: fileFor(roots.styles, 'facts', 'json'),
          network: fileFor(roots.network, 'responses', 'json'),
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
