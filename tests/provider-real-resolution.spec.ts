import { expect, test } from '@playwright/test'
import { installRealSession, loginViaGateway } from './helpers/real-auth'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const normalizedPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalizedPath}` : normalizedPath
}

test('provider resolvers treat real as api for api-backed pages', async ({ page, request }) => {
  const token = await loginViaGateway(request)

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.autoStrategySetting.provider': 'real',
      'pms.autoStrategySettingProvider': 'real',
      'pms.financeSetting.provider': 'real',
      'pms.memberSetting.provider': 'real',
      'pms.printSettingProvider': 'real',
      'pms.salesReport.provider': 'real',
    },
  })

  await page.goto(appUrl('/setting/IntelligenceSetting'))
  await expect(page.getByTestId('auto-strategy-setting-service-contract')).toHaveAttribute('data-provider', 'api')

  await page.goto(appUrl('/setting/finance'))
  await expect(page.getByTestId('finance-setting-contract')).toContainText('"provider": "api"')

  await page.goto(appUrl('/setting/member'))
  await expect(page.getByTestId('member-setting-service-contract')).toHaveAttribute('data-provider', 'api')

  await page.goto(appUrl('/setting/print'))
  await expect(page.getByTestId('print-setting-service-contract')).toHaveAttribute('data-provider', 'api')

  await page.goto(appUrl('/statistics/sale?provider=real'))
  await expect(page.locator('.sales-report-page')).toHaveAttribute('data-provider', 'api')
})

test('/statistics/sale real provider uses current camp id for every report request', async ({ page }) => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'provider-real-sales-report-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.salesReport.provider', 'real')
  })

  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          list: [{ poiId: 'poi-10001', poiName: '当前门店' }],
        },
      },
    })
  })
  await page.route('**/api/report/open/room/get', async (route) => {
    requests.push({
      url: route.request().url(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({
      json: {
        success: true,
        data: {
          total: 0,
          size: 20,
          current: 1,
          list: [],
        },
      },
    })
  })
  await page.route('**/api/select/roomCategory/page/get', async (route) => {
    requests.push({
      url: route.request().url(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({ json: { success: true, data: { list: [] } } })
  })
  await page.route('**/api/select/calChannel4Order/get', async (route) => {
    requests.push({
      url: route.request().url(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({ json: { success: true, data: [] } })
  })
  await page.route('**/api/roomCategoryGroups/get', async (route) => {
    requests.push({
      url: route.request().url(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({ json: { success: true, data: [] } })
  })

  await page.goto(appUrl('/statistics/sale?provider=real'))

  await expect(page.locator('.sales-report-page')).toHaveAttribute('data-provider', 'api')
  await expect.poll(() => requests.length).toBeGreaterThanOrEqual(4)
  expect(requests.every((request) => request.body.campId === '10001')).toBe(true)
  expect(requests.map((request) => request.url)).toContainEqual(expect.stringContaining('/api/report/open/room/get'))
})

test('/statistics/shift/record real provider uses current camp id for every report request', async ({ page }) => {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'provider-real-shift-record-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.shiftRecordProvider', 'real')
  })

  await page.route('**/api/shiftWorkReport/page/get', async (route) => {
    requests.push({
      url: route.request().url(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({
      json: {
        success: true,
        data: {
          total: 0,
          size: 20,
          current: 1,
          pageNum: 1,
          list: [],
        },
      },
    })
  })
  await page.route('**/api/select/poi/page/get', async (route) => {
    requests.push({
      url: route.request().url(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({
      json: {
        success: true,
        data: {
          list: [{ poiId: 'poi-10001', poiName: '褰撳墠闂ㄥ簵' }],
        },
      },
    })
  })
  await page.route('**/api/campRoles/get', async (route) => {
    requests.push({
      url: route.request().url(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({
      json: {
        success: true,
        data: {
          employees: [],
        },
      },
    })
  })

  await page.goto(appUrl('/statistics/shift/record'))

  await expect.poll(() => requests.length).toBeGreaterThanOrEqual(3)
  expect(requests.every((request) => request.body.campId === '10001')).toBe(true)
  expect(requests.map((request) => request.url)).toContainEqual(expect.stringContaining('/api/shiftWorkReport/page/get'))
})

test('/order/house-order/list accepts real provider alias for api requests', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = []
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'provider-real-house-order-token')
    window.localStorage.setItem('pmsCampId', 'test-camp')
  })

  await page.route('**/api/order/report/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          todayNewOrder: 1,
          todayPredictCheckIn: 2,
          staying: 3,
          todayPredictCheckOut: 4,
          tomorrowCheckIn: 5,
          tomorrowCheckOut: 6,
          pending: 7,
          refunding: 8,
          exception: 9,
        },
      },
    })
  })
  await page.route('**/api/orders/page/get', async (route) => {
    requests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      json: {
        success: true,
        data: {
          list: [],
          total: 0,
          pageNum: 1,
          pageSize: 20,
          pages: 0,
        },
      },
    })
  })

  await page.goto(appUrl('/order/house-order/list?houseOrderProvider=real&campId=test-camp'))

  await expect.poll(() => requests.length).toBeGreaterThan(0)
  expect(requests.at(-1)).toMatchObject({
    campId: 'test-camp',
    pageNum: 1,
    pageSize: 20,
  })
  await expect(page.getByRole('status', { name: '住宿订单请求状态' })).toContainText('已通过住宿订单数据服务刷新')
})

test('/cleanManage/cleanStatistics accepts real provider alias for api requests', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = []
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'provider-real-clean-statistics-token')
    window.localStorage.setItem('pmsCampId', 'test-camp')
    window.localStorage.setItem('pms.cleanStatisticsProvider', 'real')
  })

  await page.route('**/api/clean/statistics/dashboard', async (route) => {
    requests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      json: {
        success: true,
        data: {
          list: [],
          total: 0,
          pageNum: 1,
          size: 20,
        },
      },
    })
  })
  await page.route('**/api/cleaner/list/get', async (route) => {
    await route.fulfill({ json: { success: true, data: [] } })
  })
  await page.route('**/api/roomCategories/page/get', async (route) => {
    await route.fulfill({ json: { success: true, data: { list: [] } } })
  })

  await page.goto(appUrl('/cleanManage/cleanStatistics'))

  await expect.poll(() => requests.length).toBeGreaterThan(0)
  expect(requests.at(-1)).toMatchObject({
    campId: 'test-camp',
    pageNum: 1,
    pageSize: 20,
  })
})
