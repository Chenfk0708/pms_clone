import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/distributionOrder renders the captured settlement report through a service layer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/distributionOrder'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '聚合分销订单' })).toHaveClass(/is-active/)

  const servicePanel = page.getByLabel('聚合分销订单数据服务')
  await expect(servicePanel).toContainText('provider=mock')
  await expect(servicePanel).toContainText('/report/flows/get')
  await expect(servicePanel).toContainText('bookingStartDate=2026-05-01')
  await expect(servicePanel).toContainText('bookingEndDate=2026-05-31')

  const filters = page.getByLabel('聚合分销订单筛选')
  await expect(filters.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(filters.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(filters.getByRole('button', { name: '重置' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '查询' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '导出明细' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '展开' })).toBeVisible()

  const table = page.getByLabel('聚合分销订单表格')
  await expect(table).toContainText('订单号')
  await expect(table).toContainText('客户信息')
  await expect(table).toContainText('房型名称')
  await expect(table).toContainText('预订时间')
  await expect(table).toContainText('实付金额')
  await expect(table).toContainText('平台服务费')
  await expect(table).toContainText('应结算金额')
  await expect(table).toContainText('已结算金额')
  await expect(table).toContainText('结算状态')
  await expect(table).toContainText('合计')
  await expect(table).toContainText('676.05')
  await expect(table).toContainText('105.00')
  await expect(table).toContainText('595.06')
  await expect(table).toContainText('2054409001821356034')
  await expect(table).toContainText('2056641572589068289')
  await expect(table).toContainText('待结算')
  await expect(page.getByText('第 1-3 条/总共 3 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('/statistics/distributionOrder supports captured expanded filters and query echo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/distributionOrder'))

  const filters = page.getByLabel('聚合分销订单筛选')
  await filters.getByRole('button', { name: '展开' }).click()
  await expect(filters.getByRole('button', { name: '收起' })).toBeVisible()
  await expect(page.getByLabel('预订开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('预订结束日期')).toHaveValue('2026-05-31')
  await expect(page.getByPlaceholder('请输入订单编号/预订人/手机号')).toBeVisible()
  await expect(filters.getByRole('button', { name: '订单筛选 请选择' })).toBeVisible()

  await filters.getByRole('button', { name: '订单筛选 请选择' }).click()
  const listbox = page.getByRole('listbox', { name: '订单筛选选项' })
  await expect(listbox).toContainText('全部')
  await expect(listbox).toContainText('非置换订单')
  await expect(listbox).toContainText('置换订单')

  await page.getByRole('option', { name: '置换订单', exact: true }).click()
  await expect(filters.getByRole('button', { name: '订单筛选 置换订单' })).toBeVisible()

  await page.getByPlaceholder('请输入订单编号/预订人/手机号').fill('205')
  await filters.getByRole('button', { name: '查询' }).click()
  await expect(page.getByRole('status')).toContainText('已查询聚合分销订单')

  const servicePanel = page.getByLabel('聚合分销订单数据服务')
  await expect(servicePanel).toContainText('keyword=205')
  await expect(servicePanel).toContainText('settlementState=置换订单')
})

test('/statistics/distributionOrder exposes deterministic export, empty and error feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/statistics/distributionOrder'))
  await page.getByRole('button', { name: '导出明细' }).click()
  await expect(page.getByRole('status')).toContainText('已生成聚合分销订单导出任务')

  await page.goto(appUrl('/statistics/distributionOrder?mockState=empty'))
  await expect(page.getByText('当前条件暂无聚合分销订单')).toBeVisible()
  await expect(page.getByText('第 0-0 条/总共 0 条')).toBeVisible()

  await page.goto(appUrl('/statistics/distributionOrder?mockState=error'))
  await expect(page.getByRole('alert')).toContainText('聚合分销订单服务暂不可用，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('/statistics/distributionOrder gives feedback for store scope and page-size controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/distributionOrder'))

  const filters = page.getByLabel('聚合分销订单筛选')
  await filters.getByRole('button', { name: /天落会宿公寓/ }).click()
  await expect(page.getByRole('status')).toContainText('已刷新当前门店口径的聚合分销订单')
  await expect(page.getByLabel('聚合分销订单数据服务')).toContainText('storeScope=current')

  await filters.getByRole('button', { name: '全部门店' }).click()
  await expect(page.getByRole('status')).toContainText('已刷新全部门店口径的聚合分销订单')
  await expect(page.getByLabel('聚合分销订单数据服务')).toContainText('storeScope=all')

  await filters.getByRole('button', { name: '门店设置' }).click()
  await expect(page.getByRole('status')).toContainText('门店范围设置已同步到当前聚合分销订单')

  await page.getByRole('button', { name: '20 条/页' }).click()
  await expect(page.getByRole('status')).toContainText('当前每页展示 20 条聚合分销订单')

  await filters.getByRole('button', { name: '展开' }).click()
  await page.getByLabel('预订开始日期').click()
  await expect(page.getByRole('dialog', { name: '预订时间范围' })).toBeVisible()
  await page.getByRole('button', { name: '本月' }).click()
  await expect(page.getByRole('status')).toContainText('已定位到 2026-05 的预订时间范围')
})
