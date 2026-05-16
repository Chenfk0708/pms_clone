import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/shift/record matches captured shift record default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/shift/record'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '交接班' })).toHaveClass(/is-active/)

  const filters = page.getByLabel('交接班筛选')
  await expect(filters).toContainText('交班日期')
  await expect(page.getByLabel('开始日期')).toHaveValue('')
  await expect(page.getByLabel('结束日期')).toHaveValue('')
  await expect(filters.getByRole('button', { name: '交班人 请选择' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '接班人 请选择' })).toBeVisible()
  await expect(filters.getByRole('button', { name: '设 置' })).toBeVisible()

  const table = page.getByLabel('交接班表格')
  await expect(table).toContainText('交班日期')
  await expect(table).toContainText('交班班次')
  await expect(table).toContainText('交班人')
  await expect(table).toContainText('交班时间')
  await expect(table).toContainText('接班人')
  await expect(table).toContainText('接班时间')
  await expect(table).toContainText('交接状态')
  await expect(table).toContainText('交班备注')
  await expect(table).toContainText('接班备注')
  await expect(table).toContainText('系统生成时间')
  await expect(table).toContainText('操作')
  await expect(table).toContainText('暂无数据')
})

test('/statistics/shift/record supports captured date, staff, settings and chat states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/shift/record'))

  await page.getByLabel('开始日期').click()
  await expect(page.getByRole('dialog', { name: '日期选择' })).toContainText('2026年')
  await expect(page.getByRole('dialog', { name: '日期选择' })).toContainText('5月')
  await expect(page.getByRole('dialog', { name: '日期选择' })).toContainText('6月')
  await page.keyboard.press('Escape')

  const filters = page.getByLabel('交接班筛选')
  await filters.getByRole('button', { name: '交班人 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '交班人选项' })).toContainText('路客云6TS5')
  await page.getByRole('option', { name: '路客云6TS5' }).click()
  await expect(filters.getByRole('button', { name: '交班人 路客云6TS5' })).toBeVisible()

  await filters.getByRole('button', { name: '接班人 请选择' }).click()
  await expect(page.getByRole('listbox', { name: '接班人选项' })).toContainText('路客云6TS5')
  await page.getByRole('option', { name: '路客云6TS5' }).click()
  await expect(filters.getByRole('button', { name: '接班人 路客云6TS5' })).toBeVisible()

  await filters.getByRole('button', { name: '设 置' }).click()
  await expect(page).toHaveURL(/\/setting\/shiftSetting$/)
  await expect(page.getByRole('link', { name: '交接班设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('region', { name: '班次设置' })).toBeVisible()

  await page.goto(appUrl('/statistics/shift/record'))
  await page.getByRole('button', { name: '收起会话' }).click()
  await expect(page.getByRole('complementary', { name: '全部会话' })).toBeHidden()
  await expect(page.getByRole('button', { name: '打开全部会话' })).toBeVisible()
})
