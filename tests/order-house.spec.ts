import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, type Page, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotDir = path.resolve(
  __dirname,
  '../artifacts/screenshots/dingdan--zhusu-dingdan--zhusu-dingdan',
)

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

async function mockHouseOrderApis(page: Page, payload = houseOrderPayload) {
  const requests: Array<Record<string, unknown>> = []

  await page.route('https://hudson-prod.localhome.cn/order/report/get', async (route) => {
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

  await page.route('https://hudson-prod.localhome.cn/orders/page/get', async (route) => {
    requests.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })

  return requests
}

test('/order/house-order/list loads through the real lodging order request layer', async ({ page }) => {
  const requests = await mockHouseOrderApis(page)

  await page.goto('/order/house-order/list?campId=test-camp')

  await expect(page.getByRole('status', { name: '住宿订单请求状态' })).toContainText('已通过真实接口刷新')
  await expect.poll(() => requests.length).toBe(1)
  expect(requests[0]).toMatchObject({
    campId: 'test-camp',
    pageNum: 1,
    pageSize: 20,
    orderType: '',
    isLt: 0,
  })

  const table = page.getByRole('table', { name: '住宿订单列表' })
  await expect(table).toContainText('2055526750698446849')
  await expect(table).toContainText('蔡勇君')
  await expect(table).toContainText('房间1')
  await expect(table).toContainText('2055103007337734146')
  await expect(table.getByRole('button', { name: '排房' })).toBeVisible()
  await expect(page.locator('.order-pagination')).toContainText('共 2 条')

  await page.getByRole('radio', { name: '今日预抵' }).click()
  await expect.poll(() => requests.length).toBe(2)
  expect(requests.at(-1)).toMatchObject({ campId: 'test-camp', orderType: '11' })
})

test('/order/house-order/list exposes request failures and empty data without static fallback', async ({ page }) => {
  await page.route('https://hudson-prod.localhome.cn/order/report/get', async (route) => {
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, errorMsg: 'report failed' }) })
  })
  await page.route('https://hudson-prod.localhome.cn/orders/page/get', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, errorMsg: 'orders failed' }) })
  })

  await page.goto('/order/house-order/list?campId=test-camp')
  await expect(page.getByRole('alert')).toContainText('真实接口请求失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: '2054409001821356034' })).toHaveCount(0)

  await mockHouseOrderApis(page, { success: true, data: { total: 0, pageNum: 1, pageSize: 20, pages: 0, list: [] } })
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('/order/house-order/list matches captured lodging order table', async ({ page }) => {
  await mockHouseOrderApis(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/order/house-order/list?campId=test-camp')

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
  await expect(table.getByRole('columnheader')).toHaveCount(24)
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
  await mockHouseOrderApis(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/order/house-order/list?campId=test-camp')

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
