import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/orderLedger matches captured order ledger default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/orderLedger'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '收支明细' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '昨天' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-13')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-13')

  const filters = page.getByLabel('收支明细筛选')
  await expect(filters).toContainText('类型：')
  await expect(page.getByRole('button', { name: '类型 全部类型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '来源 全部来源' })).toBeVisible()
  await expect(page.getByRole('button', { name: '项目 请选择项目' })).toBeVisible()
  await expect(page.getByPlaceholder('输入支付流水号/订单号')).toBeVisible()
  await expect(page.getByRole('button', { name: '关联房间 全部' })).toBeVisible()
  await expect(page.getByRole('button', { name: '支付方式 请选择支付方式' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导 出' })).toBeVisible()

  const summary = page.getByLabel('账本概括')
  await expect(summary).toContainText('净收入')
  await expect(summary).toContainText('¥ 815.26')
  await expect(summary).toContainText('总收入')
  await expect(summary).toContainText('总支出')
  await expect(summary).toContainText('¥ 0')

  const ledgerTable = page.getByLabel('账本明细表格')
  await expect(ledgerTable).toContainText('类型')
  await expect(ledgerTable).toContainText('来源')
  await expect(ledgerTable).toContainText('订单号')
  await expect(ledgerTable).toContainText('支付流水号')
  await expect(ledgerTable).toContainText('关联房型/房间')
  await expect(ledgerTable).toContainText('2054409001821356034')
  await expect(ledgerTable).toContainText('天落大床电竞套间-1')
  await expect(ledgerTable).toContainText('第 1-3 条/总共 3 条')
})

test('/statistics/orderLedger supports captured dropdowns, collapse and detail states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/orderLedger'))

  await page.getByRole('button', { name: '类型 全部类型' }).click()
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('收入')
  await expect(page.getByRole('listbox', { name: '类型选项' })).toContainText('支出')
  await page.getByRole('option', { name: '收入' }).click()
  await expect(page.getByRole('button', { name: '类型 收入' })).toBeVisible()

  await page.getByRole('button', { name: '来源 全部来源' }).click()
  await expect(page.getByRole('listbox', { name: '来源选项' })).toContainText('住宿订单')
  await expect(page.getByRole('listbox', { name: '来源选项' })).toContainText('记一笔')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '支付方式 请选择支付方式' }).click()
  await expect(page.getByRole('listbox', { name: '支付方式选项' })).toContainText('平台代收')
  await expect(page.getByRole('listbox', { name: '支付方式选项' })).toContainText('暂未收款')
  await page.getByRole('option', { name: '暂未收款' }).click()
  await expect(page.getByRole('button', { name: '支付方式 暂未收款' })).toBeVisible()

  await page.getByRole('button', { name: '关联房间 全部' }).click()
  const roomDialog = page.getByRole('dialog', { name: '选择房间' })
  await expect(roomDialog).toBeVisible()
  await expect(roomDialog.getByPlaceholder('输入房间/房型名称')).toBeVisible()
  await roomDialog.getByRole('button', { name: '取 消' }).click()
  await expect(roomDialog).toHaveCount(0)

  await page.getByLabel('收起会话').click()
  await expect(page.getByLabel('打开全部会话')).toBeVisible()
  await expect(page.getByLabel('收支明细筛选')).toContainText('类型：')
  await page.getByLabel('打开全部会话').click()
  await expect(page.getByLabel('全部会话')).toContainText('全部会话')
  await expect(page.getByRole('button', { name: '类型 收入' })).toBeVisible()

  await page.getByRole('button', { name: '查看详情' }).first().click()
  const paymentDialog = page.getByRole('dialog', { name: '收款款项' })
  await expect(paymentDialog).toBeVisible()
  await expect(paymentDialog).toContainText('收款记录')
  await expect(paymentDialog).toContainText('平台代收')
  await expect(paymentDialog).toContainText('10085200031107')
  await expect(paymentDialog).toContainText('退款')
  await expect(page.getByLabel('订单详情抽屉')).toContainText('天落大床电竞套间[LPS11GM000](1)')
  await expect(page.getByLabel('订单详情抽屉')).toContainText('房费(减佣): ¥369.75')
})
