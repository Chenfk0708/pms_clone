import { expect, test } from '@playwright/test'

const baseUrl = process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:4173'
const appUrl = (path: string) => `${baseUrl}/#${path}`
const localStatusStorageKey = 'pms.distribution.localStatus'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem('pms_token', 'distribution-list-playwright-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem('pms.distributionListProvider', 'mock')
    window.localStorage.removeItem(storageKey)
  }, localStatusStorageKey)
})

test('/channels/distribution/distributionSecond renders the local suyin channel', async ({ page }) => {
  await page.goto(appUrl('/channels/distribution/distributionSecond'))

  const root = page.getByTestId('distribution-list-contract')
  await expect(root).toHaveAttribute('data-provider', 'mock')
  await expect(root).toHaveAttribute('data-endpoint-room-categories', /roomCategories\/page\/get/)
  await expect(root).toHaveAttribute('data-endpoint-undistributed', /select\/roomCategory\/page\/get/)
  await expect(root).toHaveAttribute('data-request', /"channelId":"100"/)
  await expect(root).toHaveAttribute('data-request', /"filterSyncChannelId":"100"/)

  await expect(root.getByRole('button', { name: '已分销', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByLabel('已分销房型表')).toContainText('标准大床房')
  await expect(page.getByLabel('已分销房型表')).toContainText('观影大床房')
  await expect(page.getByLabel('已分销房型表')).toContainText('宿银平台分销中')
  await expect(root).toContainText('宿银平台')
  await expect(root).not.toContainText('路客云聚合')
})

test('/channels/distribution/distributionSecond persists close and open distribution state locally', async ({ page }) => {
  await page.goto(appUrl('/channels/distribution/distributionSecond'))

  const root = page.getByTestId('distribution-list-contract')
  const distributedTable = page.getByLabel('已分销房型表')

  await root.getByPlaceholder('搜索房型或原因').fill('观影')
  await root.getByRole('button', { name: '查询', exact: true }).click()
  await expect(root).toHaveAttribute('data-request', /观影/)
  await expect(distributedTable).toContainText('观影大床房')
  await expect(distributedTable).not.toContainText('标准大床房')

  await distributedTable.getByRole('button', { name: '更多' }).click()
  await page.getByRole('menuitem', { name: '关闭分销' }).click()

  await expect(page.getByRole('status')).toContainText('观影大床房 已关闭宿银平台分销')
  await expect(distributedTable).not.toContainText('观影大床房')
  await expect
    .poll(() => page.evaluate((storageKey) => JSON.parse(window.localStorage.getItem(storageKey) || '{}'), localStatusStorageKey))
    .toMatchObject({ 'room-2': 'closed' })

  await root.getByRole('button', { name: '未分销', exact: true }).click()
  const undistributedTable = page.getByLabel('未分销房型表')
  await expect(undistributedTable).toContainText('观影大床房')
  await expect(undistributedTable).toContainText('已关闭')

  await undistributedTable.getByRole('button', { name: '更多' }).click()
  await page.getByRole('menuitem', { name: '开启分销' }).click()

  await expect(page.getByRole('status')).toContainText('观影大床房 已开启宿银平台分销')
  await expect(undistributedTable).not.toContainText('观影大床房')
  await expect
    .poll(() => page.evaluate((storageKey) => JSON.parse(window.localStorage.getItem(storageKey) || '{}'), localStatusStorageKey))
    .toMatchObject({ 'room-2': 'distributing' })

  await root.getByRole('button', { name: '已分销', exact: true }).click()
  await expect(distributedTable).toContainText('观影大床房')
})

test('/channels/distribution/distributionSecond exposes local channel config and future third-party import copy', async ({ page }) => {
  await page.goto(appUrl('/channels/distribution/distributionSecond'))

  const root = page.getByTestId('distribution-list-contract')
  await page.getByLabel('已分销房型表').getByRole('button', { name: '更多' }).first().click()
  await page.getByRole('menuitem', { name: '渠道编辑' }).click()

  await expect(page.getByRole('dialog', { name: '分销配置' })).toContainText('宿银平台分销已开启')
  await expect(page.getByRole('dialog', { name: '分销配置' })).toContainText('聚合分销渠道')
  await expect(page.getByRole('dialog', { name: '分销配置' })).toContainText('宿银平台')
  await expect(page.getByRole('dialog', { name: '分销配置' })).toContainText('深圳散客联盟')
  await page.getByRole('dialog', { name: '分销配置' }).getByRole('button', { name: '编辑' }).click()
  await page.getByRole('dialog', { name: '分销配置' }).getByRole('button', { name: /深圳散客联盟/ }).click()
  await page.getByRole('dialog', { name: '分销配置' }).getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('dialog', { name: '分销配置' })).toContainText(/当前分销情况: 2\//)
  await expect(page.getByLabel('已分销房型表').locator('tbody tr').first()).toContainText('已关联 2 个渠道')
  await expect(page.getByRole('dialog', { name: '分销配置' })).toContainText('第三方渠道完成授权适配后')
  await page.getByLabel('关闭分销配置').click()

  await root.getByRole('button', { name: '未分销', exact: true }).click()
  await root.getByRole('button', { name: '渠道导入完善' }).click()
  await page.getByRole('menuitem', { name: '完善房型信息' }).click()

  const dialog = page.getByRole('dialog', { name: '完善房型信息' })
  await expect(dialog).toContainText('宿银平台')
  await expect(dialog).toContainText('深圳散客联盟')
  await expect(dialog).toContainText('跨境长住合作')
  await expect(dialog).toContainText('当前系统还没有对接第三方平台')
  await dialog.getByRole('button', { name: '知道了' }).click()
  await expect(dialog).toHaveCount(0)
})

test('/channels/distribution/distributionSecond covers empty and error states', async ({ page }) => {
  await page.goto(appUrl('/channels/distribution/distributionSecond?state=empty'))
  await expect(page.getByText('当前条件暂无已分销房型')).toBeVisible()

  await page.goto(appUrl('/channels/distribution/distributionSecond?state=error'))
  await expect(page.getByRole('alert')).toContainText('分销列表加载失败')
  await expect(page.getByRole('alert')).toContainText('请稍后重试')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('status')).toContainText('分销列表已恢复')
  await expect(page.getByLabel('已分销房型表')).toContainText('标准大床房')
})
