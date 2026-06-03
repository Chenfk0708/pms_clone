import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('calendar room page renders through real weiRoomCategories API without route mocks', async ({ page, request }) => {
  const token = await loginViaGateway(request)
  const apiCalls: Array<{ url: string; body: Record<string, unknown> }> = []

  page.on('request', (req) => {
    const url = req.url()
    if (!url.includes('/api/weiRoomCategories/page/get')) return
    apiCalls.push({ url, body: (req.postDataJSON() as Record<string, unknown>) ?? {} })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.calendarRoomProvider': 'real',
    },
  })

  await page.goto(appUrl('/#/setting/localRoomTypeProductionSetting'))

  const pageRoot = page.locator('.calendar-room-page')
  await expect(pageRoot).toHaveAttribute('data-provider', 'real', { timeout: 15_000 })
  await expect(pageRoot).toHaveAttribute('data-request-keyword', '')
  await expect(page.getByRole('alert', { name: '日历房数据错误' })).toHaveCount(0)
  await expect(page.getByLabel('日历房售卖产品列表')).toContainText('标准大床房预售券', { timeout: 15_000 })
  await expect(page.getByText(/第 1-1 条\/总共 1 条/)).toBeVisible()

  await expect.poll(() => apiCalls.length).toBeGreaterThanOrEqual(1)
  for (const apiCall of apiCalls) {
    expect(apiCall.body).toMatchObject({
      campId: '10001',
      buyCampId: '10001',
      roomCategoryTypes: [1],
      goodsTypes: [7],
      pageNum: 1,
      pageSize: 20,
      keyword: '',
    })
  }
})
