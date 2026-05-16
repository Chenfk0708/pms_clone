import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/memberCenter/equity matches captured empty member-equity state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/equity'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '权益列表', level: 1 })).toBeVisible()
  await expect(page.getByText('可以在此处配置所需的会员权益')).toBeVisible()
  await expect(page.getByRole('button', { name: '添 加' })).toBeVisible()
  await expect(page.getByRole('button', { name: '排 序' })).toBeVisible()
  await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('暂无数据')

  await expect(page.getByRole('table', { name: '会员权益列表' }).locator('thead th')).toHaveText([
    '展示名称',
    '权益图标',
    '权益简介',
    '操作',
  ])

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/scrm--huiyuan-zhongxin--huiyuan-quanyi/default-clone-route.png',
    ),
    fullPage: true,
  })
})

test('/scrm/memberCenter/equity supports captured add and sort interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/equity'))

  await page.getByRole('button', { name: '添 加' }).click()
  await expect(page.getByRole('dialog', { name: '新增权益' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入权益名称')).toBeVisible()
  await expect(page.getByText('+ 添加图标')).toBeVisible()
  await expect(page.getByPlaceholder('请输入权益简介')).toBeVisible()
  await expect(page.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(page.getByRole('button', { name: '提 交' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '排 序' }).click()
  await expect(page.getByRole('button', { name: '保存排序' })).toBeVisible()
  await expect(page.getByText('拖动列表项排序')).toBeVisible()
  await page.getByRole('button', { name: '保存排序' }).click()
  await expect(page.getByRole('status')).toContainText('memberBenefitSeqs:不能为空')
})
