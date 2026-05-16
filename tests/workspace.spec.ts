import { expect, test, type Page } from '@playwright/test'

const HUDSON_API = 'https://hudson-prod.localhome.cn'

const workspaceApiCalls: Array<{ url: string; body: Record<string, unknown> }> = []

async function mockWorkspaceApis(page: Page) {
  workspaceApiCalls.length = 0
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsCampId', '1796067693589061634')
  })

  await page.route(`${HUDSON_API}/**`, async (route) => {
    const request = route.request()
    const url = request.url()
    let body: Record<string, unknown>
    try {
      body = request.postDataJSON() as Record<string, unknown>
    } catch {
      body = {}
    }
    workspaceApiCalls.push({ url, body })

    if (url.endsWith('/report/homePage/v2')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            nowPredictCheckIn: 2,
            nowAlreadyCheckIn: 2,
            nowPredictCheckOut: 2,
            nowOnSaleNum: 3,
            userBusyRepairNum: 0,
            dirtyNum: 1,
            exceptionOrderNum: 920,
            nowIncome: 57137,
          },
        }),
      })
      return
    }

    if (url.endsWith('/report/accommodation/management/analysis/get')) {
      const startDate = String(body.startDate ?? '')
      const isMonth = startDate === '2026-05-01'
      const isLastWeek = startDate === '2026-05-04'
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            businessIncome: isMonth ? 9789.55 : 330.72,
            roomFeePriceIncludingCommission: isMonth ? 9789.55 : 330.72,
            otherOrderExpense: 0,
            writeDownIncome: 0,
            occ: isMonth ? 54.69 : 50,
            adr: isMonth ? 279.7 : 165.36,
            revPar: isMonth ? 152.97 : 82.68,
            openRoomCount: isMonth ? 35 : 2,
            roomCount: isMonth ? 64 : 4,
            allDayOpenRoomCount: isMonth ? 35 : 2,
            hourOpenRoomCount: 0,
            growthTrendAnalysisList: (isLastWeek
              ? ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10']
              : ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16', '2026-05-16']
            ).map((date, index) => ({
              date,
              businessIncome: 100 + index * 25,
              occ: 0.5,
              adr: 165.36,
              revPar: 82.68,
              openRoomCount: 2,
            })),
            orderOriginAnalysisList: [
              { channelName: '携程', orderCount: 1 },
              { channelName: '美团酒店', orderCount: 1 },
              { channelName: '飞猪淘酒店', orderCount: 1 },
            ],
          },
        }),
      })
      return
    }

    if (url.endsWith('/orders/get')) {
      const orderType = String(body.orderType ?? '11')
      const keyword = String(body.keyword ?? '')
      const list =
        orderType === '11' && keyword !== '无结果'
          ? [
              {
                channelName: '飞猪淘酒店',
                guestName: '黄国辉',
                guestMobile: '+8617328513805',
                roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
                roomName: null,
                startTime: 1778914800000,
                endTime: 1779508800000,
                dayNum: 7,
                orderDetailDisplayStateName: '待入住',
              },
              {
                channelName: '携程',
                guestName: '闵尊海',
                guestMobile: '-',
                roomCategoryName: '天落大床电竞套间',
                roomName: '1',
                startTime: 1778914800000,
                endTime: 1779001200000,
                dayNum: 1,
                orderDetailDisplayStateName: '待入住',
              },
            ]
          : []
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { total: list.length, list } }),
      })
      return
    }

    if (url.endsWith('/memo/page/get')) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: { total: 0, list: [] } }) })
      return
    }

    if (url.endsWith('/backlogs/get')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              content: JSON.stringify({ title: '绑定微信账号', sub_title: '实时接获预定消息', button: '立即绑定' }),
            },
            {
              content: JSON.stringify({ title: '上个月报表已生成', sub_title: '来看看上个月的表现如何？', button: '查看' }),
            },
          ],
        }),
      })
      return
    }

    if (url.endsWith('/campFlow/get')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            isOpenFlow: 1,
            channelInfos: [
              { channelName: '路客云聚合', isApplyOpen: 1 },
              { channelName: '飞猪酒店直连', isApplyOpen: 1 },
            ],
          },
        }),
      })
      return
    }

    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
  })
}

