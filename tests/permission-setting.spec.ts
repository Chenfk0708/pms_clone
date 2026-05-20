import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

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
  await expect(page.getByText('请选择角色')).toBeVisible()

  const contract = page.getByTestId('permission-setting-service-contract')
  await expect(contract).toContainText('provider=mock')
  await expect(contract).toContainText('/role/camp/get')
  await expect(contract).toContainText('/roleAuthority/camp/get')
  await expect(contract).toContainText('campId=1796067693589061634')
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

  const matrix = page.getByRole('table', { name: '角色权限表' })
  await expect(matrix).toContainText('模块/页面')
  await expect(matrix).toContainText('权限')
  await expect(matrix).toContainText('首页')
  await expect(matrix).toContainText('房源')
  await expect(matrix).toContainText('订单')

  await expect(page.getByTestId('permission-setting-service-contract')).toContainText('roleId=role-ai')
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
  await expect(page.getByText('请选择角色')).toBeVisible()
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
