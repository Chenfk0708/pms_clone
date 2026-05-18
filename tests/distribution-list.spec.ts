import { expect, test } from '@playwright/test'

const baseUrl = process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:4173'
const appUrl = (path: string) => `${baseUrl}${path}`

test('/channels/distribution/distributionSecond renders provider driven business data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/distribution/distributionSecond'))

  const root = page.getByTestId('distribution-list-contract')
  await expect(root).toHaveAttribute('data-provider', 'mock')
  await expect(root).toHaveAttribute('data-endpoint-camp-flow', /campFlow\/get/)
  await expect(root).toHaveAttribute('data-endpoint-room-categories', /roomCategories\/page\/get/)
  await expect(root).toHaveAttribute('data-endpoint-undistributed', /select\/roomCategory\/page\/get/)

  await expect(page.getByLabel('聚合分销侧边导航')).toContainText('分销列表')
  await expect(root.getByRole('button', { name: '已分销', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByLabel('分销概览')).toContainText('预计渠道订单')
  await expect(page.getByLabel('分销概览')).toContainText('60')
  await expect(page.getByLabel('已分销房型表')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByLabel('分销渠道概览')).toContainText('路客云聚合')
})

test('/channels/distribution/distributionSecond supports visible controls and feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/distribution/distributionSecond'))

  const root = page.getByTestId('distribution-list-contract')
  await expect(root.getByLabel('分销概览')).toContainText('预计渠道订单')

  await root.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('分销列表已刷新')

  await root.getByPlaceholder('搜索房型或原因').fill('观影')
  await root.getByRole('button', { name: '查询', exact: true }).click()
  await expect(root).toHaveAttribute('data-request', /观影/)
  await expect(page.getByLabel('已分销房型表')).toContainText('观影大床房')

  await page.getByRole('button', { name: '详情' }).first().click()
  await expect(page.getByRole('dialog', { name: '分销详情' })).toContainText('渠道同步')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await root.getByRole('button', { name: '未分销', exact: true }).click()
  await root.getByRole('button', { name: '一键上架' }).click()
  await expect(page.getByRole('status')).toContainText('已创建上架任务')
  await root.getByRole('button', { name: '渠道导入完善' }).click()
  await page.getByRole('menuitem', { name: 'OTA 导入完善' }).click()
  await expect(page.getByRole('status')).toContainText('OTA 导入任务已创建')
  await root.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')
})

test('/channels/distribution/distributionSecond covers empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/distribution/distributionSecond?state=empty'))
  await expect(page.getByText('当前条件暂无分销房型')).toBeVisible()

  await page.goto(appUrl('/channels/distribution/distributionSecond?state=error'))
  await expect(page.getByRole('alert')).toContainText('分销列表加载失败')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('status')).toContainText('分销列表已恢复')
})
