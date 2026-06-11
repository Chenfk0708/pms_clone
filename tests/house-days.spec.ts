import { expect, test } from '@playwright/test'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_START_OFFSET_DAYS = -3
const HUDSON_API = 'https://hudson-prod.localhome.cn'
const MONTH_API_ROUTES = [`${HUDSON_API}/**`, '**/api/camps/get', '**/api/roomStatuses/**', '**/api/roomCategoryStatuses/**'] as const
const appBaseURL = process.env.PMS_TEST_BASE_URL

function monthWindowDate(offsetFromWindowStart: number) {
  const today = new Date()
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return new Date(localMidnight.getTime() + (WINDOW_START_OFFSET_DAYS + offsetFromWindowStart) * DAY_MS)
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function originUrl(path = '/') {
  return appBaseURL ? `${appBaseURL}${path}` : path
}

function appUrl(routePath: string) {
  if (routePath.startsWith('/houseManage/days')) {
    const normalized = houseDaysAppUrl(routePath)
    return appBaseURL ? `${appBaseURL}${normalized}` : normalized
  }

  const normalized = routePath.startsWith('/#/') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalized}` : normalized
}

function houseDaysAppUrl(routePath: string) {
  const [hashPath, queryString = ''] = routePath.split('?')
  const params = new URLSearchParams(queryString)
  if (!params.has('houseDaysProvider')) params.set('houseDaysProvider', 'mock')
  return `/?${params.toString()}#${hashPath}`
}

function jsonResponse(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

async function mockDayStatusColorApis(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.houseMonthsProvider', 'real')
  })

  const today = formatIsoDate(monthWindowDate(3))
  const categories = [
    {
      roomCategoryId: 'day-color-pending',
      roomCategoryName: 'Day Color Pending Type',
      rooms: [{ roomId: 'day-room-pending', roomName: 'Day Room Pending', price: 668 }],
    },
    {
      roomCategoryId: 'day-color-live',
      roomCategoryName: 'Day Color Live Type',
      rooms: [{ roomId: 'day-room-live', roomName: 'Day Room Live', price: 588 }],
    },
    {
      roomCategoryId: 'day-color-checkout',
      roomCategoryName: 'Day Color Checkout Type',
      rooms: [{ roomId: 'day-room-checkout', roomName: 'Day Room Checkout', price: 398 }],
    },
    {
      roomCategoryId: 'day-color-duplicate',
      roomCategoryName: 'Day Color Duplicate Type',
      rooms: [{ roomId: 'day-room-duplicate', roomName: 'Day Room Duplicate', price: 288 }],
    },
  ]
  const orders = [
    {
      roomCategoryId: 'day-color-pending',
      roomId: 'day-room-pending',
      date: today,
      guestName: 'Day Pending Guest',
      channelName: 'Ctrip',
      roomFee: 668,
      totalIncome: 668,
      orderState: 1,
      orderId: 'day-pending-order',
    },
    {
      roomCategoryId: 'day-color-live',
      roomId: 'day-room-live',
      date: today,
      guestName: 'Day Live Guest',
      channelName: 'Ctrip',
      roomFee: 588,
      totalIncome: 588,
      orderState: 3,
      orderId: 'day-live-order',
    },
    {
      roomCategoryId: 'day-color-checkout',
      roomId: 'day-room-checkout',
      date: today,
      guestName: 'Day Checkout Guest',
      channelName: 'Ctrip',
      roomFee: 398,
      totalIncome: 398,
      orderState: 4,
      orderId: 'day-checkout-order',
    },
    {
      roomCategoryId: 'day-color-duplicate',
      roomId: 'day-room-duplicate',
      date: today,
      guestName: 'Day Duplicate Guest A',
      channelName: 'Ctrip',
      roomFee: 288,
      totalIncome: 288,
      orderState: 1,
      orderId: 'day-duplicate-order-a',
    },
    {
      roomCategoryId: 'day-color-duplicate',
      roomId: 'day-room-duplicate',
      date: today,
      guestName: 'Day Duplicate Guest B',
      channelName: 'Meituan',
      roomFee: 288,
      totalIncome: 288,
      orderState: 3,
      orderId: 'day-duplicate-order-b',
    },
  ]

  for (const routePattern of MONTH_API_ROUTES) {
    await page.route(routePattern, async (route) => {
      const pathname = new URL(route.request().url()).pathname.replace(/^\/api/, '')

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
                date: today,
                inventory: 1,
              })),
            },
          }),
        )
        return
      }
      if (pathname === '/roomStatuses/dailyMonitor/get') {
        await route.fulfill(jsonResponse({ success: true, data: { list: [{ date: today, remain: '余0间' }] } }))
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
  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
    })
  })

  await page.goto(originUrl('/'))
  await page.evaluate(() => {
    window.localStorage.setItem('pms_token', 'house-days-test-token')
    window.localStorage.setItem('pmsCampId', 'camp-interface')
    window.localStorage.setItem('pms.currentCampId', 'camp-interface')
    window.localStorage.setItem('pms.houseMonthsProvider', 'mock')
    window.localStorage.setItem('pms.houseMonthsMockMode', 'success')
  })
})

