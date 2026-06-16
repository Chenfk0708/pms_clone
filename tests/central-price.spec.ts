import path from 'node:path'
import { Buffer } from 'node:buffer'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const centralPriceEndpoint = '**/roomCategoryStatuses/central/get'
const centralSaleStatusEndpoint = '**/roomCategoryStatuses/central/saleStatus/save'
const channelCoefficientSaveEndpoint = '**/roomCategoryStatuses/roomCategory/channel/coefficient/save'
const channelCoefficientBatchSaveEndpoint = '**/roomCategoryStatuses/roomCategory/channel/coefficient/batchSave'
const channelCalendarPriceSaveEndpoint = '**/roomCategoryStatuses/roomCategory/channel/price/save'
const storeOptionsEndpoint = '**/select/poi/page/get'
const currentDate = new Date().toISOString().slice(0, 10)
const calendarPickDate = `${currentDate.slice(0, 8)}22`
const calendarPickHeader = calendarPickDate.replaceAll('-', '.')

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'central-price-playwright-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })
  await page.route(storeOptionsEndpoint, async (route) => {
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        data: {
          list: [{ poiId: '10001', poiName: '宿银门店' }],
        },
      },
    })
  })
})

function gotoAppRoute(page: Page, route: string) {
  return page.goto(`/#${route}`)
}

function decodeImageSource(src: string | null) {
  if (!src) return ''
  if (src.startsWith('data:image/svg+xml;base64,')) {
    return Buffer.from(src.slice('data:image/svg+xml;base64,'.length), 'base64').toString('utf8')
  }
  if (src.startsWith('data:image/svg+xml,')) {
    return decodeURIComponent(src.slice('data:image/svg+xml,'.length))
  }
  return src
}

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
          { date: '2026-05-16', totalStock: 2, price: 93000, saleEnabled: true },
          { date: '2026-05-17', totalStock: 1, price: 73000, saleEnabled: false },
        ],
        channelRoomCategoryStatuses: [
          {
            channelId: '100',
            channelName: '宿银平台',
            channelRoomCategoryName: '测试房型A<无早>',
            expressValue: '-',
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

test('/houseManage/houseCale uses real central price provider by default', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.centralPriceProvider')
  })
  const requestedUrls: string[] = []
  await page.route(centralPriceEndpoint, async (route) => {
    requestedUrls.push(route.request().url())
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  await expect(page.getByLabel('中央价数据来源')).toHaveCount(0)
  await expect(page.getByText('测试房型A')).toBeVisible()
  await expect(page.locator('.price-page')).not.toContainText(/未接入|阻塞|后端|mock|Mock|provider|真实接口|真实请求/)
  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/fangtai--fangjia-guanli--zhongyang-jiage/default-clone-central-route-20260518-mock-provider.png',
    ),
    fullPage: true,
  })
  expect(requestedUrls).toHaveLength(1)
})

