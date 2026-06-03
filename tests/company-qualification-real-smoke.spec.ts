import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('/InformationMaintenance/qualification uses real gateway qualification APIs', async ({ page, request }) => {
  const token = await loginViaGateway(request)
  const apiPaths: string[] = []

  page.on('request', (req) => {
    const url = new URL(req.url())
    if (url.pathname.startsWith('/api/')) {
      apiPaths.push(url.pathname)
    }
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.companyQualification.provider': 'real',
    },
  })

  await page.goto(appUrl('/#/InformationMaintenance/qualification'))

  const contract = page.getByTestId('company-qualification-service-contract')
  await expect(page.locator('.company-qualification-page')).toHaveAttribute('data-provider', 'api', {
    timeout: 15_000,
  })
  await expect(contract).toContainText('"provider": "api"', { timeout: 15_000 })
  await expect(contract).toContainText('"path": "/company/qualification/get"')
  await expect(contract).toContainText('"action": "get"')
  await expect(page.getByRole('status', { name: '企业资质操作反馈' })).toContainText('企业资质已加载', {
    timeout: 15_000,
  })

  await page.getByRole('tab', { name: '营业资质' }).click()
  await page.getByRole('button', { name: /上传 营业执照/ }).click()
  await expect(contract).toContainText('"path": "/company/qualification/upload"', { timeout: 15_000 })
  await expect(contract).toContainText('"action": "upload"')

  await page.getByRole('tab', { name: '企业信息' }).click()
  await page.locator('.qualification-actions .qualification-button--primary').click()
  const form = page.locator('.company-edit-form')
  await form.locator('input').nth(0).fill(`真实企业资质联调-${Date.now()}`)
  await form.locator('input').nth(2).fill('18123941382')
  await form.locator('select.city-picker').selectOption('深圳 / 福田')
  await form.locator('input').nth(3).fill('福田区会展中心店 18 楼')
  await page.locator('.qualification-actions .qualification-button--primary').click()
  await expect(contract).toContainText('"path": "/company/qualification/save"', { timeout: 15_000 })
  await expect(contract).toContainText('"action": "save"')

  expect(apiPaths).toEqual(
    expect.arrayContaining([
      '/api/company/qualification/get',
      '/api/company/qualification/upload',
      '/api/company/qualification/save',
    ]),
  )
})
