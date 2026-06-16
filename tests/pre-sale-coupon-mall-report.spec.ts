import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/baobiao--yushouquan-shuju--yushouquan-hexiao-mingxi',
)

function appUrl(routePath: string) {
  const normalizedPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalizedPath}` : normalizedPath
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'pre-sale-coupon-mall-test-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.preSaleCouponMallProvider', 'mock')
  })
  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          list: [{ poiId: '1796425098638573570', poiName: '天落会宿公寓(前海壹方城宝安中心店)' }],
        },
      },
    })
  })
})

test('/statistics/preSaleCouponMall renders a business-ready success state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/preSaleCouponMall'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '预售券核销明细' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '预售券核销明细' })).toBeAttached()
  await expect(page.locator('.presale-coupon-store-switch .month-store-select__trigger')).toContainText('全部门店')
  await expect(page.getByRole('button', { name: '统计日期' })).toContainText('2026-05-01')
  await expect(page.getByRole('button', { name: '统计日期' })).toContainText('2026-05-31')
  await expect(page.getByRole('button', { name: '渠道: 全部渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '预售券类型: 全部类型' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入商品编号/商品名称')).toBeVisible()

  await expect(page.getByRole('button', { name: '总成交券数' })).toContainText('168')
  await expect(page.getByRole('button', { name: '总核销金额' })).toContainText('25,780')
  await expect(page.locator('table tbody tr').first().locator('td').first()).toHaveText('天落电竞双人房周末通兑券')
  await expect(page.locator('table tbody tr').first().locator('td').nth(1)).toHaveText('房券')
  await expect(page.getByRole('button', { name: '查看详情 天落电竞双人房周末通兑券' })).toBeVisible()
  await expect(page.getByText('暂无数据')).toBeHidden()

  await expect(page.locator('#pre-sale-coupon-mall-diagnostics')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('#pre-sale-coupon-mall-diagnostics')).toHaveAttribute('data-state', 'success')

  await page.screenshot({
    path: path.join(artifactRoot, 'success-clone-route.png'),
    fullPage: true,
  })
})

test('/statistics/preSaleCouponMall supports filters, feedback, detail, and description interactions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/preSaleCouponMall'))

  await page.getByRole('button', { name: '渠道: 全部渠道' }).click()
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('路客云聚合')
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('美团民宿')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '预售券类型: 全部类型' }).click()
  await expect(page.getByRole('listbox', { name: '预售券类型选项' })).toContainText('房券')
  await expect(page.getByRole('listbox', { name: '预售券类型选项' })).toContainText('套餐')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '统计日期' }).click()
  await expect(page.getByRole('dialog', { name: '统计日期面板' })).toContainText(/2026年\s*5月/)
  await expect(page.getByRole('dialog', { name: '统计日期面板' })).toContainText(/2026年\s*6月/)
  await expect(page.getByRole('button', { name: '本月' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByPlaceholder('请输入商品编号/商品名称').fill('电竞')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByPlaceholder('请输入商品编号/商品名称')).toHaveValue('电竞')
  await expect(page.locator('#pre-sale-coupon-mall-diagnostics')).toHaveAttribute('data-request', /"keyword":"电竞"/)

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.locator('#pre-sale-coupon-mall-diagnostics')).toHaveAttribute('data-state', 'success')

  await page.getByRole('button', { name: '查看详情 天落电竞双人房周末通兑券' }).click()
  await expect(page.getByRole('dialog', { name: '预售券详情' })).toContainText('天落电竞双人房周末通兑券')
  await expect(page.getByRole('dialog', { name: '预售券详情' })).toContainText('房券')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByPlaceholder('请输入商品编号/商品名称')).toHaveValue('')

  await page.getByRole('button', { name: '说明' }).click()
  await expect(page.getByRole('dialog', { name: '字段说明' })).toContainText('成交券数')
  await expect(page.getByRole('dialog', { name: '字段说明' })).toContainText('核销率')
  await expect(page.getByRole('dialog', { name: '字段说明' })).toContainText('退款金额')
  await page.getByRole('button', { name: '关闭字段说明' }).click()
  await expect(page.getByRole('dialog', { name: '字段说明' })).toBeHidden()
})

test('/statistics/preSaleCouponMall supports empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/statistics/preSaleCouponMall?mockState=empty'))
  await expect(page.locator('#pre-sale-coupon-mall-diagnostics')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByText('当前筛选条件下暂无核销明细')).toBeVisible()
  await expect(page.locator('table tbody tr')).toHaveCount(0)

  await page.goto(appUrl('/statistics/preSaleCouponMall?mockState=error'))
  await expect(page.locator('#pre-sale-coupon-mall-diagnostics')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert')).toContainText('预售券核销明细加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('/statistics/preSaleCouponMall real provider adapts promotion report endpoints', async ({ page }) => {
  const metricRequests: Array<Record<string, unknown>> = []
  const productSaleRequests: Array<Record<string, unknown>> = []

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'pre-sale-coupon-mall-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.preSaleCouponMallProvider', 'real')
  })

  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          list: [{ poiId: 'poi-10001', poiName: '当前门店' }],
        },
      },
    })
  })
  await page.route('**/api/report/promotion/get', async (route) => {
    metricRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      json: {
        success: true,
        data: {
          turnover: 1200,
          commission: 60,
          orderCount: 4,
        },
      },
    })
  })
  await page.route('**/api/report/promotion/productSale/page/get', async (route) => {
    productSaleRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      json: {
        success: true,
        data: {
          total: 1,
          size: 20,
          current: 1,
          pageNum: 1,
          list: [
            {
              id: 'real-presale-product-1',
              productId: 'real-presale-product-1',
              name: '真实预售券商品',
              sales: 4,
              turnover: 1200,
              commission: 60,
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl('/statistics/preSaleCouponMall'))

  await expect(page.locator('#pre-sale-coupon-mall-diagnostics')).toHaveAttribute('data-provider', 'api')
  await expect(page.locator('#pre-sale-coupon-mall-diagnostics')).toHaveAttribute('data-state', 'success')
  await expect(page.getByRole('alert')).toBeHidden()
  await expect(page.locator('table tbody')).toContainText('真实预售券商品')

  expect(metricRequests).toHaveLength(1)
  expect(productSaleRequests).toHaveLength(1)
  expect(metricRequests[0]).toMatchObject({
    campId: '10001',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    type: '1',
  })
  expect(productSaleRequests[0]).toMatchObject({
    campId: '10001',
    pageNum: 1,
    pageSize: 20,
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    type: '1',
  })
})
