import { execFileSync } from 'node:child_process'
import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('/CompanySetting/Apikeys uses real gateway APIs for get and generate', async ({ page, request }) => {
  clearApiKeys()
  const token = await loginViaGateway(request)
  const apiRequests: Array<{ path: string; body: Record<string, unknown> }> = []

  page.on('request', (req) => {
    const url = new URL(req.url())
    if (!url.pathname.startsWith('/api/')) return
    const postData = req.postData()
    apiRequests.push({
      path: url.pathname,
      body: postData ? JSON.parse(postData) : {},
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await installRealSession(page, token, {
    providers: {
      'pms.apiKeys.provider': 'real',
    },
  })

  await page.goto(appUrl('/#/CompanySetting/Apikeys'))

  const contract = page.getByTestId('api-keys-service-contract')
  await expect(contract).toContainText('"provider": "api"', { timeout: 15_000 })
  await expect(contract).toContainText('"action": "get"')
  await expect(contract).toContainText('"state": "empty"')
  await expect(page.locator('.api-keys-empty')).toBeVisible({ timeout: 15_000 })

  await page.locator('.api-keys-empty .api-keys-primary').click()
  await expect(page.getByTestId('api-keys-access-key-id')).toContainText(/^ak_local_/, { timeout: 15_000 })
  await expect(contract).toContainText('"action": "generate"', { timeout: 15_000 })
  await expect(contract).toContainText('"state": "success"')
  await expect(page.locator('.api-keys-panel--credential')).toBeVisible()

  expect(apiRequests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: '/api/user/secret/get',
        body: { campId: '10001' },
      }),
      expect.objectContaining({
        path: '/api/user/secret/generate',
        body: { campId: '10001' },
      }),
    ]),
  )
})

function clearApiKeys() {
  runMysql(`
    DELETE FROM company_api_key
    WHERE camp_id = 10001;
  `)
}

function runMysql(sql: string) {
  const mysqlPath = process.env.PMS_MYSQL_PATH ?? 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe'
  execFileSync(
    mysqlPath,
    [
      `--host=${process.env.PMS_DB_HOST ?? '127.0.0.1'}`,
      `--user=${process.env.PMS_DB_USER ?? 'root'}`,
      `--password=${process.env.PMS_DB_PASSWORD ?? '123456'}`,
      `--database=${process.env.PMS_DB_NAME ?? 'zp_pms'}`,
      '--default-character-set=utf8mb4',
      '--batch',
      '--raw',
      '--execute',
      sql,
    ],
    { encoding: 'utf8' },
  )
}
