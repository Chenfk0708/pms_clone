import { expect, test } from '@playwright/test'

const hudson = 'https://hudson-prod.localhome.cn'

type CapturedRequest = {
  path: string
  body: Record<string, unknown>
}

function makeFeeRow(roomId: string, roomName: string, channelId: string, channelName: string, commission = '12') {
  return {
    rcpi: roomId,
    rcn: roomName,
    ci: channelId,
    cn: channelName,
    cells: [
      { key: 'depositPrice', cellName: '押金', value: 0, status: 1, isPrice: 1 },
      { key: 'additionGuestNum', cellName: '可加客人数', value: 0, status: 1, isPrice: 0 },
      { key: 'addPersonPrice', cellName: '加人费(每人)', value: 0, status: 1, isPrice: 1 },
      { key: 'mealNum', cellName: '餐食数量', value: 0, status: 1, isPrice: 0 },
      { key: 'commissionRate', cellName: '佣金率(%)', value: commission, status: 1, isPrice: 0 },
    ],
  }
}

function makeActivityRow(roomId: string, roomName: string, channelId: string, channelName: string) {
  return {
    rcpi: roomId,
    rcn: roomName,
    ci: channelId,
    cn: channelName,
    cells: [
      { cellName: '连住2天以上', value: '95' },
      { cellName: '连住3天以上', value: '' },
      { cellName: '甩卖第一阶段', value: '14-95' },
      { cellName: '甩卖第二阶段', value: '15-91' },
    ],
  }
}

