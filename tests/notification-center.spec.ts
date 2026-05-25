import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  if (appBaseURL) {
    return `${appBaseURL.replace(/\/$/, '')}/#${routePath}`
  }

  return `/#${routePath}`
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
})

test('/setting/notification renders the standalone notification center page', async ({ page }) => {
  await page.goto(appUrl('/setting/notification'))

  await expect(page.locator('.notification-center-page')).toBeVisible()
  await expect(page.locator('.notification-center-page__layout')).toBeVisible()
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.sidebar')).toHaveCount(0)

  await expect(page.getByRole('tab', { name: '全部' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '未读 2' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '已读' })).toBeVisible()
  await expect(page.getByRole('button', { name: '一键已读' })).toBeVisible()
  await expect(page.getByRole('button', { name: '通知设置' })).toBeVisible()

  await expect(page.getByRole('button', { name: '订单通知 2' })).toBeVisible()
  await expect(page.getByRole('button', { name: '门店预警' })).toBeVisible()
  await expect(page.getByRole('button', { name: '门店动态' })).toBeVisible()

  await expect(page.getByRole('columnheader', { name: '标题' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '内容' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: '时间' })).toBeVisible()

  await expect(page.getByText('新订单提醒').first()).toBeVisible()
  await expect(page.getByText('订单费用变更提醒').first()).toBeVisible()
  await expect(page.getByText('点击处理>>').first()).toBeVisible()
  await expect(page.getByText('第 1-20 条/总共 2154 条')).toBeVisible()
  await expect(page.getByRole('button', { name: '20 条/页' })).toBeVisible()

  const layoutBox = await page.locator('.notification-center-page__layout').boundingBox()
  expect(layoutBox?.x).toBe(0)
  expect(layoutBox?.width).toBeCloseTo(1440, 0)
})

test('/setting/notification supports category and tab switching', async ({ page }) => {
  await page.goto(appUrl('/setting/notification'))

  await page.getByRole('button', { name: '门店预警' }).click()
  await expect(page.getByRole('button', { name: '门店预警' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('tab', { name: '未读' })).toBeVisible()
  await expect(page.getByText('未排房提醒').first()).toBeVisible()
  await expect(page.getByText('房态同步渠道失败提醒').first()).toBeVisible()
  await expect(page.getByText('第 1-20 条/总共 57 条')).toBeVisible()

  await page.getByRole('tab', { name: '已读' }).click()
  await expect(page.getByRole('tab', { name: '已读' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('未排房订单提醒').first()).toBeVisible()
  await expect(page.getByText('该分类消息均已读').first()).toHaveCount(0)

  await page.getByRole('button', { name: '门店动态' }).click()
  await expect(page.getByRole('button', { name: '门店动态' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('聚合分销提醒').first()).toBeVisible()
  await expect(page.getByText('路客云监测到更低价').first()).toBeVisible()
  await expect(page.getByText('第 1-10 条/总共 10 条')).toBeVisible()
})
