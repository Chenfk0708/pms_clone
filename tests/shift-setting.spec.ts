import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/shiftSetting matches captured shift handover setting baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/shiftSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '交接班设置', exact: true })).toHaveClass(/is-active/)

  const shiftSection = page.getByRole('region', { name: '班次设置' })
  await expect(shiftSection).toBeVisible()
  await expect(shiftSection.getByRole('heading', { name: '班次设置' })).toBeVisible()
  await expect(shiftSection.getByText('最近更新时间：-')).toBeVisible()
  await expect(shiftSection.getByRole('button', { name: '班次设置' })).toBeVisible()
  for (const header of ['班次名称', '开始时间', '结束时间', '班次成员']) {
    await expect(shiftSection.getByRole('columnheader', { name: header })).toBeVisible()
  }
  await expect(shiftSection.getByText('暂无班次， 点击新增')).toBeVisible()

  const itemSection = page.getByRole('region', { name: '交班物品' })
  await expect(itemSection).toBeVisible()
  await expect(itemSection.getByRole('heading', { name: '交班物品' })).toBeVisible()
  await expect(itemSection.getByText('最近更新时间：-')).toBeVisible()
  await expect(itemSection.getByRole('button', { name: '添加物品' })).toBeVisible()
  await expect(itemSection.getByText('暂无交班物品， 点击新增')).toBeVisible()

  await expect(page.locator('.chat-dock')).toBeVisible()
})

test('/setting/shiftSetting supports captured add dialogs and chat collapse', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/shiftSetting'))

  await page.getByRole('button', { name: '班次设置' }).click()
  const shiftDialog = page.getByRole('dialog', { name: '设置班次' })
  await expect(shiftDialog).toBeVisible()
  await expect(shiftDialog.getByRole('heading', { name: '设置班次' })).toBeVisible()
  await expect(shiftDialog.getByRole('button', { name: '+ 新增班次' })).toBeVisible()
  await expect(shiftDialog.getByPlaceholder('请输入班次名称')).toBeVisible()
  await expect(shiftDialog.getByPlaceholder('请选择', { exact: true })).toHaveCount(2)
  await expect(shiftDialog.getByPlaceholder('请选择班次成员')).toBeVisible()
  await expect(shiftDialog.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(shiftDialog.getByRole('button', { name: '确 定' })).toBeVisible()
  await shiftDialog.getByRole('button', { name: '取 消' }).click()

  await page.getByRole('button', { name: '添加物品' }).click()
  const itemDialog = page.getByRole('dialog', { name: '添加物品' })
  await expect(itemDialog).toBeVisible()
  await expect(itemDialog.getByRole('heading', { name: '添加物品' })).toBeVisible()
  await expect(itemDialog.getByRole('button', { name: '+ 新增物品' })).toBeVisible()
  await expect(itemDialog.getByPlaceholder('请输入物品名称')).toBeVisible()
  await expect(itemDialog.getByRole('button', { name: '取 消' })).toBeVisible()
  await expect(itemDialog.getByRole('button', { name: '确 定' })).toBeVisible()
  await itemDialog.getByRole('button', { name: '取 消' }).click()

  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
  await expect(page.locator('.chat-dock-launcher')).toBeVisible()
})
