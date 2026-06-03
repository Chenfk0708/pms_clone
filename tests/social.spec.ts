import { expect, test } from '@playwright/test'

const forbiddenBodyTerms = ['mock 数据', 'mock provider', '未接入', '阻塞', '后端未就绪', '后端接口未完成']

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/channels/social')
})

test('/channels/social uses business data service without development copy', async ({ page }) => {
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '社媒', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '社媒渠道运营' })).toBeVisible()
  await expect(page.getByTestId('social-channel-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('social-channel-page')).toHaveAttribute(
    'data-trace-id',
    'mock-ota--shemei--shemei-overview-001',
  )

  const bodyText = await page.locator('body').innerText()
  for (const term of forbiddenBodyTerms) {
    expect(bodyText).not.toContain(term)
  }

  await expect(page.getByRole('article', { name: /抖音来客/ })).toContainText('关联房型2/4')
  await expect(page.getByRole('article', { name: /小红书/ }).getByRole('button', { name: '订阅开通' })).toBeVisible()
  await expect(page.getByRole('table', { name: '社媒账号管理列表' })).toContainText('7370207731854149643')
  await expect(page.getByRole('region', { name: '社媒运营趋势' })).toContainText('抖音来客')
})

test('/channels/social filter, refresh and visible actions provide feedback', async ({ page }) => {
  await page.getByLabel('运营日期').fill('2026-05-17')
  await page.getByLabel('门店').selectOption('camp-qianhai')
  await page.getByLabel('渠道状态').selectOption('connected')
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.getByRole('status')).toContainText('已按当前条件更新')
  await expect(page.getByTestId('social-channel-page')).toHaveAttribute('data-request-body', /2026-05-17/)
  await expect(page.getByTestId('social-channel-page')).toHaveAttribute('data-request-body', /camp-qianhai/)

  await page.getByTestId('social-channel-page').getByRole('button', { name: '刷新' }).click()
  await expect(page.getByRole('status')).toContainText('社媒数据已刷新')

  await page.getByTestId('social-channel-page').getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '更多' }).click()
  await expect(page.getByRole('dialog', { name: '更多操作' })).toBeVisible()
  await page.getByRole('button', { name: '关闭更多操作' }).click()

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByRole('status')).toContainText('筛选条件已重置')
})

test('/channels/social card, subscription and table detail interactions are handled', async ({ page }) => {
  await page.getByRole('article', { name: /抖音来客/ }).click()
  await expect(page.getByRole('dialog', { name: '抖音来客渠道详情' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '抖音来客渠道详情' })).toContainText('日历房')
  await page.getByLabel('关闭详情').click()

  await page.getByRole('article', { name: /小红书/ }).getByRole('button', { name: '订阅开通' }).click()
  await expect(page.getByRole('dialog', { name: '小红书订阅方案' })).toBeVisible()
  await page.getByRole('button', { name: '确认订阅' }).click()
  await expect(page.getByRole('status')).toContainText('订阅开通申请已提交')

  await page.getByRole('button', { name: '查看详情' }).first().click()
  await expect(page.getByRole('dialog', { name: '抖音来客渠道详情' })).toBeVisible()
  await page.getByLabel('关闭详情').click()

  await page.getByRole('button', { name: '拉取房型' }).first().click()
  await expect(page.getByRole('status')).toContainText('房型同步任务已提交')

  await page.getByRole('button', { name: '房价管理' }).click()
  await expect(page).toHaveURL(/\/houseManage\/houseCale$/)
})

test('/channels/social supports empty and error response states', async ({ page }) => {
  await page.evaluate(() => window.localStorage.setItem('pms.socialMockMode', 'empty'))
  await page.goto('/#/channels/social')
  await expect(page.getByText('暂无符合当前筛选条件的社媒渠道')).toBeVisible()

  await page.evaluate(() => window.localStorage.setItem('pms.socialMockMode', 'error'))
  await page.goto('/#/channels/social')
  await expect(page.getByRole('alert')).toContainText('社媒数据加载失败')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.getByRole('alert')).toContainText('社媒数据加载失败')
  await page.evaluate(() => window.localStorage.removeItem('pms.socialMockMode'))
})

test('/channels/social real provider sends gateway auth header and adapts social overview response', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('pms_token', 'social-token')
    window.localStorage.setItem('pms.socialProvider', 'real')
  })

  const capturedRequests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []
  await page.route('**/api/channels/social/overview', async (route) => {
    capturedRequests.push({
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })

    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-social-trace-001',
        timestamp: '2026-05-30T22:00:00+08:00',
        data: {
          filterOptions: {
            camps: [
              { label: '全部门店', value: 'all' },
              { label: '当前门店', value: '10001' },
            ],
            projects: [
              { label: '全部项目', value: 'all' },
              { label: '日历房', value: 'calendar-room' },
            ],
          },
          metrics: [
            { label: '已直连渠道', value: '1', change: '真实渠道账户统计', tone: 'blue' },
            { label: '今日渠道订单', value: '2', change: '来自订单真实数据', tone: 'green' },
          ],
          channels: [
            {
              id: 'douyin-lk',
              name: '抖音来客',
              status: 'connected',
              relation: '关联房型2/3',
              support: ['日历房', '预售券'],
              action: '管理渠道',
              accent: 'blue',
              conversionRate: '100%',
              roomTypeCount: 3,
              linkedRoomTypeCount: 2,
              dailyOrders: 2,
              pendingTasks: ['1 个房型待授权'],
            },
          ],
          trend: [{ label: '05-18', douyin: 2, xiaohongshu: 0, shipinhao: 0 }],
          todos: [{ id: 'todo-1', title: '1 个房型待授权', channel: '抖音来客', priority: '中', dueText: '今日' }],
          accounts: {
            list: [
              {
                id: '59001',
                channel: '抖音来客',
                accountId: 'DY-59001',
                store: '当前门店',
                authorization: ['酒店行业预售券解决方案'],
                auditStatus: '已发布',
                syncStatus: '房型已同步',
                updatedAt: '2026-05-18 09:40',
              },
            ],
            pagination: { page: 1, pageSize: 20, total: 1 },
          },
          quickLinks: [{ label: '房价管理', path: '/houseManage/houseCale' }],
          updatedAt: '2026-05-30 22:00:00',
        },
      },
    })
  })

  await page.goto('/#/channels/social')

  await expect(page.getByTestId('social-channel-page')).toHaveAttribute('data-provider', 'real')
  await expect(page.getByTestId('social-channel-page')).toHaveAttribute('data-trace-id', 'real-social-trace-001')
  await expect(page.getByRole('article', { name: /抖音来客/ })).toContainText('关联房型2/3')

  expect(capturedRequests).toHaveLength(1)
  expect(capturedRequests[0].headers.authorization).toBe('Bearer social-token')
  expect(capturedRequests[0].body).toMatchObject({
    bizDate: '2026-05-18',
    campId: null,
    projectId: null,
    channelStatus: null,
    keyword: null,
    page: 1,
    pageSize: 20,
  })
})
