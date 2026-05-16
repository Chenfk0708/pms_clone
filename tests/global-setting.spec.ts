import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/channels/globalRadar/globalSetting matches captured configuration center state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/globalRadar/globalSetting'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '配置中心' })).toHaveClass(/is-active/)
  await expect(page.getByRole('img', { name: '全域雷达配置中心未开通预览' })).toBeVisible()
  await expect(page.getByText('聚合多渠道经营数据，AI预警竞对动态与异常风险')).toBeVisible()
  await expect(page.getByText('多渠道聚合 ｜ AI预警 ｜ 风险监测 ｜ 全局决策')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即开通' })).toBeVisible()

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin/default-clone-route.png',
    ),
    fullPage: true,
  })
})

test('/channels/globalRadar/globalSetting supports captured tab and subscribe interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/globalRadar/globalSetting'))

  await page.getByRole('button', { name: '立即开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail\?app=globalRadar$/)
  await expect(page.getByRole('heading', { name: '全域雷达', level: 2 })).toBeVisible()
  await expect(page.getByText('安装数据连接器，打破OTA数据孤岛一屏掌控酒店Ebooking经营数据。')).toBeVisible()
  await expect(page.getByText('¥1,927.68')).toHaveCount(2)
  await expect(page.getByText('¥3,303.16 / 年')).toBeVisible()
  await expect(page.getByText('2027-09-28 到期')).toBeVisible()
})
