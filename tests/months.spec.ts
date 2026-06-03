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
const MONTH_API_ROUTES = [`${HUDSON_API}/**`, '**/api/**'] as const
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const normalized = routePath.startsWith('/#/') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalized}` : normalized
}

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
            storeId: 'poi-1796067693589061634',
            storeName: '天落会宿公寓(前海壹方城宝安中心店)',
            roomCategoryId: 'cat-top',
            roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
            rooms: [{ roomId: 'room-top-1', roomName: '房间1' }],
          },
          {
            storeId: 'poi-1796067693589061634',
            storeName: '天落会宿公寓(前海壹方城宝安中心店)',
            roomCategoryId: 'cat-president',
            roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
            rooms: [{ roomId: 'room-president-1', roomName: '房间1' }],
          },
          {
            storeId: 'poi-other-demo-store',
            storeName: '天落会宿公寓(演示分店)',
            roomCategoryId: 'cat-sky',
            roomCategoryName: '天落大床电竞套间',
            rooms: [{ roomId: 'room-sky-1', roomName: '房间1' }],
          },
          {
            storeId: 'poi-other-demo-store',
            storeName: '天落会宿公寓(演示分店)',
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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'house-months-test-token')
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
  await expect(legendDrawer).toContainText('订单颜色')
  await expect(legendDrawer).toContainText('客平台房态不一致')
  await expect(legendDrawer).toContainText('注意事项')
  await legendDrawer.getByRole('button', { name: '关闭图例说明' }).click()

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '房态设置' }).click()
  const settingsDrawer = page.getByRole('dialog', { name: '房态显示设置' })
  await expect(settingsDrawer).toBeVisible()
  await expect(settingsDrawer.getByText('房态页（可左右拖动排序）')).toBeVisible()
  await expect(settingsDrawer.getByRole('button', { name: /月房态/ })).toBeVisible()
  await expect(settingsDrawer.getByRole('button', { name: /日房态/ })).toBeVisible()
  await expect(settingsDrawer.getByRole('radio', { name: '渠道为主色' })).toBeChecked()
  await expect(settingsDrawer.getByRole('switch', { name: '显示订单价格' })).toBeChecked()

  await settingsDrawer.getByRole('switch', { name: '显示订单价格' }).click()
  await settingsDrawer.getByRole('button', { name: '保存' }).click()
  await expect(settingsDrawer).toHaveCount(0)
  await expect(page.getByTestId('month-grid')).not.toContainText('¥597.6')

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '房态设置' }).click()
  await expect(page.getByRole('dialog', { name: '房态显示设置' }).getByRole('switch', { name: '显示订单价格' })).not.toBeChecked()
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

test('month room status page can render from centralized mock provider without backend requests', async ({ page }) => {
  const requestedPaths: string[] = []
  await unrouteMonthStatusApis(page)
  for (const routePattern of MONTH_API_ROUTES) {
    await page.route(routePattern, async (route) => {
      requestedPaths.push(new URL(route.request().url()).pathname)
      await route.fulfill(jsonResponse({ success: false, errorMsg: 'mock provider test should not call real backend' }))
    })
  }
  await page.addInitScript(() => {
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

