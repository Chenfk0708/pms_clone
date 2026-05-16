import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/imSetting renders captured conversation settings default state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/imSetting'))

  await expect(page.getByRole('navigation', { name: '顶部导航' }).getByRole('link', { name: '设置', exact: true })).toHaveClass(
    /is-active/,
  )
  await expect(page.locator('.sidebar').getByRole('link', { name: '会话设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.locator('.page-content > .page-header')).toBeHidden()

  await expect(page.getByText('当前为会话基础版本，想提高IM回话接待效率')).toBeVisible()
  await expect(page.getByRole('link', { name: '会话升级版' })).toBeVisible()

  const tabs = page.locator('.im-setting-tabs')
  await expect(tabs.getByRole('button', { name: '常用语' })).toHaveClass(/is-active/)
  for (const name of ['自动回复设置', '页面设置', '标签设置', '快捷键设置', '版本设置']) {
    await expect(tabs.getByRole('button', { name })).toBeVisible()
  }

  await expect(page.locator('.im-phrase-categories').getByText('分类', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '新建分类' })).toBeVisible()
  await expect(page.locator('.im-phrase-categories').getByText('全部分类', { exact: true })).toBeVisible()
  await expect(page.getByText('当前分类：全部分类')).toBeVisible()
  await expect(page.getByPlaceholder('输入标题/回复内容')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加常用语' })).toBeVisible()
  await expect(page.getByRole('button', { name: '更改分类' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '批量删除' })).toBeDisabled()
  await expect(page.getByText('共选择 0 条')).toBeVisible()

  const table = page.locator('.im-phrase-table')
  for (const name of ['分类', '标题', '回复内容', '操作']) {
    await expect(table.getByText(name, { exact: true })).toBeVisible()
  }
  await expect(table.getByText('暂无数据')).toBeVisible()

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/shezhi--tongyong-shezhi--huihua-shezhi/default-clone-route.png',
    ),
    fullPage: true,
  })
})

test('/setting/imSetting supports captured tab switching without changing persisted settings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/imSetting'))

  await page.getByRole('button', { name: '自动回复设置' }).click()
  await expect(page.getByRole('heading', { name: '自动回复设置' })).toBeVisible()
  await expect(page.getByText('会话基础版暂未开启自动回复')).toBeVisible()

  await page.getByRole('button', { name: '标签设置' }).click()
  await expect(page.getByRole('heading', { name: '标签设置' })).toBeVisible()
  await expect(page.getByText('可用于会话列表快速识别咨询状态')).toBeVisible()

  await page.getByRole('button', { name: '常用语' }).click()
  await expect(page.getByText('当前分类：全部分类')).toBeVisible()
})
