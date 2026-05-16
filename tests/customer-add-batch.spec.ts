import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/customer/addBatch matches captured SCRM batch add-friend unpaid state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/addBatch'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '批量加好友' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '企微SCRM-批量加好友', level: 1 })).toBeVisible()
  await expect(
    page.getByText('客户下单后获取到客户手机号，若该手机号未添加企业微信客户，则可下发添加好友短信，引导客户通过短信添加企业微信。'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '立即开通' })).toBeVisible()
  await expect(page.getByText('限时免费')).toBeVisible()
  await expect(page.getByText('商品详情')).toBeVisible()
  await expect(page.getByRole('img', { name: '企微SCRM高效获客留存' })).toBeVisible()
  await expect(page.locator('.customer-add-batch-hero')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
})

test('/customer/addBatch opens captured SCRM application payment detail', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/addBatch'))

  await page.getByRole('button', { name: '立即开通' }).click()

  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '企微SCRM', level: 2 })).toBeVisible()
  await expect(
    page.getByText('利用企业微信高效工具完成入住前、入住中、入住后的全入住流程体验升级，在企业微信中智能接待，高效沟通；'),
  ).toBeVisible()
  await expect(page.getByText('商品详情')).toBeVisible()
  await expect(page.getByText('购买信息')).toBeVisible()
  await expect(page.getByText('商品价格')).toBeVisible()
  await expect(page.getByText('¥150.6').first()).toBeVisible()
  await expect(page.getByText('¥75,300/年')).toBeVisible()
  await expect(page.getByText('跟随版本2027-09-28到期')).toHaveCount(2)
  await expect(page.getByText('订单金额')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeVisible()
  await page.getByLabel('我已阅读并同意《路客云产品服务购买协议》').check()
  await expect(page.getByLabel('我已阅读并同意《路客云产品服务购买协议》')).toBeChecked()
})
