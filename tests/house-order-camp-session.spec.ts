import { expect, test } from '@playwright/test'

function appUrl(routePath: string) {
  return routePath.startsWith('/#') ? routePath : `/#${routePath}`
}

test('住宿订单从登录用户会话读取当前门店上下文', async ({ page }) => {
  const orderRequests: Array<Record<string, unknown>> = []

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
    orderRequests.push(route.request().postDataJSON() as Record<string, unknown>)
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

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'house-order-session-token')
    window.localStorage.removeItem('pmsCampId')
    window.localStorage.removeItem('pms.currentCampId')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '12001',
        name: '系统管理员',
        mobile: '13800000001',
        roleName: '管理员',
        campId: '20002',
        campName: '路客云演示门店',
      }),
    )
  })

  await page.goto(appUrl('/order/house-order/list'))

  await expect.poll(() => orderRequests.length).toBe(1)
  expect(orderRequests[0]).toMatchObject({
    campId: '20002',
    pageNum: 1,
    pageSize: 20,
  })
})
