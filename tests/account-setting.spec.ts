import { expect, test, type Page } from '@playwright/test'

let savedAccountPayload: Record<string, unknown> | null = null

async function mockAccountApis(page: Page) {
  savedAccountPayload = null

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: {
          userId: 12001,
          mobile: '18123941382',
          email: 'old@example.com',
          nickName: '路客云 TS5',
          avatarUrl: '',
          wechat: 'old-wechat',
          passwordSet: false,
          roleName: '管理员',
          campId: 10001,
          campName: '宿银',
        },
      }),
    })
  })

  await page.route('**/api/auth/account', async (route) => {
    savedAccountPayload = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: {
          userId: 12001,
          mobile: '18123941382',
          email: savedAccountPayload.email,
          nickName: savedAccountPayload.nickName,
          avatarUrl: savedAccountPayload.avatarUrl || '',
          wechat: savedAccountPayload.wechat,
          passwordSet: Boolean(savedAccountPayload.newPassword),
          roleName: '管理员',
          campId: 10001,
          campName: '宿银',
        },
      }),
    })
  })

  await page.route('**/api/memberSettings/bootstrap', async (route) => {
    const name = String(savedAccountPayload?.nickName || '路客云 TS5')
    const email = String(savedAccountPayload?.email || 'old@example.com')

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: {
          summary: {
            usedEmployeeNum: 1,
            employeeNum: 3,
          },
          roles: [
            { roleId: 'all', roleName: '全部' },
            { roleId: '13001', roleName: '管理员' },
          ],
          members: [
            {
              userId: '12001',
              name,
              phone: '18123941382',
              roleId: '13001',
              roleName: '管理员',
              wecomStatus: 'unbound',
              wecomLabel: '点击绑定',
              email,
              roomCategoryIds: ['22001'],
            },
          ],
          pendingFlows: [],
          roomCategories: [{ roomCategoryId: '22001', roomCategoryName: '特价单间', roomIds: [] }],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 1,
          },
          editor: {
            title: '添加成员',
            submitText: '提交',
            breadcrumbText: '成员设置 / 添加成员',
            rolePlaceholder: '请选择角色',
            roomSearchPlaceholder: '搜索房型名称',
            draft: {
              name: '',
              phone: '',
              roleId: '',
              roleName: '',
              roomCategoryIds: [],
            },
          },
        },
        traceId: 'member-settings-bootstrap-test',
        timestamp: '2026-06-09T13:30:00+08:00',
      }),
    })
  })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'account-setting-token')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: 'account-user-001',
        name: '很长很长很长很长的旧门店账号名称',
        mobile: '18123941382',
        roleName: '管理员',
        campName: '宿银',
        passwordSet: false,
      }),
    )
    window.localStorage.setItem('pmsCampId', '10001')
  })
  await mockAccountApis(page)
})

