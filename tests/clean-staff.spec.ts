import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const taskArtifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/fangtai--baojie-guanli--baojie-renyuan',
)
const appUrl = (pathName: string) => `${process.env.PMS_TEST_BASE_URL ?? ''}${pathName}`

test('/cleanManage/cleanStaff loads business data from the clean-staff service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStaff'))

  await expect(page.getByRole('heading', { name: '保洁人员', level: 1 })).toBeVisible()
  await expect(page.getByText('在岗保洁员')).toBeVisible()
  await expect(page.getByText('4 人')).toBeVisible()
  await expect(page.getByRole('table', { name: '保洁人员列表' })).toBeVisible()
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(6)
  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('path=/cleaner/page/get')
  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('pageNum=1')
  await expect(page.getByText('未开通')).toHaveCount(0)

  await page.screenshot({
    path: path.join(taskArtifactRoot, 'default-business-clone.png'),
    fullPage: true,
  })
})

test('/cleanManage/cleanStaff filters, refreshes and resets through service parameters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStaff'))

  await page.getByPlaceholder('姓名/手机号').fill('李')
  await page.getByLabel('保洁状态').selectOption('onDuty')
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('keyword=李')
  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('status=onDuty')
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(2)

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '保洁人员操作反馈' })).toContainText('已刷新')

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.locator('[data-testid="clean-staff-request"]')).toContainText('keyword=')
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(6)
})

test('/cleanManage/cleanStaff provides feedback for visible actions and detail entry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStaff'))

  await page.getByRole('button', { name: '新增保洁员' }).click()
  await expect(page.getByRole('dialog', { name: '新增保洁员' })).toBeVisible()
  await page.getByRole('button', { name: '保存成员' }).click()
  await expect(page.getByRole('status', { name: '保洁人员操作反馈' })).toContainText('已保存')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '保洁人员操作反馈' })).toContainText('导出任务已创建')

  await page.locator('[data-testid="clean-staff-row"]').first().getByRole('button', { name: '查看详情' }).click()
  const detailDialog = page.getByRole('dialog', { name: /保洁员详情/ })
  await expect(detailDialog).toBeVisible()
  await expect(detailDialog.getByText('今日任务')).toBeVisible()
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: /保洁员详情/ })).toHaveCount(0)
})

test('/cleanManage/cleanStaff coordinates quick entries with existing routes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStaff'))

  await page.getByRole('button', { name: '查看保洁任务' }).click()
  await expect(page).toHaveURL(/\/cleanManage\/cleanTask$/)
})

test('/cleanManage/cleanStaff exposes empty and error states from the provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/cleanManage/cleanStaff?scenario=empty'))
  await expect(page.getByText('暂无符合条件的保洁人员')).toBeVisible()
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(0)

  await page.goto(appUrl('/cleanManage/cleanStaff?scenario=error'))
  await expect(page.getByRole('alert')).toContainText('保洁人员数据加载失败')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('[data-testid="clean-staff-row"]')).toHaveCount(6)
})
