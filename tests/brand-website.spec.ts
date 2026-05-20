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
  await collapseChatDock(page)
}

function pageNavButton(page: import('@playwright/test').Page, index: number) {
  return page.locator('.brand-page-nav button').nth(index)
}

function toolbarButton(page: import('@playwright/test').Page, index: number) {
  return page.locator('.brand-toolbar button').nth(index)
}

function statusBar(page: import('@playwright/test').Page) {
  return page.locator('[role="status"][aria-label="品牌官网操作反馈"]')
}

async function collapseChatDock(page: import('@playwright/test').Page) {
  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }
}

test('/mallManagement/weapp/decorate loads business data from the brand website service', async ({ page }) => {
  await openBrandWebsite(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.brand-toolbar h1')).toHaveText('品牌官网')
  await expect(page.locator('.brand-module-menu .is-active')).toContainText('品牌官网')
  await expect(page.getByTestId('brand-website-contract')).toContainText('"traceId":"mock-ota--siyu--pinpai-guanwang-list-001"')
  await expect(page.locator('select[aria-label="门店"]')).toHaveValue('camp-ts5')
  await expect(page.locator('input[aria-label="运营日期"]')).toHaveValue('2026-05-18')
  await expect(page.locator('.brand-metric-strip button')).toHaveCount(4)
  await expect(page.locator('.brand-metric-strip')).toContainText('今日访问')
  await expect(page.locator('.brand-metric-strip')).toContainText('1,286')
  await expect(page.locator('.brand-template-market .brand-template')).toHaveCount(4)
  await expect(page.locator('.brand-toolbar p')).toContainText('路客云 TS5 的店铺')

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/mock|provider|未接入|阻塞|后端未就绪|后端接口未完成|接口契约|未取证/i)
})

test('/mallManagement/weapp/decorate supports filter, route and section interactions', async ({ page }) => {
  await openBrandWebsite(page)

  await page.locator('select[aria-label="门店"]').selectOption('camp-hotel')
  await page.locator('input[aria-label="运营日期"]').fill('2026-05-19')
  await toolbarButton(page, 0).click()
  await expect(statusBar(page)).toContainText('已按当前条件更新品牌官网')
  await expect(page.getByTestId('brand-website-contract')).toContainText('"campId":"camp-hotel"')
  await expect(page.getByTestId('brand-website-contract')).toContainText('"businessDate":"2026-05-19"')

  await toolbarButton(page, 2).click()
  await expect(statusBar(page)).toContainText('品牌官网数据已刷新')

  await toolbarButton(page, 3).click()
  await expect(statusBar(page)).toContainText('导出任务已创建')

  await page.locator('.brand-metric-strip button').first().click()
  await expect(page.locator('[role="dialog"][aria-label="指标详情"]')).toContainText('今日访问')
  await page.locator('[role="dialog"][aria-label="指标详情"] header button').click()
  await expect(page.locator('[role="dialog"][aria-label="指标详情"]')).toBeHidden()

  await page.locator('.brand-template-market .brand-template').nth(1).locator('button').first().click()
  await expect(statusBar(page)).toContainText('已应用酒店主题模板')
  await page.locator('.brand-template-market .brand-template').nth(1).locator('.brand-secondary-button').click()
  await expect(page.locator('[role="dialog"][aria-label="模板详情"]')).toContainText('酒店主题模板')
  await page.locator('[role="dialog"][aria-label="模板详情"] header button').click()

  await pageNavButton(page, 3).click()
  await page.locator('.brand-coupon-filter input').fill('春季')
  await page.locator('.brand-coupon-filter button').first().click()
  await expect(statusBar(page)).toContainText('已筛选领券活动')
  await page.locator('.brand-table-toolbar button').first().click()
  await expect(page.locator('[role="dialog"][aria-label="活动详情"]')).toContainText('春季连住券')
  await page.locator('[role="dialog"][aria-label="活动详情"] header button').click()

  await pageNavButton(page, 1).click()
  await page.locator('.brand-store-row button').click()
  await expect(statusBar(page)).toContainText('店铺主页配置已保存')
  await page.locator('.brand-route-grid button').first().click()
  await expect(page).toHaveURL(/\/houseManage\/days$/)
  await page.goto(appUrl('/mallManagement/weapp/decorate'))
  await collapseChatDock(page)

  await pageNavButton(page, 2).click()
  await page.locator('.brand-store-row button').click()
  await expect(statusBar(page)).toContainText('个人中心配置已保存')
  await page.locator('.brand-todo-list button').first().click()
  await expect(statusBar(page)).toContainText('已标记处理')

  await pageNavButton(page, 4).click()
  await page.locator('.brand-savebar button').click()
  await expect(statusBar(page)).toContainText('配置已保存并发布')

  await pageNavButton(page, 5).click()
  await page.locator('.brand-upload').click()
  await expect(statusBar(page)).toContainText('悬浮框素材已上传')

  await pageNavButton(page, 6).click()
  await page.locator('.brand-upload').click()
  await expect(statusBar(page)).toContainText('首页弹窗素材已上传')

  await pageNavButton(page, 7).click()
  await page.locator('.brand-style-swatches button').first().click()
  await expect(statusBar(page)).toContainText('全局风格颜色已更新')
})

test('/mallManagement/weapp/decorate handles empty and error envelopes', async ({ browser }) => {
  const emptyPage = await browser.newPage()
  await openBrandWebsite(emptyPage, 'empty')
  await expect(emptyPage.locator('[role="status"][aria-label="品牌官网空态"]')).toContainText('暂无符合当前条件的品牌官网配置')
  await expect(emptyPage.locator('.brand-state-card button')).toBeVisible()

  const errorPage = await browser.newPage()
  await openBrandWebsite(errorPage, 'error')
  await expect(errorPage.locator('[role="alert"]')).toContainText('品牌官网数据加载失败')
  await errorPage.locator('.brand-state-card button').click()
  await expect(statusBar(errorPage)).toContainText('已重新加载品牌官网')
})
