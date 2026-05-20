import { expect, test, type Page } from '@playwright/test'

const pagePath = '/statistics/sale'

function contractLocator(page: Page) {
  return page.getByTestId('sales-report-service-contract')
}

function exportLocator(page: Page) {
  return page.getByTestId('sales-report-export-contract')
}

async function triggerButton(locator: ReturnType<Page['locator']>) {
  await locator.evaluate((node) => {
    if (!(node instanceof HTMLButtonElement)) {
      throw new Error('expected button element')
    }
    node.click()
  })
}

async function readJsonDataset<T>(locator: ReturnType<Page['getByTestId']>): Promise<T> {
  const raw = await locator.textContent()
  if (!raw) throw new Error('missing contract payload')
  return JSON.parse(raw) as T
}

async function expectDateRange(page: Page, startDate: string, endDate: string) {
  await expect(page.getByLabel('开始日期')).toHaveValue(startDate)
  await expect(page.getByLabel('结束日期')).toHaveValue(endDate)
}

test.describe('销况报表', () => {
  test.setTimeout(120_000)

  test('默认成功态加载真实交互壳和统一服务契约', async ({ page }) => {
    await page.goto(pagePath, { waitUntil: 'domcontentloaded' })

    await expect(page.locator('.page-content > .page-header')).toBeHidden()
    await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '报表' })).toHaveClass(/is-active/)
    await expect(page.getByRole('link', { name: '销况报表' })).toHaveClass(/is-active/)

    const root = page.locator('.sales-report-page')
    await expect(root).toHaveAttribute('data-provider', 'mock')
    await expect(root).toHaveAttribute('data-response-state', 'success')

    await expect(page.getByRole('button', { name: '按日' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: '按月' })).toBeVisible()
    await expect(page.getByRole('button', { name: '按门店' })).toBeVisible()
    await expect(page.getByRole('button', { name: '按渠道' })).toBeVisible()
    await expect(page.getByRole('button', { name: '按房型' })).toBeVisible()
    await expect(page.getByRole('button', { name: '按房间' })).toBeVisible()

    await expect(page.getByRole('radio', { name: '全部门店' })).toBeChecked()
    await expectDateRange(page, '2026-05-01', '2026-05-19')
    await expect(page.getByRole('button', { name: '昨天' })).toBeVisible()
    await expect(page.getByRole('button', { name: '本周' })).toBeVisible()
    await expect(page.getByRole('button', { name: '本月' })).toBeVisible()
    await expect(page.getByRole('button', { name: '上月' })).toBeVisible()
    await expect(page.getByLabel('房型', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('渠道')).toHaveValue('')
    await expect(page.getByLabel('房型分组')).toHaveValue('')

    await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
    await expect(page.getByRole('button', { name: '查询' })).toBeVisible()
    await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
    await expect(page.getByRole('button', { name: '说明' })).toBeVisible()
    await expect(page.getByRole('button', { name: '收起筛选' })).toBeVisible()
    await expect(page.getByRole('table', { name: '销况报表表格' }).locator('tbody tr').first()).toBeVisible()

    const contract = await readJsonDataset<{
      provider: string
      state: string
      requestBody: Record<string, unknown>
      rows: number
      traceId: string
    }>(contractLocator(page))

    expect(contract.provider).toBe('mock')
    expect(contract.state).toBe('success')
    expect(contract.requestBody.queryType).toBe(1)
    expect(contract.requestBody.startDate).toBe('2026-05-01')
    expect(contract.requestBody.endDate).toBe('2026-05-19')
    expect(contract.rows).toBeGreaterThan(0)
    expect(contract.traceId).toContain('mock-baobiao--tongji-baobiao--xiaokuang-baobiao')

    const table = page.getByRole('table', { name: '销况报表表格' })
    await expect(table).toContainText('入住间夜')
    await expect(table).toContainText('平均房费ADR')
    await expect(table).toContainText('平均客房收益RevPAR')
    await expect(table).toContainText('2026-05-19')
    await expect(table.locator('tbody tr').first()).toContainText('合计')
    await expect(page.getByText('第 1-20 条/总共 20 条')).toBeVisible()

    await triggerButton(page.getByRole('button', { name: '上月' }))
    await expectDateRange(page, '2026-04-01', '2026-04-30')
  })

  test('支持月度查询、筛选查询、导出和说明弹窗', async ({ page }) => {
    await page.goto(pagePath, { waitUntil: 'domcontentloaded' })
    const root = page.locator('.sales-report-page')
    const actions = root.locator('.sales-report-actions')

    await page.locator('.sales-report-tabs').getByRole('button', { name: '按月' }).click({ force: true })
    await expect(page.getByLabel('开始月份')).toHaveValue('2025-11')
    await expect(page.getByLabel('结束月份')).toHaveValue('2026-05')
    await triggerButton(actions.getByRole('button', { name: '查询' }))
    await expect(actions.getByRole('button', { name: '导出' })).toBeEnabled()

    let contract = await readJsonDataset<{
      requestBody: Record<string, unknown>
      state: string
    }>(contractLocator(page))
    expect(contract.requestBody.queryType).toBe(2)
    expect(contract.requestBody.startDate).toBe('2025-11-01')
    expect(contract.requestBody.endDate).toBe('2026-05-31')
    await expect(page.getByLabel('销况报表表格').getByText('暂无数据')).toBeVisible()

    await page.locator('.sales-report-tabs').getByRole('button', { name: '按日' }).click({ force: true })
    await expect(page.getByRole('button', { name: '按日' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByLabel('开始日期')).toBeVisible()
    await expect(actions.getByRole('button', { name: '查询' })).toBeEnabled()
    await page.getByLabel('房型', { exact: true }).selectOption('1796425098965729282')
    await triggerButton(actions.getByRole('button', { name: '查询' }))
    await expect(root.getByRole('status')).toContainText('已按当前条件刷新销况报表')
    await expect(actions.getByRole('button', { name: '导出' })).toBeEnabled()

    contract = await readJsonDataset(contractLocator(page))
    expect(contract.requestBody.queryType).toBe(1)
    expect(contract.requestBody.roomCategoryIds).toEqual(['1796425098965729282'])

    await triggerButton(actions.getByRole('button', { name: '导出' }))
    await expect(exportLocator(page)).not.toHaveText('{}')
    const exportContract = await readJsonDataset<{
      requestBody: Record<string, unknown>
      taskId: string
      downloadUrl: string
      traceId: string
    }>(exportLocator(page))
    expect(exportContract.requestBody.pageSize).toBe(9999)
    expect(exportContract.requestBody.exportExcelMenuId).toBe('1898993554540892168')
    expect(exportContract.taskId).toContain('sales-report-export')
    expect(exportContract.downloadUrl).toContain('.xlsx')
    expect(exportContract.traceId).toContain('export')
    await expect(page.getByRole('status')).toContainText('导出任务')

    await triggerButton(actions.getByRole('button', { name: '说明' }))
    const dialog = page.getByRole('dialog', { name: '报表字段说明' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('入住率')
    await expect(dialog).toContainText('ADR')
    await expect(dialog).toContainText('RevPAR')
  })

  test('覆盖空态和错误态反馈', async ({ page }) => {
    await page.goto(`${pagePath}?mockState=empty`, { waitUntil: 'domcontentloaded' })

    let contract = await readJsonDataset<{ state: string; rows: number }>(contractLocator(page))
    expect(contract.state).toBe('empty')
    expect(contract.rows).toBe(0)
    await expect(page.getByText('暂无销况数据')).toBeVisible()

    await page.goto(`${pagePath}?mockState=error`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('alert')).toContainText('销况报表加载失败')
    await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
    await triggerButton(page.getByRole('button', { name: '重试' }))
    await expect(page.getByText('正在加载销况报表...')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('销况报表加载失败')

    contract = await readJsonDataset(contractLocator(page))
    expect(contract.state).toBe('error')
  })

  test('剩余可见按钮提供显式反馈或禁用态', async ({ page }) => {
    await page.goto(pagePath, { waitUntil: 'domcontentloaded' })

    const root = page.locator('.sales-report-page')
    const actions = root.locator('.sales-report-actions')
    const filters = root.locator('.sales-report-filter-row')
    const pagination = root.locator('.sales-report-pagination')

    await expect(filters).toBeVisible()
    await actions.getByRole('button', { name: '收起筛选' }).click()
    await expect(actions.getByRole('button', { name: '展开筛选' })).toBeVisible()
    await expect(page.getByLabel('房型', { exact: true })).toHaveCount(0)
    await actions.getByRole('button', { name: '展开筛选' }).click()
    await expect(root.locator('.sales-report-filter-row')).toBeVisible()

    await triggerButton(page.getByRole('button', { name: '昨天' }))
    await expectDateRange(page, '2026-05-18', '2026-05-18')
    await triggerButton(page.getByRole('button', { name: '本周' }))
    await expectDateRange(page, '2026-05-18', '2026-05-19')
    await triggerButton(page.getByRole('button', { name: '本月' }))
    await expectDateRange(page, '2026-05-01', '2026-05-19')

    await triggerButton(actions.getByRole('button', { name: '重置' }))
    await expect(root.getByRole('status')).toContainText('已重置筛选条件')
    await expectDateRange(page, '2026-05-01', '2026-05-19')

    await triggerButton(actions.getByRole('button', { name: '说明' }))
    const dialog = page.getByRole('dialog', { name: '报表字段说明' })
    await expect(dialog).toBeVisible()
    await triggerButton(dialog.getByRole('button', { name: '关闭报表字段说明' }))
    await expect(dialog).toHaveCount(0)

    await expect(pagination.getByRole('button', { name: '上一页' })).toBeDisabled()
    await expect(pagination.getByRole('button', { name: '1' })).toBeDisabled()
    await expect(pagination.getByRole('button', { name: '下一页' })).toBeDisabled()
    await expect(pagination.getByRole('button', { name: '20 条/页' })).toBeDisabled()
  })
})
