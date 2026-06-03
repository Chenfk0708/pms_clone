import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('/setting/sortSetting loads and saves sort order through real gateway APIs', async ({ page, request }) => {
  const token = await loginViaGateway(request)
  const apiCalls: Array<{ pathname: string; body: Record<string, unknown> }> = []

  page.on('request', (req) => {
    const url = new URL(req.url())
    if (!url.pathname.startsWith('/api/')) return

    let body: Record<string, unknown> = {}
    try {
      body = req.postDataJSON() as Record<string, unknown>
    } catch {
      body = {}
    }
    apiCalls.push({ pathname: url.pathname, body })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.sortSetting.provider': 'real',
    },
  })

  await page.goto(appUrl('/#/setting/sortSetting'))

  const contract = page.getByTestId('sort-setting-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(contract).toContainText('/select/poi/page/get', { timeout: 15_000 })
  await expect(page.locator('.sort-setting-page')).not.toContainText(/待后端|未接入|商品保存接口待后端最终确认|\?{4}/)

  await page.getByRole('tab', { name: '房型排序' }).click()
  const roomList = page.getByLabel('房型排序列表')
  const roomCount = await roomList.locator('.sort-setting-item').count()
  expect(roomCount).toBeGreaterThanOrEqual(2)
  await roomList.getByRole('button', { name: /^下移 / }).first().click()
  await expect(page.getByRole('status', { name: '排序设置操作反馈' })).toContainText('房型排序已更新', {
    timeout: 15_000,
  })

  await page.getByRole('tab', { name: '商品排序' }).click()
  const goodsList = page.getByLabel('商品排序列表')
  const goodsCount = await goodsList.locator('.sort-setting-item').count()
  expect(goodsCount).toBeGreaterThanOrEqual(2)
  await goodsList.getByRole('button', { name: /^下移 / }).first().click()
  await expect(page.getByRole('status', { name: '排序设置操作反馈' })).toContainText('商品排序已更新', {
    timeout: 15_000,
  })

  expect(apiCalls).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ pathname: '/api/select/poi/page/get' }),
      expect.objectContaining({ pathname: '/api/roomCategories/page/get' }),
      expect.objectContaining({ pathname: '/api/weiRoomCategories/page/get' }),
      expect.objectContaining({ pathname: '/api/roomCategory/seqs' }),
      expect.objectContaining({ pathname: '/api/channelRoomCategories/seqs' }),
    ]),
  )
  expect(
    apiCalls.some(
      (call) =>
        call.pathname === '/api/weiRoomCategories/page/get' &&
        Array.isArray(call.body.roomCategoryTypes) &&
        call.body.roomCategoryTypes.join(',') === '1,2,3',
    ),
  ).toBeTruthy()
})
