import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/ledger matches captured ledger entry default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/ledger'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '记一笔明细' })).toHaveClass(/is-active/)

  const filters = page.getByLabel('记一笔明细筛选')
  await expect(filters).toContainText('全部门店')
  await expect(filters).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(page.getByRole('button', { name: '本月' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-31')
  await expect(page.getByRole('button', { name: '类型 全部类型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型 请选择房型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置筛选' })).toBeVisible()
  await expect(page.getByRole('button', { name: '报表导出' })).toBeVisible()

  const summary = page.getByLabel('账本概括')
  await expect(summary).toContainText('收入(元)')
  await expect(summary).toContainText('支出 (元)')
  await expect(summary).toContainText('¥ 0.00')
  await expect(summary).toContainText('¥0.00')

  const table = page.getByLabel('账本明细表格')
  await expect(table).toContainText('类型')
  await expect(table).toContainText('项目')
  await expect(table).toContainText('金额')
  await expect(table).toContainText('支付方式')
  await expect(table).toContainText('时间')
  await expect(table).toContainText('关联房型/房间')
  await expect(table).toContainText('备注')
  await expect(table).toContainText('操作人')
  await expect(table).toContainText('操作')
  await expect(table).toContainText('暂无数据')
})

test('/statistics/ledger supports captured dropdown, date and chat states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/ledger'))

  await page.getByRole('button', { name: '类型 全部类型' }).click()
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('全部类型')
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('收入')
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('支出')
  await page.getByRole('option', { name: '收入' }).click()
  await expect(page.getByRole('button', { name: '类型 收入' })).toBeVisible()

  await page.getByRole('button', { name: '房型 请选择房型' }).click()
  await expect(page.getByRole('listbox', { name: '房型选项' })).toContainText('观影大床房')
  await page.keyboard.press('Escape')

  await page.getByLabel('开始日期').click()
  const dateDialog = page.getByRole('dialog', { name: '日期选择' })
  await expect(dateDialog).toContainText('2026年')
  await expect(dateDialog).toContainText('5月')
  await expect(dateDialog).toContainText('6月')
  await page.keyboard.press('Escape')

  await page.getByLabel('收起会话').click()
  await expect(page.getByLabel('打开全部会话')).toBeVisible()
  await page.getByLabel('打开全部会话').click()
  await expect(page.getByLabel('全部会话')).toContainText('全部会话')

  await page.getByRole('button', { name: '重置筛选' }).click()
  await expect(page.getByRole('button', { name: '类型 全部类型' })).toBeVisible()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-01')
  await page.getByRole('button', { name: '报表导出' }).click()
  await expect(page.getByRole('status')).toContainText('已生成记一笔明细导出任务')
})
