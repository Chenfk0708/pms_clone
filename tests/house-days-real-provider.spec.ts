import { expect, test, type Page } from '@playwright/test'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_START_OFFSET_DAYS = -3
const FRONT_STORE_ID = 'poi-1796067693589061634'
const FRONT_STORE_NAME = '天落会宿公寓(前海壹方城宝安中心店)'
const BRANCH_STORE_ID = 'poi-other-demo-store'
const BRANCH_STORE_NAME = '天落会宿公寓(演示分店)'

function appUrl(routePath: string) {
  return `/?houseDaysProvider=real#${routePath}`
}

function monthWindowDate(offsetFromWindowStart: number) {
  const today = new Date()
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return new Date(localMidnight.getTime() + (WINDOW_START_OFFSET_DAYS + offsetFromWindowStart) * DAY_MS)
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function installSession(page: Page) {
  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        data: {
          list: [
            { poiId: FRONT_STORE_ID, poiName: FRONT_STORE_NAME },
            { poiId: BRANCH_STORE_ID, poiName: BRANCH_STORE_NAME },
          ],
        },
      },
    })
  })

  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.setItem('pms_token', 'house-days-real-token')
    window.localStorage.setItem('pmsCampId', 'camp-interface')
    window.localStorage.setItem('pms.currentCampId', 'camp-interface')
  })
}

async function mockMonthStatusApis(page: Page, requestedPaths: string[]) {
  const categories = [
    {
      storeId: FRONT_STORE_ID,
      storeName: FRONT_STORE_NAME,
      roomCategoryId: 'cat-front',
      roomCategoryName: '前海大床房',
      rooms: [{ roomId: 'room-front-201', roomName: '201' }],
    },
    {
      storeId: BRANCH_STORE_ID,
      storeName: BRANCH_STORE_NAME,
      roomCategoryId: 'cat-branch',
      roomCategoryName: '演示影音房',
      rooms: [{ roomId: 'room-branch-706', roomName: '706' }],
    },
  ]
  const today = formatIsoDate(monthWindowDate(3))
  const tomorrow = formatIsoDate(monthWindowDate(4))

  await page.route('**/api/roomStatuses/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/^\/api/, '')
    requestedPaths.push(pathname)

    if (pathname === '/roomStatuses/rooms/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            isSingleInventory: 0,
            list: categories,
          },
        },
      })
      return
    }

    if (pathname === '/roomStatuses/orderDetails/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [
              {
                roomCategoryId: 'cat-front',
                roomId: 'room-front-201',
                date: today,
                guestName: '月房态今日客人',
                channelName: '携程',
                roomFee: 288,
                totalIncome: 318,
                liveStatus: '入住中',
                orderId: 'month-today-order',
              },
              {
                roomCategoryId: 'cat-branch',
                roomId: 'room-branch-706',
                date: today,
                guestName: '分店今日客人',
                orderChannelName: '订单表渠道',
                sourceLabelSnapshot: '渠道快照',
                roomFee: 218,
                totalIncome: 236,
                liveStatus: '待入住',
                hasRemark: true,
                orderId: 'branch-today-order',
              },
              {
                roomCategoryId: 'cat-front',
                roomId: 'room-front-201',
                date: tomorrow,
                guestName: '明日客人不应显示',
                channelName: '美团酒店',
                roomFee: 388,
                totalIncome: 399,
                orderId: 'tomorrow-order',
              },
            ],
            orderArrangementInfos: [],
          },
        },
      })
      return
    }

    if (pathname === '/roomStatuses/dailyMonitor/get') {
      await route.fulfill({ json: { success: true, data: { list: [{ date: today, remain: '余0间' }] } } })
      return
    }

    if (pathname === '/roomStatuses/inv/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: categories.map((category) => ({
              roomCategoryId: category.roomCategoryId,
              date: today,
              inventory: 1,
            })),
          },
        },
      })
      return
    }

    await route.fulfill({ json: { success: true, data: { list: [] } } })
  })
}

async function mockDayOpenCloseApis(page: Page, requestedPaths: string[], submittedBodies: Record<string, unknown>[]) {
  const today = formatIsoDate(monthWindowDate(3))
  const categories = [
    {
      storeId: FRONT_STORE_ID,
      storeName: FRONT_STORE_NAME,
      roomCategoryId: 'cat-open-close',
      roomCategoryName: '开关房测试房型',
      rooms: [{ roomId: 'room-open-close-301', roomName: '301', price: 268 }],
    },
  ]
  const closedBlocks: Array<{ roomCategoryId: string; roomId: string; date: string; reason?: string }> = []

  await page.route('**/api/roomStatuses/**', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname.replace(/^\/api/, '')
    requestedPaths.push(pathname)

    if (pathname === '/roomStatuses/rooms/get') {
      await route.fulfill({ json: { success: true, data: { isSingleInventory: 0, list: categories } } })
      return
    }

    if (pathname === '/roomStatuses/orderDetails/get') {
      await route.fulfill({ json: { success: true, data: { list: [], orderArrangementInfos: [] } } })
      return
    }

    if (pathname === '/roomStatuses/inv/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [{ roomCategoryId: 'cat-open-close', date: today, inventory: 1 }],
          },
        },
      })
      return
    }

    if (pathname === '/roomStatuses/block/get') {
      await route.fulfill({ json: { success: true, data: { list: closedBlocks } } })
      return
    }

    if (pathname === '/roomStatuses/close/save') {
      const body = request.postDataJSON() as Record<string, unknown>
      submittedBodies.push(body)
      closedBlocks.push({
        roomCategoryId: String(body.roomCategoryId),
        roomId: String(body.roomId),
        date: String(body.date),
        reason: String(body.reason || ''),
      })
      await route.fulfill({
        json: {
          success: true,
          data: {
            roomCategoryId: body.roomCategoryId,
            roomId: body.roomId,
            date: body.date,
            reason: body.reason,
            message: '关房成功',
          },
        },
      })
      return
    }

    if (pathname === '/roomStatuses/open/save') {
      const body = request.postDataJSON() as Record<string, unknown>
      submittedBodies.push(body)
      const blockIndex = closedBlocks.findIndex(
        (block) =>
          block.roomCategoryId === body.roomCategoryId &&
          block.roomId === body.roomId &&
          block.date === body.date,
      )
      if (blockIndex >= 0) closedBlocks.splice(blockIndex, 1)
      await route.fulfill({
        json: {
          success: true,
          data: {
            roomCategoryId: body.roomCategoryId,
            roomId: body.roomId,
            date: body.date,
            reason: body.reason,
            message: '开房成功',
          },
        },
      })
      return
    }

    if (pathname === '/roomStatuses/dailyMonitor/get') {
      await route.fulfill({ json: { success: true, data: { list: [{ date: today, remain: '余1间' }] } } })
      return
    }

    await route.fulfill({ json: { success: true, data: { list: [] } } })
  })
}

