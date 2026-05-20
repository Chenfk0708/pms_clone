import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const pagePath = '/setting/writeExpendSetting'
const forbiddenDevelopmentCopy = /未接入|阻塞|后端未完成|后端接口未完成|mock 数据/i

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.writeExpendSetting.provider', 'mock')
    window.localStorage.setItem('pmsCampId', '1796067693589061634')
    window.localStorage.removeItem('pms.writeExpendSetting.mockState')
    window.localStorage.removeItem('pms.writeExpendSetting.mockDelayMs')
    window.localStorage.removeItem('pms.writeExpendSetting.lastRequest')
    window.localStorage.removeItem('pms.writeExpendSetting.customItems')
  })
})

test('/setting/writeExpendSetting renders captured income settings through the provider contract', async ({ page }) => {
  await page.goto(appUrl(pagePath), { waitUntil: 'domcontentloaded' })

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '记一笔设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.locator('.write-expend-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.write-expend-page')).toHaveAttribute('data-response-state', 'success')

  await expect(page.getByText('系统默认项目不支持编辑和删除，可直接拖动调整排序。')).toBeVisible()
  await expect(page.getByRole('status', { name: '记一笔设置操作反馈' })).toContainText('已同步')
  await expect(page.getByRole('tab', { name: '收入项' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '支出项' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.getByRole('button', { name: '新增', exact: true })).toBeVisible()

  const incomePanel = page.getByLabel('收入项设置')
  await expect(incomePanel.getByRole('heading', { name: '住宿' })).toBeVisible()
  for (const name of ['房费', '清洁费', '押金', '长租账单', '押金延期费']) {
    await expect(incomePanel.getByText(name, { exact: true })).toBeVisible()
  }
  await expect(incomePanel.getByText('暂无项目，点击新增')).toHaveCount(4)
  await expect(page.getByLabel('已停用项')).toContainText('暂无停用项目')
  await expect(page.locator('.write-expend-card')).not.toContainText(forbiddenDevelopmentCopy)

  const contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'list',
    state: 'success',
    endpoint: 'https://hudson-prod.localhome.cn/paymentTypes/get/v2',
    requestBody: {
      campId: '1796067693589061634',
      bizTypes: [3],
    },
  })
})

test('/setting/writeExpendSetting supports tab switching and adding a custom expense item', async ({ page }) => {
  await page.goto(appUrl(`${pagePath}?tab=expense`), { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('tab', { name: '支出项' })).toHaveAttribute('aria-selected', 'true')
  await page.getByLabel('支出项设置').getByRole('button', { name: '点击新增' }).first().click()

  const dialog = page.getByRole('dialog', { name: '新增' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('名称')).toBeVisible()
  await dialog.getByLabel('名称').fill('夜间送物费')
  await dialog.getByRole('button', { name: '完成' }).click()

  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('status', { name: '记一笔设置操作反馈' })).toContainText('夜间送物费')
  await expect(page.getByLabel('支出项设置').getByText('夜间送物费', { exact: true })).toBeVisible()
  await expect(page.locator('.write-expend-default-badge.is-custom')).toContainText('自定义')

  const contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'create',
    state: 'success',
    endpoint: 'https://hudson-prod.localhome.cn/paymentTypes/custom/create',
    requestBody: {
      campId: '1796067693589061634',
      groupName: '餐饮',
      paymentTypeName: '夜间送物费',
      isIncome: 0,
      bizType: 3,
    },
  })
})

test('/setting/writeExpendSetting keeps the layout stable for the empty contract', async ({ page }) => {
  await page.goto(appUrl(`${pagePath}?mockState=empty`), { waitUntil: 'domcontentloaded' })

  await expect(page.locator('.write-expend-page')).toHaveAttribute('data-response-state', 'empty')
  await expect(page.getByRole('status', { name: '记一笔设置操作反馈' })).toContainText('暂无可展示项目')
  await expect(page.getByLabel('收入项设置').getByText('暂无项目，点击新增')).toHaveCount(5)
  await expect(page.getByLabel('已停用项')).toContainText('暂无停用项目')

  const contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'list',
    state: 'empty',
  })
})

test('/setting/writeExpendSetting exposes loading and error feedback, then retries the same contract', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.writeExpendSetting.mockState', 'error')
  })

  await page.goto(appUrl(`${pagePath}?mockDelayMs=2200`), { waitUntil: 'domcontentloaded' })

  await expect(page.locator('.write-expend-loading')).toBeVisible()
  await expect(page.getByRole('button', { name: '新增', exact: true })).toBeDisabled()
  await expect(page.getByRole('alert', { name: '记一笔设置数据错误' })).toContainText('记一笔设置加载失败')

  let contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'list',
    state: 'error',
  })

  await page.evaluate(() => {
    window.localStorage.setItem('pms.writeExpendSetting.mockState', 'success')
  })
  await page.getByRole('button', { name: '重试' }).click()

  await expect(page.getByText('房费')).toBeVisible()
  contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'list',
    state: 'success',
  })
})

async function readContract(page: import('@playwright/test').Page) {
  const rawText = await page.getByTestId('write-expend-setting-service-contract').textContent()
  return rawText ? JSON.parse(rawText) : null
}
