import { expect, test, type Page } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  if (routePath.startsWith('/#')) return appBaseURL ? `${appBaseURL}${routePath}` : routePath

  const [hashPath, queryString = ''] = routePath.split('?')
  const normalizedPath = queryString ? `/?${queryString}#${hashPath}` : `/#${hashPath}`
  return appBaseURL ? `${appBaseURL}${normalizedPath}` : normalizedPath
}

async function preparePage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'store-select-ui-token')
    window.localStorage.setItem('pmsCampId', '1796067693589061634')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '1',
        name: 'Playwright Admin',
        mobile: '13800000001',
        roleName: 'Platform Admin',
        campId: '1796067693589061634',
        campName: '测试门店',
      }),
    )
    window.localStorage.setItem('pms.statisticsReport.provider', 'mock')
    window.localStorage.setItem('pms.salesReport.provider', 'mock')
    window.localStorage.setItem('pms.incomeReport.provider', 'mock')
    window.localStorage.setItem('pms.profitReport.provider', 'mock')
    window.localStorage.setItem('pms.cleanLog.provider', 'mock')
    window.localStorage.setItem('pms.cleanLogProvider', 'mock')
    window.localStorage.setItem('pms.cleanStatisticsProvider', 'mock')
    window.localStorage.setItem('pms.houseStatusLogsProvider', 'mock')
    window.localStorage.setItem('pms.priceLogProvider', 'mock')
    window.localStorage.setItem('pmsPresaleOrderProvider', 'mock')
    window.localStorage.setItem('pmsHotelPackageOrderProvider', 'mock')
    window.localStorage.setItem('pms.presaleSales.provider', 'mock')
    window.localStorage.setItem('pms.aiGlobalData.provider', 'mock')
    window.localStorage.setItem('pms.aiGlobalDataProvider', 'mock')
    window.localStorage.setItem('pms.applicationPaymentProvider', 'mock')
    window.localStorage.setItem('pms.houseMonthsProvider', 'mock')
    window.localStorage.setItem('pms.houseMonthsMockMode', 'success')
    window.localStorage.setItem('pms.roomSituation.provider', 'mock')
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
    window.localStorage.setItem('pms.distributionListProvider', 'mock')
    window.localStorage.setItem('pms.hotelProductProvider', 'mock')
    window.localStorage.setItem('pms.preSaleCouponMallProvider', 'mock')
    window.localStorage.setItem('pms.statisticsDistributionOrderProvider', 'mock')
    window.localStorage.setItem('pms.statementOrderProvider', 'mock')
    window.localStorage.setItem('pms.psbLogProvider', 'mock')
    window.localStorage.setItem('pms.totalLedgerProvider', 'mock')
    window.localStorage.setItem('pms.shiftRecordProvider', 'mock')
    window.localStorage.setItem('pmsRetailPriceProvider', 'mock')
    window.localStorage.setItem('pms.ledgerEntryProvider', 'mock')
    window.localStorage.setItem('pms.calendarRoomProvider', 'mock')
    window.localStorage.setItem('pmsCalendarRoomProvider', 'mock')
    window.localStorage.setItem('pms.roomTypeInfoProvider', 'mock')
  })
  await page.route('**/select/poi/page/get', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          list: [
            { poiId: '1796067693589061634', poiName: '天落会宿公寓(前海壹方城宝安中心店)' },
            { poiId: '1796067693589061635', poiName: '天落会宿公寓(科技园店)' },
          ],
        },
      }),
    })
  })
  await page.route('**/roomCategoryStatuses/central/get', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          roomStatusViews: [],
          pageX: { total: 0, pageNum: 1, pageSize: 15, hasNextPage: false },
        },
      }),
    })
  })
  await page.setViewportSize({ width: 1440, height: 900 })
}

