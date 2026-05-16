import { expect, test } from '@playwright/test'

test('/channels/social matches captured social channel default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/channels/social')

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '社媒', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '已直连渠道' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '未直连渠道' })).toBeVisible()

  const connectedCard = page.getByRole('article', { name: /抖音来客/ })
  await expect(connectedCard).toContainText('关联房型0/0')
  await expect(connectedCard).toContainText('支持：日历房、预售券')
  await expect(connectedCard.getByRole('button', { name: '管理渠道' })).toBeVisible()

  await expect(page.getByRole('article', { name: /小红书/ }).getByRole('button', { name: '订阅开通' })).toBeVisible()
  await expect(page.getByRole('article', { name: /视频号/ }).getByRole('button', { name: '订阅开通' })).toBeVisible()
  await expect(
    page.getByRole('article', { name: /抖音特价酒店/ }).getByRole('button', { name: '订阅开通' }),
  ).toBeVisible()
})

test('/channels/social supports captured management detail navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/channels/social')

  await page.getByRole('button', { name: '管理渠道' }).click()
  await expect(page).toHaveURL(/\/channels\/social\/setting$/)
  await expect(page.getByRole('heading', { name: '社媒', level: 1 })).toBeVisible()
  await expect(page.getByText('社媒/')).toBeVisible()
  await expect(page.getByText('渠道详情')).toBeVisible()
  await expect(page.getByRole('heading', { name: '抖音来客直连' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '账号管理' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '门店管理' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '日历房型' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '预售房型' })).toBeVisible()
  await expect(page.getByRole('table', { name: '社媒账号管理列表' })).toContainText('7370207731854149643')
  await expect(page.getByRole('table', { name: '社媒账号管理列表' })).toContainText('断开直连')
  await expect(page.getByRole('table', { name: '社媒账号管理列表' })).toContainText('授权日历房')
})
