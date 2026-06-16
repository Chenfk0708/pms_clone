import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

const DAY_MS = 24 * 60 * 60 * 1000
const MONTH_WINDOW_START_OFFSET_DAYS = -3
const HUDSON_API = 'https://hudson-prod.localhome.cn'

function monthWindowDate(offsetFromWindowStart: number) {
  const today = new Date()
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return new Date(localMidnight.getTime() + (MONTH_WINDOW_START_OFFSET_DAYS + offsetFromWindowStart) * DAY_MS)
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function mockPriceBoardApis(page: Page) {
  const requests: Array<{ url: string; postData: unknown }> = []

  await page.route('https://hudson-prod.localhome.cn/camps/get', async (route) => {
    requests.push({ url: route.request().url(), postData: route.request().postDataJSON() })
    await route.fulfill({
      json: {
        success: true,
        data: {
          camps: [{ campId: 'camp-95', name: '95分门店' }],
        },
      },
    })
  })

  await page.route('https://hudson-prod.localhome.cn/edition/resource/get', async (route) => {
    requests.push({ url: route.request().url(), postData: route.request().postDataJSON() })
    await route.fulfill({
      json: {
        success: true,
        data: {
          editionId: '9',
          editionName: '畅享版',
          resourceGetViews: [{ resourceName: '电子房价牌', goodsType: 7 }],
        },
      },
    })
  })

  await page.route('https://hudson-prod.localhome.cn/weiRoomCategories/page/get', async (route) => {
    requests.push({ url: route.request().url(), postData: route.request().postDataJSON() })
    await route.fulfill({
      json: {
        success: true,
        data: {
          total: 1,
          pageNum: 1,
          hasNextPage: false,
          list: [
            {
              channelRoomCategoryName: '电子房价牌',
              description: '接口返回的电子房价牌介绍',
              lowestSellingPrice: 3000,
              lowestOriginalPrice: 15000,
              roomCategoryProductGetViews: [
                { roomCategoryProductId: 'pb-year', roomCategoryProductName: '一年', sellingPrice: 49900, originalPrice: 89900, stock: 99847 },
                { roomCategoryProductId: 'pb-two-year', roomCategoryProductName: '两年', sellingPrice: 99800, originalPrice: 179800, stock: 99986 },
              ],
            },
          ],
        },
      },
    })
  })

  await page.route('https://hudson-prod.localhome.cn/paymentTypes/get/v2', async (route) => {
    requests.push({ url: route.request().url(), postData: route.request().postDataJSON() })
    await route.fulfill({
      json: {
        success: true,
        data: {
          paymentGroups: [
            {
              groupType: 1,
              groupTypeName: '住宿',
              paymentTypes: [{ paymentTypeId: '1', paymentTypeName: '房费', isEnable: 1 }],
            },
          ],
        },
      },
    })
  })

  return requests
}

async function mockMonthStatusApis(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms.currentCampId', 'camp-interface')
  })

  const categories = [
    {
      roomCategoryId: 'cat-top',
      roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
      rooms: [{ roomId: 'room-top-1', roomName: '房间1' }],
    },
    {
      roomCategoryId: 'cat-president',
      roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
      rooms: [{ roomId: 'room-president-1', roomName: '房间1' }],
    },
    {
      roomCategoryId: 'cat-sky',
      roomCategoryName: '天落大床电竞套间',
      rooms: [{ roomId: 'room-sky-1', roomName: '房间1' }],
    },
    {
      roomCategoryId: 'cat-movie',
      roomCategoryName: '观影大床房',
      rooms: [{ roomId: 'room-movie-1', roomName: '房间1' }],
    },
  ]
  const orderRows = [
    {
      roomCategoryId: 'cat-president',
      roomId: 'room-president-1',
      date: formatIsoDate(monthWindowDate(6)),
      guestName: '陈家辉',
      channelName: '飞猪淘酒店',
      roomFee: 597.6,
      totalIncome: 664,
      stayRange: '2026.05.18-05.20',
      orderId: 'target-order',
    },
    {
      roomCategoryId: 'cat-president',
      roomId: 'room-president-1',
      date: formatIsoDate(monthWindowDate(3)),
      guestName: '刘翻红',
      channelName: '携程',
      roomFee: 285.44,
      totalIncome: 285.44,
      hasRemark: true,
    },
    {
      roomCategoryId: 'cat-movie',
      roomId: 'room-movie-1',
      date: formatIsoDate(monthWindowDate(5)),
      guestName: '张张',
      channelName: '携程',
      roomFee: 163.94,
      totalIncome: 163.94,
      hasRemark: true,
    },
  ]

  await page.route(`${HUDSON_API}/**`, async (route) => {
    const pathname = new URL(route.request().url()).pathname

    if (pathname === '/roomStatuses/rooms/get') {
      await route.fulfill({ json: { success: true, data: { isSingleInventory: 0, list: categories } } })
      return
    }

    if (pathname === '/roomStatuses/orderDetails/get') {
      await route.fulfill({ json: { success: true, data: { list: orderRows, orderArrangementInfos: [] } } })
      return
    }

    if (pathname === '/roomStatuses/dailyMonitor/get') {
      await route.fulfill({
        json: { success: true, data: { list: [{ date: formatIsoDate(monthWindowDate(3)), remain: '余1间' }] } },
      })
      return
    }

    if (pathname === '/roomStatuses/inv/get') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            list: categories.map((category) => ({
              roomCategoryId: category.roomCategoryId,
              date: formatIsoDate(monthWindowDate(3)),
              inventory: 1,
            })),
          },
        },
      })
      return
    }

    if (pathname.startsWith('/roomStatuses/')) {
      await route.fulfill({ json: { success: true, data: { list: [] } } })
      return
    }

    await route.fulfill({ json: { success: true, data: {} } })
  })
}

