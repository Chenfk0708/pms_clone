import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/customChannel renders captured custom channel settings page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/customChannel'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '自定义渠道' })).toHaveClass(/is-active/)
  await expect(page.getByText('系统默认渠道不支持编辑和删除。点击“编辑”按钮，可停用或启用渠道')).toBeVisible()
  await expect(page.getByRole('heading', { name: '系统默认渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()
  await expect(page.getByText('自来客')).toBeVisible()
  await expect(page.getByText('路客云聚合')).toBeVisible()
  await expect(page.getByText('飞猪淘酒店')).toBeVisible()
  await expect(page.getByText('携程国际')).toBeVisible()
  await expect(page.getByText('Hotelbeds')).toBeVisible()
  await expect(page.getByRole('heading', { name: '自定义渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '添加渠道' })).toBeVisible()
  await expect(page.locator('.chat-dock')).toBeVisible()
})

test('/setting/customChannel supports edit and add-channel states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/customChannel'))

  await page.getByRole('button', { name: '编 辑' }).click()
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
  await expect(page.locator('.custom-channel-card').filter({ hasText: '自来客' }).getByRole('checkbox')).toBeVisible()

  await page.getByRole('button', { name: '收起会话' }).click()
  await page.getByRole('button', { name: '添加渠道' }).click()
  await expect(page.getByRole('dialog', { name: '添加渠道' })).toBeVisible()
  await expect(page.getByLabel('渠道名称')).toBeVisible()
  await expect(page.getByLabel('渠道颜色')).toBeVisible()
  await expect(page.getByText('请选择渠道颜色')).toBeVisible()
  await expect(page.getByRole('button', { name: '确 定' })).toBeVisible()
})
