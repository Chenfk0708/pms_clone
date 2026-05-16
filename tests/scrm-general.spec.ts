import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/general matches captured customer overview state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/general'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '客户概况' })).toHaveClass(/is-active/)
  await expect(page.getByText('企业微信未授权，可能导致部分功能无法使用，请尽快前往授权。')).toBeVisible()
  await expect(page.getByRole('button', { name: '前往企业微信授权' })).toBeVisible()
  await expect(page.getByRole('button', { name: '知道了' })).toBeVisible()

  const assetSection = page.getByRole('region', { name: '客户资产盘点' })
  await expect(assetSection).toBeVisible()
  await expect(assetSection.getByText('客户数')).toBeVisible()
  await expect(assetSection.getByText('588', { exact: true })).toBeVisible()
  await expect(assetSection.getByText('粉丝总数')).toBeVisible()
  await expect(assetSection.getByText('敬请期待', { exact: true })).toBeVisible()
  await expect(assetSection.getByText('会员总数')).toBeVisible()
  await expect(assetSection.getByText('275', { exact: true })).toBeVisible()
  await expect(assetSection.getByText('添加企微人数')).toBeVisible()
  await expect(assetSection.getByText('前往设置', { exact: true })).toBeVisible()

  await expect(page.getByLabel('客户增长趋势日期范围').getByPlaceholder('开始日期')).toHaveValue('2026/05/14')
  await expect(page.getByLabel('客户增长趋势日期范围').getByPlaceholder('结束日期')).toHaveValue('2026/06/14')
  await expect(page.getByLabel('客户增长趋势图')).toContainText('客户数')
  await expect(page.getByLabel('客户增长趋势图')).toContainText('会员数')
  await expect(page.getByLabel('客户增长趋势图')).toContainText('添加企微人数')
  await expect(page.getByLabel('客户增长趋势图')).toContainText('06/14')

  const sceneSection = page.getByRole('region', { name: '推荐场景' })
  await expect(sceneSection.getByRole('article')).toHaveCount(4)
  await expect(sceneSection.getByText('智能入住接入企业微信')).toBeVisible()
  await expect(sceneSection.getByText('聊天工具栏')).toBeVisible()
  await expect(sceneSection.getByText('品牌小程序接入微信客服')).toBeVisible()
  await expect(sceneSection.getByText('会员成长体系')).toBeVisible()
  await expect(sceneSection.getByRole('button', { name: '立即体验' })).toHaveCount(4)

  const chatDock = page.locator('.app-shell > .chat-dock')
  await expect(chatDock).toBeVisible()
  await expect(chatDock).toHaveCSS('position', 'fixed')
  const chatBox = await chatDock.boundingBox()
  expect(chatBox?.x).toBeGreaterThan(1000)
  expect(chatBox?.y).toBeLessThan(700)
})
