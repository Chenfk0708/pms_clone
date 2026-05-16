import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotDir = path.resolve(
  __dirname,
  '../artifacts/screenshots/dingdan--zhusu-dingdan--zhusu-dingdan',
)

test('/order/house-order/list matches captured lodging order table', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/order/house-order/list')

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.order-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: '住宿订单', level: 1 })).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: '订单快捷筛选' }).getByRole('radio')).toHaveCount(10)
  await expect(page.getByRole('radio', { name: '全部' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByPlaceholder('输入订单号/渠道订单号/房间号/姓名/手机号')).toBeVisible()
  await expect(page.getByRole('button', { name: '重置筛选' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()
  await expect(page.getByRole('button', { name: '录入订单' })).toBeVisible()

  const table = page.getByRole('table', { name: '住宿订单列表' })
  await expect(table.getByRole('columnheader')).toHaveCount(24)
  await expect(table).toContainText('2054409001821356034')
  await expect(table).toContainText('路客云聚合')
  await expect(table).toContainText('陈崇科')
  await expect(table).toContainText('+8618319045566')
  await expect(table).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(table).toContainText('2052953037821870082')
  await expect(table).toContainText('未排房')
  await expect(table.getByRole('button', { name: '排房' }).first()).toBeVisible()
  await expect(page.getByText('20 条/页')).toBeVisible()

  await page.screenshot({
    path: path.join(screenshotDir, 'default-clone-route.png'),
    fullPage: true,
  })
})

test('/order/house-order/list supports captured search and detail interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/order/house-order/list')

  await page.getByRole('button', { name: '展开' }).click()
  await expect(page.locator('.order-advanced-filters').getByText('订单状态')).toBeVisible()
  await expect(page.locator('.order-advanced-filters').getByText('入住日期')).toBeVisible()
  await page.getByLabel('住宿订单筛选').getByRole('button', { name: '收起' }).click()
  await expect(page.getByText('订单状态')).toHaveCount(1)

  await page.getByPlaceholder('输入订单号/渠道订单号/房间号/姓名/手机号').fill('张')
  await expect(page.getByRole('row').filter({ hasText: '2054340491892084738' })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: '2054409001821356034' })).toHaveCount(0)

  await page.getByRole('button', { name: '详情' }).first().click()
  const detail = page.getByRole('dialog', { name: '订单详情' })
  await expect(detail).toBeVisible()
  await expect(detail).toContainText('全日房')
  await expect(detail).toContainText('订单信息')
  await expect(detail).toContainText('渠道信息')
  await expect(detail).toContainText('操作日志')
  await expect(detail).toContainText('张张')
  await expect(detail).toContainText('渠道单号：')
  await expect(detail).toContainText('1128147908092485')
  await expect(detail).toContainText('观影大床房（房间1）')
  await expect(detail).toContainText('2026.05.13-2026.05.14 1晚')
  await expect(detail).toContainText('房费(减佣):')
  await expect(detail).toContainText('¥163.94')
  await expect(detail).toContainText('订单总收入:')
  await expect(detail).toContainText('¥211.00')
  await expect(detail.getByRole('button', { name: '更多操作' })).toBeVisible()
  await expect(detail.getByRole('button', { name: '收 款' })).toBeVisible()
  await expect(detail.getByRole('button', { name: '续 住' })).toBeVisible()
  await expect(detail.getByRole('button', { name: '入住', exact: true })).toBeVisible()
  await expect(detail.getByRole('button', { name: '退房', exact: true })).toBeVisible()

  await page.screenshot({
    path: path.join(screenshotDir, 'detail-clone-route.png'),
    fullPage: true,
  })
})
