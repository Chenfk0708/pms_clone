import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartSettings loads provider-backed decorate dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartSettings'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '智住小程序' })).toHaveClass(/is-active/)

  const diagnostics = page.getByTestId('smart-hotel-settings-service-contract')
  await expect(diagnostics).toHaveAttribute('data-provider', 'mock')
  await expect(diagnostics).toHaveAttribute('data-state', 'success')
  await expect(diagnostics).toHaveAttribute('data-request', /smartHotelSettings\/dashboard/)

  await expect(page.getByRole('heading', { name: '智住小程序', level: 1 })).toBeVisible()
  await expect(page.getByText('版本号：v4.10.7')).toBeVisible()
  await expect(page.getByRole('tab', { name: '装修' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '分享' })).toHaveAttribute('aria-selected', 'false')

  await expect(page.getByText('操作按钮设置')).toBeVisible()
  await expect(page.getByText('支持新增底部操作按钮，可自定义标题名称、自定义设置触发后显示的内容。')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加按钮' })).toBeVisible()
  await expect(page.getByLabel('智住小程序预览')).toBeVisible()

  const rows = page.locator('.smart-settings-row')
  await expect(rows).toHaveCount(7)
  await expect(rows.first().getByLabel('拖动排序')).toBeVisible()
  await expect(rows.first().getByLabel('删除按钮')).toBeVisible()
  await expect(rows.first().getByLabel('按钮名称')).toHaveAttribute('maxlength', '5')
  await expect(rows.first().getByLabel('弹框文案')).toHaveAttribute('maxlength', '256')
  await expect(rows.first()).toContainText('上传图片')
  await expect(rows.first()).toContainText('入住登记')

  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
})

test('/smartHotel/smartSettings supports decorate editing, upload feedback, add, delete, and save', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartSettings'))

  const rows = page.locator('.smart-settings-row')
  await rows.first().getByLabel('按钮名称').fill('入住码')
  await rows.first().getByLabel('弹框文案').fill('请先登记身份信息后获取门锁密码。')
  await rows.first().getByRole('button', { name: '上传图片' }).click()
  await expect(page.getByRole('status', { name: '智住小程序操作反馈' })).toContainText('已更新「入住码」图标')

  await page.getByRole('button', { name: '添加按钮' }).click()
  await expect(rows).toHaveCount(8)
  await expect(rows.last().getByLabel('按钮名称')).toHaveValue('新按钮')

  await rows.last().getByLabel('删除按钮').click()
  await expect(rows).toHaveCount(7)

  await page.getByRole('button', { name: '保 存' }).click()
  await expect(page.getByRole('status', { name: '智住小程序操作反馈' })).toContainText('装修配置已保存')
  await expect(page.getByText('左侧预览已同步最新按钮配置')).toBeVisible()
})

test('/smartHotel/smartSettings supports share publishing flow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartSettings'))

  await page.getByRole('tab', { name: '分享' }).click()
  await expect(page.getByRole('tab', { name: '分享' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('小程序卡片标题：')).toBeVisible()
  await expect(page.getByText('门店名称')).toBeVisible()
  await expect(page.getByText('预订人姓名')).toBeVisible()
  await expect(page.getByText('入住日期')).toBeVisible()
  await expect(page.getByText('离店日期')).toBeVisible()
  await expect(page.getByText('小程序卡片图片：')).toBeVisible()
  await expect(page.getByRole('radio', { name: '默认固定海报' })).toBeChecked()
  await expect(page.getByRole('radio', { name: '房源首图' })).toBeVisible()
  await expect(page.getByRole('radio', { name: '自定义' })).toBeVisible()

  await page.getByRole('button', { name: '预订人姓名' }).click()
  await page.getByRole('radio', { name: '自定义' }).click()
  await page.getByRole('button', { name: '上传图片' }).last().click()
  await page.getByRole('button', { name: '保存并发布' }).click()

  await expect(page.getByRole('status', { name: '智住小程序操作反馈' })).toContainText('分享配置已保存并发布')
  await expect(page.getByText('您好，欢迎 [入住日期] 入住')).toBeVisible()
})

test('/smartHotel/smartSettings exposes empty and error states without breaking shell', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/smartHotel/smartSettings?mockState=empty'))
  await expect(page.getByTestId('smart-hotel-settings-service-contract')).toHaveAttribute('data-state', 'empty')
  await expect(page.getByLabel('智住小程序空状态')).toContainText('当前还没有可展示的小程序按钮配置')
  await expect(page.getByRole('button', { name: '恢复默认按钮' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '分享' })).toBeVisible()

  await page.goto(appUrl('/smartHotel/smartSettings?mockState=error'))
  await expect(page.getByTestId('smart-hotel-settings-service-contract')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('alert', { name: '智住小程序加载失败' })).toContainText('智住小程序数据加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
