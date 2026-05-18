import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openCustomerList(page, scenario: 'success' | 'empty' | 'error' = 'success') {
  await page.addInitScript((mode) => {
    window.localStorage.setItem('pms.customerList.scenario', mode)
    window.localStorage.setItem('pms.customerList.provider', 'mock')
  }, scenario)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/list'))
}

test('/customer/list loads through the customer list provider contract', async ({ page }) => {
  await openCustomerList(page)

  await expect(page.getByRole('link', { name: 'SCRM' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '客户列表' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()

  await expect(page.getByText('客户搜索')).toBeVisible()
  await expect(page.getByRole('button', { name: '手机号' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出数据' })).toBeVisible()
  await expect(page.getByRole('button', { name: '添加客户' })).toBeVisible()
  await expect(page.getByLabel('客户列表表格')).toContainText('任清明')
  await expect(page.getByLabel('客户列表表格')).toContainText('1810493396951339010')
  await expect(page.getByLabel('客户列表表格')).toContainText('第 1-20 条/总共 589 条')

  const contract = page.getByTestId('customer-list-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-endpoint', '/member/page/get')
  await expect(contract).toContainText('"memberSearchType":"mobile"')
  await expect(contract).toContainText('"pageNum":1')
  await expect(contract).toContainText('"pageSize":20')
})

test('/customer/list refreshes data from filters and exposes actionable feedback', async ({ page }) => {
  await openCustomerList(page)

  await page.getByPlaceholder('请输入').first().fill('13141204230')
  await page.getByRole('button', { name: '展开' }).click()
  await page.getByRole('button', { name: '客户状态 请选择' }).click()
  await page.getByRole('option', { name: '正常' }).click()
  await page.getByRole('button', { name: '会员等级 请选择' }).click()
  await page.getByRole('option', { name: '普通会员' }).click()
  await page.getByRole('button', { name: '查 询' }).click()

  const contract = page.getByTestId('customer-list-contract')
  await expect(contract).toContainText('"keyword":"13141204230"')
  await expect(contract).toContainText('"status":"NORMAL"')
  await expect(contract).toContainText('"memberCardId":"1796067693727473665"')
  await expect(page.getByLabel('客户列表表格')).toContainText('任清明')

  await page.getByRole('checkbox', { name: '选择任清明' }).check()
  await expect(page.getByRole('status')).toContainText('已选择 1 位客户')

  await page.getByRole('button', { name: '导出数据' }).click()
  await expect(page.getByRole('status')).toContainText('客户导出任务已创建')

  await page.getByRole('button', { name: '详情' }).first().click()
  await expect(page.getByRole('dialog', { name: '客户详情' })).toContainText('任清明')
  await expect(page.getByRole('dialog', { name: '客户详情' })).toContainText('累计消费 637.20')
  await page.getByRole('button', { name: '关闭客户详情' }).click()

  await page.getByRole('button', { name: '更多' }).first().click()
  await expect(page.getByRole('menu', { name: '客户更多操作' })).toBeVisible()
  await page.getByRole('menuitem', { name: '记录跟进' }).click()
  await expect(page.getByRole('status')).toContainText('跟进记录已保存')

  await page.getByRole('button', { name: '添加客户' }).click()
  await page.getByRole('button', { name: '保 存' }).click()
  await expect(page.getByRole('alert')).toContainText('请输入手机号')
  await page.getByLabel('手机号').fill('13900001111')
  await page.getByLabel('姓名').fill('新客户')
  await page.getByRole('button', { name: '保 存' }).click()
  await expect(page.getByRole('status')).toContainText('客户已保存')
})

test('/customer/list handles empty provider responses without collapsing the table', async ({ page }) => {
  await openCustomerList(page, 'empty')

  await expect(page.getByLabel('客户列表表格')).toBeVisible()
  await expect(page.getByText('暂无符合条件的客户')).toBeVisible()
  await expect(page.getByTestId('customer-list-contract')).toContainText('"total":0')
  await expect(page.getByRole('button', { name: '添加客户' })).toBeEnabled()
})

test('/customer/list exposes provider errors and retries the same contract', async ({ page }) => {
  await openCustomerList(page, 'error')

  await expect(page.getByRole('alert')).toContainText('客户列表加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()

  await page.evaluate(() => window.localStorage.setItem('pms.customerList.scenario', 'success'))
  await page.getByRole('button', { name: '重新加载' }).click()

  await expect(page.getByLabel('客户列表表格')).toContainText('任清明')
  await expect(page.getByTestId('customer-list-contract')).toContainText('"pageNum":1')
})
