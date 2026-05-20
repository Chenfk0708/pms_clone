import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL
const pagePath = '/CompanySetting/Apikeys'
const forbiddenDevelopmentCopy = /mock 数据|mock provider|provider=mock|未接入|待接入|阻塞|后端未就绪|后端接口未完成/i

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.apiKeys.provider', 'mock')
    window.localStorage.setItem('pmsCampId', '1796067693589061634')
    window.localStorage.removeItem('pms.apiKeys.mockState')
    window.localStorage.removeItem('pms.apiKeys.generateMockState')
    window.localStorage.removeItem('pms.apiKeys.lastRequest')
  })
})

test('/CompanySetting/Apikeys renders the target empty state through the service contract', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.topnav').getByRole('link', { name: '设置', exact: true })).toHaveClass(/is-active/)
  await expect(page.getByRole('heading', { name: '企业设置' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'API keys' })).toHaveClass(/is-active/)

  await expect(page.getByRole('heading', { name: 'API keys', level: 1 })).toBeVisible()
  await expect(page.getByText('此API keys用于Locals AI使用，请妥善保存。')).toBeVisible()
  await expect(page.getByText('不要与他人共享你的 API key，或将其暴露在浏览器中。')).toBeVisible()
  await expect(page.getByText('暂未生成路客云API keys，点击下方按钮获取API Keys')).toBeVisible()
  await expect(page.getByRole('button', { name: '获取API keys' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查看企业信息' })).toBeVisible()
  await expect(page.locator('.api-keys-page')).not.toContainText(forbiddenDevelopmentCopy)

  const contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'get',
    endpoint: 'https://hudson-prod.localhome.cn/user/secret/get',
    state: 'empty',
    requestBody: {
      campId: '1796067693589061634',
    },
  })
})

test('/CompanySetting/Apikeys generates business credentials and supports guide + route handoff', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  await page.getByRole('button', { name: '获取API keys' }).click()
  await expect(page.getByRole('status', { name: 'API keys操作反馈' })).toContainText('API keys 已生成')
  await expect(page.getByText('当前凭证')).toBeVisible()
  await expect(page.locator('dt', { hasText: 'Access Key ID' })).toBeVisible()
  await expect(page.locator('dt', { hasText: 'Secret Key' })).toBeVisible()
  await expect(page.getByRole('button', { name: '复制 Access Key ID' })).toBeVisible()
  await expect(page.getByRole('button', { name: '复制 Secret Key' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查看接入说明' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重新生成' })).toBeVisible()

  const contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'generate',
    endpoint: 'https://hudson-prod.localhome.cn/user/secret/generate',
    state: 'success',
    requestBody: {
      campId: '1796067693589061634',
    },
  })

  await page.getByRole('button', { name: '复制 Access Key ID' }).click()
  await expect(page.getByRole('status', { name: 'API keys操作反馈' })).toContainText('Access Key ID 已复制')

  await page.getByRole('button', { name: '查看接入说明' }).click()
  await expect(page.getByRole('dialog', { name: 'Locals AI 接入说明' })).toContainText('请在服务端安全保存 Secret Key')
  await page.getByRole('button', { name: '关闭接入说明' }).click()
  await expect(page.getByRole('dialog', { name: 'Locals AI 接入说明' })).toHaveCount(0)

  await page.getByRole('button', { name: '查看企业信息' }).click()
  await expect(page).toHaveURL(/\/CompanySetting\/CompanyInfo$/)
})

test('/CompanySetting/Apikeys can regenerate an existing credential set', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.apiKeys.mockState', 'success')
  })

  await page.goto(appUrl(pagePath))

  const currentAccessKey = page.getByTestId('api-keys-access-key-id')
  await expect(currentAccessKey).toBeVisible()
  const before = await currentAccessKey.textContent()

  await page.getByRole('button', { name: '重新生成' }).click()
  await expect(page.getByRole('dialog', { name: '确认重新生成 API keys' })).toContainText('重新生成后，请同步更新 Locals AI 配置')
  await page.getByRole('button', { name: '确认重新生成' }).click()
  await expect(page.getByRole('status', { name: 'API keys操作反馈' })).toContainText('已重新生成 API keys')

  const after = await currentAccessKey.textContent()
  expect(after).not.toBe(before)

  const contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'generate',
    state: 'success',
    endpoint: 'https://hudson-prod.localhome.cn/user/secret/generate',
  })
})

test('/CompanySetting/Apikeys exposes fetch failures and retry recovery', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.apiKeys.mockState', 'error')
  })

  await page.goto(appUrl(pagePath))

  await expect(page.getByRole('alert', { name: 'API keys数据错误' })).toContainText('API keys 加载失败，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()

  let contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'get',
    state: 'error',
    endpoint: 'https://hudson-prod.localhome.cn/user/secret/get',
  })

  await page.evaluate(() => {
    window.localStorage.setItem('pms.apiKeys.mockState', 'empty')
  })
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.getByText('暂未生成路客云API keys，点击下方按钮获取API Keys')).toBeVisible()

  contract = await readContract(page)
  expect(contract).toMatchObject({
    provider: 'mock',
    action: 'get',
    state: 'empty',
  })
})

async function readContract(page: import('@playwright/test').Page) {
  const rawText = await page.getByTestId('api-keys-service-contract').textContent()
  return rawText ? JSON.parse(rawText) : null
}