test('/houseManage/days colors order cards by order state and duplicate bookings', async ({ page }) => {
  await mockDayStatusColorApis(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  const pendingCard = page.locator('.day-room-card', { hasText: 'Day Pending Guest' }).first()
  const liveCard = page.locator('.day-room-card', { hasText: 'Day Live Guest' }).first()
  const checkoutCard = page.locator('.day-room-card', { hasText: 'Day Checkout Guest' }).first()
  const duplicateCard = page.locator('.day-room-card', { hasText: 'Day Duplicate Guest A' }).first()

  await expect(pendingCard).toHaveAttribute('data-tone', 'pending')
  await expect(pendingCard).toHaveCSS('background-color', 'rgb(78, 134, 232)')
  await expect(liveCard).toHaveAttribute('data-tone', 'live')
  await expect(liveCard).toHaveCSS('background-color', 'rgb(66, 191, 92)')
  await expect(checkoutCard).toHaveAttribute('data-tone', 'checkout')
  await expect(checkoutCard).toHaveCSS('background-color', 'rgb(158, 167, 187)')
  await expect(duplicateCard).toHaveAttribute('data-tone', 'duplicate')
  await expect(duplicateCard).toHaveCSS('background-color', 'rgb(249, 90, 84)')
})

test('/houseManage/days loads through the explicit mock provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.locator('.day-room-card')).toHaveCount(4)
  await expect(page.getByText('李思思')).toBeVisible()
  await expect(page.getByText('赵晨')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/mock|mock provider|未接入阻塞|后端接口未完成/)

  await page.getByRole('button', { name: '订单刷新' }).click()
  await expect(page.getByRole('dialog', { name: '订单刷新' })).toContainText('美团酒店订单')
  await page.getByRole('dialog', { name: '订单刷新' }).getByRole('button', { name: '刷新' }).click()
  await expect(page.getByRole('status')).toContainText('美团酒店订单已刷新')
})

test('/houseManage/days empty room action menu uses a white bubble surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  const emptyRoomCard = page.locator('.day-room-card[data-tone="empty"]').first()
  await expect(emptyRoomCard).toBeVisible()
  await emptyRoomCard.click()

  const actionMenu = page.locator('.day-room-actions-popover')
  await expect(actionMenu).toBeVisible()
  await expect(actionMenu.locator('[role="menuitem"]')).toHaveCount(6)

  const actionMenuStyle = await actionMenu.evaluate((element) => {
    const style = window.getComputedStyle(element)
    const arrowStyle = window.getComputedStyle(element, '::before')
    const afterStyle = window.getComputedStyle(element, '::after')

    return {
      afterDisplay: afterStyle.display,
      arrowBackground: arrowStyle.backgroundColor,
      background: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderStyle: style.borderStyle,
      borderRadius: style.borderRadius,
    }
  })

  expect(actionMenuStyle.background).toBe('rgb(255, 255, 255)')
  expect(actionMenuStyle.backgroundImage).toBe('none')
  expect(actionMenuStyle.arrowBackground).toBe('rgb(255, 255, 255)')
  expect(actionMenuStyle.afterDisplay).toBe('none')
  expect(actionMenuStyle.borderStyle).toBe('none')
  expect(Number.parseFloat(actionMenuStyle.borderRadius)).toBeGreaterThan(18)
})

