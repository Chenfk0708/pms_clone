import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartSettings matches captured decoration settings surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartSettings'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '智住小程序' })).toHaveClass(/is-active/)

  await expect(page.getByRole('heading', { name: '智住小程序', level: 1 })).toBeVisible()
  await expect(page.getByText('版本号：v4.10.7')).toBeVisible()
  await expect(page.getByRole('tab', { name: '装修' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '分享' })).toHaveAttribute('aria-selected', 'false')

  await expect(page.getByText('操作按钮设置')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加按钮' })).toBeVisible()
  await expect(page.getByText('支持新增底部操作按钮，可自定义标题名称、自定义设置触发后显示的内容。')).toBeVisible()

  await expect(page.getByLabel('智住小程序操作按钮').locator('.smart-settings-button-row')).toHaveCount(7)
  const defaultButtonNames = [
    '入住登记',
    '入住指引',
    '入住须知',
    'WIFI上网',
    '续住',
    '一键退房',
    '开发票',
  ]
  for (const [index, name] of defaultButtonNames.entries()) {
    await expect(page.getByPlaceholder('请输入按钮名称').nth(index)).toHaveValue(name)
  }
  await expect(page.getByPlaceholder('请输入弹框文案')).toHaveCount(7)
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
})

test('/smartHotel/smartSettings supports captured edit, add, share, and save states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartSettings'))

  await page.getByPlaceholder('请输入按钮名称').first().fill('自助入住登记')
  await expect(page.getByPlaceholder('请输入按钮名称').first()).toHaveValue('自助入住登记')

  await page.getByRole('button', { name: '添加按钮' }).click()
  await expect(page.getByLabel('智住小程序操作按钮').locator('.smart-settings-button-row')).toHaveCount(8)
  await expect(page.getByPlaceholder('请输入按钮名称').last()).toHaveValue('')

  await page.getByRole('tab', { name: '分享' }).click()
  await expect(page.getByRole('tab', { name: '分享' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('分享设置')).toBeVisible()
  await expect(page.getByText('小程序二维码')).toBeVisible()

  await page.getByRole('tab', { name: '装修' }).click()
  await page.getByRole('button', { name: '保 存' }).click()
  await expect(page.getByText('已保存智住小程序配置')).toBeVisible()
})
