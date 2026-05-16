import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/sidebarPreview matches captured chat toolbar subscription page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '聊天工具栏' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '企微SCRM-聊天工具栏' })).toBeVisible()
  await expect(page.getByText('聊天工具栏可实时查看客户资料、偏好与历史订单')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即开通' })).toBeVisible()
  await expect(page.getByText('限时免费')).toBeVisible()
  await expect(page.getByRole('region', { name: '商品详情' })).toBeVisible()
  await expect(page.locator('.scrm-sidebar-card__images img')).toHaveCount(3)
  await expect(page.locator('.chat-dock')).toBeVisible()

  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock-launcher')).toBeVisible()
  await page.locator('.chat-dock-launcher').click()
  await expect(page.locator('.chat-dock')).toBeVisible()

  await page.getByRole('button', { name: '立即开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail/)
})
