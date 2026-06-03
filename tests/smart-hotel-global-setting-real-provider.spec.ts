import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const normalizedPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL}${normalizedPath}` : normalizedPath
}

test('/smartHotel/checkInGuide api provider adapts real dashboard contract', async ({ page }) => {
  const requests: Array<{ path: string; body: Record<string, unknown> }> = []

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'smart-hotel-global-setting-contract-token')
    window.localStorage.setItem('pmsCampId', '10001')
    window.localStorage.setItem(
      'pms_user',
      JSON.stringify({
        id: '12001',
        name: '演示管理员',
        campName: '演示门店',
      }),
    )
    window.localStorage.setItem('pms.smartHotelGlobalSettingProvider', 'api')
  })

  await page.route('**/api/systemConfigs/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-global-configs-001',
        timestamp: '2026-06-01T16:10:00+08:00',
        data: {
          configs: [
            {
              configKey: 'hudson.basic.orderAutoCancelStrategy',
              configValue: '1',
              configScope: 'camp',
              source: 'system',
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/smsAccount/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-global-sms-account-001',
        timestamp: '2026-06-01T16:10:10+08:00',
        data: {
          id: '19001',
          campId: '10001',
          totalSmsCount: '100',
          curSmsCount: '50',
        },
      },
    })
  })

  await page.route('**/api/select/calChannel4Deposit/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-global-deposit-001',
        timestamp: '2026-06-01T16:10:20+08:00',
        data: {
          select: [
            {
              channelId: '1',
              channelName: '爱彼迎',
              channelImageLogo: 'https://example.com/airbnb-logo.png',
              channelImageOpen: 'https://example.com/airbnb-open.png',
              channelImageClose: 'https://example.com/airbnb-close.png',
              isOpen: 1,
            },
            {
              channelId: '5',
              channelName: '携程',
              channelImageLogo: 'https://example.com/ctrip-logo.png',
              channelImageOpen: 'https://example.com/ctrip-open.png',
              channelImageClose: 'https://example.com/ctrip-close.png',
              isOpen: 1,
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/smsTemplateMsgConfig/page/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-global-sms-template-001',
        timestamp: '2026-06-01T16:10:30+08:00',
        data: {
          total: 3,
          size: 100,
          current: 1,
          extraInfo: null,
          pageNum: 1,
          hasNextPage: false,
          pages: 1,
          list: [
            {
              smsTemplateMsgConfigId: '20003',
              name: '押金提醒',
              passContent: '请在入住前完成押金预授权，退房当天 20:00 自动退还。',
              sendStatus: 1,
              isEnabled: 1,
              signName: '路客云',
              auditStatus: 3,
            },
            {
              smsTemplateMsgConfigId: '20002',
              name: '实名认证（智能入住）',
              passContent: '请先完成实名认证',
              sendStatus: 0,
              isEnabled: 0,
              signName: '路客云',
              auditStatus: 1,
            },
            {
              smsTemplateMsgConfigId: '20001',
              name: '获得密码（智能入住）',
              passContent: '您的房间密码为 {password}',
              sendStatus: 1,
              isEnabled: 1,
              signName: '路客云',
              auditStatus: 3,
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/roomCategories/page/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-global-room-categories-001',
        timestamp: '2026-06-01T16:10:40+08:00',
        data: {
          total: 2,
          size: 999,
          current: 1,
          extraInfo: null,
          pageNum: 1,
          hasNextPage: false,
          pages: 1,
          list: [
            {
              roomCategoryId: '112001',
              roomCategoryName: '标准大床房',
              roomNum: 2,
              roomNames: '1001,1002',
              roomCategoryProductInfoViews: [
                {
                  roomCategoryProductId: '50001',
                  earliestCheckInTime: 14,
                  latestCheckOutTime: 12,
                },
              ],
            },
            {
              roomCategoryId: '112002',
              roomCategoryName: '豪华双床房',
              roomNum: 1,
              roomNames: '2001',
              roomCategoryProductInfoViews: [
                {
                  roomCategoryProductId: '50002',
                  earliestCheckInTime: 15,
                  latestCheckOutTime: 13,
                },
              ],
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/weiRoomCategories/page/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-global-wei-room-categories-001',
        timestamp: '2026-06-01T16:10:50+08:00',
        data: {
          total: 1,
          size: 99,
          current: 1,
          extraInfo: null,
          pageNum: 1,
          hasNextPage: false,
          pages: 1,
          list: [
            {
              channelRoomCategoryId: '99601',
              channelRoomCategoryName: '门卡管理系统',
              goodsType: 7,
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/paymentTypes/get/v2', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-global-payment-types-001',
        timestamp: '2026-06-01T16:11:00+08:00',
        data: {
          paymentGroups: [
            {
              groupType: 1,
              groupTypeName: '住宿',
              paymentTypes: [{ paymentTypeName: '加床' }, { paymentTypeName: '加人' }, { paymentTypeName: '押金' }],
            },
          ],
        },
      },
    })
  })

  await page.route('**/api/paymentWays/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-global-payment-ways-001',
        timestamp: '2026-06-01T16:11:10+08:00',
        data: {
          paymentWays: [
            { paymentWayId: '17201', paymentWayName: '现金', isCustom: 0, isEnable: 1 },
            { paymentWayId: '17202', paymentWayName: '微信', isCustom: 0, isEnable: 1 },
            { paymentWayId: '17203', paymentWayName: '支付宝', isCustom: 0, isEnable: 1 },
          ],
        },
      },
    })
  })

  await page.route('**/api/systemConfig/checkInGuideShowStrategy/get', async (route) => {
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON() as Record<string, unknown>,
    })
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'smart-global-checkin-guide-strategy-001',
        timestamp: '2026-06-01T16:11:20+08:00',
        data: {
          configKey: 'hudson.basic.checkInGuideShowStrategy',
          configValue: '1',
          configScope: 'camp',
          source: 'platform',
        },
      },
    })
  })

  await page.goto(appUrl('/smartHotel/checkInGuide'))

  const diagnostics = page.locator('#smart-hotel-global-setting-diagnostics')
  await expect(diagnostics).toHaveAttribute('data-provider', 'api')
  await expect(diagnostics).toHaveAttribute('data-state', 'success')
  await expect(diagnostics).toHaveAttribute('data-request', /"campId":"10001"/)
  await expect(diagnostics).toHaveAttribute('data-request', /"\/systemConfig\/checkInGuideShowStrategy\/get"/)

  await expect(page.getByText('2 个房型已同步门锁时效策略')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('短信模板 3 条')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('最近同步：2026-06-01 16:11')).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: '充值' }).click()
  await expect(page.getByRole('dialog', { name: '认证与短信余额详情' })).toContainText('实名认证剩余 1 次')
  await expect(page.getByRole('dialog', { name: '认证与短信余额详情' })).toContainText('短信剩余 50 条')
  await expect(page.getByRole('dialog', { name: '认证与短信余额详情' })).toContainText('携程直连')
  await page.getByRole('button', { name: '关闭认证与短信余额详情' }).click()

  await page.getByRole('button', { name: '查看短信模板' }).click()
  await expect(page.getByRole('dialog', { name: '短信发送模板' })).toContainText('押金提醒')
  await expect(page.getByRole('dialog', { name: '短信发送模板' })).toContainText('实名认证（智能入住）')
  await expect(page.getByRole('dialog', { name: '短信发送模板' })).toContainText('获得密码（智能入住）')
  await page.getByRole('button', { name: '关闭短信发送模板' }).click()

  await page.getByRole('button', { name: '查看支付方式' }).click()
  await expect(page.getByRole('dialog', { name: '押金与收款方式' })).toContainText('微信')
  await expect(page.getByRole('dialog', { name: '押金与收款方式' })).toContainText('支付宝')

  expect(requests).toEqual(
    expect.arrayContaining([
      { path: '/api/systemConfigs/get', body: { campId: '10001' } },
      { path: '/api/smsAccount/get', body: { campId: '10001' } },
      { path: '/api/select/calChannel4Deposit/get', body: { campId: '10001' } },
      {
        path: '/api/smsTemplateMsgConfig/page/get',
        body: { campId: '10001', sendType: 0, pageNum: 1, pageSize: 100 },
      },
      {
        path: '/api/roomCategories/page/get',
        body: {
          campId: '10001',
          pageSize: 999,
          pageNum: 1,
          roomCategoryName: '',
          keyword: '',
          cityIds: [],
          channelId: '',
        },
      },
      {
        path: '/api/weiRoomCategories/page/get',
        body: {
          campId: '64',
          buyCampId: '10001',
          roomCategoryTypes: [1],
          goodsTypes: [7],
          pageNum: 1,
          pageSize: 99,
          keyword: '',
        },
      },
      {
        path: '/api/paymentTypes/get/v2',
        body: {
          campId: '10001',
          bizTypes: [1],
          isEnable: 1,
        },
      },
      { path: '/api/paymentWays/get', body: { campId: '10001' } },
      { path: '/api/systemConfig/checkInGuideShowStrategy/get', body: { campId: '10001' } },
    ]),
  )
})
