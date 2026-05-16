import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/Comprehensive renders captured comprehensive monthly list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/Comprehensive'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '综合月报' })).toHaveClass(/is-active/)

  await expect(page.getByRole('heading', { name: '综合月报' })).toBeVisible()
  const table = page.getByLabel('综合月报列表')
  await expect(table).toContainText('时段')
  await expect(table).toContainText('统计周期')
  await expect(table).toContainText('营业收入')
  await expect(table).toContainText('入住率OCC')
  await expect(table).toContainText('平均房价ADR')
  await expect(table).toContainText('平均客房收益REVPAR')
  await expect(table).toContainText('生成时间')
  await expect(table).toContainText('生成人')

  await expect(table).toContainText('2026年04月')
  await expect(table).toContainText('20260401 - 20260430')
  await expect(table).toContainText('21843.69')
  await expect(table).toContainText('29.17%')
  await expect(table).toContainText('624.11')
  await expect(table).toContainText('182.05')
  await expect(table).toContainText('系统自动')
  await expect(page.getByRole('button', { name: '查看报表' })).toHaveCount(4)
  await expect(page.getByText('第 1-4 条/总共 4 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()
})

test('/statistics/Comprehensive opens captured monthly detail report', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/Comprehensive'))

  await page.getByRole('row', { name: /2026年04月/ }).getByRole('button', { name: '查看报表' }).click()

  await expect(page).toHaveURL(/\/statistics\/Comprehensive\/Monthly\?startDate=2026-04-01&endDate=2026-04-30/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '综合月报' })).toHaveClass(/is-active/)
  await expect(page.getByText('综合月报 /')).toBeVisible()
  await expect(page.getByText('综合月报表（住宿）')).toBeVisible()
  await expect(page.getByRole('button', { name: '更新报告' })).toBeVisible()
  await expect(page.getByRole('button', { name: '打 印' })).toBeVisible()

  const detail = page.getByLabel('综合月报固化详情')
  await expect(detail).toContainText('综合月报表（固化）')
  await expect(detail).toContainText('营业月份：')
  await expect(detail).toContainText('2026年05月')
  await expect(detail).toContainText('统计周期：')
  await expect(detail).toContainText('2026-05-14 ~2026-05-14')
  await expect(detail).toContainText('生成时间：')
  await expect(detail).toContainText('营业数据')
  await expect(detail).toContainText('经营指标')
  await expect(detail).toContainText('房费（含佣）')
  await expect(detail).toContainText('总营收（减佣）')
  await expect(detail).toContainText('入住率OCC')
  await expect(detail).toContainText('平均客房收益RevPar')
  await expect(detail).toContainText('暂无数据')
})
