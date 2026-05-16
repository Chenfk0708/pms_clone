import { expect, test } from '@playwright/test'

test('/InformationMaintenance/informationOverview matches captured information overview surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/InformationMaintenance/informationOverview')

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '信息概览' })).toHaveClass(/is-active/)
  await expect(page.locator('.settings-page')).toBeVisible()

  await expect(page.getByText('门店：')).toBeVisible()
  await expect(page.getByText('天落会宿公寓(前海壹方城宝安中心店)').first()).toBeVisible()
  await expect(page.getByText('数字化能力')).toBeVisible()
  await expect(page.getByText('超越73%的同行')).toBeVisible()
  await expect(page.getByText('已上架 | 修改 >')).toBeVisible()
  await expect(page.getByText('信息完善度')).toBeVisible()
  await expect(page.getByText('信息完整度')).toHaveCount(0)
  await expect(page.getByText('建议补齐资质信息，全渠道通用，并可快捷提交路客云进行一键开户')).toBeVisible()
  await expect(page.getByRole('button', { name: '一键导入' })).toBeVisible()
  await expect(page.getByRole('button', { name: '一键新增' })).toBeVisible()
  await expect(page.getByText('OTA流量（7/7）')).toBeVisible()
  await expect(page.getByText('社媒流量（0/3）')).toBeVisible()
  await expect(page.getByText('私域流量（1/1）')).toBeVisible()
  await expect(page.getByText('输入关键词搜索')).toBeVisible()
  await expect(page.getByText('热门套餐')).toBeVisible()
  await expect(page.getByText('精选房源')).toBeVisible()
})

test('/InformationMaintenance/informationOvervie redirects to canonical information overview route', async ({ page }) => {
  await page.goto('/InformationMaintenance/informationOvervie')

  await expect(page).toHaveURL(/\/InformationMaintenance\/informationOverview$/)
  await expect(page.locator('.settings-page')).toBeVisible()
})
