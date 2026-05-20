import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/shiftSetting renders a contract-backed success state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/shiftSetting'))

  const pageRoot = page.locator('.shift-setting-page')
  const serviceContract = page.locator('[aria-label="交接班设置数据服务"]')
  const shiftSection = page.getByRole('region', { name: '班次设置' })
  const goodsSection = page.getByRole('region', { name: '交班物品' })

  await expect(page.locator('.page-content > .page-header')).toHaveCount(0)
  await expect(pageRoot).toBeVisible()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '交接班设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.locator('[aria-label="交接班设置操作反馈"]')).toContainText('已加载交接班设置')

  await expect(shiftSection.getByRole('heading', { name: '班次设置' })).toBeVisible()
  await expect(shiftSection.getByText('最近更新时间：')).toBeVisible()
  await expect(shiftSection.getByRole('button', { name: '班次设置' })).toBeVisible()
  for (const header of ['班次名称', '开始时间', '结束时间', '班次成员']) {
    await expect(shiftSection.getByRole('columnheader', { name: header })).toBeVisible()
  }
  await expect(shiftSection.getByRole('cell', { name: '早班', exact: true })).toBeVisible()
  await expect(shiftSection.getByRole('cell', { name: '夜班', exact: true })).toBeVisible()
  await expect(shiftSection.getByRole('cell', { name: '08:00', exact: true })).toBeVisible()
  await expect(shiftSection.getByRole('cell', { name: '路客云6TS5、陈早班' })).toBeVisible()

  await expect(goodsSection.getByRole('heading', { name: '交班物品' })).toBeVisible()
  await expect(goodsSection.getByRole('button', { name: '添加物品' })).toBeVisible()
  await expect(goodsSection.getByText('房卡')).toBeVisible()
  await expect(goodsSection.getByText('备用金')).toBeVisible()

  await expect(serviceContract).toContainText('provider=mock')
  await expect(serviceContract).toContainText('configPath=/shiftWorkConfig/page/get')
  await expect(serviceContract).toContainText('goodsPath=/shiftWorkGoods/page/get')
  await expect(serviceContract).toContainText('memberPath=/campRoles/get')
  await expect(serviceContract).toContainText('shiftCount=2')
  await expect(serviceContract).toContainText('goodsCount=2')
  await expect(serviceContract).toContainText('memberCount=4')
  await expect(pageRoot).not.toContainText(/mock 数据|mock provider|provider=mock|未接入|阻塞|后端未就绪|后端接口未完成/i)
})

test('/setting/shiftSetting supports adding shifts and goods through dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/shiftSetting'))

  await page.getByRole('button', { name: '班次设置' }).click()
  const shiftDialog = page.getByRole('dialog', { name: '设置班次' })
  await expect(shiftDialog).toBeVisible()
  await expect(shiftDialog.getByRole('button', { name: '+ 新增班次' })).toBeVisible()
  await shiftDialog.getByRole('button', { name: '+ 新增班次' }).click()
  await expect(shiftDialog.getByPlaceholder('请输入班次名称')).toHaveCount(3)

  const shiftNameInputs = shiftDialog.getByPlaceholder('请输入班次名称')
  const startInputs = shiftDialog.getByLabel('开始时间')
  const endInputs = shiftDialog.getByLabel('结束时间')
  const memberSelects = shiftDialog.getByLabel('班次成员')

  await shiftNameInputs.nth(2).fill('中班')
  await startInputs.nth(2).fill('12:00')
  await endInputs.nth(2).fill('18:00')
  await memberSelects.nth(2).selectOption(['member-2', 'member-4'])
  await shiftDialog.getByRole('button', { name: '确定' }).click()

  await expect(page.locator('[aria-label="交接班设置操作反馈"]')).toContainText('已保存班次设置')
  await expect(page.getByRole('dialog', { name: '设置班次' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '班次设置' })).toContainText('中班')
  await expect(page.getByRole('region', { name: '班次设置' })).toContainText('12:00')
  await expect(page.getByRole('region', { name: '班次设置' })).toContainText('陈早班、王夜班')
  await expect(page.locator('[aria-label="交接班设置数据服务"]')).toContainText('shiftCount=3')

  await page.getByRole('button', { name: '添加物品' }).click()
  const goodsDialog = page.getByRole('dialog', { name: '添加物品' })
  await expect(goodsDialog).toBeVisible()
  await goodsDialog.getByRole('button', { name: '+ 新增物品' }).click()
  await expect(goodsDialog.getByPlaceholder('请输入物品名称')).toHaveCount(3)
  await goodsDialog.getByPlaceholder('请输入物品名称').nth(2).fill('对讲机')
  await goodsDialog.getByRole('button', { name: '确定' }).click()

  await expect(page.locator('[aria-label="交接班设置操作反馈"]')).toContainText('已保存交班物品')
  await expect(page.getByRole('dialog', { name: '添加物品' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '交班物品' })).toContainText('对讲机')
  await expect(page.locator('[aria-label="交接班设置数据服务"]')).toContainText('goodsCount=3')
})

test('/setting/shiftSetting shows business empty and error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/setting/shiftSetting?mockState=empty'))
  await expect(page.locator('[aria-label="交接班设置操作反馈"]')).toContainText('当前暂无交接班配置')
  await expect(page.getByRole('region', { name: '班次设置' })).toContainText('暂无班次， 点击新增')
  await expect(page.getByRole('region', { name: '交班物品' })).toContainText('暂无交班物品， 点击新增')
  await expect(page.locator('[aria-label="交接班设置数据服务"]')).toContainText('mockState=empty')
  await expect(page.locator('[aria-label="交接班设置数据服务"]')).toContainText('shiftCount=0')
  await expect(page.locator('[aria-label="交接班设置数据服务"]')).toContainText('goodsCount=0')

  await page.goto(appUrl('/setting/shiftSetting?mockState=error'))
  await expect(page.getByRole('alert', { name: '交接班设置数据错误' })).toContainText('交接班设置加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载交接班设置' })).toBeVisible()
  await expect(page.locator('[aria-label="交接班设置操作反馈"]')).toContainText('交接班设置加载失败')
  await expect(page.locator('.shift-setting-page')).not.toContainText(/mock 数据|mock provider|provider=mock|未接入|阻塞|后端未就绪|后端接口未完成/i)
})
