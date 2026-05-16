import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotPath = path.resolve(
  __dirname,
  '../artifacts/screenshots/shezhi--tongyong-shezhi--dayin-shezhi/default-clone-route.png',
)
const baseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return baseURL ? `${baseURL}${routePath}` : routePath
}

test('/setting/print renders captured print settings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/print'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '打印设置' })).toHaveClass(/is-active/)

  await expect(page.getByRole('heading', { name: '住宿打印', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '收款账单', level: 2 })).toBeVisible()

  const stayPrint = page.getByLabel('住宿打印配置')
  await expect(stayPrint.getByText('打印纸张')).toBeVisible()
  await expect(stayPrint.getByLabel('小票（80mm）')).toBeChecked()
  await expect(stayPrint.getByLabel('小票（58mm）')).toBeVisible()
  await expect(stayPrint.getByLabel('A4')).toBeVisible()
  await expect(stayPrint.getByText('消费明细账单（短租）')).toBeVisible()
  await expect(stayPrint.getByPlaceholder('请填写文案')).toHaveValue(
    '请您仔细核对金额，确认无误后签名确认，谢谢!欢迎您再次光临!',
  )
  await expect(stayPrint.getByRole('button', { name: '保 存' })).toBeVisible()

  const receiptPrint = page.getByLabel('收款账单配置')
  await expect(receiptPrint.getByText('选择单据')).toBeVisible()
  await expect(receiptPrint.getByRole('button', { name: '选择单据 收款账单' })).toBeVisible()
  await expect(receiptPrint.getByLabel('A4')).toBeChecked()
  await expect(receiptPrint.getByPlaceholder('请填写文案')).toHaveValue('')
  await expect(receiptPrint.getByRole('button', { name: '保 存' })).toBeVisible()

  await receiptPrint.getByLabel('小票（58mm）').check()
  await expect(receiptPrint.getByLabel('小票（58mm）')).toBeChecked()

  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
  await expect(page.locator('.chat-dock-launcher')).toBeVisible()

  await page.screenshot({ path: screenshotPath, fullPage: true })
})
