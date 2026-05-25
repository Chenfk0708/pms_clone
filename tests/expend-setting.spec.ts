import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function collapseChatDock(page: import('@playwright/test').Page) {
  const collapseButton = page.locator('aside[aria-label="全部会话"] button[aria-label="收起会话"]').first()
  if (await collapseButton.count()) {
    await collapseButton.click()
  }
}

async function openExpendSetting(
  page: import('@playwright/test').Page,
  mode: 'success' | 'empty' | 'error' = 'success',
) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/expendSetting'))
  await page.evaluate((mockMode) => {
    window.localStorage.setItem('pms.expendSettingProvider', 'mock')
    window.localStorage.setItem('pms.expendSettingMockState', mockMode)
  }, mode)
  await page.reload()
  await collapseChatDock(page)
  await page.locator('[data-testid="expend-setting-service-contract"]').waitFor({ state: 'attached', timeout: 15000 })

  if (mode === 'success') {
    await page.locator('.expend-setting-section-title').waitFor({ state: 'visible', timeout: 15000 })
    return
  }

  if (mode === 'empty') {
    await page.locator('[aria-label="收入项目空态"]').waitFor({ state: 'visible', timeout: 15000 })
    return
  }

  await page.locator('[role="alert"][aria-label="收入支出设置加载失败"]').waitFor({ state: 'visible', timeout: 15000 })
}

function serviceContract(page: import('@playwright/test').Page) {
  return page.getByTestId('expend-setting-service-contract')
}

function feedbackBar(page: import('@playwright/test').Page) {
  return page.getByRole('status', { name: '收入支出设置操作反馈' })
}

function incomeList(page: import('@playwright/test').Page) {
  return page.getByLabel('收入项目列表')
}

test('/setting/expendSetting renders grouped income cards and empty rows', async ({ page }) => {
  await openExpendSetting(page)

  await expect(serviceContract(page)).toHaveAttribute('data-provider', 'mock', { timeout: 15_000 })
  await expect(serviceContract(page)).toHaveAttribute('data-state', 'success')
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '收入/支出设置' })).toHaveClass(/is-active/)
  await expect(page.getByText('系统默认项目不支持编辑和删除，可直接拖动调整排序。')).toBeVisible()
  await expect(page.getByRole('tab', { name: '收入项' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '支出项' })).toHaveAttribute('aria-selected', 'false')
  await expect(page.locator('.expend-setting-section-title')).toHaveText('已同步收入项目配置')
  await expect(page.getByRole('button', { name: '新增', exact: true })).toBeVisible()

  const income = incomeList(page)
  await expect(income).toContainText('住宿')
  await expect(income).toContainText('加床')
  await expect(income).toContainText('加人')
  await expect(income).toContainText('损坏赔偿')
  await expect(income).toContainText('其他收入')
  await expect(income).toContainText('加时(延迟退房)')
  await expect(income).toContainText('餐饮')
  await expect(income).toContainText('旅游服务')
  await expect(income).toContainText('暂无项目，点击新增')
  await expect(page.getByText('已停用项')).toBeVisible()
  await expect(page.getByText('暂无停用项目')).toBeVisible()
})

test('/setting/expendSetting opens a blank add dialog from the top button', async ({ page }) => {
  await openExpendSetting(page)

  await page.getByTestId('expend-setting-top-add').click()

  const dialog = page.getByRole('dialog', { name: '新增' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-testid="expend-setting-group-select"]')).toHaveText('')
  await expect(dialog.locator('[data-testid="expend-setting-status-select"]')).toContainText('启用')
  await expect(dialog.getByLabel('名称')).toHaveValue('')

  await dialog.locator('[data-testid="expend-setting-group-select"]').click()
  const listbox = page.getByRole('listbox', { name: '业态选项' })
  await expect(listbox).toContainText('住宿')
  await expect(listbox).toContainText('餐饮')
  await expect(listbox).toContainText('商超')
  await expect(listbox).toContainText('娱乐')
  await expect(listbox).toContainText('场地')
  await dialog.locator('[data-testid="expend-setting-group-select"]').click()

  await dialog.locator('[data-testid="expend-setting-status-select"]').click()
  const statusListbox = page.getByRole('listbox', { name: '状态选项' })
  await expect(statusListbox).toContainText('启用')
  await expect(statusListbox).toContainText('停用')
})

test('/setting/expendSetting supports drag sorting for cards in the same group', async ({ page }) => {
  await openExpendSetting(page)

  const stayGroup = page.locator('[data-testid="expend-setting-group"][data-group-name="住宿"]')
  const beforeIds = await stayGroup
    .locator('[data-testid="expend-setting-item"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-item-id') ?? ''))
  expect(beforeIds.slice(0, 3)).toEqual(['6', '7', '9'])

  const source = stayGroup.locator('[data-item-id="36"]')
  const target = stayGroup.locator('[data-item-id="6"]')
  await source.dragTo(target)

  await expect(feedbackBar(page)).toContainText('收入项目排序已更新')

  const afterIds = await stayGroup
    .locator('[data-testid="expend-setting-item"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-item-id') ?? ''))
  expect(afterIds.indexOf('36')).toBeLessThan(afterIds.indexOf('6'))
})

