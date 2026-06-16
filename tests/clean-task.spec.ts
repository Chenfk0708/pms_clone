import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { seedAuthenticatedUser } from './helpers/auth'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/fangtai--baojie-guanli--baojie-renwu',
)

function appUrl(routePath: string) {
  if (routePath.startsWith('/#/')) return appBaseURL ? `${appBaseURL}${routePath}` : routePath
  return appBaseURL ? `${appBaseURL}/#${routePath}` : `/#${routePath}`
}

test.beforeEach(async ({ page }) => {
  await seedAuthenticatedUser(page, '1796067693589061634')
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'clean-task-playwright-token')
    window.localStorage.setItem('pmsCampId', '1796067693589061634')
    window.localStorage.setItem('pms.cleanTaskProvider', 'mock')
    window.localStorage.setItem('pms.cleanStatisticsProvider', 'mock')
  })
  await page.route('**/select/poi/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        data: {
          list: [
            { poiId: '1796067693589061634', poiName: '全部门店' },
            { poiId: '11001', poiName: '真实门店' },
          ],
        },
      }),
    })
  })
})

test('/cleanManage/cleanTask uses real API provider by default and anchors filter menu to the trigger', async ({ page }) => {
  const listRequests: Array<Record<string, unknown>> = []

  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.cleanTaskProvider')
  })

  await page.route('**/api/cleanTask/page/get', async (route) => {
    listRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-task-default-api-provider',
        timestamp: '2026-06-14T13:20:00+08:00',
        data: {
          stores: [{ id: '11001', label: '真实门店' }],
          rooms: [{ id: '22001', label: '真实房型 / 801' }],
          cleaners: [{ id: '33001', label: '真实保洁员' }],
          summary: { total: 1, pendingAssign: 0, pendingClean: 1, cleaning: 0, done: 0, overdue: 0 },
          list: [
            {
              taskId: '44001',
              taskNo: 'CT-REAL-DEFAULT',
              roomName: '真实房型 / 801',
              poiName: '真实门店',
              cleanType: 'CHECKOUT',
              cleanStatus: 'PENDING_CLEAN',
              cleanerId: '33001',
              cleanerName: '真实保洁员',
              cleanDate: '2026-05-18',
              planTime: '12:00-13:00',
              deadline: '13:00',
              sourceOrderNo: 'ORDER-REAL-DEFAULT',
              guestName: '真实住客',
              remark: '默认真实接口数据',
              progress: 20,
              priority: 'normal',
            },
          ],
          pagination: { page: 1, pageSize: 20, total: 1 },
        },
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  await expect(page.getByLabel('保洁任务列表')).toContainText('CT-REAL-DEFAULT')
  await expect.poll(() => listRequests.length).toBe(1)
  expect(listRequests[0]).toMatchObject({ campId: '1796067693589061634', pageNum: 1, pageSize: 20 })

  const trigger = page.getByRole('button', { name: '请选择保洁类型' })
  await trigger.click()
  const menu = page.getByRole('listbox', { name: '保洁类型筛选' })
  await expect(menu).toBeVisible()

  const boxes = await Promise.all([trigger.boundingBox(), menu.boundingBox()])
  expect(boxes[0]).not.toBeNull()
  expect(boxes[1]).not.toBeNull()
  const [triggerBox, menuBox] = boxes as NonNullable<(typeof boxes)[number]>[]
  expect(menuBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height - 1)
  expect(Math.abs(menuBox.x - triggerBox.x)).toBeLessThanOrEqual(2)
})

test('/cleanManage/cleanTask reads campId from current login context', async ({ page }) => {
  const listRequests: Array<Record<string, unknown>> = []

  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.cleanTaskProvider')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.currentCampId', '10001')
    window.localStorage.setItem('pms.currentCamp', JSON.stringify({ campId: '10001', name: 'root的店铺' }))
  })

  await page.route('**/api/cleanTask/page/get', async (route) => {
    listRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        data: {
          stores: [{ id: '10001', label: 'root的店铺' }],
          rooms: [],
          cleaners: [],
          summary: { total: 0, pendingAssign: 0, pendingClean: 0, cleaning: 0, done: 0, overdue: 0 },
          list: [],
          pagination: { page: 1, pageSize: 20, total: 0 },
        },
      }),
    })
  })

  await page.goto(appUrl('/cleanManage/cleanTask'))

  await expect.poll(() => listRequests.length).toBe(1)
  expect(listRequests[0]).toMatchObject({ campId: '10001', pageNum: 1, pageSize: 20 })
})

