import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/mallManagement/hotelPackageOrder matches captured hotel package order empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/hotelPackageOrder'))

  await expect(page.getByRole('heading', { name: '酒店套餐订单', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '酒店套餐订单' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-header')).toBeHidden()

  await expect(page.getByLabel('订单状态')).toHaveText('全部')
  await expect(page.getByRole('button', { name: '订单来源 请选择订单来源' })).toBeVisible()
  await expect(page.getByRole('group', { name: '下单时间' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入订单编号/买家联系方式')).toBeVisible()
  await expect(page.getByRole('button', { name: '售后状态 请选择售后状态' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '搜 索' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()

  await expect(page.getByRole('button', { name: '商品类型 请选择商品类型' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '商品类目 请选择商品类目' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '支付方式 请选择支付方式' })).toHaveCount(0)

  await expect(page.getByLabel('酒店套餐订单表格').locator('.presale-order-table__head > div')).toHaveText([
    '商品',
    '购买数量',
    '商品单价(元)',
    '团期差价（元）',
    '实付金额(元)',
    '联系号码',
    '订单状态',
    '售后状态',
    '操作',
  ])
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByRole('button', { name: '订单来源 请选择订单来源' }).click()
  await expect(page.getByRole('listbox', { name: '订单来源选项' })).toContainText('品牌小程序')
  await page.getByRole('option', { name: '品牌小程序' }).click()
  await expect(page.getByRole('button', { name: '订单来源 品牌小程序' })).toBeVisible()
  await page.getByPlaceholder('请输入订单编号/买家联系方式').fill('138')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '订单来源 请选择订单来源' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入订单编号/买家联系方式')).toHaveValue('')
})
