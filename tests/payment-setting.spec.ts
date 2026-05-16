import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotPath = path.resolve(
  __dirname,
  '../artifacts/screenshots/shezhi--tongyong-shezhi--zhifu-fangshi-shezhi/default-clone-route.png',
)
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/paymentSetting renders captured payment method settings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/paymentSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '支付方式设置' })).toHaveClass(/is-active/)
  const sidebar = page.locator('.sidebar')
  await expect(sidebar.getByRole('heading', { name: '信息维护' })).toBeVisible()
  await expect(sidebar.getByRole('heading', { name: '企业设置' })).toBeVisible()
  await expect(sidebar.getByRole('heading', { name: '通用设置' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: '信息概览' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: '权限设置' })).toHaveCount(0)
  await expect(page.getByText('系统默认支付方式不支持编辑和删除，可直接拖动调整排序。')).toBeVisible()
  await expect(page.getByRole('heading', { name: '已启用支付方式', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '已停用支付方式', level: 2 })).toBeVisible()
  await expect(page.getByRole('button', { name: '新增' })).toBeVisible()

  const enabledGrid = page.getByLabel('已启用支付方式列表')
  await expect(enabledGrid.getByRole('article')).toHaveCount(11)
  await expect(enabledGrid.getByText('平台代收')).toBeVisible()
  await expect(enabledGrid.getByText('微信')).toBeVisible()
  await expect(enabledGrid.getByText('支付宝')).toBeVisible()
  await expect(enabledGrid.getByText('其他')).toBeVisible()
  await expect(enabledGrid.getByText('现金')).toBeVisible()
  await expect(enabledGrid.getByText('银行转帐')).toBeVisible()
  await expect(enabledGrid.getByText('信用卡')).toBeVisible()
  await expect(enabledGrid.getByText('通联')).toBeVisible()
  await expect(enabledGrid.getByText('储值金')).toBeVisible()
  await expect(enabledGrid.getByText('暂未收款')).toBeVisible()
  await expect(enabledGrid.getByText('现场收款')).toBeVisible()
  await expect(enabledGrid.getByText('默认')).toHaveCount(11)

  await page.getByRole('button', { name: '新增' }).click()
  await expect(page.getByRole('dialog', { name: '新增支付方式' })).toBeVisible()
  await expect(page.getByLabel('支付方式名称')).toBeVisible()
  await page.getByRole('button', { name: '取消' }).click()
  await expect(page.getByRole('dialog', { name: '新增支付方式' })).toHaveCount(0)

  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
  await expect(page.locator('.chat-dock-launcher')).toBeVisible()

  await page.screenshot({ path: screenshotPath, fullPage: true })
})
