import { expect, test, type Page } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

async function openTotalLedger(page: Page, mode: 'success' | 'empty' | 'error' = 'success') {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript((mockMode) => {
    window.localStorage.setItem('pms_token', 'total-ledger-test-token')
    window.localStorage.setItem('pms.totalLedgerProvider', 'mock')
    if (!window.localStorage.getItem('pms.totalLedgerMockMode')) {
      window.localStorage.setItem('pms.totalLedgerMockMode', mockMode)
    }
  }, mode)
  await page.goto(appUrl('/#/statistics/totalLedger'))
}

async function openRealTotalLedger(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'total-ledger-api-token')
    window.localStorage.setItem('pms.totalLedgerProvider', 'real')
    window.localStorage.setItem('pmsCampId', '10001')
  })
  await page.goto(appUrl('/#/statistics/totalLedger'))
}

test('/statistics/totalLedger renders the captured default ledger through the service layer', async ({ page }) => {
  await openTotalLedger(page)

  const serviceContract = page.getByTestId('total-ledger-service-contract')
  await expect(serviceContract).toHaveAttribute('data-provider', 'mock', { timeout: 15_000 })
  await expect(serviceContract).toHaveAttribute('data-endpoint', '/accountBookPaymentWay/page/get')
  await expect(serviceContract).toHaveAttribute('data-mock-state', 'success')
  await expect(serviceContract).toHaveAttribute(
    'data-request-body',
    JSON.stringify({
      campId: '10001',
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

  await expect(page.getByLabel('开始日期')).toContainText('2026-05-18')
  await expect(page.getByLabel('结束日期')).toContainText('2026-05-18')
  await expect(page.getByRole('button', { name: '昨天' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '今天' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上周' })).toBeVisible()
  await expect(page.getByRole('button', { name: '本周' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上月' })).toBeVisible()
  await expect(page.getByRole('button', { name: '本月' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出' })).toBeVisible()

  await expect(page.getByLabel('账本概况')).toContainText('净收入')
  await expect(page.getByLabel('账本概况')).toContainText('¥1002.54')
  await expect(page.getByLabel('账本概况')).toContainText('总收入：¥1002.54')
  await expect(page.getByLabel('账本概况')).toContainText('总支出：¥0.00')
  await expect(page.getByLabel('收入占比')).toContainText('平台代收')
  await expect(page.getByLabel('收入占比')).toContainText('100.00%')
  await expect(page.getByLabel('支出占比')).toContainText('暂无数据')

  const table = page.locator('.total-ledger-table')
  await expect(table.locator('thead th')).toHaveText(['日期', '平台代收'])
  await expect(table).toContainText('合计')
  await expect(table).toContainText('2026-05-18')
  await expect(table).toContainText('1002.54')
  await expect(page.locator('.total-ledger-pagination')).toContainText('2')
})

test('/statistics/totalLedger exposes loading, export and quick range interactions', async ({ page }) => {
  await openTotalLedger(page)

  await expect(page.getByTestId('total-ledger-service-contract')).toHaveAttribute('data-provider', 'mock', { timeout: 15_000 })
  await expect(page.getByRole('button', { name: '今天' })).toBeVisible()

  await page.getByRole('button', { name: '今天' }).click()
  await expect(page.getByRole('status', { name: '收支汇总操作反馈' })).toContainText('正在加载收支汇总')
  await expect(page.getByRole('button', { name: '今天' })).toHaveClass(/is-active/)
  await expect(page.getByTestId('total-ledger-service-contract')).toHaveAttribute(
    'data-request-body',
    /"beginTime":"2026-05-19"/,
  )
  await expect(page.getByLabel('开始日期')).toContainText('2026-05-19')
  await expect(page.getByLabel('结束日期')).toContainText('2026-05-19')

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByLabel('开始日期')).toContainText('2026-05-18')
  await expect(page.getByLabel('结束日期')).toContainText('2026-05-18')
  await expect(page.getByRole('button', { name: '昨天' })).toHaveClass(/is-active/)

  const exportButton = page.getByRole('button', { name: '导出' })
  await exportButton.click()
  await expect(page.getByRole('button', { name: '导出中...' })).toBeDisabled()
  await expect(exportButton).toBeEnabled({ timeout: 10_000 })
})

test('/statistics/totalLedger handles empty and error responses without hiding failure', async ({ page }) => {
  await openTotalLedger(page, 'empty')
  await expect(page.getByTestId('total-ledger-service-contract')).toHaveAttribute('data-mock-state', 'empty', {
    timeout: 15_000,
  })
  await expect(page.getByRole('status', { name: '收支汇总空状态' })).toContainText('当前条件暂无收支汇总数据')
  await expect(page.locator('.total-ledger-pagination')).toContainText('0')

  await page.evaluate(() => {
    window.localStorage.setItem('pms.totalLedgerMockMode', 'error')
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pms.totalLedgerMockMode'))).toBe('error')
  await expect(page.getByTestId('total-ledger-service-contract')).toHaveAttribute('data-mock-state', 'error', {
    timeout: 15_000,
  })
  await expect(page.getByRole('alert')).toContainText('收支汇总服务暂不可用，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})


test('/statistics/totalLedger real provider posts account book request and renders API rows', async ({ page }) => {
  const requests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []

  await page.route('**/api/accountBookPaymentWay/page/get', async (route) => {
    requests.push({
      headers: route.request().headers(),
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        data: {
          total: 2,
          size: 20,
          current: 1,
          pageNum: 1,
          hasNextPage: false,
          pages: 1,
          list: [
            {
              date: 'TOTAL',
              paymentWayPriceDetailViews: [
                { paymentWayId: 'api-wechat', paymentWayName: 'API-WECHAT', price: 321.09 },
              ],
            },
            {
              date: '2026-05-18',
              paymentWayPriceDetailViews: [
                { paymentWayId: 'api-wechat', paymentWayName: 'API-WECHAT', price: 321.09 },
              ],
            },
          ],
          extraInfo: {
            income: [{ paymentWayId: 'api-wechat', paymentWayName: 'API-WECHAT', price: 321.09 }],
            expend: [],
            totalInfo: {
              totalIncomePrice: 321.09,
              totalExpendPrice: 0,
              netIncome: 321.09,
            },
          },
        },
        traceId: 'api-account-book-payment-way-page-get-test',
        timestamp: '2026-05-31T11:00:00+08:00',
      }),
    })
  })

  await openRealTotalLedger(page)

  const contract = page.getByTestId('total-ledger-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(contract).toHaveAttribute('data-endpoint', '/accountBookPaymentWay/page/get')
  await expect(page.locator('.total-ledger-summary')).toContainText('321.09')
  await expect(page.locator('.total-ledger-table-section')).toContainText('API-WECHAT')
  await expect(page.locator('.total-ledger-table-section')).toContainText('2026-05-18')
  await expect.poll(() => requests.length).toBeGreaterThanOrEqual(1)
  for (const apiRequest of requests) {
    expect(apiRequest.headers.authorization).toBe('Bearer total-ledger-api-token')
    expect(apiRequest.body).toMatchObject({
      campId: '10001',
      pageNum: 1,
      pageSize: 20,
      poiIds: [],
    })
  }
})
