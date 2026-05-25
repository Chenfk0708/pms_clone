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

test('/InformationMaintenance/campInfo loads store data from the unified service layer', async ({ page }) => {
  await openCampInfo(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.camp-info-toolbar')).toHaveCount(0)
  await expect(page.getByTestId('camp-info-contract')).toBeHidden()
  await expect(page.getByTestId('camp-info-contract')).toContainText('"traceId":"mock-shezhi--xinxi-weihu--mendian-xinxi-list-001"')
  await expect(page.getByTestId('camp-info-contract')).toContainText('"/camps/get"')
  await expect(page.getByTestId('camp-info-contract')).toContainText('"/camp/get"')
  await expect(page.locator('.camp-info-query')).toBeVisible()
  await expect(page.locator('.camp-info-summary')).toContainText('1/1')
  await expect(page.locator('.camp-info-summary__actions button')).toHaveCount(3)
  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)

  await page.locator('.camp-info-query input').fill('前海')
  await page.locator('.camp-info-query__actions button').first().click()
  await expect(page.getByTestId('camp-info-contract')).toContainText('"keyword":"前海"')
  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)

  await page.locator('.camp-info-query input').fill('不存在的门店')
  await page.locator('.camp-info-query__actions button').first().click()
  await expect(page.locator('.camp-info-empty')).toBeVisible()

  await page.locator('.camp-info-query__actions button').nth(1).click()
  await expect(page.locator('.camp-info-query input')).toHaveValue('')
  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
})

test('/InformationMaintenance/campInfo covers expand, import, capacity, detail, edit and sort interactions', async ({ page }) => {
  await openCampInfo(page)

  await page.locator('.camp-info-expand').click()
  await expect(page.locator('.camp-info-room-detail')).toBeVisible()
  await expect(page.locator('.camp-info-room-detail')).toContainText('顶层套房')

  await page.locator('.camp-info-summary__actions button').nth(1).click()
  await expect(page.locator('.camp-info-import-modal')).toBeVisible()
  await expect(page.locator('.camp-info-import-modal')).toContainText('导入门店基础资料')
  await page.locator('.camp-info-import-modal footer .is-primary').click()
  await expect(page.locator('.camp-info-import-modal')).toBeHidden()

  await page.locator('.camp-info-summary__actions button').first().click()
  await expect(page.locator('.camp-info-limit-modal')).toBeVisible()
  await expect(page.locator('.camp-info-limit-modal')).toContainText('无法新增')
  await page.locator('.camp-info-limit-modal footer button').first().click()
  await expect(page.locator('.camp-info-limit-modal')).toBeHidden()

  await page.locator('.camp-info-actions button').first().click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/detail\?storeId=/)
  await expect(page.locator('.camp-info-detail-breadcrumb')).toBeVisible()
  await expect(page.locator('.camp-info-detail-shell')).toBeVisible()
  await expect(page.locator('.camp-info-detail-tabs [aria-selected="true"]')).toHaveCount(1)
  await page.locator('.camp-info-detail-tabs button').nth(1).click()
  await expect(page.locator('.camp-info-detail-tabs button').nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.camp-info-detail-room-list')).toBeVisible()
  await page.locator('.camp-info-detail-breadcrumb button').click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)

  await page.locator('.camp-info-actions button').nth(1).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/edit$/)
  await expect(page.locator('.camp-info-edit-page')).toBeVisible()
  await expect(page.locator('input[aria-label="门店名称"]')).toHaveValue('天落会宿公寓(前海壹方城宝安中心店)')

  await openCampInfo(page, { path: '/InformationMaintenance/campInfo/sort' })
  await expect(page.locator('.camp-info-sort-page')).toBeVisible()
  await expect(page.locator('.camp-info-sort-list')).toContainText('天落会宿公寓')
  await page.getByRole('tab').nth(2).click()
  await expect(page.locator('.camp-info-sort-list')).toContainText('巨幕观影套餐')
})

test('/InformationMaintenance/campInfo shows loading feedback while the mock provider is pending', async ({ page }) => {
  await openCampInfo(page, { latencyMs: 1200 })

  await expect(page.locator('.camp-info-loading')).toBeVisible()
  await expect(page.locator('.camp-info-query__actions button').first()).toBeDisabled()
  await expect(page.locator('.camp-info-query__actions button').nth(1)).toBeDisabled()
  await expect(page.locator('.camp-info-summary__actions button').first()).toBeDisabled()
  await expect(page.locator('.camp-info-summary__actions button').nth(1)).toBeDisabled()

  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
})

test('/InformationMaintenance/campInfo handles empty and error responses with retry', async ({ browser }) => {
  const emptyPage = await browser.newPage()
  await openCampInfo(emptyPage, { mode: 'empty' })
  await expect(emptyPage.locator('.camp-info-empty')).toBeVisible()
  await expect(emptyPage.locator('.camp-info-summary__actions button').first()).toBeVisible()

  const errorPage = await browser.newPage()
  await openCampInfo(errorPage, { mode: 'error' })
  await expect(errorPage.locator('.camp-info-error')).toBeVisible()
  await errorPage.evaluate(() => window.localStorage.setItem('pms.campInfoMockMode', 'success'))
  await errorPage.locator('.camp-info-error .is-primary').click()
  await expect(errorPage.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
})
