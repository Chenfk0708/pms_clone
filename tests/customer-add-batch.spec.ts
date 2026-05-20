import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|待接入|阻塞|后端未就绪|后端接口未完成/

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/customer/addBatch loads through explicit batch add-friend provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/addBatch'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '批量加好友' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '企微SCRM-批量加好友', level: 1 })).toBeVisible()
  await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-request-channel', '')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await expect(page.getByLabel('批量加好友核心指标')).toContainText('预计可加好友')
  await expect(page.getByLabel('批量加好友核心指标')).toContainText('126')
  await expect(page.getByLabel('批量加好友核心指标')).toContainText('短信触达')
  await expect(page.getByLabel('批量加好友核心指标')).toContainText('84')
  await expect(page.getByLabel('候选客户列表')).toContainText('携程民宿-【M335275070】')
  await expect(page.getByLabel('批量任务列表')).toContainText('春节前未加企微客户补触达')

  await page.getByLabel('开始日期').fill('2026-05-01')
  await page.getByLabel('结束日期').fill('2026-05-18')
  await page.getByRole('button', { name: '渠道 全部渠道' }).click()
  await page.getByRole('option', { name: '美团民宿' }).click()
  await page.getByRole('button', { name: '查 询' }).click()

  await expect(page.getByRole('status', { name: '批量加好友操作反馈' })).toContainText('已按当前条件刷新批量加好友数据')
  await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-request-channel', '美团民宿')
  await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-request-date-start', '2026-05-01')
})

test('/customer/addBatch gives feedback for visible actions and route entries', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/addBatch'))

  await page.getByRole('button', { name: '刷 新' }).click()
  await expect(page.getByRole('status', { name: '批量加好友操作反馈' })).toContainText('已刷新批量加好友看板')

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('status', { name: '批量加好友操作反馈' })).toContainText('已生成批量加好友导出任务')

  await page.getByLabel('批量加好友核心指标').getByRole('button', { name: /^预计可加好友/ }).click()
  await expect(page.getByRole('dialog', { name: '指标详情' })).toContainText('客户手机号已脱敏')
  await page.getByRole('button', { name: '关闭指标详情' }).click()

  await page.getByLabel('候选客户列表').getByRole('button', { name: '下发短信' }).first().click()
  await expect(page.getByRole('status', { name: '批量加好友操作反馈' })).toContainText('加好友短信已下发')

  await page.getByLabel('候选客户列表').getByRole('button', { name: '标记已添加' }).first().click()
  await expect(page.getByLabel('候选客户列表')).toContainText('已添加')

  await page.getByLabel('候选客户列表').getByRole('button', { name: '详情' }).first().click()
  await expect(page.getByRole('dialog', { name: '客户加好友详情' })).toContainText('推荐话术')
  await page.getByRole('button', { name: '关闭客户加好友详情' }).click()

  await page.getByLabel('批量任务列表').getByRole('button', { name: '查看任务' }).first().click()
  await expect(page.getByRole('dialog', { name: '批量任务详情' })).toContainText('任务进度')
  await page.getByRole('button', { name: '关闭批量任务详情' }).click()

  await page.getByRole('button', { name: '客户列表' }).click()
  await expect(page).toHaveURL(/\/customer\/list$/)
})

test('/customer/addBatch resets filters and keeps quick-entry routes coordinated', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/addBatch'))

  await page.getByLabel('开始日期').fill('2026-05-01')
  await page.getByLabel('结束日期').fill('2026-05-18')
  await page.getByRole('button', { name: '渠道 全部渠道' }).click()
  await page.getByRole('option', { name: '美团民宿' }).click()
  await page.getByRole('button', { name: '重 置' }).click()

  await expect(page.getByRole('status', { name: '批量加好友操作反馈' })).toContainText('筛选条件已重置')
  await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-request-channel', '')
  await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-request-date-start', '')
  await expect(page.locator('.customer-add-batch-page')).toHaveAttribute('data-request-date-end', '')

  await page.getByRole('button', { name: '企微员工列表' }).click()
  await expect(page).toHaveURL(/\/customer\/staffList$/)

  await page.goto(appUrl('/customer/addBatch'))
  await page.getByRole('button', { name: '客户标签' }).click()
  await expect(page).toHaveURL(/\/customer\/tag$/)
})

test('/customer/addBatch renders empty and failure response states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/customer/addBatch?customerAddBatchMockState=empty'))
  await expect(page.getByLabel('候选客户列表').getByText('暂无可触达客户')).toBeVisible()
  await expect(page.getByLabel('候选客户列表').getByText('当前筛选条件下没有待加好友客户，请调整条件后重新查询。')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await page.goto(appUrl('/customer/addBatch?customerAddBatchMockState=error'))
  await expect(page.getByRole('alert', { name: '批量加好友数据错误' })).toContainText('批量加好友数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})

test('/customer/addBatch preserves captured SCRM subscription route', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/customer/addBatch'))

  await page.getByRole('button', { name: '立即开通' }).click()

  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '企微SCRM', level: 2 })).toBeVisible()
  await expect(page.getByText('商品详情')).toBeVisible()
  await expect(page.getByText('购买信息')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeVisible()
})
