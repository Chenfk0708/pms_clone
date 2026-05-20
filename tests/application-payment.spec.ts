import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL
const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|待接入|阻塞|后端未就绪|后端接口未完成/i

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/version/applicationPayment loads through explicit provider contract', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/applicationPayment'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.application-payment-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.application-payment-page')).toHaveAttribute('data-request-category', 'all')
  await expect(page.locator('.application-payment-page')).toHaveAttribute('data-request-mock-state', 'success')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await expect(page.getByRole('navigation', { name: '应用订阅侧栏' })).toContainText(
    ['我的权益', '置换权益', '版本订阅', '应用订阅', '路客商城'].join(''),
  )
  await expect(page.getByRole('navigation', { name: '应用订阅侧栏' }).getByRole('link', { name: '应用订阅' })).toHaveClass(/is-active/)

  await expect(page.getByRole('tablist', { name: '应用订阅分类' }).getByRole('tab', { name: '全部' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('region', { name: '渠道直连' })).toContainText('携程直连')
  await expect(page.getByRole('region', { name: '渠道直连' })).toContainText('抖音直连')
  await expect(page.getByRole('region', { name: '功能订阅' })).toContainText('企微SCRM')
  await expect(page.getByRole('region', { name: '功能订阅' })).toContainText('全域雷达')
  await expect(page.getByLabel('应用订阅数据服务')).toContainText('/edition/resource/get')
  await expect(page.getByLabel('应用订阅数据服务')).toContainText('/paymentWays/get')
})

test('/version/applicationPayment filters cards and coordinates use and subscribe actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/applicationPayment'))

  await page.getByRole('tab', { name: '功能订阅' }).click()
  await expect(page.locator('.application-payment-page')).toHaveAttribute('data-request-category', 'feature')
  await expect(page.getByRole('region', { name: '渠道直连' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '功能订阅' })).toContainText('线上付款')

  await page.getByRole('button', { name: '去使用 线上付款' }).click()
  await expect(page).toHaveURL(/\/statistics\/orderLedger$/)

  await page.goto(appUrl('/version/applicationPayment'))
  await page.getByRole('button', { name: '订阅开通 抖音直连' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail\?app=douyin$/)
  await expect(page.locator('.application-payment-detail-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByRole('heading', { name: '抖音直连' })).toBeVisible()
  await expect(page.getByLabel('购买信息')).toContainText('¥36,678.6')
  await expect(page.getByRole('button', { name: '立即购买' })).toBeDisabled()

  await page.getByLabel('我已阅读并同意《路客云产品服务购买协议》').check()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeEnabled()
})

test('/version/applicationPayment renders empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/version/applicationPayment?applicationPaymentMockState=empty'))
  await expect(page.getByRole('status', { name: '应用订阅操作反馈' })).toContainText('暂无可展示的应用订阅商品')
  await expect(page.getByLabel('应用订阅空状态')).toContainText('当前条件下暂无应用订阅商品')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await page.goto(appUrl('/version/applicationPayment?applicationPaymentMockState=error'))
  await expect(page.getByRole('alert', { name: '应用订阅数据错误' })).toContainText('应用订阅数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})

test('/version/applicationPayment/detail preserves existing SCRM detail handoff', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/addBatch'))

  await page.getByRole('button', { name: '立即开通' }).click()

  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.locator('.application-payment-detail-page')).toHaveAttribute('data-product-id', 'scrm')
  await expect(page.getByRole('heading', { name: '企微SCRM' })).toBeVisible()
  await expect(page.getByLabel('商品详情')).toContainText('企业微信')
  await expect(page.getByLabel('购买信息')).toContainText('¥150.6')
  await expect(page.getByRole('button', { name: '立即购买' })).toBeVisible()
})