const pages = [
  {
    path: '/workspace',
    title: '首页工作台',
    screenshot: path.resolve(__dirname, '../../artifacts/screenshots/clone/workspace-clone-desktop.png'),
  },
  {
    path: '/houseManage/months',
    title: '月房态',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/clone/house-months-clone-desktop.png',
    ),
  },
  {
    path: '/houseManage/days',
    title: '日房态',
    screenshot: path.resolve(
      __dirname,
      '../artifacts/screenshots/fangtai--fangtai-guanli--rifangtai/day-status-clone-desktop.png',
    ),
  },
  {
    path: '/houseManage/logs/status',
    title: '房态日志',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/fangtai--fangtai-guanli--fangtai-rizhi/default-clone-route.png',
    ),
  },
  {
    path: '/cleanManage/cleanSetting',
    title: '保洁设置',
    contentText: '退房保洁自动派单',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/fangtai--baojie-guanli--baojie-shezhi/default-clone-route.png',
    ),
  },
  {
    path: '/cleanManage/cleanLog',
    title: '保洁日志',
    contentText: '操作时间',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/fangtai--baojie-guanli--baojie-rizhi/default-clone-route.png',
    ),
  },
  {
    path: '/order/house-order/list',
    title: '住宿订单',
    screenshot: path.resolve(
      __dirname,
      '../artifacts/screenshots/dingdan--zhusu-dingdan--zhusu-dingdan/default-clone-route.png',
    ),
  },
  {
    path: '/order/house-longRental-order/list',
    title: '长租订单',
    contentText: '合同期限',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/dingdan--zhusu-dingdan--changzu-dingdan/default-clone-route.png',
    ),
  },
  {
    path: '/mallManagement/orderManagement',
    title: '预售券订单',
    contentText: '导出明细',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/dingdan--yushouquan-dingdan--yushouquan-dingdan/default-clone-route.png',
    ),
  },
  {
    path: '/houseManage/houseCale',
    title: '中央价',
    screenshot: path.resolve(__dirname, '../../artifacts/screenshots/clone/price-clone-desktop.png'),
  },
  {
    path: '/houseManage/logs/price',
    title: '调价日志',
    contentText: '日志关键词',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/fangtai--fangjia-guanli--tiaojia-rizhi/default-clone-route.png',
    ),
  },
  {
    path: '/houseManage/priceBoard',
    title: '电子房价牌',
    contentText: '商品详情',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/fangtai--fangjia-guanli--dianzi-fangjiapai/default-clone-route.png',
    ),
  },
  {
    path: '/houseManage/priceComparison',
    title: '竞争圈比价',
    screenshot: path.resolve(
      __dirname,
      '../artifacts/screenshots/fangtai--fangjia-guanli--jingzhengquan-bijia/default-clone-route.png',
    ),
  },
  {
    path: '/houseManage/retailPrice',
    title: '门市价',
    contentText: '请先完成门市价设置',
    screenshot: path.resolve(
      __dirname,
      '../artifacts/screenshots/fangtai--fangjia-guanli--menshijia/default-clone-route.png',
    ),
  },
  {
    path: '/houseManage/otherPrice',
    title: '其他价格',
    contentText: '杂费设置',
    screenshot: path.resolve(
      __dirname,
      '../artifacts/screenshots/fangtai--fangjia-guanli--qita-jiage/default-clone-route.png',
    ),
  },
  {
    path: '/channels/ota',
    title: 'OTA',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/ota--ota--ota/default-clone-route.png',
    ),
  },
  {
    path: '/channels/ota/log',
    title: 'OTA',
    contentText: '操作内容',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/ota--ota--ota/log-clone-route.png',
    ),
  },
  {
    path: '/channels/social',
    title: '社媒',
    screenshot: path.resolve(__dirname, '../../artifacts/screenshots/clone/social-clone-desktop.png'),
  },
  {
    path: '/channels/private',
    title: '私域',
    contentText: '未直连渠道',
    screenshot: path.resolve(
      __dirname,
      '../artifacts/screenshots/ota--siyu--siyu-qudao/default-clone-route.png',
    ),
  },
  {
    path: '/channels/distribution/distributionSecond',
    title: '聚合分销',
    contentText: '分销列表',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/juhe-fenxiao--fenxiao--fenxiao-liebiao/default-clone-route.png',
    ),
  },
  {
    path: '/scrm/general',
    title: 'SCRM',
    screenshot: path.resolve(__dirname, '../../artifacts/screenshots/clone/scrm-clone-desktop.png'),
  },
  {
    path: '/channels/globalRadar/globalData',
    title: '全域数据',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju/default-clone-route.png',
    ),
  },
  {
    path: '/statistics/report',
    title: '统计总览',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/baobiao--tongji-baobiao--tongji-gailan/default-clone-route.png',
    ),
  },
  {
    path: '/statistics/roomSituation',
    title: '房情表',
    contentText: '单日房情表',
    screenshot: path.resolve(
      __dirname,
      '../artifacts/screenshots/fangtai--fangqingbiao--fangqingbiao/default-clone-route.png',
    ),
  },
  {
    path: '/cleanManage/cleanTask',
    title: '保洁任务',
    contentText: 'CT20260518001',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/fangtai--baojie-guanli--baojie-renwu/default-clone-route.png',
    ),
  },
  {
    path: '/cleanManage/cleanStatistics',
    title: '保洁统计',
    contentText: '统计汇总',
    screenshot: path.resolve(
      __dirname,
      '../../artifacts/screenshots/fangtai--baojie-guanli--baojie-tongji/default-clone-route.png',
    ),
  },
  {
    path: '/InformationMaintenance/informationOverview',
    title: '设置',
    screenshot: path.resolve(__dirname, '../../artifacts/screenshots/clone/information-overview-clone-desktop.png'),
  },
]

