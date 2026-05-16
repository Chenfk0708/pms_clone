import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/marketing/customer matches captured customer marketing advisor state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/marketing/customer'))

  await expect(page.getByRole('heading', { name: '客户营销', level: 1 })).toBeVisible()
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: 'SCRM' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '客户营销' })).toHaveClass(/is-active/)

  const pageShell = page.getByLabel('客户营销顾问引导')
  await expect(pageShell).toBeVisible()
  await expect(pageShell).toContainText('路客云SCRM顾问')
  await expect(pageShell).toContainText('请扫码添加路客云SCRM顾问')
  await expect(pageShell).toContainText('我们将随时解答你的疑问')

  const heroImage = page.getByRole('img', { name: '客户营销顾问引导图' })
  const qrcodeImage = page.getByRole('img', { name: '路客云SCRM顾问二维码' })
  await expect(heroImage).toBeVisible()
  await expect(qrcodeImage).toBeVisible()

  const heroBox = await heroImage.boundingBox()
  const qrcodeBox = await qrcodeImage.boundingBox()
  expect(Math.round(heroBox?.width ?? 0)).toBe(480)
  expect(Math.round(heroBox?.height ?? 0)).toBe(480)
  expect(Math.round(qrcodeBox?.width ?? 0)).toBe(180)
  expect(Math.round(qrcodeBox?.height ?? 0)).toBe(180)

  await expect(page.locator('.chat-dock')).toContainText('全部会话')
  await expect(page.locator('.chat-dock')).toContainText('携程民宿')

  await page.screenshot({
    path: 'artifacts/screenshots/scrm--yingxiao-tuiguang--kehu-yingxiao/default-clone-route.png',
    fullPage: true,
  })
})
