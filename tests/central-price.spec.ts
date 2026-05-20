import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const centralPriceEndpoint = '**/roomCategoryStatuses/central/get'
const currentDate = new Date().toISOString().slice(0, 10)

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

test('/houseManage/houseCale renders from centralized mock provider by default without backend requests', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const requestedUrls: string[] = []
  await page.route(centralPriceEndpoint, async (route) => {
    requestedUrls.push(route.request().url())
    await route.fulfill({
      status: 500,
      json: { success: false, errorMsg: 'default mock provider should not call real backend' },
    })
  })

  await page.goto('/houseManage/houseCale')

  await expect(page.getByLabel('中央价数据来源')).toHaveCount(0)
  await expect(page.getByText('臻选豪华套房', { exact: true })).toBeVisible()
  await expect(page.locator('.price-page')).not.toContainText(/未接入|阻塞|后端|mock|Mock|provider|真实接口|真实请求/)
  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/fangtai--fangjia-guanli--zhongyang-jiage/default-clone-central-route-20260518-mock-provider.png',
    ),
    fullPage: true,
  })
  expect(requestedUrls).toEqual([])
})

test('/houseManage/houseCale opens the central date calendar and updates the header date', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'mock')
  })

  await page.goto('/houseManage/houseCale')

  const dateTrigger = page.getByTestId('central-date-trigger')
  await dateTrigger.click()
  await expect(page.getByRole('dialog', { name: '中央价日期选择' })).toBeVisible()

  await page.getByRole('button', { name: '2026-05-22' }).click()

  await expect(page.getByRole('dialog', { name: '中央价日期选择' })).toHaveCount(0)
  await expect(dateTrigger).toContainText('2026.05.22')
})
test('/houseManage/houseCale exposes centralized mock empty and error envelopes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'mock')
    if (!window.localStorage.getItem('pms.centralPriceMockMode')) {
      window.localStorage.setItem('pms.centralPriceMockMode', 'empty')
    }
  })

  await page.goto('/houseManage/houseCale')
  await expect(page.getByRole('status', { name: '中央价空状态' })).toContainText('暂无中央价数据')
  await expect(page.getByLabel('中央价数据来源')).toHaveCount(0)

  await page.evaluate(() => {
    window.localStorage.setItem('pms.centralPriceMockMode', 'error')
  })
  await page.reload()

  await expect(page.getByRole('alert', { name: '中央价数据加载失败' })).toContainText('中央价格数据加载失败')
  await expect(page.locator('.price-page')).not.toContainText(/未接入|阻塞|后端|mock|Mock|provider|真实接口|真实请求/)
})

test('/houseManage/houseCale loads central prices through the real request contract', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  let requestPayload: Record<string, unknown> | null = null
  await page.route(centralPriceEndpoint, async (route) => {
    requestPayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({ json: centralPriceResponse })
  })

  await page.goto('/houseManage/houseCale')

  await expect(page.getByLabel('中央价数据来源')).toHaveCount(0)
  await expect(page.getByText('测试房型A')).toBeVisible()
  await expect(page.getByRole('button', { name: '930 05.16' }).first()).toBeVisible()
  expect(requestPayload).toMatchObject({
    date: currentDate,
    days: 30,
    pageNum: 1,
    pageSize: 15,
  })
  expect(requestPayload).toHaveProperty('channelIds')
  expect(requestPayload).toHaveProperty('roomCategoryIds')

  await page.getByRole('button', { name: '930 05.16' }).first().click()
  await expect(page.locator('.price-edit-drawer')).toBeVisible()
  await expect(page.locator('.price-cell-button.is-selected')).toHaveCount(0)
  await expect(page.locator('.price-edit-drawer [role="radio"]')).toHaveCount(3)
  await page.locator('.price-edit-input input').fill('740')
  await page.locator('.price-edit-drawer footer .is-primary').click()
  await expect(page.locator('.price-edit-drawer')).toHaveCount(0)
  await expect(page.getByRole('status', { name: '中央价操作反馈' })).toBeVisible()

  await page.getByRole('button', { name: '渠道', exact: true }).click()
  await page.getByRole('option', { name: '途家' }).click()
  await expect(page.getByRole('button', { name: '途家' })).toBeVisible()
  expect(requestPayload).toMatchObject({ channelIds: ['2'] })

  await page.getByRole('button', { name: '同步至渠道' }).click()
  await expect(page.getByRole('status', { name: '中央价操作反馈' })).toContainText('同步任务已创建')
  await expect(page.locator('.price-page')).not.toContainText(/未接入|阻塞|后端|mock|Mock|provider|真实接口|真实请求/)

  await page.getByRole('button', { name: '价格规划' }).click()
  await page.getByRole('button', { name: '+新增规划' }).click()
  await page.getByRole('button', { name: '保存规划' }).click()
  await expect(page.getByRole('status', { name: '中央价操作反馈' })).toContainText('价格规划已保存')
})

test('/houseManage/houseCale exposes request failures as blockers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({
      status: 403,
      json: { success: false, errorCode: 'FORBIDDEN', errorMsg: '无权限访问中央价接口' },
    })
  })

  await page.goto('/houseManage/houseCale')

  await expect(page.locator('.price-error-state')).toBeVisible()
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await expect(page.locator('.price-page')).not.toContainText(/未接入|阻塞|后端|mock|Mock|provider|真实接口|真实请求/)
})

