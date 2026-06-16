import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

import { seedAuthenticatedUser } from './helpers/auth'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const taskArtifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/fangtai--baojie-guanli--baojie-renyuan',
)
function appUrl(pathName: string) {
  if (pathName.startsWith('/#/')) return `${process.env.PMS_TEST_BASE_URL ?? ''}${pathName}`
  return `${process.env.PMS_TEST_BASE_URL ?? ''}/#${pathName}`
}

test.beforeEach(async ({ page }) => {
  await seedAuthenticatedUser(page, '1796067693589061634')
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'clean-staff-playwright-token')
    window.localStorage.setItem('pmsCampId', '1796067693589061634')
    window.localStorage.setItem('pms.cleanStaffProvider', 'mock')
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
            { poiId: '11001', poiName: 'Default Real Store' },
          ],
        },
      }),
    })
  })
})

test('/cleanManage/cleanStaff uses real API provider by default', async ({ page }) => {
  const listRequests: Array<Record<string, unknown>> = []

  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.cleanStaffProvider')
  })

  await page.route('**/api/cleaner/page/get', async (route) => {
    listRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-staff-default-api-provider',
        timestamp: '2026-06-14T13:21:00+08:00',
        data: {
          stores: [{ id: '11001', name: 'Default Real Store' }],
          summary: { total: 1, onDuty: 1, offDuty: 0, leave: 0, todayTasks: 2, completedTasks: 1, overdueTasks: 0 },
          list: [
            {
              cleanerId: '33001',
              cleanerName: 'Default Real Cleaner',
              mobile: '13800003301',
              poiName: 'Default Real Store',
              workStatus: 'onDuty',
              roleName: 'Cleaner',
              roomScopes: ['Real Room Type'],
              todayTaskNum: 2,
              completedTaskNum: 1,
              overdueTaskNum: 0,
              serviceScore: 97,
              lastTaskTime: '2026-06-14 13:21',
            },
          ],
          pagination: { page: 1, pageSize: 20, total: 1 },
        },
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStaff'))

  await expect(page.getByRole('table', { name: '保洁人员列表' })).toContainText('Default Real Cleaner')
  await expect.poll(() => listRequests.length).toBe(1)
  expect(listRequests[0]).toMatchObject({ campId: '1796067693589061634', pageNum: 1, pageSize: 20 })
  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('provider=api')
})

test('/cleanManage/cleanStaff loads business data from the clean-staff service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStaff'))

  await expect(page.getByRole('heading', { name: '保洁人员', level: 1 })).toHaveCount(0)
  await expect(page.locator('.clean-staff-metric').first()).toBeVisible()
  await expect(page.locator('.clean-staff-metric').first()).toContainText('4')
  await expect(page.getByRole('table', { name: '保洁人员列表' })).toBeVisible()
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(6)
  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('path=/cleaner/page/get')
  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('pageNum=1')
  await expect(page.locator('.clean-staff-metrics')).not.toContainText('mock')

  await page.screenshot({
    path: path.join(taskArtifactRoot, 'default-business-clone.png'),
    fullPage: true,
  })
})

test('/cleanManage/cleanStaff filters, refreshes and resets through service parameters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStaff'))

  await page.getByPlaceholder('姓名/手机号').fill('李')
  await page.getByLabel('保洁状态').selectOption('onDuty')
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('keyword=李')
  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('status=onDuty')
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(2)

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('已刷新')

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('keyword=')
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(6)
})

test('/cleanManage/cleanStaff provides feedback for visible actions and detail entry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStaff'))

  await page.locator('.clean-staff-actions button').last().click()
  await expect(page.locator('.clean-staff-dialog--form')).toBeVisible()
  await page.getByRole('button', { name: '保存成员' }).click()
  await expect(page.getByRole('status')).toContainText('已保存')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')

  await page.locator('[data-testid="clean-staff-row"]').first().getByRole('button', { name: '查看详情' }).click()
  const detailDialog = page.locator('.clean-staff-dialog').last()
  await expect(detailDialog).toBeVisible()
  await expect(detailDialog.getByText('今日任务')).toBeVisible()
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.locator('.clean-staff-dialog')).toHaveCount(0)
})

test('/cleanManage/cleanStaff coordinates quick entries with existing routes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStaff'))

  await page.getByRole('button', { name: /今日任务/ }).click()
  await expect(page).toHaveURL(/\/cleanManage\/cleanTask$/)
})

test('/cleanManage/cleanStaff exposes empty and error states from the provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/cleanManage/cleanStaff?scenario=empty'))
  await expect(page.locator('.clean-staff-empty')).toBeVisible()
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(0)

  await page.goto(appUrl('/cleanManage/cleanStaff?scenario=error'))
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('status', { name: '保洁人员操作反馈' })).toContainText('保洁人员数据加载失败')
  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(6)
})

