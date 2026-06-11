import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const hashRoute = routePath.startsWith('/#') ? routePath : `/#${routePath.startsWith('/') ? routePath : `/${routePath}`}`
  return appBaseURL ? `${appBaseURL}${hashRoute}` : hashRoute
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'permission-setting-test-token')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: 'permission-setting-user',
        name: '权限测试账号',
        mobile: '18800000000',
        roleName: '管理员',
        campId: '1796067693589061634',
        campName: '路客云6TS5的店铺',
      }),
    )
    window.localStorage.setItem('pmsCampId', '1796067693589061634')
    window.localStorage.setItem('pms.currentCampId', '1796067693589061634')
    window.localStorage.setItem('pms.permissionSettingProvider', 'mock')
    window.localStorage.removeItem('pms.permissionSettingMockState')
  })
})

test('/setting/role renders the permission setting shell through the service layer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/role'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '权限设置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '店铺角色' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入名称')).toBeVisible()
  await expect(page.getByRole('button', { name: '新增角色' })).toBeVisible()
  await expect(page.getByRole('button', { name: '管理员', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '管家', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '管理员', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '管理员' })).toBeVisible()

  const adminMatrix = page.getByRole('table', { name: '管理员角色权限表' })
  await expect(adminMatrix).toContainText('模块/页面')
  await expect(adminMatrix).toContainText('权限')
  await expect(adminMatrix.locator('tbody tr')).toHaveCount(24)
  await expect(adminMatrix.locator('tbody tr').filter({ hasText: /^首页/ })).toContainText('查看')
  await expect(adminMatrix.locator('tbody tr').filter({ hasText: /^房源/ })).toContainText('操作')
  await expect(adminMatrix.locator('tbody tr').filter({ hasText: /^我的钱包/ })).toContainText('启用')
  await expect(adminMatrix.locator('tbody tr').filter({ hasText: /^客服IM/ })).toContainText('售前')
  await expect(adminMatrix.locator('tbody tr').filter({ hasText: /^客服IM/ })).toContainText('主管')
  await expect(adminMatrix.locator('tbody tr').filter({ hasText: /^夜审/ })).toContainText('修改夜审设置')
  await expect(adminMatrix.locator('tbody tr').filter({ hasText: /^夜审/ })).toContainText('查看夜审数据')
  await expect(adminMatrix.locator('tbody tr').filter({ hasText: /^夜审/ })).toContainText('重审')

  const contract = page.getByTestId('permission-setting-service-contract')
  await expect(contract).toContainText('provider=mock')
  await expect(contract).toContainText('/role/camp/get')
  await expect(contract).toContainText('/roleAuthority/camp/get')
  await expect(contract).toContainText('campId=1796067693589061634')
  await expect(contract).toContainText('roleId=role-admin')
})

test('/setting/role uses the current camp id from runtime context', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/role?campId=10001'))

  await expect(page.getByTestId('permission-setting-service-contract')).toContainText('campId=10001')
})

test('/setting/role filters roles and loads detail with service diagnostics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/role'))

  await page.getByPlaceholder('请输入名称').fill('localsAI')
  await expect(page.getByRole('button', { name: 'localsAI', exact: true })).toBeVisible()
  await expect(page.getByTestId('permission-setting-service-contract')).toContainText('keyword=localsAI')

  await page.getByRole('button', { name: 'localsAI', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'localsAI' })).toBeVisible()
  await expect(page.getByText('请为角色设置权限')).toBeVisible()
  await expect(page.getByRole('button', { name: '编辑角色名称' })).toBeVisible()
  await expect(page.getByRole('button', { name: '删除角色' })).toBeVisible()

  const matrix = page.getByRole('table', { name: 'localsAI角色权限表' })
  await expect(matrix).toContainText('模块/页面')
  await expect(matrix).toContainText('权限')
  await expect(matrix).toContainText('首页')
  await expect(matrix).toContainText('房源')
  await expect(matrix).toContainText('订单')

  await expect(page.getByTestId('permission-setting-service-contract')).toContainText('roleId=role-ai')
})

test('/setting/role toggles role permissions and persists selections', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/role'))

  await page.getByRole('button', { name: '管家', exact: true }).click()
  const matrix = page.getByRole('table', { name: '管家角色权限表' })
  const roomSourceRow = matrix.locator('tbody tr').filter({ hasText: /^房源/ })
  const actionPermission = roomSourceRow.getByRole('button', { name: '操作' })

  await expect(actionPermission).toHaveAttribute('aria-pressed', 'true')
  await actionPermission.click()
  await expect(actionPermission).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('status')).toContainText('权限已保存')

  await page.getByRole('button', { name: '管理员', exact: true }).click()
  await page.getByRole('button', { name: '管家', exact: true }).click()
  await expect(roomSourceRow.getByRole('button', { name: '操作' })).toHaveAttribute('aria-pressed', 'false')
})

