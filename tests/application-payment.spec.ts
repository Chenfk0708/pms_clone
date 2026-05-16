import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/version/applicationPayment matches captured application subscription catalog', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/applicationPayment'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: '应用订阅侧栏' })).toContainText([
    '我的权益',
    '置换权益',
    '版本订阅',
    '应用订阅',
    '路客商城',
  ].join(''))
  await expect(page.getByRole('navigation', { name: '应用订阅侧栏' }).getByRole('link', { name: '应用订阅' })).toHaveClass(/is-active/)
  await expect(page.getByText('版本号：v4.10.7')).toBeVisible()

  const filters = page.getByRole('tablist', { name: '应用订阅分类' })
  await expect(filters.getByRole('tab', { name: '全部' })).toHaveAttribute('aria-selected', 'true')
  await expect(filters.getByRole('tab', { name: '渠道直连' })).toBeVisible()
  await expect(filters.getByRole('tab', { name: '功能订阅' })).toBeVisible()

  await expect(page.getByRole('region', { name: '渠道直连' })).toContainText('携程直连')
  await expect(page.getByRole('region', { name: '渠道直连' })).toContainText('¥899/年')
  await expect(page.getByRole('region', { name: '渠道直连' })).toContainText('抖音直连')
  await expect(page.getByRole('region', { name: '渠道直连' })).toContainText('限时体验中')
  await expect(page.getByRole('region', { name: '渠道直连' })).toContainText('美团民宿直连')
  await expect(page.getByRole('region', { name: '功能订阅' })).toContainText('智能调价')
  await expect(page.getByRole('region', { name: '功能订阅' })).toContainText('企微SCRM')
  await expect(page.getByRole('region', { name: '功能订阅' })).toContainText('智能保洁')
  await expect(page.getByRole('region', { name: '功能订阅' })).toContainText('电子房价牌')
})

test('/version/applicationPayment filters and opens captured subscription detail', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/applicationPayment'))

  await page.getByRole('tab', { name: '功能订阅' }).click()
  await expect(page.getByRole('tab', { name: '功能订阅' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('region', { name: '渠道直连' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '功能订阅' })).toContainText('全域雷达')
  await expect(page.getByRole('region', { name: '功能订阅' })).toContainText('旅业系统直连')

  await page.getByRole('tab', { name: '全部' }).click()
  await page.getByRole('button', { name: '抖音直连 订阅开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail\?app=douyin$/)
  await expect(page.getByLabel('订阅中心侧栏')).toContainText('应用订阅')
  await expect(page.getByRole('heading', { name: '抖音直连' })).toBeVisible()
  await expect(page.getByLabel('购买信息')).toContainText('¥37,047.6')
  await expect(page.getByRole('button', { name: '立即购买' })).toBeVisible()
})
