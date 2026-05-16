import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/wechatService/receptionConfig renders captured reception config unpaid state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/wechatService/receptionConfig'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '接待配置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '企微SCRM-接待配置' })).toBeVisible()
  await expect(
    page.getByText('配置企业微信接待员工、客户备注与欢迎语等，与微信客服能力配合完成客户进线后的接待体验。'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '立即开通' })).toBeVisible()
  await expect(page.getByText('限时免费')).toBeVisible()
  await expect(page.getByText('商品详情')).toBeVisible()
  await expect(page.locator('.chat-dock')).toBeVisible()
})

test('/scrm/wechatService/receptionConfig opens subscription detail from primary action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/wechatService/receptionConfig'))

  await page.getByRole('button', { name: '立即开通' }).click()

  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '企微SCRM', level: 2 })).toBeVisible()
})
