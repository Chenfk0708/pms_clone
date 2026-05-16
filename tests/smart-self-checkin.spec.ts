import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartHome matches captured self check-in default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '云端入住登记', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '自助入住' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '全局设置' })).toBeVisible()
  await expect(page.getByRole('link', { name: '智住小程序' })).toBeVisible()
  await page.locator('.sidebar').getByRole('button', { name: '智能硬件' }).click()
  await expect(page.getByRole('link', { name: '智能硬件商城' })).toBeVisible()
  await page.locator('.sidebar').getByRole('button', { name: '公安对接' }).click()
  await expect(page.getByRole('link', { name: 'PSB公安对接' })).toBeVisible()

  await expect(page.getByText('房客在到店前，通过短信完成入住相关操作')).toBeVisible()
  await expect(page.getByLabel('云端入住登记开关')).toBeVisible()

  const plans = page.getByLabel('云端入住登记方式').locator('.smart-checkin-plan')
  await expect(plans).toHaveCount(4)
  await expect(plans.nth(0)).toContainText('仅发送门锁密码(直接入住)')
  await expect(plans.nth(0)).toContainText('门锁密码：{密码}#')
  await expect(plans.nth(1)).toContainText('短信+智住小程序(自助登记)')
  await expect(plans.nth(1)).toContainText('推荐')
  await expect(plans.nth(2)).toContainText('短信+企微客服(人工接待)')
  await expect(plans.nth(2)).toContainText('未开通')
  await expect(plans.nth(3)).toContainText('短信+公众号(自助登记)')
  await expect(plans.nth(3)).toContainText('未开通')

  await expect(page.getByRole('heading', { name: '场景流程' })).toBeVisible()
  const flow = page.locator('.smart-checkin-flow')
  await expect(flow.getByText('1', { exact: true })).toBeVisible()
  await expect(flow.getByText('接收短信')).toBeVisible()
  await expect(flow.getByText('2', { exact: true })).toBeVisible()
  await expect(flow.getByText('查看门锁密码')).toBeVisible()
  await expect(page.getByRole('button', { name: '编辑短信内容' })).toBeVisible()

  await expect(page.getByRole('heading', { name: '前台数字化（扫码）' })).toBeVisible()
  await expect(page.getByRole('button', { name: '下载二维码' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '自助机入住' })).toBeVisible()
  await expect(page.getByRole('button', { name: '联系智慧酒店专家' })).toBeVisible()
})

test('/smartHotel/smartHome supports captured paid feature and settings interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome'))

  await page.getByRole('button', { name: '未开通', exact: true }).first().click()
  const purchaseDialog = page.getByRole('dialog', { name: '付费购买' })
  await expect(purchaseDialog).toBeVisible()
  await expect(purchaseDialog).toContainText('此功能需要付费使用，请前往购买')
  await expect(page.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(page.getByRole('button', { name: '确 定' })).toBeVisible()
  await page.getByRole('button', { name: '取 消' }).click()
  await expect(purchaseDialog).toHaveCount(0)

  await page.getByRole('link', { name: '全局设置' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/checkInGuide$/)
})
