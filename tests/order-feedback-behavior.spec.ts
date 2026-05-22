import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/mallManagement/orderManagement hides the initial presale order success banner', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/orderManagement'))

  await expect(page.locator('.presale-order-source')).toHaveCount(0)
})

test('/mallManagement/hotelPackageOrder hides the initial hotel package success banner', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/hotelPackageOrder'))

  await expect(page.locator('.presale-order-notice')).toHaveCount(0)
})

test('/mallManagement/verificationManagement shows action feedback as auto-dismiss toast', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/verificationManagement'))

  await page.locator('.card-verify-entry input').fill('LK20260518002')
  await page.locator('.card-verify-entry button').first().click()

  const toast = page.locator('.card-verify-toast')
  await expect(toast).toContainText('核销成功')
  await expect(toast).toHaveCSS('position', 'fixed')

  await page.locator('.card-verify-records__head button').click()
  await expect(toast).toContainText('导出任务已创建')

  await page.locator('.card-verify-secondary').click()
  await expect(toast).toContainText('核销记录已更新')

  await page.locator('.card-verify-pagination button').click()
  await expect(toast).toContainText('已经是最后一页')
  await expect(toast).toHaveCount(0, { timeout: 4000 })
})

test('/mallManagement/verificationManagement shows validation feedback as auto-dismiss toast', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/verificationManagement'))

  await page.locator('.card-verify-entry button').first().click()

  const toast = page.locator('.card-verify-toast--error')
  await expect(toast).toContainText('请输入卡券码')
  await expect(toast).toHaveCSS('position', 'fixed')
  await expect(toast).toHaveCount(0, { timeout: 4000 })
})
