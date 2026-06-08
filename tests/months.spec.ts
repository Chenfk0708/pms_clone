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

function shiftTestDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`)
  return new Date(date.getTime() + days * DAY_MS)
}

const COLLAPSE_TEXT = '\u5168\u90e8\u6536\u8d77'
const HUDSON_API = 'https://hudson-prod.localhome.cn'
const MONTH_API_ROUTES = [`${HUDSON_API}/**`, '**/api/camps/get', '**/api/roomStatuses/**', '**/api/roomCategoryStatuses/**', '**/api/orders/**'] as const
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const normalized = routePath.startsWith('/#/') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalized}` : normalized
}

function originUrl(path = '/') {
  return appBaseURL ? `${appBaseURL}${path}` : path
}

function jsonResponse(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

async function mockStoreOptionsApi(page) {
  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill(
      jsonResponse({
        code: 0,
        message: 'success',
        data: {
          list: [
            {
              poiId: 'poi-1796067693589061634',
              poiName: '天落会宿公寓(前海壹方城宝安中心店)',
            },
            {
              poiId: 'poi-other-demo-store',
              poiName: '天落会宿公寓(演示分店)',
            },
          ],
        },
      }),
    )
  })
}

async function mockMonthStatusApis(
  page,
  requestedPaths: string[] = [],
  variant: 'target' | 'api' | 'channel-fallback' | 'hourly' | 'no-price' = 'target',
) {
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
      : variant === 'no-price'
        ? [
            {
              storeId: 'poi-1796067693589061634',
              storeName: '澶╒惤浼氬鍏瘬(鍓嶆捣澹规柟鍩庡疂瀹変腑蹇冨簵)',
              roomCategoryId: 'cat-top',
              roomCategoryName: '椤跺眰濂楁埧锛堟荡缂稿法骞曠數绔為夯灏嗭級',
              monthlyRent: 12800,
              rooms: [{ roomId: 'room-top-1', roomName: '鎴块棿1', monthlyRent: 12800 }],
            },
          ]
        : [
          {
            storeId: 'poi-1796067693589061634',
            storeName: '天落会宿公寓(前海壹方城宝安中心店)',
            roomCategoryId: 'cat-top',
            roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
            price: 668,
            monthlyRent: 12800,
            rooms: [{ roomId: 'room-top-1', roomName: '房间1', price: 668, monthlyRent: 12800 }],
          },
          {
            storeId: 'poi-1796067693589061634',
            storeName: '天落会宿公寓(前海壹方城宝安中心店)',
            roomCategoryId: 'cat-president',
            roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
            price: 588,
            monthlyRent: 11800,
            rooms: [{ roomId: 'room-president-1', roomName: '房间1', price: 588, monthlyRent: 11800 }],
          },
          {
            storeId: 'poi-other-demo-store',
            storeName: '天落会宿公寓(演示分店)',
            roomCategoryId: 'cat-sky',
            roomCategoryName: '天落大床电竞套间',
            price: 398,
            monthlyRent: 9800,
            rooms: [{ roomId: 'room-sky-1', roomName: '房间1', price: 398, monthlyRent: 9800 }],
          },
          {
            storeId: 'poi-other-demo-store',
            storeName: '天落会宿公寓(演示分店)',
            roomCategoryId: 'cat-movie',
            roomCategoryName: '观影大床房',
            price: 288,
            monthlyRent: 6800,
            rooms: [{ roomId: 'room-movie-1', roomName: '房间1', price: 288, monthlyRent: 6800 }],
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
      : variant === 'channel-fallback'
        ? [
            {
              roomCategoryId: 'cat-president',
              roomId: 'room-president-1',
              date: formatIsoDate(monthWindowDate(3)),
              guestName: '渠道回补客人',
              orderChannelName: '订单表渠道',
              sourceLabelSnapshot: '订单表快照渠道',
              roomFee: 321.12,
              totalIncome: 321.12,
              liveStatus: '入住中',
              hasRemark: true,
            },
          ]
        : variant === 'hourly'
          ? [
              {
                roomCategoryId: 'cat-president',
                roomId: 'room-president-1',
                date: '2026-06-05',
                guestName: 'Hourly Guest',
                channelName: 'Direct',
                roomFee: 33330,
                totalIncome: 0,
                liveStatus: 'booked',
                orderType: 'hourly_room',
                startAt: '2026-06-05 06:00:00',
                endAt: '2026-06-05 11:00:00',
                checkInDate: '2026-06-05',
                checkOutDate: '2026-06-05',
                orderId: 'hourly-order',
              },
            ]
      : variant === 'no-price'
        ? [
            {
              storeId: 'poi-1796067693589061634',
              storeName: '澶╄惤浼氬鍏瘬(鍓嶆捣澹规柟鍩庡疂瀹変腑蹇冨簵)',
              roomCategoryId: 'cat-top',
              roomCategoryName: '椤跺眰濂楁埧锛堟荡缂稿法骞曠數绔為夯灏嗭級',
              monthlyRent: 12800,
              rooms: [{ roomId: 'room-top-1', roomName: '鎴块棿1', monthlyRent: 12800 }],
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
            stayRange: `${formatFullDate(monthWindowDate(6))}-${formatMonthDay(monthWindowDate(8))}`,
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
            bookingAt: '2026-06-06 15:50:00',
            checkInAt: '2026-06-06 10:00:00',
            guestRegisteredAt: '2026-06-06 15:56:30',
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
            bookingAt: '2026-06-06 13:20:00',
            checkInAt: '2026-06-06 14:10:00',
            guestRegisteredAt: '2026-06-06 14:33:45',
            checkOutAt: '2026-06-07 12:00:00',
            checkedOutAt: '2026-06-06 15:56:30',
          },
          ]
  const closedBlocks: Array<{ roomCategoryId: string; roomId: string; date: string; reason: string }> = []

  const handleMonthRoute = async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname.replace(/^\/api/, '')
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

    if (pathname === '/roomCategoryStatuses/roomCategory/get') {
      const body = request.postDataJSON()
      const startDate = String(body.date ?? formatIsoDate(monthWindowDate(3)))
      const days = Math.max(Number(body.days ?? 1), 1)
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            roomStatusViews: [
              {
                roomCategoryId: 'cat-top',
                statusViews: Array.from({ length: days }, (_, index) => ({
                  date: formatIsoDate(shiftTestDate(startDate, index)),
                  price: index === 0 ? 66800 : 72800,
                })),
              },
            ],
          },
        }),
      )
      return
    }

    if (pathname === '/roomStatuses/close/save') {
      const body = request.postDataJSON()
      closedBlocks.push({
        roomCategoryId: String(body.roomCategoryId),
        roomId: String(body.roomId),
        date: String(body.date),
        reason: String(body.reason || '月房态手动关房'),
      })
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            roomCategoryId: body.roomCategoryId,
            roomId: body.roomId,
            date: body.date,
            reason: body.reason,
            message: '关房成功',
          },
        }),
      )
      return
    }

    if (pathname === '/roomStatuses/open/save') {
      const body = request.postDataJSON()
      const roomCategoryId = String(body.roomCategoryId)
      const roomId = String(body.roomId)
      const date = String(body.date)
      const blockIndex = closedBlocks.findIndex(
        (block) => block.roomCategoryId === roomCategoryId && block.roomId === roomId && block.date === date,
      )
      if (blockIndex >= 0) closedBlocks.splice(blockIndex, 1)
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            roomCategoryId: body.roomCategoryId,
            roomId: body.roomId,
            date: body.date,
            message: '开房成功',
          },
        }),
      )
      return
    }

    if (pathname === '/roomStatuses/block/get') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            list: closedBlocks,
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
  }

  for (const routePattern of MONTH_API_ROUTES) {
    await page.route(routePattern, handleMonthRoute)
  }
}

async function unrouteMonthStatusApis(page) {
  for (const routePattern of MONTH_API_ROUTES) {
    await page.unroute(routePattern)
  }
}

async function mockMonthStatusColorApis(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.houseMonthsProvider', 'real')
  })

  const categories = [
    {
      roomCategoryId: 'cat-color-pending',
      roomCategoryName: '状态颜色待入住房型',
      rooms: [{ roomId: 'room-color-pending', roomName: '房间1', price: 668 }],
    },
    {
      roomCategoryId: 'cat-color-live',
      roomCategoryName: '状态颜色入住中房型',
      rooms: [{ roomId: 'room-color-live', roomName: '房间1', price: 588 }],
    },
    {
      roomCategoryId: 'cat-color-checkout',
      roomCategoryName: '状态颜色已退房房型',
      rooms: [{ roomId: 'room-color-checkout', roomName: '房间1', price: 398 }],
    },
    {
      roomCategoryId: 'cat-color-duplicate',
      roomCategoryName: '状态颜色重单房型',
      rooms: [{ roomId: 'room-color-duplicate', roomName: '房间1', price: 288 }],
    },
  ]
  const orders = [
    {
      roomCategoryId: 'cat-color-pending',
      roomId: 'room-color-pending',
      date: formatIsoDate(monthWindowDate(0)),
      guestName: '蓝待入住',
      channelName: '携程',
      roomFee: 668,
      totalIncome: 668,
      orderState: 1,
      orderId: 'pending-color-order',
    },
    {
      roomCategoryId: 'cat-color-live',
      roomId: 'room-color-live',
      date: formatIsoDate(monthWindowDate(1)),
      guestName: '绿入住中',
      channelName: '携程',
      roomFee: 588,
      totalIncome: 588,
      orderState: 3,
      orderId: 'living-color-order',
    },
    {
      roomCategoryId: 'cat-color-checkout',
      roomId: 'room-color-checkout',
      date: formatIsoDate(monthWindowDate(2)),
      guestName: '灰已退房',
      channelName: '携程',
      roomFee: 398,
      totalIncome: 398,
      orderState: 4,
      orderId: 'checkout-color-order',
    },
    {
      roomCategoryId: 'cat-color-duplicate',
      roomId: 'room-color-duplicate',
      date: formatIsoDate(monthWindowDate(3)),
      guestName: '红重单甲',
      channelName: '携程',
      roomFee: 288,
      totalIncome: 288,
      liveStatus: '待入住',
      orderId: 'duplicate-color-order-a',
    },
    {
      roomCategoryId: 'cat-color-duplicate',
      roomId: 'room-color-duplicate',
      date: formatIsoDate(monthWindowDate(3)),
      guestName: '红重单乙',
      channelName: '美团酒店',
      roomFee: 288,
      totalIncome: 288,
      liveStatus: '入住中',
      orderId: 'duplicate-color-order-b',
    },
  ]

  for (const routePattern of MONTH_API_ROUTES) {
    await page.route(routePattern, async (route) => {
      const request = route.request()
      const pathname = new URL(request.url()).pathname.replace(/^\/api/, '')

      if (pathname === '/camps/get') {
        await route.fulfill(jsonResponse({ success: true, data: { camps: [{ campId: 'camp-interface', name: 'API Store' }] } }))
        return
      }
      if (pathname === '/roomStatuses/rooms/get') {
        await route.fulfill(jsonResponse({ success: true, data: { isSingleInventory: 0, list: categories } }))
        return
      }
      if (pathname === '/roomStatuses/orderDetails/get') {
        await route.fulfill(jsonResponse({ success: true, data: { list: orders, orderArrangementInfos: [] } }))
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
      if (pathname === '/roomStatuses/dailyMonitor/get') {
        await route.fulfill(jsonResponse({ success: true, data: { list: [{ date: formatIsoDate(monthWindowDate(3)), remain: '余0间' }] } }))
        return
      }
      if (pathname.startsWith('/roomStatuses/')) {
        await route.fulfill(jsonResponse({ success: true, data: { list: [] } }))
        return
      }

      await route.fulfill(jsonResponse({ success: true, data: {} }))
    })
  }
}

test.beforeEach(async ({ page }) => {
  await mockStoreOptionsApi(page)
  await page.goto(originUrl('/'))
  await page.evaluate(() => {
    window.localStorage.setItem('pms_token', 'house-months-test-token')
    window.localStorage.setItem('pmsCampId', 'camp-interface')
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
  await page.goto(appUrl('/houseManage/months'))

  const firstWindowDay = formatMonthDay(monthWindowDate(0))
  const today = formatMonthDay(monthWindowDate(3))

  await expect(page.locator('.segmented button').first()).toBeVisible()
  await expect(page.locator('.month-toolbar__actions input')).toBeVisible()
  await expect(page.locator('.month-outline-action')).toHaveCount(2)
  await expect(page.locator('.month-store-chip')).toHaveCount(0)
  const storeSelect = page.getByRole('button', { name: '全部门店' })
  await expect(storeSelect).toBeVisible()
  await storeSelect.click()
  await expect(page.getByRole('listbox', { name: '门店范围' })).toBeVisible()
  await expect(page.getByRole('option', { name: '天落会宿公寓(前海壹方城宝安中心店)' })).toBeVisible()
  await expect(page.getByRole('option', { name: '天落会宿公寓(演示分店)' })).toBeVisible()
  await page.keyboard.press('Escape')
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

test('month room status filters rows by the selected store dropdown option', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  await expect(page.getByText('顶层套房（浴缸巨幕电竞麻将）', { exact: true })).toBeVisible()
  await expect(page.getByText('观影大床房', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '全部门店' }).click()
  await page.getByRole('option', { name: '天落会宿公寓(演示分店)' }).click()

  await expect(page.getByRole('button', { name: '天落会宿公寓(演示分店)' })).toBeVisible()
  await expect(page.getByText('天落大床电竞套间', { exact: true })).toBeVisible()
  await expect(page.getByText('观影大床房', { exact: true })).toBeVisible()
  await expect(page.getByText('顶层套房（浴缸巨幕电竞麻将）', { exact: true })).toHaveCount(0)
  await expect(page.getByTestId('month-type-row')).toHaveCount(2)
  await expect(page.getByTestId('month-room-row')).toHaveCount(2)
})

test('month room status page opens sharing room status page and order refresh popover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  await page.getByRole('button', { name: '分享房态' }).click()
  await expect(page).toHaveURL(/\/houseManage\/months\/sharingRoomStatus$/)
  await expect(page.getByRole('button', { name: '新增房态分享' })).toBeVisible()
  await expect(page.getByLabel('房态分享空状态')).toContainText('暂无数据')

  await page.goto(appUrl('/houseManage/months'))
  await page.getByRole('button', { name: '订单刷新' }).click()
  const refreshDialog = page.getByRole('dialog', { name: '订单刷新' })
  await expect(refreshDialog).toContainText('美团酒店订单')
  await refreshDialog.getByRole('button', { name: '刷新' }).click()
  await expect(page.locator('.month-status-toast')).toContainText('美团酒店订单已刷新')
})

test('month room status more settings opens target drawers and applies display switches', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '图例说明' }).click()
  const legendDrawer = page.getByRole('dialog', { name: '图例说明' })
  await expect(legendDrawer).toBeVisible()
  await expect(legendDrawer).toContainText('房间信息')
  await expect(legendDrawer).toContainText('空房')
  await expect(legendDrawer).toContainText('关房')
  await expect(legendDrawer).toContainText('各平台房态不一致')
  await expect(legendDrawer).toContainText('订单颜色')
  await expect(legendDrawer).toContainText('待入住')
  await expect(legendDrawer).toContainText('入住中')
  await expect(legendDrawer).toContainText('已退房')
  await expect(legendDrawer).toContainText('重单')
  await expect(legendDrawer).toContainText('房间状态')
  await expect(legendDrawer).toContainText('脏房')
  await expect(legendDrawer).toContainText('停用房')
  await expect(legendDrawer).toContainText('维修房')
  await expect(legendDrawer).toContainText('保留房')
  await expect(legendDrawer).toContainText('订单标签')
  await expect(legendDrawer).toContainText('订单备注')
  await expect(legendDrawer).toContainText('订单欠款')
  await expect(legendDrawer).toContainText('提前退房')
  await expect(legendDrawer).toContainText('邀请续住中')
  await expect(legendDrawer).toContainText('续住订单')
  await expect(legendDrawer).toContainText('入住类型')
  await expect(legendDrawer).toContainText('钟点房')
  await expect(legendDrawer).toContainText('长租')
  await expect(legendDrawer).toContainText('注意事项')
  await expect(legendDrawer).toContainText('若格子出现“小红点”')
  await expect(legendDrawer).toContainText('请关闭在平台的 iCal/日历同步功能')
  await legendDrawer.getByRole('button', { name: '关闭图例说明' }).click()

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '房态设置' }).click()
  const settingsDrawer = page.getByRole('dialog', { name: '房态显示设置' })
  await expect(settingsDrawer).toBeVisible()
  await expect(settingsDrawer.getByText('房态页（可左右拖动排序）')).toBeVisible()
  await expect(settingsDrawer.getByText('日房态视图（可左右拖动排序）')).toBeVisible()
  await expect(settingsDrawer.getByRole('button', { name: /月房态/ })).toBeVisible()
  await expect(settingsDrawer.getByRole('button', { name: /日房态/ })).toBeVisible()
  await expect(settingsDrawer.getByRole('button', { name: /按房型/ })).toBeVisible()
  await expect(settingsDrawer.getByRole('button', { name: /按房间号/ })).toBeVisible()
  await expect(settingsDrawer.getByRole('button', { name: /按楼层/ })).toBeVisible()
  await expect(settingsDrawer.getByRole('radio', { name: '订单状态为主色' })).toBeChecked()
  await expect(settingsDrawer.getByRole('radio', { name: '渠道为主色' })).not.toBeChecked()
  await expect(settingsDrawer.getByRole('switch', { name: '显示门市价' })).not.toBeChecked()
  await expect(settingsDrawer.getByRole('switch', { name: '显示房源编码' })).not.toBeChecked()
  await expect(settingsDrawer.getByRole('switch', { name: '显示订单价格' })).toHaveCount(0)
  await expect(settingsDrawer.getByRole('switch', { name: '显示订单', exact: true })).toHaveCount(0)

  const presidentGroup = page.locator('.month-room-group', { hasText: '总裁套间（桑拿浴缸露台电竞麻将）' }).first()
  const legacyBookingCell = presidentGroup.locator('[data-row-kind="room"] .month-cell').nth(3)
  await expect(legacyBookingCell).toContainText('刘翻红')
  await expect(legacyBookingCell).toContainText('携程')
  await expect(legacyBookingCell).toContainText('¥285.44')
  await expect(legacyBookingCell.locator('b')).toHaveText('备')
  await settingsDrawer.getByRole('button', { name: '关闭房态显示设置' }).click()
})

test('month room status page loads core grid from real request layer', async ({ page }) => {
  const requestedPaths: string[] = []
  await unrouteMonthStatusApis(page)
  await mockMonthStatusApis(page, requestedPaths, 'api')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months?campId=camp-interface'))

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

test('month room status falls back to order table channel fields when channelName is missing', async ({ page }) => {
  await unrouteMonthStatusApis(page)
  await mockMonthStatusApis(page, [], 'channel-fallback')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const presidentGroup = page.locator('.month-room-group', { hasText: '总裁套间（桑拿浴缸露台电竞麻将）' }).first()
  const fallbackChannelCell = presidentGroup.locator('[data-row-kind="room"] .month-cell').nth(3)
  await expect(fallbackChannelCell).toContainText('渠道回补客人')
  await expect(fallbackChannelCell).toContainText('订单表渠道')
  await expect(fallbackChannelCell).toContainText('¥321.12')
  await expect(fallbackChannelCell.locator('b')).toHaveText('备')
})

test('month room status colors order cells by order state and marks duplicate bookings', async ({ page }) => {
  await unrouteMonthStatusApis(page)
  await mockMonthStatusColorApis(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const pendingCell = page.locator('[data-row-kind="room"] .month-cell', { hasText: '蓝待入住' }).first()
  const livingCell = page.locator('[data-row-kind="room"] .month-cell', { hasText: '绿入住中' }).first()
  const checkoutCell = page.locator('[data-row-kind="room"] .month-cell', { hasText: '灰已退房' }).first()
  const duplicateCell = page.locator('[data-row-kind="room"] .month-cell', { hasText: '红重单甲' }).first()

  await expect(pendingCell).toHaveClass(/tone-booking-pending/)
  await expect(pendingCell).toHaveCSS('background-color', 'rgb(78, 134, 232)')
  await expect(livingCell).toHaveClass(/tone-booking-live/)
  await expect(livingCell).toHaveCSS('background-color', 'rgb(66, 191, 92)')
  await expect(checkoutCell).toHaveClass(/tone-booking-checkout/)
  await expect(checkoutCell).toHaveCSS('background-color', 'rgb(158, 167, 187)')
  await expect(duplicateCell).toHaveClass(/tone-booking-duplicate/)
  await expect(duplicateCell).toHaveCSS('background-color', 'rgb(249, 90, 84)')
})

test('month room status hover shows hourly order check-in and check-out time', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-05T15:20:00+08:00'))
  await unrouteMonthStatusApis(page)
  await mockMonthStatusApis(page, [], 'hourly')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const presidentGroup = page.locator('.month-room-group').filter({ hasText: 'Hourly Guest' }).first()
  const hourlyCell = presidentGroup.locator('[data-row-kind="room"] .month-cell', { hasText: 'Hourly Guest' }).first()
  await expect(hourlyCell).toBeVisible()
  await hourlyCell.hover()

  const popover = page.locator('.month-order-popover')
  await expect(popover).toBeVisible()
  await expect(popover).toContainText('2026-06-05 06:00-11:00')
})

test('month room status derives remaining rooms from live room rows when stock summaries are stale', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const selectedDateHeader = page.getByTestId('month-date-column').nth(3)
  await expect(selectedDateHeader).toContainText('余3间')

  const topRoomTypeRow = page.getByTestId('month-type-row').filter({ hasText: '顶层套房（浴缸巨幕电竞麻将）' })
  await expect(topRoomTypeRow.locator('.month-cell').first()).toContainText('余1')

  const presidentRoomTypeRow = page.getByTestId('month-type-row').filter({ hasText: '总裁套间（桑拿浴缸露台电竞麻将）' })
  await expect(presidentRoomTypeRow.locator('.month-cell').nth(3)).toContainText('售罄')
})

test('month room status empty cell opens reusable order entry drawer with selected room', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-05T15:20:00+08:00'))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const firstBlankCell = page.getByTestId('month-selectable-cell').first()
  await firstBlankCell.click()
  const actionMenu = page.getByRole('menu', { name: '房态操作菜单' })
  await expect(actionMenu).toBeVisible()
  await actionMenu.getByRole('menuitem', { name: '录单' }).click()

  const drawer = page.getByRole('dialog', { name: '录入订单' })
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('顶层套房（浴缸巨幕电竞麻将）（房间1）')
  await expect(drawer).toContainText('房间/费用信息')
  await expect(drawer.locator('.order-entry-stay-room-price input')).toHaveValue('668')
  await drawer.getByRole('button', { name: '钟点房' }).click()
  await expect(drawer.locator('.order-entry-stay-room-price input')).toHaveValue('668')
  await expect(drawer).not.toContainText('NaN')
  await expect(drawer).toContainText('06-05 15:20-16:20')
  await expect(drawer).not.toContainText(/\d{2}-\d{2} \d{2}:\d{2}-\d{2}-\d{2} \d{2}:\d{2}/)
  await drawer.getByRole('button', { name: '长租房' }).click()
  await expect(drawer.locator('.order-entry-long-table__input input').first()).toHaveValue('12800')
})

test('month room status entry fills room fee from category price API when calendar rows omit prices', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-05T15:20:00+08:00'))
  await unrouteMonthStatusApis(page)
  await mockMonthStatusApis(page, [], 'no-price')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  await page.getByTestId('month-selectable-cell').first().click()
  await page.locator('.month-selection-actions [role="menuitem"]').filter({ hasText: '录单' }).click()

  const drawer = page.locator('.order-entry-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('.order-entry-stay-room-price input')).toHaveValue('668')
})

test('month room status supports multi-select order entry and bulk close/open', async ({ page }) => {
  const requestedPaths: string[] = []
  await unrouteMonthStatusApis(page)
  await mockMonthStatusApis(page, requestedPaths)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const topRoomGroup = page.locator('.month-room-group', { hasText: '顶层套房（浴缸巨幕电竞麻将）' }).first()
  const topRoomCells = topRoomGroup.locator('[data-row-kind="room"] .month-cell')
  const firstTopCell = topRoomCells.nth(0)
  const secondTopCell = topRoomCells.nth(1)

  await firstTopCell.click()
  await secondTopCell.click()
  await expect(firstTopCell).toHaveClass(/is-selected/)
  await expect(secondTopCell).toHaveClass(/is-selected/)

  const actionMenu = page.getByRole('menu', { name: '房态操作菜单' })
  await expect(actionMenu).toBeVisible()
  await actionMenu.getByRole('menuitem', { name: '录单' }).click()

  const drawer = page.getByRole('dialog', { name: '录入订单' })
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('顶层套房（浴缸巨幕电竞麻将）（房间1）')
  await expect(drawer).toContainText(`${formatFullDate(monthWindowDate(0))}-${formatFullDate(monthWindowDate(2))}`)
  await expect(drawer.locator('.order-entry-stay-room-price input')).toHaveValue('1336')
  await drawer.getByLabel('关闭录入订单').click()

  await firstTopCell.click()
  await secondTopCell.click()
  await page.getByRole('menu', { name: '房态操作菜单' }).getByRole('menuitem', { name: '关房' }).click()
  await expect(firstTopCell).toHaveClass(/tone-disabled/)
  await expect(secondTopCell).toHaveClass(/tone-disabled/)
  expect(requestedPaths.filter((path) => path === '/roomStatuses/close/save')).toHaveLength(2)

  await firstTopCell.click()
  await secondTopCell.click()
  await page.getByRole('menu', { name: '房态操作菜单' }).getByRole('menuitem', { name: '开房' }).click()
  await expect(firstTopCell).not.toHaveClass(/tone-disabled/)
  await expect(secondTopCell).not.toHaveClass(/tone-disabled/)
  expect(requestedPaths.filter((path) => path === '/roomStatuses/open/save')).toHaveLength(2)
})

test('month room status clicking selected empty cell again clears action menu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const firstBlankCell = page.getByTestId('month-selectable-cell').first()
  await firstBlankCell.click()
  await expect(page.getByRole('menu', { name: '房态操作菜单' })).toBeVisible()
  await expect(firstBlankCell).toHaveClass(/is-selected/)

  await firstBlankCell.click()
  await expect(page.getByRole('menu', { name: '房态操作菜单' })).toHaveCount(0)
  await expect(firstBlankCell).not.toHaveClass(/is-selected/)
})

test('month room status closed cell can reopen room from action menu', async ({ page }) => {
  const requestedPaths: string[] = []
  await unrouteMonthStatusApis(page)
  await mockMonthStatusApis(page, requestedPaths)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const topRoomGroup = page.locator('.month-room-group', { hasText: '顶层套房（浴缸巨幕电竞麻将）' }).first()
  const firstTopCell = topRoomGroup.locator('[data-row-kind="room"] .month-cell').first()
  await firstTopCell.click()
  await page.getByRole('menu', { name: '房态操作菜单' }).getByRole('menuitem', { name: '关房' }).click()

  await expect(firstTopCell).toContainText('停用')
  await expect(firstTopCell).toHaveClass(/tone-disabled/)
  expect(requestedPaths).toContain('/roomStatuses/close/save')

  await firstTopCell.click()
  const actionMenu = page.getByRole('menu', { name: '房态操作菜单' })
  await expect(actionMenu).toBeVisible()
  await expect(actionMenu.getByRole('menuitem', { name: '录单' })).toBeVisible()
  await actionMenu.getByRole('menuitem', { name: '开房' }).click()

  await expect(firstTopCell).not.toHaveClass(/tone-disabled/)
  expect(requestedPaths).toContain('/roomStatuses/open/save')
})

test('month room status closed cell auto reopens before order entry', async ({ page }) => {
  const requestedPaths: string[] = []
  await unrouteMonthStatusApis(page)
  await mockMonthStatusApis(page, requestedPaths)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const topRoomGroup = page.locator('.month-room-group', { hasText: '顶层套房（浴缸巨幕电竞麻将）' }).first()
  const firstTopCell = topRoomGroup.locator('[data-row-kind="room"] .month-cell').first()
  await firstTopCell.click()
  await page.getByRole('menu', { name: '房态操作菜单' }).getByRole('menuitem', { name: '关房' }).click()
  await expect(firstTopCell).toHaveClass(/tone-disabled/)

  await firstTopCell.click()
  await page.getByRole('menu', { name: '房态操作菜单' }).getByRole('menuitem', { name: '录单' }).click()

  const drawer = page.getByRole('dialog', { name: '录入订单' })
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('顶层套房（浴缸巨幕电竞麻将）（房间1）')
  expect(requestedPaths).toContain('/roomStatuses/open/save')
})

test('month room status merges same multi-night order into a continuous cell', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months'))

  const presidentGroup = page.locator('.month-room-group', { hasText: '总裁套间（桑拿浴缸露台电竞麻将）' }).first()
  const mergedOrderCell = presidentGroup.locator('[data-row-kind="room"] .month-cell[data-order-span="2"]').first()
  await expect(mergedOrderCell).toContainText('陈家辉')
  await expect(mergedOrderCell).toContainText('飞猪淘酒店')
  await expect(mergedOrderCell).toContainText('¥597.6')
  await expect(presidentGroup.locator('[data-row-kind="room"] .month-cell', { hasText: '陈家辉' })).toHaveCount(1)
})

test('month room status order drawer saves registered guest and updates check-in checkout through order APIs', async ({ page }) => {
  const orderRequests: Array<{ path: string; body: Record<string, unknown> }> = []
  await page.route('**/api/orders/**', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname.replace(/^\/api/, '')
    const body = request.postDataJSON() as Record<string, unknown>
    orderRequests.push({ path: pathname, body })

    if (pathname === '/orders/target-order/guests/save') {
      await route.fulfill(jsonResponse({ success: true, data: { orderId: 'target-order', guestCount: 1, message: '入住人保存成功' } }))
      return
    }
    if (pathname === '/orders/target-order/check-in') {
      await route.fulfill(jsonResponse({ success: true, data: { orderId: 'target-order', status: 'checked_in', message: '办理入住成功' } }))
      return
    }
    if (pathname === '/orders/target-order/check-out') {
      await route.fulfill(jsonResponse({ success: true, data: { orderId: 'target-order', status: 'completed', message: '办理退房成功' } }))
      return
    }

    await route.fulfill(jsonResponse({ success: true, data: {} }))
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months?campId=camp-interface'))

  const presidentGroup = page.locator('.month-room-group', { hasText: '总裁套间（桑拿浴缸露台电竞麻将）' }).first()
  await presidentGroup.locator('[data-row-kind="room"] .month-cell', { hasText: '陈家辉' }).first().click()

  const drawer = page.getByRole('dialog', { name: '订单详情' })
  await expect(drawer).toBeVisible()
  await drawer.getByTestId('month-order-register-guest').click()

  const guestEditor = drawer.getByTestId('month-order-guest-editor')
  await expect(guestEditor).toBeVisible()
  const credentialType = guestEditor.getByRole('combobox')
  await expect(credentialType.locator('option')).toHaveText(['居民身份证', '港澳通行证', '港澳回乡证', '台胞证', 'Passport'])
  await credentialType.selectOption('Passport')
  await guestEditor.getByPlaceholder('请输入证件号码').fill('P123456789')
  await guestEditor.getByRole('button', { name: '保存' }).click()

  await expect.poll(() => orderRequests.some((request) => request.path === '/orders/target-order/guests/save')).toBe(true)
  expect(orderRequests.find((request) => request.path === '/orders/target-order/guests/save')?.body).toMatchObject({
    campId: 'camp-interface',
    guests: [
      {
        guestName: '陈家辉',
        guestIdCardType: 'Passport',
        guestIdCard: 'P123456789',
        guestType: 'adult',
      },
    ],
  })

  await drawer.getByTestId('month-order-footer-checkin').click()
  await expect.poll(() => orderRequests.some((request) => request.path === '/orders/target-order/check-in')).toBe(true)
  await expect(drawer).toContainText('入住中')

  await drawer.getByTestId('month-order-footer-checkout').click()
  await expect.poll(() => orderRequests.some((request) => request.path === '/orders/target-order/check-out')).toBe(true)
  await expect(drawer).toContainText('已退房')
})

test('month order drawer cancels order through backend and marks statuses as cancelled', async ({ page }) => {
  const orderRequests: Array<{ path: string; body: Record<string, unknown> }> = []
  await page.route('**/api/orders/**', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname.replace(/^\/api/, '')
    const body = request.postDataJSON() as Record<string, unknown>
    orderRequests.push({ path: pathname, body })

    if (pathname === '/orders/target-order/cancel') {
      await route.fulfill(jsonResponse({ success: true, data: { orderId: 'target-order', status: 'cancelled', message: '订单取消成功' } }))
      return
    }

    await route.fulfill(jsonResponse({ success: true, data: {} }))
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months?campId=camp-interface'))

  const presidentGroup = page.locator('.month-room-group', { hasText: '总裁套间（桑拿浴缸露台电竞麻将）' }).first()
  await presidentGroup.locator('[data-row-kind="room"] .month-cell', { hasText: '陈家辉' }).first().click()

  const drawer = page.getByRole('dialog', { name: '订单详情' })
  await expect(drawer).toBeVisible()
  await drawer.getByTestId('month-order-action-cancel-order').click()

  const confirmDialog = page.getByRole('dialog', { name: '取消房单' })
  await expect(confirmDialog).toContainText('确定取消此房单吗？')
  await expect(confirmDialog).toContainText('取消后将释放房态，不可恢复，请谨慎操作')
  await confirmDialog.getByRole('button', { name: '确定' }).click()

  await expect.poll(() => orderRequests.some((request) => request.path === '/orders/target-order/cancel')).toBe(true)
  expect(orderRequests.find((request) => request.path === '/orders/target-order/cancel')?.body).toMatchObject({
    campId: 'camp-interface',
    reason: '订单详情取消房单',
  })
  await expect(drawer).toContainText('已取消')
  await expect(drawer).toContainText('订单取消成功')
})

test('month order drawer skip stock releases inventory and cancels room arrangement through backend', async ({ page }) => {
  const orderRequests: Array<{ path: string; body: Record<string, unknown> }> = []
  await page.route('**/api/orders/**', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname.replace(/^\/api/, '')
    const body = request.postDataJSON() as Record<string, unknown>
    orderRequests.push({ path: pathname, body })

    if (pathname === '/orders/target-order/skip-stock') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            orderId: 'target-order',
            roomId: '',
            roomName: '',
            message: '订单已释放库存并取消排房',
          },
        }),
      )
      return
    }

    await route.fulfill(jsonResponse({ success: true, data: {} }))
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months?campId=camp-interface'))

  const presidentGroup = page.locator('.month-room-group', { hasText: '总裁套间（桑拿浴缸露台电竞麻将）' }).first()
  await presidentGroup.locator('[data-row-kind="room"] .month-cell', { hasText: '陈家辉' }).first().click()

  const drawer = page.getByRole('dialog', { name: '订单详情' })
  await expect(drawer).toBeVisible()
  await drawer.getByTestId('month-order-action-skip-stock').click()

  const confirmDialog = page.getByRole('dialog', { name: '不占库存' })
  await expect(confirmDialog).toContainText('订单将释放库存会同时取消排房，是否确定此操作？')
  await expect(confirmDialog).toContainText('添加标签')
  await confirmDialog.getByRole('button', { name: '确定' }).click()

  await expect.poll(() => orderRequests.some((request) => request.path === '/orders/target-order/skip-stock')).toBe(true)
  expect(orderRequests.find((request) => request.path === '/orders/target-order/skip-stock')?.body).toMatchObject({
    campId: 'camp-interface',
    reason: '订单详情不占库存',
  })
  await expect(drawer).toContainText('订单已释放库存并取消排房')
})

test('month order drawer operation log renders a timeline for current order actions', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-06T13:02:24+08:00'))
  await page.route('**/api/orders/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/^\/api/, '')

    if (pathname === '/orders/target-order/check-in') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            orderId: 'target-order',
            status: 'checked_in',
            guestRegisteredAt: '2026-06-06 12:58:11',
            message: '办理入住成功',
          },
        }),
      )
      return
    }
    if (pathname === '/orders/target-order/check-out') {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            orderId: 'target-order',
            status: 'completed',
            checkedOutAt: '2026-06-06 13:04:22',
            message: '办理退房成功',
          },
        }),
      )
      return
    }

    await route.fulfill(jsonResponse({ success: true, data: {} }))
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months?campId=camp-interface'))

  const presidentGroup = page.locator('.month-room-group', { hasText: '总裁套间（桑拿浴缸露台电竞麻将）' }).first()
  await presidentGroup.locator('[data-row-kind="room"] .month-cell', { hasText: '陈家辉' }).first().click()

  const drawer = page.getByRole('dialog', { name: '订单详情' })
  await drawer.getByTestId('month-order-footer-checkin').click()
  await expect(drawer).toContainText('入住中')
  await drawer.getByTestId('month-order-footer-checkout').click()
  await expect(drawer).toContainText('已退房')

  await drawer.getByRole('button', { name: '操作日志' }).click()
  const timeline = drawer.getByTestId('month-order-log-timeline')
  await expect(timeline).toBeVisible()
  await expect(timeline.getByTestId('month-order-log-item')).toHaveCount(3)
  await expect(timeline).toContainText('办理退房')
  await expect(timeline).toContainText('退房房间：总裁套间（桑拿浴缸露台电竞麻将）(房间1)')
  await expect(timeline).toContainText('办理入住')
  await expect(timeline).toContainText('入住房间：总裁套间（桑拿浴缸露台电竞麻将）(房间1)')
  await expect(timeline).toContainText('渠道来单')
  await expect(timeline).toContainText('订单状态:进行中')
  await expect(timeline).toContainText('操作人：系统自动')
  await expect(timeline).toContainText('2026/06/06')
  await expect(timeline).toContainText('12:58:11')
  await expect(timeline).toContainText('13:04:22')
  await expect(timeline).not.toContainText('13:02:24')
})

