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

async function mockMonthStatusApis(page, requestedPaths: string[] = [], variant: 'target' | 'api' = 'target') {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.houseMonthsProvider', 'real')
  })

  const categories =
    variant === 'api'
      ? [
          {
            roomCategoryId: 'cat-interface',
            roomCategoryName: 'API Room Type',
            rooms: [{ roomId: 'room-interface', roomName: 'API Room' }],
          },
        ]
      : [
          {
            roomCategoryId: 'cat-top',
            roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
            rooms: [{ roomId: 'room-top-1', roomName: '房间1' }],
          },
          {
            roomCategoryId: 'cat-president',
            roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
            rooms: [{ roomId: 'room-president-1', roomName: '房间1' }],
          },
          {
            roomCategoryId: 'cat-sky',
            roomCategoryName: '天落大床电竞套间',
            rooms: [{ roomId: 'room-sky-1', roomName: '房间1' }],
          },
          {
            roomCategoryId: 'cat-movie',
            roomCategoryName: '观影大床房',
            rooms: [{ roomId: 'room-movie-1', roomName: '房间1' }],
          },
        ]
  const orderRows =
    variant === 'api'
      ? [
          {
            roomCategoryId: 'cat-interface',
            roomId: 'room-interface',
            date: formatIsoDate(monthWindowDate(3)),
            guestName: 'API Guest',
            channelName: 'API Channel',
            roomFee: 188,
            totalIncome: 199,
            stayRange: '2026.05.16-05.17',
            remark: 'API Remark',
            orderId: 'interface-order',
          },
        ]
      : [
          {
            roomCategoryId: 'cat-president',
            roomId: 'room-president-1',
            date: formatIsoDate(monthWindowDate(6)),
            guestName: '陈家辉',
            channelName: '飞猪淘酒店',
            roomFee: 597.6,
            totalIncome: 664,
            liveStatus: '待入住',
            stayRange: '2026.05.18-05.20',
            orderId: 'target-order',
          },
          {
            roomCategoryId: 'cat-president',
            roomId: 'room-president-1',
            date: formatIsoDate(monthWindowDate(3)),
            guestName: '刘翻红',
            channelName: '携程',
            roomFee: 285.44,
            totalIncome: 285.44,
            liveStatus: '入住中',
            hasRemark: true,
          },
          {
            roomCategoryId: 'cat-movie',
            roomId: 'room-movie-1',
            date: formatIsoDate(monthWindowDate(5)),
            guestName: '张张',
            channelName: '携程',
            roomFee: 163.94,
            totalIncome: 163.94,
            liveStatus: '已退房',
            hasRemark: true,
          },
        ]

  await page.route(`${HUDSON_API}/**`, async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    requestedPaths.push(pathname)

    if (pathname === '/camps/get') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: { camps: [{ campId: 'camp-interface', name: 'API Store' }] },
        }),
      )
      return
    }

    if (pathname === '/roomStatuses/rooms/get') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            isSingleInventory: 0,
            list: categories,
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
            list: orderRows,
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
            list: categories.map((category) => ({
              roomCategoryId: category.roomCategoryId,
              date: formatIsoDate(monthWindowDate(3)),
              inventory: 1,
            })),
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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.currentCampId', 'camp-interface')
  })
  await mockMonthStatusApis(page)
})

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function shanghaiMidnightTimestamp(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - 8 * 60 * 60 * 1000
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
  await expect(page.getByRole('button', { name: '分享房态' })).toBeVisible()
  await expect(page.getByRole('button', { name: '订单刷新' })).toBeVisible()
  await expect(page.getByText(today).first()).toBeVisible()
  await expect(page.getByTestId('month-date-column')).toHaveCount(33)
  await expect(page.getByTestId('month-date-column').first()).toContainText(firstWindowDay)
  await expect(page.getByTestId('month-grid')).toBeVisible()
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)
  await expect(page.getByTestId('month-grid')).toContainText('房间1')
})

