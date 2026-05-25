import { expect, test } from '@playwright/test'

const pagePath = '/#/psb/log?campId=1796067693589061634'
const appBaseURL = process.env.PMS_TEST_BASE_URL
const psbLogEndpoint = '**/checkinGuestPsbLog/page/get'
const storeEndpoint = '**/select/poi/page/get'
const forbiddenDevelopmentCopy = /mock|provider|后端|真实接口|接口契约|开发态/i

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

test.describe.configure({ timeout: 60_000 })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.psbLogProvider', 'mock')
    window.localStorage.removeItem('pms.psbLogMockState')
    window.localStorage.removeItem('pms.psbLog.lastRequest')
    window.localStorage.removeItem('pms.psbLog.lastExportRequest')
  })
})

test('/psb/log renders provider-backed business data without calling Hudson by default', async ({ page }) => {
  const requestedUrls: string[] = []

  await page.route(psbLogEndpoint, async (route) => {
    requestedUrls.push(route.request().url())
    await route.fulfill({
      status: 500,
      json: { success: false, errorMsg: 'default mock provider must not call real backend' },
    })
  })
  await page.route(storeEndpoint, async (route) => {
    requestedUrls.push(route.request().url())
    await route.fulfill({
      status: 500,
      json: { success: false, errorMsg: 'default mock provider must not call real backend stores' },
    })
  })

  await page.goto(appUrl(pagePath))

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.sidebar-link.is-active').filter({ hasText: '上报日志' })).toBeVisible()
  await expect(page.locator('.sidebar-link').filter({ hasText: 'PSB公安对接' })).toBeVisible()
  await expect(page.locator('.psb-log-page')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.psb-log-page')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.psb-log-page')).toHaveAttribute('data-view-state', 'success')

  const storeScope = page.getByRole('radiogroup', { name: '门店范围' })
  await expect(storeScope.getByRole('radio', { name: '全部门店' })).toBeChecked()
  await expect(storeScope.getByRole('radio', { name: /天蓉名宿公寓/ })).toBeVisible()
  await expect(page.getByLabel('搜索')).toHaveAttribute('placeholder', '请输入订单号/手机号/房号')
  await expect(page.getByRole('button', { name: '上报类型： 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上报状态： 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上报时间 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查 询' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()

  await expect(page.getByLabel('上报日志列表').locator('.psb-log-table__head > div')).toHaveText([
    '姓名',
    '手机号',
    '证件号码',
    '房间号',
    '订单来源',
    '订单号',
    '路客云订单号',
    '上报时间',
    '上报类型',
    '上报状态',
    '备注',
  ])

  await expect(page.getByRole('cell', { name: '刘诗雨' })).toBeVisible()
  await expect(page.getByRole('button', { name: '查看订单 2053550785075990529' })).toBeVisible()
  await expect(page.locator('.psb-log-page')).not.toContainText(forbiddenDevelopmentCopy)
  expect(requestedUrls).toEqual([])

  const diagnostics = await waitForDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'success',
    endpoint: '/psb/log/mock/page/get',
    request: {
      campId: '1796067693589061634',
      pageNum: 1,
      pageSize: 20,
      current: 1,
      psbType: ['4', '5'],
    },
  })
})

test('/psb/log maps filters into the unified request and closes the detail interaction loop', async ({ page }) => {
  await page.goto(appUrl(pagePath))

  const targetStore = page.locator('.psb-log-store').filter({ hasText: '天蓉名宿公寓(前海壹方城宝安中心店)' })
  await targetStore.click()
  await expect(targetStore).toHaveClass(/is-active/)

  await page.getByLabel('搜索').fill('2053550785075990529')

  await page.getByRole('button', { name: '上报类型： 请选择' }).click()
  await expect(page.getByRole('option', { name: '入住', exact: true })).toBeVisible()
  await expect(page.getByRole('option', { name: '续住', exact: true })).toBeVisible()
  await expect(page.getByRole('option', { name: '换房', exact: true })).toBeVisible()
  await expect(page.getByRole('option', { name: '退房', exact: true })).toBeVisible()
  await expect(page.getByRole('option', { name: '未知', exact: true })).toBeVisible()
  await expect(page.getByRole('option', { name: '删除入住登记', exact: true })).toBeVisible()
  await page.getByRole('option', { name: '退房', exact: true }).click()

  await page.getByRole('button', { name: '上报状态： 请选择' }).click()
  await expect(page.getByRole('option', { name: '失败', exact: true })).toBeVisible()
  await expect(page.getByRole('option', { name: '成功', exact: true })).toBeVisible()
  await page.getByRole('option', { name: '失败', exact: true }).click()

  await page.getByRole('button', { name: '上报时间 请选择' }).click()
  await expect(page.getByRole('dialog', { name: '上报时间' })).toBeVisible()
  await expect(page.getByText('2026年 5月')).toBeVisible()
  await expect(page.getByText('2026年 6月')).toBeVisible()
  await page.locator('.psb-log-calendar-month').first().getByRole('button', { name: '23' }).click()
  await expect(page.getByRole('button', { name: '上报时间 2026-05-23' })).toBeVisible()

  await page.getByRole('button', { name: '查 询' }).click()

  await expect(page.getByRole('status')).toContainText('暂无上报日志')

  const diagnostics = await waitForDiagnostics(page, (nextDiagnostics) =>
    Boolean(
      nextDiagnostics?.request?.poiId === '1796425098638573570' &&
        nextDiagnostics.request.keyword === '2053550785075990529' &&
        nextDiagnostics.request.bizType === '4' &&
        nextDiagnostics.request.state === '0',
    ),
  )
  expect(diagnostics.request).toMatchObject({
    campId: '1796067693589061634',
    poiId: '1796425098638573570',
    keyword: '2053550785075990529',
    bizType: '4',
    state: '0',
    pageNum: 1,
    pageSize: 20,
    current: 1,
    psbType: ['4', '5'],
  })

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByLabel('搜索')).toHaveValue('')
  await expect(page.getByRole('button', { name: '上报类型： 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上报状态： 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '上报时间 请选择' })).toBeVisible()

  await page.getByRole('button', { name: '查看订单 2053550785075990529' }).click()
  await expect(page.getByRole('dialog', { name: '上报详情' })).toContainText('公安回执')
  await expect(page.getByRole('dialog', { name: '上报详情' })).toContainText('失败')

  await page.getByRole('button', { name: '重新上报' }).click()
  await expect(page.getByRole('dialog', { name: '上报详情' })).toContainText('成功')
  await expect(page.getByRole('status')).toContainText('订单 2053550785075990529 已重新上报')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '上报详情' })).toHaveCount(0)
})

