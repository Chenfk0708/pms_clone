import { expect, test } from '@playwright/test'

function appUrl(routePath: string) {
  return `http://127.0.0.1:4173/#${routePath}`
}

test.describe('report default provider', () => {
  test('income sales and profit reports render existing local data by default', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('pms_token', 'report-default-provider-token')
      window.localStorage.setItem('pmsCampId', '10001')
      window.localStorage.setItem('pms.currentCampId', '10001')
      window.localStorage.setItem(
        'pms_user',
        JSON.stringify({
          id: '1',
          username: 'root',
          name: 'root',
          mobile: '13800000001',
          roleName: 'admin',
          campId: '10001',
          campName: '10001',
        }),
      )
      window.localStorage.setItem('pms.incomeReport.provider', 'real')
      window.localStorage.setItem('pms.salesReport.provider', 'real')
      window.localStorage.setItem('pms.profitReport.provider', 'real')
      window.localStorage.setItem('pms.comprehensiveMonthlyReportProvider', 'real')
      window.localStorage.setItem('pms.statisticsDistributionOrderProvider', 'real')
      window.localStorage.setItem('pms.preSaleCouponMallProvider', 'real')
      window.localStorage.setItem('pms.statementOrderProvider', 'real')
      window.localStorage.setItem('pms.totalLedgerProvider', 'real')
      window.localStorage.removeItem('pms.incomeReport.state')
      window.localStorage.removeItem('pms.salesReport.mockState')
    })
    await page.route('**/api/select/poi/page/get', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [{ poiId: '10001', poiName: 'Default Store' }],
          },
        },
      })
    })

    await page.goto(appUrl('/statistics/stay'))
    expect(await page.evaluate(() => window.localStorage.getItem('pms_token'))).toBe('report-default-provider-token')
    expect(page.url()).toContain('/statistics/stay')
    await expect(page.locator('.income-report-page')).toHaveAttribute('data-provider', 'mock')
    await expect(page.locator('.income-report-page')).toContainText('10228.21')

    await page.goto(appUrl('/statistics/sale'))
    await expect(page.locator('.sales-report-page')).toHaveAttribute('data-provider', 'mock')
    await expect(page.getByTestId('sales-report-service-contract')).toContainText('"rows":20')

    await page.goto(appUrl('/statistics/profitReport'))
    await expect(page.locator('.profit-report-page')).toHaveAttribute('data-provider', 'mock')
    await expect(page.locator('.profit-report-page')).toContainText('11362.58')
  })
})
