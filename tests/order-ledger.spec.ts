import { expect, test, type Page } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

async function openOrderLedger(page: Page, search = '') {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl(`/statistics/orderLedger${search}`))
}

async function readDiagnosticsRequest(page: Page) {
  const raw = await page.locator('#order-ledger-diagnostics').getAttribute('data-request')
  return raw ? JSON.parse(raw) : null
}

test('/statistics/orderLedger uses the unified service layer and real route shell', async ({ page }) => {
  await openOrderLedger(page)
  await expect(page.getByText('正在加载收支明细数据...')).toBeVisible()

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '收支明细' })).toHaveClass(/is-active/)
  await expect(page.locator('#order-ledger-diagnostics')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('#order-ledger-diagnostics')).toHaveAttribute('data-state', 'success')
  await expect(page.locator('.order-ledger-filter')).toContainText('全部门店')
  await expect(page.locator('.order-ledger-filter')).toContainText('支付方式')
  await expect(page.getByRole('button', { name: '导出' })).toBeEnabled()
  await expect(page.locator('.order-ledger-summary')).toContainText('净收入')
  await expect(page.locator('.order-ledger-summary')).toContainText('1002.54')
  await expect(page.locator('.order-ledger-table-section')).toContainText('2056357481704235009')
  await expect(page.locator('.order-ledger-table-section')).toContainText('总裁套间（桑拿浴缸露台电竞麻将）-房间1')
  await expect(page.getByLabel('上一页')).toBeDisabled()
  await expect(page.getByLabel('下一页')).toBeDisabled()
})

test('/statistics/orderLedger updates request parameters through visible filters', async ({ page }) => {
  await openOrderLedger(page)

  await page.getByRole('button', { name: '类型 全部类型' }).click()
  await page.getByRole('option', { name: '支出' }).click()
  await expect.poll(() => readDiagnosticsRequest(page)).toMatchObject({
    isIncome: 0,
    paymentTypeIds: [],
    paymentWayIds: [],
    roomIds: [],
    poiIds: [],
  })
  await expect(page.getByText('当前筛选条件下暂无收支流水')).toBeVisible()

  await page.getByRole('button', { name: '重置' }).click()
  await expect.poll(() => readDiagnosticsRequest(page)).toMatchObject({ isIncome: null, type: null })

  await page.getByRole('button', { name: '来源 全部来源' }).click()
  await page.getByRole('option', { name: '住宿订单' }).click()
  await expect.poll(() => readDiagnosticsRequest(page)).toMatchObject({ type: 1 })

  await page.getByRole('button', { name: '类型 全部类型' }).click()
  await page.getByRole('option', { name: '收入' }).click()
  await page.getByRole('button', { name: '项目 请选择项目' }).click()
  await page.getByRole('checkbox', { name: '房费' }).check()
  await page.getByRole('button', { name: '确定项目' }).click()
  await expect.poll(() => readDiagnosticsRequest(page)).toMatchObject({ isIncome: 1, paymentTypeIds: ['1'] })

  await page.getByRole('button', { name: '支付方式 请选择支付方式' }).click()
  await page.getByRole('option', { name: '微信' }).click()
  await expect.poll(() => readDiagnosticsRequest(page)).toMatchObject({ paymentWayIds: ['2'] })

  await page.getByRole('button', { name: '关联房间 全部' }).click()
  await expect(page.getByRole('dialog', { name: '选择房间' })).toBeVisible()
  await page.getByRole('checkbox', { name: '总裁套间（桑拿浴缸露台电竞麻将） 房间1' }).check()
  await page.getByRole('button', { name: '确定房间' }).click()
  await expect.poll(() => readDiagnosticsRequest(page)).toMatchObject({ roomIds: ['1796425099544543234'] })

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '收支明细操作反馈' })).toContainText('导出任务已创建')
})

test('/statistics/orderLedger opens detail feedback and coordinates project routes', async ({ page }) => {
  await openOrderLedger(page)

  await page.getByRole('button', { name: '查看详情' }).first().click()
  await expect(page.locator('.order-ledger-drawer')).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(page.getByRole('dialog', { name: '收款记录' })).toContainText('空空如也')

  await page.getByRole('button', { name: '更多操作' }).click()
  await expect(page.getByRole('button', { name: '查看订单页' })).toBeVisible()
  await page.getByRole('button', { name: '查看订单页' }).click()
  await expect(page).toHaveURL(/\/order\/house-order\/list$/)

  await openOrderLedger(page)
  await page.getByRole('button', { name: '查看详情' }).first().click()
  await page.getByRole('button', { name: '更多操作' }).click()
  await page.getByRole('button', { name: '查看房态页' }).click()
  await expect(page).toHaveURL(/\/statistics\/roomSituation$/)
})

test('/statistics/orderLedger exposes empty and error states without silent fallback', async ({ page }) => {
  await openOrderLedger(page, '?mockState=empty')
  await expect(page.locator('#order-ledger-diagnostics')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByText('当前筛选条件下暂无收支流水')).toBeVisible()
  await expect(page.locator('.order-ledger-summary')).toContainText('0.00')

  await openOrderLedger(page, '?mockState=error')
  await expect(page.locator('#order-ledger-diagnostics')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert', { name: '收支明细错误反馈' })).toContainText('收支明细数据加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
