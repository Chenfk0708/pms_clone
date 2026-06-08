import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const PRESALE_TEST_CAMP_ID = '1796067693589061634'

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

function presaleOrderUrl() {
  return appUrl('/#/mallManagement/orderManagement')
}

async function installPresaleTestSession(
  page: Page,
  options: { provider?: 'real' | 'mock'; mockState?: 'success' | 'empty' | 'error' } = {},
) {
  await page.addInitScript(
    ({ campId, provider, mockState }) => {
      window.localStorage.setItem('pms_token', 'presale-order-test-token')
      window.localStorage.setItem('pmsCampId', campId)
      window.localStorage.setItem(
        'pms_user',
        JSON.stringify({
          id: 'presale-order-test-user',
          name: '预售券测试账号',
          mobile: '13800000001',
          roleName: '平台管理员',
          campName: '预售券测试门店',
        }),
      )
      if (provider) window.localStorage.setItem('pmsPresaleOrderProvider', provider)
      if (mockState) window.localStorage.setItem('pmsPresaleOrderMockState', mockState)
    },
    { campId: PRESALE_TEST_CAMP_ID, provider: options.provider, mockState: options.mockState },
  )
}

async function mockPresaleSupportApis(page: Page) {
  await page.route('**/api/camps/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { camps: [{ campId: PRESALE_TEST_CAMP_ID, name: '测试门店' }] },
      },
    })
  })

  await page.route('**/api/channels/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          channels: [
            { channelId: '34', channelName: '微信小程序' },
            { channelId: '33', channelName: '抖音小程序' },
          ],
        },
      },
    })
  })

  await page.route('**/api/categories/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          categoryViews: [
            { categoryId: '10', name: '住宿套餐', children: [{ categoryId: '11', name: '早餐券' }] },
          ],
        },
      },
    })
  })

  await page.route('**/api/paymentTypes/get/v2', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          paymentGroups: [
            {
              groupType: 1,
              groupTypeName: '线上支付',
              paymentTypes: [{ paymentTypeId: '2', paymentTypeName: '微信' }],
            },
          ],
        },
      },
    })
  })
}

test('/mallManagement/orderManagement uses captured real request contract and exposes interactions', async ({ page }) => {
  await installPresaleTestSession(page, { provider: 'real' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockPresaleSupportApis(page)

  const requestBodies: Record<string, unknown>[] = []
  await page.route('**/api/orders/page/get', async (route) => {
    requestBodies.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      json: {
        success: true,
        data: {
          total: 1,
          pageNum: 1,
          size: 20,
          current: 1,
          hasNextPage: false,
          list: [
            {
              orderId: 'ORDER-001',
              orderState: 6,
              refundDisplayState: 1,
              realPayAmount: 19900,
              totalAmount: 19900,
              buyerName: '张三',
              buyerMobile: '13800000000',
              orderDetailViews: [
                {
                  orderDetailId: 'DETAIL-001',
                  roomCategoryName: '早鸟预售券',
                  roomCategoryProductName: '周末双人早餐券',
                  roomCategoryType: 1,
                  categoryName: '住宿套餐',
                  salePrice: 19900,
                  count: 1,
                },
              ],
            },
          ],
        },
      },
    })
  })

  await page.goto(presaleOrderUrl())

  await expect(page.getByRole('heading', { name: '预售券订单', level: 1 })).toBeVisible()
  await expect(page.getByTestId('presale-order-service-contract')).toHaveAttribute('data-provider', 'real')
  await expect(page.getByLabel('预售券订单表格')).toContainText('早鸟预售券')
  await expect(page.getByLabel('预售券订单表格')).toContainText('张三')
  expect(requestBodies[0]).toMatchObject({
    campId: '1796067693589061634',
    pageNum: '1',
    pageSize: '20',
    orderStates: [],
    roomCategoryTypes: ['1', '2', '3'],
    categoryIds: [],
    orderChannelIds: [],
    paymentWayIds: [],
    bookedStartDate: '',
    bookedEndDate: '',
    keyword: '',
  })

  await page.getByRole('button', { name: '商品类型 请选择商品类型' }).click()
  await page.getByRole('option', { name: '虚拟商品' }).click()
  await page.getByPlaceholder('请输入订单编号/买家联系方式').fill('138')
  await page.getByRole('button', { name: '订单来源 请选择订单来源' }).click()
  await page.getByRole('option', { name: '微信小程序' }).click()
  await page.getByRole('button', { name: '搜 索' }).click()
  await expect(page.getByRole('status', { name: '预售券订单操作反馈' })).toContainText('搜索完成')
  expect(requestBodies.at(-1)).toMatchObject({
    roomCategoryTypes: ['1'],
    orderChannelIds: ['34'],
    keyword: '138',
  })

  await page.getByRole('button', { name: '导出明细' }).click()
  await expect(page.getByRole('status', { name: '预售券订单操作反馈' })).toContainText('导出任务已创建')

  await page.locator('.chat-dock-launcher').click()
  await page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').click()
  await page.getByRole('button', { name: '订单详情' }).click()
  await expect(page.getByRole('dialog', { name: '预售券订单详情' })).toContainText('ORDER-001')
  await page.getByRole('button', { name: '关闭详情', exact: true }).click()

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/dingdan--yushouquan-dingdan--yushouquan-dingdan/real-request-clone-20260516.png',
    ),
    fullPage: true,
  })
})

