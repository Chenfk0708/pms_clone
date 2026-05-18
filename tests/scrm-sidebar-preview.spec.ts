import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/sidebarPreview renders chat-toolbar business data from provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '聊天工具栏' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '聊天工具栏' })).toBeVisible()
  await expect(page.getByLabel('聊天工具栏筛选')).toBeVisible()
  await expect(page.getByRole('region', { name: '聊天工具栏核心指标' })).toContainText('今日会话')
  await expect(page.getByRole('region', { name: '聊天工具栏会话列表' })).toContainText('携程民宿-【M335275070】')
  await expect(page.getByRole('region', { name: '聊天工具栏话术库' })).toContainText('续住引导')
  await expect(page.getByRole('region', { name: '聊天工具栏房态建议' })).toContainText('总裁套间')
  await expect(page.getByTestId('scrm-sidebar-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.scrm-sidebar-page')).not.toContainText(
    /mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/,
  )
})

test('/scrm/sidebarPreview supports filters refresh export details and route handoff', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview'))

  await page.getByLabel('会话日期').fill('2026-05-19')
  await page.getByLabel('门店').selectOption('qianhai')
  await page.getByLabel('渠道').selectOption('tujia')
  await page.getByLabel('关键词').fill('续住')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByRole('status', { name: '聊天工具栏操作反馈' })).toContainText('已按筛选条件更新')
  await expect(page.getByTestId('scrm-sidebar-service-contract')).toHaveAttribute('data-request-keyword', '续住')

  await page.getByRole('button', { name: '刷新' }).click()
  await expect(page.getByRole('status', { name: '聊天工具栏操作反馈' })).toContainText('数据已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '聊天工具栏操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '查看详情 携程民宿-【M335275070】' }).click()
  await expect(page.getByRole('dialog', { name: '会话详情' })).toContainText('历史订单')
  await page.getByRole('button', { name: '发送续住话术' }).click()
  await expect(page.getByRole('status', { name: '聊天工具栏操作反馈' })).toContainText('话术已发送')
  await page.getByRole('button', { name: '关闭会话详情' }).click()

  await page.getByRole('button', { name: '去订单' }).click()
  await expect(page).toHaveURL(/\/order\/house-order\/list$/)
})

test('/scrm/sidebarPreview covers empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview?mockState=empty'))

  await expect(page.getByRole('region', { name: '聊天工具栏空状态' })).toContainText('当前筛选条件下暂无会话')
  await expect(page.getByRole('button', { name: '重置筛选' })).toBeVisible()

  await page.goto(appUrl('/scrm/sidebarPreview?mockState=error'))
  await expect(page.getByRole('alert', { name: '聊天工具栏数据错误' })).toContainText('聊天工具栏数据加载失败')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert', { name: '聊天工具栏数据错误' })).toBeVisible()
})
