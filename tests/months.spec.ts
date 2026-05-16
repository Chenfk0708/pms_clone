import { expect, test } from '@playwright/test'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_START_OFFSET_DAYS = -3

function monthWindowDate(offsetFromWindowStart: number) {
  const today = new Date()
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return new Date(localMidnight.getTime() + (WINDOW_START_OFFSET_DAYS + offsetFromWindowStart) * DAY_MS)
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function formatFullDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

const COLLAPSE_TEXT = '\u5168\u90e8\u6536\u8d77'
const HUDSON_API = 'https://hudson-prod.localhome.cn'

function jsonResponse(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

async function mockMonthStatusApis(page, requestedPaths: string[] = []) {
  await page.route(`${HUDSON_API}/**`, async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    requestedPaths.push(pathname)

    if (pathname === '/roomStatuses/rooms/get') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            isSingleInventory: 0,
            list: [
              {
                roomCategoryId: 'cat-interface',
                roomCategoryName: '接口房型',
                rooms: [{ roomId: 'room-interface', roomName: '接口房间' }],
              },
            ],
          },
        }),
      )
      return
    }

    if (pathname === '/roomStatuses/orderDetails/get') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            list: [
              {
                roomCategoryId: 'cat-interface',
                roomId: 'room-interface',
                date: formatIsoDate(monthWindowDate(3)),
                guestName: '接口客人',
                channelName: '接口渠道',
                roomFee: 188,
                totalIncome: 199,
                stayRange: '2026.05.16-05.17',
                remark: '接口备注',
                orderId: 'interface-order',
              },
            ],
            orderArrangementInfos: [],
          },
        }),
      )
      return
    }

    if (pathname === '/roomStatuses/dailyMonitor/get') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            list: [{ date: formatIsoDate(monthWindowDate(3)), remain: '余1间' }],
          },
        }),
      )
      return
    }

    if (pathname === '/roomStatuses/inv/get') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            list: [{ roomCategoryId: 'cat-interface', date: formatIsoDate(monthWindowDate(3)), inventory: 1 }],
          },
        }),
      )
      return
    }

    if (pathname.startsWith('/roomStatuses/')) {
      await route.fulfill(jsonResponse({ success: true, data: { list: [] } }))
      return
    }

    await route.fulfill(jsonResponse({ success: true, data: {} }))
  })
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

test('month room status page shows filters and calendar matrix', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  const firstWindowDay = formatMonthDay(monthWindowDate(0))
  const today = formatMonthDay(monthWindowDate(3))

  await expect(page.locator('.segmented button').first()).toBeVisible()
  await expect(page.locator('.month-toolbar__actions input')).toBeVisible()
  await expect(page.locator('.month-outline-action')).toHaveCount(2)
  await expect(page.locator('.month-store-chip')).toBeVisible()
  await expect(page.getByText(today).first()).toBeVisible()
  await expect(page.getByTestId('month-date-column')).toHaveCount(33)
  await expect(page.getByTestId('month-date-column').first()).toContainText(firstWindowDay)
  await expect(page.getByTestId('month-grid')).toBeVisible()
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)
  await expect(page.getByTestId('month-grid')).toContainText('房间1')
})

test('month room status page loads core grid from real request layer', async ({ page }) => {
  const requestedPaths: string[] = []
  await mockMonthStatusApis(page, requestedPaths)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months?campId=camp-interface')

  await expect(page.getByText('接口房型')).toBeVisible()
  await expect(page.getByText('接口房间')).toBeVisible()
  await expect(page.getByText('接口客人')).toBeVisible()
  await expect(page.getByText('接口渠道')).toBeVisible()
  await expect(page.getByText('¥188')).toBeVisible()
  await expect(page.getByText('陈家辉')).toHaveCount(0)

  expect(requestedPaths).toEqual(
    expect.arrayContaining([
      '/roomStatuses/rooms/get',
      '/roomStatuses/occ/get',
      '/roomStatuses/inv/get',
      '/roomStatuses/block/get',
      '/roomStatuses/dailyMonitor/get',
      '/roomStatuses/redDot/get',
      '/roomStatuses/orderDetails/get',
    ]),
  )
})

