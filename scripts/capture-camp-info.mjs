import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'shezhi--xinxi-weihu--mendian-xinxi'
const TARGET_URL = 'https://minsubao.localhome.cn/InformationMaintenance/campInfo'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/InformationMaintenance/campInfo'
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

function normalizeText(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

function looseLabelPattern(label) {
  return label
    .split('')
    .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s*')
}

async function locatorVisible(locator) {
  return (await locator.count().catch(() => 0)) > 0 && (await locator.first().isVisible().catch(() => false))
}

async function clickFirstVisible(page, labels) {
  for (const label of labels) {
    const pattern = looseLabelPattern(label)
    const candidates = [
      page.getByRole('button', { name: new RegExp(pattern) }).first(),
      page.getByRole('tab', { name: new RegExp(pattern) }).first(),
      page.getByRole('link', { name: new RegExp(pattern) }).first(),
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
          text.includes('门店信息') ||
          text.includes('门店名称') ||
          text.includes('门店') ||
          text.includes('地址') ||
          text.includes('联系电话') ||
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

  if (state === 'modify') {
    interactions.push({ action: 'click-modify', clicked: await clickFirstVisible(page, ['修改', '编辑', '去完善']) })
  }

  if (state === 'import') {
    interactions.push({ action: 'click-import', clicked: await clickFirstVisible(page, ['一键导入', '导入']) })
  }

  if (state === 'detail') {
    interactions.push({ action: 'click-detail', clicked: await clickFirstVisible(page, ['详情']) })
  }

  if (state === 'new-store') {
    interactions.push({ action: 'click-new-store', clicked: await clickFirstVisible(page, ['新建门店', '新增门店']) })
  }

  if (state === 'sort') {
    interactions.push({ action: 'click-sort', clicked: await clickFirstVisible(page, ['门店排序']) })
  }

  if (state === 'expand-row') {
    const expand = page.locator('.ant-table-row-expand-icon, [aria-label*="展开"], [title*="展开"]').first()
    if (await locatorVisible(expand)) {
      await expand.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'expand-row', clicked: 'row-expand-icon' })
    } else {
      interactions.push({ action: 'expand-row', clicked: null })
    }
  }

  if (state === 'first-select') {
    const select = page.locator('.ant-select-selector, [role="combobox"], [aria-haspopup="listbox"]').first()
    if (await locatorVisible(select)) {
      await select.click({ timeout: 2500 })
      await page.waitForTimeout(900)
      interactions.push({ action: 'open-first-select', clicked: 'select-0' })
    } else {
      interactions.push({ action: 'open-first-select', clicked: null })
    }
  }

  if (state === 'first-input') {
    const input = page.locator('input[type="text"], textarea').first()
    if (await locatorVisible(input)) {
      interactions.push({ action: 'focus-first-input' })
      await input.focus()
      await page.waitForTimeout(500)
    }
  }

  if (state === 'chat-collapsed') {
    interactions.push({ action: 'collapse-chat', clicked: await clickFirstVisible(page, ['收起']) })
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
          text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 620),
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
      const visibleElements = [...document.querySelectorAll('body *')].filter(elementVisible).slice(0, 760).map(describe)
      const controls = [
        ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"],[role="tab"]'),
      ]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 360)
      const buttons = [...document.querySelectorAll('button,[role="button"],a,[role="tab"]')]
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
        .slice(0, 160)
      const labels = [...document.querySelectorAll('label,.ant-form-item-label,.ant-descriptions-item-label,dt')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 220)
      const values = [...document.querySelectorAll('.ant-descriptions-item-content,dd,.ant-form-item-control,.ant-typography')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 220)
      const tabs = [...document.querySelectorAll('[role="tab"],.ant-tabs-tab,.ant-segmented-item')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 80)
      const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 80)
      const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
        .filter(elementVisible)
        .map(describe)
        .slice(0, 80)
      const options = [...document.querySelectorAll('[role="option"],.ant-select-item-option,.ant-dropdown-menu-item,li')]
        .filter(elementVisible)
        .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 240)
      const images = [...document.querySelectorAll('img')]
        .filter(elementVisible)
        .map((img) => ({
          src: img.currentSrc || img.src,
          alt: img.alt,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          rect: describe(img).rect,
        }))
        .slice(0, 120)
      const keyElements = visibleElements.filter((item) =>
        /门店|店铺|名称|地址|电话|联系人|经纬度|品牌|资质|图片|视频|简介|设施|上架|下架|修改|编辑|保存|取消|导入|去完善|暂无数据|收起|全部会话/.test(
          item.text,
        ),
      )

      return {
        url: location.href,
        title: document.title,
        bodyLength: bodyText.length,
        bodyTextSample: bodyText.slice(0, 14000),
        isLoginBlocked:
          bodyText.includes('账号登录') ||
          bodyText.includes('账户登录') ||
          bodyText.includes('请按住滑块') ||
          bodyText.includes('登录其他登录方式'),
        hasBusinessText:
          bodyText.includes('门店信息') ||
          bodyText.includes('门店名称') ||
          (bodyText.includes('门店') && bodyText.includes('地址')),
        interactions: capturedInteractions,
        componentScreenshots: capturedComponentScreenshots,
        controls,
        buttons,
        inputs,
        labels,
        values,
        tabs,
        dialogs,
        dropdowns,
        options,
        images,
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

    const viewportScreenshot = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullScreenshot = fileFor(artifactRoots.screenshots, 'full', 'png')
    await page.screenshot({ path: viewportScreenshot })
    await page.screenshot({ path: fullScreenshot, fullPage: true })

    const componentScreenshots = []
    for (const [selectors, suffix] of [
      [['.ant-form', 'form', '.camp-info-form', '.store-info-form', '.settings-store-form'], 'component-form'],
      [['.ant-card', '.ant-descriptions', '.settings-panel', '.page-content'], 'component-main'],
      [['.ant-modal', '.ant-drawer', '[role="dialog"]'], 'component-dialog'],
      [['.ant-select-dropdown', '.ant-dropdown', '[role="listbox"]'], 'component-dropdown'],
    ]) {
      const shot = await screenshotFirstVisible(page, selectors, suffix)
      if (shot) componentScreenshots.push(shot)
    }

    const facts = await extractFacts(page, interactions, componentScreenshots)
    const domFile = fileFor(artifactRoots.dom, 'page', 'html')
    const styleFile = fileFor(artifactRoots.styles, 'facts', 'json')
    const networkFile = fileFor(artifactRoots.network, 'responses', 'json')

    await fs.writeFile(domFile, await page.content(), 'utf8')
    await fs.writeFile(styleFile, JSON.stringify({ mode, state, stamp, facts }, null, 2), 'utf8')
    await fs.writeFile(
      networkFile,
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
          buttons: facts.buttons.slice(0, 90),
          inputs: facts.inputs.slice(0, 70),
          labels: facts.labels.slice(0, 100),
          values: facts.values.slice(0, 80),
          tabs: facts.tabs.slice(0, 30),
          options: facts.options.slice(0, 90),
          dialogs: facts.dialogs.slice(0, 10),
          dropdowns: facts.dropdowns.slice(0, 10),
          images: facts.images.slice(0, 30),
          interactions,
          componentScreenshots,
          screenshots: [viewportScreenshot, fullScreenshot],
          dom: domFile,
          styles: styleFile,
          network: networkFile,
          bodySample: normalizeText(facts.bodyTextSample).slice(0, 2800),
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
