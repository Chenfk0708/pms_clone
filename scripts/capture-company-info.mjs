import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TASK_ID = 'shezhi--qiye-shezhi--qiye-xinxi'
const TARGET_URL =
  process.env.PMS_TARGET_URL ?? 'https://minsubao.localhome.cn/CompanySetting/CompanyInfo'
const LOCAL_URL =
  process.env.PMS_LOCAL_URL ?? 'http://127.0.0.1:4173/CompanySetting/CompanyInfo'
const STORAGE_STATE = path.resolve('playwright/.auth/pms-user.json')
const CHROME_PATH =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const mode = process.argv.includes('--clone') ? 'clone' : 'target'
const state = process.argv.includes('--interaction') ? 'interaction' : 'default'
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

const artifactRoots = {
  screenshots: path.resolve('artifacts/screenshots', TASK_ID),
  dom: path.resolve('artifacts/dom-snapshots', TASK_ID),
  styles: path.resolve('artifacts/style-dumps', TASK_ID),
  network: path.resolve('artifacts/network', TASK_ID),
}

for (const directory of Object.values(artifactRoots)) {
  fs.mkdirSync(directory, { recursive: true })
}

function fileFor(root, suffix, extension) {
  return path.join(root, `${state}-${mode}-${stampText}-${suffix}.${extension}`)
}

function safeName(label) {
  return label.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
}

function stableText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

async function waitForSurface(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 18_000 }).catch(() => {})
  await page
    .waitForFunction(
      () => {
        const text = document.body?.innerText || ''
        return (
          text.includes('企业信息') ||
          text.includes('企业设置') ||
          text.includes('企业名称') ||
          text.includes('企业Logo') ||
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

async function screenshotComponent(page, name, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if ((await locator.count()) === 0) continue
    try {
      const box = await locator.boundingBox()
      if (!box || box.width < 2 || box.height < 2) continue
      await locator.screenshot({ path: fileFor(artifactRoots.screenshots, `component-${name}`, 'png') })
      return { selector, path: fileFor(artifactRoots.screenshots, `component-${name}`, 'png') }
    } catch {
      continue
    }
  }
  return false
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
      'gridTemplateRows',
      'alignItems',
      'justifyContent',
      'gap',
    ]

    function textOf(element) {
      return (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim()
    }

    function isVisible(element) {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    function summarizeElement(element) {
      const rect = element.getBoundingClientRect()
      const computed = window.getComputedStyle(element)
      const styles = {}
      for (const prop of styleProps) styles[prop] = computed[prop]
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 180),
        role: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        placeholder: element.getAttribute('placeholder'),
        value: element.value || '',
        text: textOf(element).slice(0, 420),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        styles,
      }
    }

    const visibleElements = [...document.querySelectorAll('body *')]
      .filter(isVisible)
      .slice(0, 520)
      .map(summarizeElement)

    const bodyText = document.body?.innerText || ''
    const buttons = [...document.querySelectorAll('button,[role="button"],a')]
      .filter(isVisible)
      .map((element) => ({
        text: textOf(element) || element.getAttribute('aria-label') || '',
        href: element.getAttribute('href'),
        className: String(element.className || '').slice(0, 140),
        rect: summarizeElement(element).rect,
      }))
      .filter((item) => item.text)
      .slice(0, 220)

    const controls = [...document.querySelectorAll('input,textarea,select,[role="combobox"]')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 120)

    const headings = [...document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 80)

    const tables = [...document.querySelectorAll('table,[role="table"],.ant-table,.el-table')]
      .filter(isVisible)
      .map(summarizeElement)
      .slice(0, 40)

    const fieldLike = visibleElements.filter((item) =>
      /企业|公司|名称|Logo|编码|电话|地址|联系人|管理员|营业|税号|保存|取消|修改|编辑|上传|设置/.test(
        `${item.text} ${item.placeholder} ${item.ariaLabel}`,
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
        bodyText.includes('企业信息') &&
        (bodyText.includes('企业设置') || bodyText.includes('企业名称') || bodyText.includes('企业Logo')),
      buttons,
      controls,
      headings,
      tables,
      fieldLike,
      visibleElements,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    }
  })
}

