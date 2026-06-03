import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const forbiddenDevelopmentCopy = /mock|provider|未接入|阻塞|后端|契约/

function appUrl(routePath: string) {
  const normalizedPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL.replace(/\/$/, '')}${normalizedPath}` : normalizedPath
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'playwright-token')
    window.localStorage.setItem('pms.calendarRoomProvider', 'mock')
  })
})

test('/setting/localRoomTypeProductionSetting loads through explicit calendar-room mock provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))

  await expect(page.getByRole('alert', { name: '日历房数据错误' })).toHaveCount(0)
  await expect(page.getByLabel('日历房售卖产品列表')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByText('第 1-4 条/总共 4 条')).toBeVisible()
  await expect(page.locator('.calendar-room-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.calendar-room-page')).toHaveAttribute('data-request-channel', '')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await page.getByPlaceholder('请输入房型名称').fill('观影')
  await page.getByRole('button', { name: '搜 索' }).click()
  await expect(page.getByRole('status', { name: '日历房操作反馈' })).toContainText('已查询日历房售卖产品')
  await expect(page.locator('.calendar-room-page')).toHaveAttribute('data-request-keyword', '观影')
  await expect(page.locator('.calendar-room-table__room-row')).toHaveCount(1)
  await expect(page.getByLabel('日历房售卖产品列表')).toContainText('观影大床房')
})


test('/setting/localRoomTypeProductionSetting switches to real provider and adapts weiRoomCategories response', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'calendar-token')
    window.localStorage.setItem('pms.currentCampId', '10001')
  })

  const capturedRequests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []
  await page.route('**/api/weiRoomCategories/page/get', async (route) => {
    capturedRequests.push({
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })

    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-calendar-room-trace-001',
        timestamp: '2026-05-30T10:00:00+08:00',
        data: {
          total: 2,
          size: 20,
          current: 1,
          pageNum: 1,
          pages: 1,
          hasNextPage: false,
          list: [
            {
              channelRoomCategoryId: 'wei-room-1',
              channelRoomCategoryName: 'Real Calendar Room A',
              goodsType: 7,
              isCanBooking: 1,
              isAvailability: '1',
              roomCategoryProductGetViews: [
                {
                  roomCategoryProductId: 'sku-1',
                  roomCategoryProductName: 'Real Calendar Room A No Breakfast',
                  sellingPrice: 32800,
                  originalPrice: 39800,
                  isCanBooking: 1,
                  stock: 8,
                  breakfastCount: 0,
                },
                {
                  roomCategoryProductId: 'sku-2',
                  roomCategoryProductName: 'Real Calendar Room A Long Stay',
                  sellingPrice: 29800,
                  originalPrice: 35800,
                  isCanBooking: 0,
                  stock: 0,
                  breakfastCount: 2,
                  cancelPolicy: 'step-refund',
                },
              ],
            },
            {
              channelRoomCategoryId: 'wei-room-2',
              channelRoomCategoryName: 'Real Calendar Room B',
              goodsType: 7,
              isCanBooking: 1,
              roomCategoryProductGetViews: [
                {
                  roomCategoryProductId: 'sku-3',
                  roomCategoryProductName: 'Real Calendar Room B Standard',
                  sellingPrice: 26800,
                  originalPrice: 32800,
                  isCanBooking: 1,
                  stock: 4,
                },
              ],
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl('/setting/localRoomTypeProductionSetting?calendarRoomProvider=real'))

  await expect(page.locator('.calendar-room-page')).toHaveAttribute('data-provider', 'real')
  await expect(page.locator('.calendar-room-page')).toHaveAttribute('data-request-keyword', '')
  await expect(page.locator('.calendar-room-table')).toContainText('Real Calendar Room A')
  await expect(page.locator('.calendar-room-table')).toContainText('Real Calendar Room B')
  await page.locator('.calendar-room-row-toggle').first().click()
  const firstProductGroup = page.locator('.calendar-room-products').first()
  await expect(firstProductGroup).toContainText('Real Calendar Room A No Breakfast')
  await expect(firstProductGroup).toContainText('Real Calendar Room A Long Stay')

  expect(capturedRequests.length).toBeGreaterThanOrEqual(1)
  for (const apiRequest of capturedRequests) {
    expect(apiRequest.headers.authorization).toBe('Bearer calendar-token')
    expect(apiRequest.body).toMatchObject({
      campId: '10001',
      buyCampId: '10001',
      roomCategoryTypes: [1],
      goodsTypes: [7],
      pageNum: 1,
      pageSize: 20,
      keyword: '',
    })
  }
})

test('/setting/localRoomTypeProductionSetting renders empty and failure response states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/setting/localRoomTypeProductionSetting?calendarRoomMockState=empty'))
  await expect(page.getByText('暂无售卖产品')).toBeVisible()
  await expect(page.getByText('当前筛选条件下没有日历房售卖产品，请调整条件后重新查询。')).toBeVisible()
  await expect(page.getByLabel('日历房售卖产品列表')).not.toContainText('顶层套房')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await page.goto(appUrl('/setting/localRoomTypeProductionSetting?calendarRoomMockState=error'))
  await expect(page.getByRole('alert', { name: '日历房数据错误' })).toContainText('日历房数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})

test('/setting/localRoomTypeProductionSetting gives feedback for all visible product actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))

  await page.getByRole('button', { name: '展开' }).first().click()
  const firstProductGroup = page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')
  await page.getByRole('button', { name: '预览' }).first().click()
  await expect(page.getByRole('dialog', { name: '售卖产品详情' })).toContainText('产品名称')
  await page.getByRole('button', { name: '关闭售卖产品详情' }).click()

  await firstProductGroup.getByRole('button', { name: '编辑' }).first().click()
  await expect(page).toHaveURL(/\/setting\/localRoomTypeProductionSetting\/channelGoodsSetting\?/)

  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))
  await page.getByRole('button', { name: '展开' }).first().click()
  await page.getByRole('button', { name: '修改价格' }).first().click()
  await expect(page.getByRole('dialog', { name: '调整售卖价格' })).toContainText('当前价格计划')
  await page.getByRole('button', { name: '保存价格' }).click()
  await expect(page.getByRole('status', { name: '日历房操作反馈' })).toContainText('售卖价格已保存')

  await page.getByRole('button', { name: '下架' }).first().click()
  await expect(page.getByRole('dialog', { name: '调整上下架状态' })).toContainText('确认下架')
  await page.getByRole('button', { name: '确认调整' }).click()
  await expect(page.getByRole('status', { name: '日历房操作反馈' })).toContainText('售卖状态已更新')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})

test('/setting/localRoomTypeProductionSetting matches captured calendar-room list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '日历房', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '日历房' })).toHaveClass(/is-active/)
  await page.locator('.sidebar').getByRole('button', { name: '预售券' }).click()
  await expect(page.locator('.sidebar').getByRole('link', { name: '预售券' })).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '酒店套餐' })).toBeVisible()

  await expect(page.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新增售卖产品' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入房型名称')).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上架状态 全部' })).toBeVisible()
  await expect(page.getByRole('button', { name: '展开' }).first()).toBeVisible()

  await expect(page.getByLabel('日历房售卖产品列表').locator('.calendar-room-table__head > div')).toHaveText([
    '展开',
    '房型名称',
    '关联渠道',
    '产品数量',
    '操作',
  ])

  const rows = page.locator('.calendar-room-table__room-row')
  await expect(rows).toHaveCount(4)
  await expect(rows.nth(0)).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(rows.nth(0)).toContainText('11')
  await expect(rows.nth(1)).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('天落大床电竞套间')
  await expect(rows.nth(2)).toContainText('8')
  await expect(rows.nth(3)).toContainText('观影大床房')
  await expect(rows.nth(3)).toContainText('8')
  await expect(page.getByText('第 1-4 条/总共 4 条')).toBeVisible()
})

test('/setting/localRoomTypeProductionSetting supports captured expansion and navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))

  await page.getByRole('button', { name: '展开' }).first().click()
  await expect(page.getByRole('button', { name: '收起' }).first()).toBeVisible()
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('产品名称：')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('渠道：')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('早餐类型：')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('退订政策：')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('修改价格')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('下架')

  await page.getByRole('button', { name: '房价管理' }).first().click()
  await expect(page).toHaveURL(/\/houseManage\/channelPrice$/)

  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))
  await page.getByRole('button', { name: '新增售卖产品' }).click()
  await expect(page).toHaveURL(/\/setting\/localRoomTypeProductionSetting\/channelGoodsSetting$/)
})

test('/setting/localRoomTypeProductionSetting/channelGoodsSetting matches target channel-specific add form', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting/channelGoodsSetting'))

  await expect(page.getByRole('tab', { name: '微信小程序' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('新增产品')).toContainText('选择房型')
  await expect(page.getByLabel('新增产品')).toContainText('售卖产品名称')
  await expect(page.getByLabel('新增产品')).toContainText('系统自动生成，物理房型名称-早餐-退改规则')
  await expect(page.getByLabel('新增产品')).toContainText('产品类型')
  await expect(page.getByLabel('新增产品')).toContainText('早餐')
  await expect(page.getByLabel('新增产品')).toContainText('取消规则')
  await expect(page.getByLabel('新增产品')).toContainText('房价')
  await expect(page.getByLabel('新增产品')).not.toContainText('房型类型')
  await expect(page.getByLabel('新增产品')).not.toContainText('收款方式')
  await expect(page.getByLabel('新增产品')).not.toContainText('自助机品牌')
  await expect(page.getByRole('radio', { name: '不可退' })).toBeChecked()
  await expect(page.getByRole('button', { name: '确 定' })).toBeVisible()

  await page.getByRole('tab', { name: '抖音来客' }).click()
  await expect(page.getByRole('tab', { name: '抖音来客' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('新增产品')).toContainText('房型类型')
  await expect(page.getByRole('radio', { name: '日历房' })).toBeChecked()
  await expect(page.getByLabel('新增产品')).toContainText('收款方式')
  await expect(page.getByRole('radio', { name: '总部收款' })).toBeChecked()
  await expect(page.getByLabel('新增产品')).toContainText('2026-05-21')
  await expect(page.getByLabel('新增产品')).toContainText('2026-06-21')
  await expect(page.getByLabel('新增产品')).toContainText('自动续期')
  await expect(page.getByRole('radio', { name: '钟点房' })).toBeDisabled()

  await page.getByRole('tab', { name: '自助机' }).click()
  await expect(page.getByRole('tab', { name: '自助机' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('新增产品')).toContainText('自助机品牌')
  await expect(page.getByRole('radio', { name: '自助机RW' })).toBeChecked()
  await expect(page.getByLabel('新增产品')).toContainText('自助机LM')
  await expect(page.getByLabel('新增产品')).not.toContainText('收款方式')

  await page.getByRole('button', { name: '日历房' }).click()
  await expect(page).toHaveURL(/\/setting\/localRoomTypeProductionSetting$/)
  await expect(page.getByRole('button', { name: '新增售卖产品' })).toBeVisible()
})

test('/setting/localRoomTypeProductionSetting/channelGoodsSetting shows channel-specific room picker states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting/channelGoodsSetting'))

  await page.getByRole('button', { name: '＋ 房型' }).click()
  await expect(page.getByRole('dialog', { name: '选择微信小程序房型' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '选择微信小程序房型' })).toContainText('选择渠道房型')
  await expect(page.getByLabel('渠道房型列表')).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(page.getByLabel('渠道房型列表')).toContainText('天荟大床电竞套间')
  await expect(page.getByLabel('渠道房型列表')).toContainText('观影大床房')
  await expect(page.getByText('暂无数据')).toHaveCount(0)
  await page.getByRole('button', { name: '关闭选择渠道房型' }).click()

  for (const channel of ['小红书', '抖音来客', '自助机']) {
    await page.getByRole('tab', { name: channel }).click()
    await page.getByRole('button', { name: '＋ 房型' }).click()
    await expect(page.getByRole('dialog', { name: `选择${channel}房型` })).toBeVisible()
    await expect(page.getByText('暂无数据')).toBeVisible()
    await expect(page.getByLabel('渠道房型列表')).toHaveCount(0)
    await page.getByRole('button', { name: '关闭选择渠道房型' }).click()
  }
})
