import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'scrm--yingxiao-tuiguang--quanyuan-yingxiao'
const targetUrl = 'https://minsubao.localhome.cn/mallManagement/distribution'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/mallManagement/distribution'
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

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const locators = [
      page.getByRole('button', { name: new RegExp(label) }).first(),
      page.getByText(label, { exact: true }).first(),
      page.locator(`input[placeholder*="${label}"]`).first(),
      page.locator(`[aria-label*="${label}"]`).first(),
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

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('全员营销') ||
          text.includes('营销推广') ||
          text.includes('推广员') ||
          text.includes('分销') ||
          text.includes('佣金') ||
          text.includes('账户登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 25_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1800)
}

async function applyState(page) {
  const interactions = []

  if (state === 'type-dropdown') {
    const selector = page.locator('main .ant-select-selector, .ant-select-selector, .full-marketing-select').first()
    if ((await selector.count().catch(() => 0)) > 0) {
      await selector.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-type-dropdown', clicked: true })
    } else {
      interactions.push({ action: 'open-type-dropdown', clicked: false })
    }
  }

  if (state === 'data-tab') {
    const clicked = await clickFirstVisible(page, ['分销数据'])
    interactions.push({ action: 'click-data-tab', clicked })
  }

  if (state === 'invite') {
    const clicked = await clickFirstVisible(page, ['邀请分销员'])
    interactions.push({ action: 'click-invite', clicked })
  }

  if (state === 'edit') {
    const edit = page.getByText('编辑', { exact: true }).first()
    if ((await edit.count().catch(() => 0)) > 0) {
      await edit.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(900)
      interactions.push({ action: 'click-first-edit', clicked: true })
    } else {
      interactions.push({ action: 'click-first-edit', clicked: false })
    }
  }

  if (state === 'search') {
    const inputs = page.locator('input[placeholder*="搜索"], input[placeholder*="名称"], input[placeholder*="手机号"], input[placeholder*="推广员"]')
    for (let index = 0; index < (await inputs.count().catch(() => 0)); index += 1) {
      const input = inputs.nth(index)
      if (!(await input.isVisible().catch(() => false))) continue
      await input.fill('181')
      interactions.push({ action: 'fill-keyword', value: '181', index })
      break
    }
    const clicked = await clickFirstVisible(page, ['查询', '搜索'])
    interactions.push({ action: 'click-query', clicked })
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
    const visibleElements = [...document.querySelectorAll('body *')].filter(isVisible).slice(0, 420).map(describe)
    const controls = [
      ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
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
      .slice(0, 180)
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
      .slice(0, 140)
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
      .slice(0, 160)
    const keyElements = visibleElements.filter((item) =>
      /全员营销|营销推广|推广员|推广|分销|佣金|结算|客户|订单|活动|海报|二维码|暂无数据|开通|设置/.test(item.text),
    )

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 9000),
      isLoginBlocked:
        bodyText.includes('账户登录') || bodyText.includes('请按住滑块') || bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('全员营销') ||
        bodyText.includes('营销推广') ||
        bodyText.includes('推广员') ||
        bodyText.includes('佣金'),
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
          inputs: facts.inputs.slice(0, 30),
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
