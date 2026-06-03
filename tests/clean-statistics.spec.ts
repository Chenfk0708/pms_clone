import { expect, test, type Route } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  if (appBaseURL) {
    return `${appBaseURL.replace(/\/$/, '')}/#${routePath}`
  }

  return `/#${routePath}`
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'clean-statistics-playwright-token')
    window.localStorage.setItem('pmsCampId', 'mock-camp-main')
    window.localStorage.setItem('pms.cleanStatisticsProvider', 'mock')
    window.localStorage.setItem('pms.applicationPaymentProvider', 'mock')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '1',
        name: 'Playwright Admin',
        mobile: '13800000001',
        roleName: 'Platform Admin',
        campName: 'Mock Camp',
      }),
    )
  })
})

async function fulfillHudson(route: Route, data: unknown) {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  })
}

const forbiddenPageCopy = /mock|未接入|阻塞|后端未就绪|后端接口未完成|未完成取证|未取证|真实接口/

test('/cleanManage/cleanStatistics renders usable business data from the provider by default', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStatistics'))

  await expect(page.locator('.page-header')).toHaveCount(0)
  await expect(page.locator('.clean-stat-title')).toHaveText('保洁统计')
  await expect(page.getByRole('button', { name: '统计汇总' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('保洁统计核心指标')).toContainText('本月保洁')
  await expect(page.getByLabel('保洁统计核心指标')).toContainText('186')
  await expect(page.getByLabel('保洁统计汇总表')).toContainText('2026-05-16')
  await expect(page.getByLabel('保洁统计汇总表')).toContainText('188.00')
  await expect(page.getByLabel('保洁统计待办')).toContainText('今日退房保洁')
  await expect(page.locator('.clean-stat-page')).not.toContainText(forbiddenPageCopy)

  const requestMeta = await page.locator('.clean-stat-page').getAttribute('data-clean-request')
  expect(JSON.parse(requestMeta || '{}')).toMatchObject({
    campId: 'mock-camp-main',
    pageNum: 1,
    pageSize: 20,
  })
})

test('/cleanManage/cleanStatistics filters refresh provider params and UI feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStatistics'))

  await page.getByLabel('开始日期').fill('2026-05-10')
  await page.getByLabel('结束日期').fill('2026-05-12')
  await page.getByRole('button', { name: '查 询' }).click()

  await expect(page.getByRole('status', { name: '保洁统计操作反馈' })).toContainText('已按当前筛选更新')
  const requestMeta = JSON.parse((await page.locator('.clean-stat-page').getAttribute('data-clean-request')) || '{}')
  expect(requestMeta).toMatchObject({
    cleanStartTime: 1778342400000,
    cleanEndTime: 1778601599999,
  })

  await page.getByRole('button', { name: '房型房间 请选择房间' }).click()
  await page.getByRole('option', { name: /观影大床房/ }).click()
  await expect(page.getByRole('button', { name: /房型房间 观影大床房/ })).toBeVisible()

  await page.getByRole('button', { name: '保洁员 请选择保洁员' }).click()
  await page.getByRole('option', { name: '李清清' }).click()
  await expect(page.getByRole('button', { name: '保洁员 李清清' })).toBeVisible()

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '房型房间 请选择房间' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保洁员 请选择保洁员' })).toBeVisible()
})

test('/cleanManage/cleanStatistics gives feedback for every visible business action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStatistics'))

  await page.getByRole('button', { name: '天落会宿…' }).click()
  await expect(page.getByRole('status', { name: '保洁统计操作反馈' })).toContainText('已切换门店')

  await page.getByRole('button', { name: '门店设置' }).click()
  await expect(page).toHaveURL(/\/cleanManage\/cleanSetting$/)
  await page.goto(appUrl('/cleanManage/cleanStatistics'))

  await page.getByRole('button', { name: '保洁统计说明' }).click()
  await expect(page.getByRole('dialog', { name: '保洁统计说明' })).toContainText('统计口径')
  await page.getByRole('button', { name: '关闭说明' }).click()

  await page.getByRole('button', { name: /查看指标 本月保洁/ }).click()
  await expect(page.getByRole('dialog', { name: '指标详情' })).toContainText('本月保洁')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('status', { name: '保洁统计操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '统计明细' }).click()
  await expect(page.getByLabel('保洁统计明细表')).toContainText('CL20260516001')
  await page.getByRole('button', { name: '查看 CL20260516001' }).click()
  await expect(page.getByRole('dialog', { name: '保洁明细' })).toContainText('李清清')
  await page.getByRole('button', { name: '关闭明细' }).click()

  await page.getByRole('button', { name: '订阅开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '智能保洁', level: 1 })).toBeVisible()
})

test('/cleanManage/cleanStatistics renders empty and error envelopes without collapsing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStatistics?cleanMockState=empty'))

  await expect(page.getByLabel('保洁统计汇总表')).toContainText('暂无保洁统计数据')
  await expect(page.locator('.clean-stat-table__row')).toHaveCount(0)
  await expect(page.locator('.clean-stat-page')).not.toContainText(forbiddenPageCopy)

  await page.goto(appUrl('/cleanManage/cleanStatistics?cleanMockState=error'))
  await expect(page.getByRole('alert', { name: '保洁统计数据错误' })).toContainText('数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.getByLabel('保洁统计汇总表')).toContainText('暂无保洁统计数据')
})

test('/cleanManage/cleanStatistics real provider export calls the backend export contract', async ({ page }) => {
  const statisticsRequests: Array<Record<string, unknown>> = []
  const exportRequests: Array<Record<string, unknown>> = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.cleanStatisticsProvider', 'real')
  })

  await page.route('**/api/cleanTask/statistics', async (route) => {
    statisticsRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await fulfillHudson(route, { list: [], total: 0, pageNum: 1, current: 1, size: 20 })
  })
  await page.route('**/api/cleaner/list/get', async (route) => fulfillHudson(route, []))
  await page.route('**/api/roomCategories/page/get', async (route) => fulfillHudson(route, { list: [], total: 0 }))
  await page.route('**/api/rooms/get', async (route) => fulfillHudson(route, { roomCategoryRooms: [] }))
  await page.route('**/api/clean/statistics/export', async (route) => {
    exportRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await fulfillHudson(route, {
      taskId: 'CLEAN-STAT-EXPORT-REAL-001',
      downloadUrl: '/api/files/clean-statistics-real.xlsx',
      total: 0,
    })
  })

  await page.goto(appUrl('/cleanManage/cleanStatistics'))

  const cleanPage = page.locator('.clean-stat-page')
  await expect(cleanPage).toBeVisible()
  await expect.poll(() => statisticsRequests.length).toBe(1)

  await page.locator('button.clean-stat-export').click()

  await expect.poll(() => exportRequests.length).toBe(1)
  expect(exportRequests[0]).toMatchObject({ campId: '10001', pageNum: 1, pageSize: 20 })
  await expect(page.locator('[role="status"]')).toContainText('CLEAN-STAT-EXPORT-REAL-001')

  const exportMeta = JSON.parse((await cleanPage.getAttribute('data-clean-export')) || '{}')
  expect(exportMeta).toMatchObject({
    taskId: 'CLEAN-STAT-EXPORT-REAL-001',
    path: '/api/clean/statistics/export',
    downloadUrl: '/api/files/clean-statistics-real.xlsx',
    total: 0,
    requestBody: { campId: '10001', pageNum: 1, pageSize: 20 },
  })
})

