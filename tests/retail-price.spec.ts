import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotDir = path.resolve(
  __dirname,
  '../artifacts/screenshots/fangtai--fangjia-guanli--menshijia',
)

async function mockRetailApis(page: Page) {
  await page.route('https://hudson-prod.localhome.cn/**', async (route) => {
    const url = route.request().url()

    if (url.endsWith('/camps/get')) {
      await route.fulfill({
        json: {
          success: true,
          data: { camps: [{ campId: 'camp-1', name: '路客云6TS5的店铺' }] },
        },
      })
      return
    }

    if (url.endsWith('/select/poi/page/get')) {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [{ poiId: 'poi-1', poiName: '天落会宿公寓(前海壹方城宝安中心店)' }],
          },
        },
      })
      return
    }

    if (url.endsWith('/roomCategories/page/get')) {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [
              { roomCategoryId: '1796425099729092609', roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）' },
              { roomCategoryId: '1796425099485822977', roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）' },
            ],
          },
        },
      })
      return
    }

    if (url.endsWith('/roomCategoryPrice/salePriceSetting/get')) {
      await route.fulfill({
        json: {
          success: true,
          data: {
            isInitPriceDisplay: 1,
            pricePriceInterfaceDisplayType: '2',
            priceSalePriceSettings: [],
          },
        },
      })
      return
    }

    await route.fulfill({ json: { success: true, data: {} } })
  })
}

