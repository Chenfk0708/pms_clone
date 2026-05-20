import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/statistics/shift/record renders a usable success state with the shift record service contract', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/shift/record'))

  const pageRoot = page.locator('.shift-record-page')
  const filters = page.getByLabel('交接班筛选')
  const table = page.getByLabel('交接班表格')
  const serviceContract = page.locator('[aria-label="交接班数据服务"]')

  await expect(page.locator('.page-content > .page-header')).toHaveCount(0)
  await expect(pageRoot).toBeVisible()
  await expect(page.getByRole('link', { name: '交接班', exact: true })).toHaveClass(/is-active/)
  await expect(filters).toContainText('开始日期')
  await expect(filters).toContainText('结束日期')
  await expect(page.getByLabel('开始日期')).toHaveValue('')
  await expect(page.getByLabel('结束日期')).toHaveValue('')
  await expect(page.getByLabel('门店')).toHaveValue('all')
  await expect(page.getByLabel('交班人')).toHaveValue('all')
  await expect(page.getByLabel('接班人')).toHaveValue('all')
  await expect(page.getByRole('button', { name: '查询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
  await expect(page.getByRole('button', { name: '设 置' })).toBeVisible()

  for (const header of ['交班日期', '交班班次', '交班人', '交班时间', '接班人', '接班时间', '交接状态', '交班备注', '接班备注', '系统生成时间', '操作']) {
    await expect(table.getByRole('columnheader', { name: header })).toBeVisible()
  }

  await expect(page.getByRole('button', { name: '查看详情 SR20260518001' })).toBeVisible()
  await expect(table).toContainText('路客云6TS5')
  await expect(table).toContainText('已完成')
  await expect(table).toContainText('共 3 条交接记录')
  await expect(page.getByRole('status', { name: '交接班操作反馈' })).toContainText('已加载交接班记录')

  await expect(serviceContract).toContainText('provider=mock')
  await expect(serviceContract).toContainText('listPath=/shiftWorkReport/page/get')
  await expect(serviceContract).toContainText('storePath=/select/poi/page/get')
  await expect(serviceContract).toContainText('employeePath=/campRoles/get')
  await expect(serviceContract).toContainText('campId=1796067693589061634')
  await expect(serviceContract).toContainText('pageSize=20')
  await expect(serviceContract).toContainText('total=3')
  await expect(serviceContract).toContainText('storeCount=2')
  await expect(serviceContract).toContainText('employeeCount=3')
  await expect(pageRoot).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)
})

test('/statistics/shift/record supports query reset export detail and settings handoff', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/shift/record'))

  const currentStore = '1796425098638573570'
  const serviceContract = page.locator('[aria-label="交接班数据服务"]')

  await page.getByLabel('开始日期').fill('2026-05-18')
  await page.getByLabel('结束日期').fill('2026-05-18')
  await page.getByLabel('门店').selectOption(currentStore)
  await page.getByLabel('交班人').selectOption('1796067693261905922')
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.getByRole('status', { name: '交接班操作反馈' })).toContainText('已按筛选条件更新交接班记录')
  await expect(page.getByRole('region', { name: '当前筛选条件' })).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(page.getByRole('region', { name: '当前筛选条件' })).toContainText('路客云6TS5')
  await expect(page.getByRole('button', { name: '查看详情 SR20260518001' })).toBeVisible()
  await expect(page.getByText('共 1 条交接记录')).toBeVisible()
  await expect(serviceContract).toContainText('poiId=1796425098638573570')
  await expect(serviceContract).toContainText('handoverUserId=1796067693261905922')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '交接班操作反馈' })).toContainText('交接班导出任务已创建')
  await expect(serviceContract).toContainText('exportTaskId=shift-record-export-001')

  await page.getByRole('button', { name: '查看详情 SR20260518001' }).click()
  const detailDialog = page.getByRole('dialog', { name: '交接班详情' })
  await expect(detailDialog).toContainText('净收入')
  await expect(detailDialog).toContainText('4860')
  await expect(detailDialog).toContainText('房费')
  await expect(detailDialog).toContainText('现金')
  await expect(detailDialog).toContainText('房卡A组')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '交接班详情' })).toHaveCount(0)

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByRole('status', { name: '交接班操作反馈' })).toContainText('已恢复默认筛选条件')
  await expect(page.getByLabel('开始日期')).toHaveValue('')
  await expect(page.getByLabel('结束日期')).toHaveValue('')
  await expect(page.getByLabel('门店')).toHaveValue('all')
  await expect(page.getByLabel('交班人')).toHaveValue('all')
  await expect(page.getByLabel('接班人')).toHaveValue('all')

  await page.getByRole('button', { name: '设 置' }).click()
  await expect(page).toHaveURL(/\/setting\/shiftSetting$/)
  await expect(page.getByRole('link', { name: '交接班设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('region', { name: '班次设置' })).toBeVisible()
})

test('/statistics/shift/record exposes empty and error states as business feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/statistics/shift/record?mockState=empty'))
  await expect(page.getByRole('status', { name: '交接班操作反馈' })).toContainText('当前筛选条件暂无交接班记录')
  await expect(page.getByLabel('交接班表格')).toContainText('暂无数据')
  await expect(page.getByRole('button', { name: '导出' })).toBeDisabled()
  await expect(page.locator('[aria-label="交接班数据服务"]')).toContainText('total=0')

  await page.goto(appUrl('/statistics/shift/record?mockState=error'))
  await expect(page.getByRole('alert', { name: '交接班数据错误' })).toContainText('交接班记录加载失败，请稍后重试')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert', { name: '交接班数据错误' })).toContainText('交接班记录加载失败，请稍后重试')
  await expect(page.locator('.shift-record-page')).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)
})
