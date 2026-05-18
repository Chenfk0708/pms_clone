import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'ota--shemei--shemei'
const TARGET_URL = 'https://minsubao.localhome.cn/channels/social'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/channels/social'
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

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('社媒') ||
          text.includes('已直连渠道') ||
          text.includes('未直连渠道') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1200)
}

async function extractFacts(page) {
  return page.evaluate(() => {
    const visible = [...document.querySelectorAll('button,a,input,select,table,[role="dialog"],article,section')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      })
      .slice(0, 180)
      .map((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          className: String(element.className || '').slice(0, 140),
          text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          styles: {
            display: style.display,
            position: style.position,
            fontSize: style.fontSize,
            color: style.color,
            backgroundColor: style.backgroundColor,
            border: style.border,
            borderRadius: style.borderRadius,
          },
        }
      })

    const bodyText = document.body?.innerText || ''
    const buttons = visible.filter((item) => item.tag === 'button' || item.role === 'button')
    const inputs = visible.filter((item) => item.tag === 'input' || item.tag === 'select')

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 5000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('社媒') &&
        (bodyText.includes('已直连渠道') || bodyText.includes('社媒渠道运营') || bodyText.includes('未直连渠道')),
      forbiddenTermsFound: ['mock 数据', 'mock provider', '未接入', '阻塞', '后端未就绪', '后端接口未完成'].filter((term) =>
        bodyText.includes(term),
      ),
      buttons,
      inputs,
      visible,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  })
}

async function runInteractions(page) {
  const actions = []
  for (const label of ['查询', '刷新', '导出', '更多', '管理渠道', '订阅开通']) {
    const locator = page.getByRole('button', { name: label }).first()
    if ((await locator.count()) === 0) continue
    try {
      await locator.click({ timeout: 2500 })
      await page.waitForTimeout(500)
      actions.push({ label, ok: true, url: page.url() })
      await page.screenshot({
        path: fileFor(artifactRoots.screenshots, `after-${label.replace(/[\\/:*?"<>|]+/g, '-')}`, 'png'),
      })
      if (page.url() !== (mode === 'target' ? TARGET_URL : LOCAL_URL)) {
        await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, { waitUntil: 'domcontentloaded' })
        await waitForSurface(page)
      }
    } catch (error) {
      actions.push({ label, ok: false, error: error.message })
    }
  }
  return actions
}

async function main() {
  if (mode === 'target' && !fs.existsSync(STORAGE_STATE)) throw new Error(`Missing storageState: ${STORAGE_STATE}`)
  if (!fs.existsSync(CHROME_PATH)) throw new Error(`Missing Chrome executable: ${CHROME_PATH}`)

  const network = []
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true })
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
      let responseBody = null
      const contentType = response.headers()['content-type'] || ''
      if (contentType.includes('application/json') || response.url().includes('hudson-prod.localhome.cn')) {
        try {
          responseBody = (await response.text()).slice(0, 1600)
        } catch {
          responseBody = null
        }
      }
      network.push({
        url: response.url(),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        postData: request.postData()?.slice(0, 800) ?? null,
        responseBody,
      })
    })

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await waitForSurface(page)
    const interactions = state === 'interaction' ? await runInteractions(page) : []

    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(artifactRoots.screenshots, 'full', 'png'), fullPage: true })
    fs.writeFileSync(fileFor(artifactRoots.dom, 'page', 'html'), await page.content())

    const facts = await extractFacts(page)
    fs.writeFileSync(fileFor(artifactRoots.styles, 'facts', 'json'), JSON.stringify({ mode, state, stamp, interactions, facts }, null, 2))
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
          forbiddenTermsFound: facts.forbiddenTermsFound,
          buttons: facts.buttons.slice(0, 30),
          requestCount: network.length,
          screenshots: [fileFor(artifactRoots.screenshots, 'viewport', 'png'), fileFor(artifactRoots.screenshots, 'full', 'png')],
          dom: fileFor(artifactRoots.dom, 'page', 'html'),
          styles: fileFor(artifactRoots.styles, 'facts', 'json'),
          network: fileFor(artifactRoots.network, 'responses', 'json'),
          interactionCount: interactions.length,
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
