import { expect, test, type Page } from '@playwright/test'

const centralPriceEndpoint = '**/roomCategoryStatuses/central/get'
const storeOptionsEndpoint = '**/select/poi/page/get'

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
        statusViews: [
          { date: '2026-05-16', totalStock: 2, price: 93000, saleEnabled: true },
          { date: '2026-05-17', totalStock: 1, price: 73000, saleEnabled: true },
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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'channel-price-playwright-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.centralPriceProvider', 'real')
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

test('/houseManage/channelPrice uses the central-layout channel RP contract', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  let requestBody: Record<string, unknown> | null = null
  await page.route(centralPriceEndpoint, async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  await expect(page.getByLabel('RP价页签')).toHaveClass(/is-active/)
  await expect(page.getByTestId('central-price-matrix-header')).toBeVisible()
  await expect(page.getByText('测试房型A')).toBeVisible()
  await expect(page.getByTestId('central-channel-row').getByText('宿银平台')).toBeVisible()
  await expect(page.getByText('渠道rp价与房型价格存在差异')).toHaveCount(0)
  expect(requestBody).toMatchObject({
    campId: null,
    channelIds: ['100'],
    days: 30,
    pageNum: 1,
    pageSize: 15,
  })
})

test('/houseManage/channelPrice opens the target-style base price planning drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  await page.getByTestId('central-channel-base-price').first().click()
  await expect(page.getByRole('dialog', { name: '价格规划' })).toBeVisible()
  await expect(page.getByTestId('base-price-plan-cell-weekend').first()).toBeVisible()
  await page.getByTestId('base-price-plan-cell-weekend').first().click()
  await expect(page.locator('.price-base-plan-edit-drawer')).toBeVisible()
  await expect(page.locator('.price-base-plan-edit-drawer')).toContainText('已选1项')
  await expect(page.locator('.price-base-plan-edit-drawer [role="radio"]')).toHaveCount(3)
})

test('/houseManage/channelPrice opens base price planning from room summary base price', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  await page.getByTestId('central-room-base-price').first().click()

  const planningDrawer = page.locator('.price-base-planning-drawer')
  await expect(planningDrawer).toBeVisible()
  await expect(planningDrawer.getByTestId('base-price-plan-cell-weekend').first()).toBeVisible()
})

test('/houseManage/channelPrice aligns the channel coefficient header separator with body cells', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')
  await expect(page.getByTestId('central-channel-row').first()).toBeVisible()

  const metrics = await page.evaluate(() => {
    const headerCoefficientCell = document.querySelector('.central-price-grid__head-static > div:nth-child(2)')
    const bodyCoefficientCell = document.querySelector('[data-testid="central-channel-row"] > div:nth-child(2)')
    if (!headerCoefficientCell || !bodyCoefficientCell) return null

    return {
      headerRight: headerCoefficientCell.getBoundingClientRect().right,
      bodyRight: bodyCoefficientCell.getBoundingClientRect().right,
    }
  })

  expect(metrics).not.toBeNull()
  expect(Math.abs(metrics!.headerRight - metrics!.bodyRight)).toBeLessThanOrEqual(1)
})

test('/houseManage/channelPrice shows product coefficient header help', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  const coefficientHeader = page.getByTestId('price-coefficient-header')
  await expect(coefficientHeader).toContainText('\u4ea7\u54c1\u7cfb\u6570')
  await expect(coefficientHeader).not.toContainText('\u6e20\u9053\u7cfb\u6570')

  await coefficientHeader.getByTestId('price-coefficient-help-trigger').hover()
  await expect(coefficientHeader.getByRole('tooltip')).toContainText('\u4ea7\u54c1\u7cfb\u6570\u53ef\u901a\u8fc7\u623f\u578b\u4ef7\u683c\u63a8\u7b97\u5404\u4e2aRP\u7684\u4ef7\u683c')

  const metrics = await coefficientHeader.evaluate((node) => {
    const trigger = node.querySelector('[data-testid="price-coefficient-help-trigger"]')
    const tooltip = node.querySelector('[role="tooltip"]')
    if (!trigger || !tooltip) return null
    const triggerRect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const tooltipStyle = window.getComputedStyle(tooltip)
    return {
      triggerWidth: triggerRect.width,
      triggerHeight: triggerRect.height,
      tooltipWidth: tooltipRect.width,
      tooltipFontSize: Number.parseFloat(tooltipStyle.fontSize),
    }
  })

  expect(metrics).not.toBeNull()
  expect(metrics!.triggerWidth).toBeLessThanOrEqual(22)
  expect(metrics!.triggerHeight).toBeLessThanOrEqual(22)
  expect(metrics!.tooltipWidth).toBeLessThanOrEqual(300)
  expect(metrics!.tooltipFontSize).toBeLessThanOrEqual(16)
})

test('/houseManage/channelPrice hides legacy preview and skip handling actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  await expect(page.getByRole('button', { name: '\u9884\u89c8\u4e0e\u8986\u76d6' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '\u6682\u4e0d\u5904\u7406' })).toHaveCount(0)
})

test('/houseManage/channelPrice top price planning drawer opens editable plan cells', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(centralPriceEndpoint, async (route) => {
    await route.fulfill({ json: centralPriceResponse })
  })

  await gotoAppRoute(page, '/houseManage/channelPrice')

  await page.getByRole('button', { name: '价格规划' }).click()
  const planningDrawer = page.getByRole('dialog', { name: '价格规划' })
  await expect(planningDrawer).toBeVisible()
  await expect(planningDrawer.getByTestId('base-price-plan-cell-weekend').first()).toBeVisible()

  await planningDrawer.getByTestId('base-price-plan-cell-weekend').first().click()

  await expect(page.locator('.price-base-plan-edit-drawer')).toBeVisible()
  await expect(page.locator('.price-base-plan-edit-drawer')).toContainText('已选1项')
})
