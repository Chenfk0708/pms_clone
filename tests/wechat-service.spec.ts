import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const artifactRoot = path.resolve(__dirname, '../artifacts/screenshots/scrm--kehu-goutong--weixin-kefu')

const reportEndpoint = '**/wxcp/kfAccount/report/get'
const accountEndpoint = '**/wxcp/kfAccount/page/get'
const pagePath = '/scrm/wechatService/manage?campId=1796067693589061634'
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.wechatServiceProvider', 'mock')
    window.localStorage.removeItem('pms.wechatServiceMockState')
    window.localStorage.removeItem('pms.wechatService.lastRequest')
  })
})

test('/scrm/wechatService/manage renders provider-driven business dashboard without backend requests', async ({ page }) => {
  const requestedUrls: string[] = []
  await page.route(reportEndpoint, async (route) => {
    requestedUrls.push(route.request().url())
    await route.fulfill({ status: 500, json: { success: false, errorMsg: 'mock provider must not call report endpoint' } })
  })
  await page.route(accountEndpoint, async (route) => {
    requestedUrls.push(route.request().url())
    await route.fulfill({ status: 500, json: { success: false, errorMsg: 'mock provider must not call account endpoint' } })
  })

  await page.goto(appUrl(pagePath))

  await expect(page.getByRole('link', { name: '微信客服' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '微信客服运营台' })).toBeVisible()
  await expect(page.getByRole('button', { name: '全部渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '全部状态' })).toBeVisible()
  await expect(page.getByLabel('会话关键词')).toHaveAttribute('placeholder', '搜索客户、订单或消息')
  await expect(page.getByRole('button', { name: '查询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出' })).toBeVisible()

  await expect(page.getByLabel('微信客服核心指标')).toContainText('待处理会话')
  await expect(page.getByRole('button', { name: /今日会话 128/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /平均响应 2分18秒/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: '客服账号' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '会话队列' })).toBeVisible()
  await expect(page.getByLabel('会话队列').getByText('携程民宿-【M335275070】')).toBeVisible()
  await expect(page.getByRole('button', { name: /天落会宿公寓 在线/ })).toBeVisible()
  await expect(page.locator('.wechat-service-page')).not.toContainText(/mock 数据|mock provider|provider=mock|未接入|阻塞|后端未就绪|后端接口未完成/)
  expect(requestedUrls).toEqual([])

  const diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    endpoint: '/scrm/wechatService/dashboard',
    request: {
      campId: '1796067693589061634',
      channel: '',
      status: '',
      keyword: '',
      pageNum: 1,
      pageSize: 8,
    },
  })

  await page.screenshot({
    path: path.join(artifactRoot, 'business-dashboard-20260518.png'),
    fullPage: true,
  })
})

test('/scrm/wechatService/manage refreshes filters, export, details, and coordinated routes', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '全部渠道' }).click()
  await page.getByRole('option', { name: '美团民宿' }).click()
  await page.getByRole('button', { name: '全部状态' }).click()
  await page.getByRole('option', { name: '待入住' }).click()
  await page.getByLabel('会话关键词').fill('Abraham160')
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.getByText('Abraham160')).toBeVisible()
  await expect(page.getByLabel('会话队列').getByText('携程民宿-【M335275070】')).toHaveCount(0)
  let diagnostics = await waitForDiagnostics(page, (nextDiagnostics) =>
    Boolean(
      nextDiagnostics?.request?.channel === 'meituan' &&
        nextDiagnostics.request.status === 'pendingCheckIn' &&
        nextDiagnostics.request.keyword === 'Abraham160',
    ),
  )
  expect(diagnostics.request).toMatchObject({
    channel: 'meituan',
    status: 'pendingCheckIn',
    keyword: 'Abraham160',
  })

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('微信客服数据已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')
  diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    endpoint: '/scrm/wechatService/export',
    request: {
      channel: 'meituan',
      status: 'pendingCheckIn',
      keyword: 'Abraham160',
    },
  })

  await page.getByRole('button', { name: /查看会话 WS-CV-006/ }).click()
  await expect(page.getByRole('dialog', { name: '会话详情' })).toContainText('Abraham160')
  await expect(page.getByRole('dialog', { name: '会话详情' })).toContainText('顶层套房')
  await page.getByRole('button', { name: '标记已跟进' }).click()
  await expect(page.getByRole('status')).toContainText('会话已标记为已跟进')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByRole('button', { name: '接待配置' }).click()
  await expect(page).toHaveURL(/\/scrm\/wechatService\/receptionConfig$/)
  await page.goto(appUrl(pagePath))
  await page.getByRole('button', { name: '聊天工具栏' }).click()
  await expect(page).toHaveURL(/\/scrm\/sidebar\/preview$/)

  await page.goto(appUrl(pagePath))
  await page.getByLabel('会话关键词').fill('Abraham160')
  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByLabel('会话关键词')).toHaveValue('')
  await expect(page.getByRole('button', { name: '全部渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '全部状态' })).toBeVisible()
})

test('/scrm/wechatService/manage exposes empty and error envelopes from mock provider', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.wechatServiceMockState', 'empty')
  })
  await page.goto(appUrl(pagePath))

  await expect(page.getByLabel('会话队列').getByText('暂无微信客服会话')).toBeVisible()
  let diagnostics = await waitForDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'empty',
    traceId: 'mock-scrm--kehu-goutong--weixin-kefu-empty-001',
  })

  await page.evaluate(() => {
    window.localStorage.setItem('pms.wechatServiceMockState', 'error')
  })
  await page.getByRole('button', { name: '刷新', exact: true }).click()

  await expect(page.getByRole('alert')).toContainText('微信客服数据加载失败，请重试')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  diagnostics = await waitForDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'error',
    traceId: 'mock-scrm--kehu-goutong--weixin-kefu-error-001',
  })
})