test('/houseManage/retailPrice matches captured setup-required state', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsRetailPriceProvider', 'real')
  })
  await mockRetailApis(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/retailPrice')
  const retailPage = page.locator('.retail-main-panel')

  await expect(page.getByRole('heading', { name: '门市价', level: 1 })).toBeVisible()
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  const retailPanelBox = await retailPage.boundingBox()
  expect(retailPanelBox?.y).toBeLessThan(110)
  await expect(page.getByRole('button', { name: '钟点房设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '门市价设置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '价格规划' })).toBeVisible()
  await expect(page.getByRole('button', { name: '批量改价' })).toBeVisible()
  await expect(retailPage.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(retailPage.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(retailPage.getByRole('button', { name: /^房型\s*⌄$/ })).toBeVisible()
  await expect(retailPage.getByRole('button', { name: /^房型标签\s*⌄$/ })).toBeVisible()
  await expect(retailPage.getByPlaceholder('房源编码/简称/标题')).toBeVisible()
  await expect(retailPage.getByText('请先完成门市价设置')).toBeVisible()
  await expect(retailPage.getByRole('button', { name: '去设置' })).toBeVisible()
  await expect(page.getByText('门市价规则')).toHaveCount(0)
  await expect(page.locator('.retail-chat-fab')).toHaveCount(0)
  await expect(page.locator('.chat-dock')).toBeVisible()

  await retailPage.getByRole('button', { name: /^房型\s*⌄$/ }).click()
  await expect(retailPage.getByText('1796425099729092609')).toBeVisible()
  await expect(retailPage.getByText('1796425099485822977')).toBeVisible()
  await expect(retailPage.getByText('顶层套房（浴缸巨幕电竞麻将）')).toBeVisible()

  await retailPage.getByRole('button', { name: /^房型标签\s*⌄$/ }).click()
  await expect(retailPage.getByText('暂无数据')).toBeVisible()

  await page.screenshot({
    path: path.join(screenshotDir, 'default-clone-route.png'),
    fullPage: true,
  })
})

test('/houseManage/retailPrice supports captured setting interactions', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsRetailPriceProvider', 'real')
  })
  await mockRetailApis(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/retailPrice')

  await page.getByRole('button', { name: '去设置' }).click()
  await expect(page.getByRole('dialog', { name: '门市价设置' })).toBeVisible()
  await expect(page.getByText('请设置门市价与路客云中央价的关系')).toBeVisible()
  await expect(page.getByText('门市价等于中央价')).toBeVisible()
  await expect(page.getByText('门市价关联中央价')).toBeVisible()
  await expect(page.getByText('门市价=中央价')).toBeVisible()
  await expect(page.getByText('门市价与中央价相互独立')).toBeVisible()
  await page.getByRole('button', { name: '取消' }).click()

  await page.getByRole('button', { name: '价格规划' }).click()
  const planDialog = page.getByRole('dialog', { name: '价格规划' })
  await expect(planDialog).toBeVisible()
  await expect(planDialog.getByRole('button', { name: '全部门店' })).toBeVisible()
  await expect(planDialog.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(planDialog.getByRole('button', { name: '房型', exact: true })).toBeVisible()
  await expect(planDialog.getByRole('button', { name: '房型标签', exact: true })).toBeVisible()
  await expect(planDialog.getByRole('button', { name: '+新增规划' })).toBeVisible()
  await expect(planDialog.getByText('没有相关数据哦！')).toBeVisible()
  await page.getByRole('button', { name: '关闭价格规划' }).click()

  await page.getByRole('button', { name: '批量改价' }).click()
  const batchDialog = page.getByRole('dialog', { name: '批量修改' })
  await expect(batchDialog).toBeVisible()
  await expect(batchDialog.getByText('修改类型')).toBeVisible()
  await expect(batchDialog.locator('.retail-radio-row').filter({ hasText: /^价格$/ })).toBeVisible()
  await expect(batchDialog.getByText('选择房型')).toBeVisible()
  await expect(batchDialog.getByRole('button', { name: '添加房型' })).toBeVisible()
  await expect(batchDialog.getByText('已选0个房型')).toBeVisible()
  await expect(batchDialog.getByRole('button', { name: '多段模式' })).toBeVisible()
  await expect(batchDialog.getByRole('button', { name: '日历模式' })).toBeVisible()
  await expect(batchDialog.getByText('修改节假日价格')).toBeVisible()
  await expect(batchDialog.getByLabel('周一')).toBeChecked()
  await expect(batchDialog.getByLabel('全选')).toBeChecked()
  await expect(batchDialog.getByText('绝对值改价')).toBeVisible()
  await page.getByRole('button', { name: '取消' }).click()

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '门市价操作反馈' })).toContainText('门市价导出任务已创建')

  await page.getByRole('button', { name: '查看详情' }).click()
  await expect(page.getByRole('dialog', { name: '门市价详情' })).toContainText('门店数量')
  await page.getByRole('button', { name: '知道了' }).click()

  await page.getByRole('button', { name: '更多' }).click()
  await expect(page.getByRole('menu', { name: '门市价更多操作' })).toBeVisible()
  await page.getByRole('menuitem', { name: '同步房价' }).click()
  await expect(page.getByRole('status', { name: '门市价操作反馈' })).toContainText('门市价同步任务已创建')

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByRole('status', { name: '门市价操作反馈' })).toContainText('已重置门市价筛选条件')

  await page.getByRole('button', { name: '钟点房设置' }).click()
  await expect(page).toHaveURL(/\/houseManage\/retailPrice\/hourSetting$/)
  const hourBreadcrumb = page.locator('.retail-breadcrumb')
  await expect(hourBreadcrumb).toContainText('门市价')
  await expect(hourBreadcrumb).toContainText('钟点房设置')
  await expect(page.getByText('选择房型')).toBeVisible()
  await expect(page.getByRole('button', { name: '+房型' })).toBeVisible()
  await expect(page.getByLabel('产品名称')).toBeVisible()
  await expect(page.getByText('入住时长限制')).toBeVisible()
  await expect(page.getByRole('radio', { name: '限制', exact: true })).toBeChecked()
  await expect(page.getByText('3 小时')).toBeVisible()
  await expect(page.getByLabel('全天')).toBeChecked()
  await expect(page.getByText('10 点')).toBeVisible()
  await expect(page.getByText('22 点')).toBeVisible()
})

