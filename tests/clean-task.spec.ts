import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/fangtai--baojie-guanli--baojie-renwu',
)

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/cleanManage/cleanTask renders business data from the clean-task provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  await expect(page.getByRole('heading', { name: '保洁任务', level: 1 })).toBeVisible()
  await expect(page.locator('.sidebar-link[href="/cleanManage/cleanTask"]')).toHaveClass(/active/)
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('/cleanTask/page/get')
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('pageSize=20')
  await expect(page.getByLabel('保洁任务概览')).toContainText('今日任务')
  await expect(page.getByLabel('保洁任务列表')).toContainText('CT20260518001')
  await expect(page.getByLabel('保洁任务列表')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByRole('button', { name: '批量通知' })).toBeDisabled()
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toHaveCount(0)

  await page.screenshot({
    path: path.join(artifactRoot, 'business-data-clone-20260518.png'),
    fullPage: true,
  })
})

test('/cleanManage/cleanTask passes filters into the data service and refreshes UI', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  await page.getByRole('button', { name: '请选择保洁类型' }).click()
  await expect(page.getByRole('listbox', { name: '保洁类型筛选' })).toContainText('退房保洁')
  await page.getByRole('option', { name: '退房保洁' }).click()
  await page.getByRole('button', { name: '请选择保洁状态' }).click()
  await page.getByRole('option', { name: '待保洁' }).click()
  await page.getByRole('button', { name: '查 询' }).click()

  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('cleanType=CHECKOUT')
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('status=PENDING_CLEAN')
  await expect(page.getByLabel('保洁任务列表')).toContainText('CT20260518001')
  await expect(page.getByLabel('保洁任务列表')).not.toContainText('CT20260518003')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '请选择保洁类型' })).toBeVisible()
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toContainText('status=ALL')
})

test('/cleanManage/cleanTask gives feedback for every visible action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('数据已刷新')

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('已创建导出任务')

  await page.getByRole('button', { name: '查看详情 CT20260518001' }).click()
  await expect(page.getByRole('dialog', { name: '保洁任务详情' })).toContainText('CT20260518001')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByLabel('选择 CT20260518001').check()
  await expect(page.getByRole('button', { name: '批量通知' })).toBeEnabled()
  await page.getByRole('button', { name: '批量通知' }).click()
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('已通知 1 个任务')

  await page.getByRole('button', { name: '创建保洁任务' }).click()
  await expect(page.getByRole('dialog', { name: '创建保洁任务' })).toBeVisible()
  await page.getByLabel('任务备注').fill('需要补充浴巾和矿泉水')
  await page.getByRole('button', { name: '确认创建' }).click()
  await expect(page.getByRole('status', { name: '保洁任务操作反馈' })).toContainText('保洁任务已创建')

  await page.getByRole('button', { name: '更多' }).click()
  await expect(page.getByRole('menu', { name: '更多操作' })).toContainText('查看保洁统计')
  await page.getByRole('menuitem', { name: '查看保洁统计' }).click()
  await expect(page).toHaveURL(/\/cleanManage\/cleanStatistics$/)
})

test('/cleanManage/cleanTask exposes empty and error states with retry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask?scenario=empty'))
  await expect(page.getByLabel('保洁任务列表')).toContainText('当前筛选暂无保洁任务')

  await page.goto(appUrl('/cleanManage/cleanTask?scenario=error'))
  await expect(page.getByRole('alert', { name: '保洁任务数据错误' })).toContainText('保洁任务服务繁忙')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert', { name: '保洁任务数据错误' })).toHaveCount(0)
  await expect(page.getByLabel('保洁任务列表')).toContainText('CT20260518001')
})
