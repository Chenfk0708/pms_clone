import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/statementOrder uses the statement order service contract in the default success state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/statementOrder'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('nav[aria-label="顶部导航"] a.topnav-link.is-active')).toContainText('报表')
  await expect(page.locator('.sidebar-link.is-active')).toContainText('品牌小程序订单')

  const filters = page.getByLabel('品牌小程序订单筛选')
  await expect(filters).toContainText('全部门店')
  await expect(filters).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()

  const table = page.getByLabel('品牌小程序订单表格')
  await expect(table).toContainText('订单号')
  await expect(table).toContainText('客户信息')
  await expect(table).toContainText('产品类型')
  await expect(table).toContainText('支付方式')
  await expect(table).toContainText('结算金额')
  await expect(table).toContainText('MP202605010001')
  await expect(table).toContainText('林小满 / 13800138000')
  await expect(table).toContainText('微信小程序')
  await expect(table).toContainText('双床影音房')
  await expect(table).toContainText('微信支付')
  await expect(table).toContainText('共 3 条订单')

  const serviceContract = page.locator('[aria-label="品牌小程序订单数据服务"]')
  await expect(serviceContract).toContainText('provider=mock')
  await expect(serviceContract).toContainText('path=/report/storer/statement/get')
  await expect(serviceContract).toContainText('bookingStartDate=2026-05-01')
  await expect(serviceContract).toContainText('bookingEndDate=2026-05-31')
  await expect(serviceContract).toContainText('pageSize=20')
  await expect(serviceContract).toContainText('total=3')

  await expect(page.locator('.statement-order-page')).not.toContainText('未接入')
  await expect(page.locator('.statement-order-page')).not.toContainText('mock 数据')
})

test('/statistics/statementOrder refreshes by store filter and keeps export feedback on the same contract', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/statementOrder'))

  const currentStoreButton = page.locator('.statement-order-store button').filter({ hasText: /天落会宿公寓/ }).first()
  const queryButton = page.getByRole('button', { name: '查询' })
  const resetButton = page.getByRole('button', { name: '重置' })
  const exportButton = page.getByRole('button', { name: '导出明细' })
  const serviceContract = page.locator('[aria-label="品牌小程序订单数据服务"]')

  await currentStoreButton.click()
  await expect(currentStoreButton).toHaveAttribute('aria-pressed', 'true')

  await resetButton.click()
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')

  await currentStoreButton.click()
  await queryButton.click()
  await expect(queryButton).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('正在刷新品牌小程序订单')
  await expect(page.getByRole('status')).toContainText('已按当前门店刷新品牌小程序订单')
  await expect(serviceContract).toContainText('poiIds=1796425098638573570')
  await expect(serviceContract).toContainText('total=2')
  await expect(page.getByLabel('品牌小程序订单表格')).toContainText('MP202605010101')
  await expect(page.getByText('共 2 条订单')).toBeVisible()

  await exportButton.click()
  await expect(exportButton).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('已生成品牌小程序订单导出任务')
  await expect(serviceContract).toContainText('path=/report/storer/statement/get')
  await expect(serviceContract).toContainText('exportExcelMenuId=1732967098146951178')
  await expect(serviceContract).toContainText('pageSize=9999')
})

test('/statistics/statementOrder handles empty and error envelopes with visible feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/statistics/statementOrder?mockState=empty'))
  await expect(page.getByLabel('品牌小程序订单表格')).toContainText('暂无数据')
  await expect(page.getByText('当前条件暂无品牌小程序订单')).toBeVisible()
  await expect(page.locator('[aria-label="品牌小程序订单数据服务"]')).toContainText('total=0')

  await page.goto(appUrl('/statistics/statementOrder?mockState=error'))
  await expect(page.getByRole('alert')).toContainText('品牌小程序订单服务暂不可用，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