test('/setting/account updates current account and topbar menu', async ({ page }) => {
  await page.goto('/#/setting/account')

  await expect(page.getByRole('region', { name: '账号设置' })).toBeVisible()
  await expect(page.locator('.brand-store')).toContainText('路客云 TS5的店铺')
  await expect(page.locator('.brand-store-name')).not.toHaveAttribute('title', /.*/)
  await page.locator('.brand-store-name').hover()
  await expect(page.getByRole('tooltip', { name: '路客云 TS5的店铺' })).toBeVisible()
  await page.getByRole('link', { name: '首页' }).hover()
  const brandNameBox = await page.locator('.brand-store strong').boundingBox()
  const topNavBox = await page.getByRole('link', { name: '首页' }).boundingBox()
  expect((brandNameBox?.x ?? 0) + (brandNameBox?.width ?? 0)).toBeLessThan(topNavBox?.x ?? Number.MAX_SAFE_INTEGER)

  const settingsSidebar = page.getByRole('complementary', { name: '账号设置侧边导航' })
  await expect(settingsSidebar).toBeVisible()
  await expect(settingsSidebar.getByRole('button', { name: /企业设置/ })).toHaveClass(/is-active/)
  await expect(settingsSidebar.getByRole('link', { name: '成员设置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('navigation', { name: '账号设置路径' })).toContainText('成员列表')
  await expect(page.getByRole('button', { name: '保存' })).toBeVisible()
  await expect(page.getByText('18123941382')).toBeVisible()
  await expect(page.getByText('暂未设置')).toBeVisible()

  await page.getByRole('button', { name: '用户菜单' }).click()
  const menu = page.getByRole('dialog', { name: '用户菜单面板' })
  await expect(menu).toContainText('路客云 TS5')
  await expect(menu.getByRole('link', { name: '账号设置' })).toBeVisible()
  await expect(menu.getByRole('button', { name: '退出登录' })).toBeVisible()
  await expect(menu).not.toContainText('成员设置')
  await expect(menu).not.toContainText('API keys')
  await expect(menu).not.toContainText('门店信息')
  await page.getByRole('button', { name: '用户菜单' }).click()

  await page.getByLabel('姓名').fill('宿银管理员')
  await page.getByLabel('邮箱').fill('new@example.com')
  await page.getByLabel('微信').fill('new-wechat')
  await page.getByLabel('原密码').fill('demo-login')
  await page.getByLabel('新密码').fill('new-login-123')
  await page.getByLabel('确认密码').fill('new-login-123')

  await expect(page.getByLabel('原密码')).toHaveAttribute('type', 'password')
  await expect(page.getByLabel('新密码')).toHaveAttribute('type', 'password')
  await expect(page.getByLabel('确认密码')).toHaveAttribute('type', 'password')

  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('status', { name: '账号设置操作反馈' })).toContainText('账号信息已保存')
  await expect(page.locator('.brand-store')).toContainText('宿银管理员的店铺')
  await expect(page.locator('.brand-store-name')).not.toHaveAttribute('title', /.*/)
  await page.locator('.brand-store-name').hover()
  await expect(page.getByRole('tooltip', { name: '宿银管理员的店铺' })).toBeVisible()
  await expect(page.getByText('已设置')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('new-login-123')

  expect(savedAccountPayload).toMatchObject({
    nickName: '宿银管理员',
    email: 'new@example.com',
    wechat: 'new-wechat',
    oldPassword: 'demo-login',
    newPassword: 'new-login-123',
  })
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('pms_user') || '{}').email)).toBe('new@example.com')
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('pms_user') || '{}').wechat)).toBe('new-wechat')
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('pms_user') || '{}').passwordSet)).toBe(true)

  await page.getByRole('link', { name: '成员列表' }).click()
  await expect(page).toHaveURL(/\/setting\/member$/)
  await expect(page.getByTestId('member-setting-service-contract')).toHaveAttribute('data-provider', 'api')
  await expect(page.locator('.member-setting-page')).toContainText('宿银管理员')
  await expect(page.locator('.member-setting-page')).toContainText('new@example.com')

  await page.getByRole('button', { name: '用户菜单' }).click()
  await page.getByRole('button', { name: '退出登录' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pms_token'))).toBeNull()
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pms_user'))).toBeNull()
})

test('/setting/account saves avatar when only old password is autofilled', async ({ page }) => {
  await page.goto('/#/setting/account')

  await page.getByLabel('原密码').fill('demo-login')
  await page.getByLabel('上传头像').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lhFZ7wAAAABJRU5ErkJggg==',
      'base64',
    ),
  })

  await page.getByRole('button', { name: '保存' }).click()

  await expect(page.getByRole('status', { name: '账号设置操作反馈' })).toContainText('账号信息已保存')
  await expect(page.getByRole('status', { name: '账号设置操作反馈' })).toHaveCount(0, { timeout: 3500 })
  expect(savedAccountPayload).toMatchObject({
    nickName: '路客云 TS5',
    email: 'old@example.com',
    wechat: 'old-wechat',
  })
  expect(savedAccountPayload?.avatarUrl).toEqual(expect.stringContaining('data:image/png;base64,'))
  expect(savedAccountPayload).not.toHaveProperty('oldPassword')
  expect(savedAccountPayload).not.toHaveProperty('newPassword')
})

test('/setting/account validates name and email before saving', async ({ page }) => {
  await page.goto('/#/setting/account')

  await page.getByLabel('姓名').fill('1')
  await page.getByLabel('邮箱').fill('not-an-email')
  await page.getByRole('button', { name: '保存' }).click()

  await expect(page.locator('.account-setting-field-error').filter({ hasText: '姓名格式不正确，请输入 2-30 个中文或英文字母' })).toBeVisible()
  await expect(page.locator('.account-setting-field-error').filter({ hasText: '邮箱格式不正确' })).toBeVisible()
  expect(savedAccountPayload).toBeNull()
})
