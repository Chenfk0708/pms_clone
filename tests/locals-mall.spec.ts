import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/version/localsMall matches captured locals mall product grid', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/localsMall'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '权益与订阅侧栏' })).toContainText([
    '我的权益',
    '置换权益',
    '版本订阅',
    '应用订阅',
    '路客商城',
  ].join(''))
  await expect(page.getByRole('link', { name: '路客商城' })).toHaveClass(/is-active/)
  await expect(page.getByText('版本号：v4.10.7')).toBeVisible()

  await expect(page.getByRole('region', { name: '系统功能' })).toContainText('门卡管理系统')
  await expect(page.getByRole('region', { name: '系统功能' })).toContainText('￥800')
  await expect(page.getByRole('region', { name: '智能硬件' })).toContainText('蜂助手CPE路由器P5(5G门店版)')
  await expect(page.getByRole('region', { name: '智能硬件' })).toContainText('蜂助手CPE路由器S1(4G版)')
  await expect(page.getByRole('region', { name: '智能硬件' })).toContainText('蜂助手4G盒子S2(极光TV版)')
  await expect(page.getByRole('region', { name: '智能硬件' })).toContainText('蜂助手随身UiFi U1')
  await expect(page.getByRole('region', { name: '智能硬件' })).toContainText('指定款【智能密码锁/门锁】')
  await expect(page.getByRole('region', { name: '智能硬件' })).toContainText('无人入住智能门锁智能入住 D12')
  await expect(page.getByRole('button', { name: '立即购买' })).toHaveCount(7)
})

test('/version/localsMall opens captured first product purchase detail', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/localsMall'))

  await page.getByRole('region', { name: '系统功能' }).getByRole('button', { name: '立即购买' }).click()

  await expect(page).toHaveURL(/\/version\/localsMall\/detail/)
  await expect(page.getByText('路客商城/')).toBeVisible()
  await expect(page.getByText('详情', { exact: true })).toBeVisible()
  await expect(page.getByText('购买时长')).toBeVisible()
  await expect(page.getByRole('button', { name: '一年' })).toBeVisible()
  await expect(page.getByText('购买方')).toBeVisible()
  await expect(page.getByText('路客云6TS5')).toBeVisible()
  await expect(page.getByText('总费用')).toBeVisible()
  await expect(page.getByText('¥ 800')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: '我已经阅读同意《路客云产品服务购买协议》' })).toBeChecked()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeVisible()
})
