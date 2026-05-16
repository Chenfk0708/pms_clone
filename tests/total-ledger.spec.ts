import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/totalLedger matches captured total ledger default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/totalLedger'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '收支汇总' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('收支汇总筛选')).toContainText('全部门店')
  await expect(page.getByLabel('收支汇总筛选')).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-13')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-13')
  await expect(page.getByRole('button', { name: '昨天' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '今天' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上周' })).toBeVisible()
  await expect(page.getByRole('button', { name: '本周' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上月' })).toBeVisible()
  await expect(page.getByRole('button', { name: '本月' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导 出' })).toBeVisible()

  await expect(page.getByLabel('账本概括')).toContainText('净收入')
  await expect(page.getByLabel('账本概括')).toContainText('¥ 815.26')
  await expect(page.getByLabel('账本概括')).toContainText('总收入：¥ 815.26')
  await expect(page.getByLabel('账本概括')).toContainText('总支出：¥ 0')
  await expect(page.getByLabel('收入占比')).toBeVisible()
  await expect(page.getByLabel('支出占比')).toBeVisible()

  const table = page.getByLabel('收支汇总表格')
  await expect(table).toContainText('日期')
  await expect(table).toContainText('平台代收')
  await expect(table).toContainText('合计')
  await expect(table).toContainText('815.26')
  await expect(table).toContainText('2026-05-13')
  await expect(page.getByText('第 1-2 条/总共 2 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '1' })).toHaveClass(/is-current/)
})

test('/statistics/totalLedger supports captured filters, collapse and export states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/totalLedger'))

  await page.getByLabel('开始日期').click()
  await expect(page.getByRole('dialog', { name: '日期选择' })).toContainText('2026年')
  await expect(page.getByRole('dialog', { name: '日期选择' })).toContainText('5月')
  await expect(page.getByRole('dialog', { name: '日期选择' })).toContainText('6月')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '今天' }).click()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-14')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-14')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-13')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-13')

  await page.getByRole('button', { name: '收 起' }).click()
  await expect(page.getByRole('button', { name: '展 开' })).toBeVisible()
  await expect(page.getByLabel('收支汇总筛选')).toContainText('全部门店')
  await page.getByRole('button', { name: '展 开' }).click()
  await expect(page.getByRole('button', { name: '收 起' })).toBeVisible()

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('status')).toContainText('已生成收支汇总导出任务')
})