for (const pageDef of pages) {
  test(`${pageDef.path} renders`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    if (pageDef.path === '/houseManage/priceBoard') {
      await mockPriceBoardApis(page)
    }
    if (pageDef.path === '/houseManage/months') {
      await mockMonthStatusApis(page)
    }
    await page.goto(appUrl(pageDef.path))
    if (pageDef.path === '/workspace') {
      await expect(page.getByText('交接班')).toBeVisible()
      await expect(page.getByText('门店流量获取能力')).toBeVisible()
    } else if (pageDef.path === '/houseManage/logs/status') {
      await expect(page.locator('.page-header')).toBeHidden()
    } else if (pageDef.path === '/houseManage/houseCale') {
      await expect(page.locator('.page-header')).toBeHidden()
      await expect(page.locator('.price-tabs button.is-active')).toHaveText('中央价')
    } else if (pageDef.path === '/cleanManage/cleanSetting') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.clean-setting-page')).toBeVisible()
      await expect(page.getByRole('tab', { name: '基础设置' })).toHaveAttribute('aria-selected', 'true')
    } else if (pageDef.path === '/houseManage/logs/price') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.price-log-page')).toBeVisible()
      await expect(page.getByLabel('调价日志筛选')).toContainText('日志关键词')
    } else if (pageDef.path === '/houseManage/priceBoard') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.price-board-page')).toBeVisible()
      await expect(page.getByRole('heading', { name: '商品详情', level: 2 })).toBeVisible()
    } else if (pageDef.path === '/houseManage/priceComparison') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.price-comparison-page')).toBeVisible()
      await expect(page.getByRole('heading', { name: '竞争圈比价' })).toBeVisible()
    } else if (pageDef.path === '/houseManage/otherPrice') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.other-price-page')).toBeVisible()
      await expect(page.getByRole('tab', { name: '杂费设置' })).toHaveAttribute('aria-selected', 'true')
    } else if (pageDef.path === '/cleanManage/cleanLog') {
      await expect(page.locator('.page-header')).toBeHidden()
      await expect(page.locator('.clean-log-table')).toContainText('房间1 已完成保洁并标记为净房')
    } else if (pageDef.path === '/order/house-order/list') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.order-page')).toBeVisible()
      await expect(page.getByRole('status', { name: '住宿订单请求状态' })).toBeVisible()
      await expect(page.getByRole('status', { name: '住宿订单请求状态' })).toContainText('已通过住宿订单数据服务刷新')
      await expect(page.getByRole('table', { name: '住宿订单列表' }).getByRole('columnheader')).toHaveCount(24)
    } else if (pageDef.path === '/order/house-longRental-order/list') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.order-page--long-rental')).toBeVisible()
      await expect(page.getByRole('table', { name: '长租订单列表' })).toContainText('1871589898539520001')
    } else if (pageDef.path === '/channels/ota') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.getByRole('heading', { name: 'OTA', level: 1 })).toHaveCount(1)
      await expect(page.locator('.ota-channel-card--connected')).toHaveCount(8)
      await expect(page.getByTestId('ota-pending-card')).toHaveCount(8)
      await expect(page.getByText('路客云聚合')).toBeVisible()
      await expect(page.getByTestId('ota-luke-card')).not.toContainText('新增账号')
      await expect(page.getByRole('button', { name: '操作日志' })).toBeVisible()
    } else if (pageDef.path === '/channels/ota/log') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.getByText('OTA/')).toBeVisible()
      await expect(page.getByRole('table', { name: 'OTA操作日志列表' })).toContainText('关联渠道房型')
      await expect(page.getByRole('table', { name: 'OTA操作日志列表' })).toContainText('2025-10-03 21:49:53')
    } else if (pageDef.path === '/channels/private') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.getByRole('heading', { name: '未直连渠道', level: 2 })).toBeVisible()
    } else if (pageDef.path === '/channels/distribution/distributionSecond') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.getByRole('button', { name: '已分销' })).toHaveClass(/is-active/)
    } else if (pageDef.path === '/scrm/general') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.getByRole('link', { name: '客户概况' })).toHaveClass(/is-active/)
      await expect(page.getByRole('region', { name: '客户资产盘点' })).toContainText('588')
      await expect(page.getByRole('region', { name: '推荐场景' }).getByRole('article')).toHaveCount(4)
    } else if (pageDef.path === '/channels/globalRadar/globalData') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.getByRole('link', { name: '全域数据' })).toHaveClass(/is-active/)
      await expect(page.getByRole('heading', { name: '服务质量分', level: 2 })).toBeVisible()
      await expect(page.locator('.chat-dock-launcher')).toBeVisible()
    } else if (pageDef.path === '/statistics/report') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.getByRole('link', { name: '统计概览' })).toHaveClass(/is-active/)
      await expect(page.getByRole('button', { name: '统计总览' })).toHaveClass(/is-active/)
      await expect(page.getByRole('region', { name: '营收统计' })).toContainText('￥1,011')
      await expect(page.getByRole('region', { name: '经营指标' })).toContainText('入住率OCC')
    } else if (pageDef.path === '/houseManage/days') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.day-status-page')).toBeVisible()
    } else if (pageDef.path === '/InformationMaintenance/informationOverview') {
      await expect(page.locator('.settings-page.information-overview-page')).toBeVisible()
      await expect(page.locator('.sidebar-link[href="/InformationMaintenance/informationOverview"]')).toHaveClass(/is-active/)
    } else {
      await expect(page.getByRole('heading', { name: pageDef.title, level: 1 })).toBeVisible()
    }
    if (pageDef.path === '/houseManage/days') {
      await expect(page.getByRole('button', { name: '按房型' })).toBeVisible()
      await expect(page.getByText('入离')).toBeVisible()
      await expect(page.getByText('空净')).toBeVisible()
      await expect(page.locator('.day-room-card')).toHaveCount(4)
      await expect(page.locator('.day-filter-options label').filter({ hasText: '预抵' })).toContainText('1')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '预离' })).toContainText('3')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '在住' })).toContainText('3')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '空净' })).toContainText('1')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '空脏' })).toContainText('0')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '住净' })).toContainText('2')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '住脏' })).toContainText('1')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '关房' })).toContainText('0')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '备注' })).toContainText('1')
      await expect(page.getByText('李思思')).toBeVisible()
      await expect(page.getByText('赵晨')).toBeVisible()
      await expect(page.getByText('张张')).toBeVisible()
      await expect(page.getByText('¥398')).toBeVisible()
      await expect(page.getByText('¥218')).toBeVisible()
      await expect(page.getByText('胡志深')).toHaveCount(0)
      await expect(page.getByText('刘翻红')).toHaveCount(0)
      await expect(page.getByText('陈崇科')).toHaveCount(0)
      await expect(page.getByText('¥369.75')).toHaveCount(0)
    }
    if (pageDef.path === '/houseManage/logs/status') {
      await expect(page.getByText('日志关键词')).toBeVisible()
      await expect(page.getByLabel('调整方式')).toBeVisible()
      await expect(page.getByText('操作渠道')).toBeVisible()
      await expect(page.getByText('房态调整日期')).toBeVisible()
      await expect(page.getByText('渠道库存变更')).toBeVisible()
      await expect(page.getByText('暂无数据')).toBeVisible()
      await expect(page.getByText('日志总数')).toHaveCount(0)
    }
    if ('contentText' in pageDef) {
      await expect(page.getByText(pageDef.contentText).first()).toBeVisible()
    }
    if (pageDef.path === '/houseManage/priceBoard') {
      await page.getByText('去开通').click()
      await expect(page.getByText('购买信息')).toBeVisible()
      await expect(page.getByText('立即购买')).toBeVisible()
    }
    await page.screenshot({ path: pageDef.screenshot, fullPage: true })
  })
}

test('/houseManage/days supports captured room-status interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/days')

  await page.getByRole('button', { name: '按房间号' }).click()
  await expect(page.getByRole('button', { name: '按房间号' })).toHaveClass(/is-active/)
  await expect(page.getByText('按房间号视图')).toBeVisible()

  await page.locator('.day-filter-options label').filter({ hasText: '预抵' }).getByRole('checkbox').check()
  await expect(page.locator('.day-filter-tags')).toContainText('已筛选：预抵')
  await page.locator('.day-filter-options label').filter({ hasText: '预抵' }).getByRole('checkbox').uncheck()
  await expect(page.locator('.day-filter-tags')).toHaveCount(0)

  await page.getByRole('button', { name: '更多设置' }).click()
  await expect(page.getByRole('menu')).toContainText('房态设置')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)

  await page.getByRole('button', { name: '批量设脏/净' }).click()
  await expect(page.getByRole('menu', { name: '批量设脏/净' })).toContainText('批量设脏')
  await expect(page.getByRole('menu', { name: '批量设脏/净' })).toContainText('批量设净')

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '批量开/关房' }).click()
  await expect(page.getByRole('menu', { name: '批量开/关房' })).toContainText('批量关房')
  await expect(page.getByRole('menu', { name: '批量开/关房' })).toContainText('批量开房')
})

test('/houseManage/days matches captured navigation interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await page.getByRole('button', { name: '月房态' }).click()
  await expect(page).toHaveURL(/\/houseManage\/months$/)

  await page.goto(appUrl('/houseManage/days'))
  await page.getByRole('button', { name: '门店设置' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)
  await expect(page.getByRole('heading', { name: '门店信息', level: 1 })).toBeVisible()
})

test('/houseManage/days keeps business UI clean and gives feedback for visible actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await expect(page.getByText('本地 SPA 目前没有可复用的已认证 PMS API 代理')).toHaveCount(0)
  await expect(page.getByText('固定 Chrome 目标站取证快照')).toHaveCount(0)

  await page.getByPlaceholder('输入客户姓名/手机/房间/渠道单/备注').fill('房间1')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('已按“房间1”更新日房态')

  await page.getByRole('button', { name: '读卡' }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('请连接读卡器后重试')
  await expect(page.getByText('本地 SPA 目前没有可复用的已认证 PMS API 代理')).toHaveCount(0)

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '图例说明' }).click()
  await expect(page.getByRole('dialog', { name: '图例说明' })).toContainText('空净')
  await page.getByRole('button', { name: '关闭图例说明' }).click()

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '房态设置' }).click()
  await expect(page.getByRole('dialog', { name: '房态设置' })).toContainText('自动刷新')
  await page.getByRole('button', { name: '保存设置' }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('房态设置已保存')

  await page.getByRole('button', { name: '批量设脏/净' }).click()
  await page.getByRole('menuitem', { name: '批量设脏' }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('请选择房间后再批量设脏')

  await page.getByPlaceholder('输入客户姓名/手机/房间/渠道单/备注').fill('')
  await page.keyboard.press('Enter')
  await page.locator('.day-room-card[data-tone]').filter({ hasText: '赵晨' }).first().click()
  await expect(page.getByRole('dialog', { name: '订单详情' })).toContainText('赵晨')
  await expect(page.getByRole('dialog', { name: '订单详情' })).toContainText('飞猪旅行')
  await expect(page.getByRole('dialog', { name: '订单详情' })).toContainText('天落大床电竞套间（1206）')
  await expect(page.getByRole('dialog', { name: '订单详情' })).toContainText('¥428.00')
  await expect(page.getByRole('dialog', { name: '订单详情' })).toContainText('房费(减佣):¥398.00')
  await page.getByRole('button', { name: '关闭订单详情' }).click()

  await page.getByLabel('渠道').selectOption('direct')
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('渠道筛选已切换')

  await page.getByRole('main').getByRole('button', { name: '房价管理' }).click()
  await expect(page).toHaveURL(/\/houseManage\/houseCale$/)
})

