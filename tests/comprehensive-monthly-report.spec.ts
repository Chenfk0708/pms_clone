import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/Comprehensive loads monthly report list through the page service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/Comprehensive'))

  const diagnostics = page.getByTestId('comprehensive-monthly-service-state')
  const pageSizeToggle = page.getByTestId('comprehensive-monthly-page-size-toggle')
  const reportTable = page.getByTestId('comprehensive-monthly-report-table')

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '综合月报' })).toHaveClass(/is-active/)
  await expect(diagnostics).toHaveAttribute('data-provider', 'mock', { timeout: 15000 })
  await expect(diagnostics).toHaveAttribute('data-endpoint', 'https://hudson-prod.localhome.cn/report/monthly/page/get')
  await expect(diagnostics).toHaveAttribute('data-request-body', /"startDate":"2026-01-01"/)
  await expect(diagnostics).toHaveAttribute('data-request-body', /"endDate":"2026-04-30"/)
  await expect(diagnostics).toHaveAttribute('data-request-body', /"pageSize":20/)

  await expect(reportTable).toContainText('21,843.69')
  await expect(reportTable).toContainText('29.17%')
  await expect(reportTable).toContainText('624.11')
  await expect(reportTable).toContainText('182.05')
  await expect(page.getByTestId('comprehensive-monthly-view-report')).toHaveCount(4)

  await pageSizeToggle.click()
  await expect(diagnostics).toHaveAttribute('data-request-body', /"pageSize":50/)
  await expect(page.getByRole('status')).toContainText('每页条数已切换为 50')
})

test('/statistics/Comprehensive opens detail view and reports refresh and print feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/Comprehensive'))

  await expect(page.getByTestId('comprehensive-monthly-service-state')).toHaveAttribute('data-provider', 'mock', {
    timeout: 15000,
  })
  await expect(page.getByTestId('comprehensive-monthly-view-report').first()).toBeVisible({ timeout: 15000 })
  await page.getByTestId('comprehensive-monthly-view-report').first().click()

  const diagnostics = page.getByTestId('comprehensive-monthly-service-state')

  await expect(page).toHaveURL(/\/statistics\/Comprehensive\/Monthly\?startDate=2026-04-01&endDate=2026-04-30/)
  await expect(page.getByTestId('comprehensive-monthly-detail')).toContainText('21,843.69')
  await expect(page.getByTestId('comprehensive-monthly-detail')).toContainText('29.17%')
  await expect(diagnostics).toHaveAttribute('data-provider', 'mock')
  await expect(diagnostics).toHaveAttribute('data-request-body', /"startDate":"2026-01-01"/)

  await page.getByTestId('comprehensive-monthly-refresh-action').click()
  await expect(page.getByRole('status')).toContainText('报告已更新')

  await page.getByTestId('comprehensive-monthly-print-action').click()
  await expect(page.getByRole('status')).toContainText('打印任务已创建')
})

test('/statistics/Comprehensive renders the contract empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/Comprehensive?mockState=empty'))

  await expect(page.getByTestId('comprehensive-monthly-service-state')).toHaveAttribute('data-response-state', 'empty', {
    timeout: 15000,
  })
  await expect(page.getByTestId('comprehensive-monthly-empty')).toBeVisible()
  await expect(page.getByTestId('comprehensive-monthly-pagination-summary')).toContainText('0')
})

test('/statistics/Comprehensive exposes service errors and retry entry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/Comprehensive?mockState=error'))

  const alert = page.getByRole('alert')

  await expect(page.getByTestId('comprehensive-monthly-service-state')).toHaveAttribute('data-response-state', 'error', {
    timeout: 15000,
  })
  await expect(alert).toContainText('综合月报加载失败')
  await page.getByTestId('comprehensive-monthly-retry').click()
  await expect(alert).toContainText('综合月报加载失败')
})