test('/houseManage/days empty room action menu opens the shared order entry drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await page.locator('.day-room-card[data-tone="empty"]').first().click()
  await page.locator('.day-room-actions-popover [role="menuitem"]').filter({ hasText: '录单' }).click()

  const drawer = page.getByRole('dialog', { name: '录入订单' })
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('总裁套间（桑拿浴缸露台电竞麻将）（902）')
  await expect(drawer.locator('.order-entry-stay-room-price input')).toHaveValue('668')
})

test('/houseManage/days empty room action menu closes room through the room status API', async ({ page }) => {
  const closeRequests: Array<Record<string, unknown>> = []
  await page.route('**/api/roomStatuses/close/save', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    closeRequests.push(body)
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
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await page.locator('.day-room-card[data-tone="empty"]').first().click()
  await page.locator('.day-room-actions-popover [role="menuitem"]').filter({ hasText: '关房' }).click()

  await expect.poll(() => closeRequests.length).toBe(1)
  expect(closeRequests[0]).toMatchObject({
    campId: 'camp-interface',
    roomCategoryId: 'room-category-president',
    roomId: 'room-902',
    reason: '日房态手动关房',
  })
  await expect(page.getByRole('status')).toContainText('关房成功')
})

test('/houseManage/days mirrors the month room status today column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await expect(page.locator('.day-room-card')).toHaveCount(4)
  await expect(page.getByText('李思思')).toBeVisible()
  await expect(page.getByText('赵晨')).toBeVisible()
  await expect(page.getByText('张张')).toBeVisible()
  await expect(page.getByText('王欣怡')).toHaveCount(0)

  await page.getByRole('button', { name: '全部门店' }).click()
  await page.getByRole('option', { name: '天落会宿公寓(前海壹方城宝安中心店)' }).click()

  await expect(page.locator('.day-room-card')).toHaveCount(2)
  await expect(page.getByText('李思思')).toBeVisible()
  await expect(page.getByText('赵晨')).toHaveCount(0)
  await expect(page.getByText('张张')).toHaveCount(0)
})

test('/houseManage/days switches view modes to match target layouts', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  const tabs = page.locator('.day-filter-tabs button')
  await expect(tabs.nth(0)).toHaveClass(/is-active/)
  await expect(page.getByTestId('day-room-type-grid')).toBeVisible()
  await expect(page.locator('.day-room-type-section')).toHaveCount(4)
  await expect(page.locator('.day-room-card')).toHaveCount(4)

  await tabs.nth(1).click()
  await expect(tabs.nth(1)).toHaveClass(/is-active/)
  await expect(page.getByTestId('day-room-type-grid')).toHaveCount(0)
  await expect(page.locator('.day-room-group h3').first()).not.toHaveText('')
  await expect(page.locator('.day-room-group .day-room-card')).toHaveCount(4)

  await tabs.nth(2).click()
  await expect(tabs.nth(2)).toHaveClass(/is-active/)
  await expect(page.getByTestId('day-floor-empty-state')).toContainText('请先设置楼层')
  await expect(page.getByRole('button', { name: '前往设置' })).toBeVisible()
  await expect(page.locator('.day-filter-group')).toHaveCount(0)
})

