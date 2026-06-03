import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('income report renders real accommodation report data through gateway', async ({ page, request }) => {
  const token = await loginViaGateway(request)
  const reportRequests: Array<Record<string, unknown>> = []

  page.on('request', (req) => {
    if (req.url().includes('/api/report/accommodation/get')) {
      reportRequests.push((req.postDataJSON() as Record<string, unknown>) ?? {})
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.incomeReport.provider': 'real',
    },
  })

  await page.goto(appUrl('/#/statistics/stay'))

  const contract = page.getByTestId('income-report-contract')
  await expect(page.locator('.income-report-page')).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(contract).toHaveAttribute('data-endpoint', '/report/accommodation/get')
  await expect.poll(() => reportRequests.length).toBeGreaterThan(0)

  await page.locator('.income-date-range').click()
  await page.getByRole('button', { name: '2026-05-26' }).click()
  await page.getByRole('button', { name: '2026-05-31' }).click()
  await page.locator('.income-report-actions .is-primary').click()

  await expect(contract).toContainText('"startDate":"2026-05-26"', { timeout: 15_000 })
  await expect(contract).toContainText('"endDate":"2026-05-31"', { timeout: 15_000 })
  await expect.poll(() => reportRequests.some((body) => body.startDate === '2026-05-26' && body.endDate === '2026-05-31')).toBeTruthy()
  await expect(page.locator('.income-report-table-wrap')).toContainText('2026-05-26', { timeout: 15_000 })
  await expect(contract).toContainText(/\"total\":[1-9]/)
  await expect(page.locator('.income-report-page')).not.toContainText('HTTP 401')
  await expect(page.locator('.income-report-page')).not.toContainText('????')
})
