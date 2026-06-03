import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const normalizedPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalizedPath}` : normalizedPath
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'custom-channel-contract-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })
})

test('/setting/customChannel renders a service-backed business-ready success state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/customChannel?provider=mock'))

  const pageRoot = page.locator('.custom-channel-page')
  const serviceContract = page.locator('[aria-label="自定义渠道数据服务"]')
  const feedback = page.getByRole('status', { name: '自定义渠道操作反馈' })

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(pageRoot).toBeVisible()
  await expect(pageRoot).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('link', { name: '自定义渠道' })).toHaveClass(/is-active/)
  await expect(feedback).toContainText('已加载自定义渠道配置')

  await expect(page.getByText('系统默认渠道不支持编辑和删除。点击“编辑”按钮，可停用或启用渠道，停用后不能在列表选项看到。')).toBeVisible()
  await expect(page.getByRole('heading', { name: '系统默认渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()
  await expect(page.locator('[aria-label="系统默认渠道"] .custom-channel-card')).toHaveCount(71)
  await expect(page.getByText('自来客')).toBeVisible()
  await expect(page.getByText('路客云聚合')).toBeVisible()
  await expect(page.getByText('Hotelbeds')).toBeVisible()

  await expect(page.getByRole('heading', { name: '自定义渠道' })).toBeVisible()
  await expect(page.getByRole('button', { name: '添加渠道' })).toBeVisible()
  await expect(page.getByRole('region', { name: '自定义渠道列表' })).toContainText('深圳散客联盟')
  await expect(page.getByRole('region', { name: '自定义渠道列表' })).toContainText('跨境长住合作')
  await expect(page.getByRole('button', { name: '编辑 自定义渠道 深圳散客联盟' })).toBeVisible()
  await expect(page.getByRole('button', { name: '停用 自定义渠道 深圳散客联盟' })).toBeVisible()
  await expect(page.getByRole('button', { name: '删除 自定义渠道 深圳散客联盟' })).toBeVisible()

  await expect(serviceContract).toContainText('provider=mock')
  await expect(serviceContract).toContainText('listPath=/channels/custom/list')
  await expect(serviceContract).toContainText('updatePath=/channels/custom/update')
  await expect(serviceContract).toContainText('createPath=/channels/custom/create')
  await expect(serviceContract).toContainText('deletePath=/channels/custom/delete')
  await expect(serviceContract).toContainText('systemCount=71')
  await expect(serviceContract).toContainText('customCount=2')
  await expect(pageRoot).not.toContainText(/mock 数据|mock provider|provider=mock|未接入|阻塞|后端未就绪|后端接口未完成/i)
})

test('/setting/customChannel supports system edit, create, update, disable and delete flows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/customChannel?provider=mock'))

  const feedback = page.getByRole('status', { name: '自定义渠道操作反馈' })

  await page.getByRole('button', { name: '编 辑' }).click()
  await expect(page.getByRole('button', { name: '保 存' })).toBeVisible()
  await page.getByLabel('路客云聚合启用').uncheck()
  await page.getByRole('button', { name: '保 存' }).click()
  await expect(feedback).toContainText('系统默认渠道设置已保存')
  await expect(page.getByRole('button', { name: '编 辑' })).toBeVisible()

  await page.locator('.chat-dock-launcher').click()
  await page.getByRole('button', { name: '收起会话' }).click()
  await page.getByRole('button', { name: '添加渠道' }).click()
  await expect(page.getByRole('dialog', { name: '添加渠道' })).toBeVisible()
  await page.getByLabel('渠道名称').fill('深夜电竞团购')
  await page.getByRole('button', { name: '渠道颜色' }).click()
  await page.getByRole('button', { name: '选择渠道颜色 琥珀橙' }).click()
  await page.getByRole('button', { name: '确 定' }).click()
  await expect(feedback).toContainText('自定义渠道已添加')
  await expect(page.getByRole('region', { name: '自定义渠道列表' })).toContainText('深夜电竞团购')

  await page.getByRole('button', { name: '编辑 自定义渠道 深圳散客联盟' }).click()
  await expect(page.getByRole('dialog', { name: '编辑渠道' })).toBeVisible()
  await page.getByLabel('渠道名称').fill('深圳散客联盟直营')
  await page.getByRole('button', { name: '确 定' }).click()
  await expect(feedback).toContainText('自定义渠道已更新')
  await expect(page.getByRole('region', { name: '自定义渠道列表' })).toContainText('深圳散客联盟直营')

  await page.getByRole('button', { name: '停用 自定义渠道 深圳散客联盟直营' }).click()
  await expect(feedback).toContainText('深圳散客联盟直营已停用')
  await expect(page.getByRole('button', { name: '启用 自定义渠道 深圳散客联盟直营' })).toBeVisible()

  await page.getByRole('button', { name: '删除 自定义渠道 深圳散客联盟直营' }).click()
  await expect(page.getByRole('dialog', { name: '删除渠道确认' })).toContainText('删除后不可恢复')
  await page.getByRole('button', { name: '确认删除' }).click()
  await expect(feedback).toContainText('自定义渠道已删除')
  await expect(page.getByRole('region', { name: '自定义渠道列表' })).not.toContainText('深圳散客联盟直营')
})

test('/setting/customChannel exposes empty and error states as business feedback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(appUrl('/setting/customChannel?provider=mock&mockState=empty'))
  await expect(page.getByRole('status', { name: '自定义渠道操作反馈' })).toContainText('当前暂无自定义渠道')
  await expect(page.getByLabel('自定义渠道空态')).toContainText('暂无自定义渠道')
  await expect(page.getByRole('button', { name: '添加渠道' })).toBeVisible()

  await page.goto(appUrl('/setting/customChannel?provider=mock&mockState=error'))
  await expect(page.getByRole('alert', { name: '自定义渠道数据错误' })).toContainText('自定义渠道加载失败，请稍后重试')
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('alert', { name: '自定义渠道数据错误' })).toContainText('自定义渠道加载失败，请稍后重试')
  await expect(page.locator('.custom-channel-page')).not.toContainText(/mock 数据|mock provider|provider=mock|未接入|阻塞|后端未就绪|后端接口未完成/i)
})

test('/setting/customChannel defaults to api provider and calls local gateway endpoints', async ({ page }) => {
  const listRequests: unknown[] = []
  await page.addInitScript(() => {
    window.localStorage.removeItem('pms.customChannel.provider')
    window.localStorage.setItem('pms_token', 'custom-channel-api-provider-token')
  })
  await page.route('**/api/channels/custom/list', async (route) => {
    listRequests.push(route.request().postDataJSON())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        traceId: 'mock-api-custom-channel-list',
        timestamp: '2026-06-02T00:00:00+08:00',
        data: {
          systemChannels: [
            { id: 'system-001', name: '自来客', color: '#20527f', enabled: true },
            { id: 'system-002', name: '路客云聚合', color: '#6f89d1', enabled: true },
          ],
          customChannels: [
            {
              id: '25501',
              name: '企业协议客户',
              code: 'CUSTOM-25501',
              color: '#2563eb',
              colorName: '晴空蓝',
              enabled: true,
              updatedAt: '2026-06-02 10:00:00',
              operator: '系统',
              note: '真实接口响应',
            },
          ],
        },
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/setting/customChannel'))

  const pageRoot = page.locator('.custom-channel-page')
  const serviceContract = page.locator('[aria-label="自定义渠道数据服务"]')

  await expect(pageRoot).toHaveAttribute('data-provider', 'api')
  await expect(serviceContract).toContainText('provider=api')
  await expect(serviceContract).toContainText('listPath=/channels/custom/list')
  await expect(page.getByRole('region', { name: '自定义渠道列表' })).toContainText('企业协议客户')
  await expect.poll(() => listRequests.length).toBe(1)
})
