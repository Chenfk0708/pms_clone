import { expect, test, type Page } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openIncomeReport(page: Page, state: 'success' | 'empty' | 'error' = 'success') {
  await page.addInitScript((mockState) => {
    window.localStorage.setItem('pms.incomeReport.provider', 'mock')
    window.localStorage.setItem('pms.incomeReport.state', mockState)
  }, state)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/stay'))
}

test('/statistics/stay loads through the income report provider contract', async ({ page }) => {
  await openIncomeReport(page)
  await expect(page.locator('.income-report-page')).toBeVisible()

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '报表', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '收入报表' })).toHaveClass(/is-active/)

  const pageRoot = page.locator('.income-report-page')
  await expect(pageRoot).toHaveAttribute('data-provider', 'mock')
  await expect(pageRoot).toHaveAttribute('data-state', 'success')

  await expect(page.getByRole('group', { name: '统计维度' })).toBeVisible()
  await expect(page.getByRole('button', { name: '按日' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '按月' })).toBeVisible()
  await expect(page.getByRole('button', { name: '按门店' })).toBeVisible()
  await expect(page.getByLabel('收入报表筛选')).toBeVisible()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-19')
  await expect(page.locator('.income-report-notice')).not.toBeVisible()
  await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
  await expect(page.getByRole('button', { name: '说明' })).toBeVisible()

  const table = page.getByLabel('收入报表表格')
  await expect(table).toContainText('合计')
  await expect(table).toContainText('10228.21')
  await expect(table).toContainText('2309.74')
  await expect(table).toContainText('12537.95')
  await expect(table).toContainText('2026-05-19')
  await expect(page.locator('.income-report-pagination button').nth(0)).toBeDisabled()
  await expect(page.locator('.income-report-pagination button').nth(2)).toBeDisabled()

  const contract = page.getByTestId('income-report-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-endpoint', '/report/accommodation/get')
  await expect(contract).toContainText('"dimension":"day"')
  await expect(contract).toContainText('"startDate":"2026-05-01"')
  await expect(contract).toContainText('"endDate":"2026-05-19"')
  await expect(contract).toContainText('"traceId":"mock-baobiao--tongji-baobiao--shouru-baobiao-day-001"')
})

