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
    window.localStorage.setItem('pms_token', 'notification-center-test-token')
    window.localStorage.setItem('pms.notificationCenter.provider', 'mock')
  })
  await page.setViewportSize({ width: 1440, height: 900 })
})

test('/setting/notification renders the standalone notification center page', async ({ page }) => {
  await page.goto(appUrl('/setting/notification'))

  await expect(page.locator('.notification-center-page')).toBeVisible()
  await expect(page.locator('.notification-center-page__layout')).toBeVisible()
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.sidebar')).toHaveCount(0)

  await expect(page.getByRole('tab', { name: '全部' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '未读 2' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '已读' })).toBeVisible()
  await expect(page.getByRole('button', { name: '一键已读' })).toBeVisible()
  await expect(page.getByRole('button', { name: '通知设置' })).toBeVisible()

  await expect(page.getByRole('button', { name: '订单通知 2' })).toBeVisible()
  await expect(page.getByRole('button', { name: '门店预警' })).toBeVisible()
  await expect(page.getByRole('button', { name: '门店动态' })).toBeVisible()

  await expect(page.getByRole('columnheader', { name: '标题' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '内容' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '时间' })).toBeVisible()

  await expect(page.getByText('新订单提醒').first()).toBeVisible()
  await expect(page.getByText('订单费用变更提醒').first()).toBeVisible()
  await expect(page.getByText('点击处理>>').first()).toBeVisible()
  await expect(page.getByText('第 1-20 条/总共 2154 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()

  const layoutBox = await page.locator('.notification-center-page__layout').boundingBox()
  expect(layoutBox?.x).toBe(0)
  expect(layoutBox?.width).toBeCloseTo(1440, 0)
})

test('/setting/notification supports category and tab switching', async ({ page }) => {
  await page.goto(appUrl('/setting/notification'))

  await page.getByRole('button', { name: '门店预警' }).click()
  await expect(page.getByRole('button', { name: '门店预警' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('tab', { name: '未读' })).toBeVisible()
  await expect(page.getByText('未排房提醒').first()).toBeVisible()
  await expect(page.getByText('房态同步渠道失败提醒').first()).toBeVisible()
  await expect(page.getByText('第 1-20 条/总共 57 条')).toBeVisible()

  await page.getByRole('tab', { name: '已读' }).click()
  await expect(page.getByRole('tab', { name: '已读' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('未排房订单提醒').first()).toBeVisible()
  await expect(page.getByText('该分类消息均已读').first()).toHaveCount(0)

  await page.getByRole('button', { name: '门店动态' }).click()
  await expect(page.getByRole('button', { name: '门店动态' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('聚合分销提醒').first()).toBeVisible()
  await expect(page.getByText('路客云监测到更低价').first()).toBeVisible()
  await expect(page.getByText('第 1-10 条/总共 10 条')).toBeVisible()
})

test('/setting/notification real provider sends gateway auth header and marks messages read', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.notificationCenter.provider', 'api')
    window.localStorage.setItem('pms_token', 'crm-message-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  const pageRequests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []
  const unreadRequests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []
  const readAllRequests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []
  let unreadCount = 1
  let messagesRead = false

  await page.route('**/api/systemMessage/page/get', async (route) => {
    const body = (route.request().postDataJSON() as Record<string, unknown>) ?? {}
    pageRequests.push({
      headers: route.request().headers(),
      body,
    })
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-crm-message-page-trace-001',
        timestamp: '2026-05-30T10:00:00+08:00',
        data: {
          total: messagesRead || body.isRead === 1 ? 1 : 2,
          pageNum: 1,
          pageSize: 20,
          list: [
            ...(messagesRead || body.isRead === 1
              ? []
              : [
                  {
                    messageId: '42001',
                    groupType: 'crm',
                    title: 'CRM Message Unread',
                    content: 'CRM Message Unread content',
                    relatedType: 'customer',
                    relatedId: '41001',
                    priority: 'high',
                    isRead: false,
                    createdAt: '2026-05-30 09:30',
                  },
                ]),
            {
              messageId: '42002',
              groupType: 'crm',
              title: 'CRM Message Read',
              content: 'CRM Message Read content',
              relatedType: 'customer',
              relatedId: '41002',
              priority: 'normal',
              isRead: true,
              createdAt: '2026-05-30 08:20',
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/systemMessage/unReadCount/get', async (route) => {
    unreadRequests.push({
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-crm-message-unread-trace-001',
        timestamp: '2026-05-30T10:00:00+08:00',
        data: unreadCount,
      },
    })
  })

  await page.route('**/api/systemMessage/read/all', async (route) => {
    readAllRequests.push({
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    unreadCount = 0
    messagesRead = true
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-crm-message-read-all-trace-001',
        timestamp: '2026-05-30T10:00:00+08:00',
        data: true,
      },
    })
  })

  await page.goto(appUrl('/setting/notification'))

  const contract = page.getByTestId('notification-center-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'api')
  await expect(contract).toHaveAttribute('data-endpoint', '/systemMessage/page/get')
  await expect(page.getByText('CRM Message Unread', { exact: true })).toBeVisible()
  await expect(page.getByText('CRM Message Read', { exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: '未读 1' })).toBeVisible()

  await page.getByRole('button', { name: '一键已读' }).click()
  await expect(page.getByRole('tab', { name: '未读' })).toBeVisible()
  await expect(page.getByText('CRM Message Unread', { exact: true })).toHaveCount(0)

  expect(pageRequests.length).toBeGreaterThanOrEqual(2)
  expect(unreadRequests.length).toBeGreaterThanOrEqual(1)
  expect(readAllRequests).toHaveLength(1)
  expect(pageRequests[0].headers.authorization).toBe('Bearer crm-message-token')
  expect(unreadRequests[0].headers.authorization).toBe('Bearer crm-message-token')
  expect(readAllRequests[0].headers.authorization).toBe('Bearer crm-message-token')
  expect(pageRequests[0].body).toMatchObject({
    campId: '10001',
    groupType: 'crm',
    pageNum: 1,
    pageSize: 20,
    current: 1,
  })
  expect(readAllRequests[0].body).toMatchObject({
    campId: '10001',
    groupType: 'crm',
  })
})

test('/setting/notification real provider marks a single message read with read/update', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.notificationCenter.provider', 'api')
    window.localStorage.setItem('pms_token', 'crm-message-single-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  const readUpdateRequests: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = []
  let messageRead = false

  await page.route('**/api/systemMessage/page/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-crm-message-single-page-trace-001',
        timestamp: '2026-05-31T10:00:00+08:00',
        data: {
          total: 1,
          pageNum: 1,
          pageSize: 20,
          list: [
            {
              messageId: '43001',
              groupType: 'crm',
              title: 'CRM Single Unread',
              content: messageRead ? 'CRM Single Read Content' : 'CRM Single Unread Content',
              relatedType: 'customer',
              relatedId: '41001',
              priority: 'high',
              isRead: messageRead,
              createdAt: '2026-05-31 09:30',
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/systemMessage/unReadCount/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-crm-message-single-unread-trace-001',
        timestamp: '2026-05-31T10:00:00+08:00',
        data: messageRead ? 0 : 1,
      },
    })
  })

  await page.route('**/api/systemMessage/read/update', async (route) => {
    readUpdateRequests.push({
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    messageRead = true
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'real-crm-message-read-update-trace-001',
        timestamp: '2026-05-31T10:00:00+08:00',
        data: true,
      },
    })
  })

  await page.goto(appUrl('/setting/notification'))

  await expect(page.getByText('CRM Single Unread', { exact: true })).toBeVisible()
  await expect(page.getByText('CRM Single Unread Content', { exact: true })).toBeVisible()
  await expect(page.locator('.notification-center-page__tab').nth(1)).toContainText('1')

  await page.getByRole('button', { name: 'Mark read CRM Single Unread' }).click()

  await expect(page.locator('.notification-center-page__tab').nth(1)).not.toContainText('1')
  await expect(page.getByText('CRM Single Read Content', { exact: true })).toBeVisible()
  expect(readUpdateRequests).toHaveLength(1)
  expect(readUpdateRequests[0].headers.authorization).toBe('Bearer crm-message-single-token')
  expect(readUpdateRequests[0].body).toMatchObject({
    campId: '10001',
    groupType: 'crm',
    messageId: '43001',
  })
})

