import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, type Page, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotDir = path.resolve(
  __dirname,
  '../artifacts/screenshots/dingdan--zhusu-dingdan--zhusu-dingdan',
)
const DAY_MS = 24 * 60 * 60 * 1000

function appUrl(routePath: string) {
  return routePath.startsWith('/#') ? routePath : `/#${routePath}`
}

function addDaysToIso(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`)
  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'house-order-contract-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })
})

const houseOrderPayload = {
  success: true,
  data: {
    total: 2,
    pageNum: 1,
    pageSize: 20,
    pages: 1,
    hasNextPage: false,
    list: [
      {
        orderId: '2055526750698446849',
        outOrderId: '1128147967607231',
        channelName: '携程',
        guestName: '蔡勇君',
        guestMobile: null,
        orderState: 1,
        refundDisplayState: 0,
        type: 1,
        isLt: 0,
        includeCommissionRoomPrice: 395,
        totalRoomPrice: 308,
        otherPrice: 0,
        orderTotalIncomePrice: 395,
        debtPrice: 0,
        bookedTime: 1778910741000,
        orderDetailViews: [
          {
            poiName: '天落会宿公寓(前海壹方城宝安中心店)',
            roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
            roomCategoryProductName: '全日房',
            roomName: '房间1',
            checkInDate: 1778943600000,
            checkOutDate: 1779019200000,
            duration: '1晚',
            orderDetailDisplayState: 4,
            isArrangeRoom: 1,
            isOccupation: 1,
            isStatistics: 1,
          },
        ],
      },
      {
        orderId: '2055103007337734146',
        outOrderId: '5115623835635087439',
        channelName: '飞猪淘酒店',
        guestName: '黄国辉',
        guestMobile: '+8617328513805',
        orderState: 1,
        type: 1,
        isLt: 0,
        includeCommissionRoomPrice: 2116.53,
        totalRoomPrice: 1980.85,
        otherPrice: 0,
        orderTotalIncomePrice: 2116.53,
        debtPrice: 0,
        bookedTime: 1778809710000,
        orderDetailViews: [
          {
            poiName: '天落会宿公寓(前海壹方城宝安中心店)',
            roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
            roomCategoryProductName: '全日房',
            roomName: '',
            checkInDate: 1778943600000,
            checkOutDate: 1779547200000,
            duration: '7晚',
            orderDetailDisplayState: 1,
            isArrangeRoom: 0,
            isOccupation: 1,
            isStatistics: 1,
          },
        ],
      },
    ],
  },
}

async function mockHouseOrderApiProvider(page: Page, payload = houseOrderPayload) {
  const requests: Array<Record<string, unknown>> = []

  await page.route('**/api/order/report/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          todayNewOrder: 2,
          todayPredictCheckIn: 1,
          staying: 0,
          todayPredictCheckOut: 0,
          tomorrowCheckIn: 1,
          tomorrowCheckOut: 0,
          pending: 0,
          refunding: 0,
          exception: 1,
        },
      }),
    })
  })

  await page.route('**/api/orders/page/get', async (route) => {
    requests.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })

  return requests
}

async function mockHouseOrderCancelApi(page: Page) {
  const requests: Array<{ path: string; body: Record<string, unknown> }> = []

  await page.route('**/api/orders/*/cancel', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname.replace(/^\/api/, '')
    const body = request.postDataJSON() as Record<string, unknown>
    requests.push({ path: pathname, body })
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          orderId: pathname.split('/')[2],
          status: 'cancelled',
          message: '订单取消成功',
        },
      }),
    })
  })

  return requests
}

async function mockHouseOrderSkipStockApi(page: Page) {
  const requests: Array<{ path: string; body: Record<string, unknown> }> = []

  await page.route('**/api/orders/*/skip-stock', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname.replace(/^\/api/, '')
    const body = request.postDataJSON() as Record<string, unknown>
    requests.push({ path: pathname, body })
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          orderId: pathname.split('/')[2],
          roomId: '',
          roomName: '',
          message: '订单已释放库存并取消排房',
        },
      }),
    })
  })

  return requests
}

async function mockOrderRoomSelectorApi(page: Page) {
  await page.route('**/api/roomStatuses/rooms/get', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    const stayType = String(body.stayType ?? 'daily_room')
    const roomPrice = stayType === 'hourly_room' ? 88 : stayType === 'long_rental' ? 3600 : 268
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          roomCategoryRooms: [
            {
              roomCategoryId: '2061750967433125889',
              roomCategoryName: '特价单间',
              poiId: '11001',
              poiName: '路客云演示门店',
              price: roomPrice,
              salePrice: roomPrice,
              monthlyRent: stayType === 'long_rental' ? roomPrice : undefined,
              rooms: [
                { roomId: '2061750967445708801', roomName: '101', price: roomPrice, salePrice: roomPrice, monthlyRent: stayType === 'long_rental' ? roomPrice : undefined },
                { roomId: '2061750967449903105', roomName: '102', price: roomPrice, salePrice: roomPrice, monthlyRent: stayType === 'long_rental' ? roomPrice : undefined },
              ],
            },
          ],
        },
      }),
    })
  })

  await page.route('**/api/roomCategories/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          total: 1,
          pageNum: 1,
          pageSize: 20,
          pages: 1,
          hasNextPage: false,
          list: [
            {
              roomCategoryId: '2061750967433125889',
              roomCategoryName: '特价单间',
              poiId: '11001',
              poiName: '路客云演示门店',
            },
          ],
        },
      }),
    })
  })
}

async function mockOrderRoomSelectorApiWithoutInlinePrices(page: Page) {
  await page.route('**/api/roomStatuses/rooms/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          roomCategoryRooms: [
            {
              roomCategoryId: '2061750967433125889',
              roomCategoryName: '鐗逛环鍗曢棿',
              poiId: '11001',
              poiName: '璺浜戞紨绀洪棬搴?',
              rooms: [
                { roomId: '2061750967445708801', roomName: '101' },
                { roomId: '2061750967449903105', roomName: '102' },
              ],
            },
          ],
        },
      }),
    })
  })

  await page.route('**/api/roomCategoryStatuses/roomCategory/get', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    const startDate = String(body.date ?? '2026-06-05')
    const days = Math.max(Number(body.days ?? 1), 1)
    const priceByStayType: Record<string, number> = {
      daily_room: 26800,
      hourly_room: 8800,
      long_rental: 360000,
    }
    const stayType = String(body.stayType ?? 'daily_room')
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          roomStatusViews: [
            {
              roomCategoryId: '2061750967433125889',
              roomCategoryName: '鐗逛环鍗曢棿',
              statusViews: Array.from({ length: days }, (_, index) => ({
                date: addDaysToIso(startDate, index),
                price:
                  stayType === 'daily_room'
                    ? index === 0
                      ? priceByStayType.daily_room
                      : 31800
                    : priceByStayType[stayType] ?? priceByStayType.daily_room,
              })),
            },
          ],
          pageX: { total: 1, current: 1, pageNum: 1, pageSize: 10, hasNextPage: false },
        },
      }),
    })
  })
}

test('/order/house-order/list loads through the lodging order data provider envelope', async ({ page }) => {
  await page.goto(appUrl('/order/house-order/list?houseOrderProvider=mock'))

  await expect(page.getByRole('status', { name: '住宿订单请求状态' })).toContainText('已通过住宿订单数据服务刷新')
  await expect(page.locator('.order-page')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成|CORS/i)

  const table = page.getByRole('table', { name: '住宿订单列表' })
  await expect(table).toContainText('2055526750698446849')
  await expect(table).toContainText('蔡勇君')
  await expect(table).toContainText('房间1')
  await expect(table).toContainText('2055103007337734146')
  await expect(table.getByRole('button', { name: '排房' })).toBeVisible()
  await expect(page.locator('.order-pagination')).toContainText('共 2 条')

  await page.getByRole('radio', { name: '今日预抵' }).click()
  await expect(page.getByRole('radio', { name: '今日预抵' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('status', { name: '住宿订单请求状态' })).toContainText('共 1 条')
  await expect(table).toContainText('2055526750698446849')
  await expect(table).not.toContainText('2055103007337734146')
})

test('/order/house-order/list exposes provider failures and empty data without static fallback', async ({ page }) => {
  await page.goto(appUrl('/order/house-order/list?houseOrderProvider=mock&houseOrderMockState=error'))
  await expect(page.getByRole('alert')).toContainText('数据服务请求失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: '2054409001821356034' })).toHaveCount(0)

  await page.evaluate(() => {
    window.history.replaceState({}, '', '/#/order/house-order/list?houseOrderProvider=mock&houseOrderMockState=empty')
  })
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('/order/house-order/list matches captured lodging order table', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-order/list?houseOrderProvider=mock'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.order-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: '住宿订单', level: 1 })).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: '订单快捷筛选' }).getByRole('radio')).toHaveCount(10)
  await expect(page.getByRole('radio', { name: '全部' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByPlaceholder('输入订单号/渠道订单号/房间号/姓名/手机号')).toBeVisible()
  await expect(page.getByRole('button', { name: '重置筛选' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()
  await expect(page.getByRole('button', { name: '录入订单' })).toBeVisible()

  const table = page.getByRole('table', { name: '住宿订单列表' })
  await expect(table.getByRole('columnheader')).toHaveCount(21)
  await expect(table).toContainText('2055526750698446849')
  await expect(table).toContainText('携程')
  await expect(table).toContainText('蔡勇君')
  await expect(table).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(table).toContainText('2055103007337734146')
  await expect(table).toContainText('未排房')
  await expect(table.getByRole('button', { name: '排房' }).first()).toBeVisible()
  await expect(page.getByText('20 条/页')).toBeVisible()

  await page.screenshot({
    path: path.join(screenshotDir, 'default-clone-route.png'),
    fullPage: true,
  })
})

test('/order/house-order/list supports captured search and detail interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-order/list?houseOrderProvider=mock'))

  await page.getByRole('button', { name: '展开' }).click()
  await expect(page.locator('.order-advanced-filters').getByText('订单状态')).toBeVisible()
  await expect(page.locator('.order-advanced-filters').getByText('入住日期')).toBeVisible()
  await page.getByLabel('住宿订单筛选').getByRole('button', { name: '收起' }).click()
  await expect(page.getByText('订单状态')).toHaveCount(1)

  await page.getByPlaceholder('输入订单号/渠道订单号/房间号/姓名/手机号').fill('蔡')
  await expect(page.getByRole('row').filter({ hasText: '2055526750698446849' })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: '2055103007337734146' })).toHaveCount(0)

  await page.getByRole('button', { name: '详情' }).first().click()
  const detail = page.getByRole('dialog', { name: '订单详情' })
  await expect(detail).toBeVisible()
  await expect(detail).toContainText('全日房')
  await expect(detail).toContainText('订单信息')
  await expect(detail).toContainText('渠道信息')
  await expect(detail).toContainText('操作日志')
  await expect(detail).toContainText('蔡勇君')
  await expect(detail).toContainText('渠道单号：')
  await expect(detail).toContainText('1128147967607231')
  await expect(detail).toContainText('顶层套房（浴缸巨幕电竞麻将）（房间1）')
  await expect(detail).toContainText('2026.05.16-2026.05.17 1晚')
  await expect(detail).toContainText('房费(减佣):')
  await expect(detail).toContainText('¥308')
  await expect(detail).toContainText('订单总收入:')
  await expect(detail).toContainText('¥395.00')
  await expect(detail.getByRole('button', { name: '更多操作' })).toBeVisible()
  await expect(detail.getByRole('button', { name: '收 款' })).toBeVisible()
  await expect(detail.getByRole('button', { name: '续 住' })).toBeVisible()
  await expect(detail.getByRole('button', { name: '入住', exact: true })).toBeVisible()
  await expect(detail.getByRole('button', { name: '退房', exact: true })).toBeVisible()

  await page.screenshot({
    path: path.join(screenshotDir, 'detail-clone-route.png'),
    fullPage: true,
  })
})

test('/order/house-order/list opens the order entry drawer from the primary action', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-05T15:20:00+08:00'))
  await mockOrderRoomSelectorApi(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-order/list?houseOrderProvider=mock'))

  await page.getByRole('button', { name: '录入订单' }).click()

  const entryDrawer = page.getByRole('dialog', { name: '录入订单' })
  await expect(entryDrawer).toBeVisible()
  await expect(entryDrawer).toContainText('全日房')
  await expect(entryDrawer).toContainText('钟点房')
  await expect(entryDrawer).toContainText('长租房')

  await entryDrawer.getByRole('button', { name: '+ 添加房间' }).click()
  let roomSelector = page.getByRole('dialog', { name: '选择日期房间' })
  await roomSelector.getByRole('checkbox', { name: '101' }).check()
  await roomSelector.getByRole('button', { name: '确定' }).click()
  await expect(entryDrawer.locator('.order-entry-stay-room-price input')).toHaveValue('268')

  await entryDrawer.getByRole('button', { name: '钟点房' }).click()
  await entryDrawer.getByRole('button', { name: '+ 添加房间' }).click()
  roomSelector = page.getByRole('dialog', { name: '选择日期房间' })
  await roomSelector.getByRole('checkbox', { name: '101' }).check()
  await roomSelector.getByRole('button', { name: '确定' }).click()

  await expect(entryDrawer.locator('.order-entry-stay-room-price input')).toHaveValue('88')
  await expect(entryDrawer).toContainText('06-05 15:20-16:20')
  await expect(entryDrawer).not.toContainText(/\d{2}-\d{2} \d{2}:\d{2}-\d{2}-\d{2} \d{2}:\d{2}/)

  await entryDrawer.getByRole('button', { name: '长租房' }).click()
  await entryDrawer.getByRole('button', { name: '请选择' }).click()
  roomSelector = page.getByRole('dialog', { name: '选择日期房间' })
  await roomSelector.getByRole('checkbox', { name: '101' }).check()
  await roomSelector.getByRole('button', { name: '确定' }).click()
  await expect(entryDrawer.locator('.order-entry-long-table__input input').first()).toHaveValue('3600')
})

test('/order/house-order/list fills selected room price from room category status when room options omit prices', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-05T15:20:00+08:00'))
  await mockOrderRoomSelectorApiWithoutInlinePrices(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-order/list?houseOrderProvider=mock'))

  await page.locator('.order-filter-actions .order-primary-action').last().click()
  const entryDrawer = page.locator('.order-entry-drawer')
  await expect(entryDrawer).toBeVisible()

  await entryDrawer.locator('.order-entry-link--add').click()
  let roomSelector = page.locator('.order-entry-modal--room-selector')
  await roomSelector.locator('.room-selector-tree__children input[type="checkbox"]').first().check()
  await roomSelector.locator('.order-entry-submit').click()
  await expect(entryDrawer.locator('.order-entry-stay-room-price input')).toHaveValue('268')

  await entryDrawer.locator('.order-entry-tabs button').nth(1).click()
  await entryDrawer.locator('.order-entry-link--add').click()
  roomSelector = page.locator('.order-entry-modal--room-selector')
  await roomSelector.locator('.room-selector-tree__children input[type="checkbox"]').first().check()
  await roomSelector.locator('.order-entry-submit').click()
  await expect(entryDrawer.locator('.order-entry-stay-room-price input')).toHaveValue('88')

  await entryDrawer.locator('.order-entry-tabs button').nth(2).click()
  await entryDrawer.locator('.order-entry-long-table__picker').click()
  roomSelector = page.locator('.order-entry-modal--room-selector')
  await roomSelector.locator('.room-selector-tree__children input[type="checkbox"]').first().check()
  await roomSelector.locator('.order-entry-submit').click()
  await expect(entryDrawer.locator('.order-entry-long-table__input input').first()).toHaveValue('3600')
})

test('/order/house-order/list updates selected full-day room fee when stay nights change', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-05T15:20:00+08:00'))
  await mockOrderRoomSelectorApiWithoutInlinePrices(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-order/list?houseOrderProvider=mock'))

  await page.locator('.order-filter-actions .order-primary-action').last().click()
  const entryDrawer = page.locator('.order-entry-drawer')
  await expect(entryDrawer).toBeVisible()

  await entryDrawer.locator('.order-entry-link--add').click()
  const roomSelector = page.locator('.order-entry-modal--room-selector')
  await roomSelector.locator('.room-selector-tree__children input[type="checkbox"]').first().check()
  await roomSelector.locator('.order-entry-submit').click()

  const priceInput = entryDrawer.locator('.order-entry-stay-room-price input')
  await expect(priceInput).toHaveValue('268')
  await entryDrawer.locator('.order-entry-stay-room-stepper input').first().fill('2')
  await expect(priceInput).toHaveValue('536')
  await expect(entryDrawer.locator('.order-entry-section-tip').first()).toContainText('536')
})

test('/order/house-order/list submits registered guests without frontend-only guest ids', async ({ page }) => {
  const createRequests: Array<Record<string, unknown>> = []

  await mockOrderRoomSelectorApi(page)

  await page.route('/api/orders/create', async (route) => {
    createRequests.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          orderId: '9000000000001',
          status: 'booked',
          guestCount: 1,
          message: '订单创建成功',
        },
      }),
    })
  })

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'order-entry-submit-test-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.houseOrderProvider', 'mock')
    window.localStorage.setItem('pms.houseOrderMockState', 'success')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-order/list'))

  await page.getByRole('button', { name: '录入订单' }).click()
  const entryDrawer = page.getByRole('dialog', { name: '录入订单' })
  await entryDrawer.getByPlaceholder('姓名').fill('提交测试客人')
  await entryDrawer.getByPlaceholder('手机号').fill('13940001009')
  await entryDrawer.getByRole('button', { name: '+ 添加房间' }).click()

  const roomSelector = page.getByRole('dialog', { name: '选择日期房间' })
  await roomSelector.locator('.room-selector-tree__children input[type="checkbox"]').first().check()
  await roomSelector.getByRole('button', { name: '确定' }).click()

  await entryDrawer.getByRole('button', { name: '登记' }).click()
  await entryDrawer.getByPlaceholder('客户姓名').fill('入住人甲')
  await entryDrawer.locator('.order-entry-stay-guest-row select').first().selectOption('Passport')
  await entryDrawer.getByPlaceholder('请输入证件号码').fill('P40001009')
  await entryDrawer.getByRole('button', { name: '提交' }).click()

  await expect.poll(() => createRequests.length).toBe(1)
  const guests = createRequests[0].guests as Array<Record<string, unknown>>
  expect(guests).toHaveLength(1)
  expect(guests[0]).toMatchObject({
    guestName: '入住人甲',
    guestIdCardType: 'Passport',
    guestIdCard: 'P40001009',
    guestType: 'adult',
  })
  expect(guests[0]).not.toHaveProperty('guestId')
})

test('/order/house-order/list shows field errors below invalid order entry inputs', async ({ page }) => {
  const createRequests: Array<Record<string, unknown>> = []

  await mockOrderRoomSelectorApi(page)
  await page.route('/api/orders/create', async (route) => {
    createRequests.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { orderId: '9000000000003', message: '订单创建成功' } }),
    })
  })

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'order-entry-validation-test-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.houseOrderProvider', 'mock')
    window.localStorage.setItem('pms.houseOrderMockState', 'success')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-order/list'))

  await page.getByRole('button', { name: '录入订单' }).click()
  const entryDrawer = page.getByRole('dialog', { name: '录入订单' })
  await entryDrawer.getByPlaceholder('姓名').fill('1234')
  await entryDrawer.getByPlaceholder('手机号').fill('12345')
  await entryDrawer.getByRole('button', { name: '+ 添加房间' }).click()

  const roomSelector = page.getByRole('dialog', { name: '选择日期房间' })
  await roomSelector.locator('.room-selector-tree__children input[type="checkbox"]').first().check()
  await roomSelector.getByRole('button', { name: '确定' }).click()

  await entryDrawer.getByRole('button', { name: '登记' }).click()
  await entryDrawer.getByPlaceholder('客户姓名').fill('入住人甲')
  await entryDrawer.getByPlaceholder('手机号').nth(1).fill('13940001009')
  await entryDrawer.getByPlaceholder('请输入证件号码').fill('P40001009')
  await entryDrawer.getByRole('button', { name: '提交' }).click()

  const nameField = entryDrawer.getByPlaceholder('姓名').locator('xpath=ancestor::label[contains(@class, "order-entry-inline-field")]')
  const phoneField = entryDrawer.getByPlaceholder('手机号').first().locator('xpath=ancestor::label[contains(@class, "order-entry-inline-field")]')
  const credentialField = entryDrawer
    .getByPlaceholder('请输入证件号码')
    .locator('xpath=ancestor::label[contains(@class, "order-entry-stay-guest-field")]')
  await expect(nameField).toContainText('姓名格式不正确，请输入 2-30 个中文或英文字母')
  await expect(phoneField).toContainText('手机号格式不正确')
  await expect(credentialField).toContainText('居民身份证号格式不正确')
  expect(createRequests).toHaveLength(0)
})

test('/order/house-order/list submits selected real room category and room ids', async ({ page }) => {
  const createRequests: Array<Record<string, unknown>> = []

  await page.route('**/api/order/report/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          todayNewOrder: 0,
          todayPredictCheckIn: 0,
          staying: 0,
          todayPredictCheckOut: 0,
          tomorrowCheckIn: 0,
          tomorrowCheckOut: 0,
          pending: 0,
          refunding: 0,
          exception: 0,
        },
      }),
    })
  })

  await page.route('**/api/orders/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          total: 0,
          pageNum: 1,
          pageSize: 20,
          pages: 0,
          hasNextPage: false,
          list: [],
        },
      }),
    })
  })

  await page.route('**/api/roomStatuses/rooms/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          roomCategoryRooms: [
            {
              roomCategoryId: '2061750967433125889',
              roomCategoryName: '特价单间',
              poiId: '11001',
              poiName: '路客云演示门店',
              rooms: [
                { roomId: '2061750967445708801', roomName: '101' },
                { roomId: '2061750967449903105', roomName: '102' },
              ],
            },
          ],
        },
      }),
    })
  })

  await page.route('**/api/roomCategories/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          total: 1,
          pageNum: 1,
          pageSize: 20,
          pages: 1,
          hasNextPage: false,
          list: [
            {
              roomCategoryId: '2061750967433125889',
              roomCategoryName: '特价单间',
              poiId: '11001',
              poiName: '路客云演示门店',
            },
          ],
        },
      }),
    })
  })

  await page.route('**/api/roomCategoryStatuses/roomCategory/get', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    const date = String(body.date ?? '2026-06-05')
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          roomStatusViews: [
            {
              roomCategoryId: '2061750967433125889',
              statusViews: [{ date, price: 26800 }],
            },
          ],
          pageX: { total: 1, current: 1, pageNum: 1, pageSize: 10, hasNextPage: false },
        },
      }),
    })
  })

  await page.route('**/api/orders/create', async (route) => {
    createRequests.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          orderId: '9000000000002',
          status: 'booked',
          guestCount: 0,
          message: '订单创建成功',
        },
      }),
    })
  })

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'order-entry-real-room-test-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-order/list'))

  await page.getByRole('button', { name: '录入订单' }).click()
  const entryDrawer = page.getByRole('dialog', { name: '录入订单' })
  await entryDrawer.getByPlaceholder('姓名').fill('真实房型联通测试')
  await entryDrawer.getByPlaceholder('手机号').fill('13940001010')
  await entryDrawer.getByRole('button', { name: '+ 添加房间' }).click()

  const roomSelector = page.getByRole('dialog', { name: '选择日期房间' })
  await roomSelector.getByRole('checkbox', { name: '101' }).check()
  await roomSelector.getByRole('button', { name: '确定' }).click()
  await entryDrawer.getByRole('button', { name: '提交' }).click()

  await expect.poll(() => createRequests.length).toBe(1)
  expect(createRequests[0]).toMatchObject({
    poiId: '11001',
    poiName: '路客云演示门店',
    roomCategoryId: '2061750967433125889',
    roomCategoryName: '特价单间',
    roomId: '2061750967445708801',
    roomName: '101',
  })
})

test('/order/house-order/list defaults to api provider with the local gateway request body', async ({ page }) => {
  const requests = await mockHouseOrderApiProvider(page)

  await page.goto(appUrl('/order/house-order/list?campId=test-camp'))

  await expect(page.getByRole('status', { name: '住宿订单请求状态' })).toContainText('已通过住宿订单数据服务刷新')
  await expect.poll(() => requests.length).toBeGreaterThanOrEqual(1)
  const initialRequestCount = requests.length
  expect(requests.at(-1)).toMatchObject({
    campId: 'test-camp',
    pageNum: 1,
    pageSize: 20,
    orderType: '',
    isLt: 0,
  })

  await page.getByRole('radio', { name: '今日预抵' }).click()
  await expect.poll(() => requests.length).toBeGreaterThan(initialRequestCount)
  expect(requests.at(-1)).toMatchObject({ campId: 'test-camp', orderType: '11' })
})

test('/order/house-order/list detail cancel action calls backend and marks order statuses cancelled', async ({ page }) => {
  await mockHouseOrderApiProvider(page)
  const cancelRequests = await mockHouseOrderCancelApi(page)

  await page.goto(appUrl('/order/house-order/list?campId=10001'))
  await page.getByRole('button', { name: '详情' }).nth(1).click()

  const drawer = page.getByRole('dialog', { name: '订单详情' })
  await expect(drawer).toBeVisible()
  await drawer.getByRole('button', { name: '取消房单' }).click()

  const confirmDialog = page.getByRole('dialog', { name: '取消房单' })
  await expect(confirmDialog).toContainText('确定取消此房单吗？')
  await expect(confirmDialog).toContainText('取消后将释放房态，不可恢复，请谨慎操作')
  await confirmDialog.getByRole('button', { name: '确定' }).click()

  await expect.poll(() => cancelRequests.length).toBe(1)
  expect(cancelRequests[0]).toMatchObject({
    path: '/orders/2055103007337734146/cancel',
    body: {
      campId: '10001',
      reason: '订单详情取消房单',
    },
  })
  await expect(drawer).toContainText('订单取消成功')
  await expect(drawer.getByText('已取消')).toHaveCount(2)
})

test('/order/house-order/list detail skip stock action releases inventory and cancels room arrangement', async ({ page }) => {
  await mockHouseOrderApiProvider(page)
  const skipStockRequests = await mockHouseOrderSkipStockApi(page)

  await page.goto(appUrl('/order/house-order/list?campId=10001'))

  const row = page.getByRole('row').filter({ hasText: '2055103007337734146' })
  await row.getByRole('button', { name: '详情' }).click()

  const drawer = page.getByRole('dialog', { name: '订单详情' })
  await drawer.getByRole('button', { name: '不占库存' }).click()

  const confirmDialog = page.getByRole('dialog', { name: '不占库存' })
  await expect(confirmDialog).toContainText('订单将释放库存会同时取消排房，是否确定此操作？')
  await expect(confirmDialog).toContainText('添加标签')
  await confirmDialog.getByRole('button', { name: '确定' }).click()

  await expect.poll(() => skipStockRequests.length).toBe(1)
  expect(skipStockRequests[0]).toMatchObject({
    path: '/orders/2055103007337734146/skip-stock',
    body: {
      campId: '10001',
      reason: '订单详情不占库存',
    },
  })
  await expect(drawer).toContainText('订单已释放库存并取消排房')
  await expect(drawer).toContainText('未排房')
})

test('/order/house-order/list renders checked-in order state as running and living', async ({ page }) => {
  await mockHouseOrderApiProvider(page, {
    success: true,
    data: {
      total: 2,
      pageNum: 1,
      pageSize: 20,
      pages: 1,
      hasNextPage: false,
      list: [
        {
          orderId: 'CHECKIN-ORDER-001',
          outOrderId: 'CHECKIN-OUT-001',
          channelName: '路客云',
          guestName: '入住中客人',
          guestMobile: '13900000001',
          orderState: 3,
          refundDisplayState: 0,
          includeCommissionRoomPrice: 268,
          totalRoomPrice: 268,
          otherPrice: 0,
          orderTotalIncomePrice: 268,
          debtPrice: 0,
          bookedTime: 1778910741000,
          orderDetailViews: [
            {
              poiName: '路客云演示门店',
              roomCategoryName: '特价单间',
              roomCategoryProductName: '全日房',
              roomName: '101',
              checkInDate: 1778943600000,
              checkOutDate: 1779019200000,
              orderDetailDisplayState: 2,
              isArrangeRoom: 1,
              isOccupation: 1,
              isStatistics: 1,
            },
          ],
        },
        {
          orderId: 'CHECKOUT-ORDER-001',
          outOrderId: 'CHECKOUT-OUT-001',
          channelName: '路客云',
          guestName: '已退房客人',
          guestMobile: '13900000002',
          orderState: 4,
          refundDisplayState: 0,
          includeCommissionRoomPrice: 268,
          totalRoomPrice: 268,
          otherPrice: 0,
          orderTotalIncomePrice: 268,
          debtPrice: 0,
          bookedTime: 1778910741000,
          orderDetailViews: [
            {
              poiName: '路客云演示门店',
              roomCategoryName: '特价单间',
              roomCategoryProductName: '全日房',
              roomName: '102',
              checkInDate: 1778943600000,
              checkOutDate: 1779019200000,
              orderDetailDisplayState: 3,
              isArrangeRoom: 1,
              isOccupation: 1,
              isStatistics: 1,
            },
          ],
        },
      ],
    },
  })

  await page.goto(appUrl('/order/house-order/list?campId=10001'))

  const row = page.getByRole('row').filter({ hasText: 'CHECKIN-ORDER-001' })
  await expect(row.locator('.order-status').nth(0)).toHaveText('进行中')
  await expect(row.locator('.order-status').nth(1)).toHaveText('入住中')

  const checkedOutRow = page.getByRole('row').filter({ hasText: 'CHECKOUT-ORDER-001' })
  await expect(checkedOutRow.locator('.order-status').nth(0)).toHaveText('已完成')
  await expect(checkedOutRow.locator('.order-status').nth(1)).toHaveText('已退房')
})
