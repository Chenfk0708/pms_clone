import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openBrandProgram(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.brandWebsiteProvider', 'mock')
    window.localStorage.setItem('pms.brandWebsiteMockMode', 'success')
  })
  await page.goto(appUrl('/channels/private/program'))
  await collapseChatDock(page)
}

async function collapseChatDock(page: import('@playwright/test').Page) {
  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }
}

test('/channels/private/program reuses decorate workspace with the brand mini program shell', async ({ page }) => {
  await openBrandProgram(page)

  await expect(page).toHaveURL(/\/channels\/private\/program$/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.brand-module-menu .is-active')).toHaveAttribute('href', '/channels/private/program')
  await expect(page.locator('.brand-module-menu .is-active')).toContainText('品牌小程序')
  await expect(page.getByTestId('brand-program-contract')).toContainText('"traceId":"mock-ota--siyu--pinpai-guanwang-list-001"')

  await expect(page.locator('.brand-toolbar')).toHaveCount(0)
  await expect(page.locator('.brand-metric-strip')).toHaveCount(0)
  await expect(page.locator('.brand-page-nav h2')).toHaveText('页面导航')
  await expect(page.locator('.brand-page-nav')).toContainText('模板市场')
  await expect(page.locator('.brand-page-nav')).toContainText('店铺主页')
  await expect(page.locator('.brand-page-nav')).toContainText('个人中心')
  await expect(page.locator('.brand-page-nav')).toContainText('领券活动')
  await expect(page.locator('.brand-template-market .brand-template')).toHaveCount(4)

  await page.locator('.brand-template-market .brand-template').nth(1).locator('button').first().click()
  await expect(page.locator('.brand-template-market .brand-template').nth(1).locator('button').first()).toContainText('已使用')

  await page.locator('.brand-template-market .brand-template').nth(1).locator('.brand-secondary-button').click()
  await expect(page.locator('[role="dialog"][aria-label="模板详情"]')).toContainText('酒店主题模板')
  await page.locator('[role="dialog"][aria-label="模板详情"] header button').click()

  await page.locator('.brand-page-nav button').nth(1).click()
  await expect(page.locator('.brand-detail-panel h2')).toHaveText('店铺主页')

  await page.locator('.brand-page-nav button').nth(2).click()
  await expect(page.locator('.brand-detail-panel h2')).toHaveText('个人中心')

  await page.locator('.brand-page-nav button').nth(3).click()
  await expect(page.locator('.brand-coupon-table')).toBeVisible()
})
