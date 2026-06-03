import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('OTA api provider adapts platform OTA dashboard contract directly', async ({ page }) => {
  const apiCalls: string[] = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'ota-platform-contract-token')
    window.localStorage.setItem('pmsCampId', 'test-camp')
    window.localStorage.setItem('pms.otaProvider', 'real')
  })

  await page.route('**/api/ota/dashboard/get', async (route) => {
    apiCalls.push(route.request().url())
    await route.fulfill({
      json: {
        success: true,
        code: 0,
        traceId: 'platform-ota-dashboard-trace',
        timestamp: '2026-06-01T02:30:00+08:00',
        data: {
          stores: [{ value: 'all', label: '全部门店' }],
          dimensions: [{ value: 'all', label: '全部渠道' }],
          metrics: [
            { key: 'connected', label: '已直连', value: '1', detail: '平台契约' },
            { key: 'pending', label: '未直连', value: '0', detail: '平台契约' },
            { key: 'roomTypes', label: '关联房型', value: '1/1', detail: '平台契约' },
            { key: 'sync', label: '最近同步', value: '2026-06-01 02:30', detail: '平台契约' },
          ],
          connectedChannels: [
            {
              id: 'ctrip',
              accountId: 'platform-account-1',
              name: '携程直连',
              relation: '关联房型 1/1',
              status: 'connected',
              roomTypeCount: 1,
              mappedRoomTypeCount: 1,
              lastSyncAt: '2026-06-01 02:30',
              logoText: '携程',
              detail: '平台 OTA 已完成同步',
              authorizationNotice: {
                title: '开始携程直连',
                summary: '完成授权后即可同步，',
                summarySuffix: ' 请确认。',
                noticeTitle: '携程直连须知',
                noticeSections: [{ heading: '一、说明', paragraphs: ['平台契约'] }],
                cancelLabel: '取消',
                confirmLabel: '确认',
                badgeText: '携程',
                badgeTone: 'ctrip',
              },
            },
          ],
          pendingChannels: [],
          reminders: [],
          quickLinks: [],
          updatedAt: '2026-06-01 02:30',
          provider: 'api',
          request: { businessDate: '2026-05-18', storeId: 'all', dimension: 'all' },
        },
      },
    })
  })
  await page.route('**/api/ota/channel/detail/get', async (route) => {
    apiCalls.push(route.request().url())
    const requestBody = route.request().postDataJSON() as { channelId?: string; accountId?: string }
    expect(requestBody).toMatchObject({ channelId: 'ctrip', accountId: 'platform-account-1' })
    await route.fulfill({
      json: {
        success: true,
        code: 0,
        data: {
          id: 'ctrip',
          channelName: '携程直连',
          title: '携程直连',
          description: '平台详情契约',
          logoText: '携程',
          logoTone: 1,
          noticeText: '平台注意事项',
          channelStoreOptions: [{ value: 'all', label: '全部' }],
          accountOptions: [{ value: 'all', label: '全部' }],
          statusOptions: [{ value: 'linked', label: '已关联' }],
          roomRows: [
            {
              id: 'room-1',
              channelStoreId: 'poi-1',
              channelStoreName: '平台门店',
              channelRoomType: 'PLATFORM-ROOM',
              status: 'linked',
              statusLabel: '已关联',
              linkedRoomType: '平台房型',
            },
          ],
          storeRows: [],
          syncStoreNotice: { title: '开通携程直连', paragraphs: ['平台契约'] },
          syncStoreDefaults: { hotelSubtype: 'prepay', subHotelId: '', hotelName: '' },
        },
      },
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/#/channels/ota'))
  await expect(page.locator('.ota-channel-card--connected')).toContainText('携程直连', { timeout: 15_000 })
  await page.locator('.ota-channel-card--connected').first().locator('button').nth(1).click()
  await expect(page.locator('.ota-detail-card')).toContainText('PLATFORM-ROOM', { timeout: 15_000 })
  expect(apiCalls.some((url) => url.includes('/api/ota/dashboard/get'))).toBeTruthy()
  expect(apiCalls.some((url) => url.includes('/api/ota/channel/detail/get'))).toBeTruthy()
})

test('OTA dashboard and detail pages use real gateway APIs', async ({ page, request }) => {
  const token = await loginViaGateway(request)
  const apiCalls: string[] = []
  const dashboardResponses: unknown[] = []

  page.on('request', (req) => {
    const url = req.url()
    if (url.includes('/api/ota/dashboard/get') || url.includes('/api/ota/channel/detail/get')) {
      apiCalls.push(url)
    }
  })

  page.on('response', async (res) => {
    if (res.url().includes('/api/ota/dashboard/get') && res.ok()) {
      dashboardResponses.push(await res.json())
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.otaProvider': 'real',
    },
  })

  await page.goto(appUrl('/#/channels/ota'))

  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('.ota-channel-card--connected').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.ota-channel-card--connected').first()).toContainText(/携程|美团/)
  await expect.poll(() => apiCalls.some((url) => url.includes('/api/ota/dashboard/get')), { timeout: 15_000 }).toBeTruthy()
  await expect.poll(() => dashboardResponses.length, { timeout: 15_000 }).toBeGreaterThan(0)

  await page.locator('.ota-channel-card--connected').first().locator('button').nth(1).click()

  await expect(page.locator('.ota-detail-card')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.ota-detail-table tbody tr').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.ota-detail-card')).toContainText(/OUTROOM|MT-RC|CTRIP-RC/)
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 15_000 })
  await expect.poll(() => apiCalls.some((url) => url.includes('/api/ota/channel/detail/get')), { timeout: 15_000 }).toBeTruthy()
})

test('OTA log page uses real gateway API contract directly', async ({ page }) => {
  const apiCalls: string[] = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'ota-log-platform-contract-token')
    window.localStorage.setItem('pmsCampId', 'test-camp')
    window.localStorage.setItem('pms.otaProvider', 'real')
  })

  await page.route('**/api/ota/log/page/get', async (route) => {
    apiCalls.push(route.request().url())
    expect(route.request().postDataJSON()).toMatchObject({
      campId: 'test-camp',
      channelId: 'all',
      keyword: '',
      operator: '',
      operationType: 'all',
      operationStatus: 'all',
      page: 1,
      pageSize: 6,
    })
    await route.fulfill({
      json: {
        success: true,
        code: 0,
        traceId: 'platform-ota-log-trace',
        timestamp: '2026-06-01T13:10:00+08:00',
        data: {
          channelOptions: [{ value: 'all', label: '全部渠道' }],
          operationTypeOptions: [{ value: 'all', label: '全部类型' }, { value: 'bindRoomType', label: '关联渠道房型' }],
          operationStatusOptions: [{ value: 'all', label: '全部状态' }, { value: 'success', label: '成功' }],
          rows: [
            {
              id: 'log-1',
              channelId: 'ctrip',
              channel: '携程直连',
              type: '关联渠道房型',
              operationType: 'bindRoomType',
              content: '关联渠道房型-CTRIP-DELUXE-ROOM 到 平台房型',
              status: '成功',
              operator: '系统同步',
              time: '2026-06-01 13:10',
            },
          ],
          pagination: {
            page: 1,
            pageSize: 6,
            total: 1,
          },
        },
      },
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/#/channels/ota/log'))
  await expect(page.locator('.ota-log-table')).toContainText('CTRIP-DELUXE-ROOM', { timeout: 15_000 })
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 15_000 })
  expect(apiCalls.some((url) => url.includes('/api/ota/log/page/get'))).toBeTruthy()
})
