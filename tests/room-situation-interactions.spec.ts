import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const roomSituationPath = '/statistics/roomSituation'
const roomSituationUrl = appUrl(roomSituationPath)
const roomSituationHouseStatusUrl = appUrl('/houseManage/houseStatus')
const artifactDir = 'artifacts/screenshots/fangtai--fangqingbiao--fangqingbiao'

function appUrl(routePath: string) {
  const [hashPath, queryString = ''] = routePath.split('?')
  const normalized = queryString ? `/?${queryString}#${hashPath}` : `/#${hashPath}`
  return process.env.PMS_TEST_BASE_URL ? `${process.env.PMS_TEST_BASE_URL}${normalized}` : normalized
}

test.beforeAll(() => {
  mkdirSync(artifactDir, { recursive: true })
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'room-situation-test-token')
    window.localStorage.setItem('pms.roomSituation.provider', 'mock')
  })
})

function appDate(offset = 0) {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const dailyRows = [
  {
    roomCategoryId: 'room-1',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    availabilityCount: 1,
    openRoomCount: 1,
    roomSaleCount: 0,
    closeRoomCount: 0,
    userBusyNum: 0,
    userBusyRetainNum: 0,
    userBusyRepairNum: 0,
    mainViceRelNum: 0,
    totalVacantRoomCount: 1,
    preComeNum: 2,
    liveNum: 0,
    preLeaveNum: 0,
    cleanNum: 1,
    dirtyNum: 0,
  },
  {
    roomCategoryId: 'room-2',
    roomCategoryName: '观影大床房',
    availabilityCount: 3,
    openRoomCount: 2,
    roomSaleCount: 1,
    closeRoomCount: 1,
    userBusyNum: 1,
    userBusyRetainNum: 1,
    userBusyRepairNum: 0,
    mainViceRelNum: 0,
    totalVacantRoomCount: 3,
    preComeNum: 2,
    liveNum: 1,
    preLeaveNum: 1,
    cleanNum: 2,
    dirtyNum: 1,
  },
]

const futureRows = [
  {
    roomCategoryId: 'room-1',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    availabilityCount: 1,
    forwardRoomStatusList: [
      { roomSaleCount: 0, occupationCount: 1 },
      { roomSaleCount: 1, occupationCount: 0 },
    ],
  },
  {
    roomCategoryId: 'room-2',
    roomCategoryName: '观影大床房',
    availabilityCount: 3,
    forwardRoomStatusList: [
      { roomSaleCount: 1, occupationCount: 2 },
      { roomSaleCount: 2, occupationCount: 1 },
    ],
  },
]

async function seedCampId(page: import('@playwright/test').Page) {
  await page.addInitScript(() => window.localStorage.setItem('pmsCampId', 'camp-test-1'))
}

test('/statistics/roomSituation uses explicit mock provider by default without development copy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(roomSituationUrl)

  await expect(page.locator('.topnav-link.is-active')).toHaveCount(1)
  await expect(page.locator('.sidebar-link.is-active')).toHaveCount(1)
  await expect(page.locator('.room-request-status')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByLabel('房情表操作反馈')).toContainText('房情表数据已更新')
  await expect(page.locator('.room-situation-table tbody tr').first()).toContainText('合计 4 0 2 2 2 0 0 0 1 0 1 0 3 1')
  await expect(page.locator('.room-situation-table tbody tr')).toHaveCount(5)
  await expect(page.getByText(/mock provider|mock 数据|阻塞|未接入|后端未就绪|后端接口未完成/)).toHaveCount(0)

  await page.screenshot({ path: `${artifactDir}/mock-default-clone.png`, fullPage: true })
})

