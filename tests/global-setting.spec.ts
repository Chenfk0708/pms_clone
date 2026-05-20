import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openGlobalSetting(
  page: import('@playwright/test').Page,
  mode: 'success' | 'empty' | 'error' = 'success',
  latencyMs = 0,
) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(
    ({ mockMode, mockLatencyMs }) => {
      window.localStorage.setItem('pms.globalSettingProvider', 'mock')
      window.localStorage.setItem('pms.globalSettingMockMode', mockMode)
      window.localStorage.setItem('pms.globalSettingMockLatencyMs', String(mockLatencyMs))
    },
    { mockMode: mode, mockLatencyMs: latencyMs },
  )
  await page.goto(appUrl('/channels/globalRadar/globalSetting'))
  await collapseChatDock(page)
}

async function collapseChatDock(page: import('@playwright/test').Page) {
  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }
}

function statusBar(page: import('@playwright/test').Page) {
  return page.locator('[role="status"][aria-label="配置中心操作反馈"]')
}

test('/channels/globalRadar/globalSetting loads monitor-store data from the unified service layer', async ({ page }) => {
  await openGlobalSetting(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByTestId('global-setting-contract')).toBeHidden()
  await expect(page.locator('.global-setting-toolbar h1')).toHaveText('配置中心')
  await expect(page.locator('.global-setting-toolbar p')).toContainText('AI全域雷达')
  await expect(page.getByRole('heading', { name: '监控门店管理' })).toBeVisible()
  await expect(page.getByRole('link', { name: '配置中心' })).toHaveClass(/is-active/)
  await expect(page.locator('select[aria-label="授权状态"]')).toHaveValue('all')
  await expect(page.locator('input[aria-label="关键词"]')).toHaveValue('')
  await expect(page.getByTestId('global-setting-contract')).toContainText('"traceId":"mock-ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin-overview-001"')
  await expect(page.getByTestId('global-setting-contract')).toContainText('"/radarConfig/shop/get"')
  await expect(page.locator('.global-setting-summary article')).toHaveCount(4)
  await expect(page.locator('.global-setting-table tbody tr')).toHaveCount(2)
  await expect(page.getByRole('button', { name: '下载数据连接器' })).toBeVisible()
  await expect(page.getByRole('button', { name: '选择监控门店' })).toBeVisible()
  await expect(page.locator('.global-setting-quick-links button')).toHaveCount(4)

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)
})