test('/mallManagement/orderManagement keeps action and pagination buttons beneath the chat dock overlay', async ({ page }) => {
  await installPresaleTestSession(page, { provider: 'mock' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockPresaleSupportApis(page)

  await page.route('**/api/orders/page/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          total: 3,
          pageNum: 1,
          size: 20,
          current: 1,
          hasNextPage: false,
          list: [
            {
              orderId: 'ORDER-001',
              orderState: 6,
              refundDisplayState: 1,
              realPayAmount: 19900,
              totalAmount: 19900,
              buyerName: '张三',
              buyerMobile: '13800000000',
              orderDetailViews: [
                {
                  orderDetailId: 'DETAIL-001',
                  roomCategoryName: '早鸟预售券',
                  roomCategoryProductName: '周末双人早餐券',
                  roomCategoryType: 1,
                  categoryName: '住宿套餐',
                  salePrice: 19900,
                  count: 1,
                },
              ],
            },
            {
              orderId: 'ORDER-002',
              orderState: 4,
              refundDisplayState: 2,
              realPayAmount: 16800,
              totalAmount: 16800,
              buyerName: '李四',
              buyerMobile: '13900000000',
              orderDetailViews: [
                {
                  orderDetailId: 'DETAIL-002',
                  roomCategoryName: '晚安预售券',
                  roomCategoryProductName: '家庭双床套餐',
                  roomCategoryType: 1,
                  categoryName: '住宿套餐',
                  salePrice: 16800,
                  count: 1,
                },
              ],
            },
            {
              orderId: 'ORDER-003',
              orderState: 3,
              refundDisplayState: 3,
              realPayAmount: 16900,
              totalAmount: 16900,
              buyerName: '王五',
              buyerMobile: '13700000000',
              orderDetailViews: [
                {
                  orderDetailId: 'DETAIL-003',
                  roomCategoryName: '连住预售券',
                  roomCategoryProductName: '影音大床套餐',
                  roomCategoryType: 1,
                  categoryName: '住宿套餐',
                  salePrice: 16900,
                  count: 1,
                },
              ],
            },
          ],
        },
      },
    })
  })

  await page.goto(presaleOrderUrl())

  const chatDock = page.locator('.chat-dock')
  const detailButtons = page.locator('.presale-order-row button')
  const previousButton = page.getByRole('button', { name: '上一页' })
  const nextButton = page.getByRole('button', { name: '下一页' })

  await page.locator('.chat-dock-launcher').click()
  await expect(chatDock).toBeVisible()
  await expect(detailButtons).toHaveCount(3)
  await expect(previousButton).toBeVisible()
  await expect(nextButton).toBeVisible()

  const dockBox = await chatDock.boundingBox()
  expect(dockBox).not.toBeNull()

  for (const locator of [detailButtons.first(), previousButton, nextButton]) {
    const buttonBox = await locator.boundingBox()
    expect(buttonBox).not.toBeNull()

    const overlapLeft = Math.max(buttonBox!.x, dockBox!.x)
    const overlapRight = Math.min(buttonBox!.x + buttonBox!.width, dockBox!.x + dockBox!.width)
    const overlapTop = Math.max(buttonBox!.y, dockBox!.y)
    const overlapBottom = Math.min(buttonBox!.y + buttonBox!.height, dockBox!.y + dockBox!.height)

    expect(overlapRight > overlapLeft).toBe(true)
    expect(overlapBottom > overlapTop).toBe(true)

    const overlayOwnsTopLayer = await page.evaluate(
      ({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('.chat-dock')),
      { x: overlapLeft + 8, y: overlapTop + 8 },
    )

    expect(overlayOwnsTopLayer).toBe(true)
  }
})

