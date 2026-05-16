import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const taskArtifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/fangtai--baojie-guanli--baojie-renyuan',
)

test('/cleanManage/cleanStaff renders the unsubscribed cleaner staff state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/cleanManage/cleanStaff')

  await expect(page.getByRole('heading', { name: '保洁人员', level: 1 })).toBeVisible()
  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByPlaceholder('姓名/手机号')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加成员' })).toBeVisible()
  await expect(page.locator('.clean-unpaid-bg')).toBeVisible()
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toBeVisible()
  await expect(page.getByRole('button', { name: '订阅开通' })).toBeVisible()
  await expect(page.getByRole('table', { name: '保洁人员列表' })).toHaveCount(0)

  await page.screenshot({
    path: path.join(taskArtifactRoot, 'default-clone-route.png'),
    fullPage: true,
  })
})

test('/cleanManage/cleanStaff keeps locked interactions aligned with the target page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/cleanManage/cleanStaff')

  await page.getByRole('button', { name: '添加成员' }).click()
  await expect(page.getByRole('dialog', { name: '邀请成员加入店铺' })).toHaveCount(0)
  await expect(page.locator('.clean-unpaid-bg')).toBeVisible()

  await page.getByRole('button', { name: /天落会宿公寓/ }).click()
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.clean-unpaid-bg')).toBeVisible()

  await page.getByRole('button', { name: '订阅开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
})
