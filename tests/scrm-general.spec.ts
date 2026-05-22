import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/scrm--kehu-gaikuang--kehu-gaikuang',
)

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/general renders the target overview structure', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/general'))

  await expect(page.locator('.sidebar-link[href="/scrm/general"]')).toHaveClass(/active/)
  await expect(page.getByTestId('scrm-general-request-state')).toBeHidden()
  await expect(page.getByTestId('scrm-general-request-state')).toContainText('/scrm/general/overview/get')
  await expect(page.getByTestId('scrm-general-request-state')).toContainText('"provider":"mock"')

  await expect(page.locator('.scrm-filter-bar')).toHaveCount(0)
  await expect(page.locator('.scrm-general-header')).toHaveCount(0)
  await expect(page.locator('.scrm-general-columns')).toHaveCount(0)
  await expect(page.locator('.scrm-release-banner')).toHaveCount(0)

  await expect(page.locator('.scrm-auth-alert')).toBeVisible()
  await expect(page.locator('.scrm-asset-card')).toHaveCount(4)
  await expect(page.locator('.scrm-scene-card')).toHaveCount(4)
  await expect(page.locator('.scrm-trend-panel__range')).toBeVisible()
  await expect(page.getByLabel('趋势开始日期')).toHaveValue('2026-05-21')
  await expect(page.getByLabel('趋势结束日期')).toHaveValue('2026-06-21')

  await expect(page.locator('.scrm-section').filter({ hasText: '客户资产盘点' })).toContainText('590')
  await expect(page.locator('.scrm-section').filter({ hasText: '客户资产盘点' })).toContainText('277')
  await expect(page.locator('.scrm-section').filter({ hasText: '客户增长趋势图' })).toContainText('05/27')
  await expect(page.locator('.scrm-section').filter({ hasText: '客户增长趋势图' })).toContainText('06/21')
  await expect(page.locator('.scrm-section').filter({ hasText: '推荐场景' })).toContainText('立即体验')

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/mock provider|provider=mock|客户列表|导出|查询|重置/)

  await page.screenshot({
    path: path.join(artifactRoot, 'business-data-clone-20260521-95.png'),
    fullPage: true,
  })
})

test('/scrm/general updates request state from the merged trend date picker', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/general'))

  await page.getByLabel('趋势开始日期').fill('2026-05-27')
  await page.getByLabel('趋势结束日期').fill('2026-06-18')

  await expect(page.getByTestId('scrm-general-request-state')).toContainText('"startDate":"2026-05-27"')
  await expect(page.getByTestId('scrm-general-request-state')).toContainText('"endDate":"2026-06-18"')
  await expect(page.getByRole('status', { name: '客户概况操作反馈' })).toContainText('已更新客户增长趋势日期')
})

test('/scrm/general keeps only target-page actions and navigations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/general'))

  await page.getByRole('button', { name: '知道了' }).click()
  await expect(page.locator('.scrm-auth-alert')).toHaveCount(0)

  await expect(page.getByRole('button', { name: '刷新', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '导出' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '查询' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '重置' })).toHaveCount(0)

  await page.locator('.scrm-asset-card').nth(3).getByRole('link').click()
  await expect(page).toHaveURL(/\/channels\/private\/setting\/weComSetting$/)

  await page.goto(appUrl('/scrm/general'))
  await page.locator('.scrm-scene-card').first().getByRole('link').click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHome$/)
})

test('/scrm/general exposes empty and error states with retry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/general?scenario=empty'))

  await expect(page.locator('.scrm-general-columns')).toHaveCount(0)
  await expect(page.locator('.scrm-asset-card')).toHaveCount(4)
  await expect(page.locator('.scrm-section').filter({ hasText: '客户资产盘点' })).toContainText('0')

  await page.goto(appUrl('/scrm/general?scenario=error'))
  await expect(page.getByRole('alert', { name: '客户概况数据错误' })).toContainText('客户概况服务暂时不可用')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert', { name: '客户概况数据错误' })).toHaveCount(0)
  await expect(page.locator('.scrm-section').filter({ hasText: '客户资产盘点' })).toContainText('590')
})