const routeCases = [
  { path: '/houseManage/logs/status?mockScenario=empty', label: 'house status logs' },
  { path: '/houseManage/logs/price?priceLogProvider=mock&priceLogMockState=empty', label: 'price logs' },
  { path: '/mallManagement/orderManagement?mockState=empty', label: 'presale orders' },
  { path: '/mallManagement/hotelPackageOrder?mockState=empty', label: 'hotel package orders' },
  { path: '/statistics/presale?mockState=empty', label: 'presale sales report' },
  { path: '/statistics/report', label: '统计总览' },
  { path: '/statistics/sale', label: '销况报表' },
  { path: '/statistics/stay', label: '收入报表' },
  { path: '/statistics/ledger', label: '记一笔明细' },
  { path: '/statistics/orderLedger', label: '收支明细' },
  { path: '/statistics/statementOrder', label: '品牌小程序订单' },
  { path: '/statistics/profitReport', label: '利润报表' },
  { path: '/cleanManage/cleanTask', label: '保洁任务' },
  { path: '/cleanManage/cleanStatistics', label: '保洁统计' },
  { path: '/cleanManage/cleanStaff', label: '保洁人员' },
  { path: '/cleanManage/cleanSetting', label: '保洁设置' },
  { path: '/cleanManage/cleanLog', label: '保洁日志' },
  { path: '/channels/globalRadar/globalData', label: 'AI全域雷达' },
  { path: '/channels/globalRadar/globalSetting', label: 'AI全域雷达设置' },
  { path: '/houseManage/months', label: '月房态' },
  { path: '/houseManage/days?houseDaysProvider=mock', label: '日房态' },
  { path: '/houseManage/houseCale', label: '中央价' },
  { path: '/houseManage/channelPrice', label: '渠道RP价' },
  { path: '/houseManage/priceComparison', label: '竞争圈比价' },
  { path: '/houseManage/retailPrice', label: '门市价' },
  { path: '/statistics/roomSituation', label: '房情表' },
  { path: '/InformationMaintenance/informationOverview', label: '信息概览' },
  { path: '/mallManagement/weapp/decorate', label: '品牌官网' },
  { path: '/setting/localRoomTypeProductionSetting', label: '日历房' },
  { path: '/setting/roomTypeInfo', label: '房型信息' },
  { path: '/scrm/memberCenter/integrate', label: '会员积分' },
  { path: '/customer/addBatch', label: '批量加好友' },
  { path: '/channels/distribution/distributionSecond?tab=undistributed', label: '分销列表' },
  { path: '/mallManagement/hotelProduct', label: '酒店套餐' },
  { path: '/mallManagement/goodsManagement', label: '预售券' },
  { path: '/statistics/preSaleCouponMall', label: '预售券核销明细' },
  { path: '/statistics/distributionOrder', label: '聚合分销订单' },
  { path: '/psb/log', label: '公安上报日志' },
  { path: '/statistics/totalLedger', label: '收支汇总' },
  { path: '/statistics/shift/record', label: '交接班' },
]

for (const routeCase of routeCases) {
  test(`${routeCase.label} uses the shared store dropdown in the main filter area`, async ({ page }) => {
    await preparePage(page)
    await page.goto(appUrl(routeCase.path))

    const trigger = page.locator('.month-store-select__trigger').first()
    await expect(trigger).toBeVisible()
    await expect(trigger).toBeEnabled()
    await trigger.click()
    await expect(page.getByRole('option', { name: '全部门店' }).first()).toBeVisible()
  })
}

