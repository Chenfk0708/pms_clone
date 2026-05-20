import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/statistics/presale loads report data through the presale sales service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/presale?mockDelayMs=1200'), { waitUntil: 'domcontentloaded' })

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '预售券销售统计' })).toHaveClass(/is-active/)

  const root = page.getByLabel('预售券销售统计')
  await expect(root.getByRole('heading', { name: '经营指标' })).toBeVisible()
  await expect(root.getByLabel('预售券经营指标').getByText('预售券总交易额')).toBeVisible()
  await expect(root.getByText('增长趋势分析')).toBeVisible()
  await expect(root.getByText('小程序订单来源分析')).toBeVisible()
  await expect(page.getByRole('button', { name: '查看明细数据>' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '订单数' })).toBeEnabled()

  const contract = page.getByTestId('presale-sales-service-contract')
  await expect(contract).toContainText('"provider":"mock"')
  await expect(contract).toContainText('/order/report/get')
  await expect(contract).toContainText('/report/store/management/get')
  await expect(contract).toContainText('"campId":"1796067693589061634"')
})

test('/statistics/presale switches chart dimension and keeps detail navigation working', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/presale'))

  const orderTab = page.getByRole('button', { name: '订单数' })
  await orderTab.click()
  await expect(orderTab).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('增长趋势分析')).toContainText('订单量趋势')

  const amountTab = page.getByRole('button', { name: '交易额' })
  await amountTab.click()
  await expect(amountTab).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('增长趋势分析')).toContainText('交易额趋势')

  await page.getByRole('button', { name: '查看明细数据>' }).click()
  await expect(page).toHaveURL(/\/statistics\/preSaleCouponMall$/)
})

test('/statistics/presale exposes empty and error states without silent fallback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/statistics/presale?mockState=empty'))
  await expect(page.locator('.presale-sales-inline-empty')).toContainText('当前周期暂无预售券成交数据')
  await expect(page.getByLabel('增长趋势分析').getByText('当前周期暂无预售券成交数据')).toBeVisible()
  await expect(page.getByLabel('小程序订单来源分析').getByText('当前周期暂无预售券成交数据')).toBeVisible()
  await expect(page.getByTestId('presale-sales-service-contract')).toContainText('"state":"empty"')

  await page.goto(appUrl('/statistics/presale?mockState=error'))
  await expect(page.getByRole('alert')).toContainText('预售券销售统计加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查看明细数据>' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '订单数' })).toBeDisabled()

  await page.evaluate(() => {
    window.history.replaceState({}, '', '/statistics/presale?mockState=success')
  })
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.getByLabel('预售券经营指标').getByText('预售券总交易额')).toBeVisible()
})
