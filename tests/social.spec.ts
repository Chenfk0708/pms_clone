import { expect, test } from '@playwright/test'

const forbiddenBodyTerms = ['mock 数据', 'mock provider', '未接入', '阻塞', '后端未就绪', '后端接口未完成']

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/channels/social')
})

test('/channels/social uses business data service without development copy', async ({ page }) => {
  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByRole('heading', { name: '社媒', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '社媒渠道运营' })).toBeVisible()
  await expect(page.getByTestId('social-channel-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('social-channel-page')).toHaveAttribute(
    'data-trace-id',
    'mock-ota--shemei--shemei-overview-001',
  )

  const bodyText = await page.locator('body').innerText()
  for (const term of forbiddenBodyTerms) {
    expect(bodyText).not.toContain(term)
  }

  await expect(page.getByRole('article', { name: /抖音来客/ })).toContainText('关联房型2/4')
  await expect(page.getByRole('article', { name: /小红书/ }).getByRole('button', { name: '订阅开通' })).toBeVisible()
  await expect(page.getByRole('table', { name: '社媒账号管理列表' })).toContainText('7370207731854149643')
  await expect(page.getByRole('region', { name: '社媒运营趋势' })).toContainText('抖音来客')
})

test('/channels/social filter, refresh and visible actions provide feedback', async ({ page }) => {
  await page.getByLabel('运营日期').fill('2026-05-17')
  await page.getByLabel('门店').selectOption('camp-qianhai')
  await page.getByLabel('渠道状态').selectOption('connected')
  await page.getByRole('button', { name: '查询' }).click()

  await expect(page.getByRole('status')).toContainText('已按当前条件更新')
  await expect(page.getByTestId('social-channel-page')).toHaveAttribute('data-request-body', /2026-05-17/)
  await expect(page.getByTestId('social-channel-page')).toHaveAttribute('data-request-body', /camp-qianhai/)

  await page.getByTestId('social-channel-page').getByRole('button', { name: '刷新' }).click()
  await expect(page.getByRole('status')).toContainText('社媒数据已刷新')

  await page.getByTestId('social-channel-page').getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status')).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '更多' }).click()
  await expect(page.getByRole('dialog', { name: '更多操作' })).toBeVisible()
  await page.getByRole('button', { name: '关闭更多操作' }).click()

  await page.getByRole('button', { name: '重置' }).click()
  await expect(page.getByRole('status')).toContainText('筛选条件已重置')
})

test('/channels/social card, subscription and table detail interactions are handled', async ({ page }) => {
  await page.getByRole('article', { name: /抖音来客/ }).click()
  await expect(page.getByRole('dialog', { name: '抖音来客渠道详情' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '抖音来客渠道详情' })).toContainText('日历房')
  await page.getByLabel('关闭详情').click()

  await page.getByRole('article', { name: /小红书/ }).getByRole('button', { name: '订阅开通' }).click()
  await expect(page.getByRole('dialog', { name: '小红书订阅方案' })).toBeVisible()
  await page.getByRole('button', { name: '确认订阅' }).click()
  await expect(page.getByRole('status')).toContainText('订阅开通申请已提交')

  await page.getByRole('button', { name: '查看详情' }).first().click()
  await expect(page.getByRole('dialog', { name: '抖音来客渠道详情' })).toBeVisible()
  await page.getByLabel('关闭详情').click()

  await page.getByRole('button', { name: '拉取房型' }).first().click()
  await expect(page.getByRole('status')).toContainText('房型同步任务已提交')

  await page.getByRole('button', { name: '房价管理' }).click()
  await expect(page).toHaveURL(/\/houseManage\/houseCale$/)
})

test('/channels/social supports empty and error response states', async ({ page }) => {
  await page.evaluate(() => window.localStorage.setItem('pms.socialMockMode', 'empty'))
  await page.reload()
  await expect(page.getByText('暂无符合当前筛选条件的社媒渠道')).toBeVisible()

  await page.evaluate(() => window.localStorage.setItem('pms.socialMockMode', 'error'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('社媒数据加载失败')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.getByRole('alert')).toContainText('社媒数据加载失败')
  await page.evaluate(() => window.localStorage.removeItem('pms.socialMockMode'))
})