test('month room status page opens sharing room status page and order refresh popover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.getByRole('button', { name: '分享房态' }).click()
  await expect(page).toHaveURL(/\/houseManage\/months\/sharingRoomStatus$/)
  await expect(page.getByRole('button', { name: '新增房态分享' })).toBeVisible()
  await expect(page.getByLabel('房态分享空状态')).toContainText('暂无数据')

  await page.goto('/houseManage/months')
  await page.getByRole('button', { name: '订单刷新' }).click()
  const refreshDialog = page.getByRole('dialog', { name: '订单刷新' })
  await expect(refreshDialog).toContainText('美团酒店订单')
  await refreshDialog.getByRole('button', { name: '刷新' }).click()
  await expect(page.locator('.month-status-toast')).toContainText('美团酒店订单已刷新')
})

test('month room status page loads core grid from real request layer', async ({ page }) => {
  const requestedPaths: string[] = []
  await page.unroute(`${HUDSON_API}/**`)
  await mockMonthStatusApis(page, requestedPaths, 'api')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months?campId=camp-interface')

  await expect(page.getByText('API Room Type', { exact: true })).toBeVisible()
  await expect(page.getByText('API Room', { exact: true })).toBeVisible()
  await expect(page.getByText('API Guest', { exact: true })).toBeVisible()
  await expect(page.getByText('API Channel', { exact: true })).toBeVisible()
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

test('month room status page can render from centralized mock provider without backend requests', async ({ page }) => {
  const requestedPaths: string[] = []
  await page.unroute(`${HUDSON_API}/**`)
  await page.route(`${HUDSON_API}/**`, async (route) => {
    requestedPaths.push(new URL(route.request().url()).pathname)
    await route.fulfill(jsonResponse({ success: false, errorMsg: 'mock provider test should not call real backend' }))
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.houseMonthsProvider', 'mock')
    window.localStorage.setItem('pms.houseMonthsMockMode', 'success')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await expect(page.getByText('豪华大床房', { exact: true })).toBeVisible()
  await expect(page.getByText('李思思', { exact: true })).toBeVisible()
  await expect(page.locator('.month-status-toast')).toContainText('月房态已刷新')
  await expect(page.locator('.month-status-toast')).toContainText('营业日历已同步')
  expect(requestedPaths).toEqual([])
})

test('month room status page uses documented mock provider by default for page display', async ({ page }) => {
  const requestedPaths: string[] = []
  await page.unroute(`${HUDSON_API}/**`)
  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.houseMonthsProvider')
    window.localStorage.removeItem('pms.houseMonthsMockMode')
    window.localStorage.removeItem('pms.currentCampId')
  })
  await page.route(`${HUDSON_API}/**`, async (route) => {
    requestedPaths.push(new URL(route.request().url()).pathname)
    await route.fulfill(jsonResponse({ success: false, errorMsg: 'default mock display should not call real backend' }))
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await expect(page.getByText('豪华大床房', { exact: true })).toBeVisible()
  await expect(page.getByText('总裁套间（桑拿浴缸露台电竞麻将）', { exact: true })).toBeVisible()
  await expect(page.getByText('天落大床电竞套间', { exact: true })).toBeVisible()
  await expect(page.getByText('观影大床房', { exact: true })).toBeVisible()
  await expect(page.getByText('李思思', { exact: true })).toBeVisible()
  await expect(page.getByText('王欣怡', { exact: true })).toBeVisible()
  await expect(page.getByText('张张', { exact: true })).toBeVisible()
  await expect(page.getByTestId('month-date-column').first()).toContainText('余2间')
  await expect(page.getByTestId('month-grid')).toContainText('售罄')
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)
  const toast = page.locator('.month-status-toast')
  await expect(toast).toContainText('月房态已刷新')
  await expect(toast).toContainText('营业日历已同步')
  await expect(toast).toHaveCSS('position', 'fixed')
  await expect(toast).toHaveCount(0, { timeout: 4000 })
  await expect(page.locator('.month-status-page')).not.toContainText(/Mock|mock|未接入|阻塞|后端未就绪|后端接口未完成|真实接口|未返回/)
  expect(requestedPaths).toEqual([])
})

test('month room status page exposes centralized mock empty and error envelopes', async ({ page }) => {
  await page.unroute(`${HUDSON_API}/**`)
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.houseMonthsProvider', 'mock')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.houseMonthsMockMode', 'empty')
  })
  await page.goto('/houseManage/months')

  await expect(page.getByText('暂无月房态数据')).toBeVisible()

  await page.addInitScript(() => {
    window.localStorage.setItem('pms.houseMonthsMockMode', 'error')
  })
  await page.goto('/houseManage/months')

  await expect(page.getByRole('alert')).toContainText('月房态数据加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重试请求' })).toBeVisible()
})

