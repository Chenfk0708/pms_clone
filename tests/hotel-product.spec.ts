import { expect, test } from '@playwright/test'

const hudson = 'https://hudson-prod.localhome.cn'
const forbiddenPageCopy = /mock|mock provider|未接入|阻塞|后端未就绪|后端接口未完成|mock 数据/

type CapturedRequest = {
  path: string
  body: Record<string, unknown>
}

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

async function mockHotelProductApis(page: import('@playwright/test').Page, captured: CapturedRequest[]) {
  await page.route(`${hudson}/**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const body = (request.postDataJSON() as Record<string, unknown>) ?? {}
    captured.push({ path, body })

    if (path === '/camps/get') {
      await route.fulfill({
        json: { success: true, data: { camps: [{ campId: 'camp-real-1', name: '路客云6TS5的店铺' }] } },
      })
      return
    }

    if (path === '/roomCategories/page/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [
              { roomCategoryId: 'room-real-1', roomCategoryName: '真实接口套房A' },
              { roomCategoryId: 'room-real-2', roomCategoryName: '真实接口套房B' },
            ],
          },
        },
      })
      return
    }

    if (path === '/select/calChannel4RoomCategory/get' || path === '/channels/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            select: [
              { value: '4', label: '携程' },
              { value: '2', label: '途家' },
            ],
          },
        },
      })
      return
    }

    if (path === '/roomCategoryProducts/page/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [
              {
                productId: 'real-product-1',
                title: '真实接口电竞套餐',
                roomCategoryName: '真实接口套房A',
                channelName: '携程',
                stock: 16,
                salePrice: 699,
                extraPrice: 88,
                createdAt: '2026-05-18 10:00',
                updatedAt: '2026-05-18 11:00',
                status: 1,
              },
            ],
            pagination: { page: 1, pageSize: 20, total: 1 },
          },
        },
      })
      return
    }

    await route.fulfill({ json: { success: true, data: {} } })
  })
}

test('/mallManagement/hotelProduct uses explicit provider and renders business data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const realRequests: string[] = []
  await page.route(`${hudson}/**`, async (route) => {
    realRequests.push(route.request().url())
    await route.abort()
  })

  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '酒店套餐', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '酒店套餐' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('酒店套餐数据状态')).toContainText('数据已更新')
  await expect(page.getByText('电竞欢聚双晚套餐')).toBeVisible()
  await expect(page.getByText('影音大床工作日套餐')).toBeVisible()
  await expect(page.getByTestId('hotel-product-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('body')).not.toContainText(forbiddenPageCopy)
  expect(realRequests).toEqual([])
})

test('/mallManagement/hotelProduct filters, refreshes, and exposes empty/error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await page.getByRole('button', { name: '关联房型 请选择' }).click()
  await page.getByRole('option', { name: '观影大床房' }).click()
  await expect(page.getByText('影音大床工作日套餐')).toBeVisible()
  await expect(page.getByText('电竞欢聚双晚套餐')).toHaveCount(0)
  await expect(page.getByTestId('hotel-product-service-contract')).toHaveAttribute('data-request-summary', /roomCategoryId=room-mock-4/)

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByLabel('酒店套餐操作反馈')).toContainText('数据已刷新')

  await page.evaluate(() => window.localStorage.setItem('pms.hotelProductMockMode', 'empty'))
  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '酒店套餐空态' })).toContainText('暂无符合当前筛选条件的酒店套餐')

  await page.evaluate(() => window.localStorage.setItem('pms.hotelProductMockMode', 'error'))
  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('alert', { name: '酒店套餐加载失败' })).toContainText('酒店套餐数据加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(forbiddenPageCopy)
})

test('/mallManagement/hotelProduct visible actions produce business feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await page.getByRole('button', { name: '查看详情' }).first().click()
  const detailDialog = page.getByRole('dialog', { name: '酒店套餐详情' })
  await expect(detailDialog).toContainText('预订电话')
  await detailDialog.getByRole('button', { name: '关闭' }).last().click()

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByLabel('酒店套餐操作反馈')).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '更多' }).first().click()
  await expect(page.getByRole('dialog', { name: '酒店套餐操作' })).toContainText('库存校验')
  await page.getByRole('button', { name: '执行校验' }).click()
  await expect(page.getByLabel('酒店套餐操作反馈')).toContainText('库存校验已完成')

  await page.getByRole('button', { name: '接单策略' }).click()
  await expect(page.getByRole('dialog', { name: '酒店套餐接单策略' })).toBeVisible()
  await page.getByRole('button', { name: '确 定' }).click()
  await expect(page.getByLabel('酒店套餐操作反馈')).toContainText('接单策略已保存')
  await expect(page.locator('body')).not.toContainText(forbiddenPageCopy)
})

test('/mallManagement/hotelProduct switches to real provider contract when configured', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('pms.hotelProductProvider', 'real'))
  const captured: CapturedRequest[] = []
  await mockHotelProductApis(page, captured)

  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await expect(page.getByText('真实接口电竞套餐')).toBeVisible()
  await expect(page.getByTestId('hotel-product-service-contract')).toHaveAttribute('data-provider', 'real')
  expect(captured.map((request) => request.path)).toContain('/roomCategoryProducts/page/get')

  await page.getByRole('button', { name: '渠道 请选择渠道' }).click()
  await page.getByRole('option', { name: '携程' }).click()
  await expect.poll(() => captured.filter((request) => request.path === '/roomCategoryProducts/page/get').length).toBeGreaterThan(1)
  expect(captured.filter((request) => request.path === '/roomCategoryProducts/page/get').at(-1)?.body.channelId).toBe('4')
})

test('/mallManagement/hotelProduct create flow has usable controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await page.getByRole('button', { name: '房型管理' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)
  await page.goto(appUrl('/mallManagement/hotelProduct'))

  await page.getByRole('button', { name: '创建酒店套餐' }).click()
  await expect(page).toHaveURL(/\/mallManagement\/hotelProduct\/edit$/)
  await expect(page.getByText('酒店套餐 / 创建酒店套餐')).toBeVisible()
  await page.getByRole('button', { name: '+ 选择房型' }).first().click()
  await expect(page.getByRole('dialog', { name: '选择房型' })).toContainText('顶层套房')
  await page.getByRole('button', { name: '确认选择' }).click()
  await page.getByRole('button', { name: '上传' }).click()
  await expect(page.getByLabel('酒店套餐编辑反馈')).toContainText('图片已加入上传队列')
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByRole('tab', { name: '套餐设置' })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: '添加套餐' }).click()
  await expect(page.getByText('2026-05-18 至 2026-05-19')).toBeVisible()
  await page.getByRole('button', { name: '保 存' }).click()
  await expect(page.getByLabel('酒店套餐编辑反馈')).toContainText('酒店套餐已保存')
  await expect(page.locator('body')).not.toContainText(forbiddenPageCopy)
})