test('/scrm/wechatService/manage can switch to captured real request contract', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.wechatServiceProvider', 'api')
  })
  let reportPayload: Record<string, unknown> | null = null
  await page.route(reportEndpoint, async (route) => {
    reportPayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        success: true,
        errorMsg: null,
        errorDetail: null,
        data: {
          summary: {
            todaySessions: 7,
            pendingSessions: 2,
            averageReplySeconds: 96,
            conversionLeads: 3,
          },
          conversations: [
            {
              id: 'api-conv-1',
              customerName: '接口客户',
              channel: 'meituan',
              status: 'consulting',
              orderStatus: 'consulting',
              stayDate: '2026-05-20 至 2026-05-21',
              roomType: '接口房型',
              lastMessage: '接口返回的会话消息',
              lastMessageAt: '2026-05-18 15:20:00',
              assignee: '接口客服',
              unread: 1,
            },
          ],
        },
      },
    })
  })
  await page.route(accountEndpoint, async (route) => {
    await route.fulfill({
      json: {
        success: true,
        errorMsg: null,
        errorDetail: null,
        data: {
          total: 1,
          list: [
            {
              id: 'api-account-1',
              name: '接口客服',
              status: 'online',
              todaySessions: 7,
              averageReplySeconds: 96,
              serviceScore: 98,
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl(pagePath))

  await expect(page.getByText('接口返回的会话消息')).toBeVisible()
  await expect(page.getByRole('button', { name: /接口客服 在线/ })).toBeVisible()
  expect(reportPayload).toMatchObject({
    campId: '1796067693589061634',
    channel: '',
    status: '',
    keyword: '',
    pageNum: 1,
    pageSize: 8,
  })
  const diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'api',
    endpoint: 'https://hudson-prod.localhome.cn/wxcp/kfAccount/report/get',
  })
})

async function readDiagnostics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rawValue = window.localStorage.getItem('pms.wechatService.lastRequest')
    return rawValue ? JSON.parse(rawValue) : null
  })
}

async function waitForDiagnostics(
  page: import('@playwright/test').Page,
  predicate: (diagnostics: Awaited<ReturnType<typeof readDiagnostics>>) => boolean = Boolean,
) {
  await expect.poll(async () => predicate(await readDiagnostics(page))).toBe(true)
  return readDiagnostics(page)
}
