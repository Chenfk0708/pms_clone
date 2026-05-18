import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/scrm--kehu-gaikuang--kehu-gaikuang',
)

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/scrm/general renders business data from the customer overview provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/general'))

  await expect(page.locator('.sidebar-link[href="/scrm/general"]')).toHaveClass(/active/)
  await expect(page.getByRole('heading', { name: '客户概况', level: 1 })).toBeVisible()
  await expect(page.getByTestId('scrm-general-request-state')).toBeHidden()
  await expect(page.getByTestId('scrm-general-request-state')).toContainText('/scrm/general/overview/get')
  await expect(page.getByTestId('scrm-general-request-state')).toContainText('"provider":"mock"')
  await expect(page.getByLabel('客户资产盘点')).toContainText('客户数')
  await expect(page.getByLabel('客户资产盘点')).toContainText('589')
  await expect(page.getByLabel('客户资产盘点')).toContainText('会员总数')
  await expect(page.getByLabel('客户资产盘点')).toContainText('276')
  await expect(page.getByLabel('客户增长趋势图')).toContainText('06/18')
  await expect(page.getByLabel('客户运营待办')).toContainText('待跟进客户')
  await expect(page.getByLabel('客户来源排行')).toContainText('携程民宿')

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/未接入|阻塞|后端未就绪|后端接口未完成|mock 数据|mock provider|provider=mock/)

  await page.screenshot({
    path: path.join(artifactRoot, 'business-data-clone-20260518-95.png'),
    fullPage: true,
  })
})

test('/scrm/general passes filters into the data service and refreshes UI', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/general'))

  await page.getByLabel('开始日期').fill('2026-05-27')
  await page.getByLabel('结束日期').fill('2026-06-18')
  await page.getByLabel('门店').selectOption('1796425098638573570')
  await page.getByLabel('运营维度').selectOption('private')
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.getByTestId('scrm-general-request-state')).toContainText('"startDate":"2026-05-27"')
  await expect(page.getByTestId('scrm-general-request-state')).toContainText('"dimension":"private"')
  await expect(page.getByRole('status', { name: '客户概况操作反馈' })).toContainText('已按当前条件刷新客户概况')

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByLabel('运营维度')).toHaveValue('all')
  await expect(page.getByTestId('scrm-general-request-state')).toContainText('"dimension":"all"')
})

test('/scrm/general gives feedback for every visible action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/general'))

  await page.getByRole('button', { name: '知道了' }).click()
  await expect(page.getByLabel('企业微信授权提醒')).toHaveCount(0)

  await page.getByRole('button', { name: '刷新' }).click()
  await expect(page.getByRole('status', { name: '客户概况操作反馈' })).toContainText('客户概况已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '客户概况操作反馈' })).toContainText('已创建客户概况导出任务')

  await page.getByRole('button', { name: '查看客户数详情' }).click()
  await expect(page.getByRole('dialog', { name: '客户指标详情' })).toContainText('客户数')
  await page.getByRole('button', { name: '关闭详情' }).click()

  await page.getByRole('button', { name: '体验 智能入住接入企业微信' }).click()
  await expect(page.getByRole('dialog', { name: '推荐场景详情' })).toContainText('智能入住接入企业微信')
  await page.getByRole('button', { name: '关闭场景详情' }).click()

  await page.getByRole('link', { name: '客户列表' }).click()
  await expect(page).toHaveURL(/\/customer\/list$/)
})

test('/scrm/general exposes empty and error states with retry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/general?scenario=empty'))
  await expect(page.getByLabel('客户运营待办')).toContainText('当前条件暂无待办')
  await expect(page.getByLabel('客户来源排行')).toContainText('暂无来源数据')

  await page.goto(appUrl('/scrm/general?scenario=error'))
  await expect(page.getByRole('alert', { name: '客户概况数据错误' })).toContainText('客户概况服务暂时不可用')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert', { name: '客户概况数据错误' })).toHaveCount(0)
  await expect(page.getByLabel('客户资产盘点')).toContainText('589')
})
