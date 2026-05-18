import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

const developmentCopy = /mock provider|mock 数据|未接入|阻塞|后端未就绪|后端接口未完成|真实接口|未取证|缺少 campId/i

test('/order/house-longRental-order/list loads through the explicit data provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list'))

  await expect(page.getByRole('link', { name: '长租订单' })).toHaveClass(/is-active/)
  await expect(page.getByRole('table', { name: '长租订单列表' })).toContainText('1871589898539520001')
  await expect(page.getByRole('table', { name: '长租订单列表' })).toContainText('佟扬')
  await expect(page.getByRole('status', { name: '长租订单加载状态' })).toContainText('已加载 1 条')
  await expect(page.getByLabel('长租订单分页和请求参数')).toContainText('共 1 条')
  await expect(page.locator('.order-page--long-rental')).not.toContainText(developmentCopy)
})

test('/order/house-longRental-order/list supports filters, refresh, export and create entry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list'))

  await page.getByPlaceholder('输入订单号/姓名/手机号').fill('佟扬')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByRole('status', { name: '长租订单操作反馈' })).toContainText('已按当前条件查询')
  await expect(page.getByLabel('长租订单分页和请求参数')).toContainText('keyword=佟扬')

  await page.getByRole('radio', { name: '今日预抵' }).click()
  await expect(page.getByRole('status', { name: '长租订单操作反馈' })).toContainText('今日预抵')
  await expect(page.getByLabel('长租订单分页和请求参数')).toContainText('orderType=11')

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '长租订单操作反馈' })).toContainText('长租订单已刷新')

  await page.getByRole('button', { name: '展开' }).click()
  await page.getByRole('button', { name: '日期类型' }).click()
  await page.getByRole('option', { name: '入住时间' }).click()
  await expect(page.getByRole('status', { name: '长租订单操作反馈' })).toContainText('日期类型已更新')

  await page.getByRole('button', { name: '导出明细' }).click()
  await expect(page.getByRole('status', { name: '长租订单操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '录入订单' }).click()
  await expect(page.getByRole('dialog', { name: '录入长租订单' })).toContainText('租客姓名')
  await page.getByRole('button', { name: '保存订单' }).click()
  await expect(page.getByRole('status', { name: '长租订单操作反馈' })).toContainText('长租订单已保存')

  await page.getByRole('button', { name: '重置筛选' }).click()
  await expect(page.getByPlaceholder('输入订单号/姓名/手机号')).toHaveValue('')
  await expect(page.getByRole('radio', { name: '全部' })).toHaveAttribute('aria-checked', 'true')
})

test('/order/house-longRental-order/list handles detail tabs and footer actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list'))

  await page.getByRole('button', { name: '详情' }).click()
  await expect(page.getByRole('dialog', { name: '长租订单详情' })).toContainText('美团民宿')
  await page.getByRole('button', { name: '合同信息' }).click()
  await expect(page.getByRole('dialog', { name: '长租订单详情' })).toContainText('合同周期')
  await page.getByRole('button', { name: '缴费记录' }).click()
  await expect(page.getByRole('dialog', { name: '长租订单详情' })).toContainText('缴费计划')

  await page.getByRole('button', { name: '收 款' }).click()
  await expect(page.getByRole('status', { name: '长租订单操作反馈' })).toContainText('收款流程已记录')
  await page.getByRole('button', { name: '关闭长租订单详情' }).click()
  await expect(page.getByRole('dialog', { name: '长租订单详情' })).toHaveCount(0)
})

test('/order/house-longRental-order/list exposes provider error and retry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list?longRentalMockState=error'))

  await expect(page.getByRole('alert', { name: '长租订单数据错误' })).toContainText('长租订单数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('.order-page--long-rental')).not.toContainText(developmentCopy)
})

test('/order/house-longRental-order/list renders provider empty state without static fallback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list?longRentalMockState=empty'))

  await expect(page.getByRole('status', { name: '长租订单加载状态' })).toContainText('已加载 0 条')
  await expect(page.getByRole('table', { name: '长租订单列表' })).toContainText('暂无长租订单')
  await expect(page.getByRole('table', { name: '长租订单列表' })).not.toContainText('1871589898539520001')
  await expect(page.locator('.order-page--long-rental')).not.toContainText(developmentCopy)
})
