import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

const cleanStatisticsEndpoint = 'https://hudson-prod.localhome.cn/cleanTask/statistics'
const cleanerEndpoint = 'https://hudson-prod.localhome.cn/cleaner/list/get'
const roomCategoriesEndpoint = 'https://hudson-prod.localhome.cn/roomCategories/page/get'
const roomsEndpoint = 'https://hudson-prod.localhome.cn/rooms/get'

test('/cleanManage/cleanStatistics exposes missing campId instead of static data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStatistics'))

  await expect(page.getByRole('alert', { name: '保洁统计数据阻塞' })).toContainText('缺少 campId')
  await expect(page.getByText('18980.88')).toHaveCount(0)
  await expect(page.getByText('CL20260513001')).toHaveCount(0)
})

test('/cleanManage/cleanStatistics requests real statistics and renders response rows', async ({ page }) => {
  const statisticsRequests: Array<Record<string, unknown>> = []

  await mockLookupRequests(page)
  await page.route(cleanStatisticsEndpoint, async (route) => {
    statisticsRequests.push(JSON.parse(route.request().postData() || '{}') as Record<string, unknown>)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          total: 2,
          size: 20,
          current: 1,
          pageNum: 1,
          hasNextPage: false,
          list: [
            {
              cleanTime: '合计',
              countNum: 3,
              countCost: 18800,
              cleanTypeOneNum: 1,
              cleanTypeOneCost: 6600,
              cleanTypeTwoNum: 2,
              cleanTypeTwoCost: 12200,
              cleanTypeThreeNum: 0,
              cleanTypeThreeCost: 0,
              cleanTypeFourNum: 0,
              cleanTypeFourCost: 0,
            },
            {
              cleanTime: '2026-05-16',
              countNum: 3,
              countCost: 18800,
              cleanTypeOneNum: 1,
              cleanTypeOneCost: 6600,
              cleanTypeTwoNum: 2,
              cleanTypeTwoCost: 12200,
              cleanTypeThreeNum: 0,
              cleanTypeThreeCost: 0,
              cleanTypeFourNum: 0,
              cleanTypeFourCost: 0,
            },
          ],
        },
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStatistics?campId=camp-1'))

  await expect(page.getByLabel('保洁统计汇总表')).toContainText('2026-05-16')
  await expect(page.getByLabel('保洁统计汇总表')).toContainText('188.00')
  await expect(page.getByRole('status', { name: '保洁统计请求状态' })).toContainText('cleanTask/statistics')
  expect(statisticsRequests[0]).toMatchObject({
    campId: 'camp-1',
    pageNum: 1,
    pageSize: 20,
    cleanStartTime: 1777564800000,
    cleanEndTime: 1778947199999,
  })

  await page.getByLabel('开始日期').fill('2026-05-10')
  await page.getByLabel('结束日期').fill('2026-05-12')
  await page.getByRole('button', { name: '查 询' }).click()
  expect(statisticsRequests.at(-1)).toMatchObject({
    cleanStartTime: 1778342400000,
    cleanEndTime: 1778601599999,
  })
})

test('/cleanManage/cleanStatistics exposes backend failures and retry entry', async ({ page }) => {
  await mockLookupRequests(page)
  await page.route(cleanStatisticsEndpoint, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, errorMsg: '没有登录', data: null }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStatistics?campId=camp-1'))

  await expect(page.getByRole('alert', { name: '保洁统计数据错误' })).toContainText('没有登录')
  await expect(page.getByRole('button', { name: '重试请求' })).toBeVisible()
  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('alert', { name: '保洁统计数据错误' })).toContainText('导出接口未取证')
})

async function mockLookupRequests(page: import('@playwright/test').Page) {
  await page.route(cleanerEndpoint, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{ cleanerId: 'cleaner-1', cleanerName: '李清清' }],
      }),
    })
  })
  await page.route(roomCategoriesEndpoint, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          list: [
            { roomCategoryId: 'room-type-1', roomCategoryName: '观影大床房' },
            { roomCategoryId: 'room-type-2', roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）' },
          ],
        },
      }),
    })
  })
  await page.route(roomsEndpoint, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          roomCategoryRooms: [
            {
              roomCategoryId: 'room-type-1',
              roomCategoryName: '观影大床房',
              rooms: [{ roomId: 'room-1', roomName: '房间1' }],
            },
            {
              roomCategoryId: 'room-type-2',
              roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
              rooms: [{ roomId: 'room-2', roomName: '房间1' }],
            },
          ],
        },
      }),
    })
  })
}
