import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/memberCenter/level renders member levels from the page service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/level'))

  const pageRoot = page.locator('.scrm-member-level-page')
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '会员等级' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '会员等级列表', level: 1 })).toBeVisible()
  await expect(page.getByLabel('门店')).toHaveValue('all')
  await expect(page.getByLabel('等级状态')).toHaveValue('all')
  await expect(page.getByRole('region', { name: '会员等级核心指标' })).toContainText('会员等级数')
  await expect(page.getByRole('table', { name: '会员等级列表' })).toContainText('普通会员')
  await expect(page.getByRole('table', { name: '会员等级列表' })).toContainText('银卡会员')
  await expect(page.getByRole('status', { name: '会员等级操作反馈' })).toContainText('数据已更新')
  await expect(pageRoot).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)
})

test('/scrm/memberCenter/level supports filters refresh export and route handoff', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/level'))

  await page.getByLabel('关键词').fill('银卡')
  await page.getByLabel('等级状态').selectOption('enabled')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByRole('status', { name: '会员等级操作反馈' })).toContainText('已按筛选条件更新')
  await expect(page.getByRole('table', { name: '会员等级列表' })).toContainText('银卡会员')
  await expect(page.getByRole('table', { name: '会员等级列表' })).not.toContainText('普通会员')

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '会员等级操作反馈' })).toContainText('数据已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '会员等级操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '查看会员权益' }).click()
  await expect(page).toHaveURL(/\/scrm\/memberCenter\/equity$/)
  await page.goto(appUrl('/scrm/memberCenter/level'))
  await page.getByRole('button', { name: '查看会员积分' }).click()
  await expect(page).toHaveURL(/\/scrm\/memberCenter\/integrate$/)
})

test('/scrm/memberCenter/level supports create edit and upgrade settings feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/level'))

  await page.getByRole('button', { name: '新建会员等级' }).click()
  await expect(page.getByRole('dialog', { name: '新增会员等级' })).toContainText('等级名称')
  await page.getByLabel('等级名称').fill('金卡会员')
  await page.getByRole('button', { name: '提交会员等级' }).click()
  await expect(page.getByRole('status', { name: '会员等级操作反馈' })).toContainText('会员等级已保存')

  await page.getByRole('button', { name: '编辑 普通会员' }).click()
  await expect(page.getByRole('dialog', { name: '编辑会员等级' })).toContainText('普通会员')
  await page.getByRole('button', { name: '提交会员等级' }).click()
  await expect(page.getByRole('status', { name: '会员等级操作反馈' })).toContainText('会员等级已保存')

  await page.getByRole('button', { name: '会员升级设置' }).click()
  await expect(page.getByRole('dialog', { name: '会员升级设置' })).toContainText('计算累计时间段')
  await page.getByLabel('用户总计成功预订的天数').check()
  await page.getByRole('button', { name: '保存升级设置' }).click()
  await expect(page.getByRole('status', { name: '会员等级操作反馈' })).toContainText('升级设置已保存')
})

test('/scrm/memberCenter/level exposes empty and error envelopes as business feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/scrm/memberCenter/level?mockState=empty'))
  await expect(page.getByRole('status', { name: '会员等级操作反馈' })).toContainText('暂无符合条件的会员等级')
  await expect(page.getByRole('table', { name: '会员等级列表' })).toContainText('暂无会员等级')
  await expect(page.getByRole('button', { name: '导出' })).toBeDisabled()

  await page.goto(appUrl('/scrm/memberCenter/level?mockState=error'))
  await expect(page.getByRole('alert', { name: '会员等级数据错误' })).toContainText('会员等级加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await expect(page.locator('.scrm-member-level-page')).not.toContainText(
    /mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i,
  )
})
