import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test('/houseManage/logs/price sends captured real context requests and exposes empty list blocker', async ({ page }) => {
  let channelBody: Record<string, unknown> | undefined
  let roomBody: Record<string, unknown> | undefined

  await page.route('https://hudson-prod.localhome.cn/channels/get', async (route) => {
    channelBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        errorCode: null,
        errorMsg: null,
        data: {
          channels: [
            { channelId: '6', channelName: '飞猪淘酒店' },
            { channelId: '7', channelName: '路客云聚合' },
          ],
        },
      }),
    })
  })

  await page.route('https://hudson-prod.localhome.cn/roomCategories/page/get', async (route) => {
    roomBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        errorCode: null,
        errorMsg: null,
        data: {
          total: 1,
          list: [{ roomCategoryId: 'room-001', roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）' }],
        },
      }),
    })
  })

  await page.goto(appUrl('/houseManage/logs/price?campId=1796067693589061634'))
  await page.getByLabel('日志关键词').fill('总裁')
  await page.getByRole('button', { name: '查 询' }).click()

  await expect(page.getByRole('status')).toContainText('已完成真实取证请求')
  await expect(page.getByRole('status')).toContainText('目标站本次未触发调价日志列表接口')
  await expect(page.getByText('暂无数据')).toBeVisible()
  expect(channelBody).toMatchObject({ campId: '1796067693589061634', hasAllChannel: 1 })
  expect(roomBody).toMatchObject({
    campId: '1796067693589061634',
    pageSize: 999,
    pageNum: 1,
    roomCategoryName: '总裁',
    keyword: '总裁',
    cityIds: [],
    channelId: '',
  })
})

test('/houseManage/logs/price exposes missing context and real request failures', async ({ page }) => {
  let requestCount = 0

  await page.route('https://hudson-prod.localhome.cn/channels/get', async (route) => {
    requestCount += 1
    await route.abort('failed')
  })
  await page.route('https://hudson-prod.localhome.cn/roomCategories/page/get', async (route) => {
    requestCount += 1
    await route.abort('failed')
  })

  await page.goto(appUrl('/houseManage/logs/price'))
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('alert')).toContainText('缺少门店上下文 campId')
  expect(requestCount).toBe(0)

  await page.goto(appUrl('/houseManage/logs/price?campId=1796067693589061634'))
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('alert')).toContainText('真实接口请求失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  expect(requestCount).toBeGreaterThan(0)
})