test('/houseManage/days filters the left room list when a right-side status is checked', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  const roomCards = page.locator('.day-room-card')
  const arrivalGroup = page.locator('.day-filter-group').first()
  const roomStatusGroup = page.locator('.day-filter-group').nth(1)

  await expect(roomCards).toHaveCount(4)
  await expect(arrivalGroup).toContainText('预抵3')
  await expect(arrivalGroup).toContainText('预离3')
  await expect(arrivalGroup).toContainText('在住0')
  await expect(roomStatusGroup).toContainText('空净1')
  await expect(roomStatusGroup).toContainText('住净2')
  await expect(roomStatusGroup).toContainText('住脏1')

  await arrivalGroup.locator('input[type="checkbox"]').first().check()
  await expect(roomCards).toHaveCount(3)
  await expect(page.getByText('李思思')).toBeVisible()
  await expect(page.getByText('赵晨')).toBeVisible()
  await expect(page.getByText('张张')).toBeVisible()
})

test('/houseManage/days reuses the month toolbar shell without month-only filters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  const toolbar = page.locator('.day-toolbar.month-toolbar')
  await expect(toolbar).toBeVisible()
  await expect(toolbar.locator('.month-store-control')).toHaveCount(1)
  await expect(toolbar.locator('.month-store-switch')).toHaveCount(0)
  await expect(toolbar.locator('.month-store-chip')).toHaveCount(0)
  await expect(toolbar.locator('.month-store-select')).toHaveCount(1)
  const storeSelect = toolbar.getByRole('button', { name: '全部门店' })
  await expect(storeSelect).toBeVisible()
  await storeSelect.click()
  await expect(toolbar.getByRole('listbox', { name: '门店切换' })).toBeVisible()
  await expect(toolbar.getByRole('option', { name: '天落会宿公寓(前海壹方城宝安中心店)' })).toBeVisible()
  await expect(toolbar.locator('.month-settings')).toHaveCount(1)
  await expect(toolbar.locator('.month-batch-action')).toHaveCount(2)
  await expect(toolbar.locator('.month-refresh-action')).toHaveCount(2)
  await expect(toolbar.locator('.month-filter-menu')).toHaveCount(0)
  await expect(toolbar.locator('.month-filter-search-wrap')).toHaveCount(0)
  await expect(toolbar.getByRole('button', { name: '分享房态' })).toBeVisible()
  await expect(toolbar.getByRole('button', { name: '订单刷新' })).toBeVisible()
})

test('/houseManage/days keeps the store settings button clickable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await page.getByRole('button', { name: '门店设置' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)
})

test('/houseManage/days opens the sharing room status page from the toolbar share button', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await page.getByRole('button', { name: '分享房态' }).click()
  await expect(page).toHaveURL(/\/houseManage\/months\/sharingRoomStatus$/)
  await expect(page.getByRole('button', { name: '新增房态分享' })).toBeVisible()
  await expect(page.getByLabel('房态分享空状态')).toContainText('暂无数据')
  await page.getByRole('button', { name: '新增房态分享' }).click()
  const createDialog = page.getByRole('dialog', { name: '创建房态分享' })
  await expect(createDialog).toContainText('分享内容包含敏感信息')
  await createDialog.getByLabel('分享标题').fill('测试分享')
  await expect(createDialog).toContainText('4 / 30')
  await createDialog.getByRole('radio', { name: '否' }).check()
  await createDialog.getByRole('checkbox', { name: '间夜数' }).check()
  await createDialog.getByRole('switch', { name: '房间状态' }).click()
  await createDialog.getByRole('checkbox', { name: '房客姓名' }).check()
  await createDialog.getByRole('radio', { name: '自定义' }).check()
  await expect(createDialog.getByLabel('自定义分享日期')).toBeVisible()
  await createDialog.getByRole('button', { name: '＋ 选择成员' }).click()
  await createDialog.getByRole('button', { name: '＋ 添加房间' }).click()
  const roomPicker = page.getByRole('dialog', { name: '选择房间' })
  await expect(roomPicker.getByLabel('房型标签')).toBeVisible()
  await expect(roomPicker.getByLabel('搜索房间')).toBeVisible()
  await roomPicker.getByLabel('搜索房间').fill('观影')
  await roomPicker.getByRole('checkbox').nth(1).check()
  await roomPicker.getByRole('button', { name: '确定' }).click()
  await createDialog.getByRole('switch', { name: '多视图' }).click()
  await createDialog.getByRole('button', { name: '确定' }).click()
  await expect(page.locator('.room-status-sharing-feedback')).toContainText('已创建房态分享：测试分享')
  await page.locator('.room-status-sharing-breadcrumb button').click()
  await expect(page).toHaveURL(/\/houseManage\/months$/)
})