test('/channels/ota supports captured channel actions and log route', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/ota'))

  await expect(page.getByTestId('ota-connected-card').first()).toContainText('携程')
  await expect(page.getByTestId('ota-connected-card').first()).toContainText('关联房型4/4')
  await page.getByTestId('ota-connected-card').first().getByRole('button', { name: '管理渠道' }).click()
  await expect(page.getByRole('status')).toContainText('打开携程渠道管理')

  await page.getByTestId('ota-pending-card').first().getByRole('button', { name: '立即关联' }).click()
  await expect(page.getByRole('status')).toContainText('准备关联携程玩乐')

  await page.locator('.chat-dock-launcher').click()
  await page.locator('.chat-dock__collapse').click()
  await page.getByRole('button', { name: '操作日志' }).click()
  await expect(page).toHaveURL(/\/channels\/ota\/log$/)
  await expect(page.getByRole('table', { name: 'OTA操作日志列表' })).toContainText('美团酒店')
})

test('/channels/ota/log supports captured filters and reset', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/ota/log'))

  await expect(page.getByLabel('渠道')).toHaveText('请选择')
  await page.getByPlaceholder('搜索关键词').fill('美团')
  await page.getByPlaceholder('搜索操作人').fill('路客云6TS5')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status')).toContainText('已查询 OTA 操作日志')

  await page.getByRole('button', { name: '展开' }).click()
  await expect(page.getByLabel('操作类型')).toBeVisible()
  await expect(page.getByLabel('操作状态')).toBeVisible()

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('搜索关键词')).toHaveValue('')
  await expect(page.getByPlaceholder('搜索操作人')).toHaveValue('')
})

test('/channels/distribution/distributionSecond matches captured distribution list states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/channels/distribution/distributionSecond'))

  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.getByLabel('聚合分销侧边导航')).toContainText('分销列表')
  await expect(page.getByRole('button', { name: '已分销' })).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: '未分销' })).toBeVisible()
  await expect(page.getByRole('button', { name: '提现教程' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房态管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房价管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '房型管理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '分销配置' })).toBeVisible()

  await page.getByRole('button', { name: '未分销' }).click()
  await expect(page.getByText('全部门店')).toBeVisible()
  await expect(page.getByLabel('分销列表筛选')).toContainText('天落会宿公寓')
  await expect(page.getByRole('button', { name: '一键上架' })).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道导入完善' })).toBeVisible()
  await expect(page.getByRole('table', { name: '未分销房型表' })).toContainText('房型')
  await expect(page.getByRole('table', { name: '未分销房型表' })).toContainText('原因')
  await expect(page.getByRole('table', { name: '未分销房型表' })).toContainText('操作')
  await expect(page.getByRole('table', { name: '未分销房型表' })).toContainText('缺少渠道房型映射')
})

test('/order/house-longRental-order/list matches captured long-rental columns and interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list'))

  await expect(page.getByRole('link', { name: '长租订单' })).toHaveClass(/is-active/)
  await expect(page.getByPlaceholder('输入订单号/姓名/手机号')).toBeVisible()
  await expect(page.getByText('租客姓名')).toBeVisible()
  await expect(page.getByText('合同时间')).toBeVisible()
  await expect(page.getByText('缴费方式')).toBeVisible()
  await expect(page.getByText('佟扬')).toBeVisible()
  await expect(page.getByText('2025-01-12 至')).toBeVisible()

  await page.getByRole('button', { name: '展开' }).click()
  await expect(page.getByText('请选择日期类型')).toBeVisible()
  await expect(page.getByText('排房情况', { exact: true })).toBeVisible()
  await expect(page.getByText('库存情况', { exact: true })).toBeVisible()
  await expect(page.getByText('房型标签', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '详情' }).click()
  await expect(page.getByRole('dialog', { name: '长租订单详情' })).toContainText('美团民宿')
  await expect(page.getByRole('dialog', { name: '长租订单详情' })).toContainText('押金：200')
})

test('/order/house-longRental-order/list exposes data source and blocked actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list'))

  await expect(page.getByLabel('长租订单数据来源')).toContainText('长租订单服务')
  await expect(page.getByRole('alert', { name: '长租订单接口阻塞' })).toHaveCount(0)
  await expect(page.locator('.order-page--long-rental')).not.toContainText(/mock provider|mock 数据|未接入|阻塞|后端未就绪|后端接口未完成|真实接口|未取证|缺少 campId/i)

  await page.getByRole('button', { name: '导出明细' }).click()
  await expect(page.getByRole('status', { name: '长租订单操作反馈' })).toContainText('导出任务已创建')

  await page.getByRole('button', { name: '展开' }).click()
  await page.getByRole('button', { name: '日期类型' }).click()
  await page.getByRole('option', { name: '入住时间' }).click()
  await expect(page.getByRole('status', { name: '长租订单操作反馈' })).toContainText('日期类型已更新')
})