const backendStoreOptionRouteCases = [
  { path: '/houseManage/logs/status?mockScenario=empty', selector: '.house-status-log-store .month-store-select__trigger', label: 'house status logs' },
  { path: '/houseManage/logs/price?priceLogProvider=mock&priceLogMockState=empty', selector: '.price-log-store .month-store-select__trigger', label: 'price logs' },
  { path: '/mallManagement/orderManagement?mockState=empty', selector: '.presale-order-store .month-store-select__trigger', label: 'presale orders' },
  { path: '/mallManagement/hotelPackageOrder?mockState=empty', selector: '.hotel-package-order-store .month-store-select__trigger', label: 'hotel package orders' },
  { path: '/statistics/presale?mockState=empty', selector: '.presale-sales-store .month-store-select__trigger', label: 'presale sales report' },
  { path: '/statistics/report', selector: '.statistics-report-store .month-store-select__trigger', label: '统计总览' },
  { path: '/statistics/sale', selector: '.sales-report-store-row .month-store-select__trigger', label: '销况报表' },
  { path: '/statistics/stay', selector: '.income-report-store-row .month-store-select__trigger', label: '收入报表' },
  { path: '/statistics/ledger', selector: '.order-ledger-store-row .month-store-select__trigger', label: '记一笔明细' },
  { path: '/statistics/orderLedger', selector: '.order-ledger-store-row .month-store-select__trigger', label: '收支明细' },
  { path: '/statistics/statementOrder', selector: '.statement-order-store .month-store-select__trigger', label: '品牌小程序订单' },
  { path: '/statistics/profitReport', selector: '.profit-report-store-row .month-store-select__trigger', label: '利润报表' },
  { path: '/cleanManage/cleanTask', selector: '.clean-store-tabs .month-store-select__trigger', label: '保洁任务' },
  { path: '/cleanManage/cleanStatistics', selector: '.clean-stat-store .month-store-select__trigger', label: '保洁统计' },
  { path: '/cleanManage/cleanStaff', selector: '.clean-store-tabs .month-store-select__trigger', label: '保洁人员' },
  { path: '/cleanManage/cleanSetting', selector: '.clean-setting-store .month-store-select__trigger', label: '保洁设置' },
  { path: '/cleanManage/cleanLog', selector: '.clean-log-store-row .month-store-select__trigger', label: '保洁日志' },
  { path: '/channels/globalRadar/globalSetting', selector: '.global-setting-store-select .month-store-select__trigger', label: 'AI全域雷达设置' },
  { path: '/houseManage/months', selector: '.month-store-control .month-store-select__trigger', label: '月房态' },
  { path: '/houseManage/days?houseDaysProvider=mock', selector: '.month-store-control .month-store-select__trigger', label: '日房态' },
  { path: '/statistics/roomSituation', selector: '.room-situation-store-control .month-store-select__trigger', label: '房情表' },
  { path: '/houseManage/priceComparison', selector: '.price-comparison-store .month-store-select__trigger', label: '竞争圈比价' },
  { path: '/houseManage/retailPrice', selector: '.retail-store-switch .month-store-select__trigger', label: '门市价' },
  { path: '/mallManagement/weapp/decorate', selector: '.brand-toolbar-store .month-store-select__trigger', label: '品牌官网' },
  { path: '/setting/localRoomTypeProductionSetting', selector: '.calendar-room-storebar .month-store-select__trigger', label: '日历房' },
  { path: '/setting/roomTypeInfo', selector: '.room-type-info-store-select .month-store-select__trigger', label: '房型信息' },
  { path: '/scrm/memberCenter/integrate', selector: '.member-points-store-select .month-store-select__trigger', label: '会员积分' },
  { path: '/mallManagement/goodsManagement', selector: '.presale-goods-storebar .month-store-select__trigger', label: '预售券' },
  { path: '/channels/distribution/distributionSecond?tab=undistributed', selector: '.distribution-store-switch .month-store-select__trigger', label: '分销列表' },
  { path: '/mallManagement/hotelProduct', selector: '.hotel-product-storebar .month-store-select__trigger', label: '酒店套餐' },
  { path: '/statistics/preSaleCouponMall', selector: '.presale-coupon-store-switch .month-store-select__trigger', label: '预售券核销明细' },
  { path: '/statistics/distributionOrder', selector: '.statistics-distribution-store .month-store-select__trigger', label: '聚合分销订单' },
  { path: '/psb/log', selector: '.psb-log-store-row .month-store-select__trigger', label: '公安上报日志' },
  { path: '/statistics/totalLedger', selector: '.total-ledger-store-row .month-store-select__trigger', label: '收支汇总' },
  { path: '/statistics/shift/record', selector: '.shift-record-query .month-store-select__trigger', label: '交接班' },
  { path: '/InformationMaintenance/informationOverview', selector: '.settings-store-select-wrap .month-store-select__trigger', label: '信息概览' },
]