test('/setting/role keeps the permission table visible when permission save fails', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.permissionSettingProvider', 'api')
  })

  await page.route('**/api/role/camp/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          list: [
            {
              roleId: 'role-housekeeper',
              roleName: '管家',
              description: '处理订单接待、入住服务与日常巡查。',
              memberCount: 8,
              canDelete: true,
              updatedAt: '2026-05-18 10:46:00',
            },
          ],
          pagination: { page: 1, pageSize: 50, total: 1 },
        },
      }),
    })
  })
  await page.route('**/api/roleAuthority/camp/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          roleId: 'role-housekeeper',
          roleName: '管家',
          description: '处理订单接待、入住服务与日常巡查。',
          permissionRows: [
            {
              moduleId: 'rooms',
              moduleName: '房源',
              permissions: ['查看', '操作'],
              availablePermissions: ['查看', '操作'],
            },
          ],
        },
      }),
    })
  })
  await page.route('**/api/roleAuthority/camp/update', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        errorMsg: '/roleAuthority/camp/update 返回 HTTP 404',
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/role'))

  const matrix = page.getByRole('table', { name: '管家角色权限表' })
  const actionPermission = matrix.locator('tbody tr').filter({ hasText: /^房源/ }).getByRole('button', { name: '操作' })

  await expect(actionPermission).toHaveAttribute('aria-pressed', 'true')
  await actionPermission.click()

  await expect(page.getByRole('alert')).toContainText('/roleAuthority/camp/update 返回 HTTP 404')
  await expect(matrix).toBeVisible()
  await expect(actionPermission).toHaveAttribute('aria-pressed', 'true')
})

test('/setting/role validates and submits the add role dialog', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/role'))

  await page.getByRole('button', { name: '新增角色' }).click()
  const dialog = page.getByRole('dialog', { name: '新增角色' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('提示：此操作有纪录，请谨慎添加、编辑和删除。')

  await dialog.getByRole('button', { name: '确 定' }).click()
  await expect(dialog.getByRole('alert')).toContainText('请输入角色名称')

  await dialog.getByPlaceholder('请输入角色名称').fill('夜班主管')
  await dialog.getByPlaceholder('请输入描述').fill('负责夜审、交接班和夜间运营巡检。')
  await dialog.getByRole('button', { name: '确 定' }).click()

  await expect(page.getByRole('status')).toContainText('角色“夜班主管”已新增')
  await expect(page.getByRole('button', { name: '夜班主管', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '夜班主管' })).toBeVisible()
})

test('/setting/role supports edit and delete feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/role'))

  await page.getByRole('button', { name: '管家', exact: true }).click()
  await page.getByRole('button', { name: '编辑角色名称' }).click()

  const editDialog = page.getByRole('dialog', { name: '编辑角色名称' })
  await expect(editDialog).toBeVisible()
  await editDialog.getByPlaceholder('请输入角色名称').fill('值班管家')
  await editDialog.getByRole('button', { name: '确 定' }).click()

  await expect(page.getByRole('status')).toContainText('角色“值班管家”已更新')
  await expect(page.getByRole('button', { name: '值班管家', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '值班管家' })).toBeVisible()

  await page.getByRole('button', { name: '删除角色' }).click()
  const confirmDialog = page.getByRole('dialog', { name: '删除角色确认' })
  await expect(confirmDialog).toContainText('确认删除角色“值班管家”吗？')
  await confirmDialog.getByRole('button', { name: '取 消' }).click()
  await expect(confirmDialog).toBeHidden()

  await page.getByRole('button', { name: '删除角色' }).click()
  await page.getByRole('button', { name: '确认删除' }).click()
  await expect(page.getByRole('status')).toContainText('角色“值班管家”已删除')
  await expect(page.getByRole('button', { name: '管理员', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('table', { name: '管理员角色权限表' })).toBeVisible()
})

test('/setting/role exposes empty, list error and detail error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/setting/role?mockState=empty'))
  await expect(page.getByText('当前没有可展示的角色')).toBeVisible()
  await expect(page.getByText('当前角色列表为空，请先新增角色')).toBeVisible()

  await page.goto(appUrl('/setting/role?mockState=error'))
  const listAlert = page.getByRole('alert')
  await expect(listAlert).toContainText('角色列表暂时无法获取，请稍后重试')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()

  await page.goto(appUrl('/setting/role?detailMockState=error'))
  await page.getByRole('button', { name: '管家', exact: true }).click()
  const detailAlert = page.getByRole('alert')
  await expect(detailAlert).toContainText('角色权限详情暂时无法获取，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
