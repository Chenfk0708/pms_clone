import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  return appBaseURL ? `${appBaseURL}${routePath}` : routePath
}

const DAY_MS = 24 * 60 * 60 * 1000
const MONTH_WINDOW_START_OFFSET_DAYS = -3

function monthWindowDate(offsetFromWindowStart: number) {
  const today = new Date()
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return new Date(localMidnight.getTime() + (MONTH_WINDOW_START_OFFSET_DAYS + offsetFromWindowStart) * DAY_MS)
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

async function mockPriceBoardApis(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
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
    contentText: '限时钜惠！智能保洁6折开通',
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
    contentText: '限时钜惠！智能保洁6折开通',
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
      await expect(page.getByRole('button', { name: '立即开通' })).toBeVisible()
    } else if (pageDef.path === '/houseManage/otherPrice') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.other-price-page')).toBeVisible()
      await expect(page.getByRole('tab', { name: '杂费设置' })).toHaveAttribute('aria-selected', 'true')
    } else if (pageDef.path === '/cleanManage/cleanLog') {
      await expect(page.locator('.page-header')).toBeHidden()
      await expect(page.getByLabel('保洁日志列表')).toContainText('操作内容')
    } else if (pageDef.path === '/order/house-order/list') {
      await expect(page.locator('.page-content > .page-header')).toBeHidden()
      await expect(page.locator('.order-page')).toBeVisible()
      await expect(page.getByRole('table', { name: '住宿订单列表' })).toContainText('2054409001821356034')
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
      await expect(page.locator('.chat-dock')).toBeVisible()
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
      await expect(page.locator('.day-filter-options label').filter({ hasText: '预离' })).toContainText('2')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '在住' })).toContainText('2')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '空净' })).toContainText('2')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '空脏' })).toContainText('0')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '住净' })).toContainText('1')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '住脏' })).toContainText('1')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '关房' })).toContainText('0')
      await expect(page.locator('.day-filter-options label').filter({ hasText: '备注' })).toContainText('3')
      await expect(page.getByText('张祯')).toBeVisible()
      await expect(page.getByText('胡志深')).toBeVisible()
      await expect(page.getByText('¥136.62')).toBeVisible()
      await expect(page.getByText('¥112.9')).toBeVisible()
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
      await expect(page.getByText(pageDef.contentText)).toBeVisible()
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

  await page.getByLabel('预抵').check()
  await expect(page.getByText('已筛选：预抵')).toBeVisible()
  await page.getByLabel('预抵').uncheck()
  await expect(page.getByText('已筛选：预抵')).toHaveCount(0)

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

test('/houseManage/days exposes source blockers and feedback for visible actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/houseManage/days'))

  await expect(page.getByLabel('日房态数据来源')).toContainText('固定 Chrome 目标站取证快照')
  await expect(page.getByLabel('日房态数据来源')).toContainText('roomStatusesToday/get')

  await page.getByPlaceholder('输入客户姓名/手机/房间/渠道单/备注').fill('房间1')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('搜索条件已记录')

  await page.getByRole('button', { name: '读卡' }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('读卡器未接入')

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '图例说明' }).click()
  await expect(page.getByRole('dialog', { name: '图例说明' })).toContainText('空净')
  await page.getByRole('button', { name: '关闭图例说明' }).click()

  await page.getByRole('button', { name: '更多设置' }).click()
  await page.getByRole('menuitem', { name: '房态设置' }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('房态设置真实入口未取证')

  await page.getByRole('button', { name: '批量设脏/净' }).click()
  await page.getByRole('menuitem', { name: '批量设脏' }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('请先选择房间')

  await page.getByRole('article', { name: /观影大床房 房间1/ }).click()
  await expect(page.getByRole('status', { name: '日房态操作反馈' })).toContainText('房间详情实时接口未接入')

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
  await expect(page.getByRole('button', { name: /天落会宿公寓/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '一键上架' })).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道导入完善' })).toBeVisible()
  await expect(page.getByRole('table', { name: '未分销房型表' })).toContainText('房型')
  await expect(page.getByRole('table', { name: '未分销房型表' })).toContainText('原因')
  await expect(page.getByRole('table', { name: '未分销房型表' })).toContainText('操作')
  await expect(page.getByText('暂无数据')).toBeVisible()
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

test('/houseManage/months matches captured month-grid structure', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await expect(page.getByTestId('month-date-column')).toHaveCount(33)
  await expect(page.getByTestId('month-date-column').first()).toContainText(formatMonthDay(monthWindowDate(0)))
  await expect(page.getByTestId('month-grid')).toContainText('全部收起')
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)
  await expect(page.getByTestId('month-grid')).toContainText('房间1')
  await expect(page.locator('.chat-dock')).toBeVisible()
})

