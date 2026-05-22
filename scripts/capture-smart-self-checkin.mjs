import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const TASK_ID = 'zhihui-jiudian--zhizhu-yu-yingjian--zizhu-ruzhu'
const TARGET_URL = 'https://minsubao.localhome.cn/smartHotel/smartHome'
const LOCAL_URL = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/smartHotel/smartHome'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const HUDSON_API_HOST = 'hudson-prod.localhome.cn'
const SENSITIVE_KEY_PATTERN = /token|cookie|authorization|password|passwd|secret|mobile|phone/i

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const state = process.argv.includes('--right-probe')
  ? 'right-probe'
  : process.argv.includes('--interaction')
    ? 'interaction'
    : 'default'
const stamp =
  process.env.PMS_CAPTURE_STAMP ??
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(new Date())
    .reduce((parts, part) => {
      parts[part.type] = part.value
      return parts
    }, {})

const stampText =
  typeof stamp === 'string'
    ? stamp
    : `${stamp.year}${stamp.month}${stamp.day}-${stamp.hour}${stamp.minute}${stamp.second}`

const artifactDirs = {
  screenshots: path.resolve('artifacts/screenshots', TASK_ID),
  dom: path.resolve('artifacts/dom-snapshots', TASK_ID),
  styles: path.resolve('artifacts/style-dumps', TASK_ID),
  network: path.resolve('artifacts/network', TASK_ID),
}

for (const directory of Object.values(artifactDirs)) {
  fs.mkdirSync(directory, { recursive: true })
}

let previewProcess = null