test('/statistics/stay refreshes data from filters and exposes actionable feedback', async ({ page }) => {
  await openIncomeReport(page)

  await page.getByRole('button', { name: '按月' }).click()
  await expect(page.getByRole('button', { name: '按月' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('收入报表表格')).toContainText('127317.3')
  await expect(page.getByLabel('收入报表表格')).toContainText('2026-05')
  await expect(page.getByTestId('income-report-contract')).toContainText('"dimension":"month"')

  await page.getByLabel('收入报表日期范围').click()
  await expect(page.getByRole('dialog', { name: '收入报表日期面板' })).toBeVisible()
  await page.getByRole('button', { name: '2026-05-20' }).click()
  await page.getByRole('button', { name: '2026-05-21' }).click()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-20')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-21')

  await page.getByRole('button', { name: '按房型' }).click()
  await page.getByRole('button', { name: '房型 请选择' }).click()
  await page.getByRole('option', { name: '观影大床房' }).click()
  await page.getByRole('button', { name: '渠道 请选择' }).click()
  await page.getByRole('option', { name: '携程' }).click()
  await page.getByRole('button', { name: /查\s*询/ }).click()

  const contract = page.getByTestId('income-report-contract')
  await expect(contract).toContainText('"dimension":"roomType"')
  await expect(contract).toContainText('"startDate":"2026-05-20"')
  await expect(contract).toContainText('"endDate":"2026-05-21"')
  await expect(contract).toContainText('"roomTypeName":"观影大床房"')
  await expect(contract).toContainText('"channelName":"携程"')
  await expect(page.getByLabel('收入报表表格')).toContainText('2707.45')
  await expect(page.locator('.income-report-notice')).toContainText('收入报表已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.locator('.income-report-notice')).toContainText('收入报表导出任务已创建')

  await page.getByRole('button', { name: '说明' }).click()
  await expect(page.getByRole('dialog', { name: '报表字段说明' })).toContainText('房费(减佣)')
  await expect(page.getByRole('dialog', { name: '报表字段说明' })).toContainText('订单总收入')
  await page.getByRole('button', { name: '关闭报表字段说明' }).click()

  await page.getByRole('button', { name: '下载订单明细' }).nth(1).click()
  await expect(page.getByRole('dialog', { name: '订单明细下载任务' })).toContainText('观影大床房')
  await expect(page.getByRole('dialog', { name: '订单明细下载任务' })).toContainText('2707.45')
  await page.getByRole('button', { name: '查看收支明细' }).click()
  await expect(page).toHaveURL(/\/statistics\/orderLedger$/)
})

test('/statistics/stay supports picking a custom date range from the calendar panel', async ({ page }) => {
  await openIncomeReport(page)

  await page.getByLabel('收入报表日期范围').click()
  await expect(page.getByRole('dialog', { name: '收入报表日期面板' })).toBeVisible()
  await page.getByRole('button', { name: '2026-05-20' }).click()
  await page.getByRole('button', { name: '2026-05-21' }).click()
  await page.getByRole('button', { name: /查\s*询/ }).click()

  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-20')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-21')
  await expect(page.getByTestId('income-report-contract')).toContainText('"startDate":"2026-05-20"')
  await expect(page.getByTestId('income-report-contract')).toContainText('"endDate":"2026-05-21"')
})

test('/statistics/stay expands grouped income columns from the table header', async ({ page }) => {
  await openIncomeReport(page)

  const roomFeeToggle = page.locator('.income-table-expand', { hasText: '房费(含佣)' })
  await roomFeeToggle.click()
  await expect(roomFeeToggle).toHaveClass(/is-expanded/)
  await expect(page.getByRole('columnheader', { name: '全日房费(含佣)' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '钟点房费(含佣)' })).toBeVisible()

  const otherExpenseToggle = page.locator('.income-table-expand', { hasText: '其他消费' })
  await otherExpenseToggle.click()
  await expect(otherExpenseToggle).toHaveClass(/is-expanded/)
  await expect(page.getByRole('columnheader', { name: '其他消费(住宿)' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '其他消费(场地)' })).toBeVisible()

  const manualIncomeToggle = page.locator('.income-table-expand', { hasText: '记一笔收入' })
  await manualIncomeToggle.click()
  await expect(manualIncomeToggle).toHaveClass(/is-expanded/)
  await expect(page.getByRole('columnheader', { name: '记一笔收入(住宿)' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '记一笔收入(场地)' })).toBeVisible()
})

test('/statistics/stay handles empty provider responses without collapsing the page', async ({ page }) => {
  await openIncomeReport(page, 'empty')

  await expect(page.locator('.income-report-page')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByRole('status', { name: '收入报表空态' })).toContainText('当前筛选条件暂无收入数据')
  await expect(page.getByLabel('收入报表表格')).toContainText('暂无数据')
  await expect(page.getByTestId('income-report-contract')).toContainText('"total":0')
  await expect(page.getByRole('button', { name: '说明' })).toBeEnabled()
})

test('/statistics/stay exposes provider errors and retries the same contract', async ({ page }) => {
  await openIncomeReport(page, 'error')

  await expect(page.locator('.income-report-page')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert', { name: '收入报表数据错误' })).toContainText('收入报表加载失败')
  await expect(page.getByRole('button', { name: '导出' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()

  await page.evaluate(() => window.localStorage.setItem('pms.incomeReport.state', 'success'))
  await page.getByRole('button', { name: '重新加载' }).click()

  await expect(page.getByLabel('收入报表表格')).toContainText('10228.21')
  await expect(page.getByTestId('income-report-contract')).toContainText('"dimension":"day"')
})