test('/houseManage/days filters orders by the selected store dropdown option', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await expect(page.locator('.day-room-card')).toHaveCount(4)
  await expect(page.getByText('李思思')).toBeVisible()
  await expect(page.getByText('赵晨')).toBeVisible()

  await page.getByRole('button', { name: '全部门店' }).click()
  await page.getByRole('option', { name: '天落会宿公寓(前海壹方城宝安中心店)' }).click()

  await expect(page.locator('.day-room-card')).toHaveCount(2)
  await expect(page.getByText('李思思')).toBeVisible()
  await expect(page.getByText('赵晨')).toHaveCount(0)
  await expect(page.getByText('张张')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '天落会宿公寓(前海壹方城宝安中心店)' })).toBeVisible()
})

test('/houseManage/days exposes mock provider failures and retry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days?houseDaysMockState=error'))

  await expect(page.getByRole('alert')).toContainText('日房态数据加载失败')
  await expect(page.locator('body')).not.toContainText(/mock provider|未接入阻塞|后端接口未完成/)
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert')).toContainText('日房态数据加载失败')
})

test('/houseManage/days renders the mock empty response without static fallback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days?houseDaysMockState=empty'))

  await expect(page.getByText('暂无日房态数据')).toBeVisible()
  await expect(page.getByText('当前条件下没有可展示房型，请调整筛选条件后重试。')).toBeVisible()
  await expect(page.getByText('李思思')).toHaveCount(0)
  await expect(page.locator('body')).not.toContainText(/mock|未接入阻塞|后端接口未完成/)
})

test('/houseManage/days uses shared month order interactions for booked rooms and keeps business dialogs elsewhere', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 960 })
  await page.goto(appUrl('/houseManage/days'))

  const bookingCard = page.locator('.day-room-card[data-tone]').filter({ hasText: '赵晨' }).first()
  await bookingCard.hover()
  await expect(page.locator('.month-order-popover')).toContainText('预订人: 赵晨')

  await bookingCard.click()
  const drawer = page.getByRole('dialog', { name: '订单详情' })
  await expect(drawer).toContainText('赵晨')
  await expect(drawer).toContainText('飞猪旅行')
  await expect(drawer).toContainText('天落大床电竞套间（1206）')
  await expect(drawer).toContainText('¥428.00')
  await page.getByRole('button', { name: '关闭订单详情' }).click()

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '图例说明' }).click()
  const legendDrawer = page.getByRole('dialog', { name: '图例说明' })
  await expect(legendDrawer).toBeVisible()
  await expect(legendDrawer).toContainText('房间信息')
  await expect(legendDrawer).toContainText('订单颜色')
  await expect(legendDrawer).toContainText('各平台房态不一致')
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
  await expect(bookingCard).toContainText('¥398')
  await settingsDrawer.getByRole('button', { name: '关闭房态显示设置' }).click()

  await page.getByRole('button', { name: '读卡' }).click()
  await expect(page.getByRole('status')).toContainText('请连接读卡器后重试')
})

test('/houseManage/days keeps shared hover and drawer interactions in room-type view', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 960 })
  await page.goto(appUrl('/houseManage/days'))

  await page.locator('.day-filter-tabs button').first().click()

  const bookingCard = page.locator('.day-room-type-section .day-room-card[data-tone]').filter({ hasText: '赵晨' }).first()
  await bookingCard.hover()
  await expect(page.locator('.month-order-popover')).toContainText('预订人: 赵晨')

  await bookingCard.click()
  const drawer = page.getByRole('dialog', { name: '订单详情' })
  await expect(drawer).toContainText('赵晨')
  await expect(drawer).toContainText('飞猪旅行')
  await page.getByRole('button', { name: '关闭订单详情' }).click()
})
