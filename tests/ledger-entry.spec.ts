import { expect, test, type Page, type Route } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  const hashPath = path.startsWith('/#') ? path : `/#${path}`
  return baseURL ? `${baseURL}${hashPath}` : hashPath
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'ledger-entry-test-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.currentCampId', '10001')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '1',
        username: 'root',
        name: 'root',
        mobile: '13800000001',
        roleName: 'admin',
        campId: '10001',
        campName: '10001',
      }),
    )
  })
  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        success: true,
        data: {
          total: 1,
          size: 100,
          current: 1,
          extraInfo: null,
          pageNum: 1,
          hasNextPage: false,
          pages: 1,
          list: [{ poiId: '1796067693589061634', poiName: '天落会宿公寓(前海壹方城宝安中心店)' }],
        },
      }),
    })
  })
})

async function mockLedgerEntryApi(page: Page) {
  const requests: Array<{ path: string; body: Record<string, unknown> }> = []

  const fulfill = async (route: Route, data: unknown) => {
    requests.push({
      path: new URL(route.request().url()).pathname.replace('/api', ''),
      body: (route.request().postDataJSON() ?? {}) as Record<string, unknown>,
    })
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'success', success: true, data, traceId: `trace-${requests.length}` }),
    })
  }

  await page.route('**/api/select/poi/page/get', async (route) =>
    fulfill(route, {
      total: 1,
      size: 100,
      current: 1,
      extraInfo: null,
      pageNum: 1,
      hasNextPage: false,
      pages: 1,
      list: [{ poiId: '62010', poiName: 'API Ledger Store' }],
    }),
  )
  await page.route('**/api/roomCategories/page/get', async (route) =>
    fulfill(route, {
      total: 1,
      size: 100,
      current: 1,
      extraInfo: null,
      pageNum: 1,
      hasNextPage: false,
      pages: 1,
      list: [{ roomCategoryId: '62021', name: 'API Ledger Room' }],
    }),
  )
  await page.route('**/api/paymentWays/get', async (route) =>
    fulfill(route, {
      paymentWays: [{ paymentWayId: '62011', paymentWayName: 'API Ledger Pay' }],
    }),
  )
  await page.route('**/api/rooms/get', async (route) =>
    fulfill(route, {
      roomCategoryRooms: [
        {
          roomCategoryId: '62021',
          roomCategoryName: 'API Ledger Room',
          rooms: [{ roomId: '62022', roomName: '620A' }],
        },
      ],
    }),
  )
  await page.route('**/api/orderLedger/dashboard/get', async (route) =>
    fulfill(route, {
      costPricePages: {
        total: 1,
        size: 10,
        current: 1,
        extraInfo: null,
        pageNum: 1,
        hasNextPage: false,
        pages: 1,
        list: [
          {
            id: '62031',
            accountName: 'API Ledger Income',
            isIncome: 1,
            typeName: '??',
            amount: 188,
            paymentWayName: 'API Ledger Pay',
            roomCategoryName: 'API Ledger Room',
            roomName: '620A',
            note: 'api ledger note',
            operatorName: 'API Operator',
            channelName: 'API Channel',
            gmtCreate: '2026-05-20 10:15:00',
          },
        ],
      },
      income: 188,
      expend: 0,
      netIncome: 188,
    }),
  )

  return requests
}

