import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/roomTypeInfo matches captured room-type list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/roomTypeInfo'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '房型信息' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '信息概览' })).toBeVisible()
  await expect(page.getByRole('link', { name: '图片视频' })).toBeVisible()

  await expect(page.getByRole('button', { name: '门店 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '分组 请选择' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入')).toBeVisible()
  await expect(page.getByText('当前系统库存：')).toBeVisible()
  await expect(page.getByText('4/10')).toBeVisible()
  await expect(page.getByText('（2025.09.28 至 2027.09.28 ）')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加房型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '标签管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '楼层管理' })).toBeVisible()

  await expect(page.getByLabel('房型信息列表').locator('.room-type-info-table__head > div')).toHaveText([
    '房型名称',
    '门店',
    '房间数量',
    '房间号',
    '联动房型',
    '分组',
    '操作',
  ])

  const rows = page.locator('.room-type-info-table__row')
  await expect(rows).toHaveCount(4)
  await expect(rows.nth(0)).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(rows.nth(0)).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(rows.nth(0)).toContainText('房间1')
  await expect(rows.nth(1)).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(rows.nth(2)).toContainText('天落大床电竞套间')
  await expect(rows.nth(2)).toContainText('1')
  await expect(rows.nth(3)).toContainText('观影大床房')
  await expect(page.getByText('第 1-4 条/总共 4 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('/setting/roomTypeInfo supports captured room-type interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/roomTypeInfo'))

  await page.getByRole('button', { name: '添加房型' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit$/)
  await expect(page.getByRole('heading', { name: '新增房型', level: 1 })).toBeVisible()
  await expect(page.getByLabel('房型设置步骤').getByText('基础信息')).toBeVisible()
  await expect(page.getByText('位置信息')).toBeVisible()
  await expect(page.getByText('房型设施')).toBeVisible()
  await expect(page.getByText('详细介绍')).toBeVisible()
  await expect(page.getByText('照片信息')).toBeVisible()
  await expect(page.getByLabel('房型名称')).toHaveValue('')
  await expect(page.getByLabel('房间数量')).toHaveValue('1')
  await expect(page.getByLabel('房间号')).toHaveValue('房间1')
  await expect(page.getByRole('button', { name: '下一步' })).toBeVisible()
  await expect(page.getByRole('button', { name: '快捷创建' })).toBeVisible()

  await page.goto(appUrl('/setting/roomTypeInfo'))
  await page.locator('.room-type-info-table__row').first().getByRole('button', { name: '详情' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit$/)
  await expect(page.getByRole('heading', { name: '详细信息', level: 1 })).toBeVisible()
  await expect(page.getByLabel('房型名称')).toHaveValue('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByRole('button', { name: '保存并退出' })).toBeVisible()

  await page.goto(appUrl('/setting/roomTypeInfo'))
  await page.locator('.room-type-info-table__row').first().getByRole('button', { name: '房间' }).click()
  const roomDialog = page.getByRole('dialog', { name: '房间列表' })
  await expect(roomDialog).toContainText('房间名称')
  await expect(roomDialog).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(roomDialog).toContainText('未绑定')
  await expect(roomDialog).toContainText('去设置')
  await page.keyboard.press('Escape')

  await page.locator('.room-type-info-table__row').first().getByRole('button', { name: '联动关房' }).click()
  const linkageDialog = page.getByRole('dialog', { name: '联动关房' })
  await expect(linkageDialog).toContainText('设置联动关房后，当前房型关房将联动关联的房型全部关房')
  await expect(linkageDialog.getByPlaceholder('请输入名称')).toBeVisible()
  await expect(linkageDialog).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(linkageDialog).toContainText('天落大床电竞套间')
  await expect(linkageDialog).toContainText('观影大床房')
  await expect(linkageDialog.getByText('已选中 0 项')).toBeVisible()
  await expect(linkageDialog.getByRole('button', { name: '确 定' })).toBeVisible()
})