test('month room status page resolves camp context from real camps endpoint', async ({ page }) => {
  const requestedPaths: string[] = []
  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.currentCampId')
  })
  await page.unroute(`${HUDSON_API}/**`)
  await mockMonthStatusApis(page, requestedPaths, 'api')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await expect(page.getByText('API Room Type', { exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(requestedPaths).toEqual(expect.arrayContaining(['/camps/get', '/roomStatuses/rooms/get']))
})

test('month room status page adapts compact target room status schema', async ({ page }) => {
  const today = monthWindowDate(3)
  await page.unroute(`${HUDSON_API}/**`)
  await page.route(`${HUDSON_API}/**`, async (route) => {
    const pathname = new URL(route.request().url()).pathname

    if (pathname === '/roomStatuses/rooms/get') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            isSingleInventory: 0,
            list: [
              {
                i: 'compact-category',
                n: 'Compact Suite',
                inv: 2,
                rs: [{ i: 'compact-room', n: 'Compact Room', d: 0, s: 1 }],
              },
            ],
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
            list: [{ rci: 'compact-category', ivs: Array.from({ length: 33 }, () => 2) }],
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
                ri: 'compact-room',
                oi: 'compact-order',
                odi: 'compact-detail',
                gn: 'Compact Guest',
                ocn: 'Compact Channel',
                cid: formatIsoDate(today),
                cod: formatIsoDate(monthWindowDate(4)),
                rp: 22918,
                oep: 29143,
                rmk: 'compact remark',
              },
            ],
            orderArrangementInfos: [
              {
                ri: 'compact-room',
                d: shanghaiMidnightTimestamp(today),
                odis: ['compact-detail'],
                ecodis: [],
              },
            ],
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

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months?campId=camp-interface')

  await expect(page.getByText('Compact Suite', { exact: true })).toBeVisible()
  await expect(page.getByText('Compact Room', { exact: true })).toBeVisible()
  await expect(page.getByText('Compact Guest', { exact: true })).toBeVisible()
  await expect(page.getByText('Compact Channel', { exact: true })).toBeVisible()
  await expect(page.getByText('¥229.18')).toBeVisible()
})

test('month room status page surfaces real provider errors without static fallback data', async ({ page }) => {
  await page.unroute(`${HUDSON_API}/**`)
  await page.route(`${HUDSON_API}/**`, async (route) => {
    await route.fulfill(jsonResponse({ success: false, errorMsg: '接口权限不足' }))
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months?campId=camp-interface')

  await expect(page.getByRole('alert')).toContainText('接口权限不足')
  await expect(page.getByRole('button', { name: '重试请求' })).toBeVisible()
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

test('month room status page opens target-style month picker and syncs the selected date', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  const today = monthWindowDate(3)
  const nextDate = monthWindowDate(4)
  const monthTrigger = page.locator('.month-calendar-date')
  const datePicker = page.locator('.month-date-picker')

  await monthTrigger.click()
  await expect(datePicker).toBeVisible()
  await expect(datePicker.locator('.month-date-picker__cell')).toHaveCount(42)
  await expect(datePicker.getByRole('button', { name: '今天' })).toBeVisible()

  await datePicker.locator(`.month-date-picker__cell[data-date="${formatIsoDate(nextDate)}"]`).click()
  await expect(datePicker).toHaveCount(0)
  await expect(page.locator('.month-calendar-title')).toContainText(formatFullDate(nextDate))
  await expect(page.getByTestId('month-date-column').nth(3)).toContainText(formatMonthDay(nextDate))
  await expect(page.getByTestId('month-date-column').nth(3)).toHaveAttribute('aria-current', 'date')

  await monthTrigger.click()
  await datePicker.getByRole('button', { name: '今天' }).click()
  await expect(datePicker).toHaveCount(0)
  await expect(page.locator('.month-calendar-title')).toContainText(formatFullDate(today))
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

  await page.getByRole('button', { name: '渠道信息' }).click()
  await expect(page.getByTestId('month-channel-section-basic')).toContainText('基础信息')
  await expect(page.getByTestId('month-channel-section-basic')).toContainText('渠道单号')
  await expect(page.getByTestId('month-channel-section-basic')).toContainText('房间数量')
  await expect(page.getByTestId('month-channel-section-basic')).toContainText('预定入离日期')
  await expect(page.getByTestId('month-channel-section-basic')).toContainText('预定房型')
  await page.getByTestId('month-channel-copy-order-no').click()
  const toast = page.locator('.month-status-toast')
  await expect(toast).toContainText('复制成功')
  await expect(toast).toHaveClass(/month-status-toast--top/)
  await expect(page.getByTestId('month-channel-section-fee')).toContainText('费用信息')
  await expect(page.getByTestId('month-channel-section-fee')).toContainText('订单总收入')
  await expect(page.getByTestId('month-channel-section-fee')).toContainText('房费(减佣)')
  await expect(page.getByTestId('month-channel-section-fee')).toContainText('支付方式')
  await expect(page.getByTestId('month-channel-section-other')).toContainText('其他信息')
  await expect(page.getByTestId('month-channel-section-other')).toContainText('预定人')
  await expect(page.getByTestId('month-channel-section-other')).toContainText('渠道备注信息')

  await page.getByRole('button', { name: '操作日志' }).click()
  await expect(drawer).toContainText('系统创建订单')
  await expect(drawer).toContainText('同步渠道订单信息')

  await page.getByRole('button', { name: '订单信息' }).click()
  await expect(drawer).toContainText('登记入住人')

  const drawerBox = await drawer.boundingBox()
  expect(drawerBox).not.toBeNull()
  expect(Math.round((drawerBox?.x ?? 0) + (drawerBox?.width ?? 0))).toBeGreaterThanOrEqual(1436)
  expect(Math.round(drawerBox?.width ?? 0)).toBeGreaterThanOrEqual(600)
  expect(Math.round(drawerBox?.width ?? 0)).toBeLessThanOrEqual(700)

  await page.getByTestId('month-grid').click({ position: { x: 260, y: 150 } })
  await expect(drawer).toHaveCount(0)
})

test('month room status page renders scrollable target detail sections and sticky footer actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.locator('.tone-booking-gold').first().click()

  const drawer = page.locator('.month-order-drawer')
  const body = page.getByTestId('month-order-drawer-body')
  const footer = page.getByTestId('month-order-drawer-footer')

  await expect(drawer).toBeVisible()
  await expect(body).toBeVisible()
  await expect(body).toHaveCSS('overflow-y', 'auto')
  await expect(page.getByTestId('month-order-section-payment')).toBeVisible()
  await expect(page.getByTestId('month-order-section-invoice')).toBeVisible()
  await expect(page.getByTestId('month-order-section-extra-income')).toBeVisible()
  await expect(page.getByTestId('month-order-section-deposit')).toBeVisible()
  await expect(page.getByTestId('month-order-section-arrears')).toBeVisible()
  await expect(page.getByTestId('month-order-section-remark')).toBeVisible()
  await expect(page.getByTestId('month-order-section-tags')).toBeVisible()
  await expect(page.getByTestId('month-order-section-reminder')).toBeVisible()
  await expect(page.getByTestId('month-order-section-attachment')).toBeVisible()
  await expect(page.getByTestId('month-order-section-meta')).toBeVisible()
  await expect(page.getByTestId('month-order-section-meta')).toContainText('创建人')
  await expect(page.getByTestId('month-order-section-meta')).toContainText('订单号')
  await expect(page.getByTestId('month-order-section-meta')).toContainText('预订时间')

  await expect(footer).toBeVisible()
  await expect(page.getByTestId('month-order-footer-more')).toBeVisible()
  await expect(page.getByTestId('month-order-footer-collect')).toBeVisible()
  await expect(page.getByTestId('month-order-footer-credit-checkout')).toBeVisible()
  await expect(page.getByTestId('month-order-footer-checkin')).toBeVisible()
  await expect(page.getByTestId('month-order-footer-checkout')).toBeVisible()
})

test('month room status page supports target drawer secondary dialogs and section toggles', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.locator('.tone-booking-gold').first().click()

  await page.getByTestId('month-order-section-extra-income-toggle').click()
  await expect(page.getByTestId('month-order-section-extra-income-table')).toBeVisible()
  await page.getByTestId('month-order-section-extra-income-toggle').click()
  await expect(page.getByTestId('month-order-section-extra-income-table')).toHaveCount(0)

  await expect(page.getByTestId('month-order-section-payment-edit')).toBeVisible()
  await page.getByTestId('month-order-section-payment-edit').click()
  const paymentEditor = page.getByTestId('month-order-section-payment-editor')
  await expect(paymentEditor).toBeVisible()
  await expect(paymentEditor).toContainText('已收房费：')
  await expect(paymentEditor).toContainText('收款方式：')
  await expect(paymentEditor).toContainText('收款时间：')
  await paymentEditor.locator('input').first().fill('405')
  await page.getByTestId('month-order-section-payment').getByRole('button', { name: '取消' }).click()
  await expect(paymentEditor).toHaveCount(0)

  await page.getByTestId('month-order-section-invoice-edit').click()
  const invoiceEditor = page.getByTestId('month-order-section-invoice-editor')
  await expect(invoiceEditor).toBeVisible()
  await expect(invoiceEditor).toContainText('开票方：')
  await expect(invoiceEditor).toContainText('开票金额：')
  await expect(invoiceEditor).toContainText('建议开票金额：¥387')
  await invoiceEditor.locator('input').nth(1).fill('405')
  await page.getByTestId('month-order-section-invoice').getByRole('button', { name: '取消' }).click()
  await expect(invoiceEditor).toHaveCount(0)

  await page.getByTestId('month-order-section-deposit-edit').click()
  const depositEditor = page.getByTestId('month-order-section-deposit-editor')
  await expect(depositEditor).toBeVisible()
  await expect(depositEditor).toContainText('修改押金：')
  await expect(depositEditor).toContainText('一键免押')
  await depositEditor.locator('input').first().fill('99')
  await page.getByTestId('month-order-section-deposit').getByRole('button', { name: '取消' }).click()
  await expect(depositEditor).toHaveCount(0)

  await expect(page.getByTestId('month-order-section-arrears')).toContainText('订单欠款')

  await expect(page.getByTestId('month-order-section-arrears-body')).toBeVisible()

  await page.getByTestId('month-order-section-remark-edit').click()
  const remarkEditor = page.getByTestId('month-order-section-remark-editor')
  await expect(remarkEditor).toBeVisible()
  await expect(remarkEditor.locator('textarea')).toBeVisible()
  await page.getByTestId('month-order-section-remark').getByRole('button', { name: '取消' }).click()
  await expect(remarkEditor).toHaveCount(0)

  await page.getByTestId('month-order-section-tags-add').click()
  const tagsDialog = page.getByTestId('month-order-dialog-tags')
  await expect(tagsDialog).toBeVisible()
  await expect(tagsDialog).toContainText('选择标签')
  await expect(tagsDialog.getByPlaceholder('搜索')).toBeVisible()
  await expect(tagsDialog).toContainText('+创建标签')
  await expect(tagsDialog).toContainText('订单标签')
  await expect(tagsDialog).toContainText('默认标签')
  await expect(tagsDialog).toContainText('促销')
  await expect(tagsDialog).toContainText('重单')
  await expect(tagsDialog).toContainText('保留房')
  await expect(tagsDialog).toContainText('钟点房')
  await tagsDialog.getByPlaceholder('搜索').fill('重')
  await expect(tagsDialog).toContainText('重单')
  await expect(tagsDialog).not.toContainText('保留房')
  await tagsDialog.getByRole('button', { name: '取消' }).click()
  await expect(tagsDialog).toHaveCount(0)
  await expect(page.getByTestId('month-order-section-tags')).not.toContainText('重单')

  await page.getByTestId('month-order-section-tags-add').click()
  await expect(tagsDialog).toBeVisible()
  await tagsDialog.getByLabel('重单').check()
  await tagsDialog.getByRole('button', { name: '确定' }).click()
  await expect(tagsDialog).toHaveCount(0)
  await expect(page.getByTestId('month-order-section-tags')).toContainText('重单')

  await expect(page.getByTestId('month-order-section-attachment-upload')).toBeVisible()
  await expect(page.getByTestId('month-order-section-attachment')).not.toContainText('暂无附件')

  await page
    .getByTestId('month-order-section-attachment-upload')
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'checkin-guide.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('checkin guide'),
    })
  const attachmentList = page.getByTestId('month-order-section-attachment-list')
  await expect(attachmentList).toContainText('checkin-guide.txt')
  await expect(page.getByTestId('month-order-section-attachment-item')).toHaveCount(1)
  await page.getByTestId('month-order-section-attachment-delete').click()
  await expect(page.getByTestId('month-order-section-attachment-item')).toHaveCount(0)
  await expect(attachmentList).not.toContainText('checkin-guide.txt')

  await page.getByTestId('month-order-footer-collect').click()
  const collectDialog = page.getByTestId('month-order-dialog-collect')
  await expect(collectDialog).toBeVisible()
  await expect(collectDialog).toContainText('添加收款记录')
  await expect(collectDialog).toContainText('应收款')
  await expect(collectDialog).toContainText('已收款')
  await expect(collectDialog).toContainText('待收款')
  await expect(collectDialog).toContainText('类型')
  await expect(collectDialog).toContainText('支付方式')
  await expect(collectDialog).toContainText('日期')
  await expect(collectDialog).toContainText('金额(¥)')
  await expect(collectDialog).toContainText('备注')
  await expect(collectDialog).toContainText('在线收款')
  await expect(collectDialog.getByRole('button', { name: '提交' })).toBeVisible()
  await collectDialog.getByRole('button', { name: '关闭添加收款记录' }).click()
  await expect(collectDialog).toHaveCount(0)

  await page.getByTestId('month-order-section-reminder-add').click()
  const reminderDialog = page.getByTestId('month-order-dialog-reminder')
  await expect(reminderDialog).toBeVisible()
  await expect(reminderDialog).toContainText('添加订单提醒')
  await expect(reminderDialog).toContainText('提醒时间')
  await expect(reminderDialog).toContainText('提醒内容')
  await reminderDialog.getByRole('button', { name: '取消' }).click()
  await expect(reminderDialog).toHaveCount(0)

  await page.getByTestId('month-order-action-noshow').click()
  const noshowDialog = page.getByTestId('month-order-dialog-noshow')
  await expect(noshowDialog).toBeVisible()
  await expect(noshowDialog).toContainText('置为noshow失约单')
  await expect(noshowDialog).toContainText('选择全部房间')
  await expect(noshowDialog).toContainText('总裁套间（桑拿浴缸露台电竞麻将） 房间1')
  await noshowDialog.getByRole('button', { name: '取消' }).click()
  await expect(noshowDialog).toHaveCount(0)

  await page.getByTestId('month-order-register-guest').click()
  const guestEditor = page.getByTestId('month-order-guest-editor')
  await expect(guestEditor).toBeVisible()
  await expect(guestEditor).toContainText('客户姓名')
  await expect(guestEditor).toContainText('手机号')
  await expect(guestEditor).toContainText('居民身份证')
  await expect(guestEditor.getByPlaceholder('请输入证件号码')).toBeVisible()
  await expect(guestEditor.getByRole('button', { name: '读卡' })).toBeVisible()
  await expect(guestEditor.getByRole('button', { name: '取消' })).toBeVisible()
  await expect(guestEditor.getByRole('button', { name: '保存' })).toBeVisible()
  await guestEditor.getByRole('button', { name: '取消' }).click()
  await expect(guestEditor).toHaveCount(0)

  await page.getByTestId('month-order-footer-more').click()
  const moreMenu = page.getByTestId('month-order-footer-more-menu')
  await expect(moreMenu).toBeVisible()
  await expect(moreMenu).toContainText('编辑订单')
  await expect(moreMenu).toContainText('修改费用')
  await page.getByTestId('month-order-more-item-edit-order').click()
  const editOrderPanel = page.getByTestId('month-order-edit-panel')
  await expect(editOrderPanel).toBeVisible()
  await expect(editOrderPanel).toContainText('全日房')
  await expect(editOrderPanel).toContainText('钟点房')
  await expect(editOrderPanel).toContainText('长租房')
  await expect(editOrderPanel).toContainText('基本信息')
  await expect(editOrderPanel).toContainText('房间/费用信息')
  await expect(editOrderPanel).toContainText('订单提醒')
  await expect(editOrderPanel).toContainText('订单标签')
  await expect(editOrderPanel).toContainText('订单备注')
  await expect(editOrderPanel).toContainText('关联订单')
  await expect(page.getByTestId('month-order-edit-submit')).toBeVisible()
  await expect(moreMenu).toHaveCount(0)
  await page.getByRole('button', { name: '关闭编辑订单' }).click()
  await expect(editOrderPanel).toHaveCount(0)

  await page.getByTestId('month-order-footer-more').click()
  await page.getByTestId('month-order-more-item-modify-fee').click()
  const modifyFeeDialog = page.getByTestId('month-order-dialog-modify-fee')
  await expect(modifyFeeDialog).toBeVisible()
  await expect(modifyFeeDialog).toContainText('修改费用')
  await expect(modifyFeeDialog).toContainText('房费(减佣)')
  await expect(modifyFeeDialog).toContainText('佣金')
  await expect(modifyFeeDialog).toContainText('房费(含佣)')
  await expect(modifyFeeDialog.getByRole('button', { name: '取消' })).toBeVisible()
  await expect(modifyFeeDialog.getByRole('button', { name: '保存' })).toBeVisible()
  await modifyFeeDialog.getByRole('button', { name: '取消' }).click()
  await expect(modifyFeeDialog).toHaveCount(0)

  await page.getByTestId('month-order-footer-checkout').click()
  const checkoutDialog = page.getByTestId('month-order-dialog-checkout')
  await expect(checkoutDialog).toBeVisible()
  await expect(checkoutDialog).toContainText('办理退房')
  await expect(checkoutDialog).toContainText('正常退房')
  await expect(checkoutDialog).toContainText('提前退房')
  await expect(checkoutDialog).toContainText('添加收款')
  await checkoutDialog.getByTestId('month-order-dialog-checkout-add-collect').click()
  await expect(collectDialog).toBeVisible()
  await collectDialog.getByRole('button', { name: '关闭添加收款记录' }).click()
  await expect(collectDialog).toHaveCount(0)
  await checkoutDialog.getByRole('button', { name: '取消' }).click()
  await expect(checkoutDialog).toHaveCount(0)
})

