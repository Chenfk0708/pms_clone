import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { hashAppUrl, seedAuthenticatedUser } from './helpers/auth'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/fangtai--baojie-guanli--baojie-rizhi',
)

const cleanLogEndpoint = '**/cleanLog/page/get'
const pagePath = '/cleanManage/cleanLog?campId=1796067693589061634'
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return hashAppUrl(routePath, appBaseURL)
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await seedAuthenticatedUser(page)
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.cleanLogProvider', 'mock')
    window.localStorage.removeItem('pms.cleanLogMockState')
    window.localStorage.removeItem('pms.cleanLog.lastRequest')
  })
  await page.route('**/select/poi/page/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: {
          list: [
            { poiId: '1796067693589061634', poiName: '全部门店' },
            { poiId: '11001', poiName: '真实日志门店' },
          ],
        },
      },
    })
  })
})

test('/cleanManage/cleanLog uses real API provider by default and anchors operator menu', async ({ page }) => {
  let requestPayload: Record<string, unknown> | null = null

  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.cleanLogProvider')
    window.localStorage.setItem('pms_token', 'clean-log-default-api-token')
  })

  await page.route(cleanLogEndpoint, async (route) => {
    requestPayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        success: true,
        errorMsg: null,
        errorDetail: null,
        data: {
          total: 1,
          list: [
            {
              id: 'CL-REAL-DEFAULT',
              operatorTime: '2026-06-14 13:22:00',
              operatorName: '默认真实操作人',
              operatorTypeName: '完成保洁',
              operatorDetails: '默认真实保洁日志记录',
              roomType: '真实日志房型',
              roomName: '801',
            },
          ],
          dictionaries: {
            stores: [{ label: '全部门店', value: '' }, { label: '真实日志门店', value: '11001' }],
            rooms: [
              {
                label: '真实日志房型 801',
                value: '22001',
                roomType: '真实日志房型',
                roomName: '801（净）',
                cleanState: 'clean',
              },
            ],
            operators: [{ label: '默认真实操作人', value: '33001' }],
          },
        },
      },
    })
  })

  await page.goto(appUrl(pagePath))

  await expect(page.getByText('默认真实保洁日志记录')).toBeVisible()
  expect(requestPayload).toMatchObject({ campId: '1796067693589061634', pageNum: 1, pageSize: 10 })

  const trigger = page.getByRole('button', { name: '请选择操作人' })
  await trigger.click()
  const menu = page.getByRole('listbox', { name: '操作人筛选' })
  await expect(menu).toContainText('默认真实操作人')

  const boxes = await Promise.all([trigger.boundingBox(), menu.boundingBox()])
  expect(boxes[0]).not.toBeNull()
  expect(boxes[1]).not.toBeNull()
  const [triggerBox, menuBox] = boxes as NonNullable<(typeof boxes)[number]>[]
  expect(menuBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height - 1)
  expect(Math.abs(menuBox.x - triggerBox.x)).toBeLessThanOrEqual(2)
})

test('/cleanManage/cleanLog renders from explicit mock provider without backend requests', async ({ page }) => {
  const requestedUrls: string[] = []
  await page.route(cleanLogEndpoint, async (route) => {
    requestedUrls.push(route.request().url())
    await route.fulfill({
      status: 500,
      json: { success: false, errorMsg: 'default mock provider must not call real backend' },
    })
  })

  await page.goto(appUrl(pagePath))

  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '请选择房间' })).toBeVisible()
  await expect(page.getByLabel('操作日期开始')).toHaveAttribute('placeholder', '开始日期')
  await expect(page.getByLabel('操作日期结束')).toHaveAttribute('placeholder', '结束日期')
  await expect(page.getByRole('button', { name: '请选择操作人' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出' })).toBeVisible()

  await expect(page.getByLabel('保洁日志列表').locator('.clean-log-table__head > div')).toHaveText([
    '操作时间',
    '操作人',
    '操作类型',
    '操作内容',
    '操作',
  ])
  await expect(page.getByText('房间1 已完成保洁并标记为净房')).toBeVisible()
  await expect(page.getByRole('button', { name: /查看 CL20260518001/ })).toBeVisible()
  await expect(page.locator('.clean-log-page')).not.toContainText(/mock|Mock|provider|未接入|阻塞|后端|真实接口|未完成/)
  expect(requestedUrls).toEqual([])

  const diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    endpoint: '/cleanManage/cleanLog/list',
    request: {
      campId: '1796067693589061634',
      pageNum: 1,
      pageSize: 10,
    },
  })

  await page.screenshot({
    path: path.join(artifactRoot, 'mock-provider-business-list.png'),
    fullPage: true,
  })
})