test('/channels/globalRadar/globalSetting supports filter, selection, configuration and route interactions', async ({ page }) => {
  await openGlobalSetting(page)

  await page.locator('select[aria-label="授权状态"]').selectOption('authorized')
  await page.locator('input[aria-label="关键词"]').fill('UP智谷')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(statusBar(page)).toContainText('已按当前条件更新配置中心')
  await expect(page.getByTestId('global-setting-contract')).toContainText('"keyword":"UP智谷"')
  await expect(page.getByTestId('global-setting-contract')).toContainText('"authorizationStatus":"authorized"')

  await page.getByRole('button', { name: '刷新' }).click()
  await expect(statusBar(page)).toContainText('配置中心数据已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(statusBar(page)).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '下载数据连接器' }).click()
  await expect(page.locator('[role="dialog"][aria-label="下载数据连接器"]')).toContainText('步骤一')
  await page.locator('[role="dialog"][aria-label="下载数据连接器"] button').filter({ hasText: '确认下载' }).click()
  await expect(statusBar(page)).toContainText('数据连接器下载任务已启动')

  await page.getByRole('button', { name: '选择监控门店' }).click()
  await expect(page.locator('[role="dialog"][aria-label="选择监控门店"]')).toContainText('最多可选择 3 个监控门店')
  await page.locator('[role="dialog"][aria-label="选择监控门店"] input[type="checkbox"]').nth(2).check()
  await page.locator('[role="dialog"][aria-label="选择监控门店"] button').filter({ hasText: '确认' }).click()
  await expect(statusBar(page)).toContainText('监控门店已更新')
  await expect(page.locator('.global-setting-summary')).toContainText('3 / 3')

  await page.locator('.global-setting-table tbody tr').first().getByRole('button', { name: '配置' }).click()
  await expect(page.locator('[role="dialog"][aria-label="Ebooking授权配置"]')).toContainText('携程酒店')
  await page.locator('[role="dialog"][aria-label="Ebooking授权配置"] input[aria-label="美团酒店用户名"]').fill('meituan-up')
  await page.locator('[role="dialog"][aria-label="Ebooking授权配置"] input[aria-label="美团酒店密码"]').fill('safe-pass-01')
  await page.locator('[role="dialog"][aria-label="Ebooking授权配置"] button').filter({ hasText: '保存配置' }).click()
  await expect(statusBar(page)).toContainText('Ebooking授权配置已保存')

  await page.locator('.global-setting-quick-links button').filter({ hasText: '门店信息' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/edit$/)
})

test('/channels/globalRadar/globalSetting covers remaining page-level buttons, modal exits and route handoffs', async ({ page }) => {
  await openGlobalSetting(page)

  await page.locator('select[aria-label="授权状态"]').selectOption('authorized')
  await page.locator('input[aria-label="关键词"]').fill('UP智谷')
  await page.getByRole('button', { name: '重置' }).click()
  await expect(statusBar(page)).toContainText('筛选条件已重置')
  await expect(page.locator('select[aria-label="授权状态"]')).toHaveValue('all')
  await expect(page.locator('input[aria-label="关键词"]')).toHaveValue('')

  await page.getByRole('button', { name: '下载数据连接器' }).click()
  await page.getByRole('button', { name: '取消' }).click()
  await expect(page.locator('[role="dialog"][aria-label="下载数据连接器"]')).toBeHidden()

  await page.getByRole('button', { name: '选择监控门店' }).click()
  await page.locator('[role="dialog"][aria-label="选择监控门店"]').getByRole('button', { name: '门店信息' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/edit$/)

  await page.goto(appUrl('/channels/globalRadar/globalSetting'))
  await collapseChatDock(page)

  await page.getByRole('button', { name: '选择监控门店' }).click()
  await page.locator('[role="dialog"][aria-label="选择监控门店"] button[aria-label="关闭选择监控门店"]').click()
  await expect(page.locator('[role="dialog"][aria-label="选择监控门店"]')).toBeHidden()

  await page.locator('.global-setting-table tbody tr').first().getByRole('button', { name: '查看日志' }).click()
  await expect(page).toHaveURL(/\/channels\/globalRadar\/globalData$/)

  await page.goto(appUrl('/channels/globalRadar/globalSetting'))
  await collapseChatDock(page)

  await page.locator('.global-setting-todo-list button').filter({ hasText: '处理连接器延迟' }).click()
  await expect(statusBar(page)).toContainText('已加入今日处理队列')

  await page.locator('.global-setting-todo-list button').filter({ hasText: '补齐美团酒店授权' }).click()
  await expect(page.locator('[role="dialog"][aria-label="Ebooking授权配置"]')).toBeVisible()
  await page.locator('[role="dialog"][aria-label="Ebooking授权配置"] button[aria-label="关闭Ebooking授权配置"]').click()
  await expect(page.locator('[role="dialog"][aria-label="Ebooking授权配置"]')).toBeHidden()

  await page.locator('.global-setting-todo-list button').filter({ hasText: '补录新监控门店' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/edit$/)

  await page.goto(appUrl('/channels/globalRadar/globalSetting'))
  await collapseChatDock(page)

  await page.locator('.global-setting-quick-links button').filter({ hasText: '全域数据' }).click()
  await expect(page).toHaveURL(/\/channels\/globalRadar\/globalData$/)

  await page.goto(appUrl('/channels/globalRadar/globalSetting'))
  await collapseChatDock(page)
  await page.locator('.global-setting-quick-links button').filter({ hasText: '房态' }).click()
  await expect(page).toHaveURL(/\/houseManage\/months$/)

  await page.goto(appUrl('/channels/globalRadar/globalSetting'))
  await collapseChatDock(page)
  await page.locator('.global-setting-quick-links button').filter({ hasText: '报表' }).click()
  await expect(page).toHaveURL(/\/statistics\/report$/)

  await page.goto(appUrl('/channels/globalRadar/globalSetting'))
  await collapseChatDock(page)

  await page.locator('.global-setting-table tbody tr').nth(1).getByRole('button', { name: '移除' }).click()
  await expect(page.locator('[role="dialog"][aria-label="移除监控门店"]')).toContainText('移除后')
  await page.locator('[role="dialog"][aria-label="移除监控门店"] button').filter({ hasText: '取消' }).click()
  await expect(page.locator('.global-setting-table tbody tr')).toHaveCount(2)

  await page.locator('.global-setting-table tbody tr').nth(1).getByRole('button', { name: '移除' }).click()
  await page.locator('[role="dialog"][aria-label="移除监控门店"] button').filter({ hasText: '确认移除' }).click()
  await expect(statusBar(page)).toContainText('监控门店已移除')
  await expect(page.locator('.global-setting-table tbody tr')).toHaveCount(1)
})

test('/channels/globalRadar/globalSetting shows loading feedback and disables key actions during mock loading', async ({ page }) => {
  await openGlobalSetting(page, 'success', 1200)

  await expect(statusBar(page)).toContainText('配置中心数据加载中')
  await expect(page.getByRole('button', { name: '刷新' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '导出' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '选择监控门店' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '查询' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '重置' })).toBeDisabled()

  await expect(page.locator('.global-setting-summary article')).toHaveCount(4)
  await expect(statusBar(page)).toContainText('配置中心数据已更新')
})

test('/channels/globalRadar/globalSetting handles empty and error responses', async ({ browser }) => {
  const emptyPage = await browser.newPage()
  await openGlobalSetting(emptyPage, 'empty')
  await expect(emptyPage.locator('[role="status"][aria-label="配置中心空态"]')).toContainText('暂无已启用的监控门店')
  await expect(emptyPage.getByRole('button', { name: '选择监控门店' })).toBeVisible()

  const errorPage = await browser.newPage()
  await openGlobalSetting(errorPage, 'error')
  await expect(errorPage.locator('[role="alert"]')).toContainText('配置中心数据加载失败')
  await errorPage.evaluate(() => window.localStorage.setItem('pms.globalSettingMockMode', 'success'))
  await errorPage.getByRole('button', { name: '重新加载' }).click()
  await expect(statusBar(errorPage)).toContainText('配置中心数据已刷新')
})
