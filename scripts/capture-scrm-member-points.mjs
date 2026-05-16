import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'scrm--huiyuan-zhongxin--huiyuan-jifen'
const targetUrl = 'https://minsubao.localhome.cn/scrm/memberCenter/integrate'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/scrm/memberCenter/integrate'
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
        const bodyText = document.body?.innerText || ''
        return bodyText.length > 500 || location.href.includes('/login') || location.href.includes('passport')
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1800)
}

async function applyState(page) {
  const interactions = []

  if (state === 'first-dropdown') {
    const selector = page.locator('.ant-select-selector, button[aria-haspopup="listbox"], [role="combobox"]').first()
    if ((await selector.count().catch(() => 0)) > 0) {
      try {
        await selector.click({ timeout: 3000 })
        await page.waitForTimeout(900)
        interactions.push({ action: 'open:first-dropdown', clicked: true, url: page.url() })
      } catch (error) {
        interactions.push({ action: 'open:first-dropdown', clicked: false, error: error.message.split('\n')[0] })
      }
    }
    return interactions
  }

  if (!['primary', 'secondary', 'table-action'].includes(state)) return interactions

  const clicked = await page.evaluate((requestedState) => {
    function isVisible(element) {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }

    const candidates = [...document.querySelectorAll('button,a,[role="button"]')]
      .filter(isVisible)
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
            .replace(/\s+/g, ' ')
            .trim(),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          disabled: element.disabled || element.getAttribute('aria-disabled') === 'true',
          element,
        }
      })
      .filter((item) => item.x > 220 && item.y > 48 && item.width > 8 && item.height > 8 && !item.disabled)

    const ordered =
      requestedState === 'table-action'
        ? candidates.filter((item) => item.y > 150)
        : candidates.filter((item) => item.y < 220)

    const index = requestedState === 'secondary' ? 1 : 0
    const target = ordered[index] ?? ordered[0] ?? candidates[index] ?? candidates[0]
    if (!target) return null
    target.element.click()
    return { text: target.text, x: Math.round(target.x), y: Math.round(target.y), state: requestedState }
  }, state)

  if (clicked) {
    await page.waitForTimeout(1000)
    interactions.push({ action: `click:${state}`, clicked: true, target: clicked, url: page.url() })
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
        className: String(element.className || '').slice(0, 220),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        placeholder: element.getAttribute('placeholder'),
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 460),
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
    const passwordInput = [...document.querySelectorAll('input[type="password"]')].some(isVisible)
    const visibleElements = [...document.querySelectorAll('body *')].filter(isVisible).slice(0, 460).map(describe)
    const controls = [
      ...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"],[role="combobox"]'),
    ]
      .filter(isVisible)
      .map(describe)
      .slice(0, 220)

    const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,[role="columnheader"],table thead *')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 140)

    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
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
      .map((element) => ({
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value,
      }))
      .slice(0, 120)

    const dialogs = [...document.querySelectorAll('.ant-modal,.ant-drawer,[role="dialog"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 60)

    const dropdowns = [...document.querySelectorAll('.ant-select-dropdown,.ant-dropdown,[role="listbox"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 60)

    const keyElements = visibleElements.filter(
      (item) =>
        item.rect.x > 220 &&
        item.rect.y > 48 &&
        item.rect.width > 20 &&
        item.rect.height > 10 &&
        item.text,
    )

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 9000),
      isLoginBlocked: location.href.includes('/login') || location.href.includes('passport') || passwordInput,
      hasBusinessText:
        location.href.includes('/scrm/memberCenter/integrate') && bodyText.length > 1000 && !passwordInput,
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
  await fs.access(chromeExecutablePath)
  if (mode === 'target') await fs.access(storageState)

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
          interactions,
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
