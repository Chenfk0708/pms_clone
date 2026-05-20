import { chromium, expect } from '@playwright/test'

const baseUrl = process.env.PMS_TEST_BASE_URL ?? 'http://127.0.0.1:43032'
const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'

const browser = await chromium.launch({ executablePath: chromeExecutablePath, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

async function goto(path) {
  console.log(`goto ${path}`)
  await page.goto(`${baseUrl}${path}`, { timeout: 30_000 })
  console.log(`loaded ${path}`)
}

try {
  await goto('/channels/distribution/distributiondisplacement')
  console.log('check service')
  await expect(page.getByTestId('distribution-displacement-service-state')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('distribution-displacement-service-state')).toHaveAttribute(
    'data-endpoint',
    'https://hudson-prod.localhome.cn/edition/replace/order/get',
  )
  await expect(page.getByRole('region', { name: '置换概况' })).toContainText('¥12,860.00')
  await expect(page.getByRole('row', { name: /DD-20260518-001/ })).toContainText('美团民宿')
  await expect(page.getByText('共 3 条')).toBeVisible()
  console.log('check filters')

  await page.getByLabel('开始日期').fill('2026-05-17')
  await page.getByLabel('结束日期').fill('2026-05-18')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByTestId('distribution-displacement-service-state')).toHaveAttribute('data-request-body', /1778947200000/)
  await expect(page.getByText('筛选已更新')).toBeVisible()
  console.log('check detail')

  await page.getByRole('button', { name: '查看 DD-20260518-001 详情' }).click()
  await expect(page.getByRole('dialog', { name: '置换明细详情' })).toContainText('总裁套间')
  await page.getByRole('button', { name: '关闭置换明细详情' }).click()

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByText('导出任务已创建')).toBeVisible()
  console.log('check tail dialog')
  await page.getByRole('button', { name: '申请尾房置换' }).click()
  await expect(page.getByRole('dialog', { name: '尾房置换' })).toContainText('联系业务经理，进行尾房置换')
  await page.getByRole('button', { name: '我知道了' }).click()

  await goto('/channels/distribution/distributiondisplacement?mockState=error')
  console.log('check error')
  await expect(page.getByRole('alert')).toContainText('置换权益数据加载失败')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert')).toContainText('置换权益数据加载失败')

  await goto('/channels/distribution/distributiondisplacement?mockState=empty')
  console.log('check empty')
  await expect(page.getByText('暂无置换明细')).toBeVisible()
  await expect(page.getByText('共 0 条')).toBeVisible()

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        checks: [
          'service provider and endpoint',
          'summary and list data',
          'date filter request body',
          'detail dialog',
          'export feedback',
          'tail-room dialog',
          'error retry state',
          'empty state',
        ],
      },
      null,
      2,
    ),
  )
} finally {
  await browser.close()
}
