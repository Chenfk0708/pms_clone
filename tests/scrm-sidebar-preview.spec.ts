import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  if (appBaseURL) {
    return `${appBaseURL.replace(/\/$/, '')}/#${routePath}`
  }

  return `/#${routePath}`
}

test('/scrm/sidebarPreview renders the standalone all-conversations page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview'))

  await expect(page.locator('.topbar')).toHaveCount(0)
  await expect(page.locator('.page-body')).toHaveCount(0)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.sidebar')).toHaveCount(0)
  await expect(page.locator('.conversation-full-page')).toBeVisible()
  await expect(page.locator('.conversation-full-page__header')).toContainText('全部会话')
  await expect(page.getByLabel('全部会话分类')).toContainText('未回复')
  await expect(page.locator('.conversation-card')).toHaveCount(3)
  await expect(page.locator('.conversation-empty-state')).toContainText('您还未选中或发起聊天')
  await expect(page.getByTestId('scrm-sidebar-service-contract')).toHaveAttribute('data-provider', 'mock')
})

test('/scrm/sidebarPreview supports tabs, selection, and trial messaging', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview'))

  await page.getByRole('tab', { name: '未回复 1' }).click()
  await expect(page.locator('.conversation-card')).toHaveCount(1)

  await page.locator('.conversation-card').first().click()
  await expect(page.locator('.conversation-workbench__meta')).toContainText('房东账号')
  await expect(page.locator('.chat-message')).toHaveCount(2)

  await page.getByLabel('发送消息输入框').fill('加了')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.locator('.chat-message')).toHaveCount(3)
  await expect(page.locator('.chat-message--staff').last()).toContainText('加了')

  await page.getByRole('button', { name: '会话设置' }).click()
  await expect(page).toHaveURL(/\/setting\/imSetting$/)
})

test('/scrm/sidebarPreview covers empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/sidebarPreview?mockState=empty'))

  await expect(page.locator('.conversation-full-page__state')).toContainText('当前分类下暂无会话')

  await page.goto(appUrl('/scrm/sidebarPreview?mockState=error'))
  await expect(page.getByRole('alert')).toContainText('聊天工具栏数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
})
