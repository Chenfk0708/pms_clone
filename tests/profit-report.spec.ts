import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/profitReport matches captured profit report table', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/profitReport'))
  const filters = page.getByLabel('利润报表筛选')

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '利润报表' })).toHaveClass(/is-active/)
  await expect(filters.getByRole('radio', { name: '全部门店' })).toBeVisible()
  await expect(filters.getByRole('radio', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-31')
  await expect(page.getByRole('button', { name: '房型 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型分组 请选择' })).toBeVisible()
  await expect(filters).toContainText('包含保洁费用')
  await expect(filters.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '导 出' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '说 明' })).toBeVisible()
  await expect(filters.getByRole('button', { name: /收起/ })).toBeVisible()

  await expect(page.getByLabel('利润报表表格').locator('thead tr').first()).toContainText('收入')
  await expect(page.getByLabel('利润报表表格').locator('thead tr').first()).toContainText('支出')
  await expect(page.getByLabel('利润报表表格').locator('thead tr').first()).toContainText('利润')
  await expect(page.getByLabel('利润报表表格')).toContainText('房费(减佣)')
  await expect(page.getByLabel('利润报表表格')).toContainText('记一笔支出')
  await expect(page.getByLabel('利润报表表格')).toContainText('利润率')
  await expect(page.getByLabel('利润报表表格')).toContainText('合计')
  await expect(page.getByLabel('利润报表表格')).toContainText('8207.71')
  await expect(page.getByLabel('利润报表表格')).toContainText('2026-05-14')
  await expect(page.getByLabel('利润报表表格')).toContainText('505.82')
  await expect(page.getByText('第 1-20 条/总共 32 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('/statistics/profitReport supports captured dropdown, query, collapse and description states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/profitReport'))
  const filters = page.getByLabel('利润报表筛选')

  await page.getByRole('button', { name: '房型 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '房型选项' })).toContainText('观影大床房')
  await expect(page.getByRole('listbox', { name: '房型选项' })).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await page.getByRole('option', { name: '观影大床房' }).click()
  await expect(page.getByRole('button', { name: '房型 观影大床房' })).toBeVisible()

  await page.getByLabel('包含保洁费用').check()
  await filters.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('已按当前条件查询利润报表')

  await filters.getByRole('button', { name: /收起/ }).click()
  await expect(filters.getByRole('button', { name: /展开/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型 观影大床房' })).toHaveCount(0)
  await filters.getByRole('button', { name: /展开/ }).click()
  await expect(page.getByRole('button', { name: '房型 观影大床房' })).toBeVisible()

  await filters.getByRole('button', { name: '说 明' }).click()
  const dialog = page.getByRole('dialog', { name: '报表字段说明' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('房费(减佣)')
  await expect(dialog).toContainText('房费(含佣) - 佣金')
  await expect(dialog).toContainText('利润率')
  await expect(dialog).toContainText('利润/收入')
  await page.getByLabel('关闭报表字段说明').click()
  await expect(dialog).toHaveCount(0)

  await filters.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '房型 请选择' })).toBeVisible()
  await expect(page.getByLabel('包含保洁费用')).not.toBeChecked()
})
