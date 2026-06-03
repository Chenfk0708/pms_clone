import { expect, test } from '@playwright/test'
import { appUrl, installRealSession, loginViaGateway } from './helpers/real-auth'

test('/psb/log uses real gateway APIs for query and retry', async ({ page, request }) => {
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
      'pms.psbLogProvider': 'real',
    },
  })

  await page.goto(appUrl('/#/psb/log'))

  await expect(page.locator('.psb-log-page')).toHaveAttribute('data-provider', 'api', { timeout: 15_000 })
  await expect(page.locator('.psb-log-page')).toHaveAttribute('data-view-state', /success|empty/, { timeout: 15_000 })
  await expect(page.getByRole('status')).toContainText(/已加载|暂无上报日志/, { timeout: 15_000 })

  expect(apiRequests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: '/api/checkinGuestPsbLog/page/get',
        body: expect.objectContaining({
          campId: '10001',
          pageNum: 1,
          pageSize: 20,
        }),
      }),
      expect.objectContaining({
        path: '/api/select/poi/page/get',
        body: expect.objectContaining({
          campId: '10001',
          pageNum: 1,
          pageSize: 999,
        }),
      }),
    ]),
  )

  const firstOrderButton = page.getByRole('button', { name: /查看订单/ }).first()
  await expect(firstOrderButton).toBeVisible({ timeout: 15_000 })
  await firstOrderButton.click()

  const detail = page.getByRole('dialog', { name: '上报详情' })
  await expect(detail).toContainText('失败', { timeout: 15_000 })
  await page.getByRole('button', { name: '重新上报' }).click()

  await expect(detail).toContainText('成功', { timeout: 15_000 })
  await expect(page.getByRole('status')).toContainText('已重新上报', { timeout: 15_000 })
  expect(apiRequests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: '/api/checkinGuestPsbLog/retry',
        body: expect.objectContaining({
          campId: '10001',
        }),
      }),
    ]),
  )
})
