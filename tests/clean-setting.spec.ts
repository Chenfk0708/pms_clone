import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/cleanManage/cleanSetting renders usable setting data from the page service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanSetting'))

  const pageRoot = page.locator('.clean-setting-page')
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(pageRoot).toBeVisible()
  await expect(page.getByRole('heading', { name: '保洁设置', level: 1 })).toBeVisible()
  await expect(page.getByRole('tab', { name: '基础设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('保洁日期')).toHaveValue('2026-05-18')
  await expect(page.getByLabel('门店')).toHaveValue('all')
  await expect(page.getByLabel('项目')).toHaveValue('all')
  await expect(page.getByLabel('策略状态')).toHaveValue('all')

  await expect(page.getByRole('region', { name: '保洁设置核心指标' })).toContainText('今日任务')
  await expect(page.getByRole('region', { name: '保洁设置核心指标' })).toContainText('启用策略')
  await expect(page.getByRole('table', { name: '保洁策略列表' })).toContainText('退房保洁自动派单')
  await expect(page.getByRole('table', { name: '保洁价格规则' })).toContainText('默认退房保洁费')
  await expect(page.getByRole('region', { name: '保洁待办提醒' })).toContainText('待确认任务')
  await expect(page.getByRole('status', { name: '保洁设置操作反馈' })).toContainText('数据已更新')
  await expect(pageRoot).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)
})

test('/cleanManage/cleanSetting supports filters refresh export details and route handoff', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanSetting'))

  await page.getByLabel('保洁日期').fill('2026-05-20')
  await page.getByLabel('门店').selectOption('qianhai')
  await page.getByLabel('策略状态').selectOption('enabled')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByRole('status', { name: '保洁设置操作反馈' })).toContainText('已按筛选条件更新')
  await expect(page.getByRole('region', { name: '当前筛选条件' })).toContainText('前海店')
  await expect(page.getByRole('region', { name: '当前筛选条件' })).toContainText('已启用')

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '保洁设置操作反馈' })).toContainText('数据已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '保洁设置操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '查看详情 退房保洁自动派单' }).click()
  await expect(page.getByRole('dialog', { name: '保洁策略详情' })).toContainText('天落大床电竞套间')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '保洁策略详情' })).toHaveCount(0)

  await page.getByRole('button', { name: '编辑 退房保洁自动派单' }).click()
  await expect(page.getByRole('dialog', { name: '编辑保洁策略' })).toContainText('退房保洁自动派单')
  await page.getByRole('button', { name: '保存策略' }).click()
  await expect(page.getByRole('status', { name: '保洁设置操作反馈' })).toContainText('策略已保存')

  await page.getByRole('tab', { name: '价格设置' }).click()
  await expect(page.getByRole('tab', { name: '价格设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('table', { name: '保洁价格规则' })).toContainText('深度保洁附加费')

  await page.getByRole('button', { name: '查看保洁任务' }).click()
  await expect(page).toHaveURL(/\/cleanManage\/cleanTask$/)
  await page.goto(appUrl('/cleanManage/cleanSetting'))
  await page.getByRole('button', { name: '查看保洁统计' }).click()
  await expect(page).toHaveURL(/\/cleanManage\/cleanStatistics$/)
})

test('/cleanManage/cleanSetting exposes empty and error envelopes as business feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/cleanManage/cleanSetting?mockState=empty'))
  await expect(page.getByRole('status', { name: '保洁设置操作反馈' })).toContainText('暂无符合条件的保洁设置')
  await expect(page.getByRole('table', { name: '保洁策略列表' })).toContainText('暂无保洁策略')
  await expect(page.getByRole('button', { name: '导出' })).toBeDisabled()

  await page.goto(appUrl('/cleanManage/cleanSetting?mockState=error'))
  await expect(page.getByRole('alert', { name: '保洁设置数据错误' })).toContainText('保洁设置加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await expect(page.locator('.clean-setting-page')).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)
})
