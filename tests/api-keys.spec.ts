import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/CompanySetting/Apikeys matches captured empty API keys state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/CompanySetting/Apikeys'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '企业设置' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'API keys' })).toHaveClass(/is-active/)

  await expect(page.getByRole('heading', { name: 'API keys', level: 1 })).toBeVisible()
  await expect(page.getByText('此API keys用于Locals AI使用，请妥善保存。')).toBeVisible()
  await expect(page.getByText('不要与他人共享你的 API key，或将其暴露在浏览器中。')).toBeVisible()
  await expect(page.getByText('暂未生成路客云API keys，点击下方按钮获取API Keys')).toBeVisible()
  await expect(page.getByRole('button', { name: '获取API keys' })).toBeVisible()
})

test('/CompanySetting/Apikeys does not fake production key generation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/CompanySetting/Apikeys'))

  await page.getByRole('button', { name: '获取API keys' }).click()
  await expect(page.getByRole('status')).toContainText('本地复刻不会生成真实 API key')
  await expect(page.getByText('请在真实系统中确认生成操作。')).toBeVisible()
})
