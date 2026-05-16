import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/role renders captured permission setting default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/role'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '权限设置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '店铺角色' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入名称')).toBeVisible()
  await expect(page.getByRole('button', { name: '新增角色' })).toBeVisible()

  for (const roleName of ['管理员', '管家', '投资人', '保洁员', '智住管家', '业主', 'localsAI']) {
    await expect(page.getByRole('button', { name: roleName, exact: true })).toBeVisible()
  }

  await expect(page.getByText('请选择角色')).toBeVisible()
})

test('/setting/role supports add role modal and role permission matrix', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/role'))

  await page.getByRole('button', { name: '新增角色' }).click()
  const dialog = page.getByRole('dialog', { name: '新增角色' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('提示：此操作有纪录，请谨慎添加、编辑和删除。')
  await expect(dialog.getByText('角色名称（必填）')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入角色名称')).toBeVisible()
  await expect(dialog.getByText('描述')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入描述')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '确 定' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: '管家', exact: true }).click()
  await expect(page.getByRole('heading', { name: '管家' })).toBeVisible()
  await expect(page.getByText('请为角色设置权限')).toBeVisible()
  await expect(page.getByRole('button', { name: '编辑角色名称' })).toBeVisible()
  await expect(page.getByRole('button', { name: '删除角色' })).toBeVisible()

  const matrix = page.getByRole('table', { name: '角色权限表' })
  await expect(matrix).toContainText('模块/页面')
  await expect(matrix).toContainText('权限')
  await expect(matrix).toContainText('首页')
  await expect(matrix).toContainText('房源')
  await expect(matrix).toContainText('房态')
  await expect(matrix).toContainText('房价')
  await expect(matrix).toContainText('订单')
  await expect(matrix).toContainText('客服IM')
  await expect(matrix).toContainText('查看')
  await expect(matrix).toContainText('操作')
})
