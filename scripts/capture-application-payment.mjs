import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'yingyong-dingyue--quanyi-yu-dingyue--yingyong-dingyue'
const targetUrl = 'https://minsubao.localhome.cn/version/applicationPayment'
const localBaseUrl = process.env.PMS_LOCAL_URL ?? process.env.PMS_TEST_BASE_URL
const cloneUrl = localBaseUrl ? `${localBaseUrl.replace(/\/$/, '')}/version/applicationPayment` : ''
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const stateArg = process.argv.find((arg) => arg.startsWith('--state='))
const state = stateArg ? stateArg.split('=')[1] : 'default'
const stamp =
  process.env.PMS_CAPTURE_STAMP ?? new Date().toISOString().replace(/\D/g, '').slice(0, 14)

const artifactDirs = {
  screenshots: path.resolve('artifacts/screenshots', taskId),
  dom: path.resolve('artifacts/dom-snapshots', taskId),
  styles: path.resolve('artifacts/style-dumps', taskId),
  network: path.resolve('artifacts/network', taskId),
}

for (const directory of Object.values(artifactDirs)) {
  await fs.mkdir(directory, { recursive: true })
}

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stamp}-${suffix}.${extension}`)
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('应用订阅') ||
          text.includes('权益与订阅') ||
          text.includes('商品详情') ||
          text.includes('购买信息') ||
          text.includes('立即购买') ||
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

async function clickFirstVisible(page, labels, interactions) {
  for (const label of labels) {
    const button = page.getByRole('button', { name: label }).first()
    const text = page.getByText(label, { exact: true }).first()
    const locator = (await button.count().catch(() => 0)) > 0 ? button : text
    if ((await locator.count().catch(() => 0)) === 0) continue
    try {
      await locator.click({ timeout: 4000 })
      await page.waitForTimeout(1200)
      interactions.push({ action: `click:${label}`, clicked: true, url: page.url() })
      return true
    } catch (error) {
      interactions.push({ action: `click:${label}`, clicked: false, error: error.message.split('\n')[0] })
    }
  }
  return false
}

async function applyState(page) {
  const interactions = []

  if (state === 'first-tab') {
    await clickFirstVisible(page, ['全部', '未订阅', '已订阅', '营销获客', '智能经营', '效率工具'], interactions)
  }

  if (state === 'second-tab') {
    await clickFirstVisible(page, ['营销获客', '智能经营', '效率工具', '其他', 'SCRM'], interactions)
  }

  if (state === 'detail' || state === 'primary-action') {
    const clicked = await clickFirstVisible(
      page,
      ['立即开通', '订阅开通', '立即购买', '购买', '商品详情', '查看详情', '开通'],
      interactions,
    )
    if (!clicked) {
      const cards = page.locator('.ant-card, [class*="card"], [class*="item"], [class*="product"]').filter({
        hasText: /智能|企微|SCRM|保洁|雷达|应用|订阅/,
      })
      if ((await cards.count().catch(() => 0)) > 0) {
        await cards.first().click({ timeout: 4000 }).catch((error) => {
          interactions.push({ action: 'click:first-card', clicked: false, error: error.message.split('\n')[0] })
        })
        await page.waitForTimeout(1200)
        interactions.push({ action: 'click:first-card', clicked: true, url: page.url() })
      }
    }
  }

  if (state === 'agreement') {
    await clickFirstVisible(page, ['立即购买', '购买', '立即开通', '商品详情'], interactions)
    const checkbox = page.locator('input[type="checkbox"]').first()
    if ((await checkbox.count().catch(() => 0)) > 0) {
      await checkbox.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(500)
      interactions.push({ action: 'click:first-checkbox', clicked: true, url: page.url() })
    }
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

    function isVisible(element) {
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
        className: String(element.className || '').slice(0, 200),
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
    const visibleElements = [...document.querySelectorAll('body *')].filter(isVisible).slice(0, 460).map(describe)
    const controls = [
      ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
    ]
      .filter(isVisible)
      .map(describe)
      .slice(0, 220)

    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .map((element) => ({
        text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
          .replace(/\s+/g, ' ')
          .trim(),
        href: element.getAttribute('href'),
        className: String(element.className || '').slice(0, 160),
      }))
      .filter((item) => item.text)
      .slice(0, 200)

    const inputs = [...document.querySelectorAll('input,textarea')]
      .map((element) => ({
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value,
      }))
      .slice(0, 100)

    const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 60)

    const keyElements = visibleElements.filter((item) =>
      /应用订阅|权益|订阅|商品详情|购买信息|立即购买|智能|企微|SCRM|保洁|雷达|开通|价格|时长/.test(item.text),
    )

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 10_000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('应用订阅') ||
        bodyText.includes('商品详情') ||
        bodyText.includes('购买信息') ||
        bodyText.includes('立即购买'),
      interactions: capturedInteractions,
      controls,
      buttons,
      inputs,
      dialogs,
      keyElements,
      visibleElements,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  }, interactions)
}

async function main() {
  if (mode === 'clone' && !cloneUrl) {
    throw new Error('clone 模式必须显式提供 PMS_LOCAL_URL 或 PMS_TEST_BASE_URL，不能回落默认端口')
  }

  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: true,
  })
  const network = []

  try {
    const context = await browser.newContext({
      ...(mode === 'target' ? { storageState } : {}),
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    })
    const page = await context.newPage()
    page.on('response', (response) => {
      const request = response.request()
      network.push({
        url: response.url(),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        contentType: response.headers()['content-type'] ?? '',
      })
    })

    await page.goto(mode === 'target' ? targetUrl : cloneUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForSurface(page)

    const interactions = await applyState(page)
    await page.screenshot({ path: fileFor(artifactDirs.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(artifactDirs.screenshots, 'full', 'png'), fullPage: true })
    await fs.writeFile(fileFor(artifactDirs.dom, 'page', 'html'), await page.content(), 'utf8')

    const facts = await extractFacts(page, interactions)
    await fs.writeFile(fileFor(artifactDirs.styles, 'facts', 'json'), JSON.stringify(facts, null, 2), 'utf8')
    await fs.writeFile(
      fileFor(artifactDirs.network, 'responses', 'json'),
      JSON.stringify(
        {
          mode,
          state,
          stamp,
          url: page.url(),
          responses: network,
          summary: {
            total: network.length,
            jsonCount: network.filter((item) => item.contentType.includes('json')).length,
            apiSamples: network
              .filter((item) => /edition\/resource\/get|paymentTypes\/get|paymentWays\/get|rooms\/get/.test(item.url))
              .slice(0, 20),
          },
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
          bodyLength: facts.bodyLength,
          buttons: facts.buttons.slice(0, 90),
          inputs: facts.inputs.slice(0, 30),
          dialogCount: facts.dialogs.length,
          interactions,
          screenshots: [
            fileFor(artifactDirs.screenshots, 'viewport', 'png'),
            fileFor(artifactDirs.screenshots, 'full', 'png'),
          ],
          dom: fileFor(artifactDirs.dom, 'page', 'html'),
          styles: fileFor(artifactDirs.styles, 'facts', 'json'),
          network: fileFor(artifactDirs.network, 'responses', 'json'),
          bodySample: normalizeText(facts.bodyTextSample).slice(0, 2200),
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
