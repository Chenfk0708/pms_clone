import { expect, test, type Page } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openStatisticsReport(page: Page, scenario: 'success' | 'empty' | 'error' = 'success') {
  await page.addInitScript((mode: 'success' | 'empty' | 'error') => {
    window.localStorage.setItem('pms.statisticsReport.provider', 'mock')
    window.localStorage.setItem('pms.statisticsReport.scenario', mode)
  }, scenario)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/statistics/report'))
  await expect(page.locator('.statistics-report-page')).toBeVisible()
  await page.waitForTimeout(1000)
}

test('/statistics/report loads through the statistics report provider contract', async ({ page }) => {
  await openStatisticsReport(page)

  await expect(page.locator('.topnav-link[href="/statistics/report"]')).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '统计概览' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()

  await expect(page.getByRole('button', { name: '统计总览' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '昨天' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-18')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-18')
  await expect(page.getByLabel('统计概览反馈')).toContainText('统计概览看板已加载')

  await expect(page.getByLabel('营收统计')).toContainText('总营业收入')
  await expect(page.getByLabel('营收统计')).toContainText('554.97')
  await expect(page.getByLabel('经营指标')).toContainText('入住率OCC')
  await expect(page.getByLabel('经营指标')).toContainText('25.00%')
  await expect(page.getByLabel('经营指标')).toContainText('平均房费ADR')
  await expect(page.getByLabel('经营指标')).toContainText('138.74')
  await expect(page.getByLabel('订单来源分析')).toContainText('飞猪淘酒店')
  await expect(page.getByLabel('订单来源分析')).toContainText('2单')

  const contract = page.getByTestId('statistics-report-contract')
  await expect(contract).toHaveAttribute('data-provider', 'mock')
  await expect(contract).toHaveAttribute('data-endpoint', '/report/accommodation/management/analysis/get')
  await expect(contract).toContainText('"campId":"1796067693589061634"')
  await expect(contract).toContainText('"startDate":"2026-05-18"')
  await expect(contract).toContainText('"endDate":"2026-05-18"')
  await expect(contract).toContainText('"businessIncome":554.97')
})

test('/statistics/report refreshes metrics and contract when switching presets and modes', async ({ page }) => {
  await openStatisticsReport(page)

  await expect(page.getByRole('button', { name: '上周' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '本周' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '上月' })).toBeDisabled()

  await page.getByRole('button', { name: '今天' }).click()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-19')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-19')
  await expect(page.getByLabel('统计概览反馈')).toContainText('已切换到今天')
  await expect(page.getByLabel('营收统计')).toContainText('567.43')
  await expect(page.getByLabel('订单来源分析')).toContainText('路客云聚合')
  await expect(page.getByTestId('statistics-report-contract')).toContainText('"startDate":"2026-05-19"')

  await page.getByRole('button', { name: '本月' }).click()
  await expect(page.getByLabel('开始日期')).toHaveValue('2026-05-01')
  await expect(page.getByLabel('结束日期')).toHaveValue('2026-05-19')
  await expect(page.getByLabel('统计概览反馈')).toContainText('已切换到本月')
  await expect(page.getByLabel('营收统计')).toContainText('12537.95')
  await expect(page.getByLabel('经营指标')).toContainText('53.95%')
  await expect(page.getByTestId('statistics-report-contract')).toContainText('"predictStartDate":"2026-05-01"')
  await expect(page.getByTestId('statistics-report-contract')).toContainText('"predictEndDate":"2026-05-31"')

  await page.getByRole('button', { name: '刷新看板' }).click()
  await expect(page.getByLabel('统计概览反馈')).toContainText('统计概览看板已刷新')
  await expect(page.getByTestId('statistics-report-contract')).toContainText('"startDate":"2026-05-01"')

  await page.getByRole('button', { name: '入住率OCC' }).click()
  await expect(page.getByLabel('统计概览反馈')).toContainText('已切换趋势指标：入住率OCC')
  await expect(page.getByLabel('入住率OCC趋势图')).toBeVisible()

  await page.getByRole('button', { name: '远期分析' }).click()
  await expect(page.getByRole('button', { name: '远期分析' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('远期趋势分析')).toContainText('预计未来营业收入')
  await expect(page.getByLabel('远期趋势分析')).toContainText('1272.05')
  await expect(page.getByLabel('远期趋势分析')).toContainText('预计总营业收入')
  await expect(page.getByLabel('远期趋势分析')).toContainText('13810.00')
})

test('/statistics/report updates request filters and surfaces empty room tag feedback', async ({ page }) => {
  await openStatisticsReport(page)

  await page.getByRole('button', { name: '本月' }).click()
  await page.getByRole('button', { name: '房型 全部房型' }).click()
  await page.getByRole('option', { name: '观影大床房' }).click()
  await expect(page.getByLabel('统计概览反馈')).toContainText('已按房型筛选')
  await expect(page.getByLabel('营收统计')).toContainText('3676.53')
  await expect(page.getByTestId('statistics-report-contract')).toContainText('"roomCategoryIds":["1796425098965729282"]')

  await page.getByRole('button', { name: '渠道 全部渠道' }).click()
  await page.getByRole('option', { name: '携程' }).click()
  await expect(page.getByLabel('统计概览反馈')).toContainText('已按渠道筛选')
  await expect(page.getByLabel('营收统计')).toContainText('2466.00')
  await expect(page.getByLabel('经营指标')).toContainText('52.63%')
  await expect(page.getByLabel('订单来源分析')).toContainText('携程')
  await expect(page.getByLabel('订单来源分析')).toContainText('11单')
  await expect(page.getByTestId('statistics-report-contract')).toContainText('"channelIds":["5"]')

  await page.getByRole('button', { name: '房型标签 暂无房型标签' }).click()
  await expect(page.getByRole('option', { name: '暂无房型标签' })).toBeVisible()
  await expect(page.getByLabel('统计概览反馈')).toContainText('当前门店暂无房型标签可筛选')
})

test('/statistics/report handles empty provider responses without collapsing the layout', async ({ page }) => {
  await openStatisticsReport(page, 'empty')

  await expect(page.getByText('暂无统计数据')).toBeVisible()
  await expect(page.getByText('当前筛选条件下没有可展示的经营数据，请调整条件后重试。')).toBeVisible()
  await expect(page.getByLabel('统计概览空状态').getByRole('button', { name: '刷新' })).toBeEnabled()
  await expect(page.getByTestId('statistics-report-contract')).toContainText('"businessIncome":0')
})

test('/statistics/report exposes provider errors and retries the same contract', async ({ page }) => {
  await openStatisticsReport(page, 'error')

  await expect(page.getByRole('alert')).toContainText('统计概览加载失败')
  await expect(page.getByRole('alert')).toContainText('/report/accommodation/management/analysis/get')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()

  await page.evaluate(() => window.localStorage.setItem('pms.statisticsReport.scenario', 'success'))
  await page.getByRole('button', { name: '重试' }).click()

  await expect(page.getByLabel('营收统计')).toContainText('554.97')
  await expect(page.getByTestId('statistics-report-contract')).toContainText('"startDate":"2026-05-18"')
})
