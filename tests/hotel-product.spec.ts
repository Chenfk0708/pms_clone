import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/mallManagement/hotelProduct matches captured hotel package empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '酒店套餐', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '酒店套餐' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByPlaceholder('请输入套餐名称')).toBeVisible()
  await expect(page.getByRole('button', { name: '关联房型 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '搜 索' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '接单策略' })).toBeVisible()
  await expect(page.getByRole('button', { name: '创建酒店套餐' })).toBeVisible()

  await expect(page.getByLabel('酒店套餐列表').locator('.hotel-product-table__head > div')).toHaveText([
    '',
    '商品标题',
    '关联房型',
    '关联渠道',
    '库存',
    '售价(元)',
    '加价(元)',
    '创建时间',
    '更新时间',
    '操作',
  ])
  await expect(page.getByText('暂无数据')).toBeVisible()
})

test('/mallManagement/hotelProduct supports captured filters and strategy dialog', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await page.getByRole('button', { name: '关联房型 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '关联房型选项' })).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByRole('listbox', { name: '关联房型选项' })).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(page.getByRole('listbox', { name: '关联房型选项' })).toContainText('天落大床电竞套间')
  await expect(page.getByRole('listbox', { name: '关联房型选项' })).toContainText('观影大床房')
  await page.getByRole('option', { name: '观影大床房' }).click()
  await expect(page.getByRole('button', { name: '关联房型 观影大床房' })).toBeVisible()

  await page.getByRole('button', { name: '渠道 请选择渠道' }).click()
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('携程')
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('飞猪淘酒店')
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('路客云聚合')
  await page.getByRole('option', { name: '携程' }).click()
  await expect(page.getByRole('button', { name: '渠道 携程' })).toBeVisible()

  await page.getByPlaceholder('请输入套餐名称').fill('电竞')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('请输入套餐名称')).toHaveValue('')
  await expect(page.getByRole('button', { name: '关联房型 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择渠道' })).toBeVisible()

  await page.getByRole('button', { name: '接单策略' }).click()
  const strategyDialog = page.getByRole('dialog', { name: '酒店套餐接单策略' })
  await expect(strategyDialog).toBeVisible()
  await expect(strategyDialog).toContainText('视频号:')
  await expect(strategyDialog).toContainText('手动接单')
  await expect(strategyDialog).toContainText('自动接单库存不足时，需手动接单')
  await expect(strategyDialog).toContainText('品牌小程序:')
  await expect(strategyDialog).toContainText('自动接单')
  await page.getByRole('button', { name: '取 消' }).click()
  await expect(strategyDialog).toHaveCount(0)
})

test('/mallManagement/hotelProduct supports captured create package flow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await page.getByRole('button', { name: '房型管理' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)
  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await page.getByRole('button', { name: '创建酒店套餐' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/hotelProduct\/edit$/)
  await expect(page.getByRole('heading', { name: '酒店套餐', level: 1 })).toBeVisible()
  await expect(page.getByText('酒店套餐 / 创建酒店套餐')).toBeVisible()
  await expect(page.getByRole('tab', { name: '商品信息' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '套餐设置' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '售卖规则' })).toBeVisible()
  await expect(page.getByText('基本信息')).toBeVisible()
  await expect(page.getByPlaceholder('请输入商品标题')).toBeVisible()
  await expect(page.getByText('建议尺寸：1200*1200像素')).toBeVisible()
  await expect(page.getByText('品牌小程序')).toBeVisible()
  await expect(page.getByText('视频号')).toBeVisible()
  await expect(page.getByRole('button', { name: '+ 选择房型' })).toHaveCount(2)
  await expect(page.getByPlaceholder('请输入手机号码或座机号码（如：010-12345678）')).toBeVisible()
  await expect(page.getByPlaceholder('请输入预定说明')).toBeVisible()
  await expect(page.getByRole('button', { name: '返回列表' })).toBeVisible()
  await expect(page.getByRole('button', { name: '下一步' })).toBeVisible()

  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByRole('tab', { name: '套餐设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('添加套餐')).toBeVisible()
  await expect(page.getByText('日期')).toBeVisible()
  await expect(page.getByText('加价金额')).toBeVisible()

  await page.getByRole('button', { name: '返回列表' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/hotelProduct$/)
  await expect(page.getByText('创建酒店套餐')).toBeVisible()
})
