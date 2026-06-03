import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const hashPath = `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${hashPath}` : hashPath
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'shift-setting-test-token')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '12001',
        name: 'System Admin',
        mobile: '13800000000',
        roleName: 'Admin',
        campName: 'Test Camp',
      }),
    )
  })
})

test('/setting/shiftSetting 保持在设置体系内并渲染目标页空态结构', async ({ page }) => {
  await page.goto(appUrl('/setting/shiftSetting?provider=mock'), { waitUntil: 'domcontentloaded' })

  const pageRoot = page.locator('.shift-setting-page')
  const serviceContract = page.locator('#shift-setting-service-contract')
  const shiftSection = page.getByRole('region', { name: '班次设置' })
  const goodsSection = page.getByRole('region', { name: '交班物品' })

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(pageRoot).toBeVisible()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '交接班设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('status', { name: '交接班设置操作反馈' })).toContainText('已加载交接班设置')

  await expect(shiftSection.getByRole('heading', { name: '班次设置' })).toBeVisible()
  await expect(shiftSection).toContainText('最近更新时间：-')
  await expect(shiftSection.getByRole('button', { name: '班次设置' })).toBeVisible()
  for (const header of ['班次名称', '开始时间', '结束时间', '班次成员']) {
    await expect(shiftSection.getByRole('columnheader', { name: header })).toBeVisible()
  }
  await expect(page.getByTestId('shift-setting-empty-shifts')).toContainText('暂无班次，')
  await expect(page.getByTestId('shift-setting-empty-shifts').getByRole('button', { name: '点击新增' })).toBeVisible()

  await expect(goodsSection.getByRole('heading', { name: '交班物品' })).toBeVisible()
  await expect(goodsSection).toContainText('最近更新时间：-')
  await expect(goodsSection.getByRole('button', { name: '添加物品' })).toBeVisible()
  await expect(page.getByTestId('shift-setting-empty-goods')).toContainText('暂无交班物品，')
  await expect(page.getByTestId('shift-setting-empty-goods').getByRole('button', { name: '点击新增' })).toBeVisible()

  await expect(serviceContract).toHaveAttribute('data-provider', 'mock')
  await expect(serviceContract).toHaveAttribute('data-state', 'success')
  await expect(serviceContract).toContainText('provider=mock')
  await expect(serviceContract).toContainText('configPath=/shiftWorkConfig/page/get')
  await expect(serviceContract).toContainText('goodsPath=/shiftWorkGoods/page/get')
  await expect(serviceContract).toContainText('memberPath=/campRoles/get')
  await expect(serviceContract).toContainText('shiftCount=0')
  await expect(serviceContract).toContainText('goodsCount=0')
  await expect(serviceContract).toContainText('memberCount=4')
})

test('/setting/shiftSetting 支持新增班次和交班物品弹窗', async ({ page }) => {
  await page.goto(appUrl('/setting/shiftSetting?provider=mock'), { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: '班次设置' }).click()
  const shiftDialog = page.getByRole('dialog', { name: '班次设置' })
  await expect(shiftDialog).toBeVisible()
  await expect(shiftDialog.getByRole('button', { name: '+ 新增班次' })).toBeVisible()

  await shiftDialog.getByPlaceholder('请输入班次名称').fill('中班')
  await shiftDialog.getByLabel('开始时间').fill('12:00')
  await shiftDialog.getByLabel('结束时间').fill('18:00')
  await shiftDialog.getByLabel('班次成员').selectOption(['member-2', 'member-4'])
  await shiftDialog.getByRole('button', { name: '确定' }).click()

  await expect(page.getByRole('status', { name: '交接班设置操作反馈' })).toContainText('已保存班次设置')
  await expect(page.getByRole('dialog', { name: '班次设置' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '班次设置' })).toContainText('中班')
  await expect(page.getByRole('region', { name: '班次设置' })).toContainText('12:00')
  await expect(page.getByRole('region', { name: '班次设置' })).toContainText('陈早班、王夜班')
  await expect(page.locator('#shift-setting-service-contract')).toContainText('shiftCount=1')

  await page.getByRole('button', { name: '添加物品' }).click()
  const goodsDialog = page.getByRole('dialog', { name: '添加物品' })
  await expect(goodsDialog).toBeVisible()
  await goodsDialog.getByPlaceholder('请输入物品名称').fill('对讲机')
  await goodsDialog.getByRole('button', { name: '确定' }).click()

  await expect(page.getByRole('status', { name: '交接班设置操作反馈' })).toContainText('已保存交班物品')
  await expect(page.getByRole('dialog', { name: '添加物品' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '交班物品' })).toContainText('对讲机')
  await expect(page.locator('#shift-setting-service-contract')).toContainText('goodsCount=1')
})

