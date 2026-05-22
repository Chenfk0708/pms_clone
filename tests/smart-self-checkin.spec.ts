import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartHome matches managed self check-in dashboard state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '自助入住' })).toHaveClass(/is-active/)
  await expect(page.locator('.smart-checkin-page')).toHaveAttribute('data-provider', 'mock')

  await expect(page.getByRole('heading', { name: '智慧酒店：全场景自助入住', level: 1 })).toBeVisible()
  await expect(page.getByText('路客云支持三种数字化自助入住模式，灵活适配酒店、民宿、公寓等全业态。')).toBeVisible()
  await expect(page.getByRole('heading', { name: '云端入住登记', level: 2 })).toBeVisible()
  await expect(page.getByLabel('云端入住登记开关')).toHaveAttribute('aria-pressed', 'true')

  const plans = page.getByLabel('云端入住登记方式').locator('.smart-checkin-plan')
  await expect(plans).toHaveCount(4)
  await expect(plans.first()).toHaveClass(/is-active/)
  await expect(plans.nth(1)).toContainText('推荐')
  await expect(plans.nth(2)).toContainText('未开通')

  await expect(page.locator('.smart-checkin-section').first().getByRole('heading', { name: '场景流程' })).toBeVisible()
  await expect(page.getByRole('button', { name: '编辑短信内容' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '前台数字化（扫码）' })).toBeVisible()
  await expect(page.getByRole('button', { name: '下载二维码' })).toBeVisible()
  await expect(page.getByRole('button', { name: '全局设置' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '自助机入住' })).toBeVisible()
  await expect(page.getByRole('button', { name: '联系智慧酒店专家' })).toBeVisible()
  await expect(page.getByText('可搭配更多智能硬件，前往智能硬件商城查看')).toBeVisible()
})

test('/smartHotel/smartHome routes to sms setting and updates flow for mini program plan', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome'))

  await page.locator('.smart-checkin-plan').nth(1).click()
  const steps = page.locator('.smart-checkin-section').first().locator('.smart-checkin-step')
  await expect(steps).toHaveCount(6)
  await expect(steps.nth(0)).toContainText('接收短信')
  await expect(steps.nth(1)).toContainText('进入智住小程序')
  await expect(steps.nth(2)).toContainText('身份登记')
  await expect(steps.nth(3)).toContainText('缴纳押金')
  await expect(steps.nth(4)).toContainText('办理入住')
  await expect(steps.nth(5)).toContainText('查看门锁密码')

  await page
    .locator('.smart-checkin-section')
    .first()
    .getByRole('button', { name: '编辑短信内容' })
    .evaluate((element: HTMLButtonElement) => element.click())
  await expect(page).toHaveURL(/\/setting\/balanceAndTemplate$/)
  await expect(page.getByRole('heading', { name: '短信设置', level: 1 })).toBeVisible()
})

test('/smartHotel/smartHome expands scan and kiosk sections to match target scene layout', async ({ page }) => {
  await page.setViewportSize({ width: 1726, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome'))

  const sections = page.locator('.smart-checkin-section')
  const scanSection = sections.nth(1)
  const kioskSection = sections.nth(2)

  const scanSteps = scanSection.locator('.smart-checkin-step')
  await expect(scanSteps).toHaveCount(7)
  await expect(scanSteps.nth(0)).toContainText('到达酒店')
  await expect(scanSteps.nth(1)).toContainText('扫描智住二维码')
  await expect(scanSteps.nth(2)).toContainText('进入智住小程序')
  await expect(scanSteps.nth(3)).toContainText('身份登记')
  await expect(scanSteps.nth(4)).toContainText('缴纳押金')
  await expect(scanSteps.nth(5)).toContainText('办理入住')
  await expect(scanSteps.nth(6)).toContainText('查看门锁密码')

  await scanSection.getByRole('button', { name: '全局设置' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/checkInGuide$/)

  await page.goto(appUrl('/smartHotel/smartHome'))
  const kioskReloaded = page.locator('.smart-checkin-section').nth(2)
  const kioskSteps = kioskReloaded.locator('.smart-checkin-step')
  await expect(kioskSteps).toHaveCount(6)
  await expect(kioskSteps.nth(0)).toContainText('到达酒店')
  await expect(kioskSteps.nth(1)).toContainText('入住办理')
  await expect(kioskSteps.nth(2)).toContainText('身份识别')
  await expect(kioskSteps.nth(3)).toContainText('获取房间开门权限')
  await expect(kioskSteps.nth(4)).toContainText('连接WIFI')
  await expect(kioskSteps.nth(5)).toContainText('行李寄存')

  await expect(kioskReloaded.getByRole('heading', { name: '入住办理' })).toBeVisible()
  await expect(kioskReloaded.getByRole('heading', { name: '获取房间开门权限' })).toBeVisible()
  await expect(kioskReloaded.getByRole('heading', { name: '连接WIFI' })).toBeVisible()
  await expect(kioskReloaded.getByRole('heading', { name: '行李寄存柜' })).toBeVisible()
  await expect(kioskReloaded.locator('.smart-checkin-device-card')).toHaveCount(11)

  await kioskReloaded.getByRole('link', { name: '智能硬件商城' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/mall$/)
})

test('/smartHotel/smartHome supports collapse, purchase, and routing interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome'))

  const switchButton = page.getByLabel('云端入住登记开关')
  await switchButton.click()
  await expect(switchButton).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByLabel('自助入住操作反馈')).toContainText('云端入住登记已关闭')

  await page.locator('.smart-checkin-section').first().locator('.smart-checkin-section__meta').click()
  await expect(page.locator('.smart-checkin-section__body').first()).toBeHidden()
  await page.locator('.smart-checkin-section').first().locator('.smart-checkin-section__meta').click()
  await expect(page.locator('.smart-checkin-section__body').first()).toBeVisible()

  await page.locator('.smart-checkin-section').nth(1).locator('.smart-checkin-section__meta').click()
  await expect(page.locator('.smart-checkin-section__body').nth(1)).toBeHidden()
  await page.locator('.smart-checkin-section').nth(1).locator('.smart-checkin-section__meta').click()
  await expect(page.locator('.smart-checkin-section__body').nth(1)).toBeVisible()

  await page.locator('.smart-checkin-plan').nth(2).click()
  const purchaseDialog = page.getByRole('dialog', { name: '付费购买' })
  await expect(purchaseDialog).toBeVisible()
  await page.getByRole('button', { name: '联系专家' }).click()
  const expertDialog = page.getByRole('dialog', { name: '智慧酒店专家' })
  await expect(expertDialog).toBeVisible()
  await page.getByRole('button', { name: '前往硬件商城' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/mall$/)
})

test('/smartHotel/smartHome keeps section layout in empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome?mockState=empty'))

  await expect(page.locator('.smart-checkin-page')).toHaveAttribute('data-empty', 'true')
  await expect(page.getByLabel('自助入住空状态')).toContainText('当前暂无可发布的自助入住方案')
  await expect(page.getByRole('heading', { name: '前台数字化（扫码）' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '自助机入住' })).toBeVisible()
})

test('/smartHotel/smartHome exposes retryable error state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHome?mockState=error'))

  await expect(page.getByRole('alert', { name: '自助入住加载失败' })).toContainText('自助入住加载失败，请稍后重试')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHome$/)
})
