import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.removeItem('1796067693589061634_isChangeOrderAmortizeStrategy')
    window.localStorage.removeItem('1796067693589061634_isChangeOrderStrategy')
  })
})

test('/setting/finance loads the provider-backed finance configuration', async ({ page }) => {
  await page.goto(appUrl('/setting/finance?financeSettingProvider=mock&financeSettingMockState=success'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '财务设置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('region', { name: '财务设置' })).toBeVisible()
  await expect(page.getByRole('switch', { name: '夜审' })).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByLabel('自动夜审时间')).toHaveValue('6')
  await expect(page.getByLabel('按日历价分摊')).toBeChecked()
  await expect(page.getByLabel('普通关房')).not.toBeEnabled()
  await expect(page.getByRole('button', { name: '编辑' })).toBeVisible()

  const contract = page.getByTestId('finance-setting-contract')
  await expect(contract).toContainText('/systemConfigs/get')
  await expect(contract).toContainText('/systemConfigs/nightAudit/save')
  await expect(contract).toContainText('/systemConfigs/financeStrategy/save')
  await expect(contract).toContainText('/systemConfigs/vendibleTypes/save')

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/shezhi--tongyong-shezhi--caiwu-shezhi/default-clone-route.png',
    ),
    fullPage: true,
  })
})

test('/setting/finance supports permission handoff and direct night audit enabling', async ({ page }) => {
  await page.goto(appUrl('/setting/finance?financeSettingProvider=mock&financeSettingMockState=success'))

  await page.getByRole('switch', { name: '夜审' }).click()
  await expect(page.getByRole('dialog', { name: '是否确认开启夜审' })).toBeVisible()
  await page.getByRole('button', { name: '去设置权限' }).click()
  await expect(page).toHaveURL(/\/setting\/role$/)

  await page.goto(appUrl('/setting/finance?financeSettingProvider=mock&financeSettingMockState=success'))
  await page.getByRole('switch', { name: '夜审' }).click()
  await page.getByRole('button', { name: '确认开启', exact: true }).click()
  await expect(page.getByRole('switch', { name: '夜审' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByLabel('财务设置操作反馈')).toContainText('夜审设置已更新')

  await page.getByLabel('自动夜审时间').selectOption('8')
  await expect(page.getByLabel('财务设置操作反馈')).toContainText('08:00')
})

test('/setting/finance saves amortize and vendible settings with real feedback', async ({ page }) => {
  await page.goto(appUrl('/setting/finance?financeSettingProvider=mock&financeSettingMockState=success'))

  await page.getByLabel('平均分摊').click()
  await expect(page.getByRole('dialog', { name: '确认修改连住订单分摊模式' })).toBeVisible()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByLabel('平均分摊')).toBeChecked()
  await expect(page.getByLabel('财务设置操作反馈')).toContainText('连住订单分摊模式已更新')
  await expect(page.getByTestId('finance-setting-contract')).toContainText('"orderAmortizeStrategy": 2')

  await page.getByRole('button', { name: '编辑' }).click()
  await expect(page.getByLabel('普通关房')).toBeEnabled()
  await page.getByLabel('联动关房').uncheck()
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('dialog', { name: '是否确认操作' })).toBeVisible()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByLabel('联动关房')).not.toBeChecked()
  await expect(page.getByLabel('财务设置操作反馈')).toContainText('关房计入可售规则已更新')
  await expect(page.getByTestId('finance-setting-contract')).toContainText('"vendibleTypes": [')
})

test('/setting/finance exposes empty and error states without silent fallback', async ({ page }) => {
  await page.goto(appUrl('/setting/finance?financeSettingProvider=mock&financeSettingMockState=empty'))

  await expect(page.getByRole('status', { name: '财务设置初始化提醒' })).toBeVisible()
  await page.getByRole('button', { name: '初始化默认规则' }).click()
  await expect(page.getByRole('switch', { name: '夜审' })).toBeVisible()
  await expect(page.getByLabel('财务设置操作反馈')).toContainText('财务规则已初始化为默认方案')

  await page.goto(appUrl('/setting/finance?financeSettingProvider=mock&financeSettingMockState=error'))
  await expect(page.getByRole('alert')).toContainText('财务设置加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
