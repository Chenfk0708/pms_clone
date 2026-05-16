import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/smartHotel/smartHardware/IDCardReader matches captured setup flow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/IDCardReader'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '智慧酒店' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '身份证读卡器' })).toHaveClass(/is-active/)

  await expect(page.getByRole('heading', { name: '身份证读卡器', level: 1 })).toBeVisible()
  await expect(page.getByText('接入身份证读卡器可自动录入房客信息，并快速查询房客相关订单')).toBeVisible()
  await expect(page.getByRole('heading', { name: '接入流程' })).toBeVisible()
  await expect(page.getByText('请选择读卡器品牌')).toBeVisible()
  await expect(page.getByText('华视')).toBeVisible()
  await expect(page.getByText('请下载插件（如已下载，可跳过）')).toBeVisible()
  await expect(page.getByRole('button', { name: 'PMS助手下载' })).toBeVisible()
  await expect(page.getByText('请调试读卡')).toBeVisible()
  await expect(page.getByRole('button', { name: '读身份证' })).toBeVisible()
  await expect(page.getByRole('button', { name: '完成对接' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: '全部会话' })).toContainText('全部会话')
})

test('/smartHotel/smartHardware/IDCardReader supports reader setup interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/smartHotel/smartHardware/IDCardReader'))

  await page.getByRole('button', { name: 'PMS助手下载' }).click()
  await expect(page.getByRole('status')).toContainText('PMS助手下载已开始')

  await page.getByRole('button', { name: '读身份证' }).click()
  await expect(page.getByRole('status')).toContainText('已读取身份证信息')
  await expect(page.getByLabel('名字')).toHaveValue('张张')
  await expect(page.getByLabel('身份证号码')).toHaveValue('4403********1234')

  await page.getByRole('button', { name: '完成对接' }).click()
  await expect(page.getByRole('status')).toContainText('身份证读卡器已完成对接')

  await page.getByRole('button', { name: '收起', exact: true }).click()
  await expect(page.getByRole('button', { name: '打开全部会话' })).toBeVisible()
})