test('/cleanManage/cleanTask renders business data from the clean-task provider', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  await expect(page.getByRole('heading', { name: '保洁任务', level: 1 })).toHaveCount(0)
  await expect(page.locator('.sidebar-link[href="#/cleanManage/cleanTask"]')).toHaveClass(/is-active/)
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toHaveCount(0)
  await expect(page.getByLabel('保洁任务概览')).toContainText('今日任务')
  await expect(page.getByLabel('保洁任务列表')).toContainText('CT20260518001')
  await expect(page.getByLabel('保洁任务列表')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByRole('button', { name: '批量通知' })).toBeDisabled()
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toHaveCount(0)

  await page.screenshot({
    path: path.join(artifactRoot, `business-data-clone-20260518-${testInfo.workerIndex}.png`),
    fullPage: true,
  })
})

test('/cleanManage/cleanTask keeps store dropdown and clean date grouped together', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  const storeTrigger = page.locator('.clean-store-tabs .month-store-select__trigger')
  const cleanDate = page.locator('.clean-date')

  await expect(storeTrigger).toBeVisible()
  await expect(cleanDate).toBeVisible()

  await storeTrigger.click()
  await expect(page.locator('.clean-store-tabs .month-store-select__options')).toBeVisible()

  const [storeBox, dateBox] = await Promise.all([storeTrigger.boundingBox(), cleanDate.boundingBox()])
  expect(storeBox).not.toBeNull()
  expect(dateBox).not.toBeNull()
  const storeRight = storeBox!.x + storeBox!.width
  const dateGap = dateBox!.x - storeRight
  expect(dateGap).toBeGreaterThanOrEqual(0)
  expect(dateGap).toBeLessThanOrEqual(16)
  expect(Math.abs(dateBox!.y - storeBox!.y)).toBeLessThanOrEqual(4)
})

test('/cleanManage/cleanTask passes filters into the data service and refreshes UI', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  await page.getByRole('button', { name: '请选择保洁类型' }).click()
  await expect(page.getByRole('listbox', { name: '保洁类型筛选' })).toContainText('退房保洁')
  await page.getByRole('option', { name: '退房保洁' }).click()
  await page.getByRole('button', { name: '请选择保洁状态' }).click()
  await page.getByRole('option', { name: '待保洁' }).click()
  await page.getByRole('button', { name: '查 询' }).click()

  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toHaveCount(0)
  await expect(page.getByLabel('保洁任务列表')).toContainText('CT20260518001')
  await expect(page.getByLabel('保洁任务列表')).not.toContainText('CT20260518003')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '请选择保洁类型' })).toBeVisible()
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toHaveCount(0)
})

test('/cleanManage/cleanTask gives feedback for every visible action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('数据已刷新')

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('已创建导出任务')

  await page.getByRole('button', { name: '查看详情 CT20260518001' }).click()
  await expect(page.getByRole('dialog', { name: '保洁任务详情' })).toContainText('CT20260518001')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByLabel('选择 CT20260518001').check()
  await expect(page.getByRole('button', { name: '批量通知' })).toBeEnabled()
  await page.getByRole('button', { name: '批量通知' }).click()
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('已通知 1 个任务')

  await page.getByRole('button', { name: '创建保洁任务' }).click()
  await expect(page.getByRole('dialog', { name: '创建保洁任务' })).toBeVisible()
  await page.getByLabel('任务备注').fill('需要补充浴巾和矿泉水')
  await page.getByRole('button', { name: '确认创建' }).click()
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('保洁任务已创建')

  await page.getByRole('button', { name: '更多' }).click()
  await expect(page.getByRole('menu', { name: '更多操作' })).toContainText('查看保洁统计')
  await page.getByRole('menuitem', { name: '查看保洁统计' }).click()
  await expect(page).toHaveURL(/\/cleanManage\/cleanStatistics$/)
})

