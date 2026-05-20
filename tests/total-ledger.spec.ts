import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/totalLedger renders the captured default ledger through the service layer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/totalLedger'))

  const serviceContract = page.getByTestId('total-ledger-service-contract')
  await expect(serviceContract).toHaveAttribute('data-provider', 'mock', { timeout: 15_000 })
  await expect(serviceContract).toHaveAttribute('data-endpoint', '/accountBookPaymentWay/page/get')
  await expect(serviceContract).toHaveAttribute('data-mock-state', 'success')
  await expect(serviceContract).toHaveAttribute(
    'data-request-body',
    JSON.stringify({
      campId: '1796067693589061634',
      beginTime: '2026-05-18',
      endTime: '2026-05-18',
      poiIds: [],
      pageNum: 1,
      pageSize: 20,
    }),
  )
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '收支汇总' })).toHaveClass(/is-active/)
  await expect(page.locator('.total-ledger-title')).toContainText('收支汇总')

  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-18')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-18')
  await expect(page.getByRole('button', { name: '昨天' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '今天' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上周' })).toBeVisible()
  await expect(page.getByRole('button', { name: '本周' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上月' })).toBeVisible()
  await expect(page.getByRole('button', { name: '本月' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出' })).toBeVisible()

  await expect(page.getByLabel('账本概括')).toContainText('净收入')
  await expect(page.getByLabel('账本概括')).toContainText('¥1002.54')
  await expect(page.getByLabel('账本概括')).toContainText('总收入：¥1002.54')
  await expect(page.getByLabel('账本概括')).toContainText('总支出：¥0.00')
  await expect(page.getByLabel('收入占比')).toContainText('平台代收')
  await expect(page.getByLabel('收入占比')).toContainText('100.00%')
  await expect(page.getByLabel('支出占比')).toContainText('暂无数据')

  const table = page.getByLabel('收支汇总表格')
  await expect(table.locator('thead th')).toHaveText(['日期', '平台代收'])
  await expect(table).toContainText('合计')
  await expect(table).toContainText('2026-05-18')
  await expect(table).toContainText('1002.54')
  await expect(page.getByText('第 1-2 条/总共 2 条')).toBeVisible()
})

test('/statistics/totalLedger exposes loading, export and quick range interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/totalLedger'))

  await expect(page.getByTestId('total-ledger-service-contract')).toHaveAttribute('data-provider', 'mock', { timeout: 15_000 })
  await expect(page.getByRole('button', { name: '今天' })).toBeVisible()

  await page.getByRole('button', { name: '今天' }).click()
  await expect(page.getByRole('status', { name: '收支汇总加载状态' })).toContainText('正在加载收支汇总')
  await expect(page.getByRole('status', { name: '收支汇总加载状态' })).toBeHidden({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: '今天' })).toHaveClass(/is-active/)
  await expect(page.getByRole('status', { name: '收支汇总操作反馈' })).toContainText('已按今天重新查询收支汇总')
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-19')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-19')

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-18')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-18')
  await expect(page.getByRole('button', { name: '昨天' })).toHaveClass(/is-active/)

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '收支汇总操作反馈' })).toContainText('已生成收支汇总导出任务')
})

test('/statistics/totalLedger handles empty and error responses without hiding failure', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/statistics/totalLedger?mockState=empty'))
  await expect(page.getByTestId('total-ledger-service-contract')).toHaveAttribute('data-mock-state', 'empty', {
    timeout: 15_000,
  })
  await expect(page.getByRole('status', { name: '收支汇总空态' })).toContainText('当前条件暂无收支汇总数据')
  await expect(page.getByText('第 0-0 条/总共 0 条')).toBeVisible()

  await page.goto(appUrl('/statistics/totalLedger?mockState=error'))
  await expect(page.getByTestId('total-ledger-service-contract')).toHaveAttribute('data-mock-state', 'error', {
    timeout: 15_000,
  })
  await expect(page.getByRole('alert')).toContainText('收支汇总服务暂不可用，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
