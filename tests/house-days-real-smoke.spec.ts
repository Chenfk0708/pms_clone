import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('house days renders today orders from real roomStatusesToday data', async ({ page, request }) => {
  const token = await loginViaGateway(request)

  await page.setViewportSize({ width: 1600, height: 960 })
  await installRealSession(page, token)
  await page.goto(appUrl('/#/houseManage/days'))

  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('.day-room-area')).toContainText('Real Guest C', { timeout: 15_000 })
  await expect(page.locator('.day-room-area')).toContainText('Real Guest D', { timeout: 15_000 })
  await expect(page.locator('.day-filter-panel')).toContainText('预抵')
})
