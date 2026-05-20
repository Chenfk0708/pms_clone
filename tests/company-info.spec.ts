import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|待接入|阻塞|后端未就绪|后端接口未完成/i

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openCompanyInfo(
  page: import('@playwright/test').Page,
  mode: 'success' | 'empty' | 'error' = 'success',
  latencyMs = 0,
) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(
    ({ mockMode, mockLatencyMs }) => {
      window.localStorage.setItem('pms.companyInfo.provider', 'mock')
      window.localStorage.setItem('pms.companyInfo.mockMode', mockMode)
      window.localStorage.setItem('pms.companyInfo.mockLatencyMs', String(mockLatencyMs))
    },
    { mockMode: mode, mockLatencyMs: latencyMs },
  )
  await page.goto(appUrl('/CompanySetting/CompanyInfo'), { waitUntil: 'domcontentloaded' })
  await collapseChatDock(page)
}

async function collapseChatDock(page: import('@playwright/test').Page) {
  const collapseButton = page.getByRole('button', { name: '收起会话' }).first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }
}

function statusBar(page: import('@playwright/test').Page) {
  return page.locator('.company-info-feedback')
}

function pageSurface(page: import('@playwright/test').Page) {
  return page.locator('.company-info-page')
}

test('/CompanySetting/CompanyInfo loads through the unified company info service', async ({ page }) => {
  await openCompanyInfo(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.company-info-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '企业信息', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '企业信息' })).toBeVisible()
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()
  await expect(page.getByLabel('企业信息服务契约')).toContainText('"provider":"mock"')
  await expect(page.getByLabel('企业信息服务契约')).toContainText('"/company/info/get"')
  await expect(statusBar(page)).toContainText('企业信息已加载')
  await expect(page.getByLabel('企业信息详情')).toContainText('路客云6TS5的店铺')
  await expect(page.getByLabel('企业信息详情')).toContainText('民宿')
  await expect(page.getByLabel('企业信息详情')).toContainText('暂无联系电话')
  await expect(page.getByLabel('企业信息详情')).toContainText('暂无所在城市')
  await expect(page.getByLabel('企业信息详情')).toContainText('暂无详细地址')
  await expect(page.getByLabel('企业信息详情')).toContainText('暂无图片数据')
  await expect(pageSurface(page)).not.toContainText(forbiddenDevelopmentCopy)
})

test('/CompanySetting/CompanyInfo supports edit, upload and save feedback', async ({ page }) => {
  await openCompanyInfo(page)

  await page.getByRole('button', { name: '编 辑' }).click()
  await expect(statusBar(page)).toContainText('已进入编辑状态')
  await expect(page.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()

  await page.getByLabel('企业名称').fill('路客云6TS5旗舰店')
  await page.getByLabel('联系电话').fill('18123941382')
  await page.getByLabel('所在城市').selectOption('深圳 / 福田')
  await page.getByLabel('详细地址').fill('福田区会展中心店 18 楼')
  await page.getByRole('button', { name: '上传' }).click()
  await expect(statusBar(page)).toContainText('已添加图片，保存后生效')
  await expect(page.getByLabel('企业信息图片列表')).toContainText('企业门头-01.png')

  await page.getByRole('button', { name: '保 存' }).click()
  await expect(statusBar(page)).toContainText('企业信息已保存')
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()
  await expect(page.getByLabel('企业信息详情')).toContainText('路客云6TS5旗舰店')
  await expect(page.getByLabel('企业信息详情')).toContainText('18123941382')
  await expect(page.getByLabel('企业信息详情')).toContainText('深圳 / 福田')
  await expect(page.getByLabel('企业信息详情')).toContainText('福田区会展中心店 18 楼')
  await expect(page.getByLabel('企业信息图片列表')).toContainText('企业门头-01.png')
})

test('/CompanySetting/CompanyInfo cancels edits and keeps coordinated route entries', async ({ page }) => {
  await openCompanyInfo(page)

  await page.getByRole('button', { name: '编 辑' }).click()
  await page.getByLabel('企业名称').fill('不会保存的企业名称')
  await page.getByRole('button', { name: '取 消' }).click()
  await expect(statusBar(page)).toContainText('已取消本次修改')
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()
  await expect(page.getByLabel('企业信息详情')).not.toContainText('不会保存的企业名称')

  await page.getByRole('link', { name: '权限设置', exact: true }).click()
  await expect(page).toHaveURL(/\/setting\/role$/)

  await page.goto(appUrl('/CompanySetting/CompanyInfo'), { waitUntil: 'domcontentloaded' })
  await collapseChatDock(page)
  await page.getByRole('link', { name: '成员设置', exact: true }).click()
  await expect(page).toHaveURL(/\/setting\/member$/)
})

test('/CompanySetting/CompanyInfo exposes loading, empty and error states with retry', async ({ browser }) => {
  const loadingPage = await browser.newPage()
  await openCompanyInfo(loadingPage, 'success', 1200)
  await expect(statusBar(loadingPage)).toContainText('企业信息加载中')
  await expect(loadingPage.getByRole('button', { name: '编 辑' })).toBeDisabled()
  await expect(statusBar(loadingPage)).toContainText('企业信息已加载')

  const emptyPage = await browser.newPage()
  await openCompanyInfo(emptyPage, 'empty')
  await expect(emptyPage.locator('.company-info-state')).toContainText('暂未填写企业信息')
  await expect(emptyPage.getByRole('button', { name: '立即填写' })).toBeVisible()
  await expect(pageSurface(emptyPage)).not.toContainText(forbiddenDevelopmentCopy)

  const errorPage = await browser.newPage()
  await openCompanyInfo(errorPage, 'error')
  await expect(errorPage.locator('.company-info-state--error')).toContainText('企业信息加载失败')
  await errorPage.evaluate(() => window.localStorage.setItem('pms.companyInfo.mockMode', 'success'))
  await errorPage.getByRole('button', { name: '重试' }).click()
  await expect(statusBar(errorPage)).toContainText('企业信息已重新加载')
})
