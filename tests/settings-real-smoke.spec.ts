import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('setting pages use real gateway APIs without route mocks', async ({ page, request }) => {
  const token = await loginViaGateway(request)
  const apiPaths: string[] = []

  page.on('request', (req) => {
    const url = new URL(req.url())
    if (url.pathname.startsWith('/api/')) {
      apiPaths.push(url.pathname)
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.autoStrategySetting.provider': 'real',
      'pms.financeSetting.provider': 'real',
      'pms.memberSetting.provider': 'real',
      'pms.printSettingProvider': 'real',
    },
  })

  await page.goto(appUrl('/#/setting/IntelligenceSetting'))
  const autoContract = page.getByTestId('auto-strategy-setting-service-contract')
  await expect(autoContract).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(autoContract).toHaveAttribute('data-response-state', 'success', { timeout: 15_000 })
  await expect(autoContract).toHaveAttribute('data-endpoint', '/systemConfigs/get')

  const orderAutoPendingOptions = page.locator('input[name="order-auto-pending"]')
  const orderAutoPendingCount = await orderAutoPendingOptions.count()
  let pendingOptionChanged = false
  for (let index = 0; index < orderAutoPendingCount; index += 1) {
    const option = orderAutoPendingOptions.nth(index)
    if (!(await option.isChecked())) {
      await option.check({ force: true })
      pendingOptionChanged = true
      break
    }
  }
  expect(pendingOptionChanged).toBe(true)
  await expect(autoContract).toHaveAttribute('data-last-action', 'update-order-auto-pending-strategy', {
    timeout: 15_000,
  })

  await page.goto(appUrl('/#/setting/finance'))
  const financeContract = page.getByTestId('finance-setting-contract')
  await expect(financeContract).toContainText('"provider": "api"', { timeout: 15_000 })
  await expect(financeContract).toContainText('/systemConfigs/get')

  const nightAuditSelect = page.locator('.finance-time-select select')
  const currentNightAuditTime = await nightAuditSelect.inputValue()
  await nightAuditSelect.selectOption(currentNightAuditTime === '3' ? '4' : '3')
  await expect(financeContract).toContainText('/systemConfigs/nightAudit/save', { timeout: 15_000 })

  await page.goto(appUrl('/#/setting/member'))
  const memberContract = page.getByTestId('member-setting-service-contract')
  await expect(memberContract).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(memberContract).toHaveAttribute('data-response-state', /success|empty/, { timeout: 15_000 })
  await expect(memberContract).toHaveAttribute('data-endpoint', '/memberSettings/bootstrap')

  await page.goto(appUrl('/#/setting/print'))
  const printContract = page.getByTestId('print-setting-service-contract')
  await expect(printContract).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(printContract).toHaveAttribute('data-response-state', 'success', { timeout: 15_000 })
  await expect(printContract).toHaveAttribute('data-endpoint', '/printSettings/get')

  await page.locator('textarea').first().fill(`real-smoke-${Date.now()}`)
  await page.locator('.print-setting-actions button').first().click()
  await expect(printContract).toHaveAttribute('data-endpoint', '/printSettings/save', { timeout: 15_000 })

  expect(apiPaths).toEqual(
    expect.arrayContaining([
      '/api/systemConfigs/get',
      '/api/systemConfig/orderAutoPendingStrategy',
      '/api/systemConfigs/nightAudit/save',
      '/api/memberSettings/bootstrap',
      '/api/printSettings/get',
      '/api/printSettings/save',
    ]),
  )
})