try {
  if (mode === 'target' && !fs.existsSync(STORAGE_STATE)) {
    throw new Error(`Missing storageState: ${STORAGE_STATE}`)
  }

  if (mode === 'clone') {
    await ensurePreviewServer(LOCAL_URL)
  }

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
      acceptDownloads: state === 'right-probe',
    })
    const probeState = state === 'right-probe' ? await setupRightActionProbeContext(context) : null
    const page = await context.newPage()

    page.on('response', async (response) => {
      const request = response.request()
      const entry = {
        url: response.url(),
        status: response.status(),
        method: request.method(),
        resourceType: request.resourceType(),
        contentType: response.headers()['content-type'] ?? '',
      }

      if (shouldCapturePayload(response.url())) {
        entry.requestBody = parsePostData(request.postData())
        try {
          if (entry.contentType.includes('application/json')) {
            entry.responseSummary = summarizeValue(await response.json())
          } else {
            entry.responseSummary = stableText(await response.text()).slice(0, 600)
          }
        } catch (error) {
          entry.responseSummaryError = error instanceof Error ? error.message : String(error)
        }
      }

      network.push(entry)
    })

    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)

    const interactions = state === 'interaction' ? await runInteractionSweep(page) : []
    const rightActionProbes = state === 'right-probe' ? await runRightActionProbeSweep(page, probeState) : []

    const screenshotPath = fileFor(artifactDirs.screenshots, 'viewport', 'png')
    const fullScreenshotPath = fileFor(artifactDirs.screenshots, 'full', 'png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })

    const htmlPath = fileFor(artifactDirs.dom, 'page', 'html')
    fs.writeFileSync(htmlPath, await page.content(), 'utf8')

    const facts = await extractPageFacts(page)
    const stylePath = fileFor(artifactDirs.styles, 'facts', 'json')
    fs.writeFileSync(
      stylePath,
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode,
          state,
          stamp: stampText,
          url: page.url(),
          isLoginBlocked: isBlocked(page.url(), facts.bodyText),
          interactions,
          rightActionProbes,
          facts,
        },
        null,
        2,
      ),
      'utf8',
    )

    const networkPath = fileFor(artifactDirs.network, 'responses', 'json')
    fs.writeFileSync(
      networkPath,
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode,
          state,
          stamp: stampText,
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
          stamp: stampText,
          url: page.url(),
          isLoginBlocked: isBlocked(page.url(), facts.bodyText),
          bodyLength: facts.bodyText.length,
          bodySample: stableText(facts.bodyText).slice(0, 1200),
          topButtons: facts.buttons.slice(0, 60),
          inputs: facts.inputs.slice(0, 20),
          selects: facts.selects.slice(0, 30),
          tableHeaders: facts.tableHeaders.slice(0, 60),
          rows: facts.rows.slice(0, 30),
          headings: facts.headings.slice(0, 30),
          interactions,
          rightActionProbes,
          artifacts: {
            screenshotPath,
            fullScreenshotPath,
            htmlPath,
            stylePath,
            networkPath,
          },
        },
        null,
        2,
      ),
    )

    await context.close()
  } finally {
    await browser.close()
  }
} finally {
  if (previewProcess) previewProcess.kill()
}

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stampText}-${suffix}.${extension}`)
}

async function waitForBusinessSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 18_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('自助入住') ||
          text.includes('自助机') ||
          text.includes('智住') ||
          text.includes('智慧酒店') ||
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

async function runInteractionSweep(page) {
  const interactions = []

  for (const action of [
    { slug: 'primary-action', labels: ['未开通', '去开通', '立即开通', '开通', '新增', '添加', '配置'] },
    { slug: 'settings-action', labels: ['全局设置', '配置入住引导', '入住引导', '设置'] },
    { slug: 'edit-message-action', labels: ['编辑短信内容', '短信发送密码', '短信内容'] },
    { slug: 'download-qrcode-action', labels: ['下载二维码', '前台数字化（扫码）', '前台数字化'] },
    { slug: 'expert-action', labels: ['联系智慧酒店专家', '智慧酒店专家', '自助机入住'] },
    { slug: 'guide-action', labels: ['查看规则', '查看小程序', '操作指引', '新手指引', '使用说明', '查看教程'] },
    { slug: 'first-switch', labels: ['云端入住登记开关', '启用', '停用', '开启', '关闭'] },
  ]) {
    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)
    const before = await summarizeTransientState(page)
    const result = await clickFirstVisibleLabel(page, action.labels)
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})
    await page.waitForTimeout(900)
    const after = await summarizeTransientState(page)
    const screenshotPath = fileFor(artifactDirs.screenshots, action.slug, 'png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    interactions.push({
      slug: action.slug,
      labels: action.labels,
      result,
      urlChanged: before.url !== after.url,
      textChanged: before.bodyText !== after.bodyText,
      before,
      after,
      screenshotPath,
    })
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(300)
  }

  return interactions
}

async function setupRightActionProbeContext(context) {
  await context.addInitScript(() => {
    const safeText = (value) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 300)
    const push = (type, detail = {}) => {
      window.__probeEvents = window.__probeEvents || []
      window.__probeEvents.push({ type, detail, href: location.href, ts: Date.now() })
    }

    const wrapFunction = (obj, key, type) => {
      const original = obj[key]
      if (typeof original !== 'function') return
      obj[key] = function (...args) {
        push(type, {
          args: args.map((arg) => {
            if (typeof arg === 'string') return arg.slice(0, 240)
            if (arg == null) return arg
            return Object.prototype.toString.call(arg)
          }),
        })
        return original.apply(this, args)
      }
    }

    wrapFunction(window, 'open', 'window.open')
    wrapFunction(history, 'pushState', 'history.pushState')
    wrapFunction(history, 'replaceState', 'history.replaceState')
    wrapFunction(URL, 'createObjectURL', 'URL.createObjectURL')

    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const input = args[0]
      const url = typeof input === 'string' ? input : input?.url
      const method = args[1]?.method || input?.method || 'GET'
      push('fetch', { url, method })
      return originalFetch(...args)
    }

    const originalXhrOpen = XMLHttpRequest.prototype.open
    const originalXhrSend = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__probeMethod = method
      this.__probeUrl = url
      return originalXhrOpen.call(this, method, url, ...rest)
    }
    XMLHttpRequest.prototype.send = function (body) {
      push('xhr.send', {
        url: this.__probeUrl,
        method: this.__probeMethod,
        bodyType: body ? Object.prototype.toString.call(body) : null,
      })
      return originalXhrSend.call(this, body)
    }

    const originalAnchorClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function (...args) {
      push('anchor.click', {
        href: this.href,
        download: this.getAttribute('download'),
        target: this.target,
        text: safeText(this.textContent),
      })
      return originalAnchorClick.apply(this, args)
    }

    document.addEventListener(
      'click',
      (event) => {
        const target =
          event.target instanceof HTMLElement ? event.target.closest('button,a,[role="button"]') : null
        if (!target) return
        push('dom.click', {
          tag: target.tagName,
          className: String(target.className || '').slice(0, 200),
          text: safeText(target.textContent),
        })
      },
      true,
    )

    window.addEventListener('message', (event) => {
      push('window.message', {
        origin: event.origin,
        dataType: typeof event.data,
      })
    })

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (!(node instanceof HTMLElement)) continue
            const text = safeText(node.innerText || node.textContent)
            if (!text) continue
            const rect = node.getBoundingClientRect()
            const style = getComputedStyle(node)
            push('dom.added', {
              tag: node.tagName,
              className: String(node.className || '').slice(0, 200),
              text,
              display: style.display,
              visibility: style.visibility,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            })
          }
        }
        if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
          const node = mutation.target
          const text = safeText(node.innerText || node.textContent)
          if (!text) continue
          push('dom.attr', {
            attr: mutation.attributeName,
            tag: node.tagName,
            className: String(node.className || '').slice(0, 200),
            text,
          })
        }
      }
    })

    const start = () =>
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'open', 'aria-hidden', 'aria-expanded'],
      })

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true })
    } else {
      start()
    }
  })

  const requests = []
  const popups = []
  const downloads = []
  context.on('request', (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      ts: Date.now(),
    })
  })
  context.on('page', (popup) => {
    popups.push({
      url: popup.url(),
      source: 'context.page',
      ts: Date.now(),
    })
  })
  context.on('download', (download) => {
    downloads.push({
      suggestedFilename: download.suggestedFilename(),
      ts: Date.now(),
    })
  })
  return { requests, popups, downloads }
}

async function runRightActionProbeSweep(page, probeState) {
  if (!probeState) return []

  const scenarios = [
    {
      slug: 'download-qrcode-button',
      execute: () => clickVisibleButtonByText(page, '下载二维码'),
    },
    {
      slug: 'contact-expert-button',
      execute: () => clickVisibleButtonByText(page, '联系智慧酒店专家'),
    },
    {
      slug: 'expand-scan-then-download-qrcode-button',
      execute: async () => {
        const header = await clickHeaderForButtonText(page, '下载二维码')
        await page.waitForTimeout(500)
        const button = await clickVisibleButtonByText(page, '下载二维码')
        return { header, button }
      },
    },
    {
      slug: 'expand-kiosk-then-contact-expert-button',
      execute: async () => {
        const header = await clickHeaderForButtonText(page, '联系智慧酒店专家')
        await page.waitForTimeout(500)
        const button = await clickVisibleButtonByText(page, '联系智慧酒店专家')
        return { header, button }
      },
    },
  ]

  const results = []
  for (const scenario of scenarios) {
    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForBusinessSurface(page)
    await page.evaluate(() => {
      window.__probeEvents = []
    })
    const requestStart = probeState.requests.length
    const popupStart = probeState.popups.length
    const downloadStart = probeState.downloads.length
    const before = await summarizeRightActionSurface(page)
    const actionResult = await scenario.execute()
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})
    await page.waitForTimeout(1_200)
    const after = await summarizeRightActionSurface(page)

    results.push({
      slug: scenario.slug,
      actionResult,
      urlChanged: before.url !== after.url,
      bodyChanged: before.bodySample !== after.bodySample,
      before,
      after,
      newRequests: probeState.requests.slice(requestStart),
      newPopups: probeState.popups.slice(popupStart),
      newDownloads: probeState.downloads.slice(downloadStart),
    })
  }

  return results
}

async function summarizeRightActionSurface(page) {
  return page.evaluate(() => {
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim()
    const visible = (node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    return {
      url: location.href,
      bodySample: normalize(document.body.innerText).slice(0, 2200),
      visibleDialogs: Array.from(
        document.querySelectorAll('[role="dialog"],.ant-modal,.ant-drawer,.ant-message,.ant-notification'),
      )
        .filter(visible)
        .map((node) => ({
          text: normalize(node.textContent).slice(0, 260),
          className: String(node.className || '').slice(0, 160),
        }))
        .filter((item) => item.text),
      visibleButtons: Array.from(document.querySelectorAll('button'))
        .filter(visible)
        .map((node, index) => ({
          index,
          text: normalize(node.textContent).slice(0, 120),
          className: String(node.className || '').slice(0, 120),
        }))
        .filter((item) => item.text),
      probeEvents: (window.__probeEvents || []).slice(-120),
    }
  })
}

async function clickVisibleButtonByIndex(page, visibleButtonIndex) {
  const button = await resolveVisibleButtonBox(page, visibleButtonIndex)
  if (!button) {
    return { ok: false, reason: 'button-not-found', visibleButtonIndex }
  }
  await page.mouse.click(button.rect.x + button.rect.width / 2, button.rect.y + button.rect.height / 2)
  return {
    ok: true,
    visibleButtonIndex,
    text: button.text,
    className: button.className,
    rect: button.rect,
  }
}

async function clickVisibleButtonByText(page, text) {
  const button = await page.evaluate((targetText) => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim()
    const match = Array.from(document.querySelectorAll('button'))
      .filter(visible)
      .find((node) => normalize(node.textContent) === targetText)
    if (!(match instanceof HTMLElement)) return null
    const rect = match.getBoundingClientRect()
    return {
      text: normalize(match.textContent).slice(0, 120),
      className: String(match.className || '').slice(0, 160),
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    }
  }, text)

  if (!button) {
    return { ok: false, reason: 'button-not-found', text }
  }

  await page.mouse.click(button.rect.x + button.rect.width / 2, button.rect.y + button.rect.height / 2)
  return {
    ok: true,
    text: button.text,
    className: button.className,
    rect: button.rect,
  }
}

async function clickHeaderForVisibleButtonIndex(page, visibleButtonIndex) {
  const target = await page.evaluate((index) => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const button = Array.from(document.querySelectorAll('button')).filter(visible)[index]
    const header = button?.closest('.ant-collapse-header')
    if (!(button instanceof HTMLElement) || !(header instanceof HTMLElement)) {
      return null
    }
    const rect = header.getBoundingClientRect()
    return {
      buttonText: String(button.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      className: String(header.className || '').slice(0, 160),
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    }
  }, visibleButtonIndex)

  if (!target) {
    return { ok: false, reason: 'header-not-found', visibleButtonIndex }
  }

  await page.mouse.click(target.rect.x + 40, target.rect.y + target.rect.height / 2)
  return {
    ok: true,
    visibleButtonIndex,
    buttonText: target.buttonText,
    className: target.className,
    rect: target.rect,
  }
}

async function clickHeaderForButtonText(page, text) {
  const target = await page.evaluate((targetText) => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim()
    const button = Array.from(document.querySelectorAll('button'))
      .filter(visible)
      .find((node) => normalize(node.textContent) === targetText)
    const header = button?.closest('.ant-collapse-header')
    if (!(button instanceof HTMLElement) || !(header instanceof HTMLElement)) {
      return null
    }
    const rect = header.getBoundingClientRect()
    return {
      buttonText: normalize(button.textContent).slice(0, 120),
      className: String(header.className || '').slice(0, 160),
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    }
  }, text)

  if (!target) {
    return { ok: false, reason: 'header-not-found', text }
  }

  await page.mouse.click(target.rect.x + 40, target.rect.y + target.rect.height / 2)
  return {
    ok: true,
    text: target.buttonText,
    className: target.className,
    rect: target.rect,
  }
}

async function resolveVisibleButtonBox(page, visibleButtonIndex) {
  return page.evaluate((index) => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const button = Array.from(document.querySelectorAll('button')).filter(visible)[index]
    if (!(button instanceof HTMLElement)) return null
    const rect = button.getBoundingClientRect()
    return {
      text: String(button.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      className: String(button.className || '').slice(0, 160),
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    }
  }, visibleButtonIndex)
}

async function clickFirstVisibleLabel(page, labels) {
  for (const label of labels) {
    const locators = [
      page.getByRole('button', { name: label, exact: true }),
      page.getByRole('link', { name: label, exact: true }),
      page.getByText(label, { exact: true }),
      page.getByText(label, { exact: false }),
    ]

    for (const locator of locators) {
      const count = await locator.count().catch(() => 0)
      for (let index = 0; index < Math.min(count, 8); index += 1) {
        const item = locator.nth(index)
        const box = await item.boundingBox().catch(() => null)
        if (!box || box.width < 1 || box.height < 1) continue
        const text = (await item.textContent().catch(() => ''))?.trim() ?? ''
        await item.click({ timeout: 4_000 }).catch(async () => {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        })
        return { found: true, clicked: true, label, text: text.slice(0, 160), box: roundBox(box) }
      }
    }
  }

  return { found: false, clicked: false, labels }
}

async function summarizeTransientState(page) {
  return page.evaluate(() => {
    const visibleTexts = (selector) =>
      Array.from(document.querySelectorAll(selector))
        .filter((node) => {
          const rect = node.getBoundingClientRect()
          const style = getComputedStyle(node)
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
        })
        .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 40)

    return {
      url: location.href,
      bodyText: document.body.innerText.slice(0, 4000),
      dialogs: visibleTexts('[role="dialog"],.ant-modal,.ant-drawer,.modal,.drawer'),
      dropdowns: visibleTexts('.ant-select-dropdown,.ant-dropdown,[role="listbox"],.dropdown'),
      active: visibleTexts('.is-active,.ant-tabs-tab-active,.active,.ant-menu-item-selected'),
    }
  })
}

async function extractPageFacts(page) {
  return page.evaluate(() => {
    const bodyText = document.body?.innerText || ''
    const visible = (node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const normalize = (text) => String(text || '').replace(/\s+/g, ' ').trim()
    const readStyle = (node) => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return {
        tag: node.tagName.toLowerCase(),
        className: String(node.className || '').slice(0, 180),
        role: node.getAttribute('role'),
        ariaLabel: node.getAttribute('aria-label'),
        placeholder: node.getAttribute('placeholder'),
        text: normalize(node.textContent).slice(0, 260),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        styles: {
          display: style.display,
          position: style.position,
          padding: style.padding,
          margin: style.margin,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          color: style.color,
          backgroundColor: style.backgroundColor,
          border: style.border,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          overflow: style.overflow,
          gridTemplateColumns: style.gridTemplateColumns,
        },
      }
    }

    const buttons = Array.from(document.querySelectorAll('button,[role="button"],a'))
      .filter(visible)
      .map((node) => normalize(node.textContent || node.getAttribute('aria-label')))
      .filter(Boolean)
      .slice(0, 180)

    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,[class*="title"],[class*="Title"]'))
      .filter(visible)
      .map((node) => normalize(node.textContent))
      .filter(Boolean)
      .slice(0, 80)

    const inputs = Array.from(document.querySelectorAll('input,textarea'))
      .filter(visible)
      .map((node) => ({
        type: node.getAttribute('type'),
        placeholder: node.getAttribute('placeholder'),
        ariaLabel: node.getAttribute('aria-label'),
        value: node.value || '',
        rect: readStyle(node).rect,
      }))

    const selects = Array.from(document.querySelectorAll('.ant-select,[role="combobox"],select,[class*="select"]'))
      .filter(visible)
      .map(readStyle)
      .slice(0, 100)

    const tableHeaders = Array.from(document.querySelectorAll('th,.ant-table-thead .ant-table-cell,[role="columnheader"],.table-head *'))
      .filter(visible)
      .map((node) => normalize(node.textContent))
      .filter(Boolean)
      .slice(0, 100)

    const rows = Array.from(document.querySelectorAll('tr,.ant-table-row,[role="row"],.table-row,.ant-card,.ant-list-item'))
      .filter(visible)
      .map((node) => normalize(node.textContent))
      .filter((text) => text.length > 5)
      .slice(0, 120)

    const images = Array.from(document.querySelectorAll('img,svg'))
      .filter(visible)
      .map((node) => ({
        ...readStyle(node),
        src: node.getAttribute('src'),
        viewBox: node.getAttribute('viewBox'),
      }))
      .slice(0, 80)

    const elementSamples = Array.from(document.querySelectorAll('body *'))
      .filter(visible)
      .slice(0, 320)
      .map(readStyle)

    return {
      title: document.title,
      location: location.href,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        devicePixelRatio,
      },
      bodyText,
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        location.href.includes('/home') ||
        location.href.includes('/login'),
      buttons,
      headings,
      inputs,
      selects,
      tableHeaders,
      rows,
      images,
      elementSamples,
    }
  })
}

async function ensurePreviewServer(url) {
  if (await canFetch(url)) return

  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  previewProcess = spawn(command, ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  })

  const started = Date.now()
  while (Date.now() - started < 20_000) {
    if (await canFetch(url)) return
    await delay(500)
  }

  throw new Error(`Local preview server did not become ready at ${url}`)
}

async function canFetch(url) {
  try {
    const response = await fetch(url, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}

function isBlocked(url, bodyText) {
  return (
    bodyText.includes('账号登录') ||
    bodyText.includes('请按住滑块') ||
    bodyText.includes('登录密码') ||
    url.includes('/home') ||
    url.includes('/login')
  )
}

function stableText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function shouldCapturePayload(url) {
  return url.includes(HUDSON_API_HOST)
}

function parsePostData(postData) {
  if (!postData) return null
  try {
    return summarizeValue(JSON.parse(postData))
  } catch {
    return stableText(postData).slice(0, 600)
  }
}

function summarizeValue(value, depth = 0) {
  if (value === null) return null
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      sample: value.slice(0, 3).map((item) => summarizeValue(item, depth + 1)),
    }
  }
  if (typeof value === 'object') {
    if (depth >= 3) {
      return { type: 'object', keys: Object.keys(value).slice(0, 30) }
    }
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 50)
        .map(([key, item]) => [key, SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : summarizeValue(item, depth + 1)]),
    )
  }
  if (typeof value === 'string') {
    if (SENSITIVE_KEY_PATTERN.test(value)) return '[redacted]'
    return value.length > 180 ? `${value.slice(0, 180)}...` : value
  }
  return value
}

function roundBox(box) {
  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