test('/order/house-longRental-order/list requests real endpoint when camp context exists', async ({ page }) => {
  const requestBodies: Record<string, unknown>[] = []
  await page.route('https://hudson-prod.localhome.cn/orders/page/get', async (route) => {
    requestBodies.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          total: 1,
          list: [
            {
              orderId: 'LR20260516001',
              channelName: '美团民宿',
              contactName: '测试租客',
              contactPhone: '+8613900000000',
              roomCategoryName: '测试长租房型',
              roomName: 'A101',
              poiName: '测试门店',
              checkInTime: '2026-05-16 15:00',
              checkOutTime: '2026-06-16 12:00',
              liveStatusName: '入住中',
              roomRevenue: 3000,
              roomRevenueWithoutCommission: 2800,
              otherExpense: 50,
              deposit: 1000,
              orderTotalRevenue: 4050,
              contractStartDate: '2026-05-16',
              contractEndDate: '2026-06-16',
              contractTerm: '31日',
              paymentWayName: '月付',
              paymentDateDesc: '每月16号',
              createTime: '2026-05-16 10:00:00',
              isOccupyStock: 1,
              arrangeRoomStatusName: '已排房',
              includeStatisticsName: '是',
            },
          ],
        },
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list?longRentalProvider=api&campId=1796067693589061634'))

  await expect
    .poll(() => requestBodies.length, { message: '长租订单应请求目标站 orders/page/get' })
    .toBeGreaterThan(0)
  expect(requestBodies[0]).toMatchObject({
    campId: '1796067693589061634',
    pageNum: 1,
    pageSize: 20,
    current: 1,
    isLt: 1,
  })
  await expect(page.getByRole('status', { name: '长租订单加载状态' })).toContainText('已加载 1 条')
  await expect(page.getByRole('table', { name: '长租订单列表' })).toContainText('LR20260516001')
  await expect(page.getByRole('table', { name: '长租订单列表' })).toContainText('测试租客')
})

test('/order/house-longRental-order/list exposes real request failures', async ({ page }) => {
  await page.route('https://hudson-prod.localhome.cn/orders/page/get', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, errorMsg: '无权限访问长租订单' }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list?longRentalProvider=api&campId=1796067693589061634'))

  await expect(page.getByRole('alert', { name: '长租订单数据错误' })).toContainText('无权限访问长租订单')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
})

test('/order/house-longRental-order/list exposes real empty state', async ({ page }) => {
  await page.route('https://hudson-prod.localhome.cn/orders/page/get', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          total: 0,
          list: [],
        },
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/order/house-longRental-order/list?longRentalProvider=api&campId=1796067693589061634'))

  await expect(page.getByRole('status', { name: '长租订单加载状态' })).toContainText('已加载 0 条')
  await expect(page.getByRole('table', { name: '长租订单列表' })).toContainText('暂无长租订单')
})

test('/houseManage/months matches captured month-grid structure', async ({ page }) => {
  await mockMonthStatusApis(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await expect(page.getByTestId('month-date-column')).toHaveCount(33)
  await expect(page.getByTestId('month-date-column').first()).toContainText(formatMonthDay(monthWindowDate(0)))
  await expect(page.getByTestId('month-date-column').first()).toContainText('余2间')
  await expect(page.getByTestId('month-grid')).toContainText('全部收起')
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)
  await expect(page.getByTestId('month-grid')).toContainText('豪华大床房')
  await expect(page.getByTestId('month-grid')).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(page.getByTestId('month-grid')).toContainText('天落大床电竞套间')
  await expect(page.getByTestId('month-grid')).toContainText('观影大床房')
  await expect(page.getByTestId('month-grid')).toContainText('售罄')
  await expect(page.getByTestId('month-grid')).toContainText('801')
  await expect(page.getByTestId('month-grid')).toContainText('902')
  await expect(page.getByTestId('month-grid')).toContainText('1206')
  await expect(page.getByTestId('month-grid')).toContainText('706')
  await expect(page.getByTestId('month-grid')).not.toContainText('未返回')
  await expect(page.locator('.chat-dock-launcher')).toBeVisible()
})

test('/houseManage/months supports captured month-grid interactions', async ({ page }) => {
  await mockMonthStatusApis(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.getByRole('button', { name: /更多设置/ }).click()
  await expect(page.getByRole('menu', { name: '更多设置' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '图例说明' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '房态设置' })).toBeVisible()
  await page.getByRole('menuitem', { name: '图例说明' }).click()
  await expect(page.getByRole('status')).toContainText('图例说明已处理')

  await page.getByRole('button', { name: /全部收起/ }).click()
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)
  await expect(page.getByTestId('month-room-row')).toHaveCount(0)
  await page.getByRole('button', { name: /全部展开/ }).click()
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)

  await page.getByTestId('month-date-column').nth(12).click()
  await expect(page.getByTestId('month-date-column').nth(12)).toHaveAttribute('aria-current', 'date')

  await page.getByPlaceholder('房源编码/简称/标题').fill('豪华')
  await expect(page.getByTestId('month-room-row')).toHaveCount(1)
  await page.getByPlaceholder('房源编码/简称/标题').fill('')

  await page.getByRole('button', { name: '批量设脏/净' }).click()
  await expect(page.getByRole('menu', { name: '批量设脏/净' })).toBeVisible()
  await page.getByRole('menuitem', { name: '批量设脏' }).click()
  await expect(page.getByRole('toolbar', { name: '批量操作' })).toContainText('已选 0 间夜')
  await page.getByTestId('month-selectable-cell').nth(0).click()
  await expect(page.getByRole('toolbar', { name: '批量操作' })).toContainText('已选 1 间夜')

  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.getByText('李思思').click()
  await expect(page.locator('.month-order-drawer')).toContainText('订单信息')
  await expect(page.locator('.month-order-drawer')).toContainText('李思思')
  await expect(page.locator('.month-order-drawer')).toContainText('携程旅行')
})

test('/houseManage/months supports room type and tag dropdown filters', async ({ page }) => {
  await mockMonthStatusApis(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.getByRole('button', { name: '房型', exact: true }).click()
  await expect(page.getByRole('listbox', { name: '房型筛选' })).toBeVisible()
  await page.getByRole('option', { name: '豪华大床房' }).click()
  await expect(page.getByTestId('month-room-row')).toHaveCount(1)
  await expect(page.getByTestId('month-grid')).toContainText('801')

  await page.getByRole('button', { name: /清除筛选/ }).click()
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)

  await page.getByRole('button', { name: '房型标签' }).click()
  await expect(page.getByRole('listbox', { name: '房型标签筛选' })).toContainText('暂无数据')
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)
})

test('/houseManage/priceBoard supports captured purchase interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsPriceBoardProvider', 'real')
  })
  const priceBoardRequests = await mockPriceBoardApis(page)
  await page.goto(appUrl('/houseManage/priceBoard'))

  const priceBoardStatus = page.getByRole('status', { name: '电子房价牌数据接入状态' })
  await expect(priceBoardStatus).toContainText('商品信息已更新')
  await expect(priceBoardStatus).toHaveAttribute('data-provider', 'real')
  await expect(priceBoardStatus).toHaveAttribute('data-response-state', 'success')
  await expect(priceBoardStatus).toHaveAttribute('data-source-label', '/weiRoomCategories/page/get')
  expect(priceBoardRequests.map((request) => new URL(request.url).pathname)).toEqual(
    expect.arrayContaining([
      '/camps/get',
      '/edition/resource/get',
      '/weiRoomCategories/page/get',
      '/paymentTypes/get/v2',
    ]),
  )
  expect(priceBoardRequests.find((request) => request.url.endsWith('/weiRoomCategories/page/get'))?.postData).toMatchObject({
    buyCampId: 'camp-95',
    roomCategoryTypes: [1],
    goodsTypes: [7],
  })

  await expect(page.getByText('可直连路客云系统房价')).toBeVisible()
  await expect(page.getByText('接口返回的电子房价牌介绍')).toBeVisible()
  await expect(page.getByText('商品详情')).toBeVisible()
  const promoImages = page.getByRole('img', { name: /电子房价牌宣传图/ })
  await expect(promoImages).toHaveCount(3)
  const promoImageMetrics = await promoImages.evaluateAll((images: HTMLImageElement[]) =>
    images.map((image) => {
      const rect = image.getBoundingClientRect()
      return {
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedHeight: rect.height,
      }
    }),
  )
  for (const metrics of promoImageMetrics) {
    expect(metrics.naturalWidth).toBeGreaterThan(1000)
    expect(metrics.naturalHeight).toBeGreaterThan(500)
    expect(metrics.renderedHeight).toBeGreaterThan(500)
  }
  const firstPromoImageMetrics = await promoImages.first().evaluate((image: HTMLImageElement) => {
    const rect = image.getBoundingClientRect()
    return {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedHeight: rect.height,
    }
  })
  expect(firstPromoImageMetrics.renderedHeight).toBeGreaterThan(500)
  await page.locator('.chat-dock-launcher').click()
  await expect(
    page.locator('.app-shell > .chat-dock').evaluate((element) => window.getComputedStyle(element).position),
  ).resolves.toBe('fixed')
  await expect(page.locator('.price-board-help-bubble')).toHaveCount(0)
  await expect(page.locator('.chat-dock')).toBeVisible()
  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
  await page.locator('.chat-dock-launcher').click()
  await expect(page.locator('.chat-dock')).toBeVisible()

  await page.getByText('去开通').click()
  await expect(page.getByText('购买信息')).toBeVisible()
  await expect(page.getByLabel('我已阅读并同意《路客云产品服务购买协议》')).toBeChecked()
  const detailImage = page.getByRole('img', { name: '电子房价牌购买详情图' })
  await expect(detailImage).toBeVisible()
  const detailImageMetrics = await detailImage.evaluate((image: HTMLImageElement) => {
    const rect = image.getBoundingClientRect()
    return {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedHeight: rect.height,
    }
  })
  expect(detailImageMetrics.naturalWidth).toBeGreaterThan(2000)
  expect(detailImageMetrics.naturalHeight).toBeGreaterThan(900)
  expect(detailImageMetrics.renderedHeight).toBeGreaterThan(320)
  await expect(page.getByRole('article').filter({ hasText: '商品价格' }).getByText('¥499')).toBeVisible()
  await expect(page.getByText('立即购买')).toBeVisible()
  await page.locator('.price-board-duration-row label').filter({ hasText: '两年' }).click()
  await expect(page.getByRole('article').filter({ hasText: '订单金额' }).getByText('¥998')).toBeVisible()

  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page.getByRole('dialog', { name: '微信支付' })).toBeVisible()
  await expect(page.getByText('请使用微信扫码支付')).toBeVisible()
  await expect(page.getByText('¥ 998.00')).toBeVisible()
  await expect(page.getByText('订单已创建，请在有效期内完成支付')).toBeVisible()
  await expect(page.getByText('支付时间：')).toBeVisible()
  await page.getByRole('button', { name: '关闭支付弹层' }).click()

  await page.getByLabel('我已阅读并同意《路客云产品服务购买协议》').uncheck()
  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page.getByText('请先阅读并同意《路客云产品服务购买协议》')).toBeVisible()
})