test('/houseManage/houseCale opens the central date calendar and updates the header date', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'mock')
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  const dateTrigger = page.getByTestId('central-date-trigger')
  await dateTrigger.click()
  await expect(page.getByRole('dialog', { name: '中央价日期选择' })).toBeVisible()

  await page.getByRole('button', { name: calendarPickDate }).click()

  await expect(page.getByRole('dialog', { name: '中央价日期选择' })).toHaveCount(0)
  await expect(dateTrigger).toContainText(calendarPickHeader)
})
test('/houseManage/houseCale exposes centralized mock empty and error envelopes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'mock')
    if (!window.localStorage.getItem('pms.centralPriceMockMode')) {
      window.localStorage.setItem('pms.centralPriceMockMode', 'empty')
    }
  })

  await gotoAppRoute(page, '/houseManage/houseCale')
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

  await gotoAppRoute(page, '/houseManage/houseCale')

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
  expect(requestPayload).toMatchObject({ channelIds: ['100'] })

  await page.getByRole('button', { name: '全部房型', exact: true }).click()
  await page.getByLabel('房型筛选').getByRole('button', { name: '测试房型A', exact: true }).click()
  await expect.poll(() => requestPayload).toMatchObject({ roomCategoryIds: ['room-a'] })

  await page.getByRole('button', { name: '930 05.16' }).first().click()
  await expect(page.locator('.price-edit-drawer')).toBeVisible()
  await expect(page.locator('.price-cell-button.is-selected')).toHaveCount(1)
  await expect(page.locator('.price-edit-drawer [role="radio"]')).toHaveCount(3)
  await page.locator('.price-edit-input input').fill('740')
  await page.locator('.price-edit-drawer footer .is-primary').click()
  await expect(page.locator('.price-edit-drawer')).toHaveCount(0)
  await expect(page.getByRole('status', { name: '中央价操作反馈' })).toBeVisible()

  await expect(page.getByRole('button', { name: '宿银平台' })).toBeVisible()
  expect(requestPayload).toMatchObject({ channelIds: ['100'] })

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

  await gotoAppRoute(page, '/houseManage/houseCale')

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

  await gotoAppRoute(page, '/houseManage/houseCale')

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

  await gotoAppRoute(page, '/houseManage/houseCale')
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

  await gotoAppRoute(page, '/houseManage/houseCale')

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

  await gotoAppRoute(page, '/houseManage/houseCale')

  const rowHeaders = page.getByTestId('central-price-matrix-row-header')
  const collapseButton = page.getByTestId('central-price-matrix-header').locator('.price-grid__collapse-button')
  await expect(rowHeaders).toHaveCount(2)

  await collapseButton.click()

  await expect(rowHeaders).toHaveCount(1)
  await expect(rowHeaders.first()).toBeVisible()
})

test('/houseManage/houseCale shows channel coefficient header help', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  const coefficientHeader = page.getByTestId('price-coefficient-header')
  await expect(coefficientHeader).toContainText('\u6e20\u9053\u7cfb\u6570')
  await expect(coefficientHeader).not.toContainText('\u4ea7\u54c1\u7cfb\u6570')

  await coefficientHeader.getByTestId('price-coefficient-help-trigger').hover()
  await expect(coefficientHeader.getByRole('tooltip')).toContainText('\u6e20\u9053\u7cfb\u6570\u53ef\u901a\u8fc7\u4e2d\u592e\u623f\u578b\u4ef7\u683c\u63a8\u7b97\u5404\u4e2a\u6e20\u9053\u4ef7\u683c')
})

test('/houseManage/houseCale renders central summary and channel rows with layered calendar metrics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  await expect(page.getByTestId('central-summary-date-cell').first()).toBeVisible()
  await expect(page.getByTestId('central-summary-date-cell').first().locator('.central-price-grid__metric-stock')).toBeVisible()
  await expect(page.getByTestId('central-summary-date-cell').first().locator('.central-price-grid__metric-price')).toBeVisible()
  await expect(page.getByTestId('central-channel-row').first().locator('.central-price-grid__pill')).toBeVisible()
  await expect(page.getByTestId('central-channel-base-price').first().locator('.central-price-grid__tag')).toHaveCount(2)
})

test('/houseManage/houseCale applies saved channel line-price ratios to central channel rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  const suyinChannelRow = page.getByTestId('central-channel-row').filter({ hasText: '宿银平台' }).first()
  await expect(suyinChannelRow.getByTestId('central-channel-base-price')).toContainText('730')
  await expect(suyinChannelRow.getByTestId('central-channel-base-price')).toContainText('978.94')
  await expect(suyinChannelRow.getByRole('button', { name: '930 05.16' })).toBeVisible()

  await page.getByRole('button', { name: '价格设置' }).click()
  await expect(page.getByRole('dialog', { name: '中央价价格设置' })).toBeVisible()
  await page.getByLabel('宿银平台 优惠比例').fill('80')
  await page.getByRole('dialog', { name: '中央价价格设置' }).getByRole('button', { name: '保存' }).click()

  await expect(page.getByRole('dialog', { name: '中央价价格设置' })).toHaveCount(0)
  await expect(suyinChannelRow.getByTestId('central-channel-base-price')).toContainText('912.5')
  await expect(suyinChannelRow.getByRole('button', { name: '930 05.16' })).toContainText('1,162.5')
})

