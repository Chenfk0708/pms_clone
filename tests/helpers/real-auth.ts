import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const REAL_AUTH_DEFAULT_BASE_URL = process.env.PMS_TEST_BASE_URL ?? ''
export const REAL_AUTH_DEFAULT_CAMP_ID = '10001'

export type RealSessionOptions = {
  campId?: string
  providers?: Record<string, string>
}

export function appUrl(path: string, baseURL = REAL_AUTH_DEFAULT_BASE_URL) {
  return `${baseURL}${path}`
}

export async function loginViaGateway(
  request: APIRequestContext,
  baseURL = REAL_AUTH_DEFAULT_BASE_URL,
): Promise<string> {
  const response = await request.post(`${baseURL}/api/auth/login`, {
    data: {
      mobile: '13800000001',
      password: 'demo-login',
    },
  })

  expect(response.ok()).toBeTruthy()
  const payload = await response.json()
  expect(payload.code).toBe(0)
  expect(payload.data?.token).toBeTruthy()
  return payload.data.token as string
}

export async function installRealSession(page: Page, token: string, options: RealSessionOptions = {}) {
  await page.addInitScript(
    ({ sessionToken, campId, providers }) => {
      window.localStorage.setItem('pms_token', sessionToken)
      window.localStorage.setItem('pmsCampId', campId)
      window.localStorage.setItem(
        'pms_user',
        JSON.stringify({
          id: '1',
          name: '演示管理员',
          mobile: '13800000001',
          roleName: '平台管理员',
          campName: campId,
        }),
      )
      for (const [key, value] of Object.entries(providers)) {
        window.localStorage.setItem(key, value)
      }
    },
    {
      sessionToken: token,
      campId: options.campId ?? REAL_AUTH_DEFAULT_CAMP_ID,
      providers: options.providers ?? {},
    },
  )
}
