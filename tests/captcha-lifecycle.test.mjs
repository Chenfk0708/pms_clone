import test from 'node:test'
import assert from 'node:assert/strict'

import {
  parseCaptchaEvent,
  summarizeCaptchaLifecycle,
} from '../scripts/captcha-lifecycle.mjs'

test('summarizeCaptchaLifecycle marks ready after init and dynamic JS load', () => {
  const events = [
    {
      type: 'request',
      url: 'https://x0xnm7.captcha-open.aliyuncs.com/',
      postData:
        'Action=InitCaptchaV3&SceneId=m9m5hmjm&Mode=embed&DeviceToken=device-token-1',
    },
    {
      type: 'response',
      url: 'https://x0xnm7.captcha-open.aliyuncs.com/',
      status: 200,
      body: JSON.stringify({
        CertifyId: 'pdKjdbzpMy',
        StaticPath: '3.25.1/sg.048.088a48bd1b514225',
        CaptchaType: 'SLIDING',
        Success: true,
      }),
    },
    {
      type: 'response',
      url: 'https://g.alicdn.com/captcha-frontend/dynamicJS/3.25.1/sg.048.088a48bd1b514225.js',
      status: 200,
      body: '/* dynamic js */',
    },
    {
      type: 'request',
      url: 'https://x0xnm7.captcha-open.aliyuncs.com/',
      postData: `Action=UploadLog&log=${encodeURIComponent(
        JSON.stringify({
          mInit: { s: true, msg: 'INIT_SUCCESS', rt: 236 },
          js: { s: true, msg: 'DYNAMICJS_LOADED', rt: 88 },
          cId: 'pdKjdbzpMy',
          sId: 'm9m5hmjm',
        }),
      )}`,
    },
  ]

  const summary = summarizeCaptchaLifecycle(events)

  assert.equal(summary.isReady, true)
  assert.equal(summary.certifyId, 'pdKjdbzpMy')
  assert.equal(summary.sceneId, 'm9m5hmjm')
  assert.equal(summary.staticPath, '3.25.1/sg.048.088a48bd1b514225')
  assert.equal(summary.hasInitRequest, true)
  assert.equal(summary.hasInitResponse, true)
  assert.equal(summary.hasDynamicJsResponse, true)
  assert.equal(summary.hasDynamicJsLoadedLog, true)
})

test('summarizeCaptchaLifecycle stays not ready before dynamic JS stage', () => {
  const events = [
    {
      type: 'request',
      url: 'https://x0xnm7.captcha-open.aliyuncs.com/',
      postData: 'Action=InitCaptchaV3&SceneId=m9m5hmjm&Mode=embed',
    },
    {
      type: 'response',
      url: 'https://x0xnm7.captcha-open.aliyuncs.com/',
      status: 200,
      body: JSON.stringify({
        CertifyId: 'only-init',
        StaticPath: '3.25.1/sg.048.088a48bd1b514225',
        CaptchaType: 'SLIDING',
        Success: true,
      }),
    },
  ]

  const summary = summarizeCaptchaLifecycle(events)

  assert.equal(summary.isReady, false)
  assert.equal(summary.hasInitResponse, true)
  assert.equal(summary.hasDynamicJsResponse, false)
  assert.equal(summary.hasDynamicJsLoadedLog, false)
})

test('parseCaptchaEvent extracts UploadLog dynamic JS marker', () => {
  const event = parseCaptchaEvent({
    type: 'request',
    url: 'https://x0xnm7.captcha-open.aliyuncs.com/',
    postData: `Action=UploadLog&log=${encodeURIComponent(
      JSON.stringify({
        js: { s: true, msg: 'DYNAMICJS_LOADED', rt: 88 },
        cId: 'cid-1',
      }),
    )}`,
  })

  assert.equal(event.kind, 'upload-log')
  assert.equal(event.dynamicJsLoaded, true)
  assert.equal(event.certifyId, 'cid-1')
})
