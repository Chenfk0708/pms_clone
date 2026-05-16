import { expect, test, type Page } from '@playwright/test'

async function expectExpandedStates(pageRoute: string, states: string[], page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(pageRoute)

  const groupButtons = page.locator('.sidebar .sidebar-group-title[aria-expanded]')
  await expect(groupButtons).toHaveCount(states.length)
  for (const [index, state] of states.entries()) {
    await expect(groupButtons.nth(index)).toHaveAttribute('aria-expanded', state)
  }

  return groupButtons
}

test('sales and channel sidebars collapse inactive groups by default', async ({ page }) => {
  await expectExpandedStates('/mallManagement/hotelProduct', ['true'], page)
  await expect(page.locator('.sidebar-link[href="/mallManagement/hotelProduct"]')).toHaveClass(/is-active/)
  await expect(page.locator('.sidebar-link[href="/mallManagement/goodsManagement"]')).toBeVisible()

  const groupButtons = await expectExpandedStates('/channels/private', ['true'], page)
  await expect(page.locator('.sidebar-link[href="/channels/private"]')).toHaveClass(/is-active/)
  await expect(page.locator('.sidebar-link[href="/channels/private/program"]')).toBeVisible()
  await groupButtons.first().click()
  await expect(groupButtons.first()).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.sidebar-link[href="/channels/private/program"]')).toHaveCount(0)
})

test('scrm, radar, and distribution sidebars use the shared collapsible behavior', async ({ page }) => {
  let groupButtons = await expectExpandedStates('/scrm/memberCenter/level', ['false', 'false', 'true', 'false', 'false', 'false', 'false'], page)
  await expect(page.locator('.sidebar-link[href="/scrm/memberCenter/level"]')).toHaveClass(/is-active/)
  await expect(page.locator('.sidebar-link[href="/customer/list"]')).toHaveCount(0)
  await groupButtons.nth(1).click()
  await expect(page.locator('.sidebar-link[href="/customer/list"]')).toBeVisible()

  groupButtons = await expectExpandedStates('/channels/globalRadar/globalData', ['true'], page)
  await expect(page.locator('.sidebar-link[href="/channels/globalRadar/globalData"]')).toHaveClass(/is-active/)
  await groupButtons.first().click()
  await expect(groupButtons.first()).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.sidebar-link[href="/channels/globalRadar/globalSetting"]')).toHaveCount(0)

  await expectExpandedStates('/channels/distribution/distributionSecond', ['true'], page)
  await expect(page.locator('.sidebar-link[href="/channels/distribution/distributionSecond"]')).toHaveClass(/is-active/)
})

test('smart hotel, report, and settings sidebars open only the current section', async ({ page }) => {
  let groupButtons = await expectExpandedStates('/smartHotel/smartHardware/smartLook', ['false', 'true', 'false'], page)
  await expect(page.locator('.sidebar-link[href="/smartHotel/smartHardware/smartLook"]')).toHaveClass(/is-active/)
  await expect(page.locator('.sidebar-link[href="/smartHotel/smartHome"]')).toHaveCount(0)
  await groupButtons.first().click()
  await expect(page.locator('.sidebar-link[href="/smartHotel/smartHome"]')).toBeVisible()

  groupButtons = await expectExpandedStates('/statistics/report', ['true', 'false', 'false', 'false'], page)
  await expect(page.locator('.sidebar-link[href="/statistics/report"]')).toHaveClass(/is-active/)
  await expect(page.locator('.sidebar-link[href="/statistics/totalLedger"]')).toHaveCount(0)
  await groupButtons.nth(1).click()
  await expect(page.locator('.sidebar-link[href="/statistics/totalLedger"]')).toBeVisible()

  await expectExpandedStates('/InformationMaintenance/informationOverview', ['true', 'false', 'false'], page)
  await expect(page.locator('.sidebar-link[href="/InformationMaintenance/informationOverview"]')).toHaveClass(/is-active/)
  await expect(page.locator('.sidebar-link[href="/setting/role"]')).toHaveCount(0)
})
