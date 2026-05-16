import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartHardware/smartLook matches captured smart door lock default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/smartLook'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav-link[href="/smartHotel/smartHome"]')).toHaveClass(/is-active/)
  await expect(page.locator('.sidebar-link[href="/smartHotel/smartHardware/smartLook"]')).toHaveClass(/is-active/)

  await expect(page.getByRole('tab', { name: '密码门锁' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '房卡门锁' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByText('请选择门锁品牌添加账号')).toBeVisible()

  const brandGrid = page.getByLabel('门锁品牌列表')
  for (const brand of ['通通锁', '科技侠', '果加', '火河', '国民锁', '慧享佳门锁', '优特', '鹿客/云丁']) {
    await expect(brandGrid.getByRole('button', { name: `添加${brand}账号` })).toBeVisible()
  }

  await expect(brandGrid.getByText('路客商城')).toBeVisible()
  await expect(brandGrid.getByRole('button', { name: '+ 加购门锁' })).toBeVisible()
  await expect(page.locator('.smart-lock-chat-button')).toHaveCount(0)
  await expect(page.locator('.chat-dock')).toBeVisible()
})

test('/smartHotel/smartHardware/smartLook supports tab and account actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/smartLook'))

  await page.getByRole('button', { name: '添加通通锁账号' }).click()
  await expect(page.getByRole('dialog', { name: '添加通通锁账号' })).toBeVisible()
  await expect(page.getByText('账号名称')).toBeVisible()
  await expect(page.getByText('登录账号')).toBeVisible()
  await page.getByRole('button', { name: '取消' }).click()

  await page.getByRole('tab', { name: '房卡门锁' }).click()
  await expect(page.getByRole('tab', { name: '房卡门锁' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('请选择房卡门锁品牌添加账号')).toBeVisible()

  await page.getByRole('button', { name: '+ 加购门锁' }).click()
  await expect(page.getByRole('status')).toContainText('已打开路客商城入口')
})
