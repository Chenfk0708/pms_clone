import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'scrm--kehu-goutong--liaotian-gongjulan'
const targetUrl = 'https://minsubao.localhome.cn/scrm/sidebarPreview'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/scrm/sidebarPreview'
const storageState = path.resolve('playwright/.auth/pms-user.json')
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
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

function fileFor(root, state, extension) {
  return path.join(root, `${state}-${mode}-${stamp}.${extension}`)
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
          text.includes('企微SCRM-聊天工具栏') ||
          text.includes('聊天工具栏可实时查看客户资料') ||
          text.includes('立即开通') ||
          text.includes('账号登录') ||
          text.includes('请按住滑块')
        )
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
  await page.waitForTimeout(1200)
}

async function extractFacts(page) {
  return page.evaluate(() => {
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
        className: String(element.className || '').slice(0, 240),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        href: element.getAttribute('href'),
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
    const visibleElements = [...document.querySelectorAll('body *')].filter(isVisible).slice(0, 360).map(describe)
    const controls = [...document.querySelectorAll('button,a,input,textarea,[role="button"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 160)
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,[class*="title"],[class*="Title"]')]
      .filter(isVisible)
      .map(describe)
      .slice(0, 80)
    const images = [...document.querySelectorAll('img,svg')]
      .filter(isVisible)
      .map((element) => {
        const item = describe(element)
        return {
          ...item,
          src: element.getAttribute('src'),
          viewBox: element.getAttribute('viewBox'),
        }
      })
      .slice(0, 80)

    return {
      url: location.href,
      title: document.title,
      bodyLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 6000),
      isLoginBlocked:
        bodyText.includes('账号登录') ||
        bodyText.includes('请按住滑块') ||
        bodyText.includes('登录其他登录方式'),
      hasBusinessText:
        bodyText.includes('企微SCRM-聊天工具栏') ||
        bodyText.includes('聊天工具栏可实时查看客户资料') ||
        bodyText.includes('限时免费'),
      headings,
      controls,
      images,
      visibleElements,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  })
}

async function clickIfVisible(page, label, stateName, states) {
  const locator = page.getByText(label, { exact: true }).first()
  if ((await locator.count().catch(() => 0)) === 0) return
  try {
    await locator.click({ timeout: 2500 })
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1000)
    states[stateName] = await extractFacts(page)
    await page.screenshot({ path: fileFor(artifactDirs.screenshots, stateName, 'png') })
  } catch (error) {
    states[stateName] = { error: error.message }
  }
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

    const states = {
      default: await extractFacts(page),
    }

    await page.screenshot({ path: fileFor(artifactDirs.screenshots, 'default', 'png') })
    await page.screenshot({ path: fileFor(artifactDirs.screenshots, 'full', 'png'), fullPage: true })

    await clickIfVisible(page, '立即开通', 'open-subscribe', states)

    await fs.writeFile(fileFor(artifactDirs.dom, 'default', 'html'), await page.content(), 'utf8')
    await fs.writeFile(
      fileFor(artifactDirs.styles, 'facts', 'json'),
      JSON.stringify({ mode, stamp, states }, null, 2),
      'utf8',
    )
    await fs.writeFile(
      fileFor(artifactDirs.network, 'responses', 'json'),
      JSON.stringify({ mode, stamp, url: page.url(), responses: network }, null, 2),
      'utf8',
    )

    const summary = {
      mode,
      stamp,
      url: states.default.url,
      finalUrl: page.url(),
      isLoginBlocked: states.default.isLoginBlocked,
      hasBusinessText: states.default.hasBusinessText,
      bodyLength: states.default.bodyLength,
      headings: states.default.headings.map((item) => item.text).filter(Boolean).slice(0, 20),
      controls: states.default.controls.map((item) => item.text).filter(Boolean).slice(0, 40),
      screenshots: [fileFor(artifactDirs.screenshots, 'default', 'png'), fileFor(artifactDirs.screenshots, 'full', 'png')],
      interactionScreenshot: fileFor(artifactDirs.screenshots, 'open-subscribe', 'png'),
      dom: fileFor(artifactDirs.dom, 'default', 'html'),
      styles: fileFor(artifactDirs.styles, 'facts', 'json'),
      network: fileFor(artifactDirs.network, 'responses', 'json'),
      bodySample: normalizeText(states.default.bodyTextSample).slice(0, 1600),
      interactionSummary: states['open-subscribe']
        ? {
            url: states['open-subscribe'].url,
            bodySample: normalizeText(states['open-subscribe'].bodyTextSample ?? '').slice(0, 900),
          }
        : null,
    }
    console.log(JSON.stringify(summary, null, 2))

    await context.close()
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
