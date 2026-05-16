import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/mallManagement/distribution matches captured commission settings state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/distribution'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '全员营销', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '全员营销' })).toHaveClass(/is-active/)
  await expect(page.getByRole('tab', { name: '佣金设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '分销数据' })).toBeVisible()

  await expect(page.getByRole('button', { name: '类型 日历房' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入日历房/预售券名称')).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '邀请分销员' })).toBeVisible()

  await expect(page.getByLabel('全员营销佣金设置表格').locator('.full-marketing-table__head > div')).toHaveText([
    '房型名称',
    '层级',
    '间接佣金(比率)',
    '直接佣金(比率)',
    '是否开启分销',
    '操作',
  ])
  await expect(page.getByLabel('全员营销佣金设置表格')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByLabel('全员营销佣金设置表格')).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(page.getByLabel('全员营销佣金设置表格')).toContainText('天落大床电竞套间')
  await expect(page.getByLabel('全员营销佣金设置表格')).toContainText('观影大床房')
  await expect(page.getByText('第 1-4 条/总共 4 条')).toBeVisible()

  await page.getByRole('button', { name: '类型 日历房' }).click()
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('日历房')
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('预售券')
  await page.getByRole('option', { name: '预售券' }).click()
  await expect(page.getByRole('button', { name: '类型 预售券' })).toBeVisible()
  await page.getByPlaceholder('请输入日历房/预售券名称').fill('天落')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '类型 日历房' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入日历房/预售券名称')).toHaveValue('')
})

test('/mallManagement/distribution supports captured data tab and dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/distribution'))

  await page.getByRole('tab', { name: '分销数据' }).click()
  await expect(page.getByRole('tab', { name: '分销数据' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('分销数据日期范围').getByPlaceholder('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('分销数据日期范围').getByPlaceholder('结束日期')).toHaveValue('2026-05-31')
  await expect(page.getByRole('button', { name: '筛选当月' })).toBeVisible()
  await expect(page.getByText('分销营业额')).toBeVisible()
  await expect(page.getByLabel('分销数据汇总').getByText('提成支出')).toBeVisible()
  await expect(page.getByLabel('日历房、预售券销售汇总').locator('.full-marketing-summary-table__head > div')).toHaveText([
    '房型名称',
    '销量',
    '营业额',
    '提成支出',
  ])
  await expect(page.getByLabel('分销员汇总').locator('.full-marketing-summary-table__head > div')).toHaveText([
    '分销员',
    '销量',
    '营业额',
    '提成支出',
  ])
  await expect(page.getByRole('button', { name: '+生成分销二维码' })).toBeVisible()

  await page.getByRole('tab', { name: '佣金设置' }).click()
  await page.getByRole('button', { name: '邀请分销员' }).click()
  await expect(page.getByRole('dialog', { name: '邀请分销员' })).toContainText('请先开通品牌小程序后再设置分销。')
  await expect(page.getByRole('button', { name: '联系客服' })).toBeVisible()
  await expect(page.getByRole('button', { name: '前往开通' })).toBeVisible()
  await page.getByRole('button', { name: '关闭邀请分销员' }).click()

  await page.getByRole('button', { name: '编辑 顶层套房（浴缸巨幕电竞麻将）' }).click()
  await expect(page.getByRole('dialog', { name: '编辑分销计划' })).toContainText('商品名称： 顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByRole('dialog', { name: '编辑分销计划' })).toContainText('按客人实付金额比例支付佣金')
  await expect(page.getByLabel('一级分销')).toBeChecked()
  await expect(page.getByText('多级分销')).toBeVisible()
  await expect(page.getByPlaceholder('输入比例')).toHaveCount(3)
  await expect(page.getByLabel('所有人')).toBeChecked()
  await expect(page.getByText('状态')).toBeVisible()
  await expect(page.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(page.getByRole('button', { name: '提 交' })).toBeVisible()
})
