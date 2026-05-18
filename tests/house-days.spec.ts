import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/houseManage/days loads through the explicit mock provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.getByRole('status', { name: '日房态数据服务状态' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '天落大床电竞套间' })).toBeVisible()
  await expect(page.getByText('张祯')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('数据已更新')
  await expect(page.locator('body')).not.toContainText(/mock|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/)

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('日房态已刷新')
})

test('/houseManage/days exposes mock provider failures and retry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days?houseDaysMockState=error'))

  await expect(page.getByRole('alert', { name: '日房态数据错误' })).toContainText('日房态数据加载失败')
  await expect(page.locator('body')).not.toContainText(/mock provider|未接入|阻塞|后端未就绪|后端接口未完成/)
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert', { name: '日房态数据错误' })).toContainText('日房态数据加载失败')
})

test('/houseManage/days renders the mock empty response without static fallback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days?houseDaysMockState=empty'))

  await expect(page.getByRole('status', { name: '日房态数据服务状态' })).toHaveCount(0)
  await expect(page.getByText('暂无日房态数据')).toBeVisible()
  await expect(page.getByText('当前条件下没有可展示房间，请调整筛选条件后重试。')).toBeVisible()
  await expect(page.getByText('张祯')).toHaveCount(0)
  await expect(page.locator('body')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成/)
})

test('/houseManage/days uses business dialogs instead of development blockers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await page.getByRole('article', { name: /观影大床房 房间1/ }).click()
  await expect(page.getByRole('dialog', { name: '房间详情' })).toContainText('胡志深')
  await expect(page.getByRole('dialog', { name: '房间详情' })).toContainText('办理入住')
  await page.getByRole('button', { name: '关闭房间详情' }).click()

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '房态设置' }).click()
  await expect(page.getByRole('dialog', { name: '房态设置' })).toContainText('自动刷新')
  await page.getByRole('button', { name: '保存设置' }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('房态设置已保存')

  await page.getByRole('button', { name: '读卡' }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('请连接读卡器后重试')
  await expect(page.locator('body')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成/)
})
