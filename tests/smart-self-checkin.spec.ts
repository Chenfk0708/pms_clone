import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartHome matches managed self check-in dashboard state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '自助入住' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '智能硬件', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '公安对接', exact: true })).toBeVisible()

  await expect(page.locator('.smart-checkin-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByRole('heading', { name: '云端入住登记', level: 1 })).toBeVisible()
  await expect(page.getByText('房客在到店前，通过短信完成入住相关操作。')).toBeVisible()
  await expect(page.getByLabel('自助入住操作反馈')).toContainText('自助入住数据已加载')
  await expect(page.getByLabel('云端入住登记开关')).toHaveAttribute('aria-pressed', 'true')

  const plans = page.getByLabel('云端入住登记方式').locator('.smart-checkin-plan')
  await expect(plans).toHaveCount(4)
  await expect(plans.nth(0)).toContainText('仅发送门锁密码（直接入住）')
  await expect(plans.nth(1)).toContainText('短信 + 智住小程序（自助登记）')
  await expect(plans.nth(1)).toContainText('推荐')
  await expect(plans.nth(2)).toContainText('未开通')

  await expect(page.getByRole('heading', { name: '场景流程' })).toBeVisible()
  await expect(page.getByRole('button', { name: '编辑短信内容' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '前台数字化（扫码）' })).toBeVisible()
  await expect(page.getByRole('button', { name: '下载二维码' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '自助机入住' })).toBeVisible()
  await expect(page.getByRole('button', { name: '联系智慧酒店专家' })).toBeVisible()

  await expect(page.getByRole('heading', { name: '相关入口' })).toBeVisible()
  await expect(page.getByRole('button', { name: '全局设置', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '智住小程序' })).toBeVisible()
  await expect(page.getByRole('button', { name: '智能门锁' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'PSB 公安对接' })).toBeVisible()
})

test('/smartHotel/smartHome supports message, purchase, and routing interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome'))

  const switchButton = page.getByLabel('云端入住登记开关')
  await switchButton.click()
  await expect(switchButton).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByLabel('自助入住操作反馈')).toContainText('云端入住登记已关闭')

  await page.getByRole('button', { name: '编辑短信内容' }).click()
  const editor = page.getByRole('dialog', { name: '编辑短信内容' })
  await expect(editor).toBeVisible()
  const firstTextarea = editor.locator('textarea').first()
  await firstTextarea.fill('【路客云】请先完成线上登记，再获取门锁密码。')
  await page.getByRole('button', { name: '保存模板' }).click()
  await expect(editor).toHaveCount(0)
  await expect(page.getByLabel('自助入住操作反馈')).toContainText('短信模板已更新')
  await expect(page.locator('.smart-checkin-plan').first()).toContainText('【路客云】请先完成线上登记，再获取门锁密码。')

  await page.getByRole('button', { name: '未开通' }).first().click()
  const purchaseDialog = page.getByRole('dialog', { name: '付费购买' })
  await expect(purchaseDialog).toBeVisible()
  await page.getByRole('button', { name: '联系专家' }).click()
  const expertDialog = page.getByRole('dialog', { name: '智慧酒店专家' })
  await expect(expertDialog).toBeVisible()
  await page.getByRole('button', { name: '稍后处理' }).click()
  await expect(expertDialog).toHaveCount(0)
  await expect(page.getByLabel('自助入住操作反馈')).toContainText('创建购买咨询')

  await page.getByRole('button', { name: '下载二维码' }).click()
  await expect(page.getByLabel('自助入住操作反馈')).toContainText('二维码下载任务已创建')

  await page.getByRole('button', { name: '全局设置', exact: true }).click()
  await expect(page).toHaveURL(/\/smartHotel\/checkInGuide$/)
})

test('/smartHotel/smartHome keeps business shell in empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome?mockState=empty'))

  await expect(page.locator('.smart-checkin-page')).toHaveAttribute('data-empty', 'true')
  await expect(page.getByLabel('自助入住空状态')).toContainText('当前暂无可发布的自助入住方案')
  await expect(page.getByLabel('自助入住空状态').getByRole('button', { name: '前往全局设置' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '前台数字化（扫码）' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '相关入口' })).toBeVisible()
})

test('/smartHotel/smartHome exposes retryable error state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome?mockState=error'))

  await expect(page.getByRole('alert', { name: '自助入住加载失败' })).toContainText('自助入住加载失败，请稍后重试')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHome$/)
  await expect(page.getByRole('heading', { name: '云端入住登记', level: 1 })).toBeVisible()
})