test('/psb/log exposes empty and retryable error states from the mock provider', async ({ page }) => {
  await page.goto(appUrl(`${pagePath}&mockState=empty`))

  await expect(page.locator('.psb-log-page')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.psb-log-page')).toHaveAttribute('data-view-state', 'empty')
  await expect(page.getByLabel('上报日志列表').getByText('暂无数据')).toBeVisible()

  let diagnostics = await waitForDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'empty',
    traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--shangbao-rizhi-empty-001',
  })

  await page.evaluate(() => {
    window.localStorage.setItem('pms.psbLogMockState', 'error')
  })
  await page.goto(appUrl(pagePath))

  await expect(page.locator('.psb-log-page')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.psb-log-page')).toHaveAttribute('data-view-state', 'error')
  await expect(page.getByRole('alert')).toContainText('上报日志加载失败，请稍后重试')

  await page.evaluate(() => {
    window.localStorage.setItem('pms.psbLogMockState', 'success')
  })
  await page.getByRole('button', { name: '重试' }).click()

  await expect(page.locator('.psb-log-page')).toHaveAttribute('data-view-state', 'success')
  await expect(page.getByRole('cell', { name: '刘诗雨' })).toBeVisible()
  diagnostics = await waitForDiagnostics(page, (nextDiagnostics) => nextDiagnostics?.state === 'success')
  expect(diagnostics).toMatchObject({
    provider: 'mock',
    state: 'success',
  })
})

test('/psb/log can switch to the captured api contract', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.psbLogProvider', 'api')
  })

  const capturedRequests: Array<Record<string, unknown>> = []

  await page.route(storeEndpoint, async (route) => {
    capturedRequests.push({
      url: route.request().url(),
      body: route.request().postDataJSON(),
    })
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
          total: 1,
          size: 999,
          current: 1,
          extraInfo: null,
          pageNum: 1,
          hasNextPage: false,
          pages: 1,
          list: [
            {
              poiId: '1796425098638573570',
              poiName: '天蓉名宿公寓(前海壹方城宝安中心店)',
            },
          ],
        },
      },
    })
  })

  await page.route(psbLogEndpoint, async (route) => {
    capturedRequests.push({
      url: route.request().url(),
      body: route.request().postDataJSON(),
    })
    await route.fulfill({
      json: {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
          total: 1,
          size: 20,
          current: 1,
          extraInfo: null,
          pageNum: 1,
          hasNextPage: false,
          pages: 1,
          list: [
            {
              name: '接口值班员',
              mobile: '13800138000',
              idCard: '440301199001011234',
              roomNo: 'A-1801',
              channelName: '携程',
              orderNo: 'api-order-001',
              channelOrderNo: 'ctrip-001',
              uploadTime: '2026-05-19 09:12:44',
              bizType: '1',
              state: '1',
              remark: '接口回放成功',
              poiId: '1796425098638573570',
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl(pagePath))

  await expect(page.locator('.psb-log-page')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.psb-log-page')).toHaveAttribute('data-provider', 'api')
  await expect(page.getByRole('cell', { name: '接口值班员' })).toBeVisible()
  expect(capturedRequests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        body: {
          campId: '1796067693589061634',
          pageSize: 999,
          pageNum: 1,
          channelId: 0,
          isAvailability: '1',
        },
      }),
      expect.objectContaining({
        body: {
          campId: '1796067693589061634',
          pageNum: 1,
          pageSize: 20,
          current: 1,
          psbType: ['4', '5'],
        },
      }),
    ]),
  )

  const diagnostics = await waitForDiagnostics(page)
  expect(diagnostics).toMatchObject({
    provider: 'api',
    endpoint: 'https://hudson-prod.localhome.cn/checkinGuestPsbLog/page/get',
  })
})

async function readDiagnostics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rawValue = window.localStorage.getItem('pms.psbLog.lastRequest')
    return rawValue ? JSON.parse(rawValue) : null
  })
}

async function waitForDiagnostics(
  page: import('@playwright/test').Page,
  predicate: (diagnostics: Awaited<ReturnType<typeof readDiagnostics>>) => boolean = Boolean,
) {
  await expect.poll(async () => predicate(await readDiagnostics(page))).toBe(true)
  return readDiagnostics(page)
}
