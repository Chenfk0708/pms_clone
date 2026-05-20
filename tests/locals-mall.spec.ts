import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/version/localsMall uses provider-backed overview contract and coordinated shortcuts', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/localsMall'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '路客商城' })).toHaveClass(/is-active/)
  await expect(page.getByText('版本号：v4.10.7')).toBeVisible()

  const shell = page.locator('.locals-mall-page')
  await expect(shell).toHaveAttribute('data-provider', 'mock')
  await expect(shell).toHaveAttribute('data-page', 'mall')
  await expect(shell).toHaveAttribute('data-state', 'ready')

  const contract = page.getByTestId('locals-mall-service-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-state', 'success')
  await expect(contract).toContainText('weiRoomCategories/page/get')
  await expect(contract).toContainText('youzan/commodity/get')
  await expect(contract).toContainText('paymentTypes/get/v2')
  await expect(contract).toContainText('paymentWays/get')

  await expect(page.getByRole('heading', { name: '系统功能' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '智能硬件' })).toBeVisible()
  await expect(page.getByRole('button', { name: '立即购买' })).toHaveCount(7)
  await expect(page.getByText('门卡管理系统')).toBeVisible()
  await expect(page.getByText('蜂助手CPE路由器P5(5G门店版)')).toBeVisible()
  await expect(page.getByText('指定款【智能密码锁/门锁】')).toBeVisible()

  const shortcutRegion = page.getByRole('region', { name: '快捷入口' })
  await expect(shortcutRegion).toBeVisible()
  await expect(shortcutRegion.getByRole('button', { name: '智能门锁' })).toBeVisible()
  await expect(shortcutRegion.getByRole('button', { name: '自助入住' })).toBeVisible()
  await expect(shortcutRegion.getByRole('button', { name: '全局设置' })).toBeVisible()

  await shortcutRegion.getByRole('button', { name: '智能门锁' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/smartLook$/)
})

test('/version/localsMall detail view exposes room, payment, and purchase feedback flow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/localsMall'))

  await page.getByRole('button', { name: '立即购买' }).first().click()

  await expect(page).toHaveURL(/\/version\/localsMall\/detail/)

  const shell = page.locator('.locals-mall-page')
  await expect(shell).toHaveAttribute('data-page', 'detail')
  await expect(shell).toHaveAttribute('data-state', 'ready')

  await expect(page.getByText('路客商城/')).toBeVisible()
  await expect(page.getByText('详情', { exact: true })).toBeVisible()
  await expect(page.getByText('购买时长')).toBeVisible()
  await expect(page.getByText('一年')).toBeVisible()
  await expect(page.getByText('购买方')).toBeVisible()
  await expect(page.getByText('路客云6TS5')).toBeVisible()
  await expect(page.getByText('总费用')).toBeVisible()
  await expect(page.getByText('¥ 800')).toBeVisible()

  await page.getByRole('button', { name: '查看适用房型' }).click()
  const roomsDialog = page.getByRole('dialog', { name: '适用房型' })
  await expect(roomsDialog).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await page.getByRole('button', { name: '关闭适用房型' }).click()
  await expect(roomsDialog).toHaveCount(0)

  await page.getByRole('button', { name: '查看支付方式' }).click()
  const paymentDialog = page.getByRole('dialog', { name: '支付方式' })
  await expect(paymentDialog).toContainText('住宿')
  await expect(paymentDialog).toContainText('加床')
  await page.getByRole('button', { name: '关闭支付方式' }).click()
  await expect(paymentDialog).toHaveCount(0)

  await page.getByRole('button', { name: '提交购买申请' }).click()
  await expect(page.getByRole('status', { name: '路客商城操作反馈' })).toContainText('请先勾选购买协议')

  await page.getByRole('checkbox', { name: '购买协议' }).check()
  await page.getByRole('button', { name: '提交购买申请' }).click()
  const submitDialog = page.getByRole('dialog', { name: '购买申请已提交' })
  await expect(submitDialog).toContainText('门卡管理系统')
  await page.getByRole('button', { name: '前往智能门锁' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/smartLook$/)
})

test('/version/localsMall keeps mall shell in empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/localsMall?mockState=empty'))

  const shell = page.locator('.locals-mall-page')
  await expect(shell).toHaveAttribute('data-provider', 'mock')
  await expect(shell).toHaveAttribute('data-state', 'empty')

  await expect(page.getByRole('region', { name: '路客商城空状态' })).toContainText('当前门店暂无可采购的商品')
  await expect(page.getByRole('button', { name: '前往全局设置' })).toBeVisible()
  await expect(page.getByRole('region', { name: '快捷入口' })).toBeVisible()
})

test('/version/localsMall exposes retryable error state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/localsMall?mockState=error'))

  await expect(page.getByRole('alert', { name: '路客商城加载失败' })).toContainText('路客商城数据加载失败，请稍后重试')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page).toHaveURL(/\/version\/localsMall$/)
  await expect(page.locator('.locals-mall-page')).toHaveAttribute('data-state', 'ready')
})