test('/mallManagement/orderManagement keeps toolbar quick links beneath the chat dock overlay', async ({ page }) => {
  await installPresaleTestSession(page, { provider: 'mock' })
  await page.setViewportSize({ width: 1440, height: 520 })
  await mockPresaleSupportApis(page)

  await page.route('**/api/orders/page/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          total: 3,
          pageNum: 1,
          size: 20,
          current: 1,
          hasNextPage: false,
          list: [
            {
              orderId: 'ORDER-001',
              orderState: 6,
              refundDisplayState: 1,
              realPayAmount: 19900,
              totalAmount: 19900,
              buyerName: '张三',
              buyerMobile: '13800000000',
              orderDetailViews: [
                {
                  orderDetailId: 'DETAIL-001',
                  roomCategoryName: '早鸟预售券',
                  roomCategoryProductName: '周末双人早餐券',
                  roomCategoryType: 1,
                  categoryName: '住宿套餐',
                  salePrice: 19900,
                  count: 1,
                },
              ],
            },
            {
              orderId: 'ORDER-002',
              orderState: 4,
              refundDisplayState: 2,
              realPayAmount: 16800,
              totalAmount: 16800,
              buyerName: '李四',
              buyerMobile: '13900000000',
              orderDetailViews: [
                {
                  orderDetailId: 'DETAIL-002',
                  roomCategoryName: '晚安预售券',
                  roomCategoryProductName: '家庭双床套餐',
                  roomCategoryType: 1,
                  categoryName: '住宿套餐',
                  salePrice: 16800,
                  count: 1,
                },
              ],
            },
            {
              orderId: 'ORDER-003',
              orderState: 3,
              refundDisplayState: 3,
              realPayAmount: 16900,
              totalAmount: 16900,
              buyerName: '王五',
              buyerMobile: '13700000000',
              orderDetailViews: [
                {
                  orderDetailId: 'DETAIL-003',
                  roomCategoryName: '连住预售券',
                  roomCategoryProductName: '影音大床套餐',
                  roomCategoryType: 1,
                  categoryName: '住宿套餐',
                  salePrice: 16900,
                  count: 1,
                },
              ],
            },
          ],
        },
      },
    })
  })

  await page.goto(presaleOrderUrl())

  const chatDock = page.locator('.chat-dock')
  const quickLinkButton = page.getByRole('button', { name: '卡券核销' })

  await page.locator('.chat-dock-launcher').click()
  await expect(chatDock).toBeVisible()
  await expect(quickLinkButton).toBeVisible()

  const dockBox = await chatDock.boundingBox()
  const buttonBox = await quickLinkButton.boundingBox()

  expect(dockBox).not.toBeNull()
  expect(buttonBox).not.toBeNull()

  const overlapLeft = Math.max(buttonBox!.x, dockBox!.x)
  const overlapRight = Math.min(buttonBox!.x + buttonBox!.width, dockBox!.x + dockBox!.width)
  const overlapTop = Math.max(buttonBox!.y, dockBox!.y)
  const overlapBottom = Math.min(buttonBox!.y + buttonBox!.height, dockBox!.y + dockBox!.height)

  expect(overlapRight > overlapLeft).toBe(true)
  expect(overlapBottom > overlapTop).toBe(true)

  const overlayOwnsTopLayer = await page.evaluate(
    ({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('.chat-dock')),
    { x: overlapLeft + 8, y: overlapTop + 8 },
  )

  expect(overlayOwnsTopLayer).toBe(true)
})

