import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/presale matches captured presale sales dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/presale'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '预售券销售统计' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '预售券核销明细' })).toBeVisible()

  const pageRoot = page.getByLabel('预售券销售统计')
  await expect(pageRoot.getByRole('heading', { name: '经营指标' })).toBeVisible()
  await expect(pageRoot.getByRole('button', { name: '查看明细数据>' })).toBeVisible()

  const metrics = page.getByLabel('预售券经营指标')
  await expect(metrics).toContainText('预售券总交易额：')
  await expect(metrics).toContainText('房券交易额：')
  await expect(metrics).toContainText('门票券交易额：')
  await expect(metrics).toContainText('餐饮券交易额：')
  await expect(metrics).toContainText('套餐交易额：')
  await expect(metrics).toContainText('总订单数：')
  await expect(metrics).toContainText('核销金额：')
  await expect(metrics).toContainText('退款金额：')

  const trend = page.getByLabel('增长趋势分析')
  await expect(trend.getByRole('button', { name: '交易额' })).toHaveClass(/is-active/)
  await expect(trend.getByRole('button', { name: '订单数' })).toBeVisible()
  await expect(trend).toContainText('预售券总交易额')
  await expect(trend).toContainText('房券交易额')
  await expect(trend).toContainText('门票券交易额')
  await expect(trend).toContainText('餐饮业券交易额')
  await expect(trend).toContainText('套餐券交易额')
  await expect(trend).toContainText('暂无数据')

  await expect(page.getByLabel('小程序订单来源分析')).toContainText('暂无数据')
})

test('/statistics/presale exposes captured detail-data navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/presale'))

  await page.getByRole('button', { name: '查看明细数据>' }).click()
  await expect(page).toHaveURL(/\/statistics\/preSaleCouponMall$/)
})
