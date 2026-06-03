import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openCouponPage(page: import('@playwright/test').Page, mode: 'success' | 'empty' | 'error' = 'success') {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript((mockMode) => {
    window.localStorage.setItem('pms.couponProvider', 'mock')
    window.localStorage.setItem('pms.couponMockMode', mockMode)
  }, mode)
  await page.goto(appUrl('/mallManagement/couponMgt'))
}

test('/mallManagement/couponMgt renders coupon data through the service contract', async ({ page }) => {
  await openCouponPage(page)

  await expect(page.getByRole('heading', { name: '优惠券', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '优惠券' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByTestId('coupon-service-endpoint')).toContainText('coupons/page/get')
  await expect(page.getByTestId('coupon-request-body')).toContainText('"pageNum":1')

  await expect(page.getByRole('tab', { name: '优惠券管理' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('button', { name: '上架状态 请选择' })).toBeVisible()
  await expect(page.getByLabel('优惠券筛选').getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
  await expect(page.getByLabel('优惠券列表表格').locator('.coupon-table__head > div')).toHaveText([
    '名称',
    '类型',
    '优惠力度',
    '可用范围',
    '派发上限',
    '每人可领数',
    '派发时间',
    '时效类型',
    '生效时间',
    '领券条件',
    '状态',
    '操作',
  ])
  await expect(page.getByRole('cell', { name: '春季连住满减券', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: '会员复购专享券', exact: true })).toBeVisible()

  await page.getByRole('button', { name: '上架状态 请选择' }).click()
  await page.getByRole('option', { name: '已上架' }).click()
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('已按当前条件刷新优惠券')
  await expect(page.getByTestId('coupon-request-body')).toContainText('"shelfStatus":1')

  await page.getByLabel('优惠券筛选').getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('dialog', { name: '导出优惠券' })).toContainText('导出任务已创建')
  await page.getByRole('button', { name: '关闭导出优惠券' }).click()

  await page.getByRole('button', { name: '查看 春季连住满减券' }).click()
  await expect(page.getByRole('dialog', { name: '优惠券详情' })).toContainText('春季连住满减券')
  await page.getByRole('button', { name: '关闭优惠券详情' }).click()
})

test('/mallManagement/couponMgt supports task tab, pagination, empty, and error states', async ({ page }) => {
  await openCouponPage(page)

  await page.getByRole('tab', { name: '派发任务' }).click()
  await expect(page.getByTestId('coupon-service-endpoint')).toContainText('couponSendConfigs/page/get')
  await expect(page.getByLabel('派发任务表格').locator('.coupon-table__head > div')).toHaveText([
    '派发方式',
    '优惠券',
    '已派数量',
    '创建时间',
    '记录',
  ])
  await expect(page.getByRole('cell', { name: '会员标签定向派发' })).toBeVisible()

  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.getByTestId('coupon-request-body')).toContainText('"pageNum":2')
  await page.getByRole('button', { name: '新建任务' }).click()
  await expect(page.getByRole('dialog', { name: '新建派发任务' })).toContainText('选择优惠券后可按会员标签派发')
  await page.getByRole('button', { name: '取消新建派发任务' }).click()

  await openCouponPage(page, 'empty')
  await expect(page.getByLabel('优惠券列表表格').getByText('暂无符合条件的优惠券')).toBeVisible()

  await openCouponPage(page, 'error')
  await expect(page.getByRole('alert')).toContainText('优惠券数据加载失败')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert')).toContainText('优惠券数据加载失败')
})



test('/mallManagement/couponMgt real provider sends gateway auth header and adapts coupon pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'coupon-token')
    window.localStorage.setItem('pms.couponProvider', 'real')
  })

  const couponRequests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []
  const taskRequests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []

  await page.route('**/api/coupons/page/get', async (route) => {
    couponRequests.push({
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-coupon-list-trace-001',
        timestamp: '2026-05-30T10:00:00+08:00',
        data: {
          total: 1,
          size: 20,
          current: 1,
          pageNum: 1,
          pages: 1,
          hasNextPage: false,
          list: [
            {
              id: 'real-coupon-1',
              couponId: 'real-coupon-1',
              name: 'Real Coupon Spring Stay',
              couponName: 'Real Coupon Spring Stay',
              typeName: 'Full discount coupon',
              discountText: 'Full 500 off 80',
              scopeText: 'All room types',
              sendLimit: 300,
              perUserLimit: 2,
              sendTimeText: '2026-05-30 10:00',
              validityTypeText: 'Relative days',
              effectiveTimeText: 'Valid 7 days after received',
              receiveRuleText: 'All users',
              shelfStatus: 1,
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/couponSendConfigs/page/get', async (route) => {
    taskRequests.push({
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-coupon-task-trace-001',
        timestamp: '2026-05-30T10:00:00+08:00',
        data: {
          total: 1,
          size: 20,
          current: 1,
          pageNum: 1,
          pages: 1,
          hasNextPage: false,
          list: [
            {
              id: 'real-task-1',
              couponId: 'real-coupon-1',
              couponName: 'Real Coupon Spring Stay',
              sendMethod: 'Real targeted send',
              sentCount: 128,
              createdAt: '2026-05-30 11:30',
              recordText: 'View records',
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl('/#/mallManagement/couponMgt'))

  await expect(page.getByRole('button', { name: /Real Coupon Spring Stay/ })).toBeVisible()

  await page.getByRole('tab').nth(1).click()
  await expect(page.getByRole('cell', { name: 'Real targeted send' })).toBeVisible()

  expect(couponRequests).toHaveLength(1)
  expect(taskRequests).toHaveLength(1)
  expect(couponRequests[0].headers.authorization).toBe('Bearer coupon-token')
  expect(taskRequests[0].headers.authorization).toBe('Bearer coupon-token')
  expect(couponRequests[0].body).toMatchObject({
    campId: '1796067693589061634',
    shelfStatus: null,
    pageNum: 1,
    pageSize: 20,
    current: 1,
  })
  expect(taskRequests[0].body).toMatchObject({
    campId: '1796067693589061634',
    pageNum: 1,
    pageSize: 20,
    current: 1,
  })
})

test('/mallManagement/couponMgt/edit keeps form interactions and submit feedback local', async ({ page }) => {
  await openCouponPage(page)

  await page.getByRole('button', { name: '新建' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/couponMgt\/edit$/)
  await expect(page.getByRole('heading', { name: '优惠券', level: 1 })).toBeVisible()
  await expect(page.getByText('优惠券列表>新增')).toBeVisible()
  await expect(page.getByLabel('优惠券表单')).toContainText('名称')
  await expect(page.getByLabel('类型 满减券')).toBeChecked()
  await expect(page.getByLabel('所有人可以领')).toBeChecked()
  await expect(page.getByLabel('可以与会员折扣共用')).toBeChecked()
  await expect(page.getByLabel('有效天数')).toBeChecked()

  await page.getByLabel('名称').fill('周末复购券')
  await page.getByLabel('满额金额').fill('300')
  await page.getByLabel('减免金额').fill('30')
  await page.getByRole('button', { name: '选择商品/房型' }).click()
  await expect(page.getByRole('dialog', { name: '选择商品/房型' })).toContainText('顶层套房')
  await page.getByRole('button', { name: '确认选择商品/房型' }).click()
  await page.getByRole('button', { name: '查看默认节假日列表' }).click()
  await expect(page.getByRole('dialog', { name: '默认节假日列表' })).toContainText('春节')
  await page.getByRole('button', { name: '关闭默认节假日列表' }).click()
  await page.getByRole('button', { name: '提 交' }).click()
  await expect(page.getByRole('status')).toContainText('优惠券已保存')

  await page.getByRole('button', { name: '返回列表' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/couponMgt$/)
})