test('/houseManage/months supports captured month-grid interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.getByRole('button', { name: /更多设置/ }).click()
  await expect(page.getByRole('menu', { name: '更多设置' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '图例说明' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '房态设置' })).toBeVisible()
  await page.getByRole('menuitem', { name: '图例说明' }).click()
  await expect(page.getByRole('status')).toContainText('已打开图例说明')

  await page.getByRole('button', { name: /全部收起/ }).click()
  await expect(page.getByTestId('month-type-row')).toHaveCount(4)
  await expect(page.getByTestId('month-room-row')).toHaveCount(0)
  await page.getByRole('button', { name: /全部展开/ }).click()
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)

  await page.getByTestId('month-date-column').nth(12).click()
  await expect(page.getByTestId('month-date-column').nth(12)).toHaveAttribute('aria-current', 'date')

  await page.getByPlaceholder('房源编码/简称/标题').fill('观影')
  await expect(page.getByTestId('month-room-row')).toHaveCount(1)
  await page.getByPlaceholder('房源编码/简称/标题').fill('')

  await page.getByRole('button', { name: '批量设脏/净' }).click()
  await expect(page.getByRole('menu', { name: '批量设脏/净' })).toBeVisible()
  await page.getByRole('menuitem', { name: '批量设脏' }).click()
  await expect(page.getByRole('toolbar', { name: '批量操作' })).toContainText('已选 0 间夜')
  await page.getByTestId('month-selectable-cell').nth(0).click()
  await expect(page.getByRole('toolbar', { name: '批量操作' })).toContainText('已选 1 间夜')

  await page.getByRole('button', { name: '取消' }).click()
  await page.getByText('王永祥').click()
  await expect(page.locator('.month-order-drawer')).toContainText('订单信息')
  await expect(page.locator('.month-order-drawer')).toContainText('王永祥')
  await expect(page.locator('.month-order-drawer')).toContainText('直携程')
})

test('/houseManage/months supports room type and tag dropdown filters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/months')

  await page.getByRole('button', { name: '房型', exact: true }).click()
  await expect(page.getByRole('listbox', { name: '房型筛选' })).toBeVisible()
  await page.getByRole('option', { name: '观影大床房' }).click()
  await expect(page.getByTestId('month-room-row')).toHaveCount(1)
  await expect(page.getByTestId('month-grid')).not.toContainText('总裁套间（桑拿浴缸露台电竞麻将）')

  await page.getByRole('button', { name: /清除筛选/ }).click()
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)

  await page.getByRole('button', { name: '房型标签' }).click()
  await expect(page.getByRole('listbox', { name: '房型标签筛选' })).toContainText('暂无数据')
  await expect(page.getByTestId('month-room-row')).toHaveCount(4)
})

test('/houseManage/priceBoard supports captured purchase interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceBoard')

  await expect(page.getByText('可直连路客云系统房价')).toBeVisible()
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
  await expect(page.getByRole('article').filter({ hasText: '商品价格' }).getByText('¥150.9')).toBeVisible()
  await expect(page.getByText('立即购买')).toBeVisible()

  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page.getByRole('dialog', { name: '微信支付' })).toBeVisible()
  await expect(page.getByText('请使用微信扫码支付')).toBeVisible()
  await expect(page.getByText('¥ 150.90')).toBeVisible()
  await expect(page.getByText('支付时间：')).toBeVisible()
  await page.getByRole('button', { name: '关闭支付弹层' }).click()

  await page.getByLabel('我已阅读并同意《路客云产品服务购买协议》').uncheck()
  await page.getByRole('button', { name: '立即购买' }).click()
  await expect(page.getByText('请先阅读并同意《路客云产品服务购买协议》')).toBeVisible()
})

