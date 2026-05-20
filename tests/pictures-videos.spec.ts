import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const pagePath = '/setting/picturesAndVideos'
const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|阻塞|后端未就绪|接口契约|未取证/i

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openPicturesVideos(
  page: import('@playwright/test').Page,
  mode: 'success' | 'empty' | 'error' = 'success',
) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript((mockMode) => {
    window.localStorage.setItem('pms.picturesVideosProvider', 'mock')
    window.localStorage.setItem('pms.picturesVideosMockState', mockMode)
    window.localStorage.removeItem('pms.picturesVideos.lastRequest')
  }, mode)
  await page.goto(appUrl(pagePath))
}

async function readDiagnostics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rawValue = window.localStorage.getItem('pms.picturesVideos.lastRequest')
    return rawValue ? JSON.parse(rawValue) : null
  })
}

test('/setting/picturesAndVideos loads media data from the provider-driven service', async ({ page }) => {
  await openPicturesVideos(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '图片视频' })).toHaveClass(/is-active/)
  await expect(page.locator('.pictures-videos-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.pictures-videos-page')).toHaveAttribute('data-response-state', 'success')
  await expect(page.getByRole('tab', { name: '图片管理' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: '附件管理' })).toBeVisible()
  await expect(page.getByLabel('图片视频工具栏')).toBeVisible()
  await expect(page.getByLabel('搜索图片或文件夹名称')).toBeVisible()
  await expect(page.getByRole('button', { name: '上传' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新建文件夹' })).toBeVisible()
  await expect(page.getByRole('button', { name: '返回上一级' })).toBeVisible()
  await expect(page.getByText('全部附件')).toBeVisible()
  await expect(page.getByText('新建文件夹')).toHaveCount(2)
  await expect(page.getByText('共 1 条')).toBeVisible()
  await expect(page.getByTestId('pictures-videos-contract')).toContainText('"path":"/"')
  await expect(page.getByTestId('pictures-videos-contract')).toContainText('"bizTypes":[1]')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  const diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    endpoint: '/medias/page/get',
    provider: 'mock',
    state: 'success',
    request: {
      campId: '1796067693589061634',
      pageNum: 1,
      pageSize: 50,
      path: '/',
      orderBy: 'create_time desc',
      name: '',
      bizTypes: [1],
    },
  })
})

test('/setting/picturesAndVideos supports search, upload, new folder, and attachment tab behavior', async ({ page }) => {
  await openPicturesVideos(page)

  await page.getByLabel('搜索图片或文件夹名称').fill('bed')
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByRole('status', { name: '图片视频操作反馈' })).toContainText('已按关键字“bed”筛选图片管理')
  await expect(page.locator('.pictures-videos-page')).toHaveAttribute('data-request-name', 'bed')
  await expect(page.getByText('共 0 条')).toBeVisible()

  let diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    endpoint: '/medias/page/get',
    request: {
      name: 'bed',
    },
  })

  await page.getByRole('button', { name: '上传' }).click()
  const uploadDialog = page.getByRole('dialog', { name: '上传附件' })
  await expect(uploadDialog).toContainText('上传到：')
  await expect(uploadDialog).toContainText('全部附件')
  await expect(uploadDialog).toContainText('为了保证附件的正常使用，单个附件最大支持 20M')
  await expect(uploadDialog.getByRole('button', { name: '上传附件' })).toBeVisible()
  await expect(uploadDialog.getByRole('button', { name: '上传文件夹' })).toBeVisible()
  await page.getByRole('button', { name: '关闭上传附件弹窗' }).click()

  await page.getByRole('button', { name: '新建文件夹' }).click()
  await expect(page.getByRole('textbox', { name: '文件夹名称' })).toHaveValue('新建文件夹')

  await page.getByRole('tab', { name: '附件管理' }).click()
  await expect(page.getByRole('tab', { name: '附件管理' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('搜索图片或文件夹名称')).toBeHidden()
  await expect(page.getByText('附件管理暂不支持搜索文件夹，保留列表与上传承接。')).toBeVisible()
  await expect(page.locator('.pictures-videos-page')).toHaveAttribute('data-active-tab', 'attachment')

  diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    request: {
      name: 'bed',
    },
  })
})

test('/setting/picturesAndVideos renders empty and error states without silent fallback', async ({ browser }) => {
  const emptyPage = await browser.newPage()
  await openPicturesVideos(emptyPage, 'empty')
  await expect(emptyPage.getByRole('status', { name: '图片视频空态' })).toContainText('当前目录下暂无图片或视频素材')
  await expect(emptyPage.getByRole('button', { name: '重置搜索条件' })).toBeVisible()
  await expect(emptyPage.locator('.pictures-videos-page')).toHaveAttribute('data-response-state', 'empty')
  await expect(emptyPage.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  const errorPage = await browser.newPage()
  await openPicturesVideos(errorPage, 'error')
  await expect(errorPage.getByRole('alert', { name: '图片视频数据错误' })).toContainText('图片视频数据加载失败，请稍后重试')
  await errorPage.evaluate(() => window.localStorage.setItem('pms.picturesVideosMockState', 'success'))
  await errorPage.getByRole('button', { name: '重试' }).click()
  await expect(errorPage.getByRole('status', { name: '图片视频操作反馈' })).toContainText('已重新加载图片视频数据')
  await expect(errorPage.locator('.pictures-videos-page')).toHaveAttribute('data-response-state', 'success')
  await expect(errorPage.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})