test('month order drawer operation log derives initial timeline from existing order state', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-06T15:56:30+08:00'))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months?campId=camp-interface'))

  await page.locator('[data-row-kind="room"] .month-cell', { hasText: '刘翻红' }).first().click()
  let drawer = page.getByRole('dialog', { name: '订单详情' })
  await drawer.getByRole('button', { name: '操作日志' }).click()
  let timeline = drawer.getByTestId('month-order-log-timeline')
  await expect(timeline.getByTestId('month-order-log-item')).toHaveCount(2)
  await expect(timeline).toContainText('办理入住')
  await expect(timeline).toContainText('入住房间：总裁套间（桑拿浴缸露台电竞麻将）(房间1)')
  await expect(timeline).toContainText('渠道来单')
  await expect(timeline).toContainText('15:56:30')
  await expect(timeline).not.toContainText('10:00:00')
  await expect(timeline).not.toContainText('办理退房')
  await drawer.getByRole('button', { name: '关闭订单详情' }).click()

  await page.locator('[data-row-kind="room"] .month-cell', { hasText: '张张' }).first().click()
  drawer = page.getByRole('dialog', { name: '订单详情' })
  await drawer.getByRole('button', { name: '操作日志' }).click()
  timeline = drawer.getByTestId('month-order-log-timeline')
  await expect(timeline.getByTestId('month-order-log-item')).toHaveCount(3)
  await expect(timeline).toContainText('办理退房')
  await expect(timeline).toContainText('退房房间：观影大床房(房间1)')
  await expect(timeline).toContainText('办理入住')
  await expect(timeline).toContainText('入住房间：观影大床房(房间1)')
  await expect(timeline).toContainText('渠道来单')
  await expect(timeline).toContainText('2026/06/06')
  await expect(timeline).toContainText('14:33:45')
  await expect(timeline).toContainText('15:56:30')
  await expect(timeline).not.toContainText('2026/06/07')
  await expect(timeline).not.toContainText('12:00:00')
})

test('month room status page can render from centralized mock provider without backend requests', async ({ page }) => {
  const requestedPaths: string[] = []
  await unrouteMonthStatusApis(page)
  for (const routePattern of MONTH_API_ROUTES) {
    await page.route(routePattern, async (route) => {
      requestedPaths.push(new URL(route.request().url()).pathname)
      await route.fulfill(jsonResponse({ success: false, errorMsg: 'mock provider test should not call real backend' }))
    })
  }
  await page.evaluate(() => {
    window.localStorage.setItem('pms.houseMonthsProvider', 'mock')
    window.localStorage.setItem('pms.houseMonthsMockMode', 'success')
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/months?campId=camp-interface'))

  await expect(page.getByTestId('month-grid')).toBeVisible()
  await expect(page.getByText('总裁套间（桑拿浴缸露台电竞麻将）', { exact: true })).toBeVisible()
  await expect(page.getByText('王欣怡', { exact: true })).toBeVisible()
  expect(requestedPaths).toEqual([])
})

