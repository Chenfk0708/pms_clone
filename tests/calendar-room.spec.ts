import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const forbiddenDevelopmentCopy = /mock|provider|未接入|阻塞|后端|契约/

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/localRoomTypeProductionSetting loads through explicit calendar-room mock provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))

  await expect(page.getByRole('alert', { name: '日历房数据错误' })).toHaveCount(0)
  await expect(page.getByLabel('日历房售卖产品列表')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByText('第 1-4 条/总共 4 条')).toBeVisible()
  await expect(page.locator('.calendar-room-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.calendar-room-page')).toHaveAttribute('data-request-channel', '')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await page.getByPlaceholder('请输入房型名称').fill('观影')
  await page.getByRole('button', { name: '搜 索' }).click()
  await expect(page.getByRole('status', { name: '日历房操作反馈' })).toContainText('已查询日历房售卖产品')
  await expect(page.locator('.calendar-room-page')).toHaveAttribute('data-request-keyword', '观影')
  await expect(page.locator('.calendar-room-table__room-row')).toHaveCount(1)
  await expect(page.getByLabel('日历房售卖产品列表')).toContainText('观影大床房')
})

test('/setting/localRoomTypeProductionSetting renders empty and failure response states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/setting/localRoomTypeProductionSetting?calendarRoomMockState=empty'))
  await expect(page.getByText('暂无售卖产品')).toBeVisible()
  await expect(page.getByText('当前筛选条件下没有日历房售卖产品，请调整条件后重新查询。')).toBeVisible()
  await expect(page.getByLabel('日历房售卖产品列表')).not.toContainText('顶层套房')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await page.goto(appUrl('/setting/localRoomTypeProductionSetting?calendarRoomMockState=error'))
  await expect(page.getByRole('alert', { name: '日历房数据错误' })).toContainText('日历房数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})

test('/setting/localRoomTypeProductionSetting gives feedback for all visible product actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))

  await page.getByRole('button', { name: '展开' }).first().click()
  const firstProductGroup = page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')
  await page.getByRole('button', { name: '预览' }).first().click()
  await expect(page.getByRole('dialog', { name: '售卖产品详情' })).toContainText('产品名称')
  await page.getByRole('button', { name: '关闭售卖产品详情' }).click()

  await firstProductGroup.getByRole('button', { name: '编辑' }).first().click()
  await expect(page).toHaveURL(/\/setting\/localRoomTypeProductionSetting\/channelGoodsSetting$/)

  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))
  await page.getByRole('button', { name: '展开' }).first().click()
  await page.getByRole('button', { name: '修改价格' }).first().click()
  await expect(page.getByRole('dialog', { name: '调整售卖价格' })).toContainText('当前价格计划')
  await page.getByRole('button', { name: '保存价格' }).click()
  await expect(page.getByRole('status', { name: '日历房操作反馈' })).toContainText('售卖价格已保存')

  await page.getByRole('button', { name: '下架' }).first().click()
  await expect(page.getByRole('dialog', { name: '调整上下架状态' })).toContainText('确认下架')
  await page.getByRole('button', { name: '确认调整' }).click()
  await expect(page.getByRole('status', { name: '日历房操作反馈' })).toContainText('售卖状态已更新')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})

test('/setting/localRoomTypeProductionSetting matches captured calendar-room list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '日历房', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '日历房' })).toHaveClass(/is-active/)
  await page.locator('.sidebar').getByRole('button', { name: '预售券' }).click()
  await expect(page.locator('.sidebar').getByRole('link', { name: '预售券' })).toBeVisible()
  await expect(page.locator('.sidebar').getByRole('link', { name: '酒店套餐' })).toBeVisible()

  await expect(page.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新增售卖产品' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入房型名称')).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上架状态 全部' })).toBeVisible()
  await expect(page.getByRole('button', { name: '展开' }).first()).toBeVisible()

  await expect(page.getByLabel('日历房售卖产品列表').locator('.calendar-room-table__head > div')).toHaveText([
    '展开',
    '房型名称',
    '关联渠道',
    '产品数量',
    '操作',
  ])

  const rows = page.locator('.calendar-room-table__room-row')
  await expect(rows).toHaveCount(4)
  await expect(rows.nth(0)).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(rows.nth(0)).toContainText('11')
  await expect(rows.nth(1)).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(rows.nth(1)).toContainText('9')
  await expect(rows.nth(2)).toContainText('天落大床电竞套间')
  await expect(rows.nth(2)).toContainText('8')
  await expect(rows.nth(3)).toContainText('观影大床房')
  await expect(rows.nth(3)).toContainText('8')
  await expect(page.getByText('第 1-4 条/总共 4 条')).toBeVisible()
})

test('/setting/localRoomTypeProductionSetting supports captured expansion and navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))

  await page.getByRole('button', { name: '展开' }).first().click()
  await expect(page.getByRole('button', { name: '收起' }).first()).toBeVisible()
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('产品名称：')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('渠道：')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('早餐类型：')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('退订政策：')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('修改价格')
  await expect(page.getByLabel('顶层套房（浴缸巨幕电竞麻将）产品明细')).toContainText('下架')

  await page.getByRole('button', { name: '房价管理' }).first().click()
  await expect(page).toHaveURL(/\/houseManage\/houseCale$/)

  await page.goto(appUrl('/setting/localRoomTypeProductionSetting'))
  await page.getByRole('button', { name: '新增售卖产品' }).click()
  await expect(page).toHaveURL(/\/setting\/localRoomTypeProductionSetting\/channelGoodsSetting$/)
})
