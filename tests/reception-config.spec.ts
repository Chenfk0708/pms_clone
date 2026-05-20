import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const pagePath = '/scrm/wechatService/receptionConfig'
const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|待接入|阻塞|后端未就绪|后端接口未完成/

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeAll(async () => {
  await warmReceptionConfigRoute()
})

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.receptionConfigProvider', 'mock')
    window.localStorage.removeItem('pms.receptionConfigMockState')
    window.localStorage.removeItem('pms.receptionConfig.lastRequest')
  })
})

test('/scrm/wechatService/receptionConfig loads provider-driven reception dashboard', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('link', { name: '接待配置' })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '接待配置中心', level: 1 })).toBeVisible()
  await expect(page.locator('.reception-config-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.reception-config-page')).toHaveAttribute('data-response-state', 'success')
  await expect(page.locator('.reception-config-page')).toHaveAttribute('data-request-group', '')
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await expect(page.getByLabel('接待配置核心指标')).toContainText('接待员工')
  await expect(page.getByLabel('接待配置核心指标')).toContainText('12')
  await expect(page.getByLabel('接待配置核心指标')).toContainText('欢迎语模板')
  await expect(page.getByLabel('接待配置核心指标')).toContainText('6')
  await expect(page.getByLabel('接待规则列表')).toContainText('新客入住欢迎规则')
  await expect(page.getByLabel('接待员工列表')).toContainText('夜班接待组')
  await expect(page.getByLabel('快捷入口')).toContainText('微信客服')

  const diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    endpoint: '/scrm/wechatService/receptionConfig/dashboard',
    request: {
      storeId: '1796067693589061634',
      staffGroup: '',
      configStatus: '',
      keyword: '',
    },
  })
})

test('/scrm/wechatService/receptionConfig supports filters, preview, save, refresh, and export feedback', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '接待分组 全部分组' }).click()
  await page.getByRole('option', { name: '夜班接待组' }).click()
  await page.getByRole('button', { name: '规则状态 全部规则' }).click()
  await page.getByRole('option', { name: '已启用' }).click()
  await page.getByLabel('规则关键词').fill('夜班')
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.getByRole('status', { name: '接待配置操作反馈' })).toContainText('已按当前条件刷新接待配置')
  await expect(page.locator('.reception-config-page')).toHaveAttribute('data-request-group', 'night')
  await expect(page.locator('.reception-config-page')).toHaveAttribute('data-request-status', 'enabled')
  await expect(page.locator('.reception-config-page')).toHaveAttribute('data-request-keyword', '夜班')

  let diagnostics = await waitForDiagnostics(page, (nextDiagnostics) =>
    Boolean(
      nextDiagnostics?.request?.staffGroup === 'night' &&
        nextDiagnostics.request.configStatus === 'enabled' &&
        nextDiagnostics.request.keyword === '夜班',
    ),
  )
  expect(diagnostics.request).toMatchObject({
    staffGroup: 'night',
    configStatus: 'enabled',
    keyword: '夜班',
  })

  await page.getByRole('button', { name: '预览欢迎语' }).click()
  await expect(page.getByRole('dialog', { name: '欢迎语预览' })).toContainText('欢迎入住天麓会宿公寓')
  await page.getByRole('button', { name: '关闭欢迎语预览' }).click()

  await page.getByRole('button', { name: '刷新' }).click()
  await expect(page.getByRole('status', { name: '接待配置操作反馈' })).toContainText('接待配置数据已刷新')

  await page.getByRole('button', { name: '保存配置' }).click()
  await expect(page.getByRole('status', { name: '接待配置操作反馈' })).toContainText('接待配置已保存')

  await page.getByRole('button', { name: '导出配置' }).click()
  await expect(page.getByRole('status', { name: '接待配置操作反馈' })).toContainText('接待配置导出任务已创建')
  diagnostics = await readDiagnostics(page)
  expect(diagnostics).toMatchObject({
    endpoint: '/scrm/wechatService/receptionConfig/export',
    request: {
      staffGroup: 'night',
      configStatus: 'enabled',
      keyword: '夜班',
    },
  })
})

test('/scrm/wechatService/receptionConfig resets filters and coordinates quick routes', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '接待分组 全部分组' }).click()
  await page.getByRole('option', { name: '夜班接待组' }).click()
  await page.getByLabel('规则关键词').fill('夜班')
  await page.getByRole('button', { name: '重置' }).click()

  await expect(page.getByRole('status', { name: '接待配置操作反馈' })).toContainText('筛选条件已重置')
  await expect(page.locator('.reception-config-page')).toHaveAttribute('data-request-group', '')
  await expect(page.locator('.reception-config-page')).toHaveAttribute('data-request-keyword', '')

  await page.getByRole('button', { name: '微信客服' }).click()
  await expect(page).toHaveURL(/\/scrm\/wechatService\/manage/)

  await page.goto(appUrl(pagePath))
  await page.getByRole('button', { name: '企微员工列表' }).click()
  await expect(page).toHaveURL(/\/customer\/staffList$/)

  await page.goto(appUrl(pagePath))
  await page.getByRole('button', { name: '客户标签' }).click()
  await expect(page).toHaveURL(/\/customer\/tag$/)
})

test('/scrm/wechatService/receptionConfig renders empty and failure response states', async ({ page }) => {
  await page.goto(appUrl(`${pagePath}?receptionConfigMockState=empty`))

  await expect(page.getByLabel('接待规则列表').getByText('暂无接待规则')).toBeVisible()
  await expect(page.getByLabel('接待员工列表').getByText('当前筛选条件下暂无接待员工配置，请调整条件后重试。')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)

  await page.goto(appUrl(`${pagePath}?receptionConfigMockState=error`))
  await expect(page.getByRole('alert', { name: '接待配置数据错误' })).toContainText('接待配置数据加载失败，请重试')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(forbiddenDevelopmentCopy)
})

test('/scrm/wechatService/receptionConfig preserves subscription detail route as secondary action', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '立即开通' }).click()

  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '企微SCRM', level: 2 })).toBeVisible()
  await expect(page.getByText('商品详情')).toBeVisible()
})

async function readDiagnostics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rawValue = window.localStorage.getItem('pms.receptionConfig.lastRequest')
    return rawValue ? JSON.parse(rawValue) : null
  })
}

async function waitForDiagnostics(
  page: import('@playwright/test').Page,
  predicate: (diagnostics: Awaited<ReturnType<typeof readDiagnostics>>) => boolean = Boolean,
) {
  await expect.poll(async () => predicate(await readDiagnostics(page))).toBe(true)
  return readDiagnostics(page)
}

async function warmReceptionConfigRoute() {
  const targetUrl = appBaseURL ? `${appBaseURL}${pagePath}` : `http://127.0.0.1:4173${pagePath}`

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(targetUrl)
      if (response.ok) {
        await response.text()
        return
      }
    } catch {
      // Ignore warm-up failures and retry with a short backoff.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}
