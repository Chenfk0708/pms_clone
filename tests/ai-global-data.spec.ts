import { expect, test } from '@playwright/test'

test('/channels/globalRadar/globalData matches captured global data shell and interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/channels/globalRadar/globalData')

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: 'AI全域雷达' })).toHaveClass(/is-active/)
  const sidebar = page.locator('.sidebar')
  await expect(sidebar.getByRole('link', { name: '全域数据' })).toHaveClass(/is-active/)
  await expect(sidebar.getByRole('link', { name: '配置中心' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'OTA' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: '社媒' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: '私域渠道' })).toHaveCount(0)

  const tabsBox = await page.locator('.radar-tabs').boundingBox()
  expect(tabsBox?.y).toBeLessThan(80)
  await expect(page.getByRole('heading', { name: '服务质量分', level: 2 })).toBeVisible()
  await expect(page.getByText('PSI总分')).toBeVisible()
  await expect(page.getByRole('heading', { name: '酒店竞争圈排名', level: 3 })).toBeVisible()
  await expect(page.locator('.chat-dock')).toBeVisible()

  await page.getByRole('button', { name: '美团' }).click()
  await expect(page.getByRole('button', { name: '美团' })).toHaveClass(/is-active/)

  await page.getByRole('button', { name: '立即开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
})
