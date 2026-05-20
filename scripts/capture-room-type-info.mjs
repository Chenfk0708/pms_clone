import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const TASK_ID = 'shezhi--xinxi-weihu--fangxing-xinxi'
const TARGET_URL = 'https://minsubao.localhome.cn/setting/roomTypeInfo'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/setting/roomTypeInfo'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const stateArg = process.argv.find((arg) => arg.startsWith('--state='))
const state = stateArg ? stateArg.split('=')[1] : 'default'
const stamp = process.env.PMS_CAPTURE_STAMP ?? new Date().toISOString().replace(/\D/g, '').slice(0, 14)

const artifactRoots = {
  screenshots: path.resolve('artifacts/screenshots', TASK_ID),
  dom: path.resolve('artifacts/dom-snapshots', TASK_ID),
  styles: path.resolve('artifacts/style-dumps', TASK_ID),
  network: path.resolve('artifacts/network', TASK_ID),
}

for (const directory of Object.values(artifactRoots)) {
  await fs.mkdir(directory, { recursive: true })
}

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stamp}-${suffix}.${extension}`)
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForCdpEndpoint(port, chromeProcess) {
  let chromeStderr = ''
  chromeProcess.stderr?.on('data', (chunk) => {
    chromeStderr += chunk.toString()
  })

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (!response.ok) throw new Error(`CDP endpoint returned ${response.status}`)
      const payload = await response.json()
      if (payload.webSocketDebuggerUrl) return payload.webSocketDebuggerUrl
    } catch {
      await wait(500)
    }
  }

  throw new Error(`Chrome CDP endpoint not ready on port ${port}. ${chromeStderr.trim()}`.trim())
}

async function launchChromeContext() {
  const port = 9400 + Math.floor(Math.random() * 300)
  const userDataDir = path.resolve('.tmp', `capture-${TASK_ID}-${mode}-${state}-${stamp}`)
  await fs.mkdir(userDataDir, { recursive: true })

  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${port}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--lang=zh-CN',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    {
      stdio: ['ignore', 'ignore', 'pipe'],
    },
  )

  const wsEndpoint = await waitForCdpEndpoint(port, chromeProcess)
  const browser = await chromium.connectOverCDP(wsEndpoint)
  const context = browser.contexts()[0]

  if (!context) {
    throw new Error('Chrome CDP connected, but no browser context is available.')
  }

  return {
    browser,
    context,
    chromeProcess,
  }
}

async function applyStorageState(context) {
  const storageState = JSON.parse(await fs.readFile(STORAGE_STATE, 'utf8'))
  if (storageState.cookies?.length) {
    await context.addCookies(storageState.cookies)
  }

  const page = await context.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })

  for (const originState of storageState.origins ?? []) {
    if (!originState.origin || !originState.localStorage?.length) continue
    await page.goto(originState.origin, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    }).catch(() => {})
    await page.evaluate((entries) => {
      for (const entry of entries) {
        localStorage.setItem(entry.name, entry.value)
      }
    }, originState.localStorage)
  }

  return page
}

async function locatorVisible(locator) {
  return (await locator.count().catch(() => 0)) > 0 && (await locator.first().isVisible().catch(() => false))
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const candidates = [
      page.getByRole('button', { name: new RegExp(label) }).first(),
      page.getByRole('link', { name: new RegExp(label) }).first(),
      page.getByText(label, { exact: true }).first(),
      page.getByText(label, { exact: false }).first(),
      page.locator(`input[placeholder*="${label}"]`).first(),
      page.locator(`[aria-label*="${label}"]`).first(),
      page.locator(`.ant-select-selector:has-text("${label}")`).first(),
    ]

    for (const locator of candidates) {
      if (!(await locatorVisible(locator))) continue
      try {
        await locator.click({ timeout: 2500 })
        await page.waitForTimeout(900)
        return label
      } catch {
        // Try the next candidate.
      }
    }
  }
  return null
}

async function waitForBusinessSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('房型信息') ||
          text.includes('房型名称') ||
          text.includes('新增房型') ||
          text.includes('房间') ||
          text.includes('门店') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 30_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1800)
}

async function applyState(page) {
  const interactions = []

  if (state === 'store-filter' || state === 'group-filter') {
    const index = state === 'store-filter' ? 0 : 1
    const selector = page.locator('.ant-select-selector,[role="combobox"]').nth(index)
    if (await locatorVisible(selector)) {
      await selector.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: `open-${state}`, clicked: `select-${index}` })
    }
    return interactions
  }

  if (['detail-first', 'room-first', 'linkage-first', 'delete-first'].includes(state)) {
    const exactLabels = {
      'detail-first': '详情',
      'room-first': '房间',
      'linkage-first': '联动关房',
      'delete-first': '删除',
    }
    const label = exactLabels[state]
    const button = page.getByRole('button', { name: label, exact: true }).first()
    if (await locatorVisible(button)) {
      await button.click({ timeout: 2500 })
      await page.waitForTimeout(1200)
      interactions.push({ action: `click-${state}`, clicked: label })
    }
    return interactions
  }

  const stateActions = {
    'new-room-type': ['新增房型', '新增', '新 增', '添加房型', '创建房型'],
    'edit-first': ['编辑', '修改'],
    'expand-first': ['展开', '房间管理', '房间数', '查看房间'],
    'search': ['查询', '查 询'],
    'status-filter': ['全部状态', '状态', '上架状态'],
  }

  if (state === 'search') {
    const search = page.locator('input[placeholder*="房型"], input[placeholder*="搜索"], input[type="text"]').first()
    if (await locatorVisible(search)) {
      await search.fill('观影')
      await page.waitForTimeout(300)
      interactions.push({ action: 'fill-search', value: '观影' })
    }
  }

  const labels = stateActions[state]
  if (labels) {
    const clicked = await clickFirstVisible(page, labels)
    interactions.push({ action: `click-${state}`, clicked })
  }

  return interactions
}

async function screenshotFirstVisible(page, selectors, suffix) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if (!(await locatorVisible(locator))) continue
    try {
      const outputPath = fileFor(artifactRoots.screenshots, suffix, 'png')
      await locator.screenshot({ path: outputPath })
      return { selector, outputPath }
    } catch {
      // Try the next selector.
    }
  }
  return null
}

async function extractFacts(page, interactions, componentScreenshots) {
  return page.evaluate(
    ({ capturedInteractions, capturedComponentScreenshots }) => {
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

      function elementVisible(element) {
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
          text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 520),
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
      const visibleElements = [...document.querySelectorAll('body *')].filter(elementVisible).slice(0, 620).map(describe)
      const controls = [
        ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
      ]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 320)
      const buttons = [...document.querySelectorAll('button,[role="button"],a')]
        .filter(elementVisible)
        .map((element) => ({
          text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
            .replace(/\s+/g, ' ')
            .trim(),
          href: element.getAttribute('href'),
          className: String(element.className || '').slice(0, 180),
        }))
        .filter((item) => item.text)
        .slice(0, 220)
      const inputs = [...document.querySelectorAll('input,textarea')]
        .filter(elementVisible)
        .map((element) => ({
          type: element.getAttribute('type'),
          placeholder: element.getAttribute('placeholder'),
          ariaLabel: element.getAttribute('aria-label'),
          value: element.value,
        }))
        .slice(0, 140)
      const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,[role="columnheader"]')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 220)
      const rows = [...document.querySelectorAll('tbody tr,.ant-table-row,[role="row"],.ant-list-item')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 120)
      const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 60)
      const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 60)
      const options = [...document.querySelectorAll('[role="option"],.ant-select-item-option,.ant-dropdown-menu-item,li')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 220)
      const assets = {
        images: [...document.querySelectorAll('img')]
          .map((img) => ({
            src: img.currentSrc || img.src,
            alt: img.alt,
            width: img.naturalWidth,
            height: img.naturalHeight,
          }))
          .slice(0, 80),
        backgroundImages: [...document.querySelectorAll('*')]
          .filter((element) => {
            const value = window.getComputedStyle(element).backgroundImage
            return value && value !== 'none'
          })
          .map((element) => ({
            tag: element.tagName.toLowerCase(),
            className: String(element.className || '').slice(0, 180),
            backgroundImage: window.getComputedStyle(element).backgroundImage,
          }))
          .slice(0, 120),
        svgCount: document.querySelectorAll('svg').length,
        fonts: [...new Set(visibleElements.slice(0, 220).map((item) => item.styles.fontSize && item.styles.fontWeight && item.styles.color))],
      }
      const keyElements = visibleElements.filter((item) =>
        /房型|房间|门店|状态|图片|视频|床|面积|设施|标签|新增|编辑|删除|复制|排序|上架|下架|启用|停用|暂无数据/.test(item.text),
      )

      return {
        url: location.href,
        title: document.title,
        bodyLength: bodyText.length,
        bodyTextSample: bodyText.slice(0, 12000),
        isLoginBlocked:
          bodyText.includes('账号登录') ||
          bodyText.includes('账户登录') ||
          bodyText.includes('请按住滑块') ||
          bodyText.includes('登录其他登录方式'),
        hasBusinessText:
          bodyText.includes('房型信息') ||
          bodyText.includes('房型名称') ||
          (bodyText.includes('房型') && bodyText.includes('房间')),
        interactions: capturedInteractions,
        componentScreenshots: capturedComponentScreenshots,
        controls,
        buttons,
        inputs,
        tableHeaders,
        rows,
        dialogs,
        dropdowns,
        options,
        assets,
        keyElements,
        visibleElements,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
      }
    },
    { capturedInteractions: interactions, capturedComponentScreenshots: componentScreenshots },
  )
}

async function main() {
  if (mode === 'target') await fs.access(STORAGE_STATE)
  await fs.access(CHROME_PATH)

  const network = []
  const { browser, context, chromeProcess } = await launchChromeContext()

  try {
    const page = mode === 'target' ? await applyStorageState(context) : await context.newPage()
    await page.setViewportSize({ width: 1440, height: 900 })

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

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)
    const interactions = await applyState(page)
    await page.waitForTimeout(900)

    const screenshotPath = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullScreenshotPath = fileFor(artifactRoots.screenshots, 'full', 'png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })

    const componentScreenshots = [
      await screenshotFirstVisible(page, ['.ant-table-wrapper', 'table', '[role="table"]'], 'table'),
      await screenshotFirstVisible(page, ['.ant-modal', '.ant-drawer', '[role="dialog"]'], 'dialog'),
      await screenshotFirstVisible(page, ['.ant-card', '.ant-list', 'main', '.page-content'], 'main-component'),
    ].filter(Boolean)

    const htmlPath = fileFor(artifactRoots.dom, 'page', 'html')
    await fs.writeFile(htmlPath, await page.content(), 'utf8')

    const facts = await extractFacts(page, interactions, componentScreenshots)
    const stylePath = fileFor(artifactRoots.styles, 'facts', 'json')
    await fs.writeFile(
      stylePath,
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode,
          state,
          stamp,
          url: page.url(),
          isLoginBlocked: facts.isLoginBlocked,
          hasBusinessText: facts.hasBusinessText,
          facts,
        },
        null,
        2,
      ),
      'utf8',
    )

    const networkPath = fileFor(artifactRoots.network, 'responses', 'json')
    await fs.writeFile(
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
      'utf8',
    )

    console.log(
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode,
          state,
          stamp,
          url: page.url(),
          isLoginBlocked: facts.isLoginBlocked,
          hasBusinessText: facts.hasBusinessText,
          bodyLength: facts.bodyLength,
          bodySample: facts.bodyTextSample.slice(0, 1200),
          buttons: facts.buttons.slice(0, 60),
          inputs: facts.inputs.slice(0, 30),
          tableHeaders: facts.tableHeaders.slice(0, 80),
          rows: facts.rows.slice(0, 20),
          dialogs: facts.dialogs.slice(0, 10),
          dropdowns: facts.dropdowns.slice(0, 10),
          options: facts.options.slice(0, 80),
          interactions,
          artifacts: {
            screenshotPath,
            fullScreenshotPath,
            htmlPath,
            stylePath,
            networkPath,
            componentScreenshots,
          },
        },
        null,
        2,
      ),
    )

    await context.close()
  } finally {
    await browser.close()
    chromeProcess.kill('SIGKILL')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
