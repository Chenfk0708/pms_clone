import { expect, test } from '@playwright/test'

const hudsonPattern = 'https://hudson-prod.localhome.cn/**'
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/houseManage/priceBoard uses explicit mock provider response packages by default', async ({ page }) => {
  const hudsonRequests: string[] = []

  await page.route(hudsonPattern, async (route) => {
    hudsonRequests.push(route.request().url())
    await route.abort('blockedbyclient')
  })

  await page.goto(appUrl('/houseManage/priceBoard'))

  const status = page.getByRole('status', { name: '电子房价牌数据接入状态' })
  await expect(status).toContainText('商品信息已更新')
  await expect(status).toHaveAttribute('data-provider', 'mock')
  await expect(status).toHaveAttribute(
    'data-trace-id',
    'mock-fangtai--fangjia-guanli--dianzi-fangjiapai-overview-001',
  )
  await expect(page.getByRole('heading', { name: '电子房价牌' })).toBeVisible()
  await expect(page.getByRole('button', { name: '去开通' })).toBeEnabled()
  await expect(page.locator('.price-board-page')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成/i)
  expect(hudsonRequests).toEqual([])
})

test('/houseManage/priceBoard exposes mock empty envelope', async ({ page }) => {
  await page.route(hudsonPattern, async (route) => {
    await route.abort('blockedbyclient')
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsPriceBoardProvider', 'mock')
    window.localStorage.setItem('pmsPriceBoardMockMode', 'empty')
  })

  await page.goto(appUrl('/houseManage/priceBoard'))

  const status = page.getByRole('status', { name: '电子房价牌数据接入状态' })
  await expect(status).toHaveAttribute('data-provider', 'mock')
  await expect(status).toHaveAttribute('data-response-state', 'empty')
  await expect(page.getByText('暂无电子房价牌商品配置')).toBeVisible()
  await expect(page.getByRole('button', { name: '去开通' })).toBeDisabled()
  await expect(page.locator('.price-board-page')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成/i)
})

test('/houseManage/priceBoard exposes mock error envelope with retry', async ({ page }) => {
  await page.route(hudsonPattern, async (route) => {
    await route.abort('blockedbyclient')
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsPriceBoardProvider', 'mock')
    window.localStorage.setItem('pmsPriceBoardMockMode', 'error')
  })

  await page.goto(appUrl('/houseManage/priceBoard'))

  await expect(page.getByRole('status', { name: '电子房价牌数据接入状态' })).toContainText('数据加载失败')
  await expect(page.getByRole('button', { name: '重试数据服务' })).toBeVisible()
  await expect(page.locator('.price-board-page')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成/i)
})
