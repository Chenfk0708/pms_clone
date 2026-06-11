import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const forbiddenDevelopmentCopy =
  /mock 数据|mock provider|provider=mock|未接入|待接入|阻塞|后端未就绪|后端接口未完成/i

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openCompanyQualification(
  page: import('@playwright/test').Page,
  mode: 'success' | 'empty' | 'error' = 'success',
  latencyMs = 0,
) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(
    ({ mockMode, mockLatencyMs }) => {
      window.localStorage.setItem('pms_token', 'company-qualification-test-token')
      window.localStorage.setItem('pms.companyQualification.provider', 'mock')
      window.localStorage.setItem('pms.companyQualification.mockMode', mockMode)
      window.localStorage.setItem('pms.companyQualification.mockLatencyMs', String(mockLatencyMs))
    },
    { mockMode: mode, mockLatencyMs: latencyMs },
  )
  await page.goto(appUrl('/#/InformationMaintenance/qualification'))
}

test('/InformationMaintenance/qualification loads through the unified qualification service', async ({ page }) => {
  await openCompanyQualification(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.company-qualification-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '企业资质' })).toHaveClass(/is-active/)
  await expect(page.getByRole('tab', { name: '企业信息' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '营业资质' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '法人证件' })).toBeVisible()

  await expect(page.getByRole('heading', { name: '企业信息', level: 2 })).toBeVisible()
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()
  await expect(page.getByRole('status', { name: '企业资质操作反馈' })).toContainText('企业资质已加载')
  await expect(page.getByTestId('company-qualification-service-contract')).toContainText(
    '"path": "/company/qualification/get"',
  )
  await expect(page.getByTestId('company-qualification-service-contract')).toContainText(
    '"action": "get"',
  )
  await expect(page.getByLabel('企业资质企业信息详情')).toContainText('路客云6TS5的店铺')
  await expect(page.getByLabel('企业资质企业信息详情')).toContainText('民宿')
  await expect(page.getByLabel('企业资质企业信息详情')).toContainText('暂无联系电话')
  await expect(page.getByLabel('企业资质企业信息详情')).toContainText('暂无所在城市')
  await expect(page.getByLabel('企业资质企业信息详情')).toContainText('暂无详细地址')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})

