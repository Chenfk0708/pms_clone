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

test('/setting/paymentSetting loads contract-backed payment settings and supports detail actions', async ({ page }) => {
  await openPaymentSetting(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '支付方式设置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('note')).toContainText('系统默认支付方式不支持编辑和删除，可直接拖动调整排序。')
  await expect(page.getByRole('heading', { name: '已启用支付方式', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '已停用支付方式', level: 2 })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新列表' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新增支付方式' })).toBeVisible()

  const contract = page.getByTestId('payment-setting-service-contract')
  await expect(contract).toContainText('provider=mock')
  await expect(contract).toContainText('/paymentSettings/list')
  await expect(contract).toContainText('traceId=mock-shezhi--tongyong-shezhi--zhifu-fangshi-shezhi-list-success-001')

  const enabledList = page.getByLabel('已启用支付方式列表')
  const disabledList = page.getByLabel('已停用支付方式列表')
  await expect(enabledList.getByRole('article')).toHaveCount(11)
  await expect(disabledList.getByRole('article')).toHaveCount(3)
  await expect(enabledList).toContainText('平台代收')
  await expect(enabledList).toContainText('微信')
  await expect(disabledList).toContainText('企业月结')

  await page.getByRole('button', { name: '查看 微信 详情' }).click()
  await expect(page.getByRole('dialog', { name: '支付方式详情' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '微信' })).toBeVisible()
  await expect(page.getByText('系统默认支付方式')).toBeVisible()
  await page.getByRole('button', { name: '设为默认支付方式' }).click()
  await expect(feedbackBar(page)).toContainText('已将微信设为默认支付方式')
  await expect(contract).toContainText('/paymentSettings/default/update')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '支付方式详情' })).toHaveCount(0)

  await page.getByRole('button', { name: '导出设置' }).click()
  await expect(feedbackBar(page)).toContainText('导出任务已创建')
  await expect(contract).toContainText('/paymentSettings/export')
})

test('/setting/paymentSetting creates, disables, and re-enables custom payment methods', async ({ page }) => {
  await openPaymentSetting(page)

  await page.getByRole('button', { name: '新增支付方式' }).click()
  await expect(page.getByRole('dialog', { name: '新增支付方式' })).toBeVisible()
  await page.getByLabel('支付方式名称').fill('企业月卡')
  await page.getByRole('button', { name: '保存支付方式' }).click()

  await expect(feedbackBar(page)).toContainText('已新增支付方式：企业月卡')
  await expect(page.getByLabel('已启用支付方式列表')).toContainText('企业月卡')

  await page.getByRole('button', { name: '查看 企业月卡 详情' }).click()
  await page.getByRole('button', { name: '停用支付方式' }).click()
  await expect(feedbackBar(page)).toContainText('已停用支付方式：企业月卡')
  await expect(page.getByLabel('已停用支付方式列表')).toContainText('企业月卡')

  await page.getByRole('button', { name: '启用 企业月卡' }).click()
  await expect(feedbackBar(page)).toContainText('已启用支付方式：企业月卡')
  await expect(page.getByLabel('已启用支付方式列表')).toContainText('企业月卡')
})

test('/setting/paymentSetting renders a business empty state from the provider', async ({ page }) => {
  await openPaymentSetting(page, 'empty')

  await expect(page.getByText('当前没有已启用支付方式')).toBeVisible()
  await expect(page.getByText('当前没有已停用支付方式')).toBeVisible()
  await expect(page.getByRole('button', { name: '新增支付方式' })).toBeVisible()

  const contract = page.getByTestId('payment-setting-service-contract')
  await expect(contract).toContainText('mockState=empty')
  await expect(contract).toContainText('traceId=mock-shezhi--tongyong-shezhi--zhifu-fangshi-shezhi-list-empty-001')
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
  await expect(feedbackBar(page)).toContainText('支付方式设置已更新')
  await expect(page.getByTestId('payment-setting-service-contract')).toContainText(
    'traceId=mock-shezhi--tongyong-shezhi--zhifu-fangshi-shezhi-list-success-001',
  )
})
