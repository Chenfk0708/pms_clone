import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartHardware/mall matches captured hardware mall list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/mall'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '智能硬件商城' })).toHaveClass(/is-active/)

  await expect(page.getByRole('heading', { name: '智慧酒店一站式部署', level: 1 })).toBeVisible()
  await expect(page.getByText('助力酒店高效运营')).toBeVisible()

  const productList = page.getByLabel('智能硬件商品列表')
  await expect(productList.getByText('门卡管理系统')).toBeVisible()
  await expect(productList.getByText('蜂助手CPE路由器P5(5G门店版)')).toBeVisible()
  await expect(productList.getByText('蜂助手CPE路由器S1(4G版)')).toBeVisible()
  await expect(productList.getByText('蜂助手4G盒子S2(极光TV版)')).toBeVisible()
  await expect(productList.getByText('蜂助手随身UiFi U1')).toBeVisible()
  await expect(productList.getByText('指定款【智能密码锁/门锁】')).toBeVisible()
  await expect(productList.getByText('无人入住智能门锁智能入住 D12')).toBeVisible()
  await expect(productList.getByText('￥800')).toBeVisible()
  await expect(productList.getByText('￥1643')).toBeVisible()
  await expect(productList.getByText('￥299')).toBeVisible()
  await expect(productList.getByRole('button', { name: '立即购买' })).toBeVisible()
  await expect(productList.getByRole('button', { name: '联系客服' })).toHaveCount(6)
})

test('/smartHotel/smartHardware/mall supports contact and purchase detail interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/mall'))

  await page.getByRole('button', { name: '联系客服' }).first().click()
  await expect(page.getByRole('status')).toContainText('已唤起客服')

  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/mall\/detail$/)
  await expect(page.getByText('路客商城/ 详情')).toBeVisible()
  await expect(page.getByText('购买时长')).toBeVisible()
  await expect(page.getByText('一年')).toBeVisible()
  await expect(page.getByText('购买方')).toBeVisible()
  await expect(page.getByText('路客云6TS5')).toBeVisible()
  await expect(page.getByText('总费用')).toBeVisible()
  await expect(page.getByText('¥ 800')).toBeVisible()
  await expect(page.getByText('我已经阅读同意《路客云产品服务购买协议》')).toBeVisible()

  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page.getByRole('status')).toContainText('请先勾选购买协议')
  await page.getByRole('checkbox', { name: '购买协议' }).check()
  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page.getByRole('status')).toContainText('已提交门卡管理系统购买申请')
})
