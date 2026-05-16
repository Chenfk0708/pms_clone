import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/balanceAndTemplate matches captured SMS setting baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/balanceAndTemplate'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '短信设置' })).toHaveClass(/is-active/)

  const panel = page.getByLabel('短信设置')
  await expect(panel.getByText('剩余短信：')).toBeVisible()
  await expect(panel.getByText('50')).toBeVisible()
  await expect(panel.getByRole('button', { name: '充 值' })).toBeVisible()
  await expect(panel.getByRole('button', { name: '充值记录' })).toBeVisible()
  await expect(panel.getByText('启用短信推送模版后，系统将在预设条件下自动向客人发送短信通知')).toBeVisible()
  await expect(panel.getByText('启用渠道:')).toBeVisible()
  await expect(panel.getByText('签名：')).toBeVisible()
  await expect(panel.getByText('【路客云】', { exact: true })).toBeVisible()

  await expect(panel.getByRole('heading', { name: '订单状态通知' })).toBeVisible()
  await expect(panel.getByText('订单状态变更时，系统自动通知房客')).toBeVisible()
  await expect(panel.getByText('预订提醒')).toBeVisible()
  await expect(panel.getByText('订单取消')).toBeVisible()
  await expect(panel.getByText('入住提醒')).toBeVisible()
  await expect(panel.getByRole('heading', { name: '长租订单费用提醒' })).toBeVisible()
  await expect(panel.getByText('长租催收短信')).toBeVisible()
  await expect(panel.getByText('每月租金提醒')).toBeVisible()
  await expect(panel.getByRole('heading', { name: '商城订单提醒' })).toBeVisible()
  await expect(panel.getByText('商城商品购买')).toBeVisible()
  await expect(panel.getByText('商城商品过期')).toBeVisible()
  await expect(panel.getByRole('heading', { name: '自助入住短信' })).toBeVisible()
  await expect(panel.getByRole('button', { name: '去设置' })).toBeVisible()
  await expect(panel.getByText('获得密码（智能入住）')).toBeVisible()
  await expect(panel.getByText('实名登记（智能入住）')).toBeVisible()
  await expect(panel.getByText('智住发送入住登记短信(微信公众号)')).toBeVisible()
  await expect(panel.getByText('智住发送入住登记短信(企微)')).toBeVisible()
  await expect(panel.getByRole('heading', { name: '门锁密码通知' })).toBeVisible()
  await expect(panel.getByText('门锁临时密码超时提示')).toBeVisible()
  await expect(panel.getByRole('heading', { name: '其他短信通知' })).toBeVisible()
  await expect(panel.getByText('企微批量加好友')).toBeVisible()
  await expect(page.locator('.chat-dock')).toBeVisible()
})

test('/setting/balanceAndTemplate supports captured recharge and smart-setting interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/balanceAndTemplate'))

  await page.getByRole('button', { name: '充 值' }).click()
  const dialog = page.getByRole('dialog', { name: '短信充值' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('100条')).toBeVisible()
  await expect(dialog.getByText('0.08元/条')).toBeVisible()
  await expect(dialog.getByText('¥8')).toBeVisible()
  await expect(dialog.getByText('15000条')).toBeVisible()
  await expect(dialog.getByText('¥750')).toBeVisible()
  await dialog.getByRole('button', { name: '取 消' }).click()
  await expect(dialog).toHaveCount(0)

  await page.getByRole('button', { name: '去设置' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/checkInGuide$/)
})
