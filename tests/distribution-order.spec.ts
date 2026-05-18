import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/channels/distribution/distributionOrderSettlement matches captured settlement order table', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/distribution/distributionOrderSettlement'))

  await expect(page.getByRole('heading', { name: '聚合分销订单', level: 1 })).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: /聚合分销/ }),
  ).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '聚合分销订单' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(page.getByRole('button', { name: /天落会宿/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()
  await expect(page.getByRole('button', { name: '展开' })).toBeVisible()

  await expect(page.getByLabel('聚合分销订单表格').locator('.distribution-order-table__head > div')).toHaveText([
    '订单号',
    '客户信息',
    '房型名称',
    '预订时间',
    '实付金额',
    '平台服务费',
    '应结算金额',
    '已结算金额',
    '结算状态',
  ])
  await expect(page.getByLabel('聚合分销订单表格')).toContainText('合计')
  await expect(page.getByLabel('聚合分销订单表格')).toContainText('435.00')
  await expect(page.getByLabel('聚合分销订单表格')).toContainText('65.25')
  await expect(page.getByLabel('聚合分销订单表格')).toContainText('369.75')
  await expect(page.getByLabel('聚合分销订单表格')).toContainText('2054409001821356034')
  await expect(page.getByLabel('聚合分销订单表格')).toContainText('陈崇科/+8618319045566')
  await expect(page.getByLabel('聚合分销订单表格')).toContainText('天落大床电竞套间')
  await expect(page.getByLabel('聚合分销订单表格')).toContainText('待结算')
  await expect(page.getByText('第 1-2 条/总共 2 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('/channels/distribution/distributionOrderSettlement supports captured filters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/distribution/distributionOrderSettlement'))

  const filterPanel = page.getByLabel('聚合分销订单筛选')

  await filterPanel.getByRole('button', { name: '展开' }).click()
  await expect(filterPanel.getByRole('button', { name: /收起/ })).toBeVisible()
  await expect(page.getByRole('group', { name: '预订时间' })).toBeVisible()
  await expect(page.getByLabel('预订开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('预订结束日期')).toHaveValue('2026-05-31')
  await expect(page.getByPlaceholder('请输入订单编号/预订人/手机号')).toBeVisible()
  await expect(page.getByRole('button', { name: '订单筛选 请选择' })).toBeVisible()

  await page.getByPlaceholder('请输入订单编号/预订人/手机号').fill('205')
  await page.getByRole('button', { name: '订单筛选 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '订单筛选选项' })).toContainText('待结算')
  await page.getByRole('option', { name: '待结算' }).click()
  await expect(page.getByRole('button', { name: '订单筛选 待结算' })).toBeVisible()
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('已查询聚合分销订单')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('请输入订单编号/预订人/手机号')).toHaveValue('')
  await expect(page.getByRole('button', { name: '订单筛选 请选择' })).toBeVisible()
  await expect(page.getByLabel('预订开始日期')).toHaveValue('2026-05-01')
})

test('/channels/distribution/distributionOrderSettlement is driven by the distribution order service', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/distribution/distributionOrderSettlement'))

  const servicePanel = page.getByLabel('聚合分销订单数据服务')
  await expect(servicePanel).toContainText('provider=mock')
  await expect(servicePanel).toContainText('/report/flows/get')
  await expect(servicePanel).toContainText('bookingStartDate=2026-05-01')
  await expect(servicePanel).toContainText('bookingEndDate=2026-05-31')

  await page.getByLabel('查看订单 2054409001821356034').click()
  await expect(page.getByRole('dialog', { name: '聚合分销订单详情' })).toContainText('2054409001821356034')
  await expect(page.getByRole('dialog', { name: '聚合分销订单详情' })).toContainText('待结算')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '聚合分销订单详情' })).toBeHidden()
})

test('/channels/distribution/distributionOrderSettlement handles empty and error envelopes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.addInitScript(() => window.localStorage.setItem('pms.distributionOrderMockMode', 'empty'))
  await page.goto(appUrl('/channels/distribution/distributionOrderSettlement'))
  await expect(page.getByText('当前条件暂无聚合分销订单')).toBeVisible()
  await expect(page.getByText('第 0-0 条/总共 0 条')).toBeVisible()

  await page.evaluate(() => window.localStorage.setItem('pms.distributionOrderMockMode', 'error'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('聚合分销订单服务暂不可用，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