test.describe('workspace page clone', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockWorkspaceApis(page)
    await page.goto('/workspace')
  })

  test('loads captured target data through real endpoint contracts', async ({ page }) => {
    await expect(page.locator('.page-content:has(.workspace-home) .page-header')).toBeHidden()

    await expect(page.getByTestId('workspace-metric-arrivals')).toContainText('预抵')
    await expect(page.getByTestId('workspace-metric-arrivals')).toContainText('2')
    await expect(page.getByTestId('workspace-metric-staying')).toContainText('在住')
    await expect(page.getByTestId('workspace-metric-staying')).toContainText('2')
    await expect(page.getByTestId('workspace-metric-revenue')).toContainText('￥571.37')
    expect(workspaceApiCalls.some((call) => call.url.endsWith('/report/homePage/v2'))).toBe(true)
    expect(workspaceApiCalls.some((call) => call.url.endsWith('/orders/get') && call.body.orderType === '11')).toBe(true)

    await expect(page.getByText('交接班')).toBeVisible()
    await expect(page.getByText('夜审', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '立即开启夜审' })).toBeVisible()
    await expect(page.getByText('房情表')).toBeVisible()
    await expect(page.getByText('收入报表')).toBeVisible()
    await expect(page.getByText('利润报表')).toBeVisible()

    await expect(page.getByTestId('workspace-order-row')).toHaveCount(2)
    await expect(page.getByText('黄国辉')).toBeVisible()
    await expect(page.getByText('闵尊海')).toBeVisible()

    await expect(page.getByText('门店流量获取能力')).toBeVisible()
    await expect(page.getByText('一键上渠道')).toBeVisible()
    await expect(page.getByText('OTA流量')).toBeVisible()
    await expect(page.getByText('社媒流量')).toBeVisible()
    await expect(page.getByText('私域流量')).toBeVisible()
  })

  test('supports captured workspace interactions', async ({ page }) => {
    await expect(page.getByTestId('workspace-revenue-card')).toContainText('￥330.72')
    await page.getByRole('button', { name: '本月' }).first().click()
    await expect(page.getByTestId('workspace-revenue-card')).toContainText('￥9789.55')
    await expect(page.getByTestId('workspace-occ-card')).toContainText('54.69%')

    await page.getByRole('button', { name: '上周' }).click()
    await expect(page.getByTestId('workspace-chart-dates')).toContainText('05/04')
    await expect(page.getByTestId('workspace-chart-dates')).toContainText('05/10')

    await page.getByRole('button', { name: '产品动态' }).click()
    await expect(page.getByTestId('workspace-todo-panel')).toContainText('绑定微信账号')

    await page.getByTestId('workspace-metric-staying').click()
    await expect(page).toHaveURL(/\/statistics\/roomSituation$/)
  })

  test('exposes API failures with retry instead of silent fallback', async ({ page }) => {
    await page.unroute(`${HUDSON_API}/**`)
    await page.route(`${HUDSON_API}/**`, async (route) => {
      if (route.request().url().endsWith('/report/homePage/v2')) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, errorMsg: 'server down' }) })
        return
      }

      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: { list: [] } }) })
    })

    await page.goto('/workspace')
    await expect(page.getByRole('alert')).toContainText('首页数据请求失败')
    await expect(page.getByRole('button', { name: '重试' })).toBeVisible()

    const topStripBox = await page.locator('.workspace-top-strip').boundingBox()
    const revenueBox = await page.locator('.workspace-revenue').boundingBox()
    expect(topStripBox?.y).toBeLessThan(revenueBox?.y ?? 0)
  })

  test('does not show a technical campId banner on the visual workspace shell', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem('pmsCampId'))
    await page.goto('/workspace')

    await expect(page.getByText('首页数据请求失败：缺少 campId')).toHaveCount(0)
    const topStripBox = await page.locator('.workspace-top-strip').boundingBox()
    const revenueBox = await page.locator('.workspace-revenue').boundingBox()
    expect(topStripBox?.y).toBeLessThan(revenueBox?.y ?? 0)
  })

  test('gives feedback for visible workspace action buttons', async ({ page }) => {
    await page.getByRole('button', { name: '立即开启夜审' }).click()
    await expect(page.getByRole('status')).toContainText('夜审接口未接入')

    await page.getByRole('button', { name: '排' }).first().click()
    await expect(page.getByRole('status')).toContainText('排房入口')

    await page.getByRole('button', { name: '住客资料' }).first().click()
    await expect(page.getByRole('status')).toContainText('住客资料')

    await page.getByRole('button', { name: '看' }).first().click()
    await expect(page.getByRole('dialog', { name: '订单详情' })).toContainText('黄国辉')
    await page.getByRole('button', { name: '关闭订单详情' }).click()

    await page.getByRole('button', { name: '提交' }).click()
    await expect(page.getByRole('status')).toContainText('请输入新的备忘录')

    await page.getByRole('button', { name: '一键上渠道' }).click()
    await expect(page).toHaveURL(/\/channels\/ota$/)
  })

  test('navigates from workspace detail links to report and orders pages', async ({ page }) => {
    await page.getByRole('link', { name: '查看详情' }).first().click()
    await expect(page).toHaveURL(/\/statistics\/report$/)
    await expect(page.getByRole('link', { name: '统计概览' })).toHaveClass(/is-active/)

    await page.goto('/workspace')
    await page.getByRole('link', { name: '查看全部订单' }).click()
    await expect(page).toHaveURL(/\/order\/house-order\/list$/)
    await expect(page.getByRole('link', { name: '住宿订单' })).toHaveClass(/is-active/)
  })

  test('matches target topbar action toolbar and dropdown interactions', async ({ page }) => {
    const toolbar = page.getByLabel('顶部工具栏')
    const topbarBox = await page.locator('.topbar').boundingBox()
    const toolbarBox = await page.locator('.topbar-actions').boundingBox()

    expect(topbarBox?.height).toBe(52)
    expect(toolbarBox?.x).toBeCloseTo(1118, 0)
    expect(Math.abs((toolbarBox?.y ?? 0) - 10)).toBeLessThanOrEqual(1)
    expect(toolbarBox?.width).toBe(314)
    expect(toolbarBox?.height).toBe(32)

    await expect(toolbar.getByRole('link', { name: '应用订阅' })).toBeVisible()
    await expect(toolbar.getByText('限时试用')).toBeVisible()
    await expect(toolbar.getByRole('button', { name: '消息' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: '收款' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: '接待' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: '门锁' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: '客服' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: '通知' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: '用户菜单' })).toBeVisible()

    await toolbar.getByRole('button', { name: '消息' }).click()
    await expect(page.locator('.chat-dock')).toBeVisible()

    await toolbar.getByRole('button', { name: '收款' }).click()
    await expect(page.getByRole('dialog', { name: '收款' })).toContainText('收款方式')
    await page.getByRole('button', { name: '关闭收款' }).click()

    await toolbar.getByRole('button', { name: '客服' }).click()
    await expect(page.getByRole('dialog', { name: '路客云AI客服' })).toContainText('如何调整房价?')
    await page.getByRole('button', { name: '关闭客服' }).click()

    await toolbar.getByRole('button', { name: '用户菜单' }).click()
    await expect(page.getByRole('dialog', { name: '用户菜单面板' })).toContainText('路客云 6TS5 的店铺')
    await expect(page.getByRole('dialog', { name: '用户菜单面板' }).getByRole('link', { name: '门店信息' })).toBeVisible()

    await toolbar.getByRole('button', { name: '接待' }).click()
    await expect(page).toHaveURL(/\/statistics\/shift\/record$/)

    await page.goto('/workspace')
    await page.getByLabel('顶部工具栏').getByRole('button', { name: '门锁' }).click()
    await expect(page).toHaveURL(/\/smartHotel\/smartHardware\/smartLook$/)

    await page.goto('/workspace')
    await page.getByLabel('顶部工具栏').getByRole('button', { name: '通知' }).click()
    await expect(page).toHaveURL(/\/setting\/notification$/)

    await page.goto('/workspace')
    await toolbar.getByRole('link', { name: '应用订阅' }).click()
    await expect(page).toHaveURL(/\/version\/applicationPayment$/)
  })

  test('aligns dashboard panels by grid rows', async ({ page }) => {
    const tolerance = 2

    async function getBox(selector: string) {
      const box = await page.locator(selector).boundingBox()
      expect(box, selector).not.toBeNull()
      return box!
    }

    async function expectSameRow(selectors: string[]) {
      const boxes = await Promise.all(selectors.map(getBox))
      const tops = boxes.map((box) => box.y)
      const bottoms = boxes.map((box) => box.y + box.height)

      expect(Math.max(...tops) - Math.min(...tops), selectors.join(', ')).toBeLessThanOrEqual(tolerance)
      expect(Math.max(...bottoms) - Math.min(...bottoms), selectors.join(', ')).toBeLessThanOrEqual(tolerance)
    }

    await expect(page.locator('.metrics-strip .metric-card')).toHaveCount(4)
    await expect(page.locator('.workspace-stat-group--housekeeping .metric-card')).toHaveCount(2)
    await expect(page.locator('.workspace-quick-strip .workspace-quick-card--report')).toHaveCount(3)

    await expectSameRow([
      '.metrics-strip',
      '.workspace-stat-group--housekeeping',
      '.workspace-stat-group--exception',
      '.workspace-stat-group--revenue',
      '.workspace-quick-card--shift',
      '.workspace-quick-card--night',
      '.workspace-quick-strip',
    ])
    await expectSameRow(['.workspace-revenue', '.chart-panel', '.memo-panel'])
    await expectSameRow(['.workspace-orders-panel', '[data-testid="workspace-todo-panel"]', '.workspace-traffic-panel'])

    const reportGroup = await getBox('.workspace-quick-strip')
    const memoPanel = await getBox('.memo-panel')
    const trafficPanel = await getBox('.workspace-traffic-panel')
    expect(Math.abs(reportGroup.x - memoPanel.x)).toBeLessThanOrEqual(tolerance)
    expect(Math.abs(reportGroup.width - memoPanel.width)).toBeLessThanOrEqual(tolerance)
    expect(Math.abs(reportGroup.x - trafficPanel.x)).toBeLessThanOrEqual(tolerance)
    expect(Math.abs(reportGroup.width - trafficPanel.width)).toBeLessThanOrEqual(tolerance)
  })

  test('uses the shared conversation dock on the workspace page', async ({ page }) => {
    await expect(page.locator('.workspace-chat-fab')).toHaveCount(0)
    await expect(page.locator('.chat-dock')).toHaveCount(1)
    await expect(page.locator('.chat-dock')).toBeVisible()
    await expect(page.locator('.chat-dock .chat-item')).toHaveCount(4)

    await page.locator('.chat-dock__collapse').click()
    await expect(page.locator('.chat-dock')).toHaveCount(0)
    await expect(page.locator('.chat-dock-launcher')).toBeVisible()

    await page.locator('.chat-dock-launcher').click()
    await expect(page.locator('.chat-dock')).toBeVisible()
    await expect(page.locator('.chat-dock .chat-item')).toHaveCount(4)
  })
})
