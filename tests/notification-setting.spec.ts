import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  if (appBaseURL) {
    return `${appBaseURL.replace(/\/$/, '')}/#${routePath}`
  }

  return `/#${routePath}`
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.notificationSetting.provider', 'mock')
    window.localStorage.removeItem('pms.notificationSetting.mockState')
    if (!window.localStorage.getItem('pms_token')) {
      window.localStorage.setItem('pms_token', 'notification-setting-test-token')
    }
  })
  await page.setViewportSize({ width: 1440, height: 900 })
})

test('/setting/wechatPushSetting renders notification setting through the service contract', async ({ page }) => {
  await page.goto(appUrl('/setting/wechatPushSetting'))

  const contract = page.getByTestId('notification-setting-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-response-state', 'success')
  await expect(contract).toHaveAttribute('data-endpoint', '/setting/wechatPushSetting/bootstrap')

  await expect(page.locator('.notification-page')).toBeVisible()
  await expect(page.locator('.notification-page__hero')).toBeVisible()
  await expect(page.locator('.notification-page__table')).toBeVisible()
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '通知设置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '我已关注？' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新一下' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查看接受微信通知公众号' })).toBeVisible()
  await expect(page.getByLabel('路客云微信公众号二维码')).toBeVisible()
  await expect(page.getByText('扫码关注公众号【路客云】，快速通过微信推送订单、房态')).toBeVisible()

  await expect(page.getByText('PC\\APP推送')).toBeVisible()
  await expect(page.getByText('（请先扫码关注公众号）')).toBeVisible()
  await expect(page.getByRole('switch')).toHaveCount(9)
  await expect(page.getByRole('switch', { name: 'PC\\APP推送 总开关' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('switch', { name: '公众号推送 总开关' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('switch', { name: '订单通知 PC\\APP推送' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('switch', { name: '订单通知 公众号推送' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('switch', { name: 'IM消息通知 PC\\APP推送' })).toHaveAttribute('aria-checked', 'true')
})

test('/setting/wechatPushSetting supports refresh, channel dialog, and switch feedback', async ({ page }) => {
  await page.goto(appUrl('/setting/wechatPushSetting'))

  await page.getByRole('button', { name: '查看接受微信通知公众号' }).click()
  await expect(page.getByRole('dialog', { name: '接受微信通知公众号' })).toBeVisible()
  await expect(page.getByText('当前暂无已关注公众号，请扫码关注后刷新状态。')).toBeVisible()
  await page.getByRole('button', { name: '关闭公众号详情' }).click()
  await expect(page.getByRole('dialog', { name: '接受微信通知公众号' })).toHaveCount(0)

  await page.getByRole('button', { name: '我已关注？' }).click()
  await expect(page.getByRole('status')).toContainText('已刷新关注状态')

  const pcMasterSwitch = page.getByRole('switch', { name: 'PC\\APP推送 总开关' })
  await pcMasterSwitch.click()
  await expect(pcMasterSwitch).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('switch', { name: '订单通知 PC\\APP推送' })).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('switch', { name: '门店动态 PC\\APP推送' })).toHaveAttribute('aria-checked', 'false')

  const firstWechatSwitch = page.getByRole('switch', { name: '订单通知 公众号推送' })
  await firstWechatSwitch.click()
  await expect(firstWechatSwitch).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('status')).toContainText('订单通知')
})

test('/setting/wechatPushSetting renders the empty state without collapsing the layout', async ({ page }) => {
  await page.goto(appUrl('/setting/wechatPushSetting?mockState=empty'))

  const contract = page.getByTestId('notification-setting-service-contract')
  await expect(contract).toHaveAttribute('data-response-state', 'empty')
  await expect(page.locator('.notification-page')).toBeVisible()
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.getByText('当前暂无可配置的通知项')).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新一下' })).toBeVisible()
  await expect(page.getByText('订单通知')).toHaveCount(0)
})

test('/setting/wechatPushSetting exposes the error state and supports retry', async ({ page }) => {
  await page.goto(appUrl('/setting/wechatPushSetting?mockState=error'))

  const contract = page.getByTestId('notification-setting-service-contract')
  await expect(contract).toHaveAttribute('data-response-state', 'error')
  await expect(page.getByRole('heading', { name: '通知设置加载失败，请稍后重试' })).toBeVisible()

  await page.getByRole('button', { name: '重新加载通知设置' }).click()
  await expect(contract).toHaveAttribute('data-response-state', 'success')
  await expect(page.getByText('订单通知')).toBeVisible()
})

test('/setting/wechatPushSetting real provider sends gateway auth header and persists notification excludes', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'crm-authority-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  const listRequests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []
  const excludeRequests: Array<{ method: string; headers: Record<string, string>; body: Record<string, unknown> }> = []
  let orderPcExcluded = false

  await page.route('**/api/userAuthority/notification/get', async (route) => {
    listRequests.push({
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })

    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-crm-authority-list-trace-001',
        timestamp: '2026-05-30T10:00:00+08:00',
        data: {
          modules: [
            {
              moduleName: 'CRM通知',
              items: [
                {
                  authorityId: '43001',
                  authorityName: '订单通知',
                  authorityCode: 'notification.pcApp.order',
                  excluded: orderPcExcluded,
                },
                {
                  authorityId: '43002',
                  authorityName: '订单通知',
                  authorityCode: 'notification.wechat.order',
                  excluded: false,
                },
                {
                  authorityId: '43003',
                  authorityName: '门店预警',
                  authorityCode: 'notification.pcApp.storeAlert',
                  excluded: false,
                },
                {
                  authorityId: '43004',
                  authorityName: '门店预警',
                  authorityCode: 'notification.wechat.storeAlert',
                  excluded: true,
                },
                {
                  authorityId: '43005',
                  authorityName: '门店动态',
                  authorityCode: 'notification.pcApp.storeUpdate',
                  excluded: false,
                },
                {
                  authorityId: '43006',
                  authorityName: '门店动态',
                  authorityCode: 'notification.wechat.storeUpdate',
                  excluded: false,
                },
                {
                  authorityId: '43007',
                  authorityName: 'IM消息通知',
                  authorityCode: 'notification.pcApp.im',
                  excluded: false,
                },
              ],
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/userAuthority/exclude', async (route) => {
    const body = (route.request().postDataJSON() as Record<string, unknown>) ?? {}
    excludeRequests.push({
      method: route.request().method(),
      headers: route.request().headers(),
      body,
    })
    orderPcExcluded = route.request().method() !== 'DELETE'
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-crm-authority-exclude-trace-001',
        timestamp: '2026-05-30T10:00:00+08:00',
        data: true,
      },
    })
  })

  await page.goto(appUrl('/setting/wechatPushSetting?provider=api'))

  const contract = page.getByTestId('notification-setting-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'api')
  await expect(contract).toHaveAttribute('data-response-state', 'success')
  await expect(contract).toHaveAttribute('data-endpoint', '/userAuthority/notification/get')

  await expect(page.getByRole('switch', { name: '订单通知 PC\\APP推送' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('switch', { name: '门店预警 公众号推送' })).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('switch')).toHaveCount(9)

  await page.getByRole('switch', { name: '订单通知 PC\\APP推送' }).click()
  await expect(page.getByRole('switch', { name: '订单通知 PC\\APP推送' })).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('status')).toContainText('订单通知')

  expect(listRequests.length).toBeGreaterThanOrEqual(2)
  expect(excludeRequests).toHaveLength(1)
  expect(listRequests[0].headers.authorization).toBe('Bearer crm-authority-token')
  expect(excludeRequests[0].headers.authorization).toBe('Bearer crm-authority-token')
  expect(listRequests[0].body).toMatchObject({ campId: '10001' })
  expect(excludeRequests[0]).toMatchObject({
    method: 'POST',
    body: {
      campId: '10001',
      authorityIds: ['43001'],
    },
  })
})
