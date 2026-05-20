import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/checkInGuide loads provider-backed rules data and supporting dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/checkInGuide'))

  const diagnostics = page.locator('#smart-hotel-global-setting-diagnostics')
  await expect(diagnostics).toHaveAttribute('data-provider', 'mock')
  await expect(diagnostics).toHaveAttribute('data-state', 'success')
  await expect(diagnostics).toHaveAttribute('data-request', /1796067693589061634/)

  await expect(page.getByText('云端入住登记模式为「仅发送门锁密码」，该模式下无需配置。')).toBeVisible()
  await expect(page.getByRole('button', { name: '保 存' })).toBeDisabled()
  await expect(page.getByText('4 个房型已同步门锁时效策略')).toBeVisible()
  await expect(page.getByText('短信模板 15 条')).toBeVisible()

  await page.getByRole('button', { name: '充值' }).click()
  await expect(page.getByRole('dialog', { name: '认证与短信余量详情' })).toBeVisible()
  await expect(page.getByText('实名认证剩余 5 次')).toBeVisible()
  await expect(page.getByText('短信剩余 50 条')).toBeVisible()
  await expect(page.getByText('携程直连')).toBeVisible()
  await page.getByRole('button', { name: '关闭认证与短信余量详情' }).click()
  await expect(page.getByRole('dialog', { name: '认证与短信余量详情' })).toHaveCount(0)

  await page.getByRole('button', { name: '查看短信模板' }).click()
  await expect(page.getByRole('dialog', { name: '短信发送模板' })).toBeVisible()
  await expect(page.getByText('获得密码（智能入住）')).toBeVisible()
  await expect(page.getByText('实名登记（智能入住）')).toBeVisible()
  await page.getByRole('button', { name: '关闭短信发送模板' }).click()
  await expect(page.getByRole('dialog', { name: '短信发送模板' })).toHaveCount(0)
})

test('/smartHotel/checkInGuide supports tabs, route shortcuts, payment details, and chat collapse', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/checkInGuide'))

  await page.getByRole('tab', { name: '入住指引' }).click()
  await expect(page.getByRole('tab', { name: '入住指引' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('请确认订单信息，完成身份登记后查看门锁密码。')).toBeVisible()
  await expect(page.getByRole('link', { name: '前往智住小程序' })).toBeVisible()
  await page.getByRole('link', { name: '前往智住小程序' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartSettings$/)

  await page.goto(appUrl('/smartHotel/checkInGuide'))
  await page.getByRole('button', { name: '前往房型信息' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)

  await page.goto(appUrl('/smartHotel/checkInGuide'))
  await page.getByRole('button', { name: '查看支付方式' }).click()
  await expect(page.getByRole('dialog', { name: '押金与收款方式' })).toBeVisible()
  await expect(page.getByText('微信')).toBeVisible()
  await expect(page.getByText('支付宝')).toBeVisible()
  await page.getByRole('button', { name: '关闭押金与收款方式' }).click()

  await expect(page.locator('.chat-dock')).toContainText('全部会话')
  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
})

test('/smartHotel/checkInGuide exposes empty and error feedback states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/smartHotel/checkInGuide?mockState=empty'))
  await expect(page.locator('#smart-hotel-global-setting-diagnostics')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByText('当前门店暂未同步可配置房型，请先前往房型信息完成房型与门锁绑定。')).toBeVisible()
  await expect(page.getByRole('button', { name: '前往房型信息' })).toBeVisible()

  await page.goto(appUrl('/smartHotel/checkInGuide?mockState=error'))
  await expect(page.locator('#smart-hotel-global-setting-diagnostics')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert')).toContainText('全局设置数据加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