test('/cleanManage/cleanLog refreshes service parameters from filters and gives button feedback', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '请选择房间' }).click()
  await expect(page.getByRole('dialog', { name: '选择房间' })).toContainText('观影大床房')
  await page.getByRole('option', { name: '观影大床房 房间1（脏）' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByRole('button', { name: '观影大床房 房间1' })).toBeVisible()

  await page.getByLabel('操作日期开始').fill('2026-05-18')
  await page.getByLabel('操作日期结束').fill('2026-05-18')
  await page.getByRole('button', { name: '请选择操作人' }).click()
  await page.getByRole('option', { name: '路客云6TS5' }).click()
  await expect(page.getByRole('button', { name: '1796067693261905922' })).toBeVisible()
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.getByText('房间1 已完成保洁并标记为净房')).toBeVisible()
  const diagnostics = await waitForDiagnostics(page, (nextDiagnostics) =>
    Boolean(
      nextDiagnostics?.request?.operatorId === '1796067693261905922' &&
        Array.isArray(nextDiagnostics.request.roomId) &&
        nextDiagnostics.request.roomId.includes('room-observation-1') &&
        typeof nextDiagnostics.request.operatorStartTime === 'number' &&
        typeof nextDiagnostics.request.operatorEndTime === 'number',
    ),
  )
  expect(diagnostics.request).toMatchObject({
    campId: '1796067693589061634',
    roomId: ['room-observation-1'],
    operatorId: '1796067693261905922',
    operatorStartTime: expect.any(Number),
    operatorEndTime: expect.any(Number),
  })

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')

  await page.getByRole('button', { name: /查看 CL20260518001/ }).click()
  await expect(page.getByRole('dialog', { name: '保洁日志详情' })).toContainText('房间1 已完成保洁并标记为净房')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '保洁日志详情' })).toHaveCount(0)

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByRole('button', { name: '请选择房间' })).toBeVisible()
  await expect(page.getByRole('button', { name: '请选择操作人' })).toBeVisible()
  await expect(page.getByLabel('操作日期开始')).toHaveValue('')
  await expect(page.getByLabel('操作日期结束')).toHaveValue('')
})

test('/cleanManage/cleanLog exposes empty and error envelopes from mock provider', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.cleanLogMockState', 'empty')
  })
  await page.goto(appUrl(pagePath))

  await expect(page.getByLabel('保洁日志列表').getByText('暂无保洁日志')).toBeVisible()
  let diagnostics = await waitForDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'empty',
    traceId: 'mock-fangtai--baojie-guanli--baojie-rizhi-empty-001',
  })

  await page.evaluate(() => {
    window.localStorage.setItem('pms.cleanLogMockState', 'error')
  })
  await page.getByRole('button', { name: '刷新', exact: true }).click()

  await expect(page.getByRole('alert')).toContainText('保洁日志加载失败，请重试')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  diagnostics = await waitForDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'error',
    traceId: 'mock-fangtai--baojie-guanli--baojie-rizhi-error-001',
  })
})

test('/cleanManage/cleanLog can switch to the captured real request contract', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.cleanLogProvider', 'api')
  })
  let requestPayload: Record<string, unknown> | null = null
  await page.route(cleanLogEndpoint, async (route) => {
    requestPayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        success: true,
        errorMsg: null,
        errorDetail: null,
        data: {
          total: 1,
          list: [
            {
              id: 'api-row-1',
              operatorTime: '2026-05-18 14:22:30',
              operatorName: '接口值班员',
              operatorType: 4,
              operatorDetails: '接口返回的保洁日志记录',
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl(pagePath))

  await expect(page.getByText('接口返回的保洁日志记录')).toBeVisible()
  expect(requestPayload).toMatchObject({
    campId: '1796067693589061634',
    pageNum: 1,
    pageSize: 10,
  })
  const diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'api',
    endpoint: '/api/cleanLog/page/get',
  })
})

test('/cleanManage/cleanLog api provider exports through the real endpoint', async ({ page }) => {
  let exportPayload: Record<string, unknown> | null = null

  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.cleanLogProvider')
    window.localStorage.setItem('pms_token', 'clean-log-api-export-token')
    window.localStorage.setItem('pmsCampId', '1796067693589061634')
    window.localStorage.setItem('pms.currentCampId', '1796067693589061634')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '1',
        name: 'Playwright Admin',
        mobile: '13800000001',
        roleName: 'Platform Admin',
        campId: '1796067693589061634',
        campName: '真实门店',
      }),
    )
  })

  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-log-store-options',
        data: { list: [{ poiId: '11001', poiName: '真实门店' }] },
      },
    })
  })

  await page.route(cleanLogEndpoint, async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-log-api-export-list',
        timestamp: '2026-06-14T14:10:00+08:00',
        data: {
          total: 1,
          list: [
            {
              id: 'CL-EXPORT-REAL',
              operatorTime: '2026-06-14 14:10:00',
              operatorName: '导出操作人',
              operatorTypeName: '完成保洁',
              operatorDetails: '用于导出的真实日志',
              roomType: '标准房',
              roomName: '801',
            },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
          dictionaries: {
            stores: [{ label: '全部门店', value: '' }, { label: '真实门店', value: '11001' }],
            rooms: [{ label: '标准房 801', value: '22001', roomType: '标准房', roomName: '801', cleanState: 'clean' }],
            operators: [{ label: '导出操作人', value: '33001' }],
          },
        },
      },
    })
  })

  await page.route('**/api/cleanManage/cleanLog/export', async (route) => {
    exportPayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-log-api-export',
        timestamp: '2026-06-14T14:11:00+08:00',
        data: { fileName: 'clean_logs_20260614.csv', total: 1 },
      },
    })
  })

  await page.goto(appUrl(pagePath))
  await page.getByRole('button', { name: '导出' }).click()

  await expect.poll(() => exportPayload).not.toBeNull()
  expect(exportPayload).toMatchObject({ campId: '1796067693589061634', pageNum: 1, pageSize: 10 })
})

async function readDiagnostics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rawValue = window.localStorage.getItem('pms.cleanLog.lastRequest')
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
