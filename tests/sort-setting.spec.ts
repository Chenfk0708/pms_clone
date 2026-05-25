import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/sortSetting shows the captured default sort-setting shell', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/sortSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '排序设置' })).toHaveClass(/is-active/)

  await expect(page.getByRole('tab', { name: '门店排序' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '房型排序' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByRole('tab', { name: '商品排序' })).toHaveAttribute('aria-selected', 'false')

  await expect(
    page.getByText('拖拽即可进行排序，选定排序方式之后，系统将按照下方顺序展示'),
  ).toBeVisible()

  const contract = page.getByTestId('sort-setting-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-state', 'success')
  await expect(contract).toHaveAttribute('data-active-tab', 'store')

  const storeList = page.getByLabel('门店排序列表')
  await expect(storeList.locator('.sort-setting-item')).toHaveCount(1)
  await expect(storeList).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(storeList.locator('.sort-setting-drag-handle')).toHaveText(['⋮⋮'])

  await expect(page.locator('.chat-dock-launcher')).toBeVisible()
})

test('/setting/sortSetting supports tabs, reorder feedback, and runtime states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/sortSetting'))

  await page.getByRole('tab', { name: '房型排序' }).click()
  await expect(page.getByRole('tab', { name: '房型排序' })).toHaveAttribute('aria-selected', 'true')
  const roomList = page.getByLabel('房型排序列表')
  await expect(roomList.locator('.sort-setting-item')).toHaveCount(4)
  await expect(roomList).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(roomList).toContainText('观影大床房')

  await page.getByRole('button', { name: '下移 顶层套房（浴缸巨幕电竞麻将）' }).click()
  await expect(roomList.locator('.sort-setting-item').nth(1)).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByRole('status', { name: '排序设置操作反馈' })).toContainText('房型排序已更新')
  await expect(page.getByTestId('sort-setting-service-contract')).toContainText('/roomCategory/seqs')

  await page.getByRole('tab', { name: '商品排序' }).click()
  await expect(page.getByRole('tab', { name: '商品排序' })).toHaveAttribute('aria-selected', 'true')
  const goodsList = page.getByLabel('商品排序列表')
  await expect(goodsList.locator('.sort-setting-item')).toHaveCount(4)
  await expect(goodsList).toContainText('桑拿浴缸百平露台台球桌天落床俯瞰摩天天轮深场次卧')

  await page.getByRole('button', { name: '上移 观影大床房限时特惠' }).click()
  await expect(goodsList.locator('.sort-setting-item').nth(1)).toContainText('观影大床房限时特惠')
  await expect(page.getByRole('status', { name: '排序设置操作反馈' })).toContainText('商品保存接口待后端最终确认')

  await page.goto(appUrl('/setting/sortSetting?mockState=empty&tab=room'))
  await expect(page.getByRole('tab', { name: '房型排序' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('status', { name: '排序设置操作反馈' })).toContainText('当前暂无可排序数据')
  await expect(page.getByRole('status', { name: '排序设置空状态' })).toContainText('当前排序方式下暂无可展示的数据')

  await page.goto(appUrl('/setting/sortSetting?mockState=error'))
  await expect(page.getByRole('alert', { name: '排序设置错误状态' })).toContainText('排序设置加载失败')
  await expect(page.getByRole('button', { name: '重新加载排序设置' })).toBeVisible()
})
