import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('房型信息首屏由统一服务层驱动', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/roomTypeInfo'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '房型信息' })).toHaveClass(/is-active/)

  const contract = page.getByTestId('room-type-info-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-endpoint', /roomCategories\/page\/get/)
  await expect(contract).toHaveAttribute('data-trace-id', /room-type-info-/)
  await expect(contract).toHaveAttribute('data-request-summary', /门店|分组|房型名称/)

  await expect(page.getByRole('button', { name: '门店 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '分组 请选择' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入房型名称')).toBeVisible()
  await expect(page.getByText('当前系统库存：')).toBeVisible()
  await expect(page.getByText('4/10')).toBeVisible()
  await expect(page.getByText('（2025.09.28 至 2027.09.28）')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加房型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '标签管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '楼层管理' })).toBeVisible()

  await expect(page.getByRole('table', { name: '房型信息列表' })).toBeVisible()
  await expect(page.getByRole('columnheader')).toHaveText([
    '房型名称',
    '门店',
    '房间数量',
    '房间号',
    '联动房型',
    '分组',
    '操作',
  ])

  const rows = page.getByTestId('room-type-info-row')
  await expect(rows).toHaveCount(4)
  await expect(rows.nth(0)).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(rows.nth(3)).toContainText('观影大床房')
  await expect(page.getByText('第 1-4 条/总共 4 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('房型信息支持筛选、重置和管理入口反馈', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/roomTypeInfo'))

  await page.getByRole('button', { name: '门店 请选择' }).click()
  await expect(page.getByRole('option', { name: '天落会宿公寓(前海壹方城宝安中心店)' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '分组 请选择' }).click()
  await expect(page.getByRole('option', { name: '天落会宿公寓(前海壹方城宝安中心店)' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByPlaceholder('请输入房型名称').fill('观影')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(1)
  await expect(page.getByTestId('room-type-info-row').first()).toContainText('观影大床房')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('请输入房型名称')).toHaveValue('')
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(4)

  await page.getByRole('button', { name: '标签管理' }).click()
  await expect(page.getByRole('dialog', { name: '标签管理' })).toContainText('电竞')
  await page.getByRole('dialog', { name: '标签管理' }).getByRole('button', { name: '关闭' }).click()

  await page.getByRole('button', { name: '楼层管理' }).click()
  await expect(page.getByRole('dialog', { name: '楼层管理' })).toContainText('顶层露台')
  await page.getByRole('dialog', { name: '楼层管理' }).getByRole('button', { name: '关闭' }).click()
})

test('房型信息支持新增、详情、房间、联动关房和删除反馈', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/roomTypeInfo'))

  await page.getByRole('button', { name: '添加房型' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit/)
  await expect(page.getByRole('heading', { name: '新增房型', level: 1 })).toBeVisible()
  await expect(page.getByLabel('房型设置步骤')).toContainText('基础信息')
  await expect(page.getByLabel('房型名称')).toHaveValue('')
  await expect(page.getByLabel('房间数量')).toHaveValue('1')
  await expect(page.getByRole('button', { name: '快捷创建' })).toBeVisible()

  await page.goto(appUrl('/setting/roomTypeInfo'))
  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '详情' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit/)
  await expect(page.getByRole('heading', { name: '详细信息', level: 1 })).toBeVisible()
  await expect(page.getByLabel('房型名称')).toHaveValue('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByRole('button', { name: '保存并退出' })).toBeVisible()

  await page.goto(appUrl('/setting/roomTypeInfo'))
  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '房间' }).click()
  await expect(page.getByRole('dialog', { name: '房间列表' })).toContainText('房间1')
  await expect(page.getByRole('dialog', { name: '房间列表' })).toContainText('未绑定')
  await page.getByRole('dialog', { name: '房间列表' }).getByRole('button', { name: '关闭' }).click()

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '联动关房' }).click()
  const linkageDialog = page.getByRole('dialog', { name: '联动关房' })
  await expect(linkageDialog).toContainText('设置联动关房后')
  await expect(linkageDialog.getByPlaceholder('请输入名称')).toBeVisible()
  await linkageDialog.getByRole('checkbox', { name: '总裁套间（桑拿浴缸露台电竞麻将）' }).check()
  await expect(linkageDialog.getByText('已选中 1 项')).toBeVisible()
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
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/setting/roomTypeInfo?roomTypeInfoMockState=empty'))
  await expect(page.getByText('暂无房型数据')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加房型' })).toBeVisible()

  await page.goto(appUrl('/setting/roomTypeInfo?roomTypeInfoMockState=error'))
  await expect(page.locator('.room-type-info-state')).toContainText('房型信息加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
