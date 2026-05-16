import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/writeExpendSetting renders captured income item settings page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/writeExpendSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '设置', exact: true })).toHaveClass(
    /is-active/,
  )
  await expect(page.locator('.sidebar').getByRole('link', { name: '记一笔设置', exact: true })).toHaveClass(/is-active/)

  await expect(page.getByText('系统默认项目不支持编辑和删除，可直接拖动调整排序。')).toBeVisible()
  await expect(page.getByRole('tab', { name: '收入项' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '支出项' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByRole('button', { name: '新 增' })).toBeVisible()

  const incomePanel = page.getByLabel('收入项设置')
  await expect(incomePanel.getByRole('heading', { name: '住宿' })).toBeVisible()
  for (const name of ['房费', '清洁费', '押金', '长租账单', '押金逾期费']) {
    await expect(incomePanel.getByText(name, { exact: true })).toBeVisible()
  }
  await expect(incomePanel.locator('.write-expend-default-badge').first()).toHaveText('默认')
  for (const name of ['餐饮', '商超', '娱乐', '场地']) {
    await expect(incomePanel.getByRole('heading', { name })).toBeVisible()
  }
  await expect(incomePanel.getByText('暂无项目，点击新增')).toHaveCount(4)
  await expect(incomePanel.getByText('已停用项')).toBeVisible()

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/shezhi--tongyong-shezhi--jiyibi-shezhi/default-clone-route.png',
    ),
    fullPage: true,
  })
})

test('/setting/writeExpendSetting supports captured add dialog and expense tab', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/writeExpendSetting'))

  await page.getByLabel('收入项设置').getByRole('button', { name: '点击新增' }).first().click()
  const dialog = page.getByRole('dialog', { name: '新增' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('选择业态')).toBeVisible()
  await expect(dialog.locator('.write-expend-select')).toContainText('餐饮')
  await expect(dialog.getByText('名称')).toBeVisible()
  await expect(dialog.getByPlaceholder('请输入名称')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '完 成' })).toBeVisible()
  await dialog.getByRole('button', { name: '取 消' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('tab', { name: '支出项' }).click()
  await expect(page.getByRole('tab', { name: '支出项' })).toHaveAttribute('aria-selected', 'true')
  const expensePanel = page.getByLabel('支出项设置')
  await expect(expensePanel.getByRole('heading', { name: '住宿' })).toBeVisible()
  for (const name of ['退款', '采购', '维修费', '水费', '电费']) {
    await expect(expensePanel.getByText(name, { exact: true })).toBeVisible()
  }
  await expect(expensePanel.getByText('已停用项')).toBeVisible()
})
