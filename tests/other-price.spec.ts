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

test('/houseManage/otherPrice loads data from real request contracts and refetches filters', async ({ page }) => {
  const captured: CapturedRequest[] = []
  await mockOtherPriceApis(page, captured)

  await page.goto('/houseManage/otherPrice')

  await expect(page.getByLabel('其他价格数据来源')).toContainText('已连接真实请求层')
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
  await expect(page.getByText('真实接口房型B')).toBeVisible()
})

test('/houseManage/otherPrice exposes real request failures', async ({ page }) => {
  await page.route(`${hudson}/**`, async (route) => {
    await route.fulfill({ status: 403, json: { success: false, errorMsg: 'Forbidden' } })
  })

  await page.goto('/houseManage/otherPrice')

  await expect(page.getByRole('alert', { name: '其他价格接口阻塞' })).toContainText('真实接口阻塞')
  await expect(page.getByRole('button', { name: '重试真实请求' })).toBeVisible()
})

test('/houseManage/otherPrice does not fake-save unsupported business actions', async ({ page }) => {
  const captured: CapturedRequest[] = []
  await mockOtherPriceApis(page, captured)

  await page.goto('/houseManage/otherPrice')
  await page.getByLabel('杂费设置表格').getByRole('button', { name: '设置', exact: true }).first().click()
  await expect(page.getByRole('dialog', { name: '改价' })).toBeVisible()
  await page.getByPlaceholder('请输入价格').fill('300')
  await page.getByRole('button', { name: '保存' }).click()

  await expect(page.getByRole('status', { name: '其他价格操作反馈' })).toContainText('杂费保存接口未接入')
  await expect(page.getByRole('status', { name: '其他价格操作反馈' })).not.toContainText('保存成功')
})
