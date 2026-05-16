import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/CompanySetting/CompanyInfo renders captured company info default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/CompanySetting/CompanyInfo'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '企业信息', exact: true })).toHaveClass(/is-active/)

  await expect(page.getByRole('heading', { name: '企业信息' })).toBeVisible()
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()
  await expect(page.getByText('企业名称：')).toBeVisible()
  await expect(page.getByText('路客云6TS5的店铺')).toBeVisible()
  await expect(page.getByText('企业类型：')).toBeVisible()
  await expect(page.getByText('民宿', { exact: true })).toBeVisible()
  await expect(page.getByText('联系电话：')).toBeVisible()
  await expect(page.getByText('暂无联系电话')).toBeVisible()
  await expect(page.getByText('所在城市：')).toBeVisible()
  await expect(page.getByText('暂无所在城市')).toBeVisible()
  await expect(page.getByText('详细地址：')).toBeVisible()
  await expect(page.getByText('暂无详细地址')).toBeVisible()
  await expect(page.getByText('图片：')).toBeVisible()
  await expect(page.getByText('暂无图片数据')).toBeVisible()
})

test('/CompanySetting/CompanyInfo supports captured edit state and cancel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/CompanySetting/CompanyInfo'))

  await page.getByRole('button', { name: '编 辑' }).click()
  await expect(page.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
  await expect(page.getByLabel('企业名称')).toHaveValue('路客云6TS5的店铺')
  await expect(page.getByLabel('企业类型')).toHaveValue('民宿')
  await expect(page.getByLabel('联系电话')).toHaveValue('')
  await expect(page.getByLabel('所在城市')).toHaveValue('')
  await expect(page.getByLabel('所在城市')).toHaveAttribute('placeholder', '请选择所在城市')
  await expect(page.getByLabel('详细地址')).toHaveValue('')
  await expect(page.getByRole('button', { name: '上传' })).toBeVisible()

  await page.getByRole('button', { name: '取 消' }).click()
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()
  await expect(page.getByText('暂无图片数据')).toBeVisible()
})