test('/houseManage/priceBoard exposes real request failures with retry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pmsPriceBoardProvider', 'real')
  })
  let shouldFail = true
  let weiRequestCount = 0

  await page.route('https://hudson-prod.localhome.cn/camps/get', async (route) => {
    await route.fulfill({ json: { success: true, data: { camps: [{ campId: 'camp-95', name: '95分门店' }] } } })
  })
  await page.route('https://hudson-prod.localhome.cn/edition/resource/get', async (route) => {
    await route.fulfill({ json: { success: true, data: { resourceGetViews: [] } } })
  })
  await page.route('https://hudson-prod.localhome.cn/paymentTypes/get/v2', async (route) => {
    await route.fulfill({ json: { success: true, data: { paymentGroups: [] } } })
  })
  await page.route('https://hudson-prod.localhome.cn/weiRoomCategories/page/get', async (route) => {
    weiRequestCount += 1
    if (shouldFail) {
      await route.fulfill({ status: 503, json: { success: false, errorMsg: '真实接口暂不可达' } })
      return
    }

    await route.fulfill({
      json: {
        success: true,
        data: {
          list: [
            {
              channelRoomCategoryName: '电子房价牌',
              description: '重试后返回的真实商品',
              roomCategoryProductGetViews: [{ roomCategoryProductId: 'pb-year', roomCategoryProductName: '一年', sellingPrice: 49900, originalPrice: 89900 }],
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl('/houseManage/priceBoard'))
  await expect(page.getByRole('status', { name: '电子房价牌数据接入状态' })).toContainText('数据加载失败')
  await expect(page.getByRole('status', { name: '电子房价牌数据接入状态' })).toContainText('暂不可达')

  shouldFail = false
  await page.getByRole('button', { name: '重试数据服务' }).click()
  await expect(page.getByRole('status', { name: '电子房价牌数据接入状态' })).toContainText('商品信息已更新')
  await expect(page.getByRole('status', { name: '电子房价牌数据接入状态' })).toHaveAttribute('data-provider', 'real')
  await expect(page.getByText('重试后返回的真实商品')).toBeVisible()
  expect(weiRequestCount).toBe(2)
})

test('/houseManage/otherPrice supports fee-setting interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/otherPrice')

  await expect(page.getByRole('tab', { name: '杂费设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('其他价格数据状态')).toContainText('数据已更新')
  await expect(page.getByTestId('other-price-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByText('顶层套房（浴缸巨幕电竞麻将）')).toBeVisible()
  await expect(page.getByText('木鸟')).toBeVisible()
  await page.getByRole('button', { name: /渠道/ }).click()
  await page.getByRole('option', { name: '携程' }).click()
  await expect(page.getByText('美团酒店')).toHaveCount(0)
  await expect(page.getByTestId('other-price-service-contract')).toHaveAttribute('data-request-summary', /channelId=4/)

  await page.getByLabel('杂费设置表格').getByRole('button', { name: '设置', exact: true }).first().click()
  await expect(page.getByRole('dialog', { name: '改价' })).toBeVisible()
  await page.getByPlaceholder('请输入价格').fill('300')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('dialog', { name: '改价' })).toHaveCount(0)
  await expect(page.getByLabel('其他价格操作反馈')).toContainText('杂费设置已保存')

  await page.getByRole('button', { name: '携程' }).click()
  await page.getByRole('option', { name: '全部平台' }).click()
  await page.getByRole('tab', { name: '活动设置' }).click()
  await expect(page.getByRole('tab', { name: '活动设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('顶层套房（浴缸巨幕电竞麻将）')).toBeVisible()

  await page.getByRole('button', { name: '+新增设置' }).click()
  await expect(page.getByRole('dialog', { name: '活动设置' })).toContainText('设置连住天数')
  await expect(page.getByRole('dialog', { name: '活动设置' })).toContainText('有哪些时段')
  await page.getByRole('button', { name: '取消', exact: true }).click()

  await page.getByLabel('活动设置表格').getByRole('button', { name: '设置', exact: true }).first().click()
  await expect(page.getByRole('dialog', { name: '改折扣' })).toContainText('第一阶段')
  await expect(page.getByRole('dialog', { name: '改折扣' })).toContainText('第二阶段')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByLabel('其他价格操作反馈')).toContainText('活动折扣已保存')
  await expect(page.locator('body')).not.toContainText(/mock|未接入|阻塞|后端/)
})

test('/mallManagement/orderManagement matches captured presale order business state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/orderManagement'))

  await expect(page.getByRole('heading', { name: '预售券订单', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '预售券订单' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.getByRole('button', { name: '订单状态 全部' })).toHaveText('全部')
  await expect(page.getByRole('button', { name: '商品类型 请选择商品类型' })).toBeVisible()
  await expect(page.getByRole('button', { name: '订单来源 请选择订单来源' })).toBeVisible()
  await expect(page.getByRole('button', { name: '商品类目 请选择商品类目' })).toBeVisible()
  await expect(page.getByRole('button', { name: '支付方式 请选择支付方式' })).toBeVisible()
  await expect(page.getByRole('group', { name: '下单时间' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入订单编号/买家联系方式')).toBeVisible()
  await expect(page.getByRole('button', { name: '售后状态 请选择售后状态' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重 置' })).toBeVisible()
  await expect(page.getByRole('button', { name: '搜 索' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()
  await expect(page.getByTestId('presale-order-service-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.locator('.presale-order-page')).not.toContainText(/mock|provider|traceId|未接入|阻塞|后端/i)

  await expect(page.getByLabel('预售券订单表格').locator('.presale-order-table__head > div')).toHaveText([
    '商品',
    '商品类型(商品类目)',
    '单价(元)/数量',
    '商品总价(元)',
    '实付金额(元)',
    '买家/联系人',
    '订单状态',
    '售后状态',
    '操作',
  ])
  await expect(page.getByLabel('预售券订单表格')).toContainText('早鸟预售券')
  await expect(page.getByLabel('预售券订单表格')).toContainText('张三')

  await page.getByRole('button', { name: '商品类型 请选择商品类型' }).click()
  await expect(page.getByRole('listbox', { name: '商品类型选项' })).toContainText('虚拟商品')
  await expect(page.getByRole('listbox', { name: '商品类型选项' })).toContainText('电子卡券')
  await page.getByRole('option', { name: '虚拟商品' }).click()
  await expect(page.getByRole('button', { name: '商品类型 虚拟商品' })).toBeVisible()
  await page.getByPlaceholder('请输入订单编号/买家联系方式').fill('138')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '商品类型 请选择商品类型' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入订单编号/买家联系方式')).toHaveValue('')

  await page.getByRole('button', { name: '导出明细' }).click()
  await expect(page.getByRole('status', { name: '预售券订单操作反馈' })).toContainText('导出任务已创建')
  await page.getByRole('button', { name: '订单详情' }).first().click()
  await expect(page.getByRole('dialog', { name: '预售券订单详情' })).toContainText('ORDER-001')
  await page.getByRole('button', { name: '关闭详情', exact: true }).click()
})

test('/mallManagement/verificationManagement matches captured card verification state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/verificationManagement'))

  await expect(page.getByRole('heading', { name: '卡券核销', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '卡券核销' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.getByPlaceholder('请输入卡券码')).toBeVisible()
  await expect(page.getByRole('button', { name: '核 销' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '核销记录', level: 2 })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()
  await expect(page.getByTestId('card-verification-service-contract')).toHaveAttribute('data-provider', 'mock')

  await expect(page.getByLabel('卡券核销记录表格').locator('.card-verify-table__head > div')).toHaveText([
    '卡券码',
    '类目',
    '商品名称',
    '卡券名称',
    '用户昵称',
    '用户手机',
    '价格',
    '核销人',
    '核销时间',
    '相关订单',
    '状态',
    '操作',
  ])
  await expect(page.getByLabel('卡券核销记录表格')).toContainText('LK20260518001')
  await expect(page.getByLabel('卡券核销分页')).toContainText('共 3 条')

  await page.getByPlaceholder('请输入卡券码').fill('LK20260514001')
  await page.getByRole('button', { name: '核 销' }).click()
  await expect(page.getByRole('status', { name: '卡券核销操作反馈' })).toContainText('LK20260514001')
})

test('/houseManage/priceComparison renders usable business data from provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceComparison')

  await expect(page.getByRole('heading', { name: '竞争圈比价' })).toBeVisible()
  await expect(page.getByLabel('竞争圈比价筛选')).toBeVisible()
  await expect(page.getByLabel('竞争圈比价核心指标')).toContainText('平均价差')
  await expect(page.getByLabel('竞争圈比价趋势图')).toContainText('本店价')
  await expect(page.getByLabel('竞争圈比价列表')).toContainText('顶层套房（浴缸巨幕电竞麻将）')
  await expect(page.getByLabel('竞争圈比价待办')).toContainText('调价建议')
  await expect(page.locator('.price-comparison-page')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成/i)
  await expect(page.locator('.chat-dock-launcher')).toBeVisible()
})

test('/houseManage/priceComparison supports filters actions details and error state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceComparison')

  await page.getByLabel('比价日期').fill('2026-05-19')
  await page.getByLabel('门店').selectOption('qianhai')
  await page.getByLabel('房型').selectOption('suite')
  await page.getByRole('button', { name: '查询' }).click()
  await expect(page.getByRole('status', { name: '竞争圈比价操作反馈' })).toContainText('已按筛选条件更新')

  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('status', { name: '竞争圈比价操作反馈' })).toContainText('数据已刷新')

  await page.getByRole('button', { name: '导出' }).click()
  await expect(page.getByRole('status', { name: '竞争圈比价操作反馈' })).toContainText('导出任务已创建')

  await page.locator('.chat-dock__collapse').click()
  await page.getByRole('button', { name: '查看详情 顶层套房（浴缸巨幕电竞麻将）' }).click()
  await expect(page.getByRole('dialog', { name: '比价详情' })).toContainText('竞品价明细')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '比价详情' })).toHaveCount(0)

  await page.goto('/houseManage/priceComparison?mockState=error')
  await expect(page.getByRole('alert', { name: '竞争圈比价数据错误' })).toContainText('数据加载失败')
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
})

test('/houseManage/priceComparison price tabs navigate between price pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceComparison')

  await page.getByRole('button', { name: '中央价', exact: true }).click()
  await expect(page).toHaveURL(/\/houseManage\/houseCale$/)
  await expect(page.locator('.price-tabs button.is-active')).toHaveText('中央价')

  await page.goto('/houseManage/houseCale')
  const closeButton = page.getByRole('button', { name: '关闭' }).first()
  if (await closeButton.count()) {
    await closeButton.click()
  }
  await page.getByRole('button', { name: '竞争圈比价' }).click()
  await expect(page).toHaveURL(/\/houseManage\/priceComparison$/)
  await expect(page.getByRole('heading', { name: '竞争圈比价' })).toBeVisible()
})

test('/houseManage/priceComparison quick links use project routes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceComparison')

  await page.getByRole('button', { name: '去中央价' }).click()
  await expect(page).toHaveURL(/\/houseManage\/houseCale$/)

  await page.goto('/houseManage/priceComparison')
  await page.getByRole('button', { name: '去订单' }).click()
  await expect(page).toHaveURL(/\/order\/house-order\/list$/)
})

test('/houseManage/priceComparison uses the shared conversation dock', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceComparison')

  await expect(page.locator('.chat-dock-launcher')).toBeVisible()
  await page.locator('.chat-dock-launcher').click()
  await expect(page.locator('.chat-dock .chat-item')).toHaveCount(4)
  await page.locator('.chat-dock__collapse').click()
  await expect(page.locator('.chat-dock')).toHaveCount(0)
  await page.locator('.chat-dock-launcher').click()
  await expect(page.locator('.chat-dock')).toBeVisible()
})

test('/houseManage/logs/price supports filter interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/logs/price')

  const queryForm = page.getByLabel('调价日志筛选')
  await expect(queryForm.getByText('日志关键词')).toBeVisible()
  await expect(queryForm.getByText('调整方式', { exact: true })).toBeVisible()
  await expect(queryForm.getByText('渠道', { exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('搜索房型名称/房间号/渠道房源名称')).toBeVisible()
  await expect(page.locator('.price-log-select > button').nth(0)).toHaveText('手动调整')
  await expect(page.locator('.price-log-select > button').nth(1)).toHaveText('请选择')
  const queryBox = await page.locator('.price-log-query').boundingBox()
  expect(queryBox?.y).toBeLessThan(100)
  const tableHeadBox = await page.locator('.price-log-table__head').boundingBox()
  expect(Math.round((tableHeadBox?.y ?? 0) - (queryBox?.y ?? 0) - (queryBox?.height ?? 0))).toBe(8)
  await expect(page.locator('.price-log-table__head > div')).toHaveText([
    '房型',
    '价格日期',
    '操作内容',
    '调整方式',
    '同步渠道',
    '渠道价格',
    '操作人',
    '操作时间',
    '操作',
  ])
  await expect(page.getByRole('table', { name: '调价日志列表' })).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
  await expect(page.getByText('今日调价次数')).toHaveCount(0)
  await expect(page.getByText('PL202605120018')).toHaveCount(0)

  await page.getByPlaceholder('搜索房型名称/房间号/渠道房源名称').fill('总裁')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('table', { name: '调价日志列表' })).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')

  await page.getByRole('button', { name: '展开' }).click()
  await expect(page.getByText('调整时间', { exact: true })).toBeVisible()
  await expect(page.getByLabel('调整时间开始')).toBeVisible()
  await expect(page.getByLabel('调整时间结束')).toBeVisible()
  await expect(page.getByRole('group', { name: '操作日期' })).toBeVisible()
  await expect(page.getByLabel('操作日期开始')).toBeVisible()
  await expect(page.getByLabel('操作日期结束')).toBeVisible()
  await expect(page.getByLabel('操作人姓名')).toBeVisible()
  await expect(page.locator('.price-log-date-range')).toHaveCount(2)

  await page.getByRole('button', { name: '渠道 请选择' }).click()
  await page.getByRole('option', { name: '飞猪淘酒店' }).click()
  await expect(page.getByRole('button', { name: '渠道 飞猪淘酒店' })).toBeVisible()
  await expect(page.getByRole('table', { name: '调价日志列表' })).toContainText('飞猪淘酒店')

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('搜索房型名称/房间号/渠道房源名称')).toHaveValue('')
  await expect(page.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect(page.getByRole('table', { name: '调价日志列表' })).toContainText('总裁套间（桑拿浴缸露台电竞麻将）')
})

test('/houseManage/logs/price supports secondary interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/logs/price')

  await page.getByRole('button', { name: '调整方式 手动调整' }).click()
  await page.getByRole('option', { name: '系统调整' }).click()
  await expect(page.getByRole('button', { name: '调整方式 系统调整' })).toBeVisible()
  await expect(page.getByRole('table', { name: '调价日志列表' })).toContainText('系统同步')

  await page.locator('.price-log-query__actions button').last().click()
  await expect(page.locator('.price-log-query')).toHaveClass(/is-expanded/)
  await page.getByLabel('操作人姓名').fill('前台')
  await page.getByLabel('调整时间开始').fill('2026-05-13')
  await page.locator('.price-log-query__actions button').last().click()
  await expect(page.getByLabel('操作人姓名')).toHaveCount(0)

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '调整方式 手动调整' })).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出', exact: true })).toBeVisible()
})

