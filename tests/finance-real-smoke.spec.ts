import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('finance pages render through real gateway APIs without route mocks', async ({ page, request }) => {
  const token = await loginViaGateway(request)
  const apiCalls: string[] = []

  page.on('request', (req) => {
    const url = req.url()
    if (url.includes('/api/accountBookPaymentWay/page/get') || url.includes('/api/report/storer/statement/get')) {
      apiCalls.push(url)
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.totalLedgerProvider': 'real',
      'pms.statementOrderProvider': 'real',
    },
  })

  await page.goto(appUrl('/#/statistics/totalLedger'))
  const totalLedgerContract = page.getByTestId('total-ledger-service-contract')
  await expect(totalLedgerContract).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(totalLedgerContract).toHaveAttribute('data-endpoint', '/accountBookPaymentWay/page/get')
  await expect(page.locator('.total-ledger-summary')).toContainText('净收入')
  await expect(page.locator('.total-ledger-table-section')).toContainText('收支汇总表')
  await expect(page.locator('.total-ledger-page')).not.toContainText('HTTP 401')
  await expect(page.locator('.total-ledger-page')).not.toContainText('请先登录')

  await page.getByRole('button', { name: '开始日期' }).click()
  await page.getByRole('button', { name: '2026-05-26' }).click()
  await page.getByRole('button', { name: '2026-05-31' }).click()
  await expect(totalLedgerContract).toHaveAttribute('data-request-body', /"beginTime":"2026-05-26"/, {
    timeout: 15_000,
  })
  await expect(totalLedgerContract).toHaveAttribute('data-request-body', /"endTime":"2026-05-31"/, {
    timeout: 15_000,
  })
  await expect(page.locator('.total-ledger-pagination')).toContainText('共 3 条', { timeout: 15_000 })

  await page.goto(appUrl('/#/statistics/statementOrder'))
  const statementContract = page.locator('[aria-label="品牌小程序订单数据服务"]')
  await expect(statementContract).toContainText('provider=api', { timeout: 15_000 })
  await expect(statementContract).toContainText('path=/report/storer/statement/get')
  await expect(statementContract).toContainText('campId=10001')
  await expect(page.locator('.statement-order-table-shell')).toContainText('DEMO20260526003')
  await expect(page.locator('.statement-order-table-shell')).toContainText('共 2 条订单')
  await expect(page.locator('.statement-order-page')).not.toContainText('HTTP 401')
  await expect(page.locator('.statement-order-page')).not.toContainText('请先登录')

  expect(apiCalls.some((url) => url.includes('/api/accountBookPaymentWay/page/get'))).toBeTruthy()
  expect(apiCalls.some((url) => url.includes('/api/report/storer/statement/get'))).toBeTruthy()
})
