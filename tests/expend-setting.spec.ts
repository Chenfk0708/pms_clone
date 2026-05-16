import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/expendSetting matches captured income and expense settings surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/expendSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '设置', exact: true })).toHaveClass(
    /is-active/,
  )
  await expect(page.getByRole('link', { name: '收入/支出设置' })).toHaveClass(/is-active/)

  await expect(page.getByText('系统默认项目不支持编辑和删除，可直接拖动调整排序。')).toBeVisible()
  await expect(page.getByRole('tab', { name: '收入项' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '支出项' })).toHaveAttribute('aria-selected', 'false')

  const income = page.getByLabel('收入项目列表')
  await expect(income).toContainText('住宿')
  await expect(income).toContainText('加床')
  await expect(income).toContainText('加人')
  await expect(income).toContainText('损坏赔偿')
  await expect(income).toContainText('加时(延迟退房)')
  await expect(income).toContainText('旅游服务')
  await expect(income).toContainText('餐饮')
  await expect(income).toContainText('暂无项目，点击新增')
  await expect(income).toContainText('已停用项')

  await page.getByRole('tab', { name: '支出项' }).click()
  await expect(page.getByRole('tab', { name: '支出项' })).toHaveAttribute('aria-selected', 'true')
  const expense = page.getByLabel('支出项目列表')
  await expect(expense).toContainText('住宿')
  await expect(expense).toContainText('其他支出')
  await expect(expense).toContainText('退房费')
  await expect(expense).toContainText('其他佣金支出')
})

test('/setting/expendSetting supports captured add modal and chat collapse', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/expendSetting'))

  await page.getByRole('button', { name: '新 增' }).click()
  const dialog = page.getByRole('dialog', { name: '新增' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('选择业态')
  await expect(dialog).toContainText('名称')
  await expect(dialog.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '完 成' })).toBeVisible()

  await dialog.getByRole('button', { name: '取 消' }).click()
  await expect(dialog).toHaveCount(0)

  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
  await expect(page.locator('.chat-dock-launcher')).toBeVisible()
})