test('/mallManagement/orderManagement exposes request failures without fake success', async ({ page }) => {
  await installPresaleTestSession(page, { provider: 'real' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockPresaleSupportApis(page)
  await page.route('**/api/orders/page/get', async (route) => {
    await route.fulfill({
      status: 403,
      json: { success: false, errorMsg: '无权限访问预售券订单' },
    })
  })

  await page.goto(presaleOrderUrl())

  await expect(page.getByRole('alert')).toContainText('无权限访问预售券订单')
  await expect(page.getByRole('status', { name: '预售券订单空态' })).toContainText('暂无符合条件的订单')
  await expect(page.getByRole('button', { name: '刷 新' })).toBeVisible()
})

test('/mallManagement/orderManagement renders explicit empty state for real empty list', async ({ page }) => {
  await installPresaleTestSession(page, { provider: 'real' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockPresaleSupportApis(page)
  await page.route('**/api/orders/page/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { total: 0, pageNum: 1, size: 20, current: 1, hasNextPage: false, list: [] },
      },
    })
  })

  await page.goto(presaleOrderUrl())

  await expect(page.getByRole('status', { name: '预售券订单空态' })).toContainText('暂无数据')
  await expect(page.getByLabel('预售券订单分页')).toContainText('共 0 条')
})

test('/mallManagement/orderManagement uses explicit mock provider response packages by default', async ({ page }) => {
  await installPresaleTestSession(page, { provider: 'mock' })
  await page.setViewportSize({ width: 1440, height: 900 })
  const hudsonRequests: string[] = []
  for (const endpoint of [
    '**/api/orders/page/get',
    '**/api/camps/get',
    '**/api/channels/get',
    '**/api/categories/get',
    '**/api/paymentTypes/get/v2',
  ]) {
    await page.route(endpoint, async (route) => {
      hudsonRequests.push(route.request().url())
      await route.fulfill({ status: 500, json: { success: false, errorMsg: 'default mock should not call hudson' } })
    })
  }

  await page.goto(presaleOrderUrl())

  await expect(page.getByRole('heading', { name: '预售券订单', level: 1 })).toBeVisible()
  await expect(page.getByTestId('presale-order-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('presale-order-service-contract')).toHaveAttribute(
    'data-trace-id',
    /mock-dingdan--yushouquan-dingdan--yushouquan-dingdan-list-001/,
  )
  await expect(page.getByLabel('预售券订单表格')).toContainText('早鸟预售券')
  await expect(page.getByLabel('预售券订单表格')).toContainText('张三')
  await expect(page.locator('.presale-order-page')).not.toContainText(/mock|provider|traceId|未接入|阻塞|后端/i)
  expect(hudsonRequests).toEqual([])
})

test('/mallManagement/orderManagement supports mock empty and error states with business copy', async ({ page }) => {
  await installPresaleTestSession(page, { provider: 'mock', mockState: 'empty' })
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(presaleOrderUrl())
  await expect(page.getByTestId('presale-order-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByRole('status', { name: '预售券订单空态' })).toContainText('暂无数据')
  await expect(page.locator('.presale-order-page')).not.toContainText(/mock|provider|traceId|未接入|阻塞|后端/i)

  await page.evaluate(() => window.localStorage.setItem('pmsPresaleOrderMockState', 'error'))
  await page.getByRole('button', { name: '刷 新' }).click()
  await expect(page.getByRole('alert')).toContainText('预售券订单加载失败')
  await expect(page.getByRole('button', { name: '刷 新' })).toBeVisible()
  await expect(page.locator('.presale-order-page')).not.toContainText(/mock|provider|traceId|未接入|阻塞|后端/i)
})
