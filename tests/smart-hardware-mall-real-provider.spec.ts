import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const normalizedPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalizedPath}` : normalizedPath
}

test('/smartHotel/smartHardware/mall api provider adapts real overview and detail flow', async ({ page }) => {
  const requests: Array<{ path: string; body: Record<string, unknown> }> = []

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'smart-hardware-mall-contract-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '12001',
        name: '演示管理员',
        campName: '演示门店',
      }),
    )
    window.localStorage.setItem('pms.smartHardwareMallProvider', 'api')
  })

  await page.route('**/api/weiRoomCategories/page/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })

    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-hardware-overview-001',
        timestamp: '2026-06-01T15:20:00+08:00',
        data: {
          list: [
            {
              channelRoomCategoryId: '99601',
              channelRoomCategoryName: '门卡管理系统',
              description: '门卡制卡、发卡与房卡管理统一采购入口',
              mainPhoto: 'https://example.com/door-card-system.png',
              goodsType: 6,
              lowestSellingPrice: 80000,
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/youzan/commodity/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })

    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-hardware-commodity-001',
        timestamp: '2026-06-01T15:21:00+08:00',
        data: {
          commodityId: '99601',
          commodityName: '门卡管理系统',
          description: '门卡制卡、发卡与房卡管理统一采购入口',
          sellingPriceCent: 80000,
          originalPriceCent: 120000,
          purchaseTermLabel: '1年',
          roomCategoryIds: ['22001', '22002'],
        },
      },
    })
  })

  await page.route('**/api/rooms/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })

    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-hardware-rooms-001',
        timestamp: '2026-06-01T15:21:30+08:00',
        data: {
          roomCategoryRooms: [
            { roomCategoryId: '22001', roomCategoryName: '标准大床房', rooms: [{ roomName: '1001' }, { roomName: '1002' }] },
            { roomCategoryId: '22002', roomCategoryName: '豪华双床房', rooms: [{ roomName: '2001' }] },
          ],
        },
      },
    })
  })

  await page.route('**/api/paymentTypes/get/v2', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })

    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-hardware-payment-001',
        timestamp: '2026-06-01T15:21:40+08:00',
        data: {
          paymentGroups: [
            {
              groupType: 1,
              groupTypeName: '住宿',
              paymentTypes: [{ paymentTypeName: '加床' }, { paymentTypeName: '加人' }],
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl('/smartHotel/smartHardware/mall'))

  const shell = page.locator('.smart-hardware-mall-page')
  await expect(shell).toHaveAttribute('data-provider', 'api')
  await expect(shell).toHaveAttribute('data-page', 'mall')
  await expect(page.getByRole('heading', { name: '门卡管理系统', level: 1 })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('蜂助手 CPE 路由器 P5(5G 门店版)')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: '立即购买' })).toHaveCount(1)
  await expect(page.getByRole('button', { name: '联系客服' })).toHaveCount(6)

  await page.getByRole('button', { name: '立即购买' }).click()

  await expect(shell).toHaveAttribute('data-page', 'detail')
  await expect(page.getByText('演示门店')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('2 个适用房型 / 3 间房')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('住宿分组 / 2 个支付项')).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: '查看适用房型' }).click()
  await expect(page.getByRole('dialog', { name: '适用房型' })).toContainText('标准大床房')
  await page.getByRole('button', { name: '关闭适用房型' }).click()

  await page.getByRole('button', { name: '查看支付方式' }).click()
  await expect(page.getByRole('dialog', { name: '支付方式' })).toContainText('加床')

  expect(requests).toEqual(
    expect.arrayContaining([
      {
        path: '/api/weiRoomCategories/page/get',
        body: {
          campId: '64',
          buyCampId: '10001',
          roomCategoryTypes: [1],
          goodsTypes: [6],
        },
      },
      {
        path: '/api/youzan/commodity/get',
        body: {
          campId: '10001',
          commodityId: '99601',
        },
      },
      {
        path: '/api/rooms/get',
        body: {
          campId: '10001',
          roomCategoryIds: ['22001', '22002'],
          saleType: 1,
        },
      },
      {
        path: '/api/paymentTypes/get/v2',
        body: {
          campId: '10001',
          bizTypes: [2],
          isEnable: 1,
        },
      },
    ]),
  )
})