test('month room status page wires pending drawer quick actions to real follow-up panels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.locator('.tone-booking-gold').first().click()

  await expect(page.getByTestId('month-order-action-guest')).toHaveCount(1)
  await expect(page.getByTestId('month-order-action-early-checkin')).toBeVisible()

  const quickActionDialogs = [
    ['month-order-action-invite', 'month-order-dialog-invite', '邀请登记'],
    ['month-order-action-early-checkin', 'month-order-dialog-early-checkin', '提前入住'],
    ['month-order-action-change-room', 'month-order-dialog-change-room', '换房'],
    ['month-order-action-cancel-arrange', 'month-order-dialog-cancel-arrange', '取消排房'],
    ['month-order-action-skip-stock', 'month-order-dialog-skip-stock', '不占库存'],
    ['month-order-action-skip-report', 'month-order-dialog-skip-report', '不计入统计'],
    ['month-order-action-continue', 'month-order-dialog-continue', '设为续住单'],
    ['month-order-action-cancel-order', 'month-order-dialog-cancel-order', '取消房单'],
    ['month-order-action-clean', 'month-order-dialog-clean', '保洁'],
    ['month-order-action-print', 'month-order-dialog-print', '打印'],
  ] as const

  for (const [triggerId, dialogId, title] of quickActionDialogs) {
    await page.getByTestId(triggerId).click()
    const dialog = page.getByTestId(dialogId)
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(title)
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await expect(dialog).toHaveCount(0)
  }

  await page.getByTestId('month-order-footer-credit-checkout').click()
  const creditDialog = page.getByTestId('month-order-dialog-credit-checkout')
  await expect(creditDialog).toBeVisible()
  await expect(creditDialog).toContainText('信用住结账')
  await creditDialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(creditDialog).toHaveCount(0)

  await page.getByTestId('month-order-footer-checkin').click()
  const checkinDialog = page.getByTestId('month-order-dialog-checkin')
  await expect(checkinDialog).toBeVisible()
  await expect(checkinDialog).toContainText('办理入住')
  await checkinDialog.getByRole('button', { name: '登记入住人' }).click()
  const guestEditor = page.getByTestId('month-order-guest-editor')
  await expect(guestEditor).toBeVisible()
  await guestEditor.getByRole('button', { name: '取消' }).click()
  await expect(guestEditor).toHaveCount(0)
})

