import { expect, test } from '@playwright/test'

test('登录后写入当前门店上下文，供订单录入读取真实房型房间', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        message: 'success',
        data: {
          token: 'login-session-token',
          userId: 12001,
          roleName: '管理员',
          campId: 10001,
        },
      }),
    })
  })

  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('请输入手机号').fill('13800000001')
  await page.getByPlaceholder('演示环境请输入 demo-login').fill('demo-login')
  await page.getByRole('button', { name: '登 录' }).click()

  await expect(page).toHaveURL(/#\/workspace/)
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pmsCampId'))).toBe('10001')
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pms.currentCampId'))).toBe('10001')
})

test('接口 401 时清理当前门店上下文，避免订单录入沿用旧房型房间', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        code: 401,
        message: 'Token无效或已过期，请重新登录',
        data: null,
      }),
    })
  })

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'expired-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.currentCampId', '10001')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '12001',
        name: '系统管理员',
        mobile: '13800000001',
        roleName: '管理员',
        campId: '10001',
        campName: '路客云演示门店',
      }),
    )
  })

  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('请输入手机号').fill('13800000001')
  await page.getByPlaceholder('演示环境请输入 demo-login').fill('wrong-password')
  await page.getByRole('button', { name: '登 录' }).click()

  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pms_token'))).toBeNull()
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pms_user'))).toBeNull()
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pmsCampId'))).toBeNull()
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pms.currentCampId'))).toBeNull()
})
