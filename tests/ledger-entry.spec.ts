import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/ledger renders ledger data from the page service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/ledger'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '记一笔明细' })).toHaveClass(/is-active/)
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-state', 'success')
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"type":"all"/)

  const filters = page.getByLabel('记一笔明细筛选')
  await expect(filters).toContainText('全部门店')
  await expect(filters).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(page.getByRole('button', { name: '本月' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '开始日期' })).toContainText('2026-05-01')
  await expect(page.getByRole('button', { name: '结束日期' })).toContainText('2026-05-31')
  await expect(page.getByRole('button', { name: '类型 全部类型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型 请选择房型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重置筛选' })).toBeVisible()
  await expect(page.getByRole('button', { name: '报表导出' })).toBeVisible()

  const summary = page.getByLabel('账本概括')
  await expect(summary).toContainText('收入(元)')
  await expect(summary).toContainText('支出 (元)')
  await expect(summary).toContainText('净收入：¥ 2072.00')
  await expect(page.getByRole('button', { name: '查看收入(元)详情' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查看支出 (元)详情' })).toBeVisible()

  const table = page.getByLabel('账本明细表格')
  await expect(table).toContainText('订单房费入账')
  await expect(table).toContainText('保洁服务采购')
  await expect(table).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(table).toContainText('微信支付')
  await expect(table).toContainText('系统自动入账')

  const visibleText = await page.locator('body').innerText()
  expect(visibleText).not.toMatch(/mock 数据|未接入|阻塞|后端未就绪|后端接口未完成/)
})

test('/statistics/ledger supports filters, date selection, export and detail feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/ledger'))

  await page.getByRole('button', { name: '类型 全部类型' }).click()
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('全部类型')
  await page.getByRole('option', { name: '支出' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"type":"expense"/)
  await expect(page.getByRole('status')).toContainText('已更新类型筛选')

  await page.getByRole('button', { name: '房型 请选择房型' }).click()
  await expect(page.getByRole('listbox', { name: '房型选项' })).toContainText('观影大床房')
  await page.getByRole('option', { name: '顶层套房（浴缸巨幕电竞麻将）' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /1796425098965729282/)

  await page.getByRole('button', { name: '开始日期' }).click()
  const dateDialog = page.getByRole('dialog', { name: '日期选择' })
  await expect(dateDialog).toContainText('2026年5月')
  await page.getByRole('button', { name: '选择 2026-05-16' }).click()
  await page.getByRole('button', { name: '选择 2026-05-18' }).click()
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"startDate":"2026-05-16"/)
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"endDate":"2026-05-18"/)

  await page.getByRole('button', { name: '门店设置' }).click()
  await expect(page.getByRole('dialog', { name: '门店设置' })).toContainText('前往收支明细')
  await page.getByRole('button', { name: '关闭门店设置' }).click()

  await page.getByRole('button', { name: '查看收入(元)详情' }).click()
  await expect(page.getByRole('dialog', { name: '收入(元)详情' })).toContainText('账本分页接口')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByRole('button', { name: /查看明细 ledger-/ }).first().click()
  await expect(page.getByRole('dialog', { name: '账本明细详情' })).toContainText('支付方式')
  await page.getByRole('button', { name: '关闭明细详情' }).click()

  await page.getByRole('button', { name: '报表导出' }).click()
  await expect(page.getByRole('status')).toContainText('已生成记一笔明细导出任务')

  await page.getByRole('button', { name: '重置筛选' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"type":"all"/)
  await expect(page.getByRole('button', { name: '房型 请选择房型' })).toBeVisible()
})

test('/statistics/ledger exposes empty and error states as business feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/statistics/ledger?mockState=empty'))
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByLabel('账本明细表格')).toContainText('暂无数据')
  await expect(page.getByLabel('账本概括')).toContainText('净收入：¥ 0.00')

  await page.goto(appUrl('/statistics/ledger?mockState=error'))
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert')).toContainText('记一笔明细数据加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('/statistics/ledger coordinates route handoff and survives reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/ledger'))

  await page.getByRole('button', { name: '查看收入(元)详情' }).click()
  await page.getByRole('link', { name: '查看收支明细' }).click()
  await expect(page).toHaveURL(/\/statistics\/orderLedger$/)

  await page.goto(appUrl('/statistics/ledger'))
  await page.getByRole('button', { name: '门店设置' }).click()
  await page.getByRole('link', { name: '前往收支汇总' }).click()
  await expect(page).toHaveURL(/\/statistics\/totalLedger$/)

  await page.goto(appUrl('/statistics/ledger'))
  await page.getByRole('button', { name: '类型 全部类型' }).click()
  await page.getByRole('option', { name: '收入' }).click()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-request', /"type":"income"/)
  await page.reload()
  await expect(page.getByRole('button', { name: '类型 全部类型' })).toBeVisible()
  await expect(page.locator('#ledger-entry-diagnostics')).toHaveAttribute('data-provider', 'mock')
})
