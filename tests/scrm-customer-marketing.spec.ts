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

async function mockCustomerMarketingApis(page: import('@playwright/test').Page, captured: CapturedRequest[]) {
  await page.route(`${hudson}/**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const body = (request.postDataJSON() as Record<string, unknown>) ?? {}
    captured.push({ path, body })

    if (path === '/scrm/marketing/customer/overview') {
      await route.fulfill({
        json: {
          code: 0,
          message: 'success',
          data: {
            filters: {
              stores: [{ id: 'store-real-1', name: '真实接口门店' }],
              channels: [{ id: 'wechat', name: '企微私域' }],
              stages: [{ id: 'retention', name: '复购维护' }],
            },
            metrics: [
              { id: 'active', label: '活跃客户', value: 128, unit: '人', trend: '+8.5%', status: 'healthy' },
              { id: 'coupon', label: '券触达客户', value: 43, unit: '人', trend: '+4.2%', status: 'watch' },
            ],
            campaigns: [
              {
                id: 'real-campaign-1',
                name: '真实接口复购提醒',
                channel: '企微私域',
                status: 'running',
                audience: 128,
                conversionRate: '19.2%',
                owner: 'SCRM运营',
                nextAction: '查看详情',
              },
            ],
            funnel: [
              { label: '触达', value: 128 },
              { label: '咨询', value: 52 },
              { label: '下单', value: 18 },
            ],
            todos: [{ id: 'real-todo-1', title: '跟进真实接口客户', dueText: '今日 18:00', priority: '高', source: '企微私域' }],
            leads: {
              list: [
                {
                  id: 'real-lead-1',
                  customerName: '真实接口客户',
                  channel: '企微私域',
                  stage: '复购维护',
                  lastTouch: '2026-05-18 10:00',
                  nextStep: '发送优惠券',
                  owner: 'SCRM运营',
                },
              ],
              pagination: { page: 1, pageSize: 20, total: 1 },
            },
            quickLinks: [{ label: '客户列表', path: '/customer/list' }],
            updatedAt: '2026-05-18 10:30',
          },
          traceId: 'real-scrm-customer-marketing-001',
          timestamp: '2026-05-18T10:30:00+08:00',
        },
      })
      return
    }

    await route.fulfill({ json: { code: 0, message: 'success', data: {} } })
  })
}

test('/scrm/marketing/customer uses explicit provider and renders business data', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const realRequests: string[] = []
  await page.route(`${hudson}/**`, async (route) => {
    realRequests.push(route.request().url())
    await route.abort()
  })

  await page.goto(appUrl('/scrm/marketing/customer'))

  await expect(page.getByRole('heading', { name: '客户营销', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'SCRM' })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '客户营销' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('客户营销数据状态')).toContainText('数据已更新')
  await expect(page.getByText('沉睡客户唤醒')).toBeVisible()
  await expect(page.getByText('企微私域 · 进行中 · SCRM运营')).toBeVisible()
  await expect(page.getByText('复购维护名单')).toBeVisible()
  await expect(page.getByTestId('customer-marketing-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('body')).not.toContainText(forbiddenPageCopy)
  expect(realRequests).toEqual([])
})

test('/scrm/marketing/customer filters, refreshes, and exposes empty/error states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/marketing/customer'))

  await page.getByLabel('营销阶段').selectOption('retention')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByTestId('customer-marketing-service-contract')).toHaveAttribute('data-request-summary', /stage=retention/)
  await expect(page.getByLabel('客户营销操作反馈')).toContainText('查询条件已应用')

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByLabel('客户营销操作反馈')).toContainText('数据已刷新')

  await page.evaluate(() => window.localStorage.setItem('pms.customerMarketingMockMode', 'empty'))
  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('region', { name: '营销活动' }).getByLabel('客户营销空态')).toContainText(
    '暂无符合当前条件的客户营销任务',
  )

  await page.evaluate(() => window.localStorage.setItem('pms.customerMarketingMockMode', 'error'))
  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('alert', { name: '客户营销加载失败' })).toContainText('客户营销数据加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(forbiddenPageCopy)
})

test('/scrm/marketing/customer visible actions produce business feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/scrm/marketing/customer'))

  await page.getByRole('button', { name: '活跃客户' }).click()
  const metricDrawer = page.getByRole('dialog', { name: '客户营销指标详情' })
  await expect(metricDrawer).toContainText('触达客户')
  await metricDrawer.getByRole('button', { name: '关闭' }).click()

  await page.getByRole('region', { name: '营销活动' }).getByRole('button', { name: '查看详情' }).first().click()
  const campaignDialog = page.getByRole('dialog', { name: '营销活动详情' })
  await expect(campaignDialog).toContainText('转化率')
  await campaignDialog.getByRole('button', { name: '关闭' }).click()

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByLabel('客户营销操作反馈')).toContainText('导出任务已创建')

  await page.getByRole('region', { name: '待跟进任务' }).getByRole('button', { name: '跟进' }).first().click()
  await expect(page.getByLabel('客户营销操作反馈')).toContainText('跟进任务已记录')

  await page.getByRole('button', { name: '客户列表' }).click()
  await expect(page).toHaveURL(/\/customer\/list$/)
  await expect(page.locator('body')).not.toContainText(forbiddenPageCopy)
})

test('/scrm/marketing/customer switches to real provider contract when configured', async ({ page }) => {
  const captured: CapturedRequest[] = []
  await mockCustomerMarketingApis(page, captured)

  await page.goto(appUrl('/'))
  await page.evaluate(() => window.localStorage.setItem('pms.customerMarketingProvider', 'real'))
  await page.goto(appUrl('/scrm/marketing/customer'))

  await expect(page.getByText('真实接口复购提醒')).toBeVisible()
  await expect(page.getByRole('cell', { name: '真实接口客户' })).toBeVisible()
  await expect(page.getByTestId('customer-marketing-service-contract')).toHaveAttribute('data-provider', 'real')
  expect(captured.map((request) => request.path)).toContain('/scrm/marketing/customer/overview')

  await page.getByLabel('营销阶段').selectOption('retention')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect.poll(() => captured.filter((request) => request.path === '/scrm/marketing/customer/overview').length).toBeGreaterThan(1)
  expect(captured.filter((request) => request.path === '/scrm/marketing/customer/overview').at(-1)?.body.stage).toBe('retention')
})
