import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartHardware/mall uses mock provider and renders business-ready mall view', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/mall'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '智能硬件商城' })).toHaveClass(/is-active/)

  const shell = page.locator('.smart-hardware-mall-page')
  await expect(shell).toHaveAttribute('data-provider', 'mock')
  await expect(shell).toHaveAttribute('data-page', 'mall')

  await expect(page.getByRole('heading', { name: '智慧酒店一站式部署', level: 1 })).toBeVisible()
  await expect(page.getByText('助力酒店高效运营')).toBeVisible()
  await expect(page.getByText('最近同步', { exact: true })).toBeVisible()

  const productSection = page.getByLabel('智能硬件商城商品列表')
  await expect(productSection.getByText('门卡管理系统')).toBeVisible()
  await expect(productSection.getByText('蜂助手CPE路由器P5(5G门店版)')).toBeVisible()
  await expect(productSection.getByText('指定款【智能密码锁/门锁】')).toBeVisible()
  await expect(productSection.getByRole('button', { name: '立即购买' })).toBeVisible()
  await expect(productSection.getByRole('button', { name: '联系客服' })).toHaveCount(6)

  await expect(page.getByRole('heading', { name: '快捷入口' })).toBeVisible()
  await expect(page.getByRole('button', { name: '智能门锁' })).toBeVisible()
  await expect(page.getByRole('button', { name: '自助入住' })).toBeVisible()
  await expect(page.getByRole('button', { name: '全局设置' })).toBeVisible()
  await expect(page.getByRole('status', { name: '智能硬件商城操作反馈' })).toContainText('智能硬件商城数据已就绪')
})

test('/smartHotel/smartHardware/mall supports service consultation, detail drawers, and purchase submit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/mall'))

  await page.getByRole('button', { name: '联系客服' }).first().click()
  const serviceDialog = page.getByRole('dialog', { name: '联系客服' })
  await expect(serviceDialog).toBeVisible()
  await expect(serviceDialog).toContainText('蜂助手CPE路由器P5(5G门店版)')
  await page.getByRole('button', { name: '创建咨询任务' }).click()
  await expect(serviceDialog).toHaveCount(0)
  await expect(page.getByRole('status', { name: '智能硬件商城操作反馈' })).toContainText('咨询任务已创建')

  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/mall\/detail/)

  const detailShell = page.locator('.smart-hardware-mall-page')
  await expect(detailShell).toHaveAttribute('data-page', 'detail')
  await expect(page.getByRole('heading', { name: '门卡管理系统', level: 1 })).toBeVisible()
  await expect(page.getByText('购买时长')).toBeVisible()
  await expect(page.getByText('一年')).toBeVisible()
  await expect(page.getByText('购买方')).toBeVisible()
  await expect(page.getByText('路客云6TS5')).toBeVisible()
  await expect(page.getByText('总费用')).toBeVisible()
  await expect(page.getByText('¥800')).toBeVisible()

  await page.getByRole('button', { name: '查看适用房型' }).click()
  const roomDrawer = page.getByRole('dialog', { name: '适用房型' })
  await expect(roomDrawer).toBeVisible()
  await expect(roomDrawer).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await page.getByRole('button', { name: '关闭适用房型' }).click()
  await expect(roomDrawer).toHaveCount(0)

  await page.getByRole('button', { name: '查看支付方式' }).click()
  const paymentDrawer = page.getByRole('dialog', { name: '支付方式' })
  await expect(paymentDrawer).toBeVisible()
  await expect(paymentDrawer).toContainText('住宿')
  await expect(paymentDrawer).toContainText('加床')
  await page.getByRole('button', { name: '关闭支付方式' }).click()
  await expect(paymentDrawer).toHaveCount(0)

  await page.getByRole('button', { name: '提交购买申请' }).click()
  await expect(page.getByRole('status', { name: '智能硬件商城操作反馈' })).toContainText('请先勾选购买协议')

  await page.getByRole('checkbox', { name: '购买协议' }).check()
  await page.getByRole('button', { name: '提交购买申请' }).click()
  const submitDialog = page.getByRole('dialog', { name: '购买申请已提交' })
  await expect(submitDialog).toBeVisible()
  await expect(submitDialog).toContainText('门卡管理系统')
  await page.getByRole('button', { name: '前往智能门锁' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/smartLook$/)
})

test('/smartHotel/smartHardware/mall keeps business shell in empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/mall?mockState=empty'))

  const shell = page.locator('.smart-hardware-mall-page')
  await expect(shell).toHaveAttribute('data-provider', 'mock')
  await expect(shell).toHaveAttribute('data-state', 'empty')
  await expect(page.getByLabel('智能硬件商城空状态')).toContainText('当前门店暂无可采购的智能硬件商品')
  await expect(page.getByRole('button', { name: '前往全局设置' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '快捷入口' })).toBeVisible()
})

test('/smartHotel/smartHardware/mall exposes retryable error state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/mall?mockState=error'))

  await expect(page.getByRole('alert', { name: '智能硬件商城加载失败' })).toContainText('智能硬件商城数据加载失败，请稍后重试')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/mall$/)
  await expect(page.getByRole('heading', { name: '智慧酒店一站式部署', level: 1 })).toBeVisible()
})
