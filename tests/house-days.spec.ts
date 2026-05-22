import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

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

test('/houseManage/days switches view modes to match target layouts', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  const tabs = page.locator('.day-filter-tabs button')
  await expect(tabs.nth(1)).toHaveClass(/is-active/)
  await expect(page.locator('.day-room-card')).toHaveCount(4)

  await tabs.nth(0).click()
  await expect(tabs.nth(0)).toHaveClass(/is-active/)
  await expect(page.getByTestId('day-room-type-grid')).toBeVisible()
  await expect(page.locator('.day-room-type-section')).toHaveCount(4)
  await expect(page.locator('.day-room-type-section h3').first()).not.toHaveText('')
  await expect(page.locator('.day-room-type-section .day-room-card')).toHaveCount(4)

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
  await expect(arrivalGroup).toContainText('预抵1')
  await expect(arrivalGroup).toContainText('预离3')
  await expect(arrivalGroup).toContainText('在住3')
  await expect(roomStatusGroup).toContainText('空净1')
  await expect(roomStatusGroup).toContainText('住净2')
  await expect(roomStatusGroup).toContainText('住脏1')

  await arrivalGroup.locator('input[type="checkbox"]').first().check()
  await expect(page.locator('.day-empty-state')).toBeVisible()
  await expect(page.locator('.day-empty-state')).toContainText('暂无日房态数据')
})

test('/houseManage/days reuses the month toolbar shell without month-only filters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  const toolbar = page.locator('.day-toolbar.month-toolbar')
  await expect(toolbar).toBeVisible()
  await expect(toolbar.locator('.month-store-control')).toHaveCount(1)
  await expect(toolbar.locator('.month-store-switch')).toHaveCount(1)
  await expect(toolbar.locator('.month-store-chip')).toBeVisible()
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

test('/houseManage/days filters orders by the selected current store chip', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await expect(page.locator('.day-room-card')).toHaveCount(4)
  await expect(page.getByText('李思思')).toBeVisible()
  await expect(page.getByText('赵晨')).toBeVisible()

  await page.getByRole('button', { name: '天落会宿公寓(前海壹方城宝安中心店)' }).click()

  await expect(page.locator('.day-room-card')).toHaveCount(2)
  await expect(page.getByText('赵晨')).toBeVisible()
  await expect(page.getByText('张张')).toBeVisible()
  await expect(page.getByText('李思思')).toHaveCount(0)
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
  await expect(page.getByText('当前条件下没有可展示房间，请调整筛选条件后重试。')).toBeVisible()
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
  await page.getByRole('menuitem', { name: '房态设置' }).click()
  await expect(page.getByRole('dialog', { name: '房态设置' })).toContainText('自动刷新')
  await page.getByRole('button', { name: '保存设置' }).click()

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