test('/houseManage/otherPrice supports fee-setting interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/otherPrice')

  await expect(page.getByRole('tab', { name: '杂费设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('天落大床电竞套间')).toBeVisible()
  await expect(page.getByText('观影大床房')).toBeVisible()
  await page.getByRole('button', { name: /渠道/ }).click()
  await page.getByRole('option', { name: '携程' }).click()
  await expect(page.getByText('美团酒店')).toHaveCount(0)
  await expect(page.getByText('12')).toHaveCount(4)

  await page.getByLabel('杂费设置表格').getByRole('button', { name: '设置', exact: true }).first().click()
  await expect(page.getByRole('dialog', { name: '改价' })).toBeVisible()
  await page.getByPlaceholder('请输入价格').fill('300')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('dialog', { name: '改价' })).toHaveCount(0)

  await page.getByRole('button', { name: '携程' }).click()
  await page.getByRole('option', { name: '全部平台' }).click()
  await page.getByRole('tab', { name: '活动设置' }).click()
  await expect(page.getByRole('tab', { name: '活动设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('天落大床电竞套间')).toBeVisible()
  await expect(page.getByText('观影大床房')).toBeVisible()

  await page.getByRole('button', { name: '+新增设置' }).click()
  await expect(page.getByRole('dialog', { name: '活动设置' })).toContainText('设置连住天数')
  await expect(page.getByRole('dialog', { name: '活动设置' })).toContainText('有哪些时段')
  await page.getByRole('button', { name: '关闭' }).click()

  await page.getByLabel('活动设置表格').getByRole('button', { name: '设置', exact: true }).first().click()
  await expect(page.getByRole('dialog', { name: '改折扣' })).toContainText('第一阶段')
  await expect(page.getByRole('dialog', { name: '改折扣' })).toContainText('第二阶段')
})

test('/mallManagement/orderManagement matches captured empty presale order state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/orderManagement'))

  await expect(page.getByRole('heading', { name: '预售券订单', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '预售券订单' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.getByLabel('订单状态')).toHaveText('全部')
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
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByRole('button', { name: '商品类型 请选择商品类型' }).click()
  await expect(page.getByRole('listbox', { name: '商品类型选项' })).toContainText('虚拟商品')
  await expect(page.getByRole('listbox', { name: '商品类型选项' })).toContainText('电子卡券')
  await page.getByRole('option', { name: '虚拟商品' }).click()
  await expect(page.getByRole('button', { name: '商品类型 虚拟商品' })).toBeVisible()
  await page.getByPlaceholder('请输入订单编号/买家联系方式').fill('138')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '商品类型 请选择商品类型' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入订单编号/买家联系方式')).toHaveValue('')
})

test('/mallManagement/verificationManagement matches captured card verification state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(appUrl('/mallManagement/verificationManagement'))

  await expect(page.getByRole('heading', { name: '卡券核销', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '卡券核销' })).toHaveClass(/is-active/)
  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.getByPlaceholder('请输入卡券码')).toBeVisible()
  await expect(page.getByRole('button', { name: '核 销' })).toBeVisible()
  await expect(page.getByText('核销记录')).toBeVisible()
  await expect(page.getByRole('button', { name: '导出明细' })).toBeVisible()

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
  ])
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByPlaceholder('请输入卡券码').fill('LK20260514001')
  await page.getByRole('button', { name: '核 销' }).click()
  await expect(page.getByRole('status')).toContainText('LK20260514001')
})

test('/houseManage/priceComparison matches current unpaid entry state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceComparison')

  await expect(page.getByText('开通【智能调价】应用，使用【竞争圈比价】功能')).toBeVisible()
  await expect(page.getByRole('status', { name: '竞争圈比价数据接入状态' })).toContainText(
    '真实目标站取证快照',
  )
  await expect(page.getByRole('status', { name: '竞争圈比价数据接入状态' })).toContainText(
    '本地项目暂无已认证 PMS API 代理',
  )
  await expect(page.getByText('1/5')).toHaveCount(0)
  await expect(page.locator('.chat-dock')).toBeVisible()
  await expect(page.locator('.chat-dock .chat-item')).toHaveCount(4)
})

