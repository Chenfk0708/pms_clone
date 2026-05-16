import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/statementOrder matches captured brand mini-program order default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/statementOrder'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '品牌小程序订单' })).toHaveClass(/is-active/)

  const filters = page.getByLabel('品牌小程序订单筛选')
  await expect(filters).toContainText('全部门店')
  await expect(filters).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()

  const table = page.getByLabel('品牌小程序订单表格')
  for (const heading of [
    '订单号',
    '客户信息',
    '产品类型',
    '产品名称',
    '预订时间',
    '渠道',
    '应付金额',
    '实付金额',
    '优惠金额',
    '退款金额',
    '支付手续费',
    '平台服务费',
    '全员分销佣金',
    '支付方式',
    '结算金额',
  ]) {
    await expect(table).toContainText(heading)
  }
  await expect(table).toContainText('暂无数据')
})

test('/statistics/statementOrder keeps captured query, export and chat collapse states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/statementOrder'))

  await page.getByRole('button', { name: /天落会宿公寓/ }).click()
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('已按当前门店查询品牌小程序订单')
  await page.getByRole('button', { name: '导出明细' }).click()
  await expect(page.getByRole('status')).toContainText('已生成品牌小程序订单导出任务')

  await page.getByLabel('收起会话').click()
  await expect(page.getByLabel('打开全部会话')).toBeVisible()
  await expect(page.getByLabel('品牌小程序订单表格')).toContainText('暂无数据')
})
