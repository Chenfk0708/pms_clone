import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const centralPriceEndpoint = '**/roomCategoryStatuses/central/get'

const centralPriceResponse = {
  success: true,
  errorCode: null,
  errorMsg: null,
  data: {
    roomStatusViews: [
      {
        roomCategoryId: 'room-a',
        roomCategoryName: '测试房型A',
        normalPrice: 73000,
        normalActualSalePrice: 73000,
        seq: 1,
        statusViews: [
          { date: '2026-05-16', totalStock: 2, price: 93000 },
          { date: '2026-05-17', totalStock: 1, price: 73000 },
        ],
        channelRoomCategoryStatuses: [
          {
            channelId: '2',
            channelName: '途家',
            normalPrice: 76842,
            normalActualSalePrice: 73000,
            statusViews: [
              { date: '2026-05-16', price: 97894, salePrice: 93000 },
              { date: '2026-05-17', price: 76842, salePrice: 73000 },
            ],
          },
        ],
      },
    ],
    pageX: { total: 1, current: 1, pageNum: 1, pageSize: 15, hasNextPage: false },
  },
}

test('/houseManage/houseCale loads central prices through the real request contract', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  let requestPayload: Record<string, unknown> | null = null
  await page.route(centralPriceEndpoint, async (route) => {
    requestPayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({ json: centralPriceResponse })
  })

  await page.goto('/houseManage/houseCale')

  await expect(page.getByLabel('中央价数据来源')).toContainText('roomCategoryStatuses/central/get')
  await expect(page.getByLabel('中央价数据来源')).toContainText('请求成功')
  await expect(page.getByText('测试房型A')).toBeVisible()
  await expect(page.getByRole('button', { name: '930 05.16' }).first()).toBeVisible()
  expect(requestPayload).toMatchObject({
    date: '2026-05-16',
    days: 30,
    pageNum: 1,
    pageSize: 15,
  })
  expect(requestPayload).toHaveProperty('channelIds')
  expect(requestPayload).toHaveProperty('roomCategoryIds')

  await page.getByRole('button', { name: '渠道', exact: true }).click()
  await page.getByRole('option', { name: '途家' }).click()
  await expect(page.getByRole('button', { name: '途家' })).toBeVisible()
  expect(requestPayload).toMatchObject({ channelIds: ['2'] })

  await page.getByRole('button', { name: '同步至渠道' }).click()
  await expect(page.getByRole('status', { name: '中央价操作反馈' })).toContainText('真实提交接口未接入')
  await expect(page.getByRole('status', { name: '中央价操作反馈' })).not.toContainText('已发起同步至渠道')

  await page.getByRole('button', { name: '价格规划' }).click()
  await page.getByRole('button', { name: '+新增规划' }).click()
  await page.getByRole('button', { name: '保存规划' }).click()
  await expect(page.getByRole('status', { name: '中央价操作反馈' })).toContainText('价格规划保存接口未接入')
})

test('/houseManage/houseCale exposes request failures as blockers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({
      status: 403,
      json: { success: false, errorCode: 'FORBIDDEN', errorMsg: '无权限访问中央价接口' },
    })
  })

  await page.goto('/houseManage/houseCale')

  await expect(page.getByRole('alert', { name: '中央价接口阻塞' })).toContainText('无权限访问中央价接口')
  await expect(page.getByRole('button', { name: '重试中央价请求' })).toBeVisible()
})

test('/houseManage/houseCale renders an explicit empty state for empty central price data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({
      json: { success: true, errorCode: null, errorMsg: null, data: { roomStatusViews: [], pageX: { total: 0 } } },
    })
  })

  await page.goto('/houseManage/houseCale')

  await expect(page.getByRole('status', { name: '中央价空状态' })).toContainText('暂无中央价数据')
})

test('/houseManage/houseCale keeps captured screenshots for regression evidence', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await page.goto('/houseManage/houseCale')
  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/fangtai--fangjia-guanli--zhongyang-jiage/default-clone-central-route-20260516-real-request.png',
    ),
    fullPage: true,
  })
})
