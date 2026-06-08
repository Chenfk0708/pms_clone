import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const hashPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL.replace(/\/$/, '')}${hashPath}` : hashPath
}

async function openCampInfoDetail(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'camp-info-detail-test-token')
    window.localStorage.setItem('pms.campInfoProvider', 'mock')
    window.localStorage.setItem('pms.campInfoMockMode', 'success')
    window.localStorage.setItem('pms.campInfoMockLatencyMs', '0')
  })
  await page.goto(appUrl('/InformationMaintenance/campInfo/detail?storeId=store-qianhai-001'), {
    waitUntil: 'domcontentloaded',
  })
}

test('/InformationMaintenance/campInfo/detail supports breadcrumb return and tab switching', async ({ page }) => {
  await openCampInfoDetail(page)

  await expect(page.locator('.camp-info-detail-breadcrumb')).toBeVisible()
  await expect(page.locator('.camp-info-detail-tabs button').first()).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.camp-info-detail-edit')).toBeVisible()
  await expect(page.locator('.camp-info-detail-facts')).toBeVisible()

  await page.locator('.camp-info-detail-tabs button').nth(1).click()
  await expect(page.locator('.camp-info-detail-tabs button').nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.camp-info-detail-room-list')).toBeVisible()

  await page.locator('.camp-info-detail-breadcrumb button').click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)
})
