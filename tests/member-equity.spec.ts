import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function collapseChatDock(page: Page) {
  const collapseButton = page.getByRole('button', { name: '收起会话' })
  if ((await collapseButton.count()) > 0) {
    await collapseButton.click()
    await expect(page.getByRole('button', { name: '打开全部会话' })).toBeVisible()
  }
}

test('/scrm/memberCenter/equity renders service-backed member benefit data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/equity'))

  const pageRoot = page.locator('.member-equity-page')
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(pageRoot).toBeVisible()
  await expect(pageRoot).toHaveAttribute('data-provider', 'mock')
  await expect(pageRoot).toHaveAttribute('data-request-page', '1')
  await expect(pageRoot).toHaveAttribute('data-request-page-size', '999')
  await expect(page.getByRole('heading', { name: '权益列表', level: 1 })).toBeVisible()
  await expect(page.getByText('可以在此处配置所需的会员权益')).toBeVisible()
  await expect(page.getByRole('button', { name: '添 加' })).toBeVisible()
  await expect(page.getByRole('button', { name: '排 序' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('会员权益已更新')

  await expect(page.getByRole('table', { name: '会员权益列表' }).locator('thead th')).toHaveText([
    '展示名称',
    '权益图标',
    '权益简介',
    '操作',
  ])
  await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('延迟退房')
  await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('房型升级')
  await expect(pageRoot).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/scrm--huiyuan-zhongxin--huiyuan-quanyi/default-clone-route.png',
    ),
    fullPage: true,
  })
})

test('/scrm/memberCenter/equity supports add edit delete refresh and sort feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/memberCenter/equity'))
  await collapseChatDock(page)

  await page.getByRole('button', { name: '添 加' }).click()
  await expect(page.getByRole('dialog', { name: '新增权益' })).toBeVisible()
  await page.getByRole('button', { name: '提 交' }).click()
  await expect(page.getByRole('alert')).toContainText('请输入权益名称')
  await expect(page.getByRole('alert')).toContainText('请上传权益图标')
  await page.getByPlaceholder('请输入权益名称').fill('早餐券')
  await page.locator('.member-equity-upload').click()
  await page.getByPlaceholder('请输入权益简介').fill('入住会员可领取门店早餐券一张')
  await page.getByRole('button', { name: '提 交' }).click()
  await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('权益已创建')
  await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('早餐券')

  await page.getByRole('button', { name: '编辑 早餐券' }).click()
  await expect(page.getByRole('dialog', { name: '编辑权益' })).toBeVisible()
  await page.getByPlaceholder('请输入权益名称').fill('早餐礼')
  await page.getByRole('button', { name: '提 交' }).click()
  await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('权益已保存')
  await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('早餐礼')

  await page.getByRole('button', { name: '排 序' }).click()
  await expect(page.getByText('拖动列表项排序')).toBeVisible()
  await page.getByRole('button', { name: '下移 延迟退房' }).click()
  await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('排序已调整')
  await page.getByRole('button', { name: '保存排序' }).click()
  await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('排序已保存')

  await page.getByRole('button', { name: '删除 早餐礼' }).click()
  await expect(page.getByRole('dialog', { name: '删除权益' })).toContainText('早餐礼')
  await page.getByRole('button', { name: '取 消' }).click()
  await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('早餐礼')
  await page.getByRole('button', { name: '删除 早餐礼' }).click()
  await page.getByRole('button', { name: '确 定' }).click()
  await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('权益已删除')
  await expect(page.getByRole('table', { name: '会员权益列表' })).not.toContainText('早餐礼')

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('会员权益已刷新')
})

test('/scrm/memberCenter/equity exposes empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/scrm/memberCenter/equity?mockState=empty'))
  await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('暂无会员权益')
  await expect(page.getByRole('table', { name: '会员权益列表' })).toContainText('暂无数据')
  await page.getByRole('button', { name: '排 序' }).click()
  await page.getByRole('button', { name: '保存排序' }).click()
  await expect(page.getByRole('status', { name: '会员权益操作反馈' })).toContainText('memberBenefitSeqs:不能为空')

  await page.goto(appUrl('/scrm/memberCenter/equity?mockState=error'))
  await expect(page.getByRole('alert', { name: '会员权益数据错误' })).toContainText('会员权益加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await expect(page.locator('.member-equity-page')).not.toContainText(/mock 数据|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/i)
})
