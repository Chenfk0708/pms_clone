import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  if (appBaseURL) {
    return `${appBaseURL.replace(/\/$/, '')}/#${routePath}`
  }

  return `/#${routePath}`
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'scrm-sidebar-preview-test-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '1',
        name: '测试管理员',
        mobile: '13800000001',
        roleName: '平台管理员',
        campName: '10001',
      }),
    )
    window.localStorage.setItem('pms.scrmSidebarProvider', 'mock')
  })
})

test('/scrm/sidebarPreview renders the standalone all-conversations page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview'))

  await expect(page.locator('.topbar')).toHaveCount(0)
  await expect(page.locator('.page-body')).toHaveCount(0)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.sidebar')).toHaveCount(0)
  await expect(page.locator('.conversation-full-page')).toBeVisible()
  await expect(page.locator('.conversation-full-page__header')).toContainText('全部会话')
  await expect(page.getByLabel('全部会话分类')).toContainText('未回复')
  await expect(page.locator('.conversation-card')).toHaveCount(3)
  await expect(page.locator('.conversation-empty-state')).toContainText('您还未选中或发起聊天')
  await expect(page.getByTestId('scrm-sidebar-service-contract')).toHaveAttribute('data-provider', 'mock')
})

test('/scrm/sidebarPreview accepts real provider alias and calls the backend contract', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = []
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'scrm-sidebar-real-provider-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.scrmSidebarProvider', 'real')
  })

  await page.route('**/api/scrm/sidebarPreview/dashboard', async (route) => {
    requests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'api-scrm-sidebar-preview-test',
        timestamp: '2026-06-03T02:00:00+08:00',
        data: {
          stores: [{ id: 'ALL', label: '全部门店' }],
          channels: [{ id: 'ALL', label: '全部渠道' }],
          metrics: [],
          conversations: [
            {
              id: 'api-conv-1',
              guestName: '真实接口客户',
              channel: 'meituan',
              roomName: '真实接口房型',
              status: '咨询中',
              lastMessage: '真实接口返回的会话消息',
              lastSender: '前台',
              lastMessageAt: '2026-06-03 02:00',
              responseSla: '1 分钟内',
              orderNo: 'HO-API-001',
              stayRange: '06.03-06.04',
              tags: ['真实接口'],
              preference: '真实接口偏好',
              orderAmount: '199.00',
            },
          ],
          pendingItems: [],
          replyTemplates: [],
          roomSuggestions: [],
          trend: [],
          pagination: { page: 1, pageSize: 20, total: 1 },
        },
      },
    })
  })

  await page.goto(appUrl('/scrm/sidebarPreview'))

  await expect.poll(() => requests.length).toBeGreaterThan(0)
  expect(requests.at(-1)).toMatchObject({
    campId: '10001',
    poiId: '',
    channel: '',
    keyword: '',
    page: 1,
    pageSize: 20,
  })
  await expect(page.getByTestId('scrm-sidebar-service-contract')).toHaveAttribute('data-provider', 'api')
  await expect(page.locator('.conversation-card')).toContainText('真实接口客户')
})

test('/scrm/sidebarPreview supports tabs, selection, and trial messaging', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview'))

  await page.getByRole('tab', { name: '未回复 1' }).click()
  await expect(page.locator('.conversation-card')).toHaveCount(1)

  await page.locator('.conversation-card').first().click()
  await expect(page.locator('.conversation-workbench__meta')).toContainText('房东账号')
  await expect(page.locator('.chat-message')).toHaveCount(2)

  await page.getByLabel('发送消息输入框').fill('加了')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.locator('.chat-message')).toHaveCount(3)
  await expect(page.locator('.chat-message--staff').last()).toContainText('加了')

  await page.getByRole('button', { name: '会话设置' }).click()
  await expect(page).toHaveURL(/\/setting\/imSetting$/)
})

test('/scrm/sidebarPreview covers empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview?mockState=empty'))

  await expect(page.locator('.conversation-full-page__state')).toContainText('当前分类下暂无会话')

  await page.goto(appUrl('/scrm/sidebarPreview?mockState=error'))
  await expect(page.getByRole('alert')).toContainText('聊天工具栏数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
})
