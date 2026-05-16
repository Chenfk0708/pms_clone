import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/baobiao--yushouquan-shuju--yushouquan-hexiao-mingxi',
)

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/statistics/preSaleCouponMall renders the captured presale coupon statistics state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/preSaleCouponMall'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '预售券核销明细' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '预售券核销明细' })).toBeAttached()

  await expect(page.getByRole('radio', { name: '全部门店' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('radio', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByPlaceholder('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByPlaceholder('结束日期')).toHaveValue('2026-05-31')
  await expect(page.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '预售券类型 请选择' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入商品编号/商品名称')).toBeVisible()

  for (const heading of [
    '商品名称',
    '成交券数',
    '交易金额',
    '成交率',
    '核销券数',
    '核销金额',
    '核销率',
    '退款券数',
    '退款金额',
    '退款率',
    '操作',
  ]) {
    await expect(page.getByRole('columnheader', { name: heading })).toBeVisible()
  }
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.screenshot({
    path: path.join(artifactRoot, 'default-clone-route.png'),
    fullPage: true,
  })
})

test('/statistics/preSaleCouponMall keeps captured filters, date panel, query, and description interactions local', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/preSaleCouponMall'))

  await page.getByRole('button', { name: '渠道 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '渠道选项' })).toContainText('暂无数据')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '预售券类型 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '预售券类型选项' })).toContainText('暂无数据')
  await page.keyboard.press('Escape')

  await page.getByPlaceholder('开始日期').click()
  await expect(page.getByRole('dialog', { name: '统计日期面板' })).toContainText('2026年5月')
  await expect(page.getByRole('dialog', { name: '统计日期面板' })).toContainText('2026年6月')
  await expect(page.getByRole('button', { name: '本月' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByPlaceholder('请输入商品编号/商品名称').fill('205')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('已按当前条件查询')
  await expect(page.getByPlaceholder('请输入商品编号/商品名称')).toHaveValue('205')
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('请输入商品编号/商品名称')).toHaveValue('')

  await page.getByRole('button', { name: '说 明' }).click()
  await expect(page.getByRole('dialog', { name: '字段说明' })).toContainText('成交券数')
  await expect(page.getByRole('dialog', { name: '字段说明' })).toContainText('商品的总成交券数')
  await expect(page.getByRole('dialog', { name: '字段说明' })).toContainText('成交券数÷总券数 x 100%')
  await page.getByRole('button', { name: '关闭字段说明' }).click()
  await expect(page.getByRole('dialog', { name: '字段说明' })).toBeHidden()
})