test('/setting/expendSetting opens add dialog from an empty group with the matched business type', async ({ page }) => {
  await openExpendSetting(page)

  const diningGroup = page.locator('[data-testid="expend-setting-group"][data-group-name="餐饮"]')
  await diningGroup.getByRole('button', { name: '点击新增' }).click()

  const dialog = page.getByRole('dialog', { name: '新增' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-testid="expend-setting-group-select"]')).toContainText('餐饮')

  await dialog.locator('[data-testid="expend-setting-group-select"]').click()
  const listbox = page.getByRole('listbox', { name: '业态选项' })
  await expect(listbox).toContainText('住宿')
  await expect(listbox).toContainText('餐饮')
  await expect(listbox).toContainText('商超')
  await expect(listbox).toContainText('娱乐')
  await expect(listbox).toContainText('场地')
})

test('/setting/expendSetting can add an income item from an empty group dialog', async ({ page }) => {
  await openExpendSetting(page)

  const diningGroup = page.locator('[data-testid="expend-setting-group"][data-group-name="餐饮"]')
  await diningGroup.getByRole('button', { name: '点击新增' }).click()

  const dialog = page.getByRole('dialog', { name: '新增' })
  await expect(dialog.locator('[data-testid="expend-setting-group-select"]')).toContainText('餐饮')
  await dialog.getByLabel('名称').fill('测试收入项')
  await dialog.getByRole('button', { name: '完成' }).click()

  await expect(feedbackBar(page)).toContainText('已新增收入项目：测试收入项')
  await expect(incomeList(page)).toContainText('测试收入项')
  await expect(dialog).toHaveCount(0)
})

test('/setting/expendSetting can add a disabled item from the top dialog', async ({ page }) => {
  await openExpendSetting(page)

  await page.getByTestId('expend-setting-top-add').click()

  const dialog = page.getByRole('dialog', { name: '新增' })
  await dialog.locator('[data-testid="expend-setting-group-select"]').click()
  await page.getByRole('option', { name: '商超' }).click()
  await dialog.getByLabel('名称').fill('测试停用项')
  await dialog.locator('[data-testid="expend-setting-status-select"]').click()
  await page.getByRole('option', { name: '停用' }).click()
  await dialog.getByRole('button', { name: '完成' }).click()

  await expect(feedbackBar(page)).toContainText('已新增收入项目：测试停用项')
  await expect(page.getByLabel('已停用项目列表')).toContainText('测试停用项')
  await expect(page.locator('[data-testid="expend-setting-group"][data-group-name="商超"]')).toContainText('暂无项目')
})

test('/setting/expendSetting exposes explicit empty and error states', async ({ page }) => {
  await openExpendSetting(page, 'empty')
  await expect(serviceContract(page)).toHaveAttribute('data-state', 'empty', { timeout: 15_000 })
  await expect(page.getByRole('status', { name: '收入项目空态' })).toContainText('当前门店暂未配置收入项目')

  await openExpendSetting(page, 'error')
  await expect(serviceContract(page)).toHaveAttribute('data-state', 'error', { timeout: 15_000 })
  await expect(page.getByRole('alert')).toContainText('收入/支出设置数据加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
