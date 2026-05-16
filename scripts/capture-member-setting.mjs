import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'shezhi--qiye-shezhi--chengyuan-shezhi'
const targetUrl = 'https://minsubao.localhome.cn/setting/member'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/setting/member'
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
          text.includes('成员账号数') ||
          text.includes('添加成员') ||
          text.includes('成员设置') ||
          text.includes('姓名') ||
          text.includes('手机号') ||
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

async function applyState(page) {
  const interactions = []

  if (state === 'add') {
    const addButton = page.getByText('添加成员', { exact: true }).first()
    if ((await addButton.count().catch(() => 0)) > 0) {
      await addButton.click({ timeout: 4000 }).catch((error) => {
        interactions.push({ action: 'click:add-member', clicked: false, error: error.message.split('\n')[0] })
      })
      interactions.push({ action: 'click:add-member', clicked: true, url: page.url() })
      await page.waitForTimeout(1000)
    }
  }

  if (state === 'role-dropdown') {
    const roleControl = page
      .locator('.ant-select-selector, [role="combobox"], button')
      .filter({ hasText: /全部|角色/ })
      .first()
    if ((await roleControl.count().catch(() => 0)) > 0) {
      await roleControl.click({ timeout: 4000 }).catch((error) => {
        interactions.push({ action: 'open:role-dropdown', clicked: false, error: error.message.split('\n')[0] })
      })
      interactions.push({ action: 'open:role-dropdown', clicked: true, url: page.url() })
      await page.waitForTimeout(900)
    }
  }

  if (state === 'search') {
    const input = page.locator('input[placeholder*="搜索"], input').first()
    if ((await input.count().catch(() => 0)) > 0) {
      await input.fill('成员', { timeout: 4000 }).catch((error) => {
        interactions.push({ action: 'fill:search', filled: false, error: error.message.split('\n')[0] })
      })
      interactions.push({ action: 'fill:search', filled: true, url: page.url() })
      await page.waitForTimeout(900)
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
    const visibleElements = [...document.querySelectorAll('body *')].filter(isVisible).slice(0, 420).map(describe)
    const controls = [
      ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
    ]
      .filter(isVisible)
      .map(describe)
      .slice(0, 180)
    const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,[role="columnheader"]')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 120)
    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .map((element) => ({
        text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
          .replace(/\s+/g, ' ')
          .trim(),
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
      .slice(0, 80)
    const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 40)
    const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 40)
    const keyElements = visibleElements.filter((item) =>
      /成员|角色|姓名|手机号|企微|邮箱|搜索|添加|暂无数据|权限|全部/.test(item.text),
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
      hasBusinessText:
        bodyText.includes('成员账号数') ||
        bodyText.includes('添加成员') ||
        bodyText.includes('姓名\t手机号\t角色') ||
        bodyText.includes('成员设置'),
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
      '.ant-table',
      '.member-setting-page',
      '.ant-card',
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
          tableHeaders: facts.tableHeaders,
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
          bodySample: normalizeText(facts.bodyTextSample).slice(0, 1800),
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