test('month room status page exposes real API blockers instead of static fallback data', async ({ page }) => {
  await page.route(`${HUDSON_API}/**`, async (route) => {
    await route.fulfill(jsonResponse({ success: false, errorMsg: '接口权限不足' }))
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months?campId=camp-interface')

  await expect(page.getByRole('alert')).toContainText('接口权限不足')
  await expect(page.getByRole('button', { name: '重试真实请求' })).toBeVisible()
  await expect(page.getByText('陈家辉')).toHaveCount(0)
})

test('month room status page keeps each room number directly under its room type', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  const rows = page.locator('.month-board__row')
  await expect(rows).toHaveCount(8)
  await expect(rows.nth(0)).toHaveAttribute('data-row-kind', 'type')
  await expect(rows.nth(1)).toHaveAttribute('data-row-kind', 'room')
  await expect(rows.nth(0).locator('.month-board__room')).toContainText('顶层套房')
  await expect(rows.nth(1).locator('.month-board__room')).toHaveText('房间1')
  await expect(rows.nth(2)).toHaveAttribute('data-row-kind', 'type')
  await expect(rows.nth(3)).toHaveAttribute('data-row-kind', 'room')
})

test('month room status page uses captured compact target chrome and navigates to day status', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await expect(page.getByRole('button', { name: '渠道' })).toHaveCount(0)
  await expect(page.locator('.month-icon-button')).toHaveCount(0)

  const headerBox = await page.locator('.month-board__head').boundingBox()
  expect(headerBox?.height).toBeLessThanOrEqual(58)

  await page.getByRole('button', { name: '日房态' }).click()
  await expect(page).toHaveURL(/\/houseManage\/days$/)
  await expect(page.getByRole('button', { name: '日房态' })).toHaveClass(/is-active/)
})

test('month room status page matches measured target calendar chrome', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  const today = monthWindowDate(3)
  const segmentedBox = await page.locator('.month-toolbar .segmented').boundingBox()
  expect(segmentedBox?.height).toBe(32)
  await expect(page.locator('.month-toolbar .segmented')).toHaveCSS('background-color', 'rgb(241, 243, 248)')

  const activeTabBox = await page.locator('.month-toolbar .segmented button.is-active').boundingBox()
  expect(activeTabBox?.width).toBeLessThanOrEqual(68)
  await expect(page.locator('.month-toolbar .segmented button.is-active')).toHaveCSS('border-top-width', '0px')

  await expect(page.locator('.month-calendar-title')).toContainText(formatFullDate(today))
  await expect(page.locator('.month-calendar-title')).toContainText(COLLAPSE_TEXT)

  const boardScrollLeft = await page.getByTestId('month-grid').evaluate((node) => Math.round(node.scrollLeft))
  expect(boardScrollLeft).toBeGreaterThanOrEqual(180)

  const boardBox = await page.getByTestId('month-grid').boundingBox()
  expect(boardBox?.height).toBeGreaterThanOrEqual(680)

  const selectedDateBox = await page.getByTestId('month-date-column').nth(3).boundingBox()
  expect(selectedDateBox?.x).toBeGreaterThanOrEqual(430)
  expect(selectedDateBox?.x).toBeLessThanOrEqual(455)
})

test('month room status page keeps booking content inside target-sized cells', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  const bookingCell = page.locator('.month-cell').filter({ has: page.locator('b') }).first()
  const amount = bookingCell.locator('em')
  const backupBadge = bookingCell.locator('b')

  const [cellBox, amountBox, badgeBox] = await Promise.all([
    bookingCell.boundingBox(),
    amount.boundingBox(),
    backupBadge.boundingBox(),
  ])

  expect(cellBox).not.toBeNull()
  expect(amountBox).not.toBeNull()
  expect(badgeBox).not.toBeNull()
  expect(Math.round((cellBox?.y ?? 0) + (cellBox?.height ?? 0) - ((amountBox?.y ?? 0) + (amountBox?.height ?? 0)))).toBeGreaterThanOrEqual(0)
  expect(Math.round(badgeBox?.width ?? 0)).toBeLessThanOrEqual(18)
  expect(Math.round(badgeBox?.height ?? 0)).toBeLessThanOrEqual(18)
  await expect(bookingCell.locator('strong').first()).toHaveCSS('font-size', '12px')
  await expect(amount).toHaveCSS('font-size', '12px')
})

