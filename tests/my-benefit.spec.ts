import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/version/myBenefit matches captured my-benefit resource state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/myBenefit'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '我的权益' })).toHaveClass(/is-active/)
  await expect(page.getByText('版本号：v4.10.7')).toBeVisible()
  await expect(page.getByRole('tab', { name: '版本资源' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '功能服务' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '开通记录' })).toBeVisible()
  await expect(page.getByRole('region', { name: '当前版本' })).toContainText('当前版本：畅享版')
  await expect(page.getByRole('region', { name: '当前版本' })).toContainText('有效期到：2027-09-28')
  await expect(page.getByRole('button', { name: '续 费' })).toBeVisible()
  await expect(page.getByRole('button', { name: '版本升级' })).toBeVisible()

  await expect(page.getByRole('table', { name: '版本资源表' }).locator('thead th')).toHaveText([
    '资源名称',
    '可用数量',
    '已经用数量',
    '资源来源',
    '状态',
    '有效期',
    '操作',
  ])
  await expect(page.getByRole('table', { name: '版本资源表' })).toContainText('门店数')
  await expect(page.getByRole('table', { name: '版本资源表' })).toContainText('库存数')
  await expect(page.getByRole('table', { name: '版本资源表' })).toContainText('抖音直连')
})

test('/version/myBenefit shows captured version upgrade comparison', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/myBenefit'))

  await page.getByRole('button', { name: '版本升级' }).click()

  await expect(page.getByRole('heading', { name: '当前版本：畅享版' })).toBeVisible()
  await expect(page.getByRole('button', { name: '版本对比' })).toBeVisible()
  await expect(page.getByRole('article', { name: '标准版' })).toContainText('免费使用')
  await expect(page.getByRole('article', { name: '畅享版' })).toContainText('1388元/一年')
  await expect(page.getByRole('article', { name: '定制版' })).toContainText('50000元/起')
  await expect(page.getByRole('region', { name: '版本订阅功能明细' })).toContainText('库存(10个)')
  await expect(page.getByRole('region', { name: '版本订阅功能明细' })).toContainText('专业住宿管理')
  await expect(page.getByRole('region', { name: '版本订阅功能明细' })).toContainText('服务特权')
})