test('/houseManage/priceComparison price tabs navigate between price pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceComparison')

  await page.getByRole('button', { name: '中央价' }).click()
  await expect(page).toHaveURL(/\/houseManage\/houseCale$/)
  await expect(page.locator('.price-tabs button.is-active')).toHaveText('中央价')

  await page.goto('/houseManage/houseCale')
  const closeButton = page.getByRole('button', { name: '关闭' }).first()
  if (await closeButton.count()) {
    await closeButton.click()
  }
  await page.getByRole('button', { name: '竞争圈比价' }).click()
  await expect(page).toHaveURL(/\/houseManage\/priceComparison$/)
  await expect(page.getByText('开通【智能调价】应用，使用【竞争圈比价】功能')).toBeVisible()
})

test('/houseManage/priceComparison opens captured smart pricing subscription detail', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceComparison')

  await page.getByRole('button', { name: '立即开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail\?app=smartPricing$/)
  await expect(page.getByRole('dialog', { name: '智能调价应用开通' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '智能调价', level: 2 })).toBeVisible()
  await expect(page.getByLabel('订阅中心侧栏')).toContainText('应用订阅')
  await expect(page.getByText('商品详情')).toBeVisible()
  await expect(page.getByText('购买信息')).toBeVisible()
  await expect(page.getByRole('article').filter({ hasText: '商品价格' }).getByText('¥1,503')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeDisabled()
  await page.getByLabel('我已阅读并同意《路客云产品服务购买协议》').check()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeEnabled()
})

test('/houseManage/priceComparison uses the shared conversation dock', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/priceComparison')

  await expect(page.locator('.chat-dock')).toBeVisible()
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
  ])
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.getByText('今日调价次数')).toHaveCount(0)
  await expect(page.getByText('PL202605120018')).toHaveCount(0)

  await page.getByPlaceholder('搜索房型名称/房间号/渠道房源名称').fill('总裁')
  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.getByText('总裁套间（桑拿浴缸露台电竞麻将）')).toHaveCount(0)

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
  await expect(page.getByText('暂无数据')).toBeVisible()

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByPlaceholder('搜索房型名称/房间号/渠道房源名称')).toHaveValue('')
  await expect(page.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect(page.getByText('暂无数据')).toBeVisible()
})

