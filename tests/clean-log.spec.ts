import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL
const artifactRoot = path.resolve(
  __dirname,
  '../artifacts/screenshots/fangtai--baojie-guanli--baojie-rizhi',
)

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

const cleanLogEndpoint = 'https://hudson-prod.localhome.cn/cleanLog/page/get'

function emptyCleanLogResponse() {
  return {
    success: true,
    errorCode: null,
    errorMsg: null,
    errorDetail: null,
    data: {
      total: 0,
      size: 10,
      current: 1,
      extraInfo: null,
      pageNum: 1,
      hasNextPage: false,
      pages: 0,
      list: [],
    },
  }
}

test('/cleanManage/cleanLog renders the captured empty log table state', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = []
  await page.route(cleanLogEndpoint, async (route) => {
    requests.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({ json: emptyCleanLogResponse() })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanLog?campId=1796067693589061634'))

  await expect(page.locator('.page-header')).toBeHidden()
  await expect.poll(() => requests.length).toBe(1)
  expect(requests[0]).toMatchObject({
    campId: '1796067693589061634',
    pageNum: 1,
    pageSize: 10,
  })
  await expect(page.getByRole('button', { name: '全部门店' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '请选择房间' })).toBeVisible()
  await expect(page.getByRole('group', { name: '操作日期' })).toBeVisible()
  await expect(page.getByLabel('操作日期开始')).toHaveAttribute('placeholder', '开始日期')
  await expect(page.getByLabel('操作日期结束')).toHaveAttribute('placeholder', '结束日期')
  await expect(page.getByRole('button', { name: '请选择操作人' })).toBeVisible()
  await expect(page.getByRole('button', { name: '搜 索' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByLabel('保洁日志列表').locator('.clean-log-table__head > div')).toHaveText([
    '操作时间',
    '操作人',
    '操作类型',
    '操作内容',
  ])
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toHaveCount(0)

  await page.screenshot({
    path: path.join(artifactRoot, 'default-clone-route.png'),
    fullPage: true,
  })
})

test('/cleanManage/cleanLog keeps captured filters interactive without fabricating rows', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = []
  await page.route(cleanLogEndpoint, async (route) => {
    requests.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({ json: emptyCleanLogResponse() })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanLog?campId=1796067693589061634'))

  await page.getByRole('button', { name: '请选择房间' }).click()
  await expect(page.getByRole('dialog', { name: '选择房间' })).toContainText('请选择房型标签')
  await expect(page.getByPlaceholder('输入房间/房型名称')).toBeVisible()
  await expect(page.getByRole('dialog', { name: '选择房间' })).toContainText('观影大床房')
  await expect(page.getByRole('dialog', { name: '选择房间' })).toContainText('房间1（净）')
  await expect(page.getByRole('dialog', { name: '选择房间' })).toContainText('房间1（脏）')
  await page.getByRole('option', { name: '观影大床房 房间1（脏）' }).click()
  await page.getByRole('button', { name: '确 定' }).click()
  await expect(page.getByRole('button', { name: '观影大床房 房间1' })).toBeVisible()

  await page.getByLabel('操作日期开始').click()
  await expect(page.getByRole('dialog', { name: '操作日期选择' })).toContainText('2026年5月')
  await expect(page.getByRole('dialog', { name: '操作日期选择' })).toContainText('2026年6月')

  await page.getByRole('button', { name: '请选择操作人' }).click()
  await expect(page.getByRole('listbox', { name: '操作人筛选' })).toContainText('路客云6TS5')
  await page.getByRole('option', { name: '路客云6TS5' }).click()
  await expect(page.getByRole('button', { name: '路客云6TS5' })).toBeVisible()

  await page.getByLabel('操作日期开始').fill('2026-05-13')
  await page.getByLabel('操作日期结束').fill('2026-05-13')
  await page.getByRole('button', { name: '搜 索' }).click()
  await expect.poll(() => requests.length).toBe(2)
  expect(requests[1]).toMatchObject({
    campId: '1796067693589061634',
    pageNum: 1,
    pageSize: 10,
    roomId: ['room-observation-1'],
    operatorId: '1796067693261905922',
    operatorStartTime: expect.any(Number),
    operatorEndTime: expect.any(Number),
  })
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.getByText('CL20260513001')).toHaveCount(0)

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '请选择房间' })).toBeVisible()
  await expect(page.getByRole('button', { name: '请选择操作人' })).toBeVisible()
  await expect(page.getByLabel('操作日期开始')).toHaveValue('')
  await expect(page.getByLabel('操作日期结束')).toHaveValue('')
  await expect(page.getByText('暂无数据')).toBeVisible()
})

test('/cleanManage/cleanLog exposes real request failures with retry', async ({ page }) => {
  let requestCount = 0
  await page.route(cleanLogEndpoint, async (route) => {
    requestCount += 1
    if (requestCount === 1) {
      await route.fulfill({ status: 503, json: { success: false, errorMsg: '服务暂不可用' } })
      return
    }
    await route.fulfill({ json: emptyCleanLogResponse() })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanLog?campId=1796067693589061634'))

  await expect(page.getByRole('alert')).toContainText('真实接口请求失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await page.getByRole('button', { name: '重试' }).click()
  await expect.poll(() => requestCount).toBe(2)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText('暂无数据')).toBeVisible()
})
