import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/distributionOrder matches captured report settlement table', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/distributionOrder'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '聚合分销订单' })).toHaveClass(/is-active/)

  const filters = page.getByLabel('聚合分销订单筛选')
  await expect(filters.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(filters.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(filters.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '导出明细' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '展开' })).toBeVisible()

  const table = page.getByLabel('聚合分销订单表格')
  await expect(table.locator('thead tr').last()).toContainText('订单号')
  await expect(table).toContainText('客户信息')
  await expect(table).toContainText('房型名称')
  await expect(table).toContainText('预订时间')
  await expect(table).toContainText('实付金额')
  await expect(table).toContainText('平台服务费')
  await expect(table).toContainText('应结算金额')
  await expect(table).toContainText('已结算金额')
  await expect(table).toContainText('结算状态')
  await expect(table).toContainText('合计')
  await expect(table).toContainText('435.00')
  await expect(table).toContainText('65.25')
  await expect(table).toContainText('369.75')
  await expect(table).toContainText('2054409001821356034')
  await expect(table).toContainText('陈崇科/+8618319045566')
  await expect(table).toContainText('天落大床电竞套间')
  await expect(table).toContainText('待结算')
  await expect(page.getByText('第 1-2 条/总共 2 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('/statistics/distributionOrder supports captured expanded filters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/distributionOrder'))

  const filters = page.getByLabel('聚合分销订单筛选')
  await filters.getByRole('button', { name: '展开' }).click()
  await expect(filters.getByRole('button', { name: '收起' })).toBeVisible()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-31')
  await expect(page.getByPlaceholder('请输入订单编号/预订人/手机号')).toBeVisible()
  await expect(filters.getByRole('button', { name: '订单筛选 请选择' })).toBeVisible()

  await filters.getByRole('button', { name: '订单筛选 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '订单筛选选项' })).toContainText('全部')
  await expect(page.getByRole('listbox', { name: '订单筛选选项' })).toContainText('非置换订单')
  await expect(page.getByRole('listbox', { name: '订单筛选选项' })).toContainText('置换订单')
  await page.getByRole('option', { name: '置换订单', exact: true }).click()
  await expect(filters.getByRole('button', { name: '订单筛选 置换订单' })).toBeVisible()

  await page.getByLabel('开始日期').click()
  await expect(page.getByRole('dialog', { name: '日期选择' })).toContainText('2026年')
  await expect(page.getByRole('dialog', { name: '日期选择' })).toContainText('5月')
  await expect(page.getByRole('dialog', { name: '日期选择' })).toContainText('6月')
  await page.keyboard.press('Escape')

  await page.getByPlaceholder('请输入订单编号/预订人/手机号').fill('205')
  await filters.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('已查询聚合分销订单')

  await filters.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('请输入订单编号/预订人/手机号')).toHaveValue('')
  await expect(filters.getByRole('button', { name: '订单筛选 请选择' })).toBeVisible()
})