test('/houseManage/houseCale persists saved channel line-price ratios after reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  const suyinChannelRow = page.getByTestId('central-channel-row').filter({ hasText: '宿银平台' }).first()
  await page.getByRole('button', { name: '价格设置' }).click()
  await page.getByLabel('宿银平台 优惠比例').fill('80')
  await page.getByRole('dialog', { name: '中央价价格设置' }).getByRole('button', { name: '保存' }).click()
  await expect(suyinChannelRow.getByTestId('central-channel-base-price')).toContainText('912.5')

  await page.reload()

  const reloadedSuyinChannelRow = page.getByTestId('central-channel-row').filter({ hasText: '宿银平台' }).first()
  await expect(reloadedSuyinChannelRow.getByTestId('central-channel-base-price')).toContainText('912.5')
  await expect(reloadedSuyinChannelRow.getByRole('button', { name: '930 05.16' })).toContainText('1,162.5')
})

test('/houseManage/houseCale uses the Suyin logo for local channel line-price settings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')
  await page.getByRole('button', { name: '价格设置' }).click()

  const localChannelCard = page
    .getByLabel('渠道价格比例设置')
    .locator('.price-settings-channel')
    .filter({ hasText: '宿银平台' })
    .first()
  const iconSource = await localChannelCard.locator('img').getAttribute('src')
  expect(decodeImageSource(iconSource)).toContain('宿银 logo')
})

test('/houseManage/houseCale keeps base-price actual and line prices aligned inside the column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  const basePriceCell = page
    .getByTestId('central-channel-row')
    .filter({ hasText: '宿银平台' })
    .first()
    .getByTestId('central-channel-base-price')
  const metrics = await basePriceCell.evaluate((node) => {
    const rows = Array.from(node.querySelectorAll('.central-price-grid__tag-price'))
    const icons = rows.map((row) => row.querySelector('.central-price-grid__tag')?.getBoundingClientRect().left ?? 0)
    const prices = rows.map((row) => (row.querySelector('strong, em') as HTMLElement | null)?.getBoundingClientRect().left ?? 0)

    return {
      overflows: node.scrollWidth > node.clientWidth,
      iconDelta: Math.abs((icons[0] ?? 0) - (icons[1] ?? 0)),
      priceDelta: Math.abs((prices[0] ?? 0) - (prices[1] ?? 0)),
    }
  })

  expect(metrics.overflows).toBe(false)
  expect(metrics.iconDelta).toBeLessThanOrEqual(1)
  expect(metrics.priceDelta).toBeLessThanOrEqual(1)
})

test('/houseManage/channelPrice applies saved channel line-price ratios to channel RP rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  const suyinChannelRow = page.getByTestId('central-channel-row').filter({ hasText: '宿银平台' }).first()
  await expect(suyinChannelRow.getByTestId('central-channel-base-price')).toContainText('730')
  await expect(suyinChannelRow.getByTestId('central-channel-base-price')).toContainText('978.94')

  await page.getByRole('button', { name: '价格设置' }).click()
  await page.getByLabel('宿银平台 优惠比例').fill('80')
  await page.getByRole('dialog', { name: '价格设置' }).getByRole('button', { name: '保存' }).click()

  await expect(suyinChannelRow.getByTestId('central-channel-base-price')).toContainText('912.5')
  await expect(suyinChannelRow.getByRole('button', { name: '930 05.16' })).toContainText('1,162.5')
})