test('month room status page adapts drawer actions to occupied target order state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.locator('.tone-booking-blue').first().click()

  const drawer = page.locator('.month-order-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('入住中')
  await expect(page.getByTestId('month-order-action-invite-renew')).toBeVisible()
  await expect(page.getByTestId('month-order-action-late-checkout')).toBeVisible()
  await expect(page.getByTestId('month-order-footer-renew')).toBeVisible()
  await expect(page.getByTestId('month-order-footer-checkin')).toBeVisible()
  await expect(page.getByTestId('month-order-footer-checkout')).toBeVisible()
  await expect(page.getByTestId('month-order-footer-credit-checkout')).toHaveCount(0)

  await page.getByTestId('month-order-footer-more').click()
  const moreMenu = page.getByTestId('month-order-footer-more-menu')
  await expect(moreMenu).toBeVisible()
  await expect(moreMenu).toContainText('编辑订单')
  await expect(moreMenu).toContainText('修改费用')
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

  await page.locator('.month-calendar-toggle').click()
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)
  await expect(page.getByTestId('month-room-row')).toHaveCount(0)

  await page.locator('.month-calendar-toggle').click()
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

  await page.getByTestId('month-room-filter-trigger').click()
  const firstRoomOption = page.getByRole('option').first()
  const firstRoomLabel = (await firstRoomOption.textContent())?.trim() ?? ''
  await firstRoomOption.click()
  await expect(page.getByTestId('month-room-filter-value')).toContainText(firstRoomLabel)
  await expect(page.getByTestId('month-type-row')).toHaveCount(1)
  await page.getByTestId('month-room-filter-clear').click()
  await expect(page.getByTestId('month-room-filter-value')).toHaveCount(0)
  await expect(page.getByTestId('month-room-filter-trigger')).toContainText('房型')
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)

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
  await expect(page.getByRole('status')).toContainText('批量设脏已完成：已设为脏房')
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
  await expect(page.getByRole('status')).toContainText('批量开房已完成：已设为开放房')
  await expect(page.locator('.month-batch-toolbar')).toHaveCount(0)
})
