import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/customer/list matches captured customer list filters, table, and add dialog', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/list'))

  await expect(page.getByRole('link', { name: '客户列表' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByText('客户搜索')).toBeVisible()
  await expect(page.getByRole('button', { name: '手机号' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入')).toBeVisible()
  await expect(page.getByRole('button', { name: '客户状态 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '客户身份 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出数据' })).toBeVisible()
  await expect(page.getByRole('button', { name: '添加客户' })).toBeVisible()

  await expect(page.getByLabel('客户列表表格').locator('.customer-list-table__head > div')).toHaveText([
    '客户信息',
    '客户编号',
    '客户渠道',
    '会员等级',
    '客户标签',
    '最近消费金额',
    '累计消费次数',
    '累计消费金额',
    '客单价',
    '是否添加企微',
    '是否加微信',
    '是否加群',
    '成为客户时间',
    '成为会员时间',
    '最近消费时间',
    '最近跟进时间',
    '操作',
  ])
  await expect(page.getByLabel('客户列表表格')).toContainText('任清明')
  await expect(page.getByLabel('客户列表表格')).toContainText('1810493396951339010')
  await expect(page.getByLabel('客户列表表格')).toContainText('第 1-20 条/总共 588 条')

  await page.getByRole('button', { name: '展开' }).click()
  const filterPanel = page.getByLabel('客户列表筛选')
  await expect(filterPanel.getByRole('button', { name: /^收起/ })).toBeVisible()
  await expect(filterPanel.getByText('会员等级:')).toBeVisible()
  await expect(filterPanel.getByText('是否添加企微:')).toBeVisible()
  await expect(filterPanel.getByText('成为客户时间:')).toBeVisible()
  await expect(filterPanel.getByText('最近消费金额:')).toBeVisible()

  await page.getByRole('button', { name: '添加客户' }).click()
  await expect(page.getByRole('dialog', { name: '添加客户' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '添加客户' })).toContainText('手机号')
  await expect(page.getByRole('dialog', { name: '添加客户' })).toContainText('客户渠道')
  await expect(page.getByRole('dialog', { name: '添加客户' })).toContainText('成为客户时间')
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
})
