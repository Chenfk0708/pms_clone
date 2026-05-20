import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const pagePath = '/version/subscriptionCenter'
const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|待接入|阻塞|后端未就绪|后端接口未完成/i

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.versionSubscriptionProvider', 'mock')
    window.localStorage.removeItem('pms.versionSubscriptionMockState')
    window.localStorage.removeItem('pms.versionSubscription.lastRequest')
  })
})

test('/version/subscriptionCenter loads provider-driven subscription dashboard', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.version-subscription-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.version-subscription-page')).toHaveAttribute('data-response-state', 'success')
  await expect(page.locator('.version-subscription-page')).toHaveAttribute('data-selected-plan', 'delight')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await expect(page.getByRole('link', { name: '版本订阅' })).toHaveClass(/is-active/)
  await expect(page.getByRole('region', { name: '当前版本信息' })).toContainText('当前版本：畅享版')
  await expect(page.getByRole('region', { name: '当前版本信息' })).toContainText('有效期到：2027-09-28')
  await expect(page.getByRole('list', { name: '版本套餐' })).toContainText('标准版')
  await expect(page.getByRole('list', { name: '版本套餐' })).toContainText('定制版')
  await expect(page.getByRole('region', { name: '版本能力矩阵' })).toContainText('库存(10个)')
  await expect(page.getByRole('region', { name: '版本能力矩阵' })).toContainText('成员账号(3个)')
  await expect(page.getByRole('region', { name: '版本能力矩阵' })).toContainText('门店(1个)')
  await expect(page.getByRole('region', { name: '版本能力矩阵' })).toContainText('专业住宿管理')
  await expect(page.getByRole('status', { name: '版本订阅操作反馈' })).toContainText('版本订阅数据已更新')

  const diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'success',
    dashboardEndpoint: '/edition/resource/get',
    catalogEndpoint: '/weiRoomCategories/page/get',
    dashboardRequest: {
      campId: '1796067693589061634',
    },
    catalogRequest: {
      goodsTypes: [2],
      buyCampId: '1796067693589061634',
    },
  })
})

test('/version/subscriptionCenter supports compare, plan selection, checkout, and route handoff', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '版本对比' }).click()
  await expect(page.getByRole('dialog', { name: '版本对比' })).toContainText('标准版')
  await page.getByRole('button', { name: '关闭版本对比' }).click()

  await page.getByRole('button', { name: '选择 专业版' }).click()
  await expect(page.locator('.version-subscription-page')).toHaveAttribute('data-selected-plan', 'professional')
  await page.getByRole('button', { name: '两年' }).click()
  await expect(page.getByRole('region', { name: '续费升级' })).toContainText('¥ 9776')

  await page.getByLabel('我已经阅读并同意《畅享版购买协议》').uncheck()
  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page.getByRole('status', { name: '版本订阅操作反馈' })).toContainText('请先阅读并同意购买协议')

  await page.getByLabel('我已经阅读并同意《畅享版购买协议》').check()
  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail\?plan=professional&duration=2y$/)

  await page.goto(appUrl(pagePath))
  await page.getByRole('button', { name: '尾房置换' }).click()
  await expect(page).toHaveURL(/\/version\/displacementBenefit$/)
})

test('/version/subscriptionCenter renders empty and error states with retry', async ({ page }) => {
  await page.goto(appUrl(`${pagePath}?mockState=empty`))

  await expect(page.locator('.version-subscription-page')).toHaveAttribute('data-response-state', 'empty')
  await expect(page.getByRole('status', { name: '版本订阅操作反馈' })).toContainText('当前暂无可订阅版本')
  await expect(page.getByLabel('版本订阅空态')).toContainText('当前版本资源暂未开放')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await page.goto(appUrl(`${pagePath}?mockState=error`))
  await expect(page.locator('.version-subscription-page')).toHaveAttribute('data-response-state', 'error')
  await expect(page.getByRole('alert', { name: '版本订阅数据错误' })).toContainText('版本订阅加载失败，请稍后重试')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.locator('.version-subscription-page')).toHaveAttribute('data-response-state', 'success')
})

async function readDiagnostics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rawValue = window.localStorage.getItem('pms.versionSubscription.lastRequest')
    return rawValue ? JSON.parse(rawValue) : null
  })
}
