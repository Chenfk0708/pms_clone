import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.removeItem('pms.staffList.mockState')
    window.localStorage.removeItem('pms.staffList.provider')
  })
})

test('/customer/staffList loads provider-backed subscription gate and opens scrm payment detail', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/staffList'))

  const contract = page.getByTestId('staff-list-contract')
  await expect(page.getByRole('status', { name: '企微员工列表加载中' })).toBeVisible()

  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-response-state', 'success')
  await expect(page.getByRole('link', { name: '企微员工列表' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '企微SCRM-员工管理' })).toBeVisible()
  await expect(page.getByText('实时获取企业微信员工，实现员工管理')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即开通' })).toBeVisible()
  await expect(page.getByText('限时免费')).toBeVisible()
  await expect(page.getByRole('heading', { name: '商品详情' })).toBeVisible()
  await expect(page.getByAltText('企微SCRM高效获客留存')).toBeVisible()

  await page.getByRole('button', { name: '立即开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '企微SCRM', level: 2 })).toBeVisible()
  await expect(page.getByText('购买信息')).toBeVisible()
  await expect(page.getByText('¥150.6')).toHaveCount(2)
  await expect(page.getByRole('button', { name: '立即购买' })).toBeVisible()
})

test('/customer/staffList exposes empty state from the mock provider', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.staffList.mockState', 'empty')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/staffList'))

  await expect(page.getByTestId('staff-list-contract')).toHaveAttribute('data-response-state', 'empty')
  await expect(page.getByRole('status', { name: '企微员工列表空态' })).toContainText('当前门店暂未配置企微员工管理订阅信息')
  await expect(page.getByRole('button', { name: '立即开通' })).toHaveCount(0)
})

test('/customer/staffList retries after mock provider failure', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.staffList.mockState', 'error')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/staffList'))

  await expect(page.getByTestId('staff-list-contract')).toHaveAttribute('data-response-state', 'error')
  await expect(page.getByRole('alert', { name: '企微员工列表错误态' })).toContainText('企微员工管理订阅信息加载失败')

  await page.getByRole('button', { name: '重试' }).click()

  await expect(page.getByTestId('staff-list-contract')).toHaveAttribute('data-response-state', 'success')
  await expect(page.getByRole('button', { name: '立即开通' })).toBeVisible()
})
