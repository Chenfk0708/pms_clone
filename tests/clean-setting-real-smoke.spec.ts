import { expect, test } from '@playwright/test'
import { appUrl } from './helpers/real-auth'

test('clean setting page uses real gateway API contract directly', async ({ page }) => {
  const apiCalls: string[] = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'clean-setting-platform-contract-token')
    window.localStorage.setItem('pmsCampId', 'test-camp')
    window.localStorage.setItem('pms.currentCampId', 'test-camp')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '1',
        name: 'Playwright Admin',
        mobile: '13800000001',
        roleName: 'Platform Admin',
        campId: 'test-camp',
        campName: 'Test Camp',
      }),
    )
    window.localStorage.setItem('pms.cleanSettingProvider', 'real')
  })

  await page.route('**/api/cleanSettings/bootstrap', async (route) => {
    apiCalls.push(route.request().url())
    expect(route.request().postDataJSON()).toMatchObject({
      campId: 'test-camp',
      businessDate: '2026-05-18',
      storeId: 'all',
      projectId: 'all',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    await route.fulfill({
      json: {
        success: true,
        code: 0,
        traceId: 'clean-setting-overview-trace',
        timestamp: '2026-06-01T15:10:00+08:00',
        data: {
          stores: [{ value: 'all', label: '全部门店' }, { value: '11001', label: '前海店' }],
          projects: [{ value: 'all', label: '全部项目' }, { value: 'daily-clean', label: '日常保洁' }],
          statusOptions: [{ value: 'all', label: '全部状态' }, { value: 'enabled', label: '已启用' }],
          metrics: [
            { key: 'todayTasks', label: '今日任务', value: '2', description: '待执行任务' },
            { key: 'enabledRules', label: '启用策略', value: '1', description: '当前有效策略' },
          ],
          policyRules: [
            {
              id: 'policy-overview-it',
              name: '退房保洁自动派单',
              storeName: '前海店',
              roomScope: '电竞套间',
              trigger: '退房后 10 分钟',
              cleanerGroup: '一组保洁',
              status: 'enabled',
              updatedAt: '2026-06-01 15:10',
              detail: '退房后自动创建保洁任务',
            },
          ],
          priceRules: [
            {
              id: 'price-overview-it',
              name: '默认退房保洁费',
              cleanType: '退房保洁',
              amount: '35.00',
              settlementMode: '按间结算',
              status: 'enabled',
            },
          ],
          reminders: [{ id: 'todo-1', title: '待确认任务', description: '1 条任务待处理', severity: 'warning' }],
          schedule: [{ label: '09:00-12:00', value: '1 间', tone: 'primary' }],
          pagination: { page: 1, pageSize: 20, total: 1 },
          requestedAt: '2026-06-01 15:10:00',
        },
      },
    })
  })

  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        code: 0,
        traceId: 'clean-setting-store-options',
        timestamp: '2026-06-01T15:09:00+08:00',
        data: {
          list: [
            { poiId: '11001', poiName: '前海店' },
            { poiId: '11002', poiName: '科技园店' },
          ],
        },
      },
    })
  })

  await page.route('**/api/cleanSettings/rule/save', async (route) => {
    apiCalls.push(route.request().url())
    const body = route.request().postDataJSON() as { campId?: string; rule?: { id?: string; name?: string } }
    expect(body.campId).toBe('test-camp')
    expect(body.rule?.id).toBe('policy-overview-it')
    expect(body.rule?.name).toBe('退房保洁自动派单')

    await route.fulfill({
      json: {
        success: true,
        code: 0,
        traceId: 'clean-setting-save-trace',
        timestamp: '2026-06-01T15:12:00+08:00',
        data: {
          rule: {
            id: 'policy-overview-it',
            name: '退房保洁自动派单',
            storeName: '前海店',
            roomScope: '电竞套间',
            trigger: '退房后 10 分钟',
            cleanerGroup: '一组保洁',
            status: 'enabled',
            updatedAt: '2026-06-01 15:12',
            detail: '退房后自动创建保洁任务',
          },
          total: 1,
          message: '保洁策略保存成功',
        },
      },
    })
  })

  await page.route('**/api/cleanSettings/export', async (route) => {
    apiCalls.push(route.request().url())
    expect(route.request().postDataJSON()).toMatchObject({
      campId: 'test-camp',
      businessDate: '2026-05-18',
      storeId: 'all',
      projectId: 'all',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    await route.fulfill({
      json: {
        success: true,
        code: 0,
        traceId: 'clean-setting-export-trace',
        timestamp: '2026-06-01T15:13:00+08:00',
        data: {
          fileName: 'clean_setting_2026-05-18.csv',
          contentType: 'text/csv',
          total: 2,
          policyRules: [
            {
              id: 'policy-overview-it',
              name: '退房保洁自动派单',
              storeName: '前海店',
              roomScope: '电竞套间',
              trigger: '退房后 10 分钟',
              cleanerGroup: '一组保洁',
              status: 'enabled',
              updatedAt: '2026-06-01 15:10',
              detail: '退房后自动创建保洁任务',
            },
          ],
          priceRules: [
            {
              id: 'price-overview-it',
              name: '默认退房保洁费',
              cleanType: '退房保洁',
              amount: '35.00',
              settlementMode: '按间结算',
              status: 'enabled',
            },
          ],
        },
      },
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/#/cleanManage/cleanSetting'))

  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.getByRole('status', { name: '保洁设置操作反馈' })).toHaveCount(0)
  await expect(page.getByRole('table', { name: '保洁策略列表' })).toContainText('退房保洁自动派单', { timeout: 15_000 })
  await expect(page.getByRole('table', { name: '保洁价格规则' })).toContainText('默认退房保洁费', { timeout: 15_000 })

  await page.getByRole('button', { name: '导出' }).click()
  await expect.poll(() => apiCalls.some((url) => url.includes('/api/cleanSettings/export'))).toBeTruthy()

  await page.getByRole('button', { name: '编辑 退房保洁自动派单' }).click()
  await page.getByRole('button', { name: '保存策略' }).click()
  await expect(page.getByRole('dialog', { name: '编辑保洁策略' })).toHaveCount(0)
  await expect.poll(() => apiCalls.some((url) => url.includes('/api/cleanSettings/rule/save'))).toBeTruthy()

  expect(apiCalls.some((url) => url.includes('/api/cleanSettings/bootstrap'))).toBeTruthy()
  expect(apiCalls.some((url) => url.includes('/api/cleanSettings/export'))).toBeTruthy()
  expect(apiCalls.some((url) => url.includes('/api/cleanSettings/rule/save'))).toBeTruthy()
  expect(apiCalls.some((url) => url.includes('/api/cleanManage/cleanSetting'))).toBeFalsy()
})
