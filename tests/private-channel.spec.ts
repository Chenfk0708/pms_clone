import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.describe('private channel page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(appUrl('/channels/private'))
  })

  test('matches captured default private-channel surface', async ({ page }) => {
    await expect(page.locator('.page-content > .page-header')).toBeHidden()
    await expect(page.getByRole('heading', { name: '未直连渠道', level: 2 })).toBeVisible()
    await expect(page.getByRole('article', { name: '企业微信' })).toBeVisible()
    await expect(page.getByRole('article', { name: '公众号' })).toBeVisible()
    await expect(page.getByRole('article', { name: '品牌小程序' })).toBeVisible()
    await expect(page.getByRole('button', { name: '立即关联' })).toHaveCount(2)
    await expect(page.getByRole('button', { name: '订阅开通' })).toBeVisible()
    await expect(page.locator('.private-chat')).toHaveCount(0)
    await expect(page.locator('.chat-dock')).toHaveCount(1)
    await expect(page.locator('.chat-dock .chat-item')).toHaveCount(4)
  })

  test('opens captured enterprise wecom detail route', async ({ page }) => {
    await page.getByRole('article', { name: '企业微信' }).getByRole('button', { name: '立即关联' }).click()

    await expect(page).toHaveURL(/\/channels\/private\/setting\/weComSetting$/)
    await expect(page.locator('.private-breadcrumb')).toContainText('私域')
    await expect(page.locator('.private-breadcrumb')).toContainText('渠道详情')
    await expect(page.getByRole('heading', { name: '企业微信', level: 2 })).toBeVisible()
    await expect(page.getByText('免费试用90天')).toBeVisible()
    await expect(page.getByText('待配置')).toBeVisible()
    await expect(page.getByRole('button', { name: '立即配置' })).toBeVisible()
    await expect(page.getByText('自动化的获客流程')).toBeVisible()
    await expect(page.getByText('低成本的获客方式')).toBeVisible()
    await expect(page.getByText('丰富的活动运营数据分析和精细化的管理')).toBeVisible()
  })

  test('opens captured official-account authorization route', async ({ page }) => {
    await page.getByRole('article', { name: '公众号' }).getByRole('button', { name: '立即关联' }).click()

    await expect(page).toHaveURL(/\/channels\/private\/setting\/authorizationSettings$/)
    await expect(page.getByText('授权微信公众号')).toBeVisible()
    await expect(page.getByText('将您已认证企业资质的公众号，授权给路客云后')).toBeVisible()
    await expect(page.getByRole('button', { name: '已有公众号，立即授权' })).toBeVisible()
    await expect(page.getByRole('button', { name: '没有公众号，立即开通' })).toBeVisible()
  })

  test('supports captured chat collapse and program subscription baseline', async ({ page }) => {
    await page.locator('.chat-dock__collapse').click()
    await expect(page.locator('.chat-dock')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '打开全部会话' })).toBeVisible()

    await page.getByRole('button', { name: '打开全部会话' }).click()
    await expect(page.locator('.chat-dock')).toBeVisible()
    await expect(page.locator('.chat-dock .chat-item')).toHaveCount(4)

    await page.getByRole('article', { name: '品牌小程序' }).getByRole('button', { name: '订阅开通' }).click()
    await expect(page).toHaveURL(/\/channels\/private$/)
    await expect(page.getByRole('article', { name: '品牌小程序' })).toBeVisible()
  })

  test('uses private channel mock provider contract without development copy', async ({ page }) => {
    await expect(page.getByTestId('private-channel-contract')).toContainText('"provider":"mock"')
    await expect(page.getByTestId('private-channel-contract')).toContainText('"traceId":"mock-ota--siyu--siyu-qudao-list-001"')

    const visibleText = await page.locator('.private-channel-page').innerText()
    expect(visibleText).not.toMatch(/mock|未接入|阻塞|后端未就绪|后端接口未完成|后端|provider/i)

    await page.getByRole('article', { name: '品牌小程序' }).getByRole('button', { name: '订阅开通' }).click()
    await expect(page.getByRole('status', { name: '私域渠道操作反馈' })).toContainText('品牌小程序订阅方案已加入开通清单')
  })

  test('shows business empty and error states from private channel service', async ({ browser }) => {
    const emptyContext = await browser.newContext()
    const emptyPage = await emptyContext.newPage()
    await emptyPage.setViewportSize({ width: 1440, height: 900 })
    await emptyPage.addInitScript(() => {
      window.localStorage.setItem('pmsPrivateChannelScenario', 'empty')
    })
    await emptyPage.goto(appUrl('/channels/private'))
    await expect(emptyPage.getByRole('status', { name: '私域渠道空态' })).toContainText('暂无符合当前条件的私域渠道')
    await expect(emptyPage.getByTestId('private-channel-contract')).toContainText('"scenario":"empty"')
    await emptyContext.close()

    const errorContext = await browser.newContext()
    const errorPage = await errorContext.newPage()
    await errorPage.setViewportSize({ width: 1440, height: 900 })
    await errorPage.addInitScript(() => {
      window.localStorage.setItem('pmsPrivateChannelScenario', 'error')
    })
    await errorPage.goto(appUrl('/channels/private'))
    await expect(errorPage.getByRole('alert')).toContainText('私域渠道数据加载失败')
    await errorPage.getByRole('button', { name: '重新加载' }).click()
    await expect(errorPage.getByRole('status', { name: '私域渠道操作反馈' })).toContainText('已重新加载私域渠道')
    await errorContext.close()
  })
})
