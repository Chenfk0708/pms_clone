import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/memberCenter/integrate renders member points from the page data service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/integrate'))

  await expect(page.locator('.sidebar-link[href="/scrm/memberCenter/integrate"]')).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '会员积分运营台' })).toBeVisible()
  await expect(page.getByText('今日发放积分')).toBeVisible()
  await expect(page.getByText('积分趋势')).toBeVisible()
  await expect(page.getByRole('table', { name: '会员积分变更记录' })).toBeVisible()
  await expect(page.getByRole('row', { name: /任清晨.*订单奖励/ })).toBeVisible()
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-state', 'success')
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-request', /"page":1/)

  const visibleText = await page.locator('body').innerText()
  expect(visibleText).not.toMatch(/mock|未接入|阻塞|后端未就绪|后端接口未完成/)
})

test('/scrm/memberCenter/integrate supports filters refresh export detail and route handoff', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/integrate'))
  await page.getByRole('button', { name: '收起', exact: true }).click()

  await page.getByLabel('会员搜索').fill('任清晨')
  await page.getByLabel('积分场景').selectOption('reward')
  await page.getByLabel('开始日期').fill('2026-05-01')
  await page.getByLabel('结束日期').fill('2026-05-18')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByRole('status')).toContainText('筛选条件已应用')
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-request', /"keyword":"任清晨"/)
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-request', /"scene":"reward"/)

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByRole('status')).toContainText('筛选条件已重置')
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-request', /"keyword":""/)
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-request', /"scene":"all"/)

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('数据已更新')
  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '查看今日发放积分详情' }).click()
  await expect(page.getByRole('dialog', { name: '今日发放积分详情' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '今日发放积分详情' })).toContainText('积分发放主要来自订单奖励')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByRole('button', { name: '查看流水详情 任清晨' }).click()
  await expect(page.getByRole('dialog', { name: '积分流水详情' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '积分流水详情' })).toContainText('订单奖励')
  await page.getByRole('button', { name: '关闭流水详情' }).click()

  const trendLegend = page.getByRole('group', { name: '趋势系列' })
  await trendLegend.getByRole('button', { name: '消耗', exact: true }).click()
  await expect(trendLegend.getByRole('button', { name: '消耗', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.member-points-bar').last().getByText('320')).toBeVisible()

  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.getByRole('status')).toContainText('已切换到第 2 页')
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-request', /"page":2/)
  await page.getByRole('button', { name: '上一页' }).click()
  await expect(page.getByRole('status')).toContainText('已切换到第 1 页')
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-request', /"page":1/)

  await page.getByRole('link', { name: '待结算积分 7' }).click()
  await expect(page).toHaveURL(/\/order\/house-order\/list$/)
  await page.goto(appUrl('/scrm/memberCenter/integrate'))
  await page.getByRole('link', { name: '查看会员等级' }).click()
  await expect(page).toHaveURL(/\/scrm\/memberCenter\/level$/)
})

test('/scrm/memberCenter/integrate exposes empty and error envelopes as business feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/scrm/memberCenter/integrate?mockState=empty'))
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByText('当前筛选条件下暂无积分流水')).toBeVisible()
  await expect(page.getByRole('table', { name: '会员积分变更记录' })).toBeVisible()

  await page.goto(appUrl('/scrm/memberCenter/integrate?mockState=error'))
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert')).toContainText('会员积分数据加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('/scrm/memberCenter/integrate covers remaining visible business controls and survives reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/integrate'))
  await page.getByRole('button', { name: '收起', exact: true }).click()

  const metricDialogs = [
    '查看今日发放积分详情',
    '查看今日消耗积分详情',
    '查看净增长积分详情',
    '查看积分活跃会员详情',
  ]

  for (const triggerName of metricDialogs) {
    await page.getByRole('button', { name: triggerName }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: '关闭详情' }).click()
  }

  const recordDetailButtons = page.getByRole('button', { name: /查看流水详情/ })
  const detailCount = await recordDetailButtons.count()
  for (let index = 0; index < detailCount; index += 1) {
    await recordDetailButtons.nth(index).click()
    await expect(page.getByRole('dialog', { name: '积分流水详情' })).toBeVisible()
    await page.getByRole('button', { name: '关闭流水详情' }).click()
  }

  const routeChecks = [
    { name: '即将到期积分 18', url: /\/customer\/list$/ },
    { name: '待结算积分 7', url: /\/order\/house-order\/list$/ },
    { name: '权益兑换待确认 3', url: /\/scrm\/memberCenter\/equity$/ },
    { name: '查看会员等级', url: /\/scrm\/memberCenter\/level$/ },
    { name: '查看会员权益', url: /\/scrm\/memberCenter\/equity$/ },
    { name: '客户列表', url: /\/customer\/list$/ },
    { name: '优惠券', url: /\/mallManagement\/couponMgt$/ },
  ]

  for (const routeCheck of routeChecks) {
    await page.goto(appUrl('/scrm/memberCenter/integrate'))
    await page.getByRole('button', { name: '收起', exact: true }).click()
    await page.getByRole('link', { name: routeCheck.name }).click()
    await expect(page).toHaveURL(routeCheck.url)
  }

  await page.goto(appUrl('/scrm/memberCenter/integrate'))
  await page.getByRole('button', { name: '收起', exact: true }).click()
  await page.getByLabel('会员搜索').fill('任清晨')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-request', /"keyword":"任清晨"/)
  await page.reload()
  await expect(page.getByRole('heading', { name: '会员积分运营台' })).toBeVisible()
  await expect(page.locator('#member-points-diagnostics')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByRole('table', { name: '会员积分变更记录' })).toBeVisible()
})
