import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const forbiddenPageCopy = /mock provider|mock 数据|未接入|阻塞|后端未就绪|后端接口未完成|真实接口/

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/statistics/profitReport renders provider-backed business data by default', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/profitReport'))
  const reportPage = page.locator('.profit-report-page')

  await expect(page.locator('.page-content > .page-header')).toHaveCount(0)
  await expect(reportPage).toBeVisible()
  await expect(reportPage).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '利润报表' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('利润报表筛选')).toContainText('全部门店')
  await expect(page.getByLabel('利润报表筛选')).toContainText('包含保洁费用')
  await expect(page.getByRole('button', { name: '房型 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型分组 请选择' })).toBeVisible()
  await expect(page.getByLabel('利润报表表格')).toContainText('11362.58')
  await expect(page.getByLabel('利润报表表格')).toContainText('2026-05-19')
  await expect(page.getByText('第 1-20 条/总共 32 条')).toBeVisible()
  await expect(reportPage).not.toContainText(forbiddenPageCopy)

  const requestMeta = JSON.parse((await reportPage.getAttribute('data-profit-request')) || '{}')
  expect(requestMeta).toMatchObject({
    campId: 'mock-camp-main',
    pageNum: 1,
    pageSize: 20,
    current: 1,
    isCleanCost: 0,
  })
})

test('/statistics/profitReport updates provider filters and pagination through visible controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/profitReport'))
  const reportPage = page.locator('.profit-report-page')
  const reportPagination = page.locator('.profit-report-pagination')

  await page.getByRole('button', { name: '房型 请选择' }).click()
  await page.getByRole('option', { name: '观影大床房' }).click()
  await expect(page.getByRole('button', { name: '房型 观影大床房' })).toBeVisible()

  await page.getByRole('button', { name: '渠道 请选择' }).click()
  await page.getByRole('option', { name: '携程' }).click()
  await expect(page.getByRole('button', { name: '渠道 携程' })).toBeVisible()

  await page.getByLabel('包含保洁费用').check()
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status', { name: '利润报表操作反馈' })).toContainText('已按当前条件更新利润报表')

  const filtersMeta = JSON.parse((await reportPage.getAttribute('data-profit-filters')) || '{}')
  expect(filtersMeta).toMatchObject({
    roomCategoryId: '1796425098965729282',
    channelId: '携程',
    includeCleanCost: true,
  })

  await reportPagination.getByRole('button', { name: '2', exact: true }).click()
  await expect(reportPagination.getByRole('button', { name: '2', exact: true })).toHaveClass(/is-current/)
  await expect(page.getByLabel('利润报表表格')).toContainText('2026-04-30')

  const page2Request = JSON.parse((await reportPage.getAttribute('data-profit-request')) || '{}')
  expect(page2Request).toMatchObject({
    pageNum: 2,
    pageSize: 20,
  })

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '房型 请选择' })).toBeVisible()
  await expect(page.getByLabel('包含保洁费用')).not.toBeChecked()
  await expect(reportPagination.getByRole('button', { name: '1', exact: true })).toHaveClass(/is-current/)
})

test('/statistics/profitReport gives feedback for explanation export collapse and page-size actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/profitReport'))
  const reportActions = page.locator('.profit-report-actions')
  const reportPagination = page.locator('.profit-report-pagination')

  await page.getByRole('button', { name: '说 明' }).click()
  const dialog = page.getByRole('dialog', { name: '利润报表字段说明' })
  await expect(dialog).toContainText('房费(减佣)')
  await expect(dialog).toContainText('利润率')
  await page.getByLabel('关闭利润报表字段说明').click()
  await expect(dialog).toHaveCount(0)

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('status', { name: '利润报表操作反馈' })).toContainText('导出任务已创建')

  await reportActions.getByRole('button', { name: '收起', exact: true }).click()
  await expect(reportActions.getByRole('button', { name: '展开', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型 请选择' })).toHaveCount(0)
  await reportActions.getByRole('button', { name: '展开', exact: true }).click()
  await expect(page.getByRole('button', { name: '房型 请选择' })).toBeVisible()

  await reportPagination.getByRole('button', { name: '20 条/页', exact: true }).click()
  await expect(page.getByRole('status', { name: '利润报表操作反馈' })).toContainText('当前每页显示 20 条')
})

test('/statistics/profitReport renders empty and error envelopes without collapsing layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/statistics/profitReport?profitMockState=empty'))
  await expect(page.getByLabel('利润报表表格')).toContainText('暂无利润报表数据')
  await expect(page.locator('.profit-report-table tbody tr')).toHaveCount(0)
  await expect(page.locator('.profit-report-page')).not.toContainText(forbiddenPageCopy)

  await page.goto(appUrl('/statistics/profitReport?profitMockState=error'))
  await expect(page.getByRole('alert', { name: '利润报表数据错误' })).toContainText('利润报表数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.getByLabel('利润报表表格')).toContainText('暂无利润报表数据')
})
