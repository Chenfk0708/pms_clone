import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

import { summarizeCaptchaLifecycle } from './captcha-lifecycle.mjs'

const cdpUrl = process.env.PMS_CDP_URL ?? 'http://127.0.0.1:9222'
const targetUrl = process.env.PMS_TARGET_URL ?? 'https://minsubao.localhome.cn/home'
const mobile = process.env.PMS_MOBILE
const password = process.env.PMS_PASSWORD
const timeoutMs = Number(process.env.PMS_CAPTCHA_TIMEOUT_MS ?? '30000')
const postDragWaitMs = Number(process.env.PMS_POST_DRAG_WAIT_MS ?? '4000')
const shouldAutoDrag = process.env.PMS_AUTO_DRAG === '0' ? false : true
const logPath = path.resolve(process.env.PMS_CAPTCHA_CALLBACK_PROBE_LOG ?? 'tmp/captcha-callback-probe.json')

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
    const signState = window.g_app?._store?.getState?.()?.sign
    const aliParams = signState?.ncParams?.aliParams ?? null

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
      aliyunCaptchaConfig: runtime?.config
        ? {
            SceneId: runtime.config.SceneId ?? null,
            verifyType: runtime.config.verifyType ?? null,
            CaptchaType: runtime.config.CaptchaType ?? null,
            securityToken: runtime.config.securityToken ?? null,
            captchaResult: runtime.config.captchaResult ?? null,
            verifyResult: runtime.config.verifyResult ?? null,
            immediate: runtime.config.immediate ?? null,
          }
        : null,
      signState: signState
        ? {
            operateType: signState.operateType ?? null,
            ifResetNcSlider: signState.ifResetNcSlider ?? null,
            verifcodeCount: signState.verifcodeCount ?? null,
            validateResult: signState.validateResult ?? null,
            aliParams,
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

async function installProbe(page) {
  await page.addInitScript(() => {
    const probeEvents = []

    function push(type, detail = {}) {
      probeEvents.push({
        at: new Date().toISOString(),
        type,
        detail,
      })
    }

    function truncateString(value) {
      if (typeof value !== 'string') {
        return value
      }

      if (value.length <= 300) {
        return value
      }

      return `${value.slice(0, 300)}...[truncated]`
    }

    function decodeBase64JsonMaybe(value) {
      if (typeof value !== 'string' || value.length === 0) {
        return null
      }

      try {
        const decoded = window.atob(value)
        return JSON.parse(decoded)
      } catch {
        return null
      }
    }

    function sanitize(value, depth = 0) {
      if (depth >= 4) {
        return '[max-depth]'
      }

      if (value == null) {
        return value
      }

      if (typeof value === 'string') {
        return truncateString(value)
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
        return value
      }

      if (Array.isArray(value)) {
        return value.slice(0, 20).map((item) => sanitize(item, depth + 1))
      }

      if (typeof value === 'function') {
        return `[function ${value.name || 'anonymous'}]`
      }

      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: truncateString(value.stack ?? ''),
        }
      }

      if (typeof value === 'object') {
        const output = {}
        Object.keys(value)
          .slice(0, 30)
          .forEach((key) => {
            output[key] = sanitize(value[key], depth + 1)
          })
        return output
      }

      return String(value)
    }

    function summarizeAliyunConfig(config) {
      if (!config || typeof config !== 'object') {
        return null
      }

      return {
        SceneId: config.SceneId ?? null,
        CaptchaType: config.CaptchaType ?? null,
        verifyType: config.verifyType ?? null,
        mode: config.mode ?? null,
        immediate: config.immediate ?? null,
        securityToken: config.securityToken ?? null,
        captchaResult: config.captchaResult ?? null,
        verifyResult: config.verifyResult ?? null,
      }
    }

    function summarizeSignState(sign) {
      if (!sign || typeof sign !== 'object') {
        return null
      }

      const aliParams = sign?.ncParams?.aliParams ?? null

      return {
        operateType: sign.operateType ?? null,
        ifResetNcSlider: sign.ifResetNcSlider ?? null,
        verifcodeCount: sign.verifcodeCount ?? null,
        validateResult: sanitize(sign.validateResult),
        aliParams: aliParams
          ? {
              ...sanitize(aliParams),
              aliAfsTokenDecoded: decodeBase64JsonMaybe(aliParams.aliAfsToken),
            }
          : null,
      }
    }

    function wrapPrototypeMethod(target, methodName, eventName) {
      if (!target || typeof target[methodName] !== 'function' || target[methodName].__captchaProbeWrapped) {
        return
      }

      const original = target[methodName]
      const wrapped = function wrappedPrototypeMethod(...args) {
        push(eventName, {
          args: sanitize(args),
          config: summarizeAliyunConfig(this?.config),
        })
        return original.apply(this, args)
      }
      wrapped.__captchaProbeWrapped = true
      target[methodName] = wrapped
    }

    function wrapAliyunCaptchaCtor(Ctor) {
      if (typeof Ctor !== 'function' || Ctor.__captchaProbeCtorWrapped) {
        return Ctor
      }

      wrapPrototypeMethod(Ctor.prototype, 'onBizSuccess', 'aliyun:onBizSuccess')
      wrapPrototypeMethod(Ctor.prototype, 'onBizFail', 'aliyun:onBizFail')
      wrapPrototypeMethod(Ctor.prototype, 'refresh', 'aliyun:refresh')
      wrapPrototypeMethod(Ctor.prototype, 'show', 'aliyun:show')
      wrapPrototypeMethod(Ctor.prototype, 'hide', 'aliyun:hide')
      Ctor.__captchaProbeCtorWrapped = true
      push('AliyunCaptcha:wrapped', {})
      return Ctor
    }

    function wrapInitAliyunCaptcha(original) {
      if (typeof original !== 'function' || original.__captchaProbeWrapped) {
        return original
      }

      const wrapped = function wrappedInitAliyunCaptcha(config, callback) {
        push('initAliyunCaptcha:called', {
          config: sanitize({
            SceneId: config?.SceneId,
            mode: config?.mode,
            element: config?.element,
            button: config?.button,
            slideStyle: config?.slideStyle,
            hasSuccess: typeof config?.success === 'function',
            hasFail: typeof config?.fail === 'function',
            hasGetInstance: typeof config?.getInstance === 'function',
          }),
        })

        const nextConfig = { ...config }

        if (typeof config?.success === 'function') {
          nextConfig.success = function wrappedBusinessSuccess(...args) {
            push('business:success', {
              args: sanitize(args),
              decodedToken: decodeBase64JsonMaybe(args[0]),
              signState: summarizeSignState(window.g_app?._store?.getState?.()?.sign),
            })
            return config.success.apply(this, args)
          }
        }

        if (typeof config?.fail === 'function') {
          nextConfig.fail = function wrappedBusinessFail(...args) {
            push('business:fail', {
              args: sanitize(args),
              signState: summarizeSignState(window.g_app?._store?.getState?.()?.sign),
            })
            return config.fail.apply(this, args)
          }
        }

        if (typeof config?.getInstance === 'function') {
          nextConfig.getInstance = function wrappedGetInstance(...args) {
            const instance = args[0]
            if (instance && !window.__AliyunCaptchaLast) {
              window.__AliyunCaptchaLast = instance
            }
            push('business:getInstance', {
              hasInstance: Boolean(instance),
              config: summarizeAliyunConfig(instance?.config),
            })
            return config.getInstance.apply(this, args)
          }
        }

        return original.call(this, nextConfig, callback)
      }

      wrapped.__captchaProbeWrapped = true
      return wrapped
    }

    let currentInitAliyunCaptcha
    Object.defineProperty(window, 'initAliyunCaptcha', {
      configurable: true,
      enumerable: true,
      get() {
        return currentInitAliyunCaptcha
      },
      set(value) {
        push('window:initAliyunCaptcha:set', {
          valueType: typeof value,
        })
        currentInitAliyunCaptcha = wrapInitAliyunCaptcha(value)
      },
    })

    let currentAliyunCaptcha
    Object.defineProperty(window, 'AliyunCaptcha', {
      configurable: true,
      enumerable: true,
      get() {
        return currentAliyunCaptcha
      },
      set(value) {
        push('window:AliyunCaptcha:set', {
          valueType: typeof value,
        })
        currentAliyunCaptcha = wrapAliyunCaptchaCtor(value)
      },
    })

    let dispatchWrapped = false
    const storeWrapTimer = window.setInterval(() => {
      const store = window.g_app?._store

      if (!store || typeof store.dispatch !== 'function' || dispatchWrapped) {
        return
      }

      const originalDispatch = store.dispatch.bind(store)
      store.dispatch = function wrappedDispatch(action, ...rest) {
        if (action?.type?.startsWith?.('sign/')) {
          push('store:dispatch', {
            action: sanitize(action),
            beforeSignState: summarizeSignState(store.getState?.()?.sign),
          })
        }

        const result = originalDispatch(action, ...rest)

        if (action?.type?.startsWith?.('sign/')) {
          Promise.resolve().then(() => {
            push('store:after-dispatch', {
              actionType: action.type,
              afterSignState: summarizeSignState(store.getState?.()?.sign),
            })
          })
        }

        return result
      }

      dispatchWrapped = true
      push('store:dispatch-wrapped', {})
      window.clearInterval(storeWrapTimer)
    }, 200)

    window.__captchaProbe = {
      getEvents() {
        return probeEvents.slice()
      },
      getSignState() {
        return summarizeSignState(window.g_app?._store?.getState?.()?.sign)
      },
    }

    push('probe:init', {})
  })
}

