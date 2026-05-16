import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const taskId = 'zhihui-jiudian--zhizhu-yu-yingjian--quanju-shezhi'
const targetUrl = 'https://minsubao.localhome.cn/smartHotel/checkInGuide'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/smartHotel/checkInGuide'
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

let previewProcess = null

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stamp}-${suffix}.${extension}`)
}

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

async function canFetch(url) {
  try {
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}

async function ensurePreviewServer() {
  if (mode !== 'clone' || (await canFetch(cloneUrl))) return

  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  previewProcess = spawn(command, ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  })

  const started = Date.now()
  while (Date.now() - started < 20_000) {
    if (await canFetch(cloneUrl)) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Local preview server did not become ready at ${cloneUrl}`)
}

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('全局设置') ||
          text.includes('入住引导') ||
          text.includes('自助入住') ||
          text.includes('智住') ||
          text.includes('公安') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 25_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1800)
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const locators = [
      page.getByRole('button', { name: new RegExp(label) }).first(),
      page.getByRole('tab', { name: new RegExp(label) }).first(),
      page.getByText(label, { exact: true }).first(),
      page.locator(`[aria-label*="${label}"]`).first(),
      page.locator(`input[placeholder*="${label}"]`).first(),
    ]

    for (const locator of locators) {
      if ((await locator.count().catch(() => 0)) === 0) continue
      if (!(await locator.isVisible().catch(() => false))) continue
      try {
        await locator.click({ timeout: 3000 })
        await page.waitForTimeout(900)
        return label
      } catch {
        // Try the next locator.
      }
    }
  }

  return null
}

async function applyState(page) {
  const interactions = []

  if (state === 'advanced-toggle') {
    const clicked = await clickFirstVisible(page, ['展开', '更多', '高级', '配置'])
    interactions.push({ action: 'advanced-toggle', clicked })
  }

  if (state === 'first-switch') {
    const switchLocator = page.locator('[role="switch"], .ant-switch, button:has-text("开启"), button:has-text("关闭")').first()
    if ((await switchLocator.count().catch(() => 0)) > 0 && (await switchLocator.isVisible().catch(() => false))) {
      await switchLocator.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(900)
      interactions.push({ action: 'first-switch', clicked: true })
    } else {
      interactions.push({ action: 'first-switch', clicked: false })
    }
  }

  if (state === 'primary-action') {
    const clicked = await clickFirstVisible(page, ['保存', '确定', '提交', '编辑', '设置'])
    interactions.push({ action: 'primary-action', clicked })
  }

  if (state === 'chat-collapse') {
    const clicked = await clickFirstVisible(page, ['收起'])
    interactions.push({ action: 'chat-collapse', clicked })
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
    const visibleElements = [...document.querySelectorAll('body *')].filter(isVisible).slice(0, 520).map(describe)
    const controls = [
      ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"],[role="switch"]'),
    ]
      .filter(isVisible)
      .map(describe)
      .slice(0, 220)
    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .filter(isVisible)
      .map((element) => ({
        text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
          .replace(/\s+/g, ' ')
          .trim(),
        href: element.getAttribute('href'),
        className: String(element.className || '').slice(0, 180),
      }))
      .filter((item) => item.text)
      .slice(0, 200)
    const inputs = [...document.querySelectorAll('input,textarea')]
      .filter(isVisible)
      .map((element) => ({
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value,
      }))
      .slice(0, 100)
    const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,[role="columnheader"]')]
      .filter(isVisible)
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 120)
    const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 50)
    const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 50)
    const options = [...document.querySelectorAll('[role="option"],.ant-select-item-option,.ant-dropdown-menu-item,li')]
      .filter(isVisible)
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 180)
    const keyElements = visibleElements.filter((item) =>
      /全局设置|入住引导|自助入住|智住|硬件|公安|入住人|二维码|小程序|门锁|身份证|开关|是否|必填|设置|保存|暂无数据|全部会话/.test(
        item.text,
      ),
    )

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 9000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式') ||
        location.href.includes('/home') ||
        location.href.includes('/login'),
      hasBusinessText:
        bodyText.includes('全局设置') ||
        bodyText.includes('入住引导') ||
        bodyText.includes('自助入住') ||
        bodyText.includes('智住'),
      interactions: capturedInteractions,
      controls,
      buttons,
      inputs,
      tableHeaders,
      dialogs,
      dropdowns,
      options,
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
  if (mode === 'target') {
    await fs.access(storageState)
  }
  await fs.access(chromeExecutablePath)
  await ensurePreviewServer()

  const network = []
  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: true,
  })

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
          tableHeaders: facts.tableHeaders,
          buttons: facts.buttons.slice(0, 80),
          inputs: facts.inputs.slice(0, 40),
          dialogCount: facts.dialogs.length,
          dropdownCount: facts.dropdowns.length,
          options: facts.options.slice(0, 80),
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
    if (previewProcess) previewProcess.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
