import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return appBaseURL ? `${appBaseURL}${path}` : path
}

test('/channels/ota renders business data from the OTA provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/ota'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: 'OTA', exact: true }).first()).toHaveClass(/is-active/)
  await expect(page.getByRole('status', { name: 'OTA数据请求状态' })).toHaveAttribute('data-trace-id', 'mock-ota--ota--ota-dashboard-success-001')
  await expect(page.getByLabel('OTA核心指标')).toContainText('已直连')
  await expect(page.locator('.ota-channel-card--connected')).toHaveCount(8)
  await expect(page.getByTestId('ota-pending-card')).toHaveCount(8)
  await expect(page.locator('.ota-page')).not.toContainText(/未接入|阻塞|后端未就绪|后端接口未完成|mock 数据/i)
})

test('/channels/ota supports filters refresh export and channel drawers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/ota'))

  await page.getByLabel('业务日期').fill('2026-05-19')
  await page.getByLabel('门店').selectOption('qianhai')
  await page.getByLabel('运营维度').selectOption('connected')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByRole('status', { name: 'OTA操作反馈' })).toContainText('已按筛选条件更新')

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: 'OTA操作反馈' })).toContainText('数据已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: 'OTA操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '管理渠道 携程' }).click()
  await expect(page.getByRole('dialog', { name: '渠道详情' })).toContainText('携程')
  await page.getByRole('dialog', { name: '渠道详情' }).getByRole('button', { name: '去订单' }).click()
  await expect(page).toHaveURL(/\/order\/house-order\/list$/)

  await page.goto(appUrl('/channels/ota'))
  await page.getByRole('button', { name: '新增账号 携程' }).click()
  await expect(page.getByRole('dialog', { name: '新增渠道账号' })).toContainText('携程')
  await page.getByRole('dialog', { name: '新增渠道账号' }).getByRole('textbox', { name: '渠道账号' }).fill('ota-account-001')
  await page.getByRole('button', { name: '提交账号' }).click()
  await expect(page.getByRole('status', { name: 'OTA操作反馈' })).toContainText('账号新增成功')

  await page.getByRole('button', { name: '立即关联 Booking' }).click()
  await expect(page.getByRole('dialog', { name: '关联渠道' })).toContainText('Booking')
  await page.getByRole('button', { name: '确认关联' }).click()
  await expect(page.getByRole('status', { name: 'OTA操作反馈' })).toContainText('关联申请已提交')
})

test('/channels/ota handles empty and error provider states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/channels/ota?mockState=empty'))
  await expect(page.getByLabel('OTA空状态')).toContainText('当前筛选条件下暂无渠道数据')

  await page.goto(appUrl('/channels/ota?mockState=error'))
  await expect(page.getByRole('alert', { name: 'OTA数据错误' })).toContainText('OTA数据加载失败')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert', { name: 'OTA数据错误' })).toContainText('OTA数据加载失败')
})

test('/channels/ota/log uses provider filters and pagination', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/ota/log'))

  await expect(page.getByRole('status', { name: 'OTA日志请求状态' })).toHaveAttribute('data-trace-id', 'mock-ota--ota--ota-operation-logs-success-001')
  await page.getByLabel('渠道').selectOption('meituan-hotel')
  await page.getByPlaceholder('搜索关键词').fill('观影大床房')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status', { name: 'OTA日志请求状态' })).toHaveAttribute('data-request', /channelId=meituan-hotel/)
  await expect(page.getByRole('table', { name: 'OTA操作日志列表' })).toContainText('观影大床房')

  await page.getByRole('button', { name: '展开' }).click()
  await page.getByLabel('渠道').selectOption('all')
  await page.getByPlaceholder('搜索关键词').fill('')
  await page.getByLabel('操作类型').selectOption('unbindRoomType')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('table', { name: 'OTA操作日志列表' })).toContainText('解除渠道房型')

  await page.getByRole('button', { name: '第 2 页' }).click()
  await expect(page.getByRole('status', { name: 'OTA日志请求状态' })).toHaveAttribute('data-request', /page=2/)

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByLabel('渠道')).toHaveValue('all')
  await expect(page.getByPlaceholder('搜索关键词')).toHaveValue('')
})

test('/channels/ota/log handles empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/channels/ota/log?mockState=empty'))
  await expect(page.getByLabel('OTA日志空状态')).toContainText('暂无操作日志')

  await page.goto(appUrl('/channels/ota/log?mockState=error'))
  await expect(page.getByRole('alert', { name: 'OTA日志错误' })).toContainText('OTA操作日志加载失败')
})
