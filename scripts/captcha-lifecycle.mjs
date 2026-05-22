function safeJsonParse(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function parseFormBody(postData) {
  if (typeof postData !== 'string' || postData.length === 0) {
    return new URLSearchParams()
  }

  return new URLSearchParams(postData)
}

function extractStaticPathFromUrl(url) {
  const match = /dynamicJS\/(.+?)\.js/i.exec(url)
  return match ? match[1] : null
}

export function parseCaptchaEvent(rawEvent) {
  const event = {
    kind: 'other',
    url: rawEvent?.url ?? '',
    type: rawEvent?.type ?? null,
    method: rawEvent?.method ?? null,
    status: rawEvent?.status ?? null,
  }

  if (event.url.includes('cloudauth-device-dualstack.cn-shanghai.aliyuncs.com')) {
    const form = parseFormBody(rawEvent?.postData)
    const action = form.get('Action')
    return {
      ...event,
      kind: 'device-log',
      action,
    }
  }

  if (event.url.includes('captcha-open.aliyuncs.com')) {
    if (rawEvent?.type === 'request') {
      const form = parseFormBody(rawEvent?.postData)
      const action = form.get('Action')

      if (action === 'InitCaptchaV3') {
        return {
          ...event,
          kind: 'init-request',
          action,
          sceneId: form.get('SceneId'),
          mode: form.get('Mode'),
          deviceToken: form.get('DeviceToken'),
        }
      }

      if (action === 'UploadLog') {
        const uploadLog = safeJsonParse(form.get('log'))
        const dynamicJsLoaded = uploadLog?.js?.msg === 'DYNAMICJS_LOADED' && uploadLog?.js?.s === true
        return {
          ...event,
          kind: 'upload-log',
          action,
          certifyId: uploadLog?.cId ?? null,
          sceneId: uploadLog?.sId ?? null,
          dynamicJsLoaded,
          uploadLog,
        }
      }

      return {
        ...event,
        kind: 'captcha-open-request',
        action,
      }
    }

    if (rawEvent?.type === 'response') {
      const json = safeJsonParse(rawEvent?.body)

      if (json?.CertifyId || json?.StaticPath || json?.Code === 'Success') {
        return {
          ...event,
          kind: 'init-response',
          certifyId: json?.CertifyId ?? null,
          staticPath: json?.StaticPath ?? null,
          captchaType: json?.CaptchaType ?? null,
          success: json?.Success === true,
          response: json,
        }
      }

      return {
        ...event,
        kind: 'captcha-open-response',
        response: json,
      }
    }
  }

  if (event.url.includes('/captcha-frontend/dynamicJS/')) {
    return {
      ...event,
      kind: rawEvent?.type === 'response' ? 'dynamic-js-response' : 'dynamic-js-request',
      staticPath: extractStaticPathFromUrl(event.url),
    }
  }

  if (event.url.includes('/user/sign-in')) {
    return {
      ...event,
      kind: rawEvent?.type === 'request' ? 'sign-in-request' : 'sign-in-response',
    }
  }

  return event
}

export function summarizeCaptchaLifecycle(rawEvents) {
  const parsedEvents = rawEvents.map(parseCaptchaEvent)
  const summary = {
    parsedEvents,
    hasDeviceLog1: false,
    hasDeviceLog2: false,
    hasDeviceLog3: false,
    hasInitRequest: false,
    hasInitResponse: false,
    hasDynamicJsRequest: false,
    hasDynamicJsResponse: false,
    hasDynamicJsLoadedLog: false,
    hasSignInRequest: false,
    certifyId: null,
    sceneId: null,
    staticPath: null,
    captchaType: null,
    readyEventIndex: -1,
    isReady: false,
  }

  for (let index = 0; index < parsedEvents.length; index += 1) {
    const event = parsedEvents[index]

    if (event.kind === 'device-log') {
      if (event.action === 'Log1') summary.hasDeviceLog1 = true
      if (event.action === 'Log2') summary.hasDeviceLog2 = true
      if (event.action === 'Log3') summary.hasDeviceLog3 = true
    }

    if (event.kind === 'init-request') {
      summary.hasInitRequest = true
      summary.sceneId ??= event.sceneId ?? null
    }

    if (event.kind === 'init-response') {
      summary.hasInitResponse = event.success === true || summary.hasInitResponse
      summary.certifyId ??= event.certifyId ?? null
      summary.staticPath ??= event.staticPath ?? null
      summary.captchaType ??= event.captchaType ?? null
    }

    if (event.kind === 'dynamic-js-request') {
      summary.hasDynamicJsRequest = true
      summary.staticPath ??= event.staticPath ?? null
    }

    if (event.kind === 'dynamic-js-response') {
      summary.hasDynamicJsResponse = true
      summary.staticPath ??= event.staticPath ?? null
    }

    if (event.kind === 'upload-log') {
      summary.hasDynamicJsLoadedLog ||= event.dynamicJsLoaded === true
      summary.certifyId ??= event.certifyId ?? null
      summary.sceneId ??= event.sceneId ?? null
    }

    if (event.kind === 'sign-in-request') {
      summary.hasSignInRequest = true
    }

    if (
      summary.readyEventIndex === -1 &&
      summary.hasInitResponse &&
      (summary.hasDynamicJsResponse || summary.hasDynamicJsLoadedLog)
    ) {
      summary.readyEventIndex = index
    }
  }

  summary.isReady =
    summary.hasInitResponse && (summary.hasDynamicJsResponse || summary.hasDynamicJsLoadedLog)

  return summary
}
