import { expect, test } from '@playwright/test'

test('login stores role permissions and filters navigation entries', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: {} }),
    })
  })

  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: {
          token: 'frontdesk-token',
          userId: 13003,
          username: 'frontdesk_user',
          mobile: '13900000021',
          nickName: '前台账号',
          roleName: '前台',
          campId: 10001,
          campName: '宿银',
          permissionCodes: ['dashboard:view', 'room:view', 'room:edit', 'order:view', 'order:edit', 'notify:view', 'clean:view'],
        },
      }),
    })
  })

  await page.goto('/#/login')
  await page.getByPlaceholder('请输入账号').fill('frontdesk_user')
  await page.getByPlaceholder('请输入密码').fill('123456')
  await page.locator('.login-btn').click()

  await expect(page).toHaveURL(/\/workspace$/)
  await expect.poll(() =>
    page.evaluate(() => JSON.parse(window.localStorage.getItem('pms_user') || '{}').permissionCodes),
  ).toEqual(['dashboard:view', 'room:view', 'room:edit', 'order:view', 'order:edit', 'notify:view', 'clean:view'])

  const topNav = page.getByRole('navigation', { name: '顶部导航' })
  await expect(topNav.getByRole('link', { name: '首页' })).toBeVisible()
  await expect(topNav.getByRole('link', { name: '房态' })).toBeVisible()
  await expect(topNav.getByRole('link', { name: '订单' })).toBeVisible()
  await expect(topNav.getByRole('link', { name: '报表' })).toHaveCount(0)
  await expect(topNav.getByRole('link', { name: '设置' })).toHaveCount(0)
})