test('/houseManage/houseCale extends line-price settings from returned channel rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  const dynamicChannelResponse = JSON.parse(JSON.stringify(centralPriceResponse))
  dynamicChannelResponse.data.roomStatusViews[0].channelRoomCategoryStatuses.push({
    channelId: 'ota-test',
    channelName: '测试OTA',
    normalPrice: 60000,
    normalActualSalePrice: 50000,
    statusViews: [
      { date: '2026-05-16', price: 60000, salePrice: 50000 },
      { date: '2026-05-17', price: 60000, salePrice: 50000 },
    ],
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: dynamicChannelResponse })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  const otaChannelRow = page.getByTestId('central-channel-row').filter({ hasText: '测试OTA' }).first()
  await expect(otaChannelRow.getByTestId('central-channel-base-price')).toContainText('500')
  await expect(otaChannelRow.getByTestId('central-channel-base-price')).toContainText('600')

  await page.getByRole('button', { name: '价格设置' }).click()
  await expect(page.getByLabel('测试OTA 优惠比例')).toBeVisible()
  await page.getByLabel('测试OTA 优惠比例').fill('50')
  await page.getByRole('dialog', { name: '中央价价格设置' }).getByRole('button', { name: '保存' }).click()

  await expect(otaChannelRow.getByTestId('central-channel-base-price')).toContainText('1,000')
  await expect(otaChannelRow.getByRole('button', { name: '500 05.16' })).toContainText('1,000')
})

test('/houseManage/houseCale keeps central price settings actions visible in short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 560 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')
  await page.getByRole('button', { name: '价格设置' }).click()

  const dialog = page.getByRole('dialog', { name: '中央价价格设置' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: '保存' })).toBeVisible()

  const layout = await dialog.evaluate((node) => {
    const dialogRect = node.getBoundingClientRect()
    const body = node.querySelector('.price-settings-drawer__body')
    const saveButton = Array.from(node.querySelectorAll('button')).find((button) => button.textContent?.trim() === '保存')
    const bodyElement = body as HTMLElement | null
    const saveButtonRect = saveButton?.getBoundingClientRect()

    return {
      dialogBottom: Math.round(dialogRect.bottom),
      viewportHeight: window.innerHeight,
      saveButtonBottom: saveButtonRect ? Math.round(saveButtonRect.bottom) : null,
      bodyCanScroll: bodyElement ? bodyElement.scrollHeight > bodyElement.clientHeight : false,
    }
  })

  expect(layout.saveButtonBottom).not.toBeNull()
  expect(layout.dialogBottom).toBeLessThanOrEqual(layout.viewportHeight)
  expect(layout.saveButtonBottom).toBeLessThanOrEqual(layout.viewportHeight)
  expect(layout.bodyCanScroll).toBe(true)
})

test('/houseManage/houseCale saves central summary sale switch state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  let savePayload: Record<string, unknown> | null = null
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })
  await page.route(centralSaleStatusEndpoint, async (route) => {
    savePayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        data: {
          roomCategoryId: 'room-a',
          date: '2026-05-16',
          saleEnabled: false,
        },
      },
    })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  const stockSwitch = page.getByTestId('central-summary-stock-switch').first()
  await expect(stockSwitch).toHaveAttribute('aria-pressed', 'true')

  await stockSwitch.click()

  expect(savePayload).toMatchObject({
    roomCategoryId: 'room-a',
    date: '2026-05-16',
    saleEnabled: false,
  })
  await expect(stockSwitch).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('status', { name: '中央价操作反馈' })).toContainText('停售')
})

test('/houseManage/houseCale hides sale switch failure feedback and avoids null copy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })
  await page.route(centralSaleStatusEndpoint, async (route) => {
    await route.fulfill({
      status: 500,
      json: {
        success: false,
        errorCode: null,
        errorMsg: null,
        message: 'null',
        errorDetail: null,
      },
    })
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  await page.getByTestId('central-summary-stock-switch').first().click()

  const feedback = page.getByRole('status', { name: '中央价操作反馈' })
  await expect(feedback).toContainText('售卖状态保存失败')
  await expect(feedback).not.toContainText('null')
  await expect(feedback).toHaveCount(0)
})

test('/houseManage/channelPrice keeps the channel RP tab active while reusing the central price layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

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
  await expect(page.locator('.price-cell-button.is-selected')).toHaveCount(1)
  await expect(page.locator('.price-edit-drawer [role="radio"]')).toHaveCount(3)
})