test('month room status page matches target store and filter controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  const storeSwitchBox = await page.locator('.month-store-switch').boundingBox()
  expect(Math.round(storeSwitchBox?.width ?? 0)).toBe(191)

  const secondStore = page.locator('.month-store-switch .chip').nth(1)
  await expect(secondStore).toHaveCSS('overflow-x', 'hidden')
  await expect(secondStore).toHaveCSS('white-space', 'nowrap')

  const storeSettingsBox = await page.locator('.month-store-settings').boundingBox()
  expect(Math.round(storeSettingsBox?.width ?? 0)).toBe(32)
  expect(Math.round(storeSettingsBox?.height ?? 0)).toBe(28)

  const roomFilterBox = await page.locator('.month-filter-menu').first().boundingBox()
  expect(Math.round(roomFilterBox?.x ?? 0)).toBeGreaterThanOrEqual(400)
  expect(Math.round(roomFilterBox?.x ?? 0)).toBeLessThanOrEqual(406)

  const searchWrapBox = await page.locator('.month-filter-search-wrap').boundingBox()
  expect(Math.round(searchWrapBox?.width ?? 0)).toBeLessThanOrEqual(132)
  await expect(page.locator('.month-filter-search')).toHaveCSS('font-size', '12px')

  const searchButtonBox = await page.locator('.month-filter-search-button').boundingBox()
  expect(Math.round(searchButtonBox?.width ?? 0)).toBe(26)
  expect(Math.round(searchButtonBox?.height ?? 0)).toBe(26)
})

test('month room status page shows target order popover on booking hover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.getByText('陈家辉').hover()

  const popover = page.locator('.month-order-popover')
  await expect(popover).toBeVisible()
  await expect(popover).toContainText('总裁套间（桑拿浴缸露台电竞麻将）-房间1')
  await expect(popover).toContainText('预订人: 陈家辉')
  await expect(popover).toContainText('手机号: -')
  await expect(popover).toContainText('入离时间: 2026.05.18-05.20')
  await expect(popover).toContainText('渠道来源: 飞猪淘酒店')
  await expect(popover).toContainText('房费(减佣): ¥597.6')
  await expect(popover).toContainText('订单总收入: ¥664')
  await expect(popover).toContainText('备注: -')

  const box = await popover.boundingBox()
  const bookingBox = await page.locator('.tone-booking-gold').filter({ hasText: '陈家辉' }).boundingBox()
  expect(bookingBox).not.toBeNull()
  expect(box?.x ?? 0).toBeGreaterThan((bookingBox?.x ?? 0) + (bookingBox?.width ?? 0))
  expect(Math.round(box?.width ?? 0)).toBeGreaterThanOrEqual(296)
  expect(Math.round(box?.width ?? 0)).toBeLessThanOrEqual(320)
  expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(220)
  expect(Math.round(box?.height ?? 0)).toBeLessThanOrEqual(245)
  await expect(popover).toHaveCSS('border-radius', '8px')
  await expect(popover).toHaveCSS('font-size', '14px')
})

test('month room status page opens target right order drawer and closes from blank area', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.locator('.tone-booking-gold').filter({ hasText: '陈家辉' }).click()

  const drawer = page.locator('.month-order-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('订单详情')
  await expect(drawer).toContainText('全日房')
  await expect(drawer).toContainText('订单信息')
  await expect(drawer).toContainText('渠道信息')
  await expect(drawer).toContainText('操作日志')
  await expect(drawer).toContainText('陈家辉')
  await expect(drawer).toContainText('渠道单号：5116035240226051843')
  await expect(drawer).toContainText('登记入住人')
  await expect(drawer).toContainText('房费(减佣):¥597.60')
  await expect(drawer).toContainText('订单总收入:¥664.00')
  await expect(drawer).toContainText('更多操作')
  await expect(drawer).toContainText('信用住结账')

  const drawerBox = await drawer.boundingBox()
  expect(drawerBox).not.toBeNull()
  expect(Math.round((drawerBox?.x ?? 0) + (drawerBox?.width ?? 0))).toBeGreaterThanOrEqual(1436)
  expect(Math.round(drawerBox?.width ?? 0)).toBeGreaterThanOrEqual(600)
  expect(Math.round(drawerBox?.width ?? 0)).toBeLessThanOrEqual(700)

  await page.getByTestId('month-grid').click({ position: { x: 260, y: 150 } })
  await expect(drawer).toHaveCount(0)
})

