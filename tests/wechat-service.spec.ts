import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/wechatService/manage renders the WeChat service subscription guide', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/wechatService/manage'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '微信客服' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '企微SCRM-微信客服' })).toBeVisible()
  await expect(page.getByText('咨询信息直通路客云IM')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即开通' })).toBeVisible()
  await expect(page.getByText('限时免费')).toBeVisible()
  await expect(page.getByRole('heading', { name: '商品详情' })).toBeVisible()
  await expect(page.locator('.wechat-service-visual img')).toHaveCount(3)
  await expect(page.getByRole('img', { name: '微信客服高效沟通工具' })).toBeVisible()
  await expect
    .poll(async () => Math.round((await page.locator('.wechat-service-visual img').first().boundingBox())?.width ?? 0))
    .toBeGreaterThanOrEqual(1190)
  const chatDock = page.locator('.app-shell > .chat-dock')
  await expect(chatDock).toBeVisible()
  await expect(chatDock).toHaveCSS('position', 'fixed')
  const chatBox = await chatDock.boundingBox()
  expect(chatBox?.width).toBeGreaterThanOrEqual(320)
  expect(chatBox?.width).toBeLessThanOrEqual(330)
})

test('/scrm/wechatService/manage opens subscription detail from primary action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/wechatService/manage'))

  await page.getByRole('button', { name: '立即开通' }).click()

  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '企微SCRM' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '智能保洁' })).toHaveCount(0)
})
