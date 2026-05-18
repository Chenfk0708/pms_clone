import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotDir = path.resolve(
  __dirname,
  '../artifacts/screenshots/dingdan--yushouquan-dingdan--kaquan-hexiao',
)

async function blockHudson(page: Page) {
  const hudsonRequests: string[] = []
  await page.route('https://hudson-prod.localhome.cn/**', async (route) => {
    hudsonRequests.push(route.request().url())
    await route.abort('blockedbyclient')
  })
  return hudsonRequests
}

test('/mallManagement/verificationManagement uses explicit provider data without visible development copy', async ({
  page,
}) => {
  const hudsonRequests = await blockHudson(page)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/mallManagement/verificationManagement')

  await expect(page.getByRole('heading', { name: '卡券核销', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '卡券核销' })).toHaveClass(/is-active/)
  await expect(page.getByPlaceholder('请输入卡券码')).toBeVisible()
  await expect(page.getByRole('button', { name: '核 销' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()

  await expect(page.getByTestId('card-verification-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('card-verification-service-contract')).toHaveAttribute(
    'data-trace-id',
    'mock-dingdan--yushouquan-dingdan--kaquan-hexiao-list-001',
  )
  await expect(page.locator('.card-verify-page')).not.toContainText(
    /mock|provider|traceId|未接入|阻塞|后端未就绪|后端接口未完成|mock 数据/i,
  )
  await expect(page.getByRole('status', { name: '卡券核销数据状态' })).toContainText('核销记录已更新')

  const table = page.getByLabel('卡券核销记录表格')
  await expect(table).toContainText('LK20260518001')
  await expect(table).toContainText('天落大床电竞套间')
  await expect(table).toContainText('已核销')
  await expect(page.getByLabel('卡券核销分页')).toContainText('共 3 条')
  expect(hudsonRequests).toEqual([])

  await page.screenshot({
    path: path.join(screenshotDir, 'default-clone-20260518-business-provider.png'),
    fullPage: true,
  })
})

test('/mallManagement/verificationManagement closes key interactions with business feedback', async ({ page }) => {
  await blockHudson(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/mallManagement/verificationManagement')

  await page.getByRole('button', { name: '核 销' }).click()
  await expect(page.getByRole('alert')).toContainText('请输入卡券码')

  await page.getByPlaceholder('请输入卡券码').fill('LK20260518002')
  await page.getByRole('button', { name: '核 销' }).click()
  await expect(page.getByRole('status', { name: '卡券核销操作反馈' })).toContainText('核销成功')
  await expect(page.getByLabel('卡券核销记录表格')).toContainText('LK20260518002')

  await page.getByRole('button', { name: '查看详情 LK20260518002' }).click()
  await expect(page.getByRole('dialog', { name: '卡券核销详情' })).toContainText('LK20260518002')
  await expect(page.getByRole('dialog', { name: '卡券核销详情' })).toContainText('相关订单')
  await page.getByRole('button', { name: '关闭卡券核销详情' }).click()
  await expect(page.getByRole('dialog', { name: '卡券核销详情' })).toBeHidden()

  await page.getByRole('button', { name: '导出明细' }).click()
  await expect(page.getByRole('status', { name: '卡券核销操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '卡券核销数据状态' })).toContainText('核销记录已更新')

  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.getByRole('status', { name: '卡券核销操作反馈' })).toContainText('已经是最后一页')
})

test('/mallManagement/verificationManagement exposes empty and error envelopes', async ({ page }) => {
  await blockHudson(page)
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsCardVerificationProvider', 'mock')
    window.localStorage.setItem('pmsCardVerificationMockMode', 'empty')
  })

  await page.goto('/mallManagement/verificationManagement')
  await expect(page.getByTestId('card-verification-service-contract')).toHaveAttribute('data-mode', 'empty')
  await expect(page.getByRole('status', { name: '卡券核销空态' })).toContainText('暂无符合条件的核销记录')
  await expect(page.getByLabel('卡券核销分页')).toContainText('共 0 条')

  await page.evaluate(() => {
    window.localStorage.setItem('pmsCardVerificationMockMode', 'error')
  })
  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '卡券核销数据状态' })).toContainText('核销记录加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await expect(page.locator('.card-verify-page')).not.toContainText(/mock|provider|traceId|未接入|阻塞|后端/i)
})
