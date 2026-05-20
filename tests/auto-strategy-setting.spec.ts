import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/IntelligenceSetting 通过服务层加载并对齐真实默认值', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/IntelligenceSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '自动策略设置' })).toHaveClass(/is-active/)

  const contract = page.getByTestId('auto-strategy-setting-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-endpoint', '/systemConfigs/get')
  await expect(contract).toHaveAttribute('data-response-state', 'success')
  await expect(contract).toHaveAttribute('data-mock-state', 'success')
  await expect(contract).toHaveAttribute('data-request-body', /"campId":"1796067693589061634"/)

  await expect(page.getByRole('tab', { name: '接单规则' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '房态自动化' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '库存占用规则' })).toBeVisible()

  const orderRule = page.getByRole('region', { name: '住宿订单接单规则' })
  await expect(orderRule).toContainText('待处理订单过期前5分钟')
  await expect(orderRule.getByLabel('不操作')).toBeChecked()
  await expect(orderRule.getByLabel('逾期前自动同意')).not.toBeChecked()
  await expect(orderRule.getByLabel('逾期前自动拒绝')).not.toBeChecked()

  const checkoutRule = page.getByRole('region', { name: '飞猪自动结账' })
  await expect(checkoutRule.getByRole('switch', { name: '信用住自动结账' })).toHaveAttribute('aria-checked', 'false')

  const cancelRule = page.getByRole('region', { name: '携程规则外取消订单设置' })
  await expect(cancelRule.getByRole('radio', { name: '同意取消', exact: true })).not.toBeChecked()
  await expect(cancelRule.getByRole('radio', { name: '不同意取消' })).toBeChecked()
})

test('/setting/IntelligenceSetting 支持保存接单规则、结账开关和取消规则', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/IntelligenceSetting'))

  const contract = page.getByTestId('auto-strategy-setting-service-contract')

  await page.getByLabel('逾期前自动同意').check()
  await expect(page.getByRole('status')).toContainText('住宿订单接单规则已保存')
  await expect(page.getByLabel('逾期前自动同意')).toBeChecked()
  await expect(contract).toHaveAttribute('data-last-action', 'update-order-auto-pending-strategy')
  await expect(contract).toHaveAttribute('data-last-request-body', /"configKey":"hudson\.basic\.orderAutoPendingStrategy"/)
  await expect(contract).toHaveAttribute('data-last-request-body', /"configValue":"2"/)

  await page.getByRole('switch', { name: '信用住自动结账' }).click()
  await expect(page.getByRole('status')).toContainText('信用住自动结账已保存')
  await expect(page.getByRole('switch', { name: '信用住自动结账' })).toHaveAttribute('aria-checked', 'true')
  await expect(contract).toHaveAttribute('data-last-action', 'update-order-auto-settle-strategy')
  await expect(contract).toHaveAttribute('data-last-request-body', /"configValue":"1"/)

  await page.getByRole('radio', { name: '同意取消', exact: true }).check()
  await expect(page.getByRole('status')).toContainText('规则外取消订单设置已保存')
  await expect(page.getByRole('radio', { name: '同意取消', exact: true })).toBeChecked()
  await expect(contract).toHaveAttribute('data-last-action', 'update-negotiate-refund-automatic-accept-strategy')
  await expect(contract).toHaveAttribute('data-last-request-body', /"configKey":"hudson\.basic\.negotiateRefundAutomaticAcceptStrategy"/)
  await expect(contract).toHaveAttribute('data-last-request-body', /"configValue":"1"/)
})

test('/setting/IntelligenceSetting 支持切换其他页签并展示真实内容', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/IntelligenceSetting'))

  await page.getByRole('tab', { name: '房态自动化' }).click()
  await expect(page.getByRole('tab', { name: '房态自动化' })).toHaveAttribute('aria-selected', 'true')

  const roomAutomation = page.getByRole('tabpanel', { name: '房态自动化' })
  await expect(roomAutomation.getByRole('region', { name: '自动排房设置' })).toContainText('按房间顺序排房')
  await expect(roomAutomation.getByLabel('按房间顺序排房')).toBeChecked()
  await expect(roomAutomation.getByLabel('当日订单优先排空净')).not.toBeChecked()
  await expect(roomAutomation.getByLabel('智能排房')).not.toBeChecked()

  const autoCheckIn = roomAutomation.getByRole('region', { name: '自动办理入住' })
  await expect(autoCheckIn.getByRole('switch', { name: '自动办理入住开关' })).toHaveAttribute('aria-checked', 'true')
  await expect(autoCheckIn).toContainText('15:00:00')

  const autoCheckout = roomAutomation.getByRole('region', { name: '自动办理退房' })
  await expect(autoCheckout.getByRole('switch', { name: '自动办理退房开关' })).toHaveAttribute('aria-checked', 'true')
  await expect(autoCheckout).toContainText('12:00:00')

  const dirtyStrategy = roomAutomation.getByRole('region', { name: '房间转脏策略' })
  await expect(dirtyStrategy.getByLabel('手动设置')).toBeChecked()

  const cleanStrategy = roomAutomation.getByRole('region', { name: '房间转净策略' })
  await expect(cleanStrategy.getByRole('switch', { name: '保洁任务完成后房间自动转净' })).toHaveAttribute(
    'aria-checked',
    'true',
  )

  await page.getByRole('tab', { name: '库存占用规则' }).click()
  await expect(page.getByRole('tab', { name: '库存占用规则' })).toHaveAttribute('aria-selected', 'true')

  const stockRule = page.getByRole('tabpanel', { name: '库存占用规则' })
  const pendingOccupation = stockRule.getByRole('region', { name: '待接单占库存设置' })
  await expect(pendingOccupation.getByLabel('待接单不占库存')).toBeChecked()

  const unpaidOccupation = stockRule.getByRole('region', { name: '待支付订单占库存设置' })
  await expect(unpaidOccupation.getByLabel('待支付订单不占库存')).toBeChecked()

  const hourlyOccupation = stockRule.getByRole('region', { name: '钟点房订单占库存设置' })
  await expect(hourlyOccupation.getByLabel('钟点房订单占库存')).toBeChecked()
})

test('/setting/IntelligenceSetting 暴露 empty 契约并展示空态', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/IntelligenceSetting?mockState=empty'))

  const contract = page.getByTestId('auto-strategy-setting-service-contract')
  await expect(contract).toHaveAttribute('data-response-state', 'empty')
  await expect(contract).toHaveAttribute('data-mock-state', 'empty')

  await expect(page.getByText('当前暂无自动策略配置')).toBeVisible()
  await expect(page.getByText('请稍后刷新或检查门店策略配置')).toBeVisible()
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('/setting/IntelligenceSetting 暴露 error 契约并展示错误态', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/IntelligenceSetting?mockState=error'))

  const contract = page.getByTestId('auto-strategy-setting-service-contract')
  await expect(contract).toHaveAttribute('data-response-state', 'error')
  await expect(contract).toHaveAttribute('data-mock-state', 'error')

  const alert = page.getByRole('alert')
  await expect(alert).toContainText('自动策略设置加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
