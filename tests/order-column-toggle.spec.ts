import { expect, test, type Page } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function expectNoTrailingScrollGap(page: Page) {
  const metrics = await page.locator('.order-table').evaluate((table) => {
    const scroll = table.closest('.order-table-scroll')
    const headers = Array.from(table.querySelectorAll('.order-table__head > div'))
    const widthsSum = headers.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0)

    return {
      scrollWidth: scroll instanceof HTMLElement ? scroll.scrollWidth : 0,
      widthsSum,
    }
  })

  expect(Math.abs(metrics.scrollWidth - metrics.widthsSum)).toBeLessThanOrEqual(2)
}

async function readExpandedFlagTexts(page: Page) {
  return page.locator('.order-fixed-flag-cell').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim() ?? ''),
  )
}

test('house orders keep action column collapsed by default and render expanded flag columns as symbols', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-order/list'))

  await expect(page.getByRole('columnheader', { name: '占库存' })).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: '已排房' })).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: '计入统计' })).toHaveCount(0)
  await expectNoTrailingScrollGap(page)

  await page.getByTestId('order-column-toggle').click()
  await expect(page.getByRole('button', { name: '隐藏操作列' })).toBeVisible()
  const trailingHeaders = await page
    .locator('.order-table__head > div')
    .evaluateAll((nodes) => nodes.slice(-4).map((node) => node.textContent?.trim()))
  expect(trailingHeaders[0]).toContain('操作')
  expect(trailingHeaders.slice(1)).toEqual(['占库存', '已排房', '计入统计'])
  expect(await readExpandedFlagTexts(page)).toEqual(['√', '√', '√', '√', '×', '√'])
  await expectNoTrailingScrollGap(page)
})

test('long-rental orders keep action column collapsed by default and render expanded flag columns as symbols', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list'))
  await expect(page.getByRole('status', { name: '长租订单加载状态' })).toContainText('已加载 1 条')

  await expect(page.getByRole('columnheader', { name: '占库存' })).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: '已排房' })).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: '计入统计' })).toHaveCount(0)
  await expectNoTrailingScrollGap(page)

  await page.getByTestId('order-column-toggle').click()
  await expect(page.getByRole('button', { name: '隐藏操作列' })).toBeVisible()
  const trailingHeaders = await page
    .locator('.order-table__head > div')
    .evaluateAll((nodes) => nodes.slice(-4).map((node) => node.textContent?.trim()))
  expect(trailingHeaders[0]).toContain('操作')
  expect(trailingHeaders.slice(1)).toEqual(['占库存', '已排房', '计入统计'])
  expect(await readExpandedFlagTexts(page)).toEqual(['√', '×', '×'])
  await expectNoTrailingScrollGap(page)

  await page.getByTestId('order-filter-toggle').click()
  await expect(page.locator('.order-advanced-filters')).toBeVisible()
})
