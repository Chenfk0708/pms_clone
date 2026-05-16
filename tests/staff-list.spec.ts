import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/customer/staffList matches captured staff subscription gate', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/staffList'))

  await expect(page.getByRole('link', { name: '企微员工列表' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '企微SCRM-员工管理' })).toBeVisible()
  await expect(page.getByText('实时获取企业微信员工，实现员工管理')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即开通' })).toBeVisible()
  await expect(page.getByText('限时免费')).toBeVisible()
  await expect(page.getByRole('heading', { name: '商品详情' })).toBeVisible()
  await expect(page.getByAltText('企微SCRM高效获客留存')).toBeVisible()

  await page.getByRole('button', { name: '立即开通' }).click()
  await expect(page.getByRole('heading', { name: '企微SCRM' })).toBeVisible()
  await expect(page.getByText('购买信息')).toBeVisible()
  await expect(page.getByText('¥150.6')).toHaveCount(2)
  await expect(page.getByRole('button', { name: '立即购买' })).toBeVisible()
})