test('/cleanManage/cleanTask exposes empty and error states with retry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask?scenario=empty'))
  await expect(page.getByLabel('保洁任务列表')).toContainText('当前筛选暂无保洁任务')

  await page.goto(appUrl('/cleanManage/cleanTask?scenario=error'))
  await expect(page.getByRole('alert', { name: '保洁任务数据错误' })).toContainText('保洁任务服务繁忙')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert', { name: '保洁任务数据错误' })).toHaveCount(0)
  await expect(page.getByLabel('保洁任务列表')).toContainText('CT20260518001')
})

test('/cleanManage/cleanTask api provider posts export notify and create actions to real backend contracts', async ({ page }) => {
  const exportRequests: Array<Record<string, unknown>> = []
  const notifyRequests: Array<Record<string, unknown>> = []
  const createRequests: Array<Record<string, unknown>> = []
  const assignRequests: Array<Record<string, unknown>> = []
  const startRequests: Array<Record<string, unknown>> = []
  const completeRequests: Array<Record<string, unknown>> = []
  const cancelRequests: Array<Record<string, unknown>> = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'clean-task-api-action-token')
    window.localStorage.setItem('pms.cleanTaskProvider', 'api')
  })

  await page.route('**/api/cleanTask/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-task-api-action-page',
        timestamp: '2026-06-04T03:05:00+08:00',
        data: {
          stores: [{ id: '11001', label: '行动测试门店' }],
          rooms: [{ id: '23002', label: '行动测试房型 / 102' }],
          cleanTypes: [
            { id: 'ALL', label: '全部类型' },
            { id: 'CHECKOUT', label: '退房保洁' },
            { id: 'STAY', label: '续住保洁' },
            { id: 'PLAN', label: '计划保洁' },
            { id: 'TEMPORARY', label: '临时保洁' },
          ],
          statuses: [
            { id: 'ALL', label: '全部状态' },
            { id: 'PENDING_ASSIGN', label: '待分配' },
            { id: 'PENDING_CLEAN', label: '待保洁' },
            { id: 'CLEANING', label: '保洁中' },
            { id: 'DONE', label: '已完成' },
            { id: 'CANCELLED', label: '已取消' },
          ],
          cleaners: [{ id: '128301', label: '行动保洁员' }],
          summary: { total: 3, pendingAssign: 1, pendingClean: 1, cleaning: 1, done: 0, overdue: 0 },
          list: [
            {
              taskId: '128301',
              taskNo: 'CT128301',
              roomName: '行动测试房型 / 101',
              poiName: '行动测试门店',
              cleanType: 'CHECKOUT',
              cleanStatus: 'PENDING_ASSIGN',
              cleanerId: '',
              cleanerName: '待分配',
              cleanDate: '2026-05-18',
              planTime: '09:00',
              deadline: '09:00',
              sourceOrderNo: 'ORDER-CLEAN-128301',
              guestName: '测试住客',
              remark: 'assign task',
              progress: 0,
              priority: 'normal',
            },
            {
              taskId: '128302',
              taskNo: 'CT128302',
              roomName: '行动测试房型 / 102',
              poiName: '行动测试门店',
              cleanType: 'CHECKOUT',
              cleanStatus: 'PENDING_CLEAN',
              cleanerId: '128301',
              cleanerName: '行动保洁员',
              cleanDate: '2026-05-18',
              planTime: '10:00',
              deadline: '10:00',
              sourceOrderNo: 'ORDER-CLEAN-128302',
              guestName: '测试住客',
              remark: 'action task',
              progress: 20,
              priority: 'normal',
            },
            {
              taskId: '128303',
              taskNo: 'CT128303',
              roomName: '行动测试房型 / 103',
              poiName: '行动测试门店',
              cleanType: 'CHECKOUT',
              cleanStatus: 'CLEANING',
              cleanerId: '128301',
              cleanerName: '行动保洁员',
              cleanDate: '2026-05-18',
              planTime: '11:00',
              deadline: '11:00',
              sourceOrderNo: 'ORDER-CLEAN-128303',
              guestName: '测试住客',
              remark: 'complete task',
              progress: 65,
              priority: 'normal',
            },
          ],
          pagination: { page: 1, pageSize: 20, total: 3 },
        },
      }),
    })
  })

  await page.route('**/api/cleanTask/export', async (route) => {
    exportRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-task-export-real-contract',
        timestamp: '2026-06-04T03:05:01+08:00',
        data: { fileName: 'clean_tasks_2026-05-18.csv', contentType: 'text/csv', total: 1, rows: [] },
      }),
    })
  })

  await page.route('**/api/cleanTask/notify', async (route) => {
    notifyRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-task-notify-real-contract',
        timestamp: '2026-06-04T03:05:02+08:00',
        data: { notifiedCount: 1, taskIds: ['128302'], message: '保洁任务通知成功' },
      }),
    })
  })

  await page.route('**/api/cleanTask/create', async (route) => {
    createRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-task-create-real-contract',
        timestamp: '2026-06-04T03:05:03+08:00',
        data: { taskId: '128399', taskNo: 'CT128399', cleanStatus: 'PENDING_CLEAN', message: '保洁任务创建成功' },
      }),
    })
  })

  await page.route('**/api/cleanTask/assign', async (route) => {
    assignRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-task-assign-real-contract',
        timestamp: '2026-06-04T03:05:04+08:00',
        data: { taskId: '128301', cleanStatus: 'PENDING_CLEAN', message: '保洁任务分配成功' },
      }),
    })
  })

  await page.route('**/api/cleanTask/start', async (route) => {
    startRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-task-start-real-contract',
        timestamp: '2026-06-04T03:05:05+08:00',
        data: { taskId: '128302', cleanStatus: 'CLEANING', message: '保洁任务已开始' },
      }),
    })
  })

  await page.route('**/api/cleanTask/complete', async (route) => {
    completeRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-task-complete-real-contract',
        timestamp: '2026-06-04T03:05:06+08:00',
        data: { taskId: '128303', cleanStatus: 'DONE', message: '保洁任务已完成' },
      }),
    })
  })

  await page.route('**/api/cleanTask/cancel', async (route) => {
    cancelRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-task-cancel-real-contract',
        timestamp: '2026-06-04T03:05:07+08:00',
        data: { taskId: '128302', cleanStatus: 'CANCELLED', message: '保洁任务已取消' },
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/#/cleanManage/cleanTask?cleanTaskProvider=api'))

  await expect(page.getByLabel('保洁任务列表')).toContainText('CT128302')

  await page.getByRole('button', { name: '分派 CT128301' }).click()
  await expect.poll(() => assignRequests.length).toBe(1)
  expect(assignRequests[0]).toMatchObject({ campId: '1796067693589061634', taskId: '128301', cleanerId: '128301' })

  await page.getByRole('button', { name: '开始 CT128302' }).click()
  await expect.poll(() => startRequests.length).toBe(1)
  expect(startRequests[0]).toMatchObject({ campId: '1796067693589061634', taskId: '128302' })

  await page.getByRole('button', { name: '完成 CT128303' }).click()
  await expect.poll(() => completeRequests.length).toBe(1)
  expect(completeRequests[0]).toMatchObject({ campId: '1796067693589061634', taskId: '128303' })

  await page.getByRole('button', { name: '取消 CT128302' }).click()
  await expect.poll(() => cancelRequests.length).toBe(1)
  expect(cancelRequests[0]).toMatchObject({ campId: '1796067693589061634', taskId: '128302' })

  await page.getByRole('button', { name: '导 出' }).click()
  await expect.poll(() => exportRequests.length).toBe(1)
  expect(exportRequests[0]).toMatchObject({ campId: '1796067693589061634', cleanTime: '2026-05-18', pageSize: 20 })
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('clean_tasks_2026-05-18.csv')

  await page.getByLabel('选择 CT128302').check()
  await page.getByRole('button', { name: '批量通知' }).click()
  await expect.poll(() => notifyRequests.length).toBe(1)
  expect(notifyRequests[0]).toMatchObject({ campId: '1796067693589061634', taskIds: ['128302'] })
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('1')

  await page.getByRole('button', { name: '创建保洁任务' }).click()
  await page.getByLabel('任务备注').fill('真实接口创建保洁任务')
  await page.getByRole('button', { name: '确认创建' }).click()
  await expect.poll(() => createRequests.length).toBe(1)
  expect(createRequests[0]).toMatchObject({
    campId: '1796067693589061634',
    roomId: '23002',
    cleanerId: '128301',
    cleanType: 'CHECKOUT',
    cleanStatus: 'PENDING_CLEAN',
    cleanTime: '2026-05-18',
    remark: '真实接口创建保洁任务',
  })
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('CT128399')
})
