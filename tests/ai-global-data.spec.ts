import { expect, test, type Page } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|待接入|阻塞|后端未就绪|后端接口未完成/i

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function collapseChatDock(page: Page) {
  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').last()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }
}

async function openAiGlobalData(page: Page, mode: 'success' | 'empty' | 'error' = 'success') {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript((mockMode) => {
    window.localStorage.setItem('pms_token', 'ai-global-data-mock-token')
    window.localStorage.setItem('pmsCampId', '1796067693589061634')
    window.localStorage.setItem('pms.aiGlobalDataProvider', 'mock')
    window.localStorage.setItem('pms.aiGlobalDataMockState', mockMode)
    window.localStorage.setItem('pms.applicationPaymentProvider', 'mock')
  }, mode)
  await page.goto(appUrl('/#/channels/globalRadar/globalData'))
  await collapseChatDock(page)
}

function feedbackBar(page: Page) {
  return page.locator('.ai-global-data-feedback[role="status"]')
}

function topNavGlobalRadar(page: Page) {
  return page.locator('a.topnav-link[href$="/channels/globalRadar/globalData"]')
}

function sideNavGlobalData(page: Page) {
  return page.locator('a.sidebar-link[href$="/channels/globalRadar/globalData"]')
}

function sideNavGlobalSetting(page: Page) {
  return page.locator('a.sidebar-link[href$="/channels/globalRadar/globalSetting"]')
}

async function fulfillHudson(route: import('@playwright/test').Route, data: unknown) {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, success: true, message: 'success', data, traceId: 'ai-global-real-test-trace' }),
  })
}


function filterCamp(page: Page) {
  return page.locator('#ai-global-data-filter-camp')
}

function filterChannel(page: Page) {
  return page.locator('#ai-global-data-filter-channel')
}

function filterAttention(page: Page) {
  return page.locator('#ai-global-data-filter-attention')
}

function filterRoomKeyword(page: Page) {
  return page.locator('#ai-global-data-filter-room-keyword')
}