test('/setting/shiftSetting 暴露错误态且不破坏目标页空结构', async ({ page }) => {
  await page.goto(appUrl('/setting/shiftSetting?provider=mock&mockState=error'), { waitUntil: 'domcontentloaded' })

  await expect(page.locator('#shift-setting-service-contract')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert', { name: '交接班设置数据错误' })).toContainText('交接班设置加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载交接班设置' })).toBeVisible()
  await expect(page.getByRole('status', { name: '交接班设置操作反馈' })).toContainText('交接班设置加载失败')
})


test('/setting/shiftSetting defaults to api provider and posts save contracts', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'playwright-token')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({ id: '12001', name: 'System Admin', mobile: '13800000000', roleName: 'Admin', campName: 'Test Camp' }),
    )
  })

  const shiftSaveBodies: unknown[] = []
  const goodsSaveBodies: unknown[] = []

  await page.route('**/api/shiftWorkConfig/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        message: 'success',
        data: { list: [], total: 0, pageNum: 1, pageSize: 999 },
      }),
    })
  })
  await page.route('**/api/shiftWorkGoods/page/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        message: 'success',
        data: { list: [], total: 0, pageNum: 1, pageSize: 999 },
      }),
    })
  })
  await page.route('**/api/campRoles/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        message: 'success',
        data: {
          employees: [{ userId: '12001', memberId: '14001', displayName: 'System Admin' }],
        },
      }),
    })
  })
  await page.route('**/api/shiftWorkConfig/save', async (route) => {
    shiftSaveBodies.push(route.request().postDataJSON())
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        message: 'success',
        data: {
          message: 'shift work configs saved',
          shiftConfigs: [
            { id: '57301', name: 'API_SHIFT_A', startTime: '07:30', endTime: '15:30', memberIds: ['12001'] },
          ],
        },
      }),
    })
  })
  await page.route('**/api/shiftWorkGoods/save', async (route) => {
    goodsSaveBodies.push(route.request().postDataJSON())
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        message: 'success',
        data: {
          message: 'shift work goods saved',
          goodsConfigs: [{ id: '57401', name: 'API_GOODS_CARD' }],
        },
      }),
    })
  })

  await page.goto(appUrl('/login'), { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.setItem('pms_token', 'playwright-token')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({ id: '12001', name: 'System Admin', mobile: '13800000000', roleName: 'Admin', campName: 'Test Camp' }),
    )
    window.location.hash = '#/setting/shiftSetting'
  })
  await expect(page.locator('#shift-setting-service-contract')).toHaveAttribute('data-provider', 'api')

  await page.locator('button.shift-setting-primary').first().click()
  const shiftDialog = page.locator('.shift-setting-modal').first()
  await shiftDialog.locator('input').nth(0).fill('API_SHIFT_A')
  await shiftDialog.locator('input').nth(1).fill('07:30')
  await shiftDialog.locator('input').nth(2).fill('15:30')
  await shiftDialog.locator('select').selectOption(['12001'])
  await shiftDialog.locator('button.shift-setting-confirm').click()

  await expect.poll(() => shiftSaveBodies.length).toBe(1)
  expect(shiftSaveBodies[0]).toEqual({
    campId: '10001',
    drafts: [{ name: 'API_SHIFT_A', startTime: '07:30', endTime: '15:30', memberIds: ['12001'] }],
  })
  await expect(page.locator('.shift-setting-status')).toContainText('shift work configs saved')

  await page.locator('button.shift-setting-primary').nth(1).click()
  const goodsDialog = page.locator('.shift-setting-modal').first()
  await goodsDialog.locator('input').first().fill('API_GOODS_CARD')
  await goodsDialog.locator('button.shift-setting-confirm').click()

  await expect.poll(() => goodsSaveBodies.length).toBe(1)
  expect(goodsSaveBodies[0]).toEqual({
    campId: '10001',
    drafts: [{ name: 'API_GOODS_CARD' }],
  })
  await expect(page.locator('.shift-setting-status')).toContainText('shift work goods saved')
})
