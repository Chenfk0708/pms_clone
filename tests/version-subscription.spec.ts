import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/version/subscriptionCenter matches captured version subscription surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/subscriptionCenter'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '版本订阅', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '版本订阅' })).toHaveClass(/is-active/)
  await expect(page.getByText('当前版本：')).toBeVisible()
  await expect(page.locator('.version-subscription-hero strong')).toHaveText('畅享版')
  await expect(page.getByText('有效期到: 2027-09-28')).toBeVisible()

  const plans = page.getByRole('list', { name: '版本套餐' })
  await expect(plans.getByText('标准版')).toBeVisible()
  await expect(plans.getByText('免费使用')).toBeVisible()
  await expect(plans.getByText('畅享版')).toBeVisible()
  await expect(plans.getByText('1388元/一年')).toBeVisible()
  await expect(plans.getByText('高级版')).toBeVisible()
  await expect(plans.getByText('2388元/一年')).toBeVisible()
  await expect(plans.getByText('专业版')).toBeVisible()
  await expect(plans.getByText('旗舰版')).toBeVisible()
  await expect(plans.getByText('定制版')).toBeVisible()

  await expect(page.getByRole('region', { name: '版本能力矩阵' })).toContainText('库存(10个)')
  await expect(page.getByRole('region', { name: '版本能力矩阵' })).toContainText('成员账号(3个)')
  await expect(page.getByRole('region', { name: '版本能力矩阵' })).toContainText('专业住宿管理')
  await expect(page.getByRole('region', { name: '版本能力矩阵' })).toContainText('社媒渠道')
  await expect(page.getByRole('region', { name: '版本能力矩阵' })).toContainText('服务特权')

  await expect(page.getByRole('region', { name: '续费升级' })).toContainText('总费用:')
  await expect(page.getByRole('region', { name: '续费升级' })).toContainText('¥ 1388')
  await expect(page.getByRole('button', { name: '立即购买' })).toBeVisible()
  await expect(page.getByRole('button', { name: '尾房置换' })).toBeVisible()
})

test('/version/subscriptionCenter exposes captured comparison and purchase interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/subscriptionCenter'))

  await page.getByRole('button', { name: '版本对比' }).click()
  await expect(page.getByRole('dialog', { name: '版本对比' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '版本对比' })).toContainText('标准版')
  await page.getByRole('button', { name: '关闭版本对比' }).click()
  await expect(page.getByRole('dialog', { name: '版本对比' })).toHaveCount(0)

  await page.getByRole('button', { name: '两年' }).click()
  await expect(page.getByRole('region', { name: '续费升级' })).toContainText('¥ 2776')
  await page.getByRole('checkbox', { name: '我已经阅读并同意《畅享版购买协议》' }).uncheck()
  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page.getByRole('status')).toContainText('请先阅读并同意购买协议')
  await page.getByRole('checkbox', { name: '我已经阅读并同意《畅享版购买协议》' }).check()
  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail\?plan=delight/)
})