test('/houseManage/houseStatus also enters room situation with the same business state', async ({ page }) => {
  await page.goto(roomSituationHouseStatusUrl)

  await expect(page.locator('.sidebar-link.is-active')).toContainText('房情表')
  await expect(page.getByRole('button', { name: '单日房情表' })).toHaveClass(/is-active/)
  await expect(page.locator('.room-request-status')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.room-situation-table tbody tr').first()).toContainText('合计')
})

test('/statistics/roomSituation mock provider exposes empty and failure states', async ({ page }) => {
  await page.goto(appUrl(`${roomSituationPath}?roomSituationMockScenario=empty`))
  await expect(page.locator('.room-request-status')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.room-empty')).toContainText('暂无房情表数据')

  await page.goto(appUrl(`${roomSituationPath}?roomSituationMockScenario=error`))
  await expect(page.getByRole('alert')).toContainText('房情表数据加载失败，请重试')
  await expect(page.getByLabel('房情表操作反馈')).toContainText('房情表数据加载失败')
  await page.screenshot({ path: `${artifactDir}/mock-error-clone.png`, fullPage: true })
})

test('/statistics/roomSituation loads through the real request contract and refreshes parameters', async ({ page }) => {
  await seedCampId(page)
  const dailyBodies: unknown[] = []
  const futureBodies: unknown[] = []

  await page.route('**/select/poi/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          total: 2,
          pageNum: 1,
          pageSize: 999,
          list: [
            { poiId: 'poi-1', poiName: '前海店' },
            { poiId: 'poi-2', poiName: '宝安店' },
          ],
        },
      }),
    })
  })
  await page.route('**/report/dailyRoomStatus/get', async (route) => {
    dailyBodies.push(route.request().postDataJSON())
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { total: dailyRows.length, pageNum: 1, pageSize: 20, list: dailyRows } }),
    })
  })
  await page.route('**/report/forwardRoomStatus/get', async (route) => {
    futureBodies.push(route.request().postDataJSON())
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { total: futureRows.length, pageNum: 1, pageSize: 20, list: futureRows } }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl(`${roomSituationPath}?roomSituationProvider=real`))

  await expect(page.locator('.topnav-link.is-active')).toHaveCount(1)
  await expect(page.locator('.sidebar-link.is-active')).toHaveCount(1)
  await expect(page.locator('.room-request-status')).toHaveAttribute('data-provider', 'real')
  await expect(page.locator('.room-request-status')).toHaveAttribute('data-endpoint', '/report/dailyRoomStatus/get')
  await expect(page.getByLabel('房情表操作反馈')).toContainText('房情表数据已更新')
  await expect(page.locator('.room-situation-table tbody tr').first()).toContainText('合计 4 3 1 1 1 1 0 0 4 4 1 1 3 1')
  expect(dailyBodies[0]).toMatchObject({ campId: 'camp-test-1', date: appDate(), poiIds: [], pageNum: 1, pageSize: 20 })

  const storeSelect = page.getByRole('button', { name: '全部门店' })
  await expect(storeSelect).toBeVisible()
  await expect(page.getByRole('option', { name: '前海店' })).toHaveCount(0)
  await storeSelect.click()
  await expect(page.getByRole('listbox', { name: '门店范围' })).toBeVisible()
  await expect(page.getByRole('option', { name: '前海店' })).toBeVisible()
  await expect(page.getByRole('option', { name: '宝安店' })).toBeVisible()
  await page.getByRole('option', { name: '宝安店' }).click()
  await expect(page.getByRole('button', { name: '宝安店' })).toBeVisible()
  await expect(page.getByRole('option', { name: '宝安店' })).toHaveCount(0)
  await expect.poll(() => dailyBodies.length).toBeGreaterThan(1)
  expect(dailyBodies.at(-1)).toMatchObject({ campId: 'camp-test-1', poiIds: ['poi-2'], pageNum: 1, pageSize: 20 })

  await page.locator('.room-page-size').click()
  await page.getByRole('option', { name: '50 条/页' }).click()
  await expect.poll(() => dailyBodies.length).toBeGreaterThan(1)
  expect(dailyBodies.at(-1)).toMatchObject({ campId: 'camp-test-1', pageNum: 1, pageSize: 50 })
  await expect(page.locator('.room-page-size')).toContainText('50')

  await page.getByRole('button', { name: '远期房情表' }).click()
  await expect(page.getByText('可售=当天剩余可售，占用=订单占用+关房占用')).toBeVisible()
  await expect(page.locator('.room-situation-table--future tbody tr').first()).toContainText('合计 4 1 3 3 1')
  expect(futureBodies[0]).toMatchObject({
    campId: 'camp-test-1',
    startDate: appDate(),
    endDate: appDate(30),
    poiIds: ['poi-2'],
    pageNum: 1,
    pageSize: 50,
  })

  await page.getByRole('button', { name: '指标说明' }).click()
  await expect(page.locator('.room-metric-drawer[role="dialog"]')).toBeVisible()
  await expect(page.locator('.room-metric-drawer')).toContainText('已售房间数=在住-预离+预抵')
  await page.locator('.room-metric-drawer header button').click()
  await expect(page.locator('.room-metric-drawer')).toBeHidden()
})

test('/statistics/roomSituation exposes request failure instead of fake success', async ({ page }) => {
  await seedCampId(page)
  let requestCount = 0

  await page.route('**/select/poi/page/get', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: { list: [] } }) })
  })
  await page.route('**/report/dailyRoomStatus/get', async (route) => {
    requestCount += 1
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, errorMsg: 'server down' }) })
  })

  await page.goto(appUrl(`${roomSituationPath}?roomSituationProvider=real`))
  await expect(page.getByRole('alert')).toContainText('report/dailyRoomStatus/get 返回 HTTP 500')
  await expect(page.getByLabel('房情表操作反馈')).toContainText('房情表数据加载失败')

  await page.getByRole('button', { name: '重试' }).click()
  await expect.poll(() => requestCount).toBeGreaterThan(1)
})
