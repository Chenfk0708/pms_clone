import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = process.env.PMS_CAPTURE_TASK_ID ?? 'scrm--kehu-goutong--weixin-kefu'
const targetUrl = process.env.PMS_TARGET_URL ?? 'https://minsubao.localhome.cn/scrm/wechatService/manage'
const cloneUrl =
  process.env.PMS_CLONE_URL ?? process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/scrm/wechatService/manage'
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

function compact(text) {
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
          text.includes('微信客服') ||
          text.includes('接待配置') ||
          text.includes('客服') ||
          text.includes('客户沟通') ||
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

async function applyState(page) {
  const interactions = []
  if (state === 'bottom') {
    await page.evaluate(() => {
      const candidates = [
        document.querySelector('.page-content'),
        document.querySelector('.ant-layout-content'),
        document.querySelector('main'),
        document.scrollingElement,
      ].filter(Boolean)
      for (const element of candidates) {
        element.scrollTop = element.scrollHeight
      }
      window.scrollTo(0, document.body.scrollHeight)
    })
    await page.waitForTimeout(1000)
    interactions.push({ action: 'scroll:bottom', clicked: false, url: page.url() })
    return interactions
  }

  const labelsByState = {
    config: ['接待配置', '配置', '去配置', '前往配置'],
    auth: ['立即开通', '前往授权', '去授权', '授权', '立即授权'],
    add: ['添加', '新增', '添加客服', '新增客服', '添加接待人员'],
    search: ['查询'],
    reset: ['重置'],
  }
  const labels = labelsByState[state] ?? []

  for (const label of labels) {
    const locator = page.getByText(label, { exact: true }).first()
    if ((await locator.count().catch(() => 0)) === 0) continue
    try {
      await locator.click({ timeout: 3000 })
      await page.waitForTimeout(1000)
      interactions.push({ action: `click:${label}`, clicked: true, url: page.url() })
      break
    } catch (error) {
      interactions.push({ action: `click:${label}`, clicked: false, error: error.message.split('\n')[0] })
    }
  }

  if (state === 'first-dropdown') {
    const combobox = page.locator('.ant-select-selector, button[aria-haspopup="listbox"], [role="combobox"]').first()
    if ((await combobox.count().catch(() => 0)) > 0) {
      await combobox.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(800)
      interactions.push({ action: 'open:first-dropdown', clicked: true, url: page.url() })
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
    const visibleElements = [...document.querySelectorAll('body *')].filter(isVisible).slice(0, 420).map(describe)
    const controls = [
      ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
    ]
      .filter(isVisible)
      .map(describe)
      .slice(0, 200)

    const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,[role="columnheader"]')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 140)

    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .map((element) => ({
        text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
          .replace(/\s+/g, ' ')
          .trim(),
        href: element.getAttribute('href'),
        className: String(element.className || '').slice(0, 160),
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
      .slice(0, 80)

    const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 50)

    const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 50)

    const keyElements = visibleElements.filter((item) =>
      /微信|客服|接待|授权|企微|企业微信|客户沟通|开通|配置|小程序|咨询|回复|接入/.test(item.text),
    )

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 9000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasBusinessText: bodyText.includes('微信客服') || bodyText.includes('客服') || bodyText.includes('客户沟通'),
      interactions: capturedInteractions,
      controls,
      buttons,
      inputs,
      tableHeaders,
      dialogs,
      dropdowns,
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

    if (mode === 'clone') {
      await page.addInitScript((captureState) => {
        window.localStorage.setItem('pms.wechatServiceProvider', 'mock')
        if (captureState === 'empty' || captureState === 'error') {
          window.localStorage.setItem('pms.wechatServiceMockState', captureState)
        } else {
          window.localStorage.removeItem('pms.wechatServiceMockState')
        }
      }, state)
    }

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
    const diagnostics = await page.evaluate(() => {
      const rawValue = window.localStorage.getItem('pms.wechatService.lastRequest')
      return rawValue ? JSON.parse(rawValue) : null
    }).catch(() => null)
    const forbiddenTerms = ['mock 数据', 'mock provider', 'provider=mock', '未接入', '阻塞', '后端未就绪', '后端接口未完成']
    const forbiddenTermsFound = forbiddenTerms.filter((term) => facts.bodyTextSample.includes(term))
    await fs.writeFile(fileFor(artifactDirs.styles, 'facts', 'json'), JSON.stringify(facts, null, 2), 'utf8')
    await fs.writeFile(
      fileFor(artifactDirs.network, 'responses', 'json'),
      JSON.stringify({ mode, state, stamp, url: page.url(), diagnostics, forbiddenTermsFound, responses: network }, null, 2),
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
          tableHeaders: facts.tableHeaders,
          buttons: facts.buttons.slice(0, 70),
          inputs: facts.inputs.slice(0, 25),
          dialogCount: facts.dialogs.length,
          dropdownCount: facts.dropdowns.length,
          forbiddenTermsFound,
          diagnostics,
          screenshots: [
            fileFor(artifactDirs.screenshots, 'viewport', 'png'),
            fileFor(artifactDirs.screenshots, 'full', 'png'),
          ],
          dom: fileFor(artifactDirs.dom, 'page', 'html'),
          styles: fileFor(artifactDirs.styles, 'facts', 'json'),
          network: fileFor(artifactDirs.network, 'responses', 'json'),
          bodySample: compact(facts.bodyTextSample).slice(0, 1800),
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
