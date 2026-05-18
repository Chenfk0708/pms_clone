import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/mallManagement/hotelPackageOrder uses explicit mock provider response packages by default', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const hudsonRequests: string[] = []
  await page.route('https://hudson-prod.localhome.cn/**', async (route) => {
    hudsonRequests.push(route.request().url())
    await route.fulfill({ status: 500, json: { code: 500, message: 'default mock should not call hudson' } })
  })

  await page.goto(appUrl('/mallManagement/hotelPackageOrder'))

  await expect(page.getByRole('heading', { name: '酒店套餐订单', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '酒店套餐订单' })).toHaveClass(/is-active/)
  await expect(page.getByTestId('hotel-package-order-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('hotel-package-order-service-contract')).toHaveAttribute(
    'data-trace-id',
    /mock-dingdan--yushouquan-dingdan--jiudian-taocan-dingdan-list-001/,
  )
  await expect(page.getByLabel('酒店套餐订单表格')).toContainText('总裁套间双晚套餐')
  await expect(page.getByLabel('酒店套餐订单表格')).toContainText('13800001234')
  await expect(page.locator('.hotel-package-order-page')).not.toContainText(/mock|provider|traceId|未接入|阻塞|后端/i)
  expect(hudsonRequests).toEqual([])
})

test('/mallManagement/hotelPackageOrder supports filters, refresh, export, detail and pagination feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/hotelPackageOrder'))

  await page.getByRole('button', { name: '订单来源 请选择订单来源' }).click()
  await page.getByRole('option', { name: '微信商城' }).click()
  await page.getByPlaceholder('请输入订单编号/买家联系方式').fill('138')
  await page.getByLabel('下单开始日期').fill('2026-05-01')
  await page.getByLabel('下单结束日期').fill('2026-05-18')
  await page.getByRole('button', { name: '搜 索' }).click()
  await expect(page.getByRole('status', { name: '酒店套餐订单操作反馈' })).toContainText('搜索完成')
  await expect(page.getByTestId('hotel-package-order-request-body')).toHaveText(/"orderChannelIds": \[\s*"wechat"/)
  await expect(page.getByTestId('hotel-package-order-request-body')).toHaveText(/"keyword": "138"/)

  await page.getByRole('button', { name: '刷 新' }).click()
  await expect(page.getByRole('status', { name: '酒店套餐订单操作反馈' })).toContainText('刷新完成')

  await page.getByRole('button', { name: '导出明细' }).click()
  await expect(page.getByRole('status', { name: '酒店套餐订单操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '订单详情' }).first().click()
  await expect(page.getByRole('dialog', { name: '酒店套餐订单详情' })).toContainText('总裁套间双晚套餐')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.getByLabel('酒店套餐订单分页')).toContainText('第 2 页')
  await expect(page.getByRole('status', { name: '酒店套餐订单操作反馈' })).toContainText('已切换到第 2 页')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '订单来源 请选择订单来源' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入订单编号/买家联系方式')).toHaveValue('')
})

test('/mallManagement/hotelPackageOrder supports mock empty and error states with business copy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/mallManagement/hotelPackageOrder?mockState=empty'))
  await expect(page.getByTestId('hotel-package-order-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByRole('status', { name: '酒店套餐订单空态' })).toContainText('暂无数据')
  await expect(page.locator('.hotel-package-order-page')).not.toContainText(/mock|provider|traceId|未接入|阻塞|后端/i)

  await page.goto(appUrl('/mallManagement/hotelPackageOrder?mockState=error'))
  await expect(page.getByRole('alert')).toContainText('酒店套餐订单加载失败')
  await expect(page.getByRole('button', { name: '刷 新' })).toBeVisible()
  await expect(page.locator('.hotel-package-order-page')).not.toContainText(/mock|provider|traceId|未接入|阻塞|后端/i)
})