test('/houseManage/logs/status supports captured filter interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/logs/status')

  await page.getByLabel('日志关键词').fill('总裁')
  await page.getByLabel('调整方式').selectOption('系统调整')
  await page.getByLabel('操作渠道').selectOption('途家')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByLabel('日志关键词')).toHaveValue('总裁')
  await expect(page.getByLabel('调整方式')).toHaveValue('系统调整')
  await expect(page.getByLabel('操作渠道')).toHaveValue('途家')
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByRole('button', { name: /展开/ }).click()
  await expect(page.getByRole('group', { name: '房态日期' })).toBeVisible()
  await expect(page.getByLabel('房态日期开始')).toBeVisible()
  await expect(page.getByLabel('房态日期结束')).toBeVisible()
  await expect(page.getByRole('group', { name: '操作日期' })).toBeVisible()
  await expect(page.getByLabel('操作日期开始')).toBeVisible()
  await expect(page.getByLabel('操作日期结束')).toBeVisible()
  await expect(page.getByLabel('操作人')).toBeVisible()
  await expect(page.getByLabel('渠道库存变更')).toHaveCount(0)

  await page.getByLabel('操作人').fill('前台')
  await page.getByLabel('房态日期开始').fill('2026-05-13')
  await page.getByLabel('操作日期开始').fill('2026-05-13')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByLabel('日志关键词')).toHaveValue('')
  await expect(page.getByLabel('调整方式')).toHaveValue('手动调整')
  await expect(page.getByLabel('操作渠道')).toHaveValue('')
  await expect(page.getByLabel('操作人')).toHaveValue('')
  await expect(page.getByLabel('房态日期开始')).toHaveValue('')
  await expect(page.getByLabel('操作日期开始')).toHaveValue('')
})

