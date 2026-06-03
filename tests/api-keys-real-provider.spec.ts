import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const pagePath = '/CompanySetting/Apikeys'

function appUrl(routePath: string) {
  const normalizedPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalizedPath}` : normalizedPath
}

test('/CompanySetting/Apikeys api provider adapts real get and generate contracts', async ({ page }) => {
  const requests: Array<{ path: string; body: Record<string, unknown> }> = []

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'api-keys-contract-token')
    window.localStorage.setItem('pms.apiKeys.provider', 'api')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.removeItem('pms.apiKeys.lastRequest')
  })

  await page.route('**/api/user/secret/get', async (route) => {
    requests.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() as Record<string, unknown> })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        success: true,
        traceId: 'api-keys-get-001',
        timestamp: '2026-06-01T12:30:00+08:00',
        data: {
          keyRecord: null,
          activityLog: [],
        },
      },
    })
  })

  await page.route('**/api/user/secret/generate', async (route) => {
    requests.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() as Record<string, unknown> })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        success: true,
        traceId: 'api-keys-generate-001',
        timestamp: '2026-06-01T12:31:00+08:00',
        data: {
          keyRecord: {
            appId: 'locals-ai-10001-20260601',
            accessKeyId: 'ak_local_20260601123100_abcdef',
            secretKeyPreview: 'sk_local_20260601123100_****************',
            createdAt: '2026-06-01 12:31',
            lastUsedAt: '尚未使用',
            rotationTip: '建议在 90 天内完成轮换',
            status: 'active',
            scopes: ['Locals AI 服务端接入', '推理调用鉴权'],
          },
          activityLog: [
            {
              id: 'api-keys-activity-1',
              title: 'API Key 已生成',
              detail: '当前凭证状态正常，可用于 Locals AI 服务端接入。',
              occurredAt: '2026-06-01 12:31',
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl(pagePath))

  await expect(page.getByTestId('api-keys-service-contract')).toContainText('"provider": "api"', { timeout: 15_000 })
  await expect(page.getByTestId('api-keys-service-contract')).toContainText('"state": "empty"')
  await expect(page.getByText('暂未生成路客云API keys')).toBeVisible()

  await page.getByRole('button', { name: '获取API keys' }).click()
  await expect(page.getByTestId('api-keys-access-key-id')).toContainText('ak_local_20260601123100_abcdef', { timeout: 15_000 })
  await expect(page.getByTestId('api-keys-service-contract')).toContainText('"action": "generate"')
  await expect(page.getByTestId('api-keys-service-contract')).toContainText('api-keys-generate-001')

  expect(requests).toEqual(
    expect.arrayContaining([
      { path: '/api/user/secret/get', body: { campId: '10001' } },
      { path: '/api/user/secret/generate', body: { campId: '10001' } },
    ]),
  )
})
