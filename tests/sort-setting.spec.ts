import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/sortSetting matches captured sort setting default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/sortSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '排序设置' })).toHaveClass(/is-active/)

  await expect(page.getByRole('tab', { name: '门店排序' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '房型排序' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByRole('tab', { name: '商品排序' })).toHaveAttribute('aria-selected', 'false')

  await expect(page.getByText('拖拽即可进行排序，选定排序方式之后，系统将按照下方顺序展示')).toBeVisible()
  const storeList = page.getByLabel('门店排序列表')
  await expect(storeList.locator('.sort-setting-item')).toHaveCount(1)
  await expect(storeList.locator('.sort-setting-item').first()).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(storeList.locator('.sort-setting-drag-handle').first()).toHaveText('⋮⋮')
  await expect(page.getByRole('button', { name: '收起', exact: true })).toBeVisible()
})

test('/setting/sortSetting supports captured tab switching and save feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/sortSetting'))

  await page.getByRole('tab', { name: '房型排序' }).click()
  await expect(page.getByRole('tab', { name: '房型排序' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('房型排序列表').locator('.sort-setting-item')).toHaveCount(4)
  await expect(page.getByLabel('房型排序列表')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByLabel('房型排序列表')).toContainText('观影大床房')

  await page.getByRole('tab', { name: '商品排序' }).click()
  await expect(page.getByRole('tab', { name: '商品排序' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('商品排序列表').locator('.sort-setting-item')).toHaveCount(4)
  await expect(page.getByLabel('商品排序列表')).toContainText('桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾')

  await page.getByRole('button', { name: '保存排序' }).click()
  await expect(page.getByText('排序已保存')).toBeVisible()
})