test('/houseManage/logs/price supports secondary interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/houseManage/logs/price')

  await page.getByRole('button', { name: '调整方式 手动调整' }).click()
  await page.getByRole('option', { name: '系统调整' }).click()
  await expect(page.getByRole('button', { name: '调整方式 系统调整' })).toBeVisible()
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.getByText('系统同步')).toHaveCount(0)

  await page.locator('.price-log-query__actions button').last().click()
  await expect(page.locator('.price-log-query')).toHaveClass(/is-expanded/)
  await page.getByLabel('操作人姓名').fill('前台')
  await page.getByLabel('调整时间开始').fill('2026-05-13')
  await page.locator('.price-log-query__actions button').last().click()
  await expect(page.getByLabel('操作人姓名')).toHaveCount(0)

  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '调整方式 手动调整' })).toBeVisible()
  await expect(page.getByRole('button', { name: '渠道 请选择' })).toBeVisible()
  await expect(page.getByText('暂无数据')).toBeVisible()
  await expect(page.locator('.price-log-page').getByRole('button', { name: '刷新' })).toHaveCount(0)
  await expect(page.locator('.price-log-page').getByRole('button', { name: '导出' })).toHaveCount(0)
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
  await page.goto('/cleanManage/cleanTask')

  await expect(page.locator('.page-header')).toBeHidden()
  await expect(page.getByText('全部门店')).toBeVisible()
  await expect(page.getByLabel('保洁日期')).toHaveValue('2026-05-13 周三')
  await expect(page.getByRole('button', { name: '批量通知' })).toBeDisabled()
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toBeVisible()

  await page.locator('button').filter({ hasText: '请选择保洁类型' }).click()
  await expect(page.getByRole('listbox', { name: 'type筛选' })).toContainText('退房保洁')
  await page.getByRole('option', { name: '退房保洁' }).click()
  await expect(page.locator('button').filter({ hasText: '退房保洁' })).toBeVisible()

  await page.getByRole('button', { name: '查 询' }).click()
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toBeVisible()
  await expect(page.getByText('CT20260513001')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '批量通知' })).toBeDisabled()

  await page.getByRole('button', { name: '创建保洁任务' }).click()
  await expect(page.getByRole('dialog', { name: '创建保洁任务' })).toHaveCount(0)
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toBeVisible()

  await page.getByRole('button', { name: '重 置' }).click()
  await page.getByRole('button', { name: '订阅开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '智能保洁', level: 2 })).toBeVisible()
  await expect(page.getByText('商品详情')).toBeVisible()
  await expect(page.getByText('购买信息')).toBeVisible()
  await expect(page.getByText('¥1,232.46')).toHaveCount(2)
  await expect(page.getByText('¥2,194.38 / 年')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeDisabled()
})

test('/cleanManage/cleanStatistics supports captured statistics interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/cleanManage/cleanStatistics')

  await expect(page.locator('.page-header')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '保洁统计', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: '统计汇总' })).toHaveClass(/is-active/)
  await expect(page.getByLabel('保洁统计汇总表')).toContainText('扫尘保洁')
  await expect(page.getByLabel('保洁统计汇总表')).toContainText('18980.88')
  await expect(page.locator('.clean-stat-table__row')).toHaveCount(11)
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toBeVisible()
  const subscribeBox = await page.getByRole('button', { name: '订阅开通' }).boundingBox()
  expect(subscribeBox?.x).toBeLessThan(360)

  await page.getByRole('button', { name: '统计明细' }).click()
  await expect(page.getByLabel('保洁统计明细表')).toContainText('CL20260513001')

  await page.getByRole('button', { name: '请选择房间' }).click()
  await expect(page.getByRole('listbox', { name: '房型房间筛选' })).toContainText('观影大床房 房间1')
  await page.getByRole('option', { name: '观影大床房 房间1' }).click()
  await expect(page.getByLabel('保洁统计明细表')).toContainText('观影大床房 房间1')
  await expect(page.getByLabel('保洁统计明细表')).not.toContainText('顶层套房 房间1')

  await page.getByRole('button', { name: '导 出' }).click()
  await expect(page.getByRole('status')).toContainText('已生成保洁统计导出任务')
  await page.getByRole('button', { name: '重 置' }).click()
  await expect(page.getByRole('button', { name: '请选择房间' })).toBeVisible()

  await page.getByRole('button', { name: '订阅开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '智能保洁', level: 2 })).toBeVisible()
  await expect(page.getByText('商品详情')).toBeVisible()
  await expect(page.getByText('购买信息')).toBeVisible()
  await expect(page.getByText('¥1,232.46')).toHaveCount(2)
  await expect(page.getByText('¥2,194.38 / 年')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeDisabled()
})

test('/cleanManage/cleanSetting supports captured setting and subscription interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/cleanManage/cleanSetting')

  await expect(page.locator('.clean-setting-page')).toBeVisible()
  await expect(page.getByRole('tab', { name: '基础设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toBeVisible()
  await expect(page.getByText('创建保洁任务策略')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '设置保洁时段' })).toHaveCount(0)

  await page.getByRole('tab', { name: '价格设置' }).click()
  await expect(page.getByRole('tab', { name: '价格设置' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('限时钜惠！智能保洁6折开通')).toBeVisible()
  await expect(page.getByText('当前账号尚未开通智能保洁')).toHaveCount(0)

  await page.getByRole('button', { name: '订阅开通' }).click()
  await expect(page).toHaveURL(/\/version\/applicationPayment\/detail$/)
  await expect(page.getByRole('heading', { name: '智能保洁', level: 2 })).toBeVisible()
  await expect(page.getByText('¥1,232.46')).toHaveCount(2)
  await expect(page.getByText('¥2,194.38 / 年')).toBeVisible()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeDisabled()
  await page.getByLabel('我已阅读并同意《路客云产品服务购买协议》').check()
  await expect(page.getByRole('button', { name: '立即购买' })).toBeEnabled()
})
