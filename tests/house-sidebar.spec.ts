import { expect, test } from '@playwright/test'

test('house management sidebar defaults to the current group only', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  const sidebar = page.locator('.sidebar')
  const groupButtons = sidebar.locator('.sidebar-group-title[aria-expanded]')

  await expect(groupButtons).toHaveCount(3)
  await expect(groupButtons.nth(0)).toHaveAttribute('aria-expanded', 'true')
  await expect(groupButtons.nth(1)).toHaveAttribute('aria-expanded', 'false')
  await expect(groupButtons.nth(2)).toHaveAttribute('aria-expanded', 'false')
  await expect(sidebar.locator('.sidebar-link[href="/houseManage/months"]')).toHaveClass(/is-active/)
  await expect(sidebar.locator('.sidebar-link[href="/houseManage/houseCale"]')).toHaveCount(0)
  await expect(sidebar.locator('.sidebar-link[href="/cleanManage/cleanTask"]')).toHaveCount(0)
  await expect(sidebar.locator('.sidebar-link[href="/houseManage/houseStatus"]')).toBeVisible()

  await groupButtons.nth(1).click()
  await expect(groupButtons.nth(1)).toHaveAttribute('aria-expanded', 'true')
  await expect(sidebar.locator('.sidebar-link[href="/houseManage/houseCale"]')).toBeVisible()
})

test('price page sidebar highlights central price and collapses inactive groups', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/houseCale')

  const sidebar = page.locator('.sidebar')
  const groupButtons = sidebar.locator('.sidebar-group-title[aria-expanded]')

  await expect(groupButtons).toHaveCount(3)
  await expect(groupButtons.nth(0)).toHaveAttribute('aria-expanded', 'false')
  await expect(groupButtons.nth(1)).toHaveAttribute('aria-expanded', 'true')
  await expect(groupButtons.nth(2)).toHaveAttribute('aria-expanded', 'false')
  await expect(sidebar.locator('.sidebar-link[href="/houseManage/houseCale"]')).toHaveClass(/is-active/)
  await expect(sidebar.locator('.sidebar-link[href="/cleanManage/cleanLog"]')).toHaveCount(0)
})
