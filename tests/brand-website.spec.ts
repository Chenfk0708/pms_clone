import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openBrandWebsite(page: import('@playwright/test').Page, mode: 'success' | 'empty' | 'error' = 'success') {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript((mockMode) => {
    window.localStorage.setItem('pms.brandWebsiteProvider', 'mock')
    window.localStorage.setItem('pms.brandWebsiteMockMode', mockMode)
  }, mode)
  await page.goto(appUrl('/mallManagement/weapp/decorate'))
}

function button(page: import('@playwright/test').Page, text: string) {
  return page.locator('button').filter({ hasText: text }).first()
}

test('/mallManagement/weapp/decorate loads business data from the brand website service', async ({ page }) => {
  await openBrandWebsite(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('h1').filter({ hasText: '品牌官网' })).toBeVisible()
  await expect(page.locator('a.is-active').filter({ hasText: '品牌官网' })).toBeVisible()
  await expect(page.getByTestId('brand-website-contract')).toContainText('"traceId":"mock-ota--siyu--pinpai-guanwang-list-001"')

  await expect(page.locator('select[aria-label="门店"]')).toHaveValue('camp-ts5')
  await expect(page.locator('input[aria-label="运营日期"]')).toHaveValue('2026-05-18')
  await expect(page.getByText('今日访问')).toBeVisible()
  await expect(page.getByText('1,286')).toBeVisible()
  await expect(button(page, '露营地主题模板 一键使用')).toBeVisible()
  await expect(button(page, '模板市场')).toHaveClass(/is-active/)
  await expect(page.getByText('路客云 TS5 的店铺')).toBeVisible()

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/mock|provider|未接入|阻塞|后端未就绪|后端接口未完成|接口契约|未取证/i)
})

test('/mallManagement/weapp/decorate supports filter, refresh, export and section interactions', async ({ page }) => {
  await openBrandWebsite(page)

  await page.locator('select[aria-label="门店"]').selectOption('camp-hotel')
  await page.locator('input[aria-label="运营日期"]').fill('2026-05-19')
  await button(page, '查询').click()
  await expect(page.locator('[role="status"][aria-label="品牌官网操作反馈"]')).toContainText('已按当前条件更新品牌官网')
  await expect(page.getByTestId('brand-website-contract')).toContainText('"campId":"camp-hotel"')
  await expect(page.getByTestId('brand-website-contract')).toContainText('"businessDate":"2026-05-19"')

  await button(page, '刷新').click()
  await expect(page.locator('[role="status"][aria-label="品牌官网操作反馈"]')).toContainText('品牌官网数据已刷新')

  await button(page, '导出').click()
  await expect(page.locator('[role="status"][aria-label="品牌官网操作反馈"]')).toContainText('导出任务已创建')

  await button(page, '酒店主题模板 一键使用').click()
  await expect(page.locator('[role="status"][aria-label="品牌官网操作反馈"]')).toContainText('已应用酒店主题模板')

  await button(page, '查看酒店主题模板详情').click()
  await expect(page.locator('[role="dialog"][aria-label="模板详情"]')).toContainText('酒店主题模板')
  await button(page, '关闭模板详情').click()
  await expect(page.locator('[role="dialog"][aria-label="模板详情"]')).toBeHidden()

  await button(page, '领券活动').click()
  await page.getByPlaceholder('请输入活动名称').fill('春季')
  await button(page, '搜索活动').click()
  await expect(page.locator('[role="status"][aria-label="品牌官网操作反馈"]')).toContainText('已筛选领券活动')
  await button(page, '新建活动').click()
  await expect(page.locator('[role="dialog"][aria-label="活动详情"]')).toContainText('春季连住券')
})

test('/mallManagement/weapp/decorate handles empty and error envelopes', async ({ browser }) => {
  const emptyPage = await browser.newPage()
  await openBrandWebsite(emptyPage, 'empty')
  await expect(emptyPage.locator('[role="status"][aria-label="品牌官网空态"]')).toContainText('暂无符合当前条件的品牌官网配置')
  await expect(button(emptyPage, '重置条件')).toBeVisible()

  const errorPage = await browser.newPage()
  await openBrandWebsite(errorPage, 'error')
  await expect(errorPage.locator('[role="alert"]')).toContainText('品牌官网数据加载失败')
  await button(errorPage, '重试').click()
  await expect(errorPage.locator('[role="status"][aria-label="品牌官网操作反馈"]')).toContainText('已重新加载品牌官网')
})