test.beforeEach(async ({ page }) => {
  await installSession(page)
})

test('/houseManage/days real provider mirrors the month room status today column', async ({ page }) => {
  const monthRequests: string[] = []
  const todayRequests: string[] = []
  await mockMonthStatusApis(page, monthRequests)
  await page.route('**/api/roomStatusesToday/get', async (route) => {
    todayRequests.push(route.request().url())
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'legacy-today-endpoint',
        timestamp: new Date().toISOString(),
        data: {
          roomCategories: [
            {
              roomCategoryId: 'legacy-cat',
              roomCategoryName: '旧日房态房型',
              rooms: [{ roomId: 'legacy-room', roomName: '999', guestName: '旧接口客人', isOcc: 1 }],
            },
          ],
        },
      },
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await expect(page.locator('.day-room-card')).toHaveCount(2)
  await expect(page.getByText('月房态今日客人')).toBeVisible()
  await expect(page.getByText('分店今日客人')).toBeVisible()
  await expect(page.getByText('明日客人不应显示')).toHaveCount(0)
  await expect(page.getByText('旧接口客人')).toHaveCount(0)
  expect(todayRequests).toHaveLength(0)
  expect(monthRequests).toEqual(
    expect.arrayContaining([
      '/roomStatuses/rooms/get',
      '/roomStatuses/orderDetails/get',
      '/roomStatuses/inv/get',
      '/roomStatuses/dailyMonitor/get',
    ]),
  )
})

test('/houseManage/days real provider keeps month-row store and channel filtering', async ({ page }) => {
  const monthRequests: string[] = []
  await mockMonthStatusApis(page, monthRequests)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await page.getByRole('button', { name: '全部门店' }).click()
  await page.getByRole('option', { name: BRANCH_STORE_NAME }).click()

  await expect(page.locator('.day-room-card')).toHaveCount(1)
  await expect(page.getByText('分店今日客人')).toBeVisible()
  await expect(page.getByText('月房态今日客人')).toHaveCount(0)

  const channelSelect = page.locator('.day-filter-group select').first()
  await channelSelect.selectOption('ota')
  await expect(page.locator('.day-room-card')).toHaveCount(1)
  await expect(page.getByText('订单表渠道')).toBeVisible()

  await channelSelect.selectOption('direct')
  await expect(page.locator('.day-empty-state')).toContainText('暂无日房态数据')
})

test('/houseManage/days closed room action menu switches to open room', async ({ page }) => {
  const requestedPaths: string[] = []
  const submittedBodies: Record<string, unknown>[] = []
  await mockDayOpenCloseApis(page, requestedPaths, submittedBodies)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  const roomCard = page.locator('.day-room-card', { hasText: '301' }).first()
  await expect(roomCard).toHaveAttribute('data-tone', 'empty')

  await roomCard.click()
  const actionMenu = page.getByRole('menu', { name: '房间操作' })
  await expect(actionMenu.getByRole('menuitem', { name: '关房' })).toBeVisible()
  await actionMenu.getByRole('menuitem', { name: '关房' }).click()

  await expect(roomCard).toHaveAttribute('data-tone', 'closed')
  await roomCard.click()
  await expect(actionMenu.getByRole('menuitem', { name: '开房' })).toBeVisible()
  await expect(actionMenu.getByRole('menuitem', { name: '关房' })).toHaveCount(0)
  await actionMenu.getByRole('menuitem', { name: '开房' }).click()

  await expect(roomCard).toHaveAttribute('data-tone', 'empty')
  expect(requestedPaths).toContain('/roomStatuses/close/save')
  expect(requestedPaths).toContain('/roomStatuses/open/save')
  expect(submittedBodies).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        campId: 'camp-interface',
        roomCategoryId: 'cat-open-close',
        roomId: 'room-open-close-301',
        reason: '日房态手动关房',
      }),
      expect.objectContaining({
        campId: 'camp-interface',
        roomCategoryId: 'cat-open-close',
        roomId: 'room-open-close-301',
        reason: '日房态手动开房',
      }),
    ]),
  )
})
