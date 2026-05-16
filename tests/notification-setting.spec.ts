import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/wechatPushSetting matches captured notification setting baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/wechatPushSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '通知设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByLabel('路客云微信公众号二维码')).toBeVisible()
  await expect(page.getByText('扫码关注公众号【路客云】，快速通过微信推送订单、房态')).toBeVisible()
  await expect(page.getByRole('link', { name: '查看接受微信通知公众号' })).toBeVisible()
  await expect(page.getByRole('button', { name: '我已关注？' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新一下' })).toBeVisible()
  await expect(page.getByRole('table', { name: '通知设置表' })).toContainText('PC\\APP推送')
  await expect(page.getByRole('table', { name: '通知设置表' })).toContainText('（请先扫码关注公众号）')

  await expect(page.getByText('订单通知')).toBeVisible()
  await expect(page.getByText('新订单/取消订单/待接单/退款申请等提醒；')).toBeVisible()
  await expect(page.getByText('门店预警')).toBeVisible()
  await expect(page.getByText('渠道账号过期/渠道账号即将过期/退款失败/渠道房源关联异常/房态房价同步渠道失败/重单等提醒；')).toBeVisible()
  await expect(page.getByText('门店动态')).toBeVisible()
  await expect(page.getByText('人员变更/自定义设置变更/交接班等提醒')).toBeVisible()
  await expect(page.getByText('IM消息通知')).toBeVisible()
  await expect(page.getByText('有新IM会话消息时，有小红点和系统弹框提醒')).toBeVisible()
  await expect(page.getByRole('switch')).toHaveCount(7)
  await expect(page.locator('.chat-dock')).toBeVisible()
})

test('/setting/wechatPushSetting supports captured refresh, switch, and chat interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/wechatPushSetting'))

  await page.getByRole('button', { name: '刷新一下' }).click()
  await expect(page.getByRole('status')).toContainText('已刷新关注状态')

  const firstSwitch = page.getByRole('switch', { name: '订单通知 PC APP推送' })
  await expect(firstSwitch).toHaveAttribute('aria-checked', 'true')
  await firstSwitch.click()
  await expect(firstSwitch).toHaveAttribute('aria-checked', 'false')
  await firstSwitch.click()
  await expect(firstSwitch).toHaveAttribute('aria-checked', 'true')

  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
  await page.locator('.chat-dock-launcher').click()
  await expect(page.locator('.chat-dock')).toBeVisible()
})
