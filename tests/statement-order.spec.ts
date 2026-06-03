import { expect, test, type Page } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

async function openStatementOrder(page: Page, mode: 'success' | 'empty' | 'error' = 'success') {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript((mockMode) => {
    window.localStorage.setItem('pms_token', 'statement-order-test-token')
    window.localStorage.setItem('pms.statementOrderProvider', 'mock')
    if (!window.localStorage.getItem('pms.statementOrderMockMode')) {
      window.localStorage.setItem('pms.statementOrderMockMode', mockMode)
    }
  }, mode)
  await page.goto(appUrl('/#/statistics/statementOrder'))
}

async function openRealStatementOrder(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'statement-order-api-token')
    window.localStorage.setItem('pms.statementOrderProvider', 'real')
    window.localStorage.setItem('pmsCampId', '10001')
  })
  await page.goto(appUrl('/#/statistics/statementOrder'))
}

test('/statistics/statementOrder uses the statement order service contract in the default success state', async ({
  page,
}) => {
  await openStatementOrder(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('nav[aria-label="顶部导航"] a.topnav-link.is-active')).toContainText('报表')
  await expect(page.locator('.sidebar-link.is-active')).toContainText('品牌小程序订单')

  const filters = page.getByLabel('品牌小程序订单筛选')
  await expect(filters).toContainText('全部门店')
  await expect(filters).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()

  const table = page.getByLabel('品牌小程序订单表格')
  await expect(table).toContainText('订单号')
  await expect(table).toContainText('客户信息')
  await expect(table).toContainText('产品类型')
  await expect(table).toContainText('支付方式')
  await expect(table).toContainText('结算金额')
  await expect(table).toContainText('MP202605010001')
  await expect(table).toContainText('林小满 / 13800138000')
  await expect(table).toContainText('微信小程序')
  await expect(table).toContainText('双床影音房')
  await expect(table).toContainText('微信支付')
  await expect(table).toContainText('共 3 条订单')

  const serviceContract = page.locator('[aria-label="品牌小程序订单数据服务"]')
  await expect(serviceContract).toContainText('provider=mock')
  await expect(serviceContract).toContainText('path=/report/storer/statement/get')
  await expect(serviceContract).toContainText('bookingStartDate=2026-05-01')
  await expect(serviceContract).toContainText('bookingEndDate=2026-05-31')
  await expect(serviceContract).toContainText('pageSize=20')
  await expect(serviceContract).toContainText('total=3')

  await expect(page.locator('.statement-order-page')).not.toContainText('未接入')
  await expect(page.locator('.statement-order-page')).not.toContainText('mock 数据')
})

test('/statistics/statementOrder refreshes by store filter and keeps export feedback on the same contract', async ({
  page,
}) => {
  await openStatementOrder(page)

  const currentStoreButton = page.locator('.statement-order-store button').filter({ hasText: /天落会宿公寓/ }).first()
  const queryButton = page.getByRole('button', { name: '查询' })
  const resetButton = page.getByRole('button', { name: '重置' })
  const exportButton = page.getByRole('button', { name: '导出明细' })
  const serviceContract = page.locator('[aria-label="品牌小程序订单数据服务"]')

  await currentStoreButton.click()
  await expect(currentStoreButton).toHaveAttribute('aria-pressed', 'true')

  await resetButton.click()
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')

  await currentStoreButton.click()
  await queryButton.click()
  await expect(queryButton).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('正在刷新品牌小程序订单')
  await expect(page.getByRole('status')).toContainText('已按当前门店刷新品牌小程序订单')
  await expect(serviceContract).toContainText('poiIds=1796425098638573570')
  await expect(serviceContract).toContainText('total=2')
  await expect(page.getByLabel('品牌小程序订单表格')).toContainText('MP202605010101')
  await expect(page.getByText('共 2 条订单')).toBeVisible()

  await exportButton.click()
  await expect(exportButton).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('已生成品牌小程序订单导出任务')
  await expect(serviceContract).toContainText('path=/report/storer/statement/get')
  await expect(serviceContract).toContainText('exportExcelMenuId=1732967098146951178')
  await expect(serviceContract).toContainText('pageSize=9999')
})

test('/statistics/statementOrder handles empty and error envelopes with visible feedback', async ({ page }) => {
  await openStatementOrder(page, 'empty')
  await expect(page.getByLabel('品牌小程序订单表格')).toContainText('暂无数据')
  await expect(page.getByText('当前条件暂无品牌小程序订单')).toBeVisible()
  await expect(page.locator('[aria-label="品牌小程序订单数据服务"]')).toContainText('total=0')

  await page.evaluate(() => {
    window.localStorage.setItem('pms.statementOrderMockMode', 'error')
  })
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('品牌小程序订单服务暂不可用，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})


test('/statistics/statementOrder real provider posts statement request and renders API orders', async ({ page }) => {
  const requests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []

  await page.route('**/api/report/storer/statement/get', async (route) => {
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
          total: 1,
          size: 20,
          current: 1,
          pageNum: 1,
          hasNextPage: false,
          pages: 1,
          list: [
            {
              orderNo: 'STATEMENT-API-001',
              customerName: 'API Guest',
              mobile: '18800001111',
              productTypeName: 'API Product Type',
              productName: 'API Lake Room',
              bookingTimeStr: '2026-05-18 12:00:00',
              channelName: 'API Channel',
              payableAmount: 456.78,
              paidAmount: 456.78,
              discountAmount: 0,
              refundAmount: 0,
              paymentFee: 3.21,
              platformServiceFee: 4.56,
              distributorCommission: 7.89,
              paymentWayName: 'API Pay',
              settlementAmount: 441.12,
            },
          ],
        },
        traceId: 'api-report-storer-statement-get-test',
        timestamp: '2026-05-31T11:20:00+08:00',
      }),
    })
  })

  await openRealStatementOrder(page)

  const serviceContract = page.locator('.sr-only-heading').filter({ hasText: 'provider=api' })
  await expect(serviceContract).toContainText('provider=api', { timeout: 15_000 })
  await expect(serviceContract).toContainText('path=/report/storer/statement/get')
  await expect(serviceContract).toContainText('campId=10001')
  await expect(page.locator('.statement-order-table-shell')).toContainText('STATEMENT-API-001')
  await expect(page.locator('.statement-order-table-shell')).toContainText('API Guest / 18800001111')
  await expect(page.locator('.statement-order-table-shell')).toContainText('API Pay')
  await expect.poll(() => requests.length).toBeGreaterThanOrEqual(1)
  for (const apiRequest of requests) {
    expect(apiRequest.headers.authorization).toBe('Bearer statement-order-api-token')
    expect(apiRequest.body).toMatchObject({
      campId: '10001',
      pageNum: 1,
      pageSize: 20,
      bookingStartDate: '2026-05-01',
      bookingEndDate: '2026-05-31',
    })
  }
})
