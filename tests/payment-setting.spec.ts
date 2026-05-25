import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function collapseChatDock(page: import('@playwright/test').Page) {
  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }
}

async function openPaymentSetting(
  page: import('@playwright/test').Page,
  mode: 'success' | 'empty' | 'error' = 'success',
  latencyMs = 0,
) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(
    ({ mockMode, mockLatencyMs }) => {
      window.localStorage.setItem('pms.paymentSettingProvider', 'mock')
      window.localStorage.setItem('pms.paymentSettingMockState', mockMode)
      window.localStorage.setItem('pms.paymentSettingMockLatencyMs', String(mockLatencyMs))
    },
    { mockMode: mode, mockLatencyMs: latencyMs },
  )
  await page.goto(appUrl('/setting/paymentSetting'))
  await collapseChatDock(page)
}

function feedbackBar(page: import('@playwright/test').Page) {
  return page.locator('[role="status"][aria-label="支付方式设置操作反馈"]')
}

function enabledList(page: import('@playwright/test').Page) {
  return page.getByLabel('已启用支付方式列表')
}

function disabledList(page: import('@playwright/test').Page) {
  return page.getByLabel('已停用支付方式列表')
}

test('/setting/paymentSetting renders compact tiles with empty disabled section', async ({ page }) => {
  await openPaymentSetting(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '支付方式设置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('note')).toContainText('系统默认支付方式不支持编辑和删除，可直接拖动调整排序。')
  await expect(page.getByRole('heading', { name: '已启用支付方式', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '已停用支付方式', level: 2 })).toBeVisible()
  await expect(page.getByRole('button', { name: '新增' })).toBeVisible()

  const contract = page.getByTestId('payment-setting-service-contract')
  await expect(contract).toContainText('provider=mock')
  await expect(contract).toContainText('/paymentSettings/list')

  const enabledTiles = enabledList(page).getByTestId('payment-method-tile')
  const disabledTiles = disabledList(page).getByTestId('payment-method-tile')
  await expect(enabledTiles).toHaveCount(11)
  await expect(disabledTiles).toHaveCount(0)
  await expect(enabledList(page)).toContainText('平台代收')
  await expect(enabledList(page)).toContainText('支付宝')
  await expect(enabledList(page)).toContainText('现场收款')
})

test('/setting/paymentSetting supports hover disable and inline add', async ({ page }) => {
  await openPaymentSetting(page)

  const alipayTile = enabledList(page).locator('[data-method-id="payment-alipay"]')
  await alipayTile.hover()
  await expect(alipayTile.locator('.payment-method-tile__disable')).toBeVisible()
  await alipayTile.locator('.payment-method-tile__disable').click()

  await expect(feedbackBar(page)).toContainText('已停用支付方式：支付宝')
  await expect(disabledList(page).locator('[data-method-id="payment-alipay"]')).toBeVisible()
  await expect(page.getByTestId('payment-setting-service-contract')).toContainText('/paymentSettings/status/update')

  await page.locator('.payment-setting-primary--compact').click()
  const inlineAddCard = page.getByTestId('payment-method-inline-add')
  await expect(inlineAddCard).toBeVisible()
  await expect(page.locator('.payment-setting-primary--compact')).toBeDisabled()
  await inlineAddCard.locator('input').fill('企业月结')
  await inlineAddCard.locator('.is-confirm').click()

  await expect(feedbackBar(page)).toContainText('已新增支付方式：企业月结')
  await expect(enabledList(page)).toContainText('企业月结')

  const contract = page.getByTestId('payment-setting-service-contract')
  await expect(contract).toContainText('/paymentSettings/create')
})

test('/setting/paymentSetting supports drag sorting for enabled tiles', async ({ page }) => {
  await openPaymentSetting(page)

  const beforeIds = await enabledList(page)
    .locator('[data-testid="payment-method-tile"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-method-id') ?? ''))
  expect(beforeIds.slice(0, 3)).toEqual(['payment-platform-collect', 'payment-wechat', 'payment-alipay'])

  const source = enabledList(page).locator('[data-method-id="payment-onsite"]')
  const target = enabledList(page).locator('[data-method-id="payment-bank-transfer"]')
  await source.dragTo(target)

  await expect(feedbackBar(page)).toContainText('支付方式排序已更新')

  const afterIds = await enabledList(page)
    .locator('[data-testid="payment-method-tile"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-method-id') ?? ''))
  expect(afterIds.indexOf('payment-onsite')).toBeLessThan(afterIds.indexOf('payment-bank-transfer'))
  expect(afterIds.indexOf('payment-onsite')).toBeGreaterThan(afterIds.indexOf('payment-cash'))

  await expect(page.getByTestId('payment-setting-service-contract')).toContainText('/paymentSettings/sort/update')
})

test('/setting/paymentSetting exposes a clear error state and can retry the same contract', async ({ page }) => {
  await openPaymentSetting(page, 'error')

  await expect(page.getByRole('alert')).toContainText('支付方式设置加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载支付方式设置' })).toBeVisible()
  await expect(feedbackBar(page)).toContainText('支付方式设置加载失败')

  await page.evaluate(() => {
    window.localStorage.setItem('pms.paymentSettingMockState', 'success')
  })
  await page.getByRole('button', { name: '重新加载支付方式设置' }).click()

  await expect(page.getByRole('heading', { name: '已启用支付方式', level: 2 })).toBeVisible()
  await expect(enabledList(page).getByTestId('payment-method-tile')).toHaveCount(11)
})
