import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/memberCenter/level matches captured member level default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/level'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '会员等级' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '会员等级列表', level: 1 })).toBeVisible()
  await expect(page.getByText('最多只可以设置值8个等级，建议3-6个等级即可')).toBeVisible()
  await expect(page.getByRole('button', { name: '新建会员等级' })).toBeVisible()
  await expect(page.getByRole('button', { name: '会员升级设置' })).toBeVisible()

  await expect(page.getByRole('table', { name: '会员等级列表' }).locator('thead th')).toHaveText([
    '会员等级',
    '等级名称',
    '免费升级条件',
    '会员折扣',
    '会员权益',
    '会员卡面',
    '操作',
  ])
  await expect(page.getByRole('table', { name: '会员等级列表' })).toContainText('等级1')
  await expect(page.getByRole('table', { name: '会员等级列表' })).toContainText('普通会员')
  await expect(page.getByRole('table', { name: '会员等级列表' })).toContainText('无门槛')
})

test('/scrm/memberCenter/level supports captured member level dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/level'))

  await page.getByRole('button', { name: '新建会员等级' }).click()
  await expect(page.getByRole('dialog', { name: '新增会员等级' })).toContainText('等级名称')
  await expect(page.getByRole('dialog', { name: '新增会员等级' })).toContainText('免费升级条件')
  await expect(page.getByRole('dialog', { name: '新增会员等级' })).toContainText('会员折扣')
  await expect(page.getByRole('dialog', { name: '新增会员等级' })).toContainText('会员卡面')
  await expect(page.getByRole('dialog', { name: '新增会员等级' })).toContainText('会员权益')
  await page.getByRole('button', { name: '取 消' }).click()

  await page.getByRole('button', { name: '编辑' }).click()
  await expect(page.getByPlaceholder('请输入等级名称')).toHaveValue('普通会员')
  await page.getByRole('button', { name: '取 消' }).click()

  await page.getByRole('button', { name: '会员升级设置' }).click()
  await expect(page.getByRole('dialog', { name: '会员升级设置' })).toContainText('计算累计时间段')
  await expect(page.getByRole('dialog', { name: '会员升级设置' })).toContainText('一个自然年')
  await expect(page.getByRole('dialog', { name: '会员升级设置' })).toContainText('会员升级规则')
  await expect(page.getByLabel('用户总计成功预订的次数与天数总和')).toBeChecked()
})
