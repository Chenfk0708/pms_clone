import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/houseManage/days reuses month order hover and drawer interactions for today bookings', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 960 })
  await page.goto(appUrl('/houseManage/days'))

  const bookingCard = page.locator('.day-room-card[data-tone]').filter({ hasText: '赵晨' }).first()
  await expect(bookingCard).toBeVisible()

  await bookingCard.hover()
  const popover = page.locator('.month-order-popover')
  await expect(popover).toBeVisible()
  await expect(popover).toContainText('天落大床电竞套间-1206')
  await expect(popover).toContainText('预订人: 赵晨')
  await expect(popover).toContainText('手机号: 13700000002')
  await expect(popover).toContainText('渠道来源: 飞猪旅行')
  await expect(popover).toContainText('备注: 高楼层偏好')

  await bookingCard.click()
  const drawer = page.getByRole('dialog', { name: '订单详情' })
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('赵晨')
  await expect(drawer).toContainText('飞猪旅行')
  await expect(drawer).toContainText('天落大床电竞套间（1206）')
  await expect(drawer).toContainText('¥428.00')
  await expect(drawer).toContainText('房费(减佣):¥398.00')
})