test('/cleanManage/cleanTask supports captured clean-task interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanTask'))

  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.getByText('全部门店')).toBeVisible()
  await expect(page.getByLabel('保洁日期')).toHaveValue('2026-05-18')
  await expect(page.getByRole('button', { name: '批量通知' })).toBeDisabled()
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toHaveCount(0)
  await expect(page.getByLabel('保洁任务列表')).toContainText('CT20260518001')
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toHaveCount(0)

  await page.getByRole('button', { name: '请选择保洁类型' }).click()
  await expect(page.getByRole('listbox', { name: '保洁类型筛选' })).toContainText('退房保洁')
  await page.getByRole('option', { name: '退房保洁' }).click()
  await expect(page.getByRole('button', { name: '退房保洁' })).toBeVisible()

  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByRole('status', { name: '保洁任务请求状态' })).toHaveCount(0)
  await expect(page.getByText('CT20260518001')).toBeVisible()
  await expect(page.getByRole('button', { name: '批量通知' })).toBeDisabled()

  await page.getByRole('button', { name: '创建保洁任务' }).click()
  await expect(page.getByRole('dialog', { name: '创建保洁任务' })).toBeVisible()
  await page.getByRole('button', { name: '取消', exact: true }).click()

  await page.getByRole('button', { name: '重 置' }).click()
  await page.getByRole('button', { name: '查看关联订单' }).click()
  await expect(page).toHaveURL(/\/order\/house-order\/list$/)
})

test('/cleanManage/cleanStatistics supports captured statistics interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanStatistics'))

  await expect(page.locator('.page-header')).toHaveCount(0)
  await expect(page.locator('.clean-stat-title')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '统计汇总' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('保洁统计核心指标')).toContainText('本月保洁')
  await expect(page.getByLabel('保洁统计汇总表')).toContainText('扫尘保洁')
  await expect(page.getByLabel('保洁统计汇总表')).toContainText('2026-05-16')
  await expect(page.getByLabel('保洁统计待办')).toContainText('今日退房保洁')
  await expect(page.locator('.clean-stat-page')).not.toContainText(/mock|未接入|阻塞|后端未就绪|后端接口未完成|未完成取证|未取证|真实接口/)
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '订阅开通' })).toHaveCount(0)

  await page.getByRole('button', { name: '统计明细' }).click()
  await expect(page.getByLabel('保洁统计明细表')).toContainText('CL20260516001')
  await page.getByRole('button', { name: '查看 CL20260516001' }).click()
  await expect(page.getByRole('dialog', { name: '保洁明细' })).toContainText('李清清')
  await page.getByRole('button', { name: '关闭明细' }).click()

  await page.getByRole('button', { name: '房型房间 请选择房间' }).click()
  await expect(page.getByRole('listbox', { name: '房型房间筛选' })).toContainText('观影大床房')

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.locator('.clean-stat-page')).toHaveAttribute('data-clean-export', /clean-stat-export-/)
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '房型房间 请选择房间' })).toBeVisible()
})

test('/cleanManage/cleanSetting supports usable setting interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/cleanManage/cleanSetting'))

  await expect(page.locator('.clean-setting-page')).toBeVisible()
  await expect(page.getByRole('tab', { name: '基础设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: '保洁设置', level: 1 })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '保洁设置核心指标' })).toContainText('今日任务')
  await expect(page.getByRole('table', { name: '保洁策略列表' })).toContainText('退房保洁自动派单')

  await page.getByRole('tab', { name: '价格设置' }).click()
  await expect(page.getByRole('tab', { name: '价格设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('table', { name: '保洁价格规则' })).toContainText('深度保洁附加费')

  await page.getByRole('button', { name: '查看详情 退房保洁自动派单' }).click()
  await expect(page.getByRole('dialog', { name: '保洁策略详情' })).toContainText('天落大床电竞套间')
  await page.getByRole('button', { name: '关闭详情' }).click()
  await expect(page.getByRole('dialog', { name: '保洁策略详情' })).toHaveCount(0)
})
