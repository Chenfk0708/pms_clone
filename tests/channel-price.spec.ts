import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const channelPriceEndpoint = '**/roomCategoryStatuses/roomCategory/channel/get'

function successfulChannelPricePayload(rows = defaultRows()) {
  return {
    success: true,
    errorCode: null,
    errorMsg: null,
    data: { rows },
  }
}

function defaultRows() {
  return [
    {
      channel: '渠道房型A',
      coefficient: '*0.88',
      basePrice: '399',
      product: '渠道产品A<无早>',
      prices: ['321', '322', '323'],
      comparePrices: ['399', '399', '399'],
    },
  ]
}

async function mockChannelPrice(page, payload = successfulChannelPricePayload()) {
  const bodies: unknown[] = []

  await page.route(channelPriceEndpoint, async (route) => {
    bodies.push(JSON.parse(route.request().postData() ?? '{}'))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })

  return bodies
}

test('/houseManage/channelPrice uses explicit mock provider by default', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  let realRequestCount = 0
  await page.route(channelPriceEndpoint, async (route) => {
    realRequestCount += 1
    await route.abort()
  })

  await page.goto('/houseManage/channelPrice?campId=test-camp')

  await expect(page.getByText('模拟渠道RP价房型A')).toBeVisible()
  await expect(page.getByText('模拟渠道RP价产品A<无早>')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/mock|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/)
  expect(realRequestCount).toBe(0)
})

test('/houseManage/channelPrice mock provider consumes filter params and refreshes UI', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  let realRequestCount = 0
  await page.route(channelPriceEndpoint, async (route) => {
    realRequestCount += 1
    await route.abort()
  })

  await page.goto('/houseManage/channelPrice?campId=test-camp')
  await page.getByRole('button', { name: '渠道', exact: true }).click()
  await page.getByRole('option', { name: '携程' }).click()

  await expect(page.getByText('携程渠道产品A<无早>')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/mock|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/)
  expect(realRequestCount).toBe(0)
})

test('/houseManage/channelPrice exposes mock empty and failure states as business copy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.evaluate(() => window.localStorage.setItem('pms.channelPriceMockMode', 'empty'))
  await page.goto('/houseManage/channelPrice?campId=test-camp')

  await expect(page.getByRole('status', { name: '渠道RP价空态' })).toContainText('暂无符合当前筛选条件的渠道RP价数据')
  await expect(page.locator('body')).not.toContainText(/mock|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/)

  await page.evaluate(() => window.localStorage.setItem('pms.channelPriceMockMode', 'error'))
  await page.goto('/houseManage/channelPrice?campId=test-camp')

  await expect(page.getByRole('alert')).toContainText('渠道价格加载失败')
  await expect(page.getByRole('alert')).toContainText('渠道RP价服务暂不可用，请稍后重试')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/mock|mock provider|未接入|阻塞|后端未就绪|后端接口未完成/)
})

test('/houseManage/channelPrice renders channel RP price grid', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const requestBodies = await mockChannelPrice(page)
  await page.goto('/houseManage/channelPrice?campId=test-camp&channelPriceProvider=real')

  await expect(page.locator('.price-tabs button.is-active')).toContainText('渠道RP价')
  await expect(page.getByText('渠道rp价与房型价格存在差异')).toBeVisible()
  await expect(page.getByRole('button', { name: '预览与覆盖' })).toBeVisible()
  await expect(page.getByRole('button', { name: '暂不处理' })).toBeVisible()
  await expect(page.getByText('当前通过')).toBeVisible()
  await expect(page.getByText('实际卖价')).toBeVisible()
  await expect(page.getByText('RP设置')).toBeVisible()
  await expect(page.getByRole('button', { name: '价格规划' })).toBeVisible()
  await expect(page.getByText('产品系数')).toBeVisible()
  await expect(page.getByText('渠道房型A')).toBeVisible()
  await expect(page.getByText('渠道产品A<无早>')).toBeVisible()
  await expect(page.getByRole('button', { name: /321 \d{2}\.\d{2}/ }).first()).toBeVisible()
  expect(requestBodies[0]).toMatchObject({
    campId: 'test-camp',
    pageNum: 1,
    pageSize: 15,
    isFinalChannelRp: 1,
  })

  await page.screenshot({
    path: path.resolve(
      __dirname,
      '../artifacts/screenshots/fangtai--fangjia-guanli--jvdao-prjia/default-clone-route.png',
    ),
    fullPage: true,
  })
})

