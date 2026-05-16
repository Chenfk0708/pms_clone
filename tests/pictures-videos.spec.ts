import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/setting/picturesAndVideos matches captured picture manager empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/picturesAndVideos'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '图片视频' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '信息概览' })).toBeVisible()
  await expect(page.getByRole('link', { name: '房型信息' })).toBeVisible()

  const pageRoot = page.locator('.pictures-videos-page')
  await expect(pageRoot.getByRole('tab', { name: '图片管理' })).toHaveClass(/is-active/)
  await expect(pageRoot.getByRole('tab', { name: '附件管理' })).toBeVisible()
  await expect(pageRoot.getByPlaceholder('输入图片或文件夹名称')).toBeVisible()
  await expect(pageRoot.getByRole('button', { name: '搜索' })).toBeVisible()
  await expect(pageRoot.getByRole('button', { name: '上 传' })).toBeVisible()
  await expect(pageRoot.getByRole('button', { name: '新建文件夹' })).toBeVisible()
  await expect(pageRoot.getByLabel('全选')).toBeVisible()
  await expect(pageRoot.getByText('返回上一级')).toBeVisible()
  await expect(pageRoot.getByText('全部附件')).toBeVisible()
  await expect(pageRoot.getByText('共 0 条')).toBeVisible()
  await expect(pageRoot.getByText('1', { exact: true })).toBeVisible()
  await expect(pageRoot.getByRole('button', { name: '50 条/页' })).toBeVisible()
})

test('/setting/picturesAndVideos supports captured upload, new folder, and search states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/picturesAndVideos'))

  await page.getByRole('button', { name: '上 传' }).click()
  const uploadDialog = page.getByRole('dialog', { name: '上传附件' })
  await expect(uploadDialog).toContainText('上传到：')
  await expect(uploadDialog).toContainText('全部附件')
  await expect(uploadDialog).toContainText('上传指引：')
  await expect(uploadDialog).toContainText('单个附件最大支持10M')
  await expect(uploadDialog).toContainText('jpg、jpeg、png格式附件上传')
  await expect(uploadDialog).toContainText('支持选择多张图片上传')
  await expect(uploadDialog.getByRole('button', { name: '上传附件' })).toBeVisible()
  await expect(uploadDialog.getByRole('button', { name: '上传文件夹' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '新建文件夹' }).click()
  const folderCard = page.locator('.pictures-videos-folder-card')
  await expect(folderCard).toBeVisible()
  await expect(folderCard.getByRole('textbox', { name: '文件夹名称' })).toHaveValue('新建文件夹')

  await page.getByPlaceholder('输入图片或文件夹名称').fill('大床')
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByText('搜索：大床')).toBeVisible()
})
