import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/memberCenter/integrate matches captured member points coming-soon state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/integrate'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.member-points-page')).toBeVisible()
  await expect(page.getByRole('img', { name: /敬请期待 coming soon/ })).toBeVisible()
  await expect(page.getByText('路客云SCRM顾问', { exact: true })).toBeVisible()
  await expect(page.getByText('请扫码添加路客云SCRM顾问')).toBeVisible()
  await expect(page.getByText('我们将随时解答你的疑问')).toBeVisible()
  await expect(page.locator('.member-points-table')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /新增|积分规则|查询/ })).toHaveCount(0)

  const shellChatPanel = page.locator('.app-shell > .chat-dock')
  await expect(shellChatPanel).toBeVisible()
  await expect(shellChatPanel).toContainText('携程民宿')
  await expect(shellChatPanel).toContainText('咨询中')
  await shellChatPanel.locator('.chat-dock__collapse').click()
  await expect(shellChatPanel).toHaveCount(0)
  await expect(page.locator('.chat-dock-launcher')).toBeVisible()
})