for (const routeCase of backendStoreOptionRouteCases) {
  test(`${routeCase.label} store dropdown exposes backend store options`, async ({ page }) => {
    await preparePage(page)
    await page.goto(appUrl(routeCase.path))

    const trigger = page.locator(routeCase.selector).first()
    await expect(trigger).toBeVisible()
    await expect(trigger).toBeEnabled()
    await trigger.click()
    await expect(page.getByRole('option', { name: '全部门店' }).first()).toBeVisible()
    await expect(page.getByRole('option', { name: '天落会宿公寓(科技园店)' }).first()).toBeVisible()
  })
}

test('中央价 store dropdown loads backend store options and writes selected poiIds into the request', async ({ page }) => {
  await preparePage(page)
  const centralRequests: Array<Record<string, unknown>> = []

  await page.route('**/roomCategoryStatuses/central/get', async (route) => {
    centralRequests.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          roomStatusViews: [],
          pageX: { total: 0, pageNum: 1, pageSize: 15, hasNextPage: false },
        },
      }),
    })
  })

  await page.goto(appUrl('/houseManage/houseCale'))

  const trigger = page.locator('.price-toolbar-store-select .month-store-select__trigger')
  await expect(trigger).toBeVisible()
  await expect(trigger).toBeEnabled()
  await trigger.click()
  await expect(page.getByRole('option', { name: '全部门店' })).toBeVisible()
  await page.getByRole('option', { name: '天落会宿公寓(科技园店)' }).click()

  await expect(trigger).toContainText('天落会宿公寓(科技园店)')
  await expect.poll(() => centralRequests.at(-1)?.poiIds).toEqual(['1796067693589061635'])
})

test('日房态 store dropdown only uses backend store options', async ({ page }) => {
  await preparePage(page)
  await page.route('**/api/roomStatusesToday/get', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        traceId: 'test-house-days-real',
        timestamp: '2026-06-05T10:00:00+08:00',
        data: {
          roomCategories: [
            {
              roomCategoryId: 'cat-demo',
              roomCategoryName: '测试房型',
              rooms: [{ roomId: 'room-demo', roomName: '101', isIdle: 1, isDirty: 0 }],
            },
          ],
        },
      }),
    })
  })
  await page.goto(appUrl('/houseManage/days?houseDaysProvider=real'))

  const trigger = page.locator('.month-store-control .month-store-select__trigger').first()
  await expect(trigger).toBeVisible()
  await expect(trigger).toBeEnabled()
  await trigger.click()
  await expect(page.getByRole('option', { name: '天落会宿公寓(科技园店)' }).first()).toBeVisible()
  await expect(page.getByRole('option', { name: '路客云演示门店' })).toHaveCount(0)
})

const settingsEntryRouteCases = [
  { path: '/houseManage/months', label: '月房态' },
  { path: '/houseManage/days?houseDaysProvider=mock', label: '日房态' },
  { path: '/statistics/roomSituation', label: '房情表' },
]

for (const routeCase of settingsEntryRouteCases) {
  test(`${routeCase.label} store dropdown uses the shared settings control wrapper`, async ({ page }) => {
    await preparePage(page)
    await page.goto(appUrl(routeCase.path))

    const sharedControl = page.locator('.month-store-control--with-settings').first()
    await expect(sharedControl).toBeVisible()
    await expect(sharedControl.locator('.month-store-select__trigger')).toBeVisible()
    await expect(sharedControl.getByRole('button', { name: '门店设置' })).toBeVisible()
  })
}
