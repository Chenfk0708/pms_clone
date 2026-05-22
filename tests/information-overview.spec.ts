import { expect, test } from '@playwright/test'

test('/InformationMaintenance/informationOverview matches captured information overview surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/InformationMaintenance/informationOverview')

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.sidebar-link[href="/InformationMaintenance/informationOverview"]')).toHaveClass(/is-active/)
  await expect(page.locator('.settings-page')).toBeVisible()

  await expect(page.getByText('门店:')).toBeVisible()
  await expect(page.getByRole('button', { name: '当前门店' })).toContainText('天落会舍公寓(前海壹方城宝安中心店)')
  await expect(page.getByText('数字化能力')).toBeVisible()
  await expect(page.getByText('超越73%的同行')).toBeVisible()
  await expect(page.getByRole('button', { name: '已上架 | 修改 >' })).toBeVisible()
  await expect(page.getByText('信息完善度')).toBeVisible()
  await expect(page.getByText('建议补齐资质信息，全渠道通用，并可快捷提交路客云进行一键开户;')).toBeVisible()
  await expect(page.getByRole('button', { name: '一键导入' })).toBeVisible()
  await expect(page.getByRole('button', { name: '一键新增' })).toBeVisible()
  await expect(page.locator('.flow-row').filter({ hasText: 'OTA流量' })).toContainText('(7/7)')
  await expect(page.locator('.flow-row').filter({ hasText: '社媒流量' })).toContainText('(0/3)')
  await expect(page.locator('.flow-row').filter({ hasText: '私域流量' })).toContainText('(1/1)')
  await expect(page.getByText('输入关键词搜索')).toBeVisible()
  await expect(page.getByText('热门套餐')).toBeVisible()
  await expect(page.getByText('精选房源')).toBeVisible()
})

test('store selector, status link and import menu interactions work on information overview', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/InformationMaintenance/informationOverview')

  await page.getByRole('button', { name: '当前门店' }).click()
  await expect(page.getByRole('listbox', { name: '门店列表' })).toBeVisible()
  await page.getByRole('option', { name: '天落会舍公寓(科技园店)' }).click()
  await expect(page.getByRole('button', { name: '当前门店' })).toContainText('天落会舍公寓(科技园店)')

  await page.getByRole('button', { name: '一键导入' }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '完善门店信息' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '完善房型信息' })).toBeVisible()

  await page.getByRole('button', { name: '已上架 | 修改 >' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)
})

test('traffic add button routes to ota page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/InformationMaintenance/informationOverview')

  await page.getByRole('button', { name: '一键新增' }).click()
  await expect(page).toHaveURL(/\/channels\/ota$/)
})

test('store import dialog supports dropdown and form controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/InformationMaintenance/informationOverview')

  await page.getByRole('button', { name: '一键导入' }).click()
  await page.getByRole('menuitem', { name: '完善门店信息' }).click()

  const dialog = page.getByRole('dialog', { name: '完善门店信息' })
  await expect(dialog).toContainText('请选择您上线的渠道（单选），酒店渠道能导入的信息能完善~')
  await expect(dialog.getByRole('tab', { name: '携程酒店' })).toHaveAttribute('aria-selected', 'true')

  await dialog.locator('.distribution-import-form__select').click()
  await expect(dialog.getByRole('listbox', { name: '选择门店' })).toBeVisible()
  await dialog.getByRole('option', { name: '天落会舍公寓(会展中心店)' }).click()
  await expect(dialog.locator('.distribution-import-form__select')).toContainText('天落会舍公寓(会展中心店)')

  await dialog.getByLabel('预付').check()
  await expect(dialog.getByLabel('预付')).toBeChecked()
  await dialog.getByLabel('现付').check()
  await expect(dialog.getByLabel('现付')).toBeChecked()

  await dialog.getByLabel('同时完成携程直连').uncheck()
  await expect(dialog.getByLabel('同时完成携程直连')).not.toBeChecked()
})

test('room import dialog switches between ctrip and meituan layouts', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/InformationMaintenance/informationOverview')

  await page.getByRole('button', { name: '一键导入' }).click()
  await page.getByRole('menuitem', { name: '完善房型信息' }).click()

  const dialog = page.getByRole('dialog', { name: '完善房型信息' })
  await expect(dialog.getByRole('tab', { name: '携程酒店' })).toHaveAttribute('aria-selected', 'true')
  await expect(dialog.getByRole('tab', { name: '美团民宿' })).toHaveAttribute('aria-selected', 'false')
  await expect(dialog.getByText('子酒店类型:')).toBeVisible()

  await dialog.getByRole('tab', { name: '美团民宿' }).click()
  await expect(dialog.getByRole('tab', { name: '美团民宿' })).toHaveAttribute('aria-selected', 'true')
  await expect(dialog.getByText('账号:')).toBeVisible()
  await expect(dialog.getByText('天落会宿')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '＋授权渠道账号' })).toBeVisible()
})

test('/InformationMaintenance/informationOvervie redirects to canonical information overview route', async ({ page }) => {
  await page.goto('/InformationMaintenance/informationOvervie')

  await expect(page).toHaveURL(/\/InformationMaintenance\/informationOverview$/)
  await expect(page.locator('.settings-page')).toBeVisible()
})