test('/houseManage/houseCale renders an explicit empty state for empty central price data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
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
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
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

test('/houseManage/houseCale keeps header and first column fixed while the calendar area scrolls horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  const wideCentralPriceResponse = {
    ...centralPriceResponse,
    data: {
      ...centralPriceResponse.data,
      roomStatusViews: [
        {
          ...centralPriceResponse.data.roomStatusViews[0],
          statusViews: Array.from({ length: 18 }, (_, index) => ({
            date: `2026-05-${String(16 + index).padStart(2, '0')}`,
            totalStock: index % 3 === 0 ? 2 : 1,
            price: index % 2 === 0 ? 93000 : 73000,
          })),
          channelRoomCategoryStatuses: [
            {
              ...centralPriceResponse.data.roomStatusViews[0].channelRoomCategoryStatuses[0],
              statusViews: Array.from({ length: 18 }, (_, index) => ({
                date: `2026-05-${String(16 + index).padStart(2, '0')}`,
                price: index % 2 === 0 ? 97894 : 76842,
                salePrice: index % 2 === 0 ? 93000 : 73000,
              })),
            },
          ],
        },
      ],
    },
  }
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: wideCentralPriceResponse })
  })

  await page.goto('/houseManage/houseCale')

  const matrixScroll = page.getByTestId('central-price-matrix-scroll')
  const matrixHeader = page.getByTestId('central-price-matrix-header')
  const firstColumn = page.getByTestId('central-price-matrix-row-header').first()

  const beforeHeaderX = await matrixHeader.evaluate((node) => Math.round(node.getBoundingClientRect().x))
  const beforeColumnX = await firstColumn.evaluate((node) => Math.round(node.getBoundingClientRect().x))

  await matrixScroll.evaluate((node) => {
    node.scrollLeft = 480
    node.dispatchEvent(new Event('scroll'))
  })

  await expect(matrixScroll).toHaveJSProperty('scrollLeft', 480)
  await expect.poll(async () => matrixHeader.evaluate((node) => Math.round(node.getBoundingClientRect().x))).toBe(beforeHeaderX)
  await expect.poll(async () => firstColumn.evaluate((node) => Math.round(node.getBoundingClientRect().x))).toBe(beforeColumnX)
})

test('/houseManage/houseCale keeps room-type rows visible when collapsing central channels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await page.goto('/houseManage/houseCale')

  const rowHeaders = page.getByTestId('central-price-matrix-row-header')
  const collapseButton = page.getByTestId('central-price-matrix-header').locator('.price-grid__collapse-button')
  await expect(rowHeaders).toHaveCount(2)

  await collapseButton.click()

  await expect(rowHeaders).toHaveCount(1)
  await expect(rowHeaders.first()).toBeVisible()
})

test('/houseManage/houseCale renders central summary and channel rows with layered calendar metrics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await page.goto('/houseManage/houseCale')

  await expect(page.getByTestId('central-summary-date-cell').first()).toBeVisible()
  await expect(page.getByTestId('central-summary-date-cell').first().locator('.central-price-grid__metric-stock')).toBeVisible()
  await expect(page.getByTestId('central-summary-date-cell').first().locator('.central-price-grid__metric-price')).toBeVisible()
  await expect(page.getByTestId('central-channel-row').first().locator('.central-price-grid__pill')).toBeVisible()
  await expect(page.getByTestId('central-channel-base-price').first().locator('.central-price-grid__tag')).toHaveCount(2)
})

test('/houseManage/houseCale lets the central summary stock switch toggle off', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await page.goto('/houseManage/houseCale')

  const stockSwitch = page.getByTestId('central-summary-stock-switch').first()
  await expect(stockSwitch).toHaveAttribute('aria-pressed', 'true')

  await stockSwitch.click()

  await expect(stockSwitch).toHaveAttribute('aria-pressed', 'false')
})

test('/houseManage/channelPrice keeps the channel RP tab active while reusing the central price layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await page.goto('/houseManage/channelPrice')

  await expect(page.getByLabel('RP价页签')).toHaveClass(/is-active/)
  await expect(page.getByTestId('central-price-matrix-header')).toBeVisible()
  await expect(page.getByTestId('central-date-trigger')).toBeVisible()
  await expect(page.locator('.channel-price-alert')).toHaveCount(0)
  await expect(page.getByRole('status', { name: '渠道RP价加载状态' })).toHaveCount(0)
  await expect(page.getByText('测试房型A')).toBeVisible()
  await expect(page.getByTestId('channel-rp-summary-stock-cell').first()).toContainText('余2')
  await expect(page.getByTestId('channel-rp-summary-stock-cell').first()).not.toContainText('730')
  await expect(page.getByTestId('central-summary-stock-switch')).toHaveCount(0)
  await page.getByRole('button', { name: '930 05.16' }).first().click()
  await expect(page.locator('.price-edit-drawer')).toBeVisible()
  await expect(page.locator('.price-floating-editor')).toHaveCount(0)
  await expect(page.locator('.price-cell-button.is-selected')).toHaveCount(0)
  await expect(page.locator('.price-edit-drawer [role="radio"]')).toHaveCount(3)
})

test('/houseManage/houseCale shows multiple expanded channels under each room type', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'mock')
  })

  await page.goto('/houseManage/houseCale')

  const channelRows = page.getByTestId('central-channel-row')
  await expect(channelRows).toHaveCount(14)
  await expect(page.getByText('途家', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('小猪', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('美团酒店', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('路客云聚合', { exact: true }).first()).toBeVisible()
})
