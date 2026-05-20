import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju'
const TARGET_URL = 'https://minsubao.localhome.cn/channels/globalRadar/globalData'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/channels/globalRadar/globalData'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const argSet = new Set(process.argv.slice(2))
const mode = argSet.has('--clone') ? 'clone' : 'target'
const state = readState(argSet)
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

function readState(args) {
  if (args.has('--interaction')) return 'interaction'
  if (args.has('--empty')) return 'empty'
  if (args.has('--error')) return 'error'
  if (args.has('--success')) return 'success'
  return 'default'
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
          text.includes('全域数据') ||
          text.includes('AI全域雷达') ||
          text.includes('配置中心') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1_000)
}

async function collapseChatDock(page) {
  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').last()
  if (await collapseButton.count()) {
    await collapseButton.click().catch(() => {})
    await page.waitForTimeout(300)
  }
}

async function applyCloneState(page) {
  const mockState = state === 'default' ? 'success' : state === 'interaction' ? 'success' : state
  await page.addInitScript((configuredState) => {
    window.localStorage.setItem('pms.aiGlobalDataProvider', 'mock')
    window.localStorage.setItem('pms.aiGlobalDataMockState', configuredState)
  }, mockState)
}

async function runInteractionSweep(page) {
  const interactions = []

  const steps = [
    async () => {
      await page.locator('#ai-global-data-filter-camp').selectOption('camp-haizhu')
      await page.locator('#ai-global-data-filter-channel').selectOption('meituan')
      await page.locator('#ai-global-data-filter-attention').selectOption('high')
      await page.locator('#ai-global-data-filter-room-keyword').fill('大床')
      await page.locator('.ai-global-data-filters__actions button').first().click()
      await page.waitForTimeout(800)
      interactions.push({
        action: 'query',
        feedback: await page.locator('.ai-global-data-feedback').innerText(),
      })
    },
    async () => {
      await page.locator('.ai-global-data-summary-card').first().click()
      await page.locator('.ai-global-data-modal[aria-label="指标详情"]').waitFor({ state: 'visible', timeout: 5_000 })
      interactions.push({ action: 'open-metric-dialog', ok: true })
      await page.locator('.ai-global-data-modal[aria-label="指标详情"] button[aria-label="关闭指标详情"]').click()
    },
    async () => {
      await page.locator('[aria-label="强提醒列表"] .ai-global-data-reminder').first().locator('button').nth(1).click()
      interactions.push({
        action: 'postpone-reminder',
        feedback: await page.locator('.ai-global-data-feedback').innerText(),
      })
    },
    async () => {
      await page.locator('[aria-label="房型经营看板"] .ai-global-data-table__row').first().locator('button').nth(1).click()
      await page.locator('.ai-global-data-modal[aria-label="房型经营详情"]').waitFor({ state: 'visible', timeout: 5_000 })
      interactions.push({ action: 'open-room-dialog', ok: true })
      await page.locator('.ai-global-data-modal[aria-label="房型经营详情"] button[aria-label="关闭房型经营详情"]').click()
    },
    async () => {
      await page.getByTestId('ai-global-data-refresh').click()
      await page.waitForTimeout(800)
      await page.getByTestId('ai-global-data-export').click()
      interactions.push({
        action: 'refresh-and-export',
        feedback: await page.locator('.ai-global-data-feedback').innerText(),
      })
    },
  ]

  for (const step of steps) {
    await step()
  }

  return interactions
}

async function extractFacts(page) {
  return page.evaluate(() => {
    const bodyText = document.body?.innerText || ''
    const contractNode = document.querySelector('[data-testid="ai-global-data-contract"]')
    return {
      url: location.href,
      title: document.title,
      bodyTextSample: bodyText.slice(0, 8000),
      bodyLength: bodyText.length,
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('全域数据') &&
        bodyText.includes('房型经营看板') &&
        bodyText.includes('强提醒列表'),
      forbiddenTermsFound: ['mock 数据', 'mock provider', 'provider=mock', '未接入', '待接入', '阻塞', '后端未就绪', '后端接口未完成'].filter((term) =>
        bodyText.includes(term),
      ),
      rootDataset: document.querySelector('.ai-global-data-page')?.dataset ?? null,
      contractText: contractNode?.textContent?.slice(0, 6000) ?? '',
      buttons: [...document.querySelectorAll('button,a')]
        .map((element) => ({
          text: (element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
          ariaLabel: element.getAttribute('aria-label'),
          className: String(element.className || '').slice(0, 180),
          href: element.getAttribute('href'),
        }))
        .filter((item) => item.text)
        .slice(0, 180),
      fields: [...document.querySelectorAll('select,input')]
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          id: element.getAttribute('id'),
          ariaLabel: element.getAttribute('aria-label'),
          value: element.value,
        }))
        .slice(0, 80),
      dialogs: [...document.querySelectorAll('.ai-global-data-modal')]
        .map((element) => ({
          ariaLabel: element.getAttribute('aria-label'),
          text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500),
        }))
        .slice(0, 20),
    }
  })
}

async function main() {
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Missing Chrome executable: ${CHROME_PATH}`)
  }
  if (mode === 'target' && !fs.existsSync(STORAGE_STATE)) {
    throw new Error(`Missing storageState: ${STORAGE_STATE}`)
  }

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  })

  const network = []

  try {
    const context = await browser.newContext({
      ...(mode === 'target' ? { storageState: STORAGE_STATE } : {}),
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    })
    const page = await context.newPage()

    if (mode === 'clone') {
      await applyCloneState(page)
    }

    page.on('response', (response) => {
      const request = response.request()
      network.push({
        url: response.url(),
        method: request.method(),
        status: response.status(),
        resourceType: request.resourceType(),
        postData: request.postData() ?? '',
      })
    })

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForSurface(page)
    await collapseChatDock(page)

    const interactions = mode === 'clone' && state === 'interaction' ? await runInteractionSweep(page) : []

    const viewportPath = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullPath = fileFor(artifactRoots.screenshots, 'full', 'png')
    const domPath = fileFor(artifactRoots.dom, 'page', 'html')
    const factsPath = fileFor(artifactRoots.styles, 'facts', 'json')
    const networkPath = fileFor(artifactRoots.network, 'responses', 'json')

    await page.screenshot({ path: viewportPath })
    await page.screenshot({ path: fullPath, fullPage: true })

    fs.writeFileSync(domPath, await page.content(), 'utf8')

    const facts = await extractFacts(page)
    const payload = {
      taskId: TASK_ID,
      mode,
      state,
      stamp,
      interactions,
      diagnostics: mode === 'clone' ? await page.evaluate(() => window.localStorage.getItem('pms.aiGlobalData.lastRequest')) : null,
      facts,
    }

    fs.writeFileSync(factsPath, JSON.stringify(payload, null, 2))
    fs.writeFileSync(
      networkPath,
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode,
          state,
          stamp,
          url: page.url(),
          responses: network,
        },
        null,
        2,
      ),
    )

    console.log(
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode,
          state,
          stamp,
          url: page.url(),
          screenshots: [viewportPath, fullPath],
          dom: domPath,
          styles: factsPath,
          network: networkPath,
          interactionCount: interactions.length,
          forbiddenTermsFound: facts.forbiddenTermsFound,
          rootDataset: facts.rootDataset,
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
