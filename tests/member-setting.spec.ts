import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/member renders captured member setting default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/member'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '成员设置' })).toHaveClass(/is-active/)

  const memberPage = page.locator('.member-setting-page')
  await expect(memberPage).toBeVisible()
  await expect(memberPage.getByPlaceholder('姓名/手机号/角色')).toBeVisible()
  await expect(memberPage.getByRole('button', { name: '全部' })).toBeVisible()
  await expect(memberPage).toContainText('成员账号数：1/3')
  await expect(memberPage.getByRole('button', { name: '添加成员' })).toBeVisible()

  await expect(page.getByLabel('成员账号列表').getByRole('columnheader')).toHaveText([
    '姓名',
    '手机号',
    '角色',
    '企微',
    '邮箱',
    '操作',
  ])

  const firstRow = page.getByLabel('成员账号列表').getByRole('row').nth(1)
  await expect(firstRow).toContainText('路客云6TS5')
  await expect(firstRow).toContainText('18123941382')
  await expect(firstRow).toContainText('点击绑定')
  await expect(firstRow.getByRole('button', { name: '编辑' })).toBeVisible()
  await expect(memberPage).toContainText('第 1-1 条/共 1 条')
  await expect(memberPage).toContainText('20 条/页')
})

test('/setting/member supports captured role dropdown and search empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/member'))

  await page.locator('.member-role-select').click()
  const listbox = page.getByRole('listbox', { name: '角色筛选' })
  await expect(listbox).toBeVisible()
  await expect(listbox.getByRole('option')).toHaveText([
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
  await expect(page.getByLabel('成员账号列表')).toContainText('暂无数据')
  await expect(page.getByLabel('成员账号列表')).not.toContainText('18123941382')
})

test('/setting/member/actions renders captured add member form', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/member'))

  await page.getByRole('button', { name: '添加成员' }).click()
  await expect(page).toHaveURL(/\/setting\/member\/actions$/)

  const addPage = page.locator('.member-action-page')
  await expect(addPage).toBeVisible()
  await expect(addPage).toContainText('成员设置/添加成员')
  await expect(addPage.getByRole('heading', { name: '基本资料' })).toBeVisible()
  await expect(addPage.getByLabel('成员姓名')).toBeVisible()
  await expect(addPage.getByLabel('手机号')).toBeVisible()
  await expect(addPage).toContainText('请选择角色')
  await expect(addPage).toContainText('分配房型')
  await expect(addPage.getByLabel('全选')).toBeVisible()
  await expect(addPage).toContainText('观影大床房')
  await expect(addPage).toContainText('天落大床电竞套间')
  await expect(addPage).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(addPage).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(addPage.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(addPage.getByRole('button', { name: '提 交' })).toBeVisible()
})