test('month room status page supports key matrix interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  const filterChip = page.locator('.month-toolbar__filters .chip').first()
  await filterChip.click()
  await expect(filterChip).toHaveAttribute('aria-pressed', 'true')

  const roomSearch = page.locator('.month-toolbar__filters input')
  await roomSearch.fill('not-found')
  await expect(page.locator('.month-board__row')).toHaveCount(0)
  await roomSearch.fill('')

  await page.locator('.month-calendar-title button').click()
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)
  await expect(page.getByTestId('month-room-row')).toHaveCount(0)

  await page.locator('.month-calendar-title button').click()
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)

  await page.locator('.tone-booking-blue').first().click()
  await expect(page.locator('.month-order-drawer')).toBeVisible()
  await page.getByRole('button', { name: '关闭订单详情' }).click()
  await expect(page.locator('.month-order-drawer')).toHaveCount(0)

  await page.locator('.month-outline-action').first().click()
  await page.getByRole('menuitem', { name: '批量设脏' }).click()
  await expect(page.getByRole('status')).toBeVisible()
})

test('month room status page supports toolbar menus and date actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.locator('.month-settings > button').click()
  await expect(page.locator('.month-settings__menu')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '图例说明' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '房态设置' })).toBeVisible()
  await page.getByRole('menuitem', { name: '房态设置' }).click()
  await expect(page.getByRole('status')).toBeVisible()
  await expect(page.locator('.month-settings__menu')).toHaveCount(0)

  await page.locator('.month-toolbar__actions button').first().click()
  await expect(page.getByRole('status')).toBeVisible()

  await page.getByTestId('month-date-column').nth(4).click()
  await expect(page.locator('.month-calendar-title')).toContainText(COLLAPSE_TEXT)
  await expect(page.getByTestId('month-date-column').nth(4)).toHaveAttribute('aria-current', 'date')
})

test('month room status page supports batch selection and dismissible overlays', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.locator('.month-settings > button').click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.month-settings__menu')).toHaveCount(0)

  await page.locator('.tone-booking-blue').first().click()
  await expect(page.locator('[role="dialog"]')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('[role="dialog"]')).toHaveCount(0)

  await page.locator('.tone-booking-blue').first().click()
  await expect(page.locator('.month-order-drawer')).toBeVisible()
  await page.getByTestId('month-grid').click({ position: { x: 260, y: 150 } })
  await expect(page.locator('.month-order-drawer')).toHaveCount(0)

  await page.locator('.month-outline-action').first().click()
  await expect(page.getByRole('menu', { name: '批量设脏/净' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '批量设净' })).toBeVisible()
  await page.getByRole('menuitem', { name: '批量设脏' }).click()
  await expect(page.locator('.month-batch-toolbar')).toBeVisible()
  await page.getByTestId('month-selectable-cell').nth(0).click()
  await page.getByTestId('month-selectable-cell').nth(1).click()
  await expect(page.locator('[data-testid="month-selectable-cell"][aria-selected="true"]')).toHaveCount(2)
  await page.locator('.month-batch-toolbar button').first().click()
  await expect(page.getByRole('status')).toHaveAttribute('data-batch-result', 'dirty')
  await expect(page.locator('.month-batch-toolbar')).toHaveCount(0)
})

test('month room status page supports outside dismissal and open-close batch apply', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.locator('.month-settings > button').click()
  await page.getByTestId('month-grid').click({ position: { x: 260, y: 150 } })
  await expect(page.locator('.month-settings__menu')).toHaveCount(0)

  await page.locator('.month-outline-action').nth(1).click()
  await expect(page.getByRole('menu', { name: '批量开/关房' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '批量关房' })).toBeVisible()
  await page.getByRole('menuitem', { name: '批量开房' }).click()
  await page.getByTestId('month-selectable-cell').nth(0).click()
  await page.getByTestId('month-selectable-cell').nth(0).click()
  await expect(page.locator('[data-testid="month-selectable-cell"][aria-selected="true"]')).toHaveCount(0)

  await page.getByTestId('month-selectable-cell').nth(0).click()
  await page.locator('.month-batch-toolbar button').first().click()
  await expect(page.getByRole('status')).toHaveAttribute('data-batch-result', 'open')
  await expect(page.locator('.month-batch-toolbar')).toHaveCount(0)
})