test('/cleanManage/cleanStaff api provider posts to the cleaner page contract', async ({ page }) => {
  const listRequests: Array<Record<string, unknown>> = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'clean-staff-api-token')
    window.localStorage.setItem('pms.cleanStaffProvider', 'api')
  })

  await page.route('**/api/cleaner/page/get', async (route) => {
    listRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-staff-api-list-contract',
        timestamp: '2026-06-04T03:06:00+08:00',
        data: {
          stores: [{ id: '11001', name: '鐪熷疄淇濇磥闂ㄥ簵' }],
          summary: { total: 1, onDuty: 1, offDuty: 0, leave: 0, todayTasks: 2, completedTasks: 1, overdueTasks: 0 },
          list: [
            {
              cleanerId: '128301',
              cleanerName: 'API Real Cleaner',
              mobile: '13800001301',
              poiName: 'API Real Store',
              poiName: '鐪熷疄淇濇磥闂ㄥ簵',
              workStatus: 'onDuty',
              roleName: 'Cleaner',
              roomScopes: ['Standard Room'],
              todayTaskNum: 2,
              completedTaskNum: 1,
              overdueTaskNum: 0,
              serviceScore: 97,
              lastTaskTime: '2026-06-04 11:30',
            },
          ],
          pagination: { page: 1, pageSize: 20, total: 1 },
        },
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/#/cleanManage/cleanStaff'))

  await expect(page.getByRole('table', { name: '保洁人员列表' })).toContainText('API Real Cleaner')
  await expect.poll(() => listRequests.length).toBe(1)
  expect(listRequests[0]).toMatchObject({ campId: '1796067693589061634', pageNum: 1, pageSize: 20 })
})

test('/cleanManage/cleanStaff api provider saves and exports through real endpoints', async ({ page }) => {
  const saveRequests: Array<Record<string, unknown>> = []
  const exportRequests: Array<Record<string, unknown>> = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'clean-staff-api-actions-token')
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
        campName: 'API Real Store',
      }),
    )
    window.localStorage.setItem('pms.cleanStaffProvider', 'api')
  })

  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-staff-store-options',
        data: { list: [{ poiId: '11001', poiName: 'API Real Store' }] },
      }),
    })
  })

  await page.route('**/api/cleaner/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-staff-api-action-list',
        data: {
          stores: [{ id: '11001', name: 'API Real Store' }],
          summary: { total: 1, onDuty: 1, offDuty: 0, leave: 0, todayTasks: 2, completedTasks: 1, overdueTasks: 0 },
          list: [
            {
              cleanerId: '128301',
              cleanerName: 'API Real Cleaner',
              mobile: '13800001301',
              poiId: '11001',
              poiName: 'API Real Store',
              workStatus: 'onDuty',
              roleName: 'Cleaner',
              roomScopes: ['Standard Room'],
              todayTaskNum: 2,
              completedTaskNum: 1,
              overdueTaskNum: 0,
              serviceScore: 97,
              lastTaskTime: '2026-06-14 14:01',
            },
          ],
          pagination: { page: 1, pageSize: 20, total: 1 },
        },
      }),
    })
  })

  await page.route('**/api/cleaner/save', async (route) => {
    saveRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-staff-api-save',
        timestamp: '2026-06-14T14:02:00+08:00',
        data: { saved: true, cleanerId: '1888001' },
      }),
    })
  })

  await page.route('**/api/cleaner/export', async (route) => {
    exportRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        success: true,
        message: 'success',
        traceId: 'clean-staff-api-export',
        timestamp: '2026-06-14T14:03:00+08:00',
        data: { taskId: 'cleaner-export-real-1', fileName: 'cleaners_20260614.csv', total: 1 },
      }),
    })
  })

  await page.goto(appUrl('/#/cleanManage/cleanStaff'))
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(1)

  await page.locator('.clean-staff-actions button').last().click()
  const dialogInputs = page.locator('.clean-staff-dialog--form input')
  await dialogInputs.nth(0).fill('API Save Cleaner')
  await dialogInputs.nth(1).fill('13900009999')
  await dialogInputs.nth(2).fill('标准大床房')
  await page.locator('.clean-staff-dialog--form footer button.is-primary').click()
  await expect.poll(() => saveRequests.length).toBe(1)
  expect(saveRequests[0]).toMatchObject({
    campId: '1796067693589061634',
    name: 'API Save Cleaner',
    mobile: '13900009999',
    roomScopeText: '标准大床房',
  })

  await page.locator('.clean-staff-actions button').nth(3).click()
  await expect.poll(() => exportRequests.length).toBe(1)
  expect(exportRequests[0]).toMatchObject({ campId: '1796067693589061634', pageNum: 1, pageSize: 20 })
})
