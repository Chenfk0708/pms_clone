import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/IntelligenceSetting matches captured order automation rules', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/IntelligenceSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '自动策略设置' })).toHaveClass(/is-active/)

  await expect(page.getByRole('tab', { name: '接单规则' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '房态自动化' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '库存占用规则' })).toBeVisible()

  const orderRule = page.getByRole('region', { name: '住宿订单接单规则' })
  await expect(orderRule).toBeVisible()
  await expect(orderRule).toContainText('待处理订单过期前5分钟')
  await expect(orderRule.getByLabel('不操作')).toBeChecked()
  await expect(orderRule.getByLabel('逾期前自动同意')).not.toBeChecked()
  await expect(orderRule.getByLabel('逾期前自动拒绝')).not.toBeChecked()

  const checkoutRule = page.getByRole('region', { name: '飞猪自动结账' })
  await expect(checkoutRule).toContainText('客人离店当日自动发起结账')
  await expect(checkoutRule.getByRole('switch', { name: '信用住自动结账' })).toHaveAttribute('aria-checked', 'true')

  const cancelRule = page.getByRole('region', { name: '携程规则外取消订单设置' })
  await expect(cancelRule).toContainText('超过25分钟后未确认')
  await expect(cancelRule.getByRole('radio', { name: '同意取消', exact: true })).not.toBeChecked()
  await expect(cancelRule.getByRole('radio', { name: '不同意取消' })).toBeChecked()
})

test('/setting/IntelligenceSetting supports captured rule changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/IntelligenceSetting'))

  await page.getByLabel('逾期前自动同意').check()
  await expect(page.getByLabel('逾期前自动同意')).toBeChecked()

  await page.getByRole('switch', { name: '信用住自动结账' }).click()
  await expect(page.getByRole('switch', { name: '信用住自动结账' })).toHaveAttribute('aria-checked', 'false')

  await page.getByLabel('不同意取消').check()
  await expect(page.getByLabel('不同意取消')).toBeChecked()

  await page.getByRole('tab', { name: '房态自动化' }).click()
  await expect(page.getByRole('tab', { name: '房态自动化' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('region', { name: '房态自动化策略' })).toContainText('入住中订单换房后自动创建')

  await page.getByRole('tab', { name: '库存占用规则' }).click()
  await expect(page.getByRole('tab', { name: '库存占用规则' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('region', { name: '库存占用规则' })).toContainText('待处理订单')
})
