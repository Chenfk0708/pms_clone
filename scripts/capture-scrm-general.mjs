import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const taskId = 'scrm--kehu-gaikuang--kehu-gaikuang'
const targetUrl = 'https://minsubao.localhome.cn/scrm/general'
const cloneUrl = process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/scrm/general'
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
          text.includes('客户概况') ||
          text.includes('客户总数') ||
          text.includes('新增客户') ||
          text.includes('客户来源') ||
          text.includes('SCRM') ||
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
    const visibleElements = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      })
      .slice(0, 320)
      .map(describe)

    const controls = [...document.querySelectorAll('button,a,input,textarea,.ant-select-selector,[role="button"]')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      })
      .map(describe)
      .slice(0, 160)

    const tableHeaders = [...document.querySelectorAll('th,.ant-table-cell,.scrm-target-table th')]
      .map((element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 80)

    const chartLike = visibleElements.filter((item) =>
      /客户|会员|企微|来源|增长|新增|累计|趋势|导入|授权|营销|人数|占比/.test(item.text),
    )

    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .map((element) => ({
        text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
          .replace(/\s+/g, ' ')
          .trim(),
        href: element.getAttribute('href'),
        className: String(element.className || '').slice(0, 160),
      }))
      .filter((item) => item.text)
      .slice(0, 140)

    const inputs = [...document.querySelectorAll('input,textarea')]
      .map((element) => ({
        type: element.getAttribute('type'),
        placeholder: element.getAttribute('placeholder'),
        ariaLabel: element.getAttribute('aria-label'),
        value: element.value,
      }))
      .slice(0, 60)

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
        bodyText.includes('客户概况') ||
        bodyText.includes('客户总数') ||
        bodyText.includes('新增客户') ||
        bodyText.includes('SCRM'),
      controls,
      buttons,
      inputs,
      tableHeaders,
      chartLike,
      visibleElements,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  })
}

async function clickIfVisible(page, label) {
  const locator = page.getByText(label, { exact: true }).first()
  if ((await locator.count().catch(() => 0)) === 0) return null
  try {
    await locator.click({ timeout: 2500 })
    await page.waitForTimeout(800)
    return await extractFacts(page)
  } catch (error) {
    return { error: error.message }
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

    const defaultUrl = page.url()
    const defaultHtml = await page.content()
    const states = {
      default: await extractFacts(page),
    }

    await page.screenshot({ path: fileFor(artifactDirs.screenshots, 'default', 'png') })
    await page.screenshot({ path: fileFor(artifactDirs.screenshots, 'full', 'png'), fullPage: true })
    await fs.writeFile(fileFor(artifactDirs.dom, 'default', 'html'), defaultHtml, 'utf8')

    for (const label of ['客户来源', '客户标签', '会员等级', '近7天', '近30天', '导出', '查询', '重置']) {
      const facts = await clickIfVisible(page, label)
      if (facts) states[`afterClick:${label}`] = facts
    }

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
      url: defaultUrl,
      isLoginBlocked: states.default.isLoginBlocked,
      hasBusinessText: states.default.hasBusinessText,
      bodyLength: states.default.bodyLength,
      buttons: states.default.buttons.slice(0, 50),
      inputs: states.default.inputs.slice(0, 20),
      tableHeaders: states.default.tableHeaders,
      screenshots: [fileFor(artifactDirs.screenshots, 'default', 'png'), fileFor(artifactDirs.screenshots, 'full', 'png')],
      dom: fileFor(artifactDirs.dom, 'default', 'html'),
      styles: fileFor(artifactDirs.styles, 'facts', 'json'),
      network: fileFor(artifactDirs.network, 'responses', 'json'),
      bodySample: normalizeText(states.default.bodyTextSample).slice(0, 1400),
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