test('/channels/globalRadar/globalData loads through explicit global radar providers', async ({ page }) => {
  await openAiGlobalData(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(topNavGlobalRadar(page)).toHaveClass(/is-active/)
  await expect(sideNavGlobalData(page)).toHaveClass(/is-active/)
  await expect(sideNavGlobalSetting(page)).toBeVisible()

  await expect(page.locator('.ai-global-data-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.ai-global-data-page')).toHaveAttribute('data-response-state', 'success')
  await expect(page.locator('.ai-global-data-page')).toHaveAttribute('data-request-channel', 'all')
  await expect(page.locator('.ai-global-data-hero h1')).toHaveText('全域数据')

  await expect(page.getByTestId('ai-global-data-contract')).toContainText('/order/report/get')
  await expect(page.getByTestId('ai-global-data-contract')).toContainText('mock-ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju-dashboard-001')

  await expect(page.locator('.ai-global-data-summary-card')).toHaveCount(6)
  await expect(page.locator('[aria-label="强提醒列表"]')).toContainText('待处理提醒')
  await expect(page.locator('[aria-label="房型经营看板"]')).toContainText('房型')
  await expect(page.locator('.ai-global-data-quick-links button')).toHaveCount(4)
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})

test('/channels/globalRadar/globalData supports filter, feedback, detail and route interactions', async ({ page }) => {
  await openAiGlobalData(page)

  await filterCamp(page).selectOption('camp-haizhu')
  await filterChannel(page).selectOption('meituan')
  await filterAttention(page).selectOption('high')
  await filterRoomKeyword(page).fill('大床')
  await page.locator('.ai-global-data-filters__actions button').first().click()

  await expect(feedbackBar(page)).toContainText('已按当前条件刷新全域数据')
  await expect(page.locator('.ai-global-data-page')).toHaveAttribute('data-request-camp', 'camp-haizhu')
  await expect(page.locator('.ai-global-data-page')).toHaveAttribute('data-request-channel', 'meituan')
  await expect(page.locator('.ai-global-data-page')).toHaveAttribute('data-request-attention', 'high')
  await expect(page.locator('.ai-global-data-page')).toHaveAttribute('data-request-room-keyword', '大床')

  await page.locator('.ai-global-data-summary-card').first().click()
  await expect(page.locator('.ai-global-data-modal[aria-label="指标详情"]')).toContainText('指标口径')
  await page.locator('.ai-global-data-modal[aria-label="指标详情"] button[aria-label="关闭指标详情"]').click()

  await page.locator('[aria-label="强提醒列表"] .ai-global-data-reminder').first().locator('button').nth(1).click()
  await expect(feedbackBar(page)).toContainText('已延后提醒并保留在今日待办')

  await page.locator('[aria-label="房型经营看板"] .ai-global-data-table__row').first().locator('button').nth(1).click()
  await expect(page.locator('.ai-global-data-modal[aria-label="房型经营详情"]')).toContainText('渠道价格')
  await page.locator('.ai-global-data-modal[aria-label="房型经营详情"] button[aria-label="关闭房型经营详情"]').click()

  await page.getByTestId('ai-global-data-refresh').click()
  await expect(feedbackBar(page)).toContainText('全域数据已刷新')

  await page.getByTestId('ai-global-data-export').click()
  await expect(feedbackBar(page)).toContainText('全域数据导出任务已创建')

  await page.locator('.ai-global-data-quick-links button').first().click()
  await expect(page).toHaveURL(/\/houseManage\/months$/)
})

test('/channels/globalRadar/globalData handles empty and error states', async ({ browser }) => {
  const emptyPage = await browser.newPage()
  await openAiGlobalData(emptyPage, 'empty')
  await expect(emptyPage.locator('.ai-global-data-empty')).toContainText('当前筛选条件下暂无经营数据')
  await expect(emptyPage.locator('.ai-global-data-quick-links button')).toHaveCount(4)
  await expect(emptyPage.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  const errorPage = await browser.newPage()
  await openAiGlobalData(errorPage, 'error')
  await expect(errorPage.locator('.ai-global-data-error[role="alert"]')).toContainText('全域数据加载失败')
  await errorPage.evaluate(() => window.localStorage.setItem('pms.aiGlobalDataMockState', 'success'))
  await errorPage.locator('.ai-global-data-error button').click()
  await expect(feedbackBar(errorPage)).toContainText('全域数据已刷新')
})

test('/channels/globalRadar/globalData preserves the subscription route', async ({ page }) => {
  await openAiGlobalData(page)

  await page.getByTestId('ai-global-data-open-subscription').click()

  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail\?app=globalRadar$/)
  await expect(page.getByRole('heading', { name: '全域雷达', level: 1 })).toBeVisible()
  await expect(page.getByText('商品详情')).toBeVisible()
  await expect(page.locator('button').filter({ hasText: '立即购买' })).toBeVisible()
})


test('/channels/globalRadar/globalData api provider posts export and reminder actions to real backend contracts', async ({ page }) => {
  const exportRequests: Array<Record<string, unknown>> = []
  const postponeRequests: Array<Record<string, unknown>> = []
  const resolveRequests: Array<Record<string, unknown>> = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'ai-global-api-action-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.aiGlobalDataProvider', 'api')
  })

  await page.route('**/api/order/report/get', async (route) =>
    fulfillHudson(route, {
      todayNewOrder: 2,
      todayCheckIn: 1,
      todayCheckOut: 1,
      staying: 3,
      pending: 1,
      exception: 0,
      refunding: 0,
      tomorrowCheckIn: 1,
      tomorrowCheckOut: 1,
    }),
  )
  await page.route('**/api/orders/strongReminder/page/get', async (route) =>
    fulfillHudson(route, {
      list: [
        {
          id: '88001',
          campId: '10001',
          level: 'high',
          title: '?????',
          guestName: '????',
          roomName: '????',
          orderNo: 'OUT-AI-88001',
          dueAt: '18:30',
          channel: 'ctrip',
          status: 'pending',
          primaryAction: 'order',
          summary: '??????',
        },
      ],
      pagination: { pageNum: 1, pageSize: 10, total: 1 },
    }),
  )
  await page.route('**/api/select/poi/page/get', async (route) =>
    fulfillHudson(route, { list: [{ poiId: '10001', poiName: '????' }], pagination: { total: 1 } }),
  )
  await page.route('**/api/roomCategories/page/get', async (route) =>
    fulfillHudson(route, { list: [], pagination: { pageNum: 1, pageSize: 999, total: 0 } }),
  )
  await page.route('**/api/radarConfig/shop/get', async (route) =>
    fulfillHudson(route, [
      {
        id: '10001',
        campId: '10001',
        name: '????',
        connectorStatus: 'online',
        radarStatus: 'running',
        authorizedChannels: ['????'],
        updatedAt: '2026-06-04 02:20',
      },
    ]),
  )
  await page.route('**/api/edition/resource/get', async (route) =>
    fulfillHudson(route, {
      editionName: '????',
      resourceName: '?????????',
      priceText: '?1,908.48 / ?',
      connectorProgress: '1 / 1 ????????',
    }),
  )
  await page.route('**/api/paymentTypes/get/v2', async (route) =>
    fulfillHudson(route, { paymentGroups: [{ name: '??', paymentTypes: [{ name: '????' }] }] }),
  )
  await page.route('**/api/globalRadar/export/create', async (route) => {
    exportRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await fulfillHudson(route, {
      taskId: 'AI-GLOBAL-EXPORT-REAL-001',
      fileName: 'ai-global.csv',
      contentType: 'text/csv;charset=UTF-8',
      downloadUrl: '/api/globalRadar/export/download?campId=10001',
      total: 1,
    })
  })
  await page.route('**/api/globalRadar/strongReminder/postpone', async (route) => {
    postponeRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await fulfillHudson(route, {
      reminderId: '88001',
      orderNo: 'OUT-AI-88001',
      status: 'postponed',
      message: 'strong reminder postponed',
    })
  })
  await page.route('**/api/globalRadar/strongReminder/resolve', async (route) => {
    resolveRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await fulfillHudson(route, {
      reminderId: '88001',
      orderNo: 'OUT-AI-88001',
      status: 'resolved',
      message: 'strong reminder resolved',
    })
  })

  await page.goto(appUrl('/#/channels/globalRadar/globalData?aiGlobalDataProvider=api'))
  await expect(page.locator('.ai-global-data-page')).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(page.locator('.ai-global-data-reminder')).toContainText('OUT-AI-88001')

  await page.getByTestId('ai-global-data-export').click()
  await expect.poll(() => exportRequests.length).toBe(1)
  expect(exportRequests[0]).toMatchObject({ campId: '1796067693589061634', channel: 'all', attention: 'all' })
  await expect(feedbackBar(page)).toContainText('AI-GLOBAL-EXPORT-REAL-001')

  const reminderButtons = page.locator('.ai-global-data-reminder').first().locator('.ai-global-data-reminder__actions button')
  await reminderButtons.nth(1).click()
  await expect.poll(() => postponeRequests.length).toBe(1)
  expect(postponeRequests[0]).toMatchObject({ campId: '1796067693589061634', reminderId: '88001', orderNo: 'OUT-AI-88001' })

  await reminderButtons.nth(2).click()
  await expect.poll(() => resolveRequests.length).toBe(1)
  expect(resolveRequests[0]).toMatchObject({ campId: '1796067693589061634', reminderId: '88001', orderNo: 'OUT-AI-88001' })
})
