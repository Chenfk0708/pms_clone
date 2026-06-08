import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/fangtai--baojie-guanli--baojie-renwu',
)

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/cleanManage/cleanTask renders business data from the clean-task provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  await expect(page.getByRole('heading', { name: '保洁任务', level: 1 })).toBeVisible()
  await expect(page.locator('.sidebar-link[href="/cleanManage/cleanTask"]')).toHaveClass(/active/)
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('/cleanTask/page/get')
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('pageSize=20')
  await expect(page.getByLabel('保洁任务概览')).toContainText('今日任务')
  await expect(page.getByLabel('保洁任务列表')).toContainText('CT20260518001')
  await expect(page.getByLabel('保洁任务列表')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByRole('button', { name: '批量通知' })).toBeDisabled()
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toHaveCount(0)

  await page.screenshot({
    path: path.join(artifactRoot, 'business-data-clone-20260518.png'),
    fullPage: true,
  })
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

  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('cleanType=CHECKOUT')
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('status=PENDING_CLEAN')
  await expect(page.getByLabel('保洁任务列表')).toContainText('CT20260518001')
  await expect(page.getByLabel('保洁任务列表')).not.toContainText('CT20260518003')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '请选择保洁类型' })).toBeVisible()
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('status=ALL')
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
          summary: { total: 1, pendingAssign: 0, pendingClean: 1, cleaning: 0, done: 0, overdue: 0 },
          list: [
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
          ],
          pagination: { page: 1, pageSize: 20, total: 1 },
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

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/#/cleanManage/cleanTask?cleanTaskProvider=api'))

  await expect(page.getByLabel('保洁任务列表')).toContainText('CT128302')

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