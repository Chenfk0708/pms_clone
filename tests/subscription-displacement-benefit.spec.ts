import { expect, test } from '@playwright/test'

const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(path: string) {
  return baseURL ? `${baseURL}${path}` : path
}

test('/version/displacementBenefit loads business data through the subscription service', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/displacementBenefit'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '置换权益', level: 1 })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '权益与订阅侧栏' })).toContainText([
    '我的权益',
    '置换权益',
    '版本订阅',
    '应用订阅',
    '路客商城',
  ].join(''))
  await expect(page.getByRole('link', { name: '置换权益' })).toHaveClass(/is-active/)

  await expect(page.getByTestId('subscription-displacement-service-state')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('subscription-displacement-service-state')).toHaveAttribute(
    'data-endpoint',
    'https://hudson-prod.localhome.cn/edition/replace/order/get',
  )
  await expect(page.getByTestId('subscription-displacement-service-state')).toHaveAttribute('data-request-body', /"pageSize":20/)

  await expect(page.getByRole('region', { name: '置换概况' })).toContainText('待置换金额')
  await expect(page.getByRole('region', { name: '置换概况' })).toContainText('¥12,860.00')
  await expect(page.getByRole('region', { name: '置换概况' })).toContainText('¥8,420.00')
  await expect(page.getByRole('row', { name: /DD-20260518-001/ })).toContainText('美团民宿')
  await expect(page.getByRole('row', { name: /DD-20260517-006/ })).toContainText('已置换')
  await expect(page.getByText('共 3 条')).toBeVisible()
})

test('/version/displacementBenefit filters, refreshes, exports and opens details with feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/displacementBenefit'))

  await page.getByLabel('开始日期').fill('2026-05-17')
  await page.getByLabel('结束日期').fill('2026-05-18')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByTestId('subscription-displacement-service-state')).toHaveAttribute(
    'data-request-body',
    /1778947200000/,
  )
  await expect(page.getByText('筛选已更新')).toBeVisible()

  await page.getByRole('button', { name: '查看 DD-20260518-001 详情' }).click()
  await expect(page.getByRole('dialog', { name: '置换明细详情' })).toContainText('总裁套间')
  await page.getByRole('button', { name: '关闭置换明细详情' }).click()

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByText('导出任务已创建')).toBeVisible()

  await page.getByLabel('置换权益操作').getByRole('button', { name: '刷新' }).click()
  await expect(page.getByText(/刷新完成/)).toBeVisible()

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByLabel('开始日期')).toHaveValue('')
  await expect(page.getByText('筛选已重置')).toBeVisible()
})

test('/version/displacementBenefit opens captured tail-room replacement dialog', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/displacementBenefit'))

  await page.getByRole('button', { name: '申请尾房置换' }).click()

  await expect(page.getByRole('dialog', { name: '尾房置换' })).toBeVisible()
  await expect(page.getByLabel('尾房置换二维码')).toBeVisible()
  await expect(page.getByText('联系业务经理，进行尾房置换')).toBeVisible()
  await page.getByRole('button', { name: '我知道了' }).click()
  await expect(page.getByRole('dialog', { name: '尾房置换' })).toHaveCount(0)
})

test('/version/displacementBenefit exposes service error and retry feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/displacementBenefit?mockState=error'))

  await expect(page.getByRole('alert')).toContainText('置换权益数据加载失败')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert')).toContainText('置换权益数据加载失败')
})

test('/version/displacementBenefit renders contract empty state without breaking layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/version/displacementBenefit?mockState=empty'))

  await expect(page.getByText('暂无置换明细')).toBeVisible()
  await expect(page.getByText('共 0 条')).toBeVisible()
  await expect(page.getByRole('table', { name: '置换明细表格' })).toBeVisible()
})