test('/houseManage/channelPrice opens base price planning cells and saves channel prices', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  let savePayload: Record<string, unknown> | null = null
  const response = JSON.parse(JSON.stringify(centralPriceResponse))
  response.data.roomStatusViews[0].channelRoomCategoryStatuses.push({
    channelId: '100',
    channelName: '宿银平台',
    channelRoomCategoryName: '测试房型A-可取消',
    expressValue: '*1.10',
    normalPrice: 86800,
    normalActualSalePrice: 82000,
    statusViews: [
      { date: '2026-05-16', price: 108000, salePrice: 99000 },
      { date: '2026-05-17', price: 88000, salePrice: 82000 },
    ],
  })

  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: response })
  })
  await page.route(channelCalendarPriceSaveEndpoint, async (route) => {
    savePayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: { savedCount: 1 },
      },
    })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  await page.getByTestId('central-channel-base-price').first().click()
  const planningDrawer = page.getByRole('dialog', { name: '价格规划' })
  await expect(planningDrawer).toBeVisible()
  await expect(planningDrawer.locator('.price-base-planning-table__title strong')).toContainText([
    '测试房型A<无早>',
    '测试房型A-可取消',
  ])
  await expect(page.getByText('总裁套间 台球电竞豪华房')).toHaveCount(0)

  await page.getByTestId('base-price-plan-cell-weekend').first().click()
  const editDrawer = page.locator('.price-base-plan-edit-drawer')
  await expect(editDrawer).toBeVisible()
  await expect(editDrawer).toContainText('已选1项')
  await expect(editDrawer.locator('[role="radio"]')).toHaveCount(3)
  await expect(editDrawer.locator('.price-edit-checkbox')).toContainText('覆盖日历上单独维护过的价格')

  await editDrawer.locator('input[aria-label="改价值"]').fill('888')
  await editDrawer.locator('footer .is-primary').click()

  await expect.poll(() => savePayload).not.toBeNull()
  expect(savePayload?.items).toEqual([
    expect.objectContaining({
      roomCategoryId: 'room-a',
      channelId: '100',
      productName: '测试房型A<无早>',
      date: '2026-05-16',
      priceUpdateType: 1,
      calendarPrice: '888',
    }),
  ])
})

test('/houseManage/channelPrice saves a single product coefficient and refreshes channel prices', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  let saved = false
  let savePayload: Record<string, unknown> | null = null
  const updatedResponse = JSON.parse(JSON.stringify(centralPriceResponse))
  const updatedChannel = updatedResponse.data.roomStatusViews[0].channelRoomCategoryStatuses[0]
  updatedChannel.expressValue = '*0.93'
  updatedChannel.normalActualSalePrice = 67890
  updatedChannel.statusViews[0].salePrice = 86490
  updatedChannel.statusViews[1].salePrice = 67890

  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: saved ? updatedResponse : centralPriceResponse })
  })
  await page.route(channelCoefficientSaveEndpoint, async (route) => {
    savePayload = route.request().postDataJSON() as Record<string, unknown>
    saved = true
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        data: {
          savedCount: 1,
          items: [
            {
              roomCategoryId: 'room-a',
              channelId: '100',
              productName: '测试房型A<无早>',
              operator: '*',
              coefficientValue: '0.93',
              expressValue: '*0.93',
            },
          ],
        },
      },
    })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  const channelRow = page.getByTestId('central-channel-row').filter({ hasText: '宿银平台' }).first()
  await channelRow.getByRole('button', { name: /设置产品系数 宿银平台/ }).click()
  const drawer = page.getByRole('dialog', { name: '设置产品系数' })
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('测试房型A<无早>')
  await drawer.getByLabel('产品系数数值').fill('0.93')
  await drawer.getByRole('button', { name: '保存' }).click()

  expect(savePayload).toMatchObject({
    roomCategoryId: 'room-a',
    channelId: '100',
    productName: '测试房型A<无早>',
    operator: '*',
    coefficientValue: '0.93',
  })
  await expect(page.getByRole('dialog', { name: '设置产品系数' })).toHaveCount(0)
  await expect(channelRow.locator('.central-price-grid__pill')).toContainText('*0.93')
  await expect(channelRow.getByRole('button', { name: '864.90 05.16' })).toBeVisible()
})

