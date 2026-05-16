import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/stay matches captured income report default table', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/stay'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '收入报表' })).toHaveClass(/is-active/)

  const filters = page.getByLabel('收入报表筛选')
  await expect(filters.getByRole('button', { name: '按日' })).toHaveClass(/is-active/)
  await expect(filters.getByRole('button', { name: '按月' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '按门店' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '按渠道' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '按房型' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '按房间' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '按退房时间' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(filters.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-14')
  await expect(filters.getByRole('button', { name: '房型 请选择' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '房型分组 请选择' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '导 出' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '说 明' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '收起' })).toBeVisible()

  const table = page.getByLabel('收入报表表格')
  await expect(table).toContainText('日期')
  await expect(table).toContainText('房费(减佣)')
  await expect(table).toContainText('佣金')
  await expect(table).toContainText('房费(含佣)')
  await expect(table).toContainText('订单总收入')
  await expect(table).toContainText('总营收(含佣)')
  await expect(table).toContainText('总营收(减佣)')
  await expect(table).toContainText('合计')
  await expect(table).toContainText('7102.14')
  await expect(table).toContainText('1785.32')
  await expect(table).toContainText('8887.46')
  await expect(table).toContainText('2026-05-01')
  await expect(table).toContainText('966.87')
  await expect(table).toContainText('314.25')
  await expect(table.getByRole('button', { name: '下载订单明细' }).first()).toBeVisible()
  await expect(page.getByText('第 1-15 条/总共 15 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('/statistics/stay supports captured filters, description and mode states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/stay'))

  const filters = page.getByLabel('收入报表筛选')

  await filters.getByRole('button', { name: '房型 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '房型选项' })).toContainText('观影大床房')
  await expect(page.getByRole('listbox', { name: '房型选项' })).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await page.getByRole('option', { name: '观影大床房' }).click()
  await expect(filters.getByRole('button', { name: '房型 观影大床房' })).toBeVisible()

  await filters.getByRole('button', { name: '渠道 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('美团民宿')
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('携程')
  await page.keyboard.press('Escape')

  await filters.getByRole('button', { name: '房型分组 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '房型分组选项' })).toContainText('暂无数据')
  await page.keyboard.press('Escape')

  await page.getByLabel('开始日期').click()
  await expect(page.getByLabel('日期面板')).toContainText('2026年5月')
  await expect(page.getByLabel('日期面板')).toContainText('2026年6月')
  await expect(page.getByLabel('日期面板').getByRole('button', { name: '昨天' })).toBeVisible()
  await expect(page.getByLabel('日期面板').getByRole('button', { name: '本周' })).toBeVisible()
  await page.keyboard.press('Escape')

  await filters.getByRole('button', { name: '收起' }).click()
  await expect(filters.getByRole('button', { name: '展开' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '房型 观影大床房' })).toHaveCount(0)
  await filters.getByRole('button', { name: '展开' }).click()
  await expect(filters.getByRole('button', { name: '房型 观影大床房' })).toBeVisible()

  await filters.getByRole('button', { name: '说 明' }).click()
  const dialog = page.getByRole('dialog', { name: '报表字段说明' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('总营收(减佣)')
  await expect(dialog).toContainText('房费(减佣)+其他消费+记一笔收入')
  await expect(dialog).toContainText('佣金')
  await expect(dialog).toContainText('渠道佣金，包括渠道优惠')
  await page.getByLabel('关闭报表字段说明').click()
  await expect(dialog).toHaveCount(0)

  await filters.getByRole('button', { name: '按月' }).click()
  await expect(page.getByLabel('开始月份')).toHaveValue('2025-11')
  await expect(page.getByLabel('结束月份')).toHaveValue('2026-05')
  await expect(page.getByLabel('收入报表表格')).toContainText('127317.3')
  await expect(page.getByLabel('收入报表表格')).toContainText('2026-05')
  await expect(page.getByText('第 1-8 条/总共 8 条')).toBeVisible()

  await filters.getByRole('button', { name: '按渠道' }).click()
  await expect(page.getByLabel('收入报表表格')).toContainText('渠道')
  await expect(page.getByLabel('收入报表表格')).toContainText('46.57%')
  await expect(page.getByLabel('收入报表表格')).toContainText('美团酒店')

  await filters.getByRole('button', { name: '按房型' }).click()
  await expect(page.getByLabel('收入报表表格')).toContainText('观影大床房')
  await expect(page.getByLabel('收入报表表格')).toContainText('2707.45')

  await filters.getByRole('button', { name: '按房间' }).click()
  await expect(page.getByLabel('收入报表表格')).toContainText('观影大床房(房间1)')
  await expect(page.getByLabel('收入报表表格')).toContainText('6938.2')

  await filters.getByRole('button', { name: '按退房时间' }).click()
  await expect(page.getByLabel('收入报表表格')).toContainText('退房时间')
  await expect(page.getByLabel('收入报表表格')).toContainText('6862.56')
})