test('/houseManage/channelPrice supports key channel price interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const requestBodies = await mockChannelPrice(page)
  await page.goto('/houseManage/channelPrice?campId=test-camp&channelPriceProvider=real')

  await page.getByRole('button', { name: '渠道', exact: true }).click()
  await expect(page.getByRole('listbox', { name: '渠道筛选' })).toBeVisible()
  await expect(page.getByRole('option', { name: '携程' })).toBeVisible()
  await page.getByRole('option', { name: '携程' }).click()
  await expect(page.getByRole('button', { name: '携程' })).toBeVisible()
  await expect
    .poll(() => requestBodies.length, { message: '渠道筛选应触发真实价格接口刷新' })
    .toBeGreaterThanOrEqual(2)
  expect(requestBodies.at(-1)).toMatchObject({
    campId: 'test-camp',
    channelIds: ['携程'],
    isFinalChannelRp: 1,
  })

  await page.getByRole('button', { name: 'RP设置' }).click()
  await expect(page).toHaveURL(/\/setting\/localRoomTypeProductionSetting$/)
  await expect(page.getByRole('heading', { name: '日历房', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '新增售卖产品' })).toBeVisible()
  await page.goto('/houseManage/channelPrice?campId=test-camp&channelPriceProvider=real')

  await page.getByRole('button', { name: '价格设置' }).click()
  await expect(page.getByRole('dialog', { name: '价格设置' })).toBeVisible()
  await expect(page.getByText('更新价格设置')).toBeVisible()
  await expect(page.getByText('切换为划线价')).toBeVisible()
  await expect(page.getByText('途家(EHPq0597)')).toBeVisible()
  await page.getByLabel('关闭价格设置').click()

  await page.getByRole('button', { name: '价格规划' }).click()
  await expect(page.getByRole('dialog', { name: '价格规划' })).toBeVisible()
  await expect(page.getByRole('button', { name: '+新增规划' })).toBeVisible()
  await expect(page.getByText('平日价')).toBeVisible()
  await expect(page.getByText('周末价(五/六)')).toBeVisible()
  await page.getByLabel('关闭价格规划').click()

  await page.getByRole('button', { name: '批量改价' }).click()
  await expect(page.getByRole('dialog', { name: '批量修改' })).toBeVisible()
  await expect(page.getByText('修改类型')).toBeVisible()
  await expect(page.getByText('产品系数')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加产品' })).toBeVisible()
  await expect(page.getByText('多段模式')).toBeVisible()
  await expect(page.getByText('绝对值改价')).toBeVisible()
  await page.getByLabel('关闭批量修改').click()

  await page.getByRole('button', { name: /321 \d{2}\.\d{2}/ }).first().click()
  await expect(page.getByRole('dialog', { name: '改价' })).toBeVisible()
  await expect(page.getByText('已选1项')).toBeVisible()
  await expect(page.getByText('百分比改价')).toBeVisible()
  await page.getByLabel('关闭改价').click()

  await page.getByRole('button', { name: '全部收起' }).click()
  await expect(page.getByText('渠道产品A<无早>')).toBeHidden()
  await page.getByRole('button', { name: '全部展开' }).click()
  await expect(page.getByText('渠道产品A<无早>')).toBeVisible()
})

test('/houseManage/channelPrice supports target alert and guide flows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockChannelPrice(page)
  await page.goto('/houseManage/channelPrice?campId=test-camp&channelPriceProvider=real')

  await page.getByRole('button', { name: '预览与覆盖' }).click()
  await expect(page.getByRole('dialog', { name: '房价修改预览' })).toBeVisible()
  await expect(page.getByRole('button', { name: '一键覆盖' })).toBeVisible()
  await expect(page.getByText('730').first()).toBeVisible()
  await page.getByLabel('关闭房价修改预览').click()

  await page.getByRole('button', { name: '暂不处理' }).click()
  await expect(page.getByRole('dialog', { name: '确认不覆盖渠道价格' })).toBeVisible()
  await expect(page.getByText('是否确认不使用中央价覆盖渠道房型价格？')).toBeVisible()
  await page.getByRole('button', { name: '取消' }).click()

  await page.getByRole('button', { name: '新手指引' }).click()
  await expect(page.getByRole('dialog', { name: '新手指引' })).toBeVisible()
  await expect(page.getByText('1/5')).toBeVisible()
  await expect(page.getByText('此处可设置渠道实际卖价和划线价的关系')).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByText('2/5')).toBeVisible()
})

test('/houseManage/channelPrice exposes real request errors without static fallback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route(channelPriceEndpoint, async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, errorMsg: '上游服务不可达' }),
    })
  })

  await page.goto('/houseManage/channelPrice?campId=test-camp&channelPriceProvider=real')

  await expect(page.getByRole('alert')).toContainText('渠道价格加载失败')
  await expect(page.getByRole('alert')).toContainText('上游服务不可达')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await expect(page.getByText('顶层套房（浴缸巨幕电竞麻将）')).toHaveCount(0)
})

test('/houseManage/channelPrice exposes empty data from real request', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockChannelPrice(page, successfulChannelPricePayload([]))

  await page.goto('/houseManage/channelPrice?campId=test-camp&channelPriceProvider=real')

  await expect(page.getByRole('status', { name: '渠道RP价空态' })).toContainText('暂无符合当前筛选条件的渠道RP价数据')
  await expect(page.getByText('顶层套房（浴缸巨幕电竞麻将）')).toHaveCount(0)
})

test('/houseManage/channelPrice supports direct entry without camp context', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.evaluate(() => window.localStorage.removeItem('pms.channelPriceMockMode'))
  await page.goto('/houseManage/channelPrice')

  await expect(page.getByText('模拟渠道RP价房型A')).toBeVisible()
  await expect(page.getByText('缺少门店上下文')).toHaveCount(0)
})
