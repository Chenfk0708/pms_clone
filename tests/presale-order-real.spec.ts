import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function mockPresaleSupportApis(page: Page) {
  await page.route('https://hudson-prod.localhome.cn/camps/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { camps: [{ campId: '1796067693589061634', name: '测试门店' }] },
      },
    })
  })

  await page.route('https://hudson-prod.localhome.cn/channels/get', async (route) => {
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

  await page.route('https://hudson-prod.localhome.cn/categories/get', async (route) => {
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

  await page.route('https://hudson-prod.localhome.cn/paymentTypes/get/v2', async (route) => {
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
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockPresaleSupportApis(page)

  const requestBodies: Record<string, unknown>[] = []
  await page.route('https://hudson-prod.localhome.cn/orders/page/get', async (route) => {
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

  await page.goto(appUrl('/mallManagement/orderManagement'))

  await expect(page.getByRole('heading', { name: '预售券订单', level: 1 })).toBeVisible()
  await expect(page.getByLabel('预售券订单数据来源')).toContainText('真实请求成功')
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
  await expect(page.getByLabel('预售券订单数据来源')).toContainText('真实请求成功')
  expect(requestBodies.at(-1)).toMatchObject({
    roomCategoryTypes: ['1'],
    orderChannelIds: ['34'],
    keyword: '138',
  })

  await page.getByRole('button', { name: '导出明细' }).click()
  await expect(page.getByRole('status')).toContainText('导出明细')
  await expect(page.getByRole('status')).toContainText('阻塞')

  await page.getByRole('button', { name: '订单详情' }).click()
  await expect(page.getByRole('status')).toContainText('订单详情 ORDER-001')

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/dingdan--yushouquan-dingdan--yushouquan-dingdan/real-request-clone-20260516.png',
    ),
    fullPage: true,
  })
})

test('/mallManagement/orderManagement exposes request failures without fake success', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockPresaleSupportApis(page)
  await page.route('https://hudson-prod.localhome.cn/orders/page/get', async (route) => {
    await route.fulfill({
      status: 403,
      json: { success: false, errorMsg: '无权限访问预售券订单' },
    })
  })

  await page.goto(appUrl('/mallManagement/orderManagement'))

  await expect(page.getByRole('alert')).toContainText('无权限访问预售券订单')
  await expect(page.getByRole('status', { name: '预售券订单接口阻塞空态' })).toContainText('真实请求未完成')
  await expect(page.getByRole('button', { name: '刷 新' })).toBeVisible()
})

test('/mallManagement/orderManagement renders explicit empty state for real empty list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockPresaleSupportApis(page)
  await page.route('https://hudson-prod.localhome.cn/orders/page/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: { total: 0, pageNum: 1, size: 20, current: 1, hasNextPage: false, list: [] },
      },
    })
  })

  await page.goto(appUrl('/mallManagement/orderManagement'))

  await expect(page.getByRole('status', { name: '预售券订单空态' })).toContainText('暂无数据')
  await expect(page.getByLabel('预售券订单分页和请求参数')).toContainText('共 0 条')
})
