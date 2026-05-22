import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

import { summarizeCaptchaLifecycle } from './captcha-lifecycle.mjs'

const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const startUrl = process.env.PMS_TARGET_URL ?? 'https://minsubao.localhome.cn/home'
const mobile = process.env.PMS_MOBILE
const password = process.env.PMS_PASSWORD
const headless = process.env.PMS_HEADLESS === '0' ? false : true
const timeoutMs = Number(process.env.PMS_CAPTCHA_TIMEOUT_MS ?? '30000')
const postDragWaitMs = Number(process.env.PMS_POST_DRAG_WAIT_MS ?? '3000')
const logPath = path.resolve(process.env.PMS_CAPTCHA_PROBE_LOG ?? 'tmp/captcha-ready-probe.json')

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
}

function isInterestingUrl(url) {
  return /captcha-open\.aliyuncs\.com|cloudauth-device-dualstack\.cn-shanghai\.aliyuncs\.com|captcha-frontend\/dynamicJS|\/user\/sign-in/i.test(
    url,
  )
}

function trimBody(body) {
  if (typeof body !== 'string') {
    return null
  }

  if (body.length <= 8_000) {
    return body
  }

  return `${body.slice(0, 8_000)}...[truncated]`
}

async function captureRuntimeSnapshot(page) {
  return page.evaluate(() => {
    const button = document.querySelector('button.submitBtn')
    const slider = document.querySelector('#aliyunCaptcha-sliding-slider')
    const wrapper = document.querySelector('#aliyunCaptcha-sliding-wrapper')
    const runtime = window.__AliyunCaptchaLast
    const config = runtime?.config ?? null

    return {
      href: window.location.href,
      title: document.title,
      hasMobileInput: Boolean(document.querySelector('input#mobile')),
      hasPasswordInput: Boolean(document.querySelector('input#password')),
      hasSlider: Boolean(slider),
      hasSliderWrapper: Boolean(wrapper),
      buttonClassName: button?.className ?? null,
      buttonDisabled: button?.disabled ?? null,
      sliderClassName: slider?.className ?? null,
      sliderText: slider?.textContent?.trim() ?? null,
      hasAliyunCaptchaInstance: Boolean(runtime),
      aliyunCaptchaConfig: config
        ? {
            SceneId: config.SceneId ?? null,
            verifyType: config.verifyType ?? null,
            CaptchaType: config.CaptchaType ?? null,
            securityToken: config.securityToken ?? null,
            captchaResult: config.captchaResult ?? null,
            verifyResult: config.verifyResult ?? null,
            immediate: config.immediate ?? null,
          }
        : null,
    }
  })
}

async function waitForCaptchaReady(page, rawEvents) {
  const startedAt = Date.now()
  let lastSnapshot = null
  let lastSummary = summarizeCaptchaLifecycle(rawEvents)

  while (Date.now() - startedAt < timeoutMs) {
    lastSnapshot = await captureRuntimeSnapshot(page)
    lastSummary = summarizeCaptchaLifecycle(rawEvents)

    if (lastSnapshot.hasSlider && lastSummary.isReady) {
      return {
        ready: true,
        elapsedMs: Date.now() - startedAt,
        snapshot: lastSnapshot,
        lifecycle: lastSummary,
      }
    }

    await page.waitForTimeout(250)
  }

  return {
    ready: false,
    elapsedMs: Date.now() - startedAt,
    snapshot: lastSnapshot,
    lifecycle: lastSummary,
  }
}

async function dragSlider(page) {
  const slider = page.locator('#aliyunCaptcha-sliding-slider')
  const wrapper = page.locator('#aliyunCaptcha-sliding-wrapper')
  const sliderBox = await slider.boundingBox()
  const wrapperBox = await wrapper.boundingBox()

  if (!sliderBox || !wrapperBox) {
    throw new Error('Slider or wrapper box is unavailable.')
  }

  const startX = sliderBox.x + sliderBox.width / 2
  const startY = sliderBox.y + sliderBox.height / 2
  const endX = wrapperBox.x + wrapperBox.width - sliderBox.width / 2 - 4

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(endX, startY, { steps: 24 })
  await page.mouse.up()

  return {
    sliderBox,
    wrapperBox,
    startX,
    startY,
    endX,
  }
}

async function main() {
  if (!mobile || !password) {
    throw new Error('Missing PMS_MOBILE or PMS_PASSWORD environment variable.')
  }

  ensureParentDir(logPath)

  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless,
  })

  const rawEvents = []

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    })
    const page = await context.newPage()

    page.on('request', (request) => {
      const url = request.url()

      if (!isInterestingUrl(url)) {
        return
      }

      rawEvents.push({
        at: new Date().toISOString(),
        type: 'request',
        method: request.method(),
        url,
        postData: request.postData() ?? null,
      })
    })

    page.on('response', async (response) => {
      const url = response.url()

      if (!isInterestingUrl(url)) {
        return
      }

      let body = null

      if (/captcha-open\.aliyuncs\.com|cloudauth-device-dualstack\.cn-shanghai\.aliyuncs\.com/i.test(url)) {
        body = trimBody(await response.text().catch(() => null))
      }

      rawEvents.push({
        at: new Date().toISOString(),
        type: 'response',
        status: response.status(),
        url,
        body,
      })
    })

    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.locator('input#mobile:visible').first().fill(mobile)
    await page.locator('input#password:visible').first().fill(password)

    const beforeReadySnapshot = await captureRuntimeSnapshot(page)
    const readyState = await waitForCaptchaReady(page, rawEvents)

    let dragResult = null
    let dragError = null

    if (readyState.ready) {
      try {
        dragResult = await dragSlider(page)
      } catch (error) {
        dragError = error instanceof Error ? error.message : String(error)
      }
    }

    await page.waitForTimeout(postDragWaitMs)

    const afterDragSnapshot = await captureRuntimeSnapshot(page)
    const afterDragLifecycle = summarizeCaptchaLifecycle(rawEvents)

    const result = {
      checkedAt: new Date().toISOString(),
      startUrl,
      headless,
      timeoutMs,
      postDragWaitMs,
      beforeReadySnapshot,
      readyState,
      dragResult,
      dragError,
      afterDragSnapshot,
      afterDragLifecycle,
      interestingEvents: rawEvents,
    }

    writeJson(logPath, result)
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
