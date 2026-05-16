import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/finance matches captured finance setting default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/finance'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '财务设置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '财务设置', level: 1 })).toHaveCount(1)

  const financePanel = page.getByLabel('财务设置')
  await expect(financePanel.getByRole('heading', { name: '夜审设置' })).toBeVisible()
  await expect(financePanel.getByRole('switch', { name: '夜审' })).toHaveAttribute('aria-checked', 'false')
  await expect(financePanel.getByText('开启后，每天指定时间会自动进行夜审。')).toBeVisible()
  await expect(financePanel.getByRole('button', { name: '自动夜审时间 06:00' })).toBeDisabled()

  await expect(financePanel.getByRole('heading', { name: '分摊设置' })).toBeVisible()
  await expect(financePanel.getByLabel('按日历价分摊')).toBeChecked()
  await expect(financePanel.getByLabel('平均分摊')).not.toBeChecked()

  await expect(financePanel.getByRole('heading', { name: '可售设置' })).toBeVisible()
  await expect(financePanel.getByText('关房计入可售')).toBeVisible()
  for (const label of ['普通关房', '维修房', '保留房', '屏蔽关房', '联动关房']) {
    await expect(financePanel.getByLabel(label)).toBeDisabled()
  }
  await expect(financePanel.getByRole('button', { name: '编辑' })).toBeVisible()

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/shezhi--tongyong-shezhi--caiwu-shezhi/default-clone-route.png',
    ),
    fullPage: true,
  })
})

test('/setting/finance supports captured edit and cancel interaction', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/finance'))

  const financePanel = page.getByLabel('财务设置')
  await financePanel.getByRole('button', { name: '编辑' }).click()
  await expect(financePanel.getByRole('button', { name: '取消' })).toBeVisible()
  await expect(financePanel.getByRole('button', { name: '保存' })).toBeVisible()
  await expect(financePanel.getByLabel('普通关房')).toBeEnabled()
  await financePanel.getByLabel('平均分摊').check()
  await expect(financePanel.getByLabel('平均分摊')).toBeChecked()

  await financePanel.getByRole('button', { name: '取消' }).click()
  await expect(financePanel.getByRole('button', { name: '编辑' })).toBeVisible()
  await expect(financePanel.getByLabel('按日历价分摊')).toBeChecked()
})
