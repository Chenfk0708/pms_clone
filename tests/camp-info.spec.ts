import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function openCampInfo(
  page: import('@playwright/test').Page,
  options: {
    path?: string
    mode?: 'success' | 'empty' | 'error'
    latencyMs?: number
  } = {},
) {
  const { path = '/InformationMaintenance/campInfo', mode = 'success', latencyMs = 0 } = options
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(
    ({ mockMode, mockLatencyMs }) => {
      window.localStorage.setItem('pms.campInfoProvider', 'mock')
      window.localStorage.setItem('pms.campInfoMockMode', mockMode)
      window.localStorage.setItem('pms.campInfoMockLatencyMs', String(mockLatencyMs))
    },
    { mockMode: mode, mockLatencyMs: latencyMs },
  )
  await page.goto(appUrl(path), { waitUntil: 'domcontentloaded' })
}

function statusBar(page: import('@playwright/test').Page) {
  return page.locator('[role="status"][aria-label="门店信息操作反馈"]')
}

test('/InformationMaintenance/campInfo loads store data from the unified service layer', async ({ page }) => {
  await openCampInfo(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '门店信息', level: 1 })).toBeVisible()
  await expect(page.getByTestId('camp-info-contract')).toBeHidden()
  await expect(page.getByTestId('camp-info-contract')).toContainText('"traceId":"mock-shezhi--xinxi-weihu--mendian-xinxi-list-001"')
  await expect(page.getByTestId('camp-info-contract')).toContainText('"/camps/get"')
  await expect(page.getByTestId('camp-info-contract')).toContainText('"/camp/get"')
  await expect(page.getByRole('button', { name: '新建门店' })).toBeVisible()
  await expect(page.getByRole('button', { name: '一键导入' })).toBeVisible()
  await expect(page.getByRole('button', { name: '门店排序' })).toBeVisible()
  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
  await expect(page.locator('.camp-info-summary')).toContainText('1/1')
  await expect(statusBar(page)).toContainText('门店信息已更新')

  await page.getByPlaceholder('请输入门店名称').fill('前海')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(statusBar(page)).toContainText('已按当前条件更新门店信息')
  await expect(page.getByTestId('camp-info-contract')).toContainText('"keyword":"前海"')
  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)

  await page.getByPlaceholder('请输入门店名称').fill('不存在的门店')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.locator('[role="status"][aria-label="门店信息空态"]')).toContainText('暂无符合条件的门店')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('请输入门店名称')).toHaveValue('')
  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
})

test('/InformationMaintenance/campInfo covers expand, import, capacity, detail, edit and sort interactions', async ({
  page,
}) => {
  await openCampInfo(page)

  await page.getByRole('button', { name: '展开门店房型' }).click()
  await expect(page.getByLabel('门店房型明细')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByLabel('门店房型明细')).toContainText('联动关房')

  await page.getByRole('button', { name: '一键导入' }).click()
  await expect(page.getByRole('dialog', { name: '一键导入' })).toContainText('导入门店基础资料')
  await page.getByRole('dialog', { name: '一键导入' }).getByRole('button', { name: '开始导入' }).click()
  await expect(statusBar(page)).toContainText('导入任务已创建')

  await page.getByRole('button', { name: '新建门店' }).click()
  await expect(page.getByRole('dialog', { name: '门店剩余数量不足' })).toContainText('无法新增')
  await page.getByRole('dialog', { name: '门店剩余数量不足' }).getByRole('button', { name: '取消操作' }).click()
  await expect(page.getByRole('dialog', { name: '门店剩余数量不足' })).toBeHidden()

  await page.getByRole('button', { name: '详情' }).click()
  await expect(page.getByRole('dialog', { name: '门店详情' })).toContainText('联系电话')
  await page.getByRole('dialog', { name: '门店详情' }).getByRole('button', { name: '关闭门店详情' }).click()
  await expect(page.getByRole('dialog', { name: '门店详情' })).toBeHidden()

  await page.getByRole('button', { name: '编辑' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/edit$/)
  await expect(page.getByRole('heading', { name: '编辑', level: 1 })).toBeVisible()
  await expect(page.getByLabel('门店名称')).toHaveValue('天落会宿公寓(前海壹方城宝安中心店)')
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(statusBar(page)).toContainText('已进入详细介绍步骤')

  await openCampInfo(page, { path: '/InformationMaintenance/campInfo/sort' })
  await expect(page.getByRole('tab', { name: '门店排序' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('门店排序列表')).toContainText('天落会宿公寓(前海壹方城宝安中心店)')
  await page.getByRole('tab', { name: '商品排序' }).click()
  await expect(page.getByLabel('商品排序列表')).toContainText('巨幕观影套餐')
  await page.getByRole('button', { name: '保存排序' }).click()
  await expect(statusBar(page)).toContainText('排序已保存')
})

test('/InformationMaintenance/campInfo shows loading feedback while the mock provider is pending', async ({ page }) => {
  await openCampInfo(page, { latencyMs: 1200 })

  await expect(statusBar(page)).toContainText('门店信息加载中')
  await expect(page.getByRole('button', { name: '查 询' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '重 置' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '新建门店' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '一键导入' })).toBeDisabled()

  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
  await expect(statusBar(page)).toContainText('门店信息已更新')
})

test('/InformationMaintenance/campInfo handles empty and error responses with retry', async ({ browser }) => {
  const emptyPage = await browser.newPage()
  await openCampInfo(emptyPage, { mode: 'empty' })
  await expect(emptyPage.locator('[role="status"][aria-label="门店信息空态"]')).toContainText('暂无已创建的门店')
  await expect(emptyPage.getByRole('button', { name: '新建门店' })).toBeVisible()

  const errorPage = await browser.newPage()
  await openCampInfo(errorPage, { mode: 'error' })
  await expect(errorPage.getByRole('alert')).toContainText('门店信息加载失败')
  await errorPage.evaluate(() => window.localStorage.setItem('pms.campInfoMockMode', 'success'))
  await errorPage.getByRole('button', { name: '重新加载' }).click()
  await expect(errorPage.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
  await expect(statusBar(errorPage)).toContainText('门店信息已更新')
})