test('/houseManage/retailPrice loads through real request layer and refetches with UI filters', async ({ page }) => {
  const capturedRequests: Array<{ url: string; body: Record<string, unknown> }> = []

  await page.addInitScript(() => {
    window.localStorage.setItem('pmsRetailPriceProvider', 'real')
  })

  await page.route('https://hudson-prod.localhome.cn/**', async (route) => {
    const request = route.request()
    const url = request.url()
    const body = request.postDataJSON() as Record<string, unknown>
    capturedRequests.push({ url, body })

    if (url.endsWith('/camps/get')) {
      await route.fulfill({
        json: {
          success: true,
          data: { camps: [{ campId: 'camp-1', name: '路客云6TS5的店铺' }] },
        },
      })
      return
    }

    if (url.endsWith('/select/poi/page/get')) {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [{ poiId: 'poi-1', poiName: '天落会宿公寓(前海壹方城宝安中心店)' }],
          },
        },
      })
      return
    }

    if (url.endsWith('/roomCategories/page/get')) {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: [
              { roomCategoryId: 'room-1', roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）' },
              { roomCategoryId: 'room-2', roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）' },
            ],
          },
        },
      })
      return
    }

    if (url.endsWith('/roomCategoryPrice/salePriceSetting/get')) {
      await route.fulfill({
        json: {
          success: true,
          data: {
            isInitPriceDisplay: 1,
            pricePriceInterfaceDisplayType: '2',
            priceSalePriceSettings: [],
          },
        },
      })
      return
    }

    await route.fulfill({ json: { success: true, data: {} } })
  })

  await page.goto('/houseManage/retailPrice')
  await expect(page.getByRole('status', { name: '门市价数据服务状态' })).toContainText('门市价数据已更新')
  await expect(page.getByText('门店 1 个，房型 2 个，当前需完成门市价设置')).toBeVisible()
  await expect(page.getByTestId('retail-price-service-contract')).toHaveAttribute('data-provider', 'real')

  const endpointNames = capturedRequests.map((request) => new URL(request.url).pathname)
  expect(endpointNames).toContain('/camps/get')
  expect(endpointNames).toContain('/select/poi/page/get')
  expect(endpointNames).toContain('/roomCategories/page/get')
  expect(endpointNames).toContain('/roomCategoryPrice/salePriceSetting/get')

  await page.getByPlaceholder('房源编码/简称/标题').fill('总裁')
  await page.locator('.retail-search-submit').click()
  await expect.poll(() => capturedRequests.filter((request) => new URL(request.url).pathname === '/roomCategories/page/get').length).toBeGreaterThan(1)
  const lastRoomRequest = capturedRequests.filter((request) => new URL(request.url).pathname === '/roomCategories/page/get').at(-1)
  expect(lastRoomRequest?.body.keyword).toBe('总裁')
})

test('/houseManage/retailPrice exposes real request failures instead of silent fallback', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsRetailPriceProvider', 'real')
  })

  await page.route('https://hudson-prod.localhome.cn/**', async (route) => {
    await route.fulfill({ status: 403, json: { success: false, errorMsg: 'Forbidden' } })
  })

  await page.goto('/houseManage/retailPrice')
  await expect(page.getByRole('status', { name: '门市价数据服务状态' })).toContainText('数据加载失败')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await expect(page.getByText('请先完成门市价设置')).toBeVisible()
})

test('/houseManage/retailPrice uses explicit mock provider response packages by default', async ({ page }) => {
  const hudsonRequests: string[] = []

  await page.route('https://hudson-prod.localhome.cn/**', async (route) => {
    hudsonRequests.push(route.request().url())
    await route.abort('blockedbyclient')
  })

  await page.goto('/houseManage/retailPrice')

  await expect(page.getByRole('status', { name: '门市价数据服务状态' })).toContainText('门市价数据已更新')
  await expect(page.getByRole('status', { name: '门市价数据服务状态' })).not.toContainText('mock')
  await expect(page.locator('.retail-price-page')).not.toContainText(/mock|provider|traceId|未接入|阻塞|后端/i)
  await expect(page.getByTestId('retail-price-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('retail-price-service-contract')).toHaveAttribute('data-trace-id', 'mock-fangtai--fangjia-guanli--menshijia-overview-001')
  await expect(page.getByText('天落会宿公寓(前海壹方城宝安中心店)')).toBeVisible()
  await page.getByRole('button', { name: /^房型\s*⌄$/ }).click()
  await expect(page.getByText('顶层套房（浴缸巨幕电竞麻将）')).toBeVisible()
  await expect(page.getByText('请先完成门市价设置')).toBeVisible()
  expect(hudsonRequests).toEqual([])
})

test('/houseManage/retailPrice exposes mock empty and error envelopes', async ({ page }) => {
  await page.route('https://hudson-prod.localhome.cn/**', async (route) => {
    await route.abort('blockedbyclient')
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsRetailPriceProvider', 'mock')
    window.localStorage.setItem('pmsRetailPriceMockMode', 'empty')
  })

  await page.goto('/houseManage/retailPrice')
  await expect(page.getByRole('status', { name: '门市价数据服务状态' })).toContainText('门市价数据已更新')
  await expect(page.getByTestId('retail-price-service-contract')).toHaveAttribute('data-mode', 'empty')
  await expect(page.getByText('暂无房型数据')).toBeVisible()

  await page.evaluate(() => {
    window.localStorage.setItem('pmsRetailPriceMockMode', 'error')
  })
  await page.getByRole('button', { name: '刷新', exact: true }).click()

  await expect(page.getByRole('status', { name: '门市价数据服务状态' })).toContainText('数据加载失败')
  await expect(page.getByRole('status', { name: '门市价数据服务状态' })).not.toContainText('mock')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
})
