import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.notificationSetting.provider')
    window.localStorage.removeItem('pms.notificationSetting.mockState')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
})

test('/setting/wechatPushSetting renders notification setting through the service contract', async ({ page }) => {
  await page.goto(appUrl('/setting/wechatPushSetting'))

  const contract = page.getByTestId('notification-setting-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-response-state', 'success')
  await expect(contract).toHaveAttribute('data-endpoint', '/setting/wechatPushSetting/bootstrap')

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '通知设置', exact: true })).toHaveClass(/is-active/)
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
  await expect(page.getByText('当前暂无已关注公众号，请扫码关注后刷新状态')).toBeVisible()
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
  await expect(page.getByText('当前暂无可配置的通知项')).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新一下' })).toBeVisible()
  await expect(page.getByText('订单通知')).toHaveCount(0)
})

test('/setting/wechatPushSetting exposes the error state and supports retry', async ({ page }) => {
  await page.goto(appUrl('/setting/wechatPushSetting?mockState=error'))

  const contract = page.getByTestId('notification-setting-service-contract')
  await expect(contract).toHaveAttribute('data-response-state', 'error')
  await expect(page.getByText('通知设置加载失败，请稍后重试')).toBeVisible()

  await page.getByRole('button', { name: '重新加载通知设置' }).click()
  await expect(contract).toHaveAttribute('data-response-state', 'success')
  await expect(page.getByText('订单通知')).toBeVisible()
})