async function collectProbeState(page) {
  return page.evaluate(() => {
    return {
      probeEvents: window.__captchaProbe?.getEvents?.() ?? [],
      signState: window.__captchaProbe?.getSignState?.() ?? null,
    }
  })
}

async function main() {
  if (!mobile || !password) {
    throw new Error('Missing PMS_MOBILE or PMS_PASSWORD environment variable.')
  }

  ensureParentDir(logPath)

  const browser = await chromium.connectOverCDP(cdpUrl)
  const rawEvents = []

  try {
    const context = browser.contexts()[0]

    if (!context) {
      throw new Error('No browser context is available through the remote debugging port.')
    }

    const page = await context.newPage()
    await installProbe(page)

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

      if (/captcha-open\.aliyuncs\.com|cloudauth-device-dualstack\.cn-shanghai\.aliyuncs\.com|\/user\/sign-in/i.test(url)) {
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

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.locator('input#mobile:visible').first().fill(mobile)
    await page.locator('input#password:visible').first().fill(password)

    const beforeReadySnapshot = await captureRuntimeSnapshot(page)
    const readyState = await waitForCaptchaReady(page, rawEvents)

    let dragResult = null
    let dragError = null

    if (readyState.ready && shouldAutoDrag) {
      try {
        dragResult = await dragSlider(page)
      } catch (error) {
        dragError = error instanceof Error ? error.message : String(error)
      }
    }

    await page.waitForTimeout(postDragWaitMs)

    const afterDragSnapshot = await captureRuntimeSnapshot(page)
    const afterDragLifecycle = summarizeCaptchaLifecycle(rawEvents)
    const probeState = await collectProbeState(page)

    const result = {
      checkedAt: new Date().toISOString(),
      cdpUrl,
      targetUrl,
      shouldAutoDrag,
      timeoutMs,
      postDragWaitMs,
      beforeReadySnapshot,
      readyState,
      dragResult,
      dragError,
      afterDragSnapshot,
      afterDragLifecycle,
      probeState,
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