async function clickFirstVisibleText(page, label) {
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
      try {
        await item.click({ timeout: 3000 })
      } catch {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      }
      await page.waitForTimeout(900)
      return {
        found: true,
        label,
        url: page.url(),
        box: {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        },
      }
    }
  }

  return { found: false, label }
}

async function runInteractionSweep(page) {
  const interactions = []
  const labels = ['编 辑', '保存', '保 存', '取消', '取 消', '企业Logo', '上传', '权限设置', '成员设置']
  for (const label of labels) {
    await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    await waitForSurface(page)
    const result = await clickFirstVisibleText(page, label)
    if (result.found) {
      const facts = await extractFacts(page)
      const screenshotPath = fileFor(artifactRoots.screenshots, `after-${safeName(label)}`, 'png')
      await page.screenshot({ path: screenshotPath, fullPage: false })
      interactions.push({
        action: `click:${label}`,
        result,
        dialogText: facts.visibleElements
          .filter((item) => /dialog|modal|drawer|popover|dropdown/i.test(`${item.role} ${item.className}`))
          .map((item) => item.text)
          .filter(Boolean)
          .slice(0, 20),
        bodySample: facts.bodyTextSample.slice(0, 1600),
        screenshotPath,
      })
    }
  }
  return interactions
}

async function main() {
  if (mode === 'target' && !fs.existsSync(STORAGE_STATE)) {
    throw new Error(`Missing storageState: ${STORAGE_STATE}`)
  }
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Missing Chrome executable: ${CHROME_PATH}`)
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
    await waitForSurface(page)

    const interactions = state === 'interaction' ? await runInteractionSweep(page) : []
    if (state === 'interaction') {
      await page.goto(mode === 'target' ? TARGET_URL : LOCAL_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      })
      await waitForSurface(page)
    }

    const componentScreenshots = {
      form: await screenshotComponent(page, 'form', [
        '.company-info-page',
        '.settings-company-info',
        '.ant-form',
        'form',
        '.ant-card:has-text("企业")',
      ]),
      logo: await screenshotComponent(page, 'logo', [
        '.ant-upload',
        '[class*="logo"]',
        '[class*="Logo"]',
        'img',
      ]),
    }

    const screenshotPath = fileFor(artifactRoots.screenshots, 'viewport', 'png')
    const fullScreenshotPath = fileFor(artifactRoots.screenshots, 'full', 'png')
    await page.screenshot({ path: screenshotPath })
    await page.screenshot({ path: fullScreenshotPath, fullPage: true })

    const htmlPath = fileFor(artifactRoots.dom, 'page', 'html')
    fs.writeFileSync(htmlPath, await page.content(), 'utf8')

    const facts = await extractFacts(page)
    const stylePath = fileFor(artifactRoots.styles, 'facts', 'json')
    fs.writeFileSync(
      stylePath,
      JSON.stringify({ mode, state, stamp: stampText, interactions, componentScreenshots, facts }, null, 2),
      'utf8',
    )

    const networkPath = fileFor(artifactRoots.network, 'responses', 'json')
    fs.writeFileSync(
      networkPath,
      JSON.stringify({ mode, state, stamp: stampText, url: page.url(), responses: network }, null, 2),
      'utf8',
    )

    console.log(
      JSON.stringify(
        {
          mode,
          state,
          stamp: stampText,
          url: page.url(),
          isLoginBlocked: facts.isLoginBlocked,
          hasBusinessText: facts.hasBusinessText,
          bodyLength: facts.bodyLength,
          buttons: facts.buttons.slice(0, 80),
          controls: facts.controls.slice(0, 40),
          headings: facts.headings.slice(0, 30),
          fieldLike: facts.fieldLike.slice(0, 80),
          componentScreenshots,
          screenshots: [screenshotPath, fullScreenshotPath],
          dom: htmlPath,
          styles: stylePath,
          network: networkPath,
          interactionCount: interactions.length,
          bodySample: stableText(facts.bodyTextSample).slice(0, 1800),
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