test('/InformationMaintenance/qualification supports tabs upload and save feedback', async ({ page }) => {
  await openCompanyQualification(page)

  await page.getByRole('tab', { name: '营业资质' }).click()
  await expect(page.getByRole('heading', { name: '营业资质', level: 2 })).toBeVisible()
  await page.getByRole('button', { name: '公共场所许可证查看示例' }).click()
  await expect(page.getByRole('dialog', { name: '公共场所许可证查看示例' })).toContainText('公共场所许可证需包含经营主体')
  await page.getByRole('button', { name: '关闭说明' }).click()
  await expect(page.getByRole('dialog', { name: '公共场所许可证查看示例' })).toHaveCount(0)
  await page.getByRole('button', { name: '下载授权承诺函模板' }).click()
  await expect(page.getByRole('status', { name: '企业资质操作反馈' })).toContainText('授权承诺函模板下载任务已创建')

  await page.getByRole('button', { name: '上传 营业执照' }).click()
  await expect(page.getByRole('status', { name: '企业资质操作反馈' })).toContainText('营业执照已上传')
  await expect(page.getByLabel('营业执照文件列表')).toContainText('营业执照-深圳宝安店.png')

  await page.getByRole('tab', { name: '法人证件' }).click()
  await expect(page.getByRole('heading', { name: '法人证件', level: 2 })).toBeVisible()
  await page.getByRole('button', { name: '上传 证件人像面照片' }).click()
  await expect(page.getByRole('status', { name: '企业资质操作反馈' })).toContainText('证件人像面照片已上传')
  await expect(page.getByLabel('证件人像面照片文件列表')).toContainText('法人身份证-人像面.png')

  await page.getByRole('tab', { name: '企业信息' }).click()
  await page.getByRole('button', { name: '编 辑' }).click()
  await expect(page.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
  await page.getByLabel('企业名称').fill('路客云6TS5旗舰店')
  await page.getByLabel('联系电话').fill('18123941382')
  await page.getByLabel('所在城市').selectOption('深圳 / 福田')
  await page.getByLabel('详细地址').fill('福田区会展中心店 18 楼')
  await page.getByRole('button', { name: '上传 企业图片' }).click()
  await expect(page.getByLabel('企业资质图片列表')).toContainText('企业门头-01.png')
  await page.getByRole('button', { name: '保 存' }).click()
  await expect(page.getByRole('status', { name: '企业资质操作反馈' })).toContainText('企业资质已保存')
  await expect(page.getByLabel('企业资质企业信息详情')).toContainText('路客云6TS5旗舰店')
  await expect(page.getByLabel('企业资质企业信息详情')).toContainText('18123941382')
  await expect(page.getByLabel('企业资质企业信息详情')).toContainText('深圳 / 福田')
  await expect(page.getByLabel('企业资质图片列表')).toContainText('企业门头-01.png')
})

test('/InformationMaintenance/qualification validates contact phone before saving', async ({ page }) => {
  await openCompanyQualification(page)

  await page.getByRole('button', { name: '编 辑' }).click()
  await page.getByLabel('企业名称').fill('路客云6TS5旗舰店')
  await page.getByLabel('联系电话').fill('12000000000')
  await page.getByLabel('所在城市').selectOption('深圳 / 福田')
  await page.getByLabel('详细地址').fill('福田区会展中心店 18 楼')
  await page.getByRole('button', { name: '保 存' }).click()

  await expect(page.locator('.company-edit-row em').filter({ hasText: '联系电话格式不正确' })).toBeVisible()
  await expect(page.getByRole('status', { name: '企业资质操作反馈' })).toContainText('请先补全企业信息后再保存')
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
  await expect(page.getByLabel('企业资质企业信息详情')).toHaveCount(0)
})

test('/InformationMaintenance/qualification cancels edits and keeps coordinated route entries', async ({ page }) => {
  await openCompanyQualification(page)

  await page.getByRole('button', { name: '编 辑' }).click()
  await page.getByLabel('企业名称').fill('不会保存的企业名称')
  await page.getByRole('button', { name: '取 消' }).click()
  await expect(page.getByRole('status', { name: '企业资质操作反馈' })).toContainText('已取消本次修改')
  await expect(page.getByLabel('企业资质企业信息详情')).not.toContainText('不会保存的企业名称')

  await expect(page.getByRole('link', { name: '权限设置', exact: true })).toHaveAttribute('href', '#/setting/role')
  await page.goto(appUrl('/#/InformationMaintenance/qualification'))
  await expect(page.getByRole('link', { name: 'API keys', exact: true })).toHaveAttribute('href', '#/CompanySetting/Apikeys')
})

test('/InformationMaintenance/qualification exposes loading empty and error states with retry', async ({ browser }) => {
  const loadingPage = await browser.newPage()
  await openCompanyQualification(loadingPage, 'success', 900)
  await expect(loadingPage.getByRole('status', { name: '企业资质操作反馈' })).toContainText('企业资质加载中')
  await expect(loadingPage.getByRole('button', { name: '编 辑' })).toBeDisabled()
  await expect(loadingPage.getByRole('status', { name: '企业资质操作反馈' })).toContainText('企业资质已加载')

  const emptyPage = await browser.newPage()
  await openCompanyQualification(emptyPage, 'empty')
  await expect(emptyPage.getByRole('status', { name: '企业资质空态' })).toContainText('暂未完善企业资质')
  await expect(emptyPage.getByRole('button', { name: '立即完善' })).toBeVisible()
  await expect(emptyPage.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  const errorPage = await browser.newPage()
  await openCompanyQualification(errorPage, 'error')
  await expect(errorPage.getByRole('alert', { name: '企业资质数据错误' })).toContainText('企业资质加载失败')
  await errorPage.evaluate(() => window.localStorage.setItem('pms.companyQualification.mockMode', 'success'))
  await errorPage.getByRole('button', { name: '重新加载' }).click()
  await expect(errorPage.getByRole('status', { name: '企业资质操作反馈' })).toContainText('企业资质已重新加载')
})
