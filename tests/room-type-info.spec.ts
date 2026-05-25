import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openRoomTypeInfo(
  page: import('@playwright/test').Page,
  routePath = '/setting/roomTypeInfo',
  mockState: 'success' | 'empty' | 'error' = 'success',
) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript((state) => {
    window.localStorage.setItem('pms.roomTypeInfoProvider', 'mock')
    window.localStorage.setItem('pms.roomTypeInfoMockState', state)
  }, mockState)
  await page.goto(appUrl(routePath), { waitUntil: 'domcontentloaded' })
}

test('房型信息首屏由统一服务层驱动', async ({ page }) => {
  await openRoomTypeInfo(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByTestId('room-type-info-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('room-type-info-contract')).toHaveAttribute('data-endpoint', /roomCategories\/page\/get/)
  await expect(page.getByTestId('room-type-info-contract')).toHaveAttribute('data-trace-id', /room-type-info-/)
  await expect(page.locator('.room-type-info-query')).toBeVisible()
  await expect(page.locator('.room-type-info-toolbar')).toContainText('4/10')
  await expect(page.locator('.room-type-info-tools button')).toHaveCount(3)
  await expect(page.getByRole('table', { name: '房型信息列表' })).toBeVisible()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(4)
  await expect(page.getByTestId('room-type-info-row').first()).toContainText('顶层套房')
})

test('房型信息支持筛选、重置和管理入口反馈', async ({ page }) => {
  await openRoomTypeInfo(page)

  await page.locator('.room-type-info-filter').first().getByRole('button').click()
  await expect(page.getByRole('option', { name: '天落会宿公寓(前海壹方城宝安中心店)' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByLabel('房型名称').fill('观影')
  await page.locator('.room-type-info-actions .is-primary').click()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(1)
  await expect(page.getByTestId('room-type-info-row').first()).toContainText('观影大床房')

  await page.locator('.room-type-info-actions button').first().click()
  await expect(page.getByLabel('房型名称')).toHaveValue('')
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(4)

  await page.getByRole('button', { name: '标签管理' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/tag$/)
  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')
  await expect(page.locator('.room-type-tags-table__empty')).toContainText('暂无数据')
  await page.getByRole('button', { name: '新增标签' }).click()
  await expect(page.getByRole('dialog', { name: '添加房型标签' })).toBeVisible()
  await page.getByRole('dialog', { name: '添加房型标签' }).getByRole('button', { name: '取 消' }).click()
  await page.locator('.room-type-tags-page__breadcrumb button').click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)

  await page.getByRole('button', { name: '楼层管理' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/floor$/)
  await expect(page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb')).toContainText('楼层管理')
  await expect(page.locator('.room-type-floors-page .room-type-tags-table__empty')).toContainText('暂无数据')
  await page.getByRole('button', { name: '添加楼层' }).click()
  await expect(page.getByRole('dialog', { name: '添加楼层' })).toBeVisible()
  await page.getByRole('dialog', { name: '添加楼层' }).getByRole('button', { name: '取 消' }).click()
  await page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb button').click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)
})

test('房型信息支持新增、详情、房间、联动关房和删除反馈', async ({ page }) => {
  await openRoomTypeInfo(page)

  await page.getByRole('button', { name: '添加房型' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit/)
  await expect(page.locator('.room-type-edit-page__breadcrumb')).toContainText('新增房型')
  await expect(page.locator('.room-type-edit-page__tabs button')).toHaveCount(5)
  await expect(page.getByLabel('房型名称')).toHaveValue('')
  await expect(page.getByLabel('房间数量')).toHaveValue('1')
  await expect(page.locator('.room-type-edit-page__room-add')).toBeVisible()
  await expect(page.getByRole('button', { name: '快捷创建' })).toBeVisible()

  await openRoomTypeInfo(page)
  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '详情' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit/)
  await expect(page.locator('.room-type-edit-page__breadcrumb')).toContainText('房型详情')
  await expect(page.getByLabel('房型名称')).toHaveValue(/顶层套房/)
  await expect(page.locator('.room-type-edit-page__tabs button').nth(1)).toBeVisible()
  await page.locator('.room-type-edit-page__tabs button').nth(3).click()
  await expect(page.getByLabel('对外展示名称')).toHaveValue(/顶层套房/)
  await page.locator('.room-type-edit-page__tabs button').nth(4).click()
  await expect(page.locator('.room-type-edit-page__photo-list')).toContainText('封面(0/1)')
  await expect(page.getByRole('button', { name: '保存并退出' })).toBeVisible()
  await page.locator('.room-type-edit-page__breadcrumb button').click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '房间' }).click()
  await expect(page.getByRole('dialog', { name: '房间列表' })).toContainText('房间1')
  await page.getByRole('dialog', { name: '房间列表' }).getByRole('button', { name: '关闭' }).click()

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '联动关房' }).click()
  const linkageDialog = page.getByRole('dialog', { name: '联动关房' })
  await expect(linkageDialog).toContainText('设置联动关房后')
  await linkageDialog.getByRole('checkbox').first().check()
  await linkageDialog.getByRole('button', { name: '确 定' }).click()
  await expect(page.getByRole('status')).toContainText('联动关房已更新')

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '删除' }).click()
  const confirmDialog = page.getByRole('dialog', { name: '确认删除房型' })
  await expect(confirmDialog).toContainText('删除房型后将无法恢复')
  await confirmDialog.getByRole('button', { name: '删 除' }).click()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(3)
  await expect(page.getByRole('status')).toContainText('房型已删除')
})

test('房型信息覆盖 empty 和 error 状态', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo', 'empty')
  await expect(page.getByText('暂无房型数据')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加房型' })).toBeVisible()

  const errorPage = await page.context().newPage()
  await openRoomTypeInfo(errorPage, '/setting/roomTypeInfo', 'error')
  await expect(errorPage.locator('.room-type-info-state')).toContainText('房型信息加载失败')
  await expect(errorPage.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('房型标签页支持新增标签弹窗和返回列表', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo/tag')

  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')
  await expect(page.getByRole('button', { name: '新增标签' })).toBeVisible()
  await expect(page.locator('.room-type-tags-table__empty')).toContainText('暂无数据')

  await page.getByRole('button', { name: '新增标签' }).click()
  const dialog = page.getByRole('dialog', { name: '添加房型标签' })
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder('请输入').fill('电竞标签')
  await dialog.locator('select').selectOption({ index: 1 })
  await dialog.getByRole('button', { name: '确 定' }).click()

  await expect(page.locator('.room-type-info-status')).toContainText('房型标签已创建')
  await expect(page.locator('.room-type-tags-table__body')).toContainText('电竞标签')
  await page.locator('.room-type-tags-page__breadcrumb button').click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)
})

test('房型标签管理兼容旧路径和子路径访问', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo/tags')
  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')

  await openRoomTypeInfo(page, '/setting/roomTypeInfo/tagManage')
  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')

  await openRoomTypeInfo(page, '/setting/roomTypeInfo/tag/detail')
  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')
  await expect(page.getByRole('button', { name: '新增标签' })).toBeVisible()
})

test('房型楼层管理兼容旧路径和子路径访问', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo/floors')
  await expect(page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb')).toContainText('楼层管理')

  await openRoomTypeInfo(page, '/setting/roomTypeInfo/floorManage')
  await expect(page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb')).toContainText('楼层管理')

  await openRoomTypeInfo(page, '/setting/roomTypeInfo/floor/detail')
  await expect(page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb')).toContainText('楼层管理')
  await expect(page.getByRole('button', { name: '添加楼层' })).toBeVisible()
})
