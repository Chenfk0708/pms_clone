import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'shezhi--tongyong-shezhi--huihua-shezhi'
const targetUrl = 'https://minsubao.localhome.cn/setting/imSetting'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/setting/imSetting'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const stateArg = process.argv.find((arg) => arg.startsWith('--state='))
const state = stateArg ? stateArg.split('=')[1] : 'default'
const stamp = process.env.PMS_CAPTURE_STAMP ?? new Date().toISOString().replace(/\D/g, '').slice(0, 14)

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
          text.includes('会话设置') ||
          text.includes('会话') ||
          text.includes('客服') ||
          text.includes('消息') ||
          text.includes('保存') ||
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

async function clickFirst(page, selectors, action, interactions) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if ((await locator.count().catch(() => 0)) === 0) continue
    const box = await locator.boundingBox().catch(() => null)
    if (!box || box.width < 6 || box.height < 6) continue
    await locator.click({ timeout: 4000 }).catch((error) => {
      interactions.push({ action, clicked: false, selector, error: error.message.split('\n')[0] })
    })
    interactions.push({ action, clicked: true, selector, url: page.url() })
    await page.waitForTimeout(900)
    return true
  }
  return false
}

async function applyState(page) {
  const interactions = []

  if (state === 'collapsed') {
    const labels = ['收起', '展开']
    for (const label of labels) {
      const locator = page.getByText(label, { exact: true }).first()
      if ((await locator.count().catch(() => 0)) === 0) continue
      await locator.click({ timeout: 4000 }).catch((error) => {
        interactions.push({ action: `click:${label}`, clicked: false, error: error.message.split('\n')[0] })
      })
      interactions.push({ action: `click:${label}`, clicked: true, url: page.url() })
      await page.waitForTimeout(900)
      return interactions
    }
  }

  if (state === 'first-select') {
    await clickFirst(
      page,
      ['.ant-select-selector', '[role="combobox"]', '.ant-picker', 'input[readonly]'],
      'open:first-select-or-picker',
      interactions,
    )
  }

  if (state === 'first-popover') {
    await clickFirst(
      page,
      ['button:not([type="submit"])', '[role="button"]', '.ant-switch'],
      'open:first-nondestructive-control',
      interactions,
    )
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
      'alignItems',
      'justifyContent',
      'gap',
    ]

    function isVisible(element) {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    function textOf(element) {
      return (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim()
    }

    function describe(element) {
      const rect = element.getBoundingClientRect()
      const computed = window.getComputedStyle(element)
      const styles = {}
      for (const prop of styleProps) styles[prop] = computed[prop]
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 220),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        placeholder: element.getAttribute('placeholder'),
        text: textOf(element).slice(0, 480),
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
      ...document.querySelectorAll(
        'button,a,input,textarea,.ant-select-selector,.ant-picker,.ant-switch,[role="button"],[role="combobox"]',
      ),
    ]
      .filter(isVisible)
      .map(describe)
      .slice(0, 220)
    const formItems = [...document.querySelectorAll('.ant-form-item,.ant-row,.ant-card,.ant-table,.ant-switch')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 220)
    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .map((element) => ({
        text: textOf(element) || element.getAttribute('aria-label') || '',
        href: element.getAttribute('href'),
        className: String(element.className || '').slice(0, 180),
      }))
      .filter((item) => item.text)
      .slice(0, 180)
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
    const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,.ant-picker-dropdown,[role="listbox"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 60)
    const keyElements = visibleElements.filter((item) =>
      /会话|消息|客服|标签|渠道|分配|回复|超时|自动|保存|开关|开启|关闭|启用|禁用|同步|展开|收起|全部/.test(
        item.text,
      ),
    )

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 10000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('会话设置') ||
        bodyText.includes('会话') ||
        bodyText.includes('消息') ||
        bodyText.includes('客服'),
      interactions: capturedInteractions,
      controls,
      buttons,
      inputs,
      dialogs,
      dropdowns,
      formItems,
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

async function screenshotIfPresent(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if ((await locator.count().catch(() => 0)) === 0) continue
    const box = await locator.boundingBox().catch(() => null)
    if (!box || box.width < 10 || box.height < 10) continue
    await locator.screenshot({ path: fileFor(artifactDirs.screenshots, 'component', 'png') }).catch(() => {})
    return selector
  }
  return null
}

async function main() {
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
    const componentSelector = await screenshotIfPresent(page, [
      '.ant-form',
      '.ant-card',
      '.ant-table',
      '.im-setting-page',
      'main',
    ])
    await page.screenshot({ path: fileFor(artifactDirs.screenshots, 'viewport', 'png') })
    await page.screenshot({ path: fileFor(artifactDirs.screenshots, 'full', 'png'), fullPage: true })
    await fs.writeFile(fileFor(artifactDirs.dom, 'page', 'html'), await page.content(), 'utf8')

    const facts = await extractFacts(page, interactions)
    await fs.writeFile(fileFor(artifactDirs.styles, 'facts', 'json'), JSON.stringify(facts, null, 2), 'utf8')
    await fs.writeFile(
      fileFor(artifactDirs.network, 'responses', 'json'),
      JSON.stringify({ mode, state, stamp, url: page.url(), responses: network }, null, 2),
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
          buttons: facts.buttons.slice(0, 70),
          inputs: facts.inputs.slice(0, 30),
          dialogCount: facts.dialogs.length,
          dropdownCount: facts.dropdowns.length,
          componentSelector,
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
