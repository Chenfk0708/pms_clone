import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/sale renders the captured daily sales report', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/sale'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '销况报表' })).toHaveClass(/is-active/)
  const filters = page.getByLabel('销况报表筛选')

  const tabs = page.getByRole('tablist', { name: '销况报表维度' })
  await expect(tabs.getByRole('tab', { name: '按日' })).toHaveAttribute('aria-selected', 'true')
  await expect(tabs).toContainText('按月')
  await expect(tabs).toContainText('按门店')
  await expect(tabs).toContainText('按渠道')
  await expect(tabs).toContainText('按房型')
  await expect(tabs).toContainText('按房间')

  await expect(page.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-14')
  await expect(page.getByRole('button', { name: '房型 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型分组 请选择' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '导 出' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '说 明' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '收起' })).toBeVisible()
  await expect(page.locator('.sales-report-filter-row')).toHaveJSProperty('offsetHeight', 32)

  const table = page.getByLabel('销况报表表格')
  await expect(table.locator('thead tr').first()).toContainText('入住间夜')
  await expect(table.locator('thead tr').first()).toContainText('平均房费ADR')
  await expect(table.locator('thead tr').first()).toContainText('平均客房收益RevPAR')
  await expect(table.locator('thead tr').first()).toContainText('房费收入')
  await expect(table).toContainText('日期')
  await expect(table).toContainText('总房间数')
  await expect(table).toContainText('入住率OCC')
  await expect(table).toContainText('ADR(减佣)')
  await expect(table).toContainText('RevPar(减佣)')
  await expect(table).toContainText('房费(含佣)')
  await expect(table).toContainText('住宿订单总数')
  await expect(table.locator('tbody tr').first().locator('td')).toHaveText([
    '合计',
    '56',
    '56',
    '32',
    '32',
    '0',
    '57.14%',
    '277.73',
    '221.94',
    '158.69',
    '126.82',
    '7102.14',
    '1785.32',
    '8887.46',
    '33',
  ])
  await expect(table.locator('tbody tr').filter({ hasText: '2026-05-14' }).locator('td')).toHaveText([
    '2026-05-14',
    '4',
    '4',
    '2',
    '2',
    '0',
    '50.00%',
    '323.22',
    '252.91',
    '161.61',
    '126.46',
    '505.82',
    '140.61',
    '646.43',
    '2',
  ])
  await expect(page.getByText('第 1-15 条/总共 15 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('/statistics/sale supports captured filters, date picker and collapse state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/sale'))

  await page.getByRole('button', { name: '房型 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '房型选项' })).toContainText('观影大床房')
  await expect(page.getByRole('listbox', { name: '房型选项' })).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await page.getByRole('option', { name: '观影大床房' }).click()
  await expect(page.getByRole('button', { name: '房型 观影大床房' })).toBeVisible()

  await page.getByLabel('开始日期').click()
  const picker = page.getByRole('dialog', { name: '日期范围选择' })
  await expect(picker).toBeVisible()
  await expect(picker).toContainText('2026年5月')
  await expect(picker).toContainText('2026年6月')
  await expect(picker).toContainText('昨天')
  await expect(picker).toContainText('本周')
  await expect(picker).toContainText('本月')
  await expect(picker).toContainText('上月')
  await page.keyboard.press('Escape')
  await expect(picker).toBeHidden()

  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('已按当前条件查询销况报表')
  const filters = page.getByLabel('销况报表筛选')
  await filters.getByRole('button', { name: '收起' }).click()
  await expect(filters.getByRole('button', { name: '展开' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型 观影大床房' })).toHaveCount(0)
  await filters.getByRole('button', { name: '展开' }).click()
  await expect(page.getByRole('button', { name: '房型 观影大床房' })).toBeVisible()

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByRole('button', { name: '房型 请选择' })).toBeVisible()
})

test('/statistics/sale switches captured aggregate dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/sale'))

  await page.getByRole('tab', { name: '按月' }).click()
  await expect(page.getByRole('tab', { name: '按月' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('销况报表表格')).toContainText('月份')
  await expect(page.getByLabel('销况报表表格')).toContainText('暂无数据')
  await expect(page.getByLabel('开始月份')).toHaveValue('2025-11')
  await expect(page.getByLabel('结束月份')).toHaveValue('2026-05')

  await page.getByRole('tab', { name: '按门店' }).click()
  await expect(page.getByLabel('销况报表表格')).toContainText('门店')
  const storeRow = page.getByLabel('销况报表表格').locator('tbody tr').filter({ hasText: '天落会宿公寓' }).locator('td')
  await expect(storeRow.nth(0)).toHaveText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(storeRow.nth(1)).toHaveText('56')
  await expect(storeRow.nth(6)).toHaveText('57.14%')
  await expect(storeRow.nth(8)).toHaveText('221.94')
  await expect(page.getByText('第 1-2 条/总共 2 条')).toBeVisible()

  await page.getByRole('tab', { name: '按渠道' }).click()
  await expect(page.getByLabel('销况报表表格')).toContainText('渠道')
  await expect(page.getByLabel('销况报表表格').locator('tbody tr').filter({ hasText: '携程' }).locator('td')).toHaveText([
    '携程',
    '16',
    '50.00%',
    '16',
    '50.00%',
    '0',
    '0%',
    '17',
    '56.67%',
  ])
  await expect(page.getByLabel('销况报表表格').locator('tbody tr').filter({ hasText: '飞猪淘酒店' }).locator('td')).toHaveText([
    '飞猪淘酒店',
    '11',
    '34.38%',
    '11',
    '34.38%',
    '0',
    '0%',
    '8',
    '26.67%',
  ])
  await expect(page.getByText('第 1-17 条/总共 17 条')).toBeVisible()

  await page.getByRole('tab', { name: '按房型' }).click()
  await expect(page.getByLabel('销况报表表格')).toContainText('房型')
  const roomTypeRow = page.getByLabel('销况报表表格').locator('tbody tr').filter({ hasText: '观影大床房' }).locator('td')
  await expect(roomTypeRow.nth(0)).toHaveText('观影大床房')
  await expect(roomTypeRow.nth(3)).toHaveText('14')
  await expect(roomTypeRow.nth(6)).toHaveText('100.00%')
  await expect(roomTypeRow.nth(8)).toHaveText('193.39')
  await expect(page.getByLabel('销况报表表格').locator('tbody tr').filter({ hasText: '顶层套房（浴缸巨幕电竞麻将）' })).toContainText('35.71%')

  await page.getByRole('tab', { name: '按房间' }).click()
  await expect(page.getByRole('button', { name: '房间 请选择' })).toBeVisible()
  await expect(page.getByLabel('销况报表表格')).toContainText('房间')
  const roomRow = page.getByLabel('销况报表表格').locator('tbody tr').filter({ hasText: '观影大床房(房间1)' }).locator('td')
  await expect(roomRow.nth(0)).toHaveText('观影大床房(房间1)')
  await expect(roomRow.nth(6)).toHaveText('100.00%')
  await expect(roomRow.nth(7)).toHaveText('223.13')
  await expect(roomRow.nth(8)).toHaveText('181.68')
  const roomSummary = page.getByLabel('销况报表表格').locator('tbody tr').first().locator('td')
  await expect(roomSummary.nth(0)).toHaveText('合计')
  await expect(roomSummary.nth(7)).toHaveText('271.14')
  await expect(roomSummary.nth(8)).toHaveText('216.82')
})
