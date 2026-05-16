import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/baobiao--tongji-baobiao--tongji-gailan',
)

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/statistics/report renders the captured statistics overview state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/report'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '统计概览' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '统计总览' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '远期分析' })).toBeVisible()
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByPlaceholder('开始日期')).toHaveValue('2026-05-13')
  await expect(page.getByPlaceholder('结束日期')).toHaveValue('2026-05-13')

  await expect(page.getByRole('region', { name: '营收统计' })).toContainText('总营业收入')
  await expect(page.getByRole('region', { name: '营收统计' })).toContainText('￥1,011')
  await expect(page.getByRole('region', { name: '营收统计' }).getByRole('article')).toHaveCount(6)

  await expect(page.getByRole('region', { name: '经营指标' })).toContainText('入住率OCC')
  await expect(page.getByRole('region', { name: '经营指标' })).toContainText('75%')
  await expect(page.getByRole('region', { name: '经营指标' })).toContainText('平均客房收益RevPAR')
  await expect(page.getByRole('region', { name: '经营指标' })).toContainText('￥252.75')
  await expect(page.getByRole('region', { name: '经营指标' }).getByRole('article')).toHaveCount(5)

  await expect(page.getByRole('region', { name: '增长趋势分析' })).toContainText('营业收入')
  await expect(page.getByRole('region', { name: '增长趋势分析' })).toContainText('05/13')
  await expect(page.getByRole('region', { name: '住宿订单来源分析' })).toContainText('携程')
  await expect(page.getByRole('region', { name: '住宿订单来源分析' })).toContainText('50.00%')
  await expect(page.locator('.chat-dock')).toContainText('全部会话')

  await page.screenshot({
    path: path.join(artifactRoot, 'default-clone-route.png'),
    fullPage: true,
  })
})

test('/statistics/report keeps captured filters, tabs, and chat interactions local', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/report'))

  await page.getByRole('button', { name: '今天' }).click()
  await expect(page.getByRole('button', { name: '今天' })).toHaveClass(/is-active/)
  await expect(page.getByPlaceholder('开始日期')).toHaveValue('2026-05-14')
  await expect(page.getByPlaceholder('结束日期')).toHaveValue('2026-05-14')

  await page.getByRole('button', { name: '本月' }).click()
  await expect(page.getByRole('button', { name: '本月' })).toHaveClass(/is-active/)
  await expect(page.getByPlaceholder('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByPlaceholder('结束日期')).toHaveValue('2026-05-14')

  await page.getByRole('button', { name: '房型 房型' }).click()
  await expect(page.getByRole('listbox', { name: '房型筛选' })).toContainText('顶层套房')
  await page.getByRole('option', { name: '顶层套房（浴缸巨幕电竞麻将）' }).click()
  await expect(page.getByRole('button', { name: /房型 顶层套房/ })).toBeVisible()

  await page.getByRole('button', { name: '渠道 渠道' }).click()
  await expect(page.getByRole('listbox', { name: '渠道筛选' })).toContainText('携程')
  await page.getByRole('option', { name: '携程' }).click()
  await expect(page.getByRole('button', { name: '渠道 携程' })).toBeVisible()

  await page.getByRole('button', { name: '远期分析' }).click()
  await expect(page.getByRole('button', { name: '远期分析' })).toHaveClass(/is-active/)
  await expect(page.getByRole('region', { name: '远期趋势分析' })).toContainText('未来30天')
  await page.getByRole('button', { name: '统计总览' }).click()
  await expect(page.getByRole('region', { name: '增长趋势分析' })).toBeVisible()
  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
  await page.locator('.chat-dock-launcher').click()
  await expect(page.locator('.chat-dock')).toBeVisible()
})
