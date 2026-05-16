import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/houseManage/logs/status sends captured real endpoint params and renders rows', async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined

  await page.route('https://hudson-prod.localhome.cn/roomStatusOperationLog/page/get/v2', async (route) => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        errorCode: null,
        errorMsg: null,
        data: {
          total: 1,
          pageNum: 1,
          size: 20,
          current: 1,
          hasNextPage: false,
          pages: 1,
          list: [
            {
              roomStatusOperationLogId: 'log-001',
              roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
              roomName: '房间1',
              startDate: '2026-05-16',
              endDate: '2026-05-17',
              operationContent: '同步房态',
              adjustContent: '系统调整',
              userName: '系统自动',
              createTime: '2026-05-16 08:26:16',
              channelRoomStatusOperationLogViews: [
                {
                  channelName: '同程酒店直连',
                  channelRoomCategoryProductName: '总裁套间（桑拿浴缸露台电竞麻将）',
                  stockContent: '余1',
                  isSuccess: 1,
                },
              ],
            },
          ],
        },
      }),
    })
  })

  await page.goto(appUrl('/houseManage/logs/status?campId=1796067693589061634'))
  await page.getByLabel('日志关键词').fill('总裁')
  await page.getByLabel('调整方式').selectOption({ label: '系统调整' })
  await page.getByLabel('操作渠道').selectOption({ label: '途家' })
  await page.getByRole('button', { name: '查 询' }).click()

  await expect(page.getByRole('status')).toContainText('已加载 1 条房态日志')
  await expect(page.getByRole('table', { name: '房态日志列表' })).toContainText('总裁套间')
  await expect(page.getByRole('table', { name: '房态日志列表' })).toContainText('同程酒店直连')
  await expect(page.getByRole('table', { name: '房态日志列表' })).toContainText('余1')

  expect(requestBody).toMatchObject({
    campId: '1796067693589061634',
    pageNum: 1,
    pageSize: 20,
    current: 1,
    keyword: '总裁',
    adjustType: 2,
    channelId: '2',
  })
})

test('/houseManage/logs/status exposes missing context and real request failures', async ({ page }) => {
  let requestCount = 0

  await page.route('https://hudson-prod.localhome.cn/roomStatusOperationLog/page/get/v2', async (route) => {
    requestCount += 1
    await route.abort('failed')
  })

  await page.goto(appUrl('/houseManage/logs/status'))
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('alert')).toContainText('缺少门店上下文 campId')
  expect(requestCount).toBe(0)

  await page.goto(appUrl('/houseManage/logs/status?campId=1796067693589061634'))
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('alert')).toContainText('真实接口请求失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  expect(requestCount).toBe(1)
})
