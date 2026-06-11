import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const screenshotDir = 'artifacts/screenshots/shezhi--qiye-shezhi--chengyuan-shezhi'

function appUrl(routePath: string) {
  const normalizedPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalizedPath}` : normalizedPath
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'member-setting-mock-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })
})

test('/setting/member loads through the provider contract and supports bind feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/member?memberSettingProvider=mock'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '成员设置' })).toHaveClass(/is-active/)

  const contract = page.getByTestId('member-setting-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock', { timeout: 15_000 })
  await expect(contract).toHaveAttribute('data-response-state', 'success')
  await expect(contract).toHaveAttribute('data-endpoint', '/setting/member/bootstrap')

  const memberPage = page.locator('.member-setting-page')
  await expect(memberPage).toContainText('成员账号数：1/3')
  await expect(memberPage.getByRole('columnheader')).toHaveText(['姓名', '手机号', '角色', '企微', '邮箱', '操作'])

  const firstRow = memberPage.getByRole('row').filter({ hasText: '路客云6TS5' }).first()
  await expect(firstRow).toContainText('18123941382')
  await expect(firstRow).toContainText('点击绑定')

  await firstRow.getByRole('button', { name: '点击绑定' }).click()
  await expect(page.getByRole('dialog', { name: '企微绑定' })).toBeVisible()
  await page.getByRole('button', { name: '确认绑定' }).click()
  await expect(firstRow).toContainText('已绑定')
  await expect(memberPage.getByLabel('成员设置操作反馈')).toContainText('企微绑定成功')
  await page.screenshot({ path: `${screenshotDir}/default-clone-20260519-local-success-viewport.png` })
})

test('/setting/member renders role options and provider-driven empty or error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/member?memberSettingProvider=mock'))

  await expect(page.getByTestId('member-setting-service-contract')).toHaveAttribute('data-response-state', 'success')
  await page.locator('.member-setting-page').getByRole('button', { name: '全部', exact: true }).click()
  await expect(page.getByRole('listbox', { name: '角色筛选' }).getByRole('option')).toHaveText([
    '全部',
    '管理员',
    '管家',
    '投资人',
    '保洁员',
    '智住管家',
    '业主',
    'localsAI',
  ])

  await page.getByPlaceholder('姓名/手机号/角色').fill('成员')
  await expect(page.getByTestId('member-setting-service-contract')).toHaveAttribute('data-response-state', 'empty')
  await expect(page.getByLabel('成员列表空态')).toContainText('暂无数据')
  await page.screenshot({ path: `${screenshotDir}/empty-clone-20260519-local-empty-viewport.png` })

  await page.goto(appUrl('/setting/member?memberSettingProvider=mock&memberSettingMockState=error'))
  await expect(page.getByRole('alert', { name: '成员设置错误状态' })).toContainText('成员设置数据加载失败，请稍后重试')
  await expect(page.getByTestId('member-setting-service-contract')).toHaveAttribute('data-response-state', 'error')
  await page.screenshot({ path: `${screenshotDir}/error-clone-20260519-local-error-viewport.png` })
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByTestId('member-setting-service-contract')).toHaveAttribute('data-response-state', 'success')
  await expect(page.locator('.member-setting-page')).toContainText('路客云6TS5')
})

test('/setting/member/actions supports add member submit flow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/member?memberSettingProvider=mock'))

  await page.getByRole('button', { name: '添加成员' }).click()
  await expect(page).toHaveURL(/\/setting\/member\/actions\?memberSettingProvider=mock$/)
  await expect(page.getByTestId('member-setting-service-contract')).toHaveAttribute('data-route-mode', 'create')

  await page.getByLabel('成员姓名').fill('测试成员')
  await page.getByLabel('手机号').fill('13800138000')
  await page.getByRole('button', { name: '请选择角色' }).click()
  await page.getByRole('option', { name: '管理员' }).click()
  await page.getByPlaceholder('搜索房型名称').fill('顶层')
  await page.getByLabel('房型 顶层套房（浴缸巨幕电竞麻将）').check()
  await page.getByRole('button', { name: '提交' }).click()

  await expect(page).toHaveURL(/\/setting\/member(\?.*)?$/)
  await expect(page.locator('.member-setting-page')).toContainText('测试成员')
  await expect(page.locator('.member-setting-page')).toContainText('13800138000')
  await expect(page.getByLabel('成员设置操作反馈')).toContainText('成员保存成功')
  await expect(page.locator('.member-setting-page')).toContainText('成员账号数：2/3')
  await page.screenshot({ path: `${screenshotDir}/add-clone-20260519-local-add-viewport.png` })
})

test('/setting/member/actions validates member name and phone beside fields', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/member/actions?memberSettingProvider=mock'))

  await expect(page.getByTestId('member-setting-service-contract')).toHaveAttribute('data-route-mode', 'create')
  await page.getByLabel('成员姓名').fill('1')
  await page.getByLabel('手机号').fill('12000000000')
  await page.getByRole('button', { name: '提交' }).click()

  await expect(page.locator('.member-field-error').filter({ hasText: '姓名格式不正确，请输入 2-30 个中文或英文字母' })).toBeVisible()
  await expect(page.locator('.member-field-error').filter({ hasText: '手机号格式不正确' })).toBeVisible()
  await expect(page).toHaveURL(/\/setting\/member\/actions/)
  await expect(page.locator('.member-setting-page')).toHaveCount(0)
})

test('/setting/member/actions supports edit mode and prefilled form data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/member?memberSettingProvider=mock'))

  const firstRow = page.locator('.member-setting-page').getByRole('row').filter({ hasText: '路客云6TS5' }).first()
  await firstRow.getByRole('button', { name: '编辑' }).click()

  await expect(page).toHaveURL(/mode=edit/)
  await expect(page.getByTestId('member-setting-service-contract')).toHaveAttribute('data-route-mode', 'edit')
  await expect(page.getByLabel('成员姓名')).toHaveValue('路客云6TS5')
  await expect(page.getByLabel('手机号')).toHaveValue('18123941382')
  await expect(page.getByRole('button', { name: '管理员' })).toBeVisible()
  await page.screenshot({ path: `${screenshotDir}/edit-clone-20260519-local-edit-viewport.png` })
})
