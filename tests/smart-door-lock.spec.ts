import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.smartDoorLock.provider', 'mock')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
})

test('/smartHotel/smartHardware/smartLook renders provider-driven smart door lock workspace', async ({ page }) => {
  await page.goto(appUrl('/smartHotel/smartHardware/smartLook'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav-link[href="/smartHotel/smartHome"]')).toHaveClass(/is-active/)
  await expect(page.locator('.sidebar-link[href="/smartHotel/smartHardware/smartLook"]')).toHaveClass(/is-active/)

  const shell = page.locator('.smart-door-lock-page')
  await expect(shell).toHaveAttribute('data-provider', 'mock')
  await expect(shell).toHaveAttribute('data-state', 'ready')

  const contract = page.getByTestId('smart-door-lock-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-active-tab', 'password')

  await expect(page.getByRole('tab', { name: '密码门锁' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '房卡门锁' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByRole('heading', { name: '已绑定账号' })).toBeVisible()
  await expect(page.getByText('路客 TS5 主店门锁矩阵')).toBeVisible()
  await expect(page.getByText('同步到 26 间房 / 最近同步：2026-05-19 16:03')).toBeVisible()
  await expect(page.getByRole('button', { name: '同步记录 路客 TS5 主店门锁矩阵' })).toBeVisible()
  await expect(page.getByRole('button', { name: '前往路客商城' })).toBeVisible()
  await expect(page.getByRole('status', { name: '智能门锁操作反馈' })).toContainText('智能门锁数据已就绪')
})

test('/smartHotel/smartHardware/smartLook supports card lock login and account binding feedback', async ({ page }) => {
  await page.goto(appUrl('/smartHotel/smartHardware/smartLook'))

  await page.getByRole('tab', { name: '房卡门锁' }).click()
  await expect(page.getByTestId('smart-door-lock-service-contract')).toHaveAttribute('data-active-tab', 'card')
  await expect(page.getByText('请选择门锁品牌添加账号')).toBeVisible()

  await page.getByRole('button', { name: '添加慧享佳账号' }).click()

  const loginDialog = page.getByRole('dialog', { name: '门锁登录' })
  await expect(loginDialog).toBeVisible()
  await page.getByLabel('凡单/慧享佳账号').fill('hxj-bridge')
  await page.getByLabel('凡单/慧享佳密码').fill('hxj-password-001')
  await page.getByRole('button', { name: '提交' }).click()

  await expect(loginDialog).toHaveCount(0)
  await expect(page.getByRole('status', { name: '智能门锁操作反馈' })).toContainText('慧享佳账号已绑定')
  await expect(page.getByText('慧享佳房卡联动')).toBeVisible()
})

test('/smartHotel/smartHardware/smartLook routes unopened card system purchase flow to locals mall', async ({ page }) => {
  await page.goto(appUrl('/smartHotel/smartHardware/smartLook'))

  await page.getByRole('tab', { name: '房卡门锁' }).click()
  await page.getByRole('button', { name: '添加门卡管理系统账号' }).click()

  const confirmDialog = page.getByRole('dialog', { name: '门卡管理系统未开通' })
  await expect(confirmDialog).toContainText('您尚未开通门卡管理系统，请开通后再使用')
  await page.getByRole('button', { name: '立即开通' }).click()

  await expect(page).toHaveURL(/\/version\/localsMall$/)
})

test('/smartHotel/smartHardware/smartLook keeps a business-ready empty state', async ({ page }) => {
  await page.goto(appUrl('/smartHotel/smartHardware/smartLook?mockState=empty'))

  const shell = page.locator('.smart-door-lock-page')
  await expect(shell).toHaveAttribute('data-provider', 'mock')
  await expect(shell).toHaveAttribute('data-state', 'empty')
  await expect(page.getByText('当前门店还没有已绑定的门锁账号').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '前往智能硬件商城' }).first()).toBeVisible()
})

test('/smartHotel/smartHardware/smartLook exposes retryable provider errors', async ({ page }) => {
  await page.goto(appUrl('/smartHotel/smartHardware/smartLook?mockState=error'))

  const shell = page.locator('.smart-door-lock-page')
  await expect(shell).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert', { name: '智能门锁加载失败' })).toContainText('智能门锁数据加载失败，请稍后重试')

  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/smartLook$/)
  await expect(page.getByRole('heading', { name: '已绑定账号' })).toBeVisible()
})