async function mockOtherPriceApis(page: import('@playwright/test').Page, captured: CapturedRequest[]) {
  await page.route(`${hudson}/**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const body = (request.postDataJSON() as Record<string, unknown>) ?? {}
    captured.push({ path, body })

    if (path === '/camps/get') {
      await route.fulfill({
        json: { success: true, data: { camps: [{ campId: 'camp-1', name: '路客云6TS5的店铺' }] } },
      })
      return
    }

    if (path === '/select/poi/page/get') {
      await route.fulfill({
        json: { success: true, data: { list: [{ poiId: 'poi-1', poiName: '天落会宿公寓' }] } },
      })
      return
    }

    if (path === '/roomCategories/page/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [
              { roomCategoryId: 'room-1', roomCategoryName: '真实接口房型A' },
              { roomCategoryId: 'room-2', roomCategoryName: '真实接口房型B' },
            ],
          },
        },
      })
      return
    }

    if (path === '/select/calChannel4RoomCategory/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            select: [
              { value: '2', label: '途家' },
              { value: '4', label: '携程' },
            ],
          },
        },
      })
      return
    }

    if (path === '/roomCategoryPricings/get') {
      const roomIds = Array.isArray(body.roomCategoryIds) ? body.roomCategoryIds : []
      const allRows = [
        makeFeeRow('room-1', '真实接口房型A', '4', '携程', '12'),
        makeFeeRow('room-2', '真实接口房型B', '2', '途家', '15'),
      ]
      await route.fulfill({
        json: {
          success: true,
          data: {
            head: otherPriceFeeColumns().map((tn) => ({ tn })),
            body: roomIds.length ? allRows.filter((row) => roomIds.includes(row.rcpi)) : allRows,
          },
        },
      })
      return
    }

    if (path === '/roomCategoryRules/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            head: [{ tn: '连住2天以上' }, { tn: '甩卖第一阶段' }, { tn: '甩卖第二阶段' }],
            body: [
              makeActivityRow('room-1', '真实接口房型A', '4', '携程'),
              makeActivityRow('room-2', '真实接口房型B', '2', '途家'),
            ],
          },
        },
      })
      return
    }

    await route.fulfill({ json: { success: true, data: {} } })
  })
}

function otherPriceFeeColumns() {
  return ['押金', '可加客人数', '加人费(每人)', '餐食数量', '佣金率(%)']
}

test('/houseManage/otherPrice uses explicit mock provider by default without development copy', async ({ page }) => {
  const hudsonRequests: string[] = []
  await page.route(`${hudson}/**`, async (route) => {
    hudsonRequests.push(route.request().url())
    await route.abort()
  })

  await page.goto('/houseManage/otherPrice')

  await expect(page.getByLabel('其他价格数据状态')).toContainText('数据已更新')
  await expect(page.getByText('顶层套房（浴缸巨幕电竞麻将）')).toBeVisible()
  await expect(page.getByText('木鸟')).toBeVisible()
  await expect(page.getByText('天落大床电竞套间')).toHaveCount(0)
  await expect(page.getByTestId('other-price-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('body')).not.toContainText(/mock|未接入|阻塞|后端/)
  expect(hudsonRequests).toEqual([])
})

test('/houseManage/otherPrice mock provider consumes filter params and refreshes UI', async ({ page }) => {
  await page.goto('/houseManage/otherPrice')

  await page.getByRole('button', { name: '渠道' }).click()
  await page.getByRole('option', { name: '携程' }).click()

  await expect(page.getByText('美团酒店')).toHaveCount(0)
  await expect(page.locator('.other-price-row').filter({ hasText: '携程' })).toBeVisible()
  await expect(page.getByTestId('other-price-service-contract')).toHaveAttribute('data-request-summary', /channelId=4/)
})

test('/houseManage/otherPrice mock provider exposes empty and error envelopes', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('pms.otherPriceMockMode', 'empty'))
  await page.goto('/houseManage/otherPrice')

  await expect(page.getByLabel('其他价格数据状态')).toContainText('当前筛选下暂无其他价格记录')
  await expect(page.getByText('暂无杂费设置数据')).toBeVisible()

  await page.evaluate(() => window.localStorage.setItem('pms.otherPriceMockMode', 'error'))
  await page.locator('.other-price-utility-actions button').filter({ hasText: '刷新' }).evaluate((button) => {
    ;(button as HTMLButtonElement).click()
  })

  await expect(page.getByRole('alert', { name: '其他价格数据加载失败' })).toContainText('其他价格数据加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/mock|未接入|阻塞|后端/)
})

test('/houseManage/otherPrice switches to real request provider when configured', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('pms.otherPriceProvider', 'real'))
  const captured: CapturedRequest[] = []
  await mockOtherPriceApis(page, captured)

  await page.goto('/houseManage/otherPrice')

  await expect(page.getByLabel('其他价格数据状态')).toContainText('数据已更新')
  await expect(page.getByText('真实接口房型A')).toBeVisible()
  await expect(page.getByText('真实接口房型B')).toBeVisible()
  await expect(page.getByText('天落大床电竞套间')).toHaveCount(0)

  const endpoints = captured.map((request) => request.path)
  expect(endpoints).toContain('/roomCategoryPricings/get')
  expect(endpoints).toContain('/roomCategoryRules/get')

  await page.getByRole('button', { name: '房型' }).click()
  await page.getByRole('option', { name: '真实接口房型B' }).click()

  await expect.poll(() => captured.filter((request) => request.path === '/roomCategoryPricings/get').length).toBeGreaterThan(1)
  const lastPricingRequest = captured.filter((request) => request.path === '/roomCategoryPricings/get').at(-1)
  expect(lastPricingRequest?.body.roomCategoryIds).toEqual(['room-2'])
  await expect(page.getByText('真实接口房型A')).toHaveCount(0)
  await expect(page.locator('.other-price-room', { hasText: '真实接口房型B' })).toBeVisible()
})

test('/houseManage/otherPrice exposes real request failures', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('pms.otherPriceProvider', 'real'))
  await page.route(`${hudson}/**`, async (route) => {
    await route.fulfill({ status: 403, json: { success: false, errorMsg: 'Forbidden' } })
  })

  await page.goto('/houseManage/otherPrice')

  await expect(page.getByRole('alert', { name: '其他价格数据加载失败' })).toContainText('Forbidden')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
})

test('/houseManage/otherPrice visible actions produce business feedback', async ({ page }) => {
  await page.goto('/houseManage/otherPrice')
  await page.getByLabel('杂费设置表格').getByRole('button', { name: '设置', exact: true }).first().click()
  const dialog = page.getByRole('dialog', { name: '改价' })
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder('请输入价格').fill('300')
  await dialog.getByRole('button', { name: '保存' }).click()

  await expect(page.getByLabel('其他价格操作反馈')).toContainText('杂费设置已保存')
  await expect(page.locator('body')).not.toContainText(/mock|未接入|阻塞|后端/)
})