test('/statistics/ledger renders ledger data from the page service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/ledger?provider=mock'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '记一笔明细' })).toHaveClass(/is-active/)
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-state', 'success')
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"type":"all"/)

  const filters = page.getByLabel('记一笔明细筛选')
  await expect(filters).toContainText('全部门店')
  await page.locator('.order-ledger-store-row .month-store-select__trigger').click()
  await expect(page.locator('.order-ledger-store-row .month-store-select__options')).toContainText(
    '天落会宿公寓(前海壹方城宝安中心店)',
  )
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '本月' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '开始日期' })).toContainText('2026-05-01')
  await expect(page.getByRole('button', { name: '结束日期' })).toContainText('2026-05-31')
  await expect(page.getByRole('button', { name: '类型 全部类型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型 请选择房型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置筛选' })).toBeVisible()
  await expect(page.getByRole('button', { name: '报表导出' })).toBeVisible()

  const summary = page.getByLabel('账本概括')
  await expect(summary).toContainText('收入(元)')
  await expect(summary).toContainText('支出 (元)')
  await expect(summary).toContainText('净收入：¥ 2072.00')
  const summaryTitleBoxes = await summary.locator('.order-ledger-summary-grid article span').evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }),
  )
  expect(summaryTitleBoxes.every((box) => box.width >= 64 && box.height <= 36)).toBe(true)
  await expect(page.getByRole('button', { name: '查看收入(元)详情' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查看支出 (元)详情' })).toBeVisible()

  const table = page.getByLabel('账本明细表格')
  await expect(table).toContainText('订单房费入账')
  await expect(table).toContainText('保洁服务采购')
  await expect(table).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(table).toContainText('微信支付')
  await expect(table).toContainText('系统自动入账')

  const visibleText = await page.locator('body').innerText()
  expect(visibleText).not.toMatch(/mock 数据|未接入|阻塞|后端未就绪|后端接口未完成/)
})

test('/statistics/ledger supports filters, date selection, export and detail feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/ledger?provider=mock'))

  await page.getByRole('button', { name: '类型 全部类型' }).click()
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('全部类型')
  await page.getByRole('option', { name: '支出' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"type":"expense"/)
  await expect(page.getByRole('status')).toContainText('已更新类型筛选')

  await page.getByRole('button', { name: '房型 请选择房型' }).click()
  await expect(page.getByRole('listbox', { name: '房型选项' })).toContainText('观影大床房')
  await page.getByRole('option', { name: '顶层套房（浴缸巨幕电竞麻将）' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /1796425098965729282/)

  await page.getByRole('button', { name: '开始日期' }).click()
  const dateDialog = page.getByRole('dialog', { name: '日期选择' })
  await expect(dateDialog).toContainText('2026年5月')
  await page.getByRole('button', { name: '选择 2026-05-16' }).click()
  await page.getByRole('button', { name: '选择 2026-05-18' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"startDate":"2026-05-16"/)
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"endDate":"2026-05-18"/)

  await page.getByRole('button', { name: '门店设置' }).click()
  await expect(page.getByRole('dialog', { name: '门店设置' })).toContainText('前往收支明细')
  await page.getByRole('button', { name: '关闭门店设置' }).click()

  await page.getByRole('button', { name: '查看收入(元)详情' }).click()
  await expect(page.getByRole('dialog', { name: '收入(元)详情' })).toContainText('账本分页接口')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByRole('button', { name: /查看明细 ledger-/ }).first().click()
  await expect(page.getByRole('dialog', { name: '账本明细详情' })).toContainText('支付方式')
  await page.getByRole('button', { name: '关闭明细详情' }).click()

  await page.getByRole('button', { name: '报表导出' }).click()
  await expect(page.getByRole('status')).toContainText('已生成记一笔明细导出任务')

  await page.getByRole('button', { name: '重置筛选' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"type":"all"/)
  await expect(page.getByRole('button', { name: '房型 请选择房型' })).toBeVisible()
})

test('/statistics/ledger exposes empty and error states as business feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/statistics/ledger?provider=mock&mockState=empty'))
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByLabel('账本明细表格')).toContainText('暂无数据')
  await expect(page.getByLabel('账本概括')).toContainText('净收入：¥ 0.00')

  await page.goto(appUrl('/statistics/ledger?provider=mock&mockState=error'))
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert')).toContainText('记一笔明细数据加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('/statistics/ledger coordinates route handoff and survives reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/ledger?provider=mock'))

  await page.getByRole('button', { name: '查看收入(元)详情' }).click()
  await page.getByRole('link', { name: '查看收支明细' }).click()
  await expect(page).toHaveURL(/\/statistics\/orderLedger$/)

  await page.goto(appUrl('/statistics/ledger?provider=mock'))
  await page.getByRole('button', { name: '门店设置' }).click()
  await page.getByRole('link', { name: '前往收支汇总' }).click()
  await expect(page).toHaveURL(/\/statistics\/totalLedger$/)

  await page.goto(appUrl('/statistics/ledger?provider=mock'))
  await page.getByRole('button', { name: '类型 全部类型' }).click()
  await page.getByRole('option', { name: '收入' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"type":"income"/)
  await page.reload()
  await expect(page.getByRole('button', { name: '类型 全部类型' })).toBeVisible()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-provider', 'mock')
})


test('/statistics/ledger defaults to api provider and calls local gateway endpoints', async ({ page }) => {
  const requests = await mockLedgerEntryApi(page)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/ledger'))

  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-provider', 'api')
  const table = page.locator('.ledger-entry-table-section')
  await expect(table).toContainText('API Ledger Income')
  await expect(table).toContainText('API Ledger Pay')
  await page.locator('.order-ledger-select-field').nth(1).getByRole('button').click()
  await expect(page.locator('.order-ledger-options')).toContainText('API Ledger Room')
  await expect.poll(() => requests.length).toBe(5)
  expect(requests.map((request) => request.path).sort()).toEqual([
    '/orderLedger/dashboard/get',
    '/paymentWays/get',
    '/roomCategories/page/get',
    '/rooms/get',
    '/select/poi/page/get',
  ])
  expect(requests.every((request) => request.body.campId === '10001')).toBe(true)
  const dashboardRequest = requests.find((request) => request.path === '/orderLedger/dashboard/get')?.body
  expect(dashboardRequest).toMatchObject({
    campId: '10001',
    pageNum: 1,
    pageSize: 10,
    beginTime: '2026-05-01 00:00:00',
    endTime: '2026-05-31 23:59:59',
  })
})