test('/houseManage/channelPrice batch drawer defaults to product coefficients and saves selected products', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  let batchPayload: Record<string, unknown> | null = null
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })
  await page.route(channelCoefficientBatchSaveEndpoint, async (route) => {
    batchPayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        data: {
          savedCount: 1,
          items: [
            {
              roomCategoryId: 'room-a',
              channelId: '100',
              productName: '测试房型A<无早>',
              operator: '+',
              coefficientValue: '20',
              expressValue: '+20',
            },
          ],
        },
      },
    })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  await page.getByRole('button', { name: '批量改价' }).click()
  const drawer = page.getByRole('dialog', { name: '批量修改' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('radio', { name: '产品系数' })).toBeChecked()
  await expect(drawer).not.toContainText('选择日期')

  await drawer.getByRole('radio', { name: '价格' }).check()
  await expect(drawer).toContainText('选择日期')
  await drawer.getByRole('radio', { name: '产品系数' }).check()
  await expect(drawer).not.toContainText('选择日期')

  await drawer.getByRole('button', { name: '添加产品' }).click()
  const picker = page.getByRole('dialog', { name: '添加产品' })
  await expect(picker).toBeVisible()
  await expect(picker).toContainText('测试房型A')
  await expect(picker).toContainText('测试房型A<无早>')
  await picker.locator('.channel-product-picker__item input').first().check()
  await picker.getByRole('button', { name: '确定' }).click()

  await expect(drawer).toContainText('已选1个产品')
  await drawer.getByLabel('产品系数运算符').selectOption('+')
  await drawer.getByLabel('产品系数数值').fill('20')
  await drawer.getByRole('button', { name: '保存' }).click()

  expect(batchPayload).toMatchObject({
    items: [
      {
        roomCategoryId: 'room-a',
        channelId: '100',
        productName: '测试房型A<无早>',
        operator: '+',
        coefficientValue: '20',
      },
    ],
  })
})

test('/houseManage/channelPrice displays channel names instead of corrupted product names', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
  })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({
      json: {
        ...centralPriceResponse,
        data: {
          ...centralPriceResponse.data,
          roomStatusViews: [
            {
              ...centralPriceResponse.data.roomStatusViews[0],
              channelRoomCategoryStatuses: [
                {
                  ...centralPriceResponse.data.roomStatusViews[0].channelRoomCategoryStatuses[0],
                  channelName: '宿银平台',
                  channelRoomCategoryName: '手术室<缤妆>',
                },
              ],
            },
          ],
        },
      },
    })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  const channelHeader = page.getByTestId('central-channel-row').first().getByTestId('central-price-matrix-row-header')
  await expect(channelHeader.locator('strong')).toHaveText('宿银平台')
  await expect(page.locator('.price-page')).not.toContainText('手术室<缤妆>')
})

test('/houseManage/houseCale shows suyin platform channel under each room type', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.centralPriceProvider', 'mock')
  })

  await gotoAppRoute(page, '/houseManage/houseCale')

  const channelRows = page.getByTestId('central-channel-row')
  await expect(channelRows).toHaveCount(2)
  await expect(page.getByText('宿银平台', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('途家', { exact: true })).toHaveCount(0)
  await expect(page.getByText('美团酒店', { exact: true })).toHaveCount(0)
})
