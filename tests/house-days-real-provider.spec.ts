import { expect, test } from '@playwright/test'

function formatShanghaiDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

test('/houseManage/days real provider requests today for roomStatusesToday', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = []
  const today = formatShanghaiDate(new Date())

  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'house-days-real-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  await page.route('**/api/roomStatusesToday/get', async (route) => {
    requests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'house-days-real-provider-test',
        timestamp: new Date().toISOString(),
        data: {
          basic: {
            preComeNum: 1,
            preLeaveNum: 0,
            liveNum: 1,
            idleCleanNum: 0,
            idleDirtyNum: 0,
            liveCleanNum: 1,
            liveDirtyNum: 0,
            hourRoomOrderNum: 0,
            ltNum: 0,
            debtNum: 0,
            extendStayNum: 0,
          },
          roomCategories: [
            {
              roomCategoryId: 'cat-1',
              roomCategoryName: '大床房',
              rooms: [
                {
                  roomId: 'room-1',
                  roomName: '201',
                  roomCategoryId: 'cat-1',
                  roomCategoryName: '大床房',
                  isDirty: 0,
                  isOcc: 1,
                  isLive: 1,
                  isIdle: 0,
                  isPreCome: 0,
                  isPreLeave: 0,
                  isOrderRemark: 0,
                  isLt: 0,
                  isDebt: 0,
                  isHourRoomOrder: 0,
                  isExtendStay: 0,
                  guestName: '测试住客',
                  orders: [
                    {
                      orderId: 'order-1',
                      guestName: '测试住客',
                      channelName: '直营渠道',
                      totalPriceCent: 29800,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    })
  })

  await page.goto('/#/houseManage/days?houseDaysProvider=real')

  await expect.poll(() => requests.length).toBeGreaterThan(0)
  expect(requests.at(-1)).toMatchObject({
    campId: '10001',
    date: today,
    viewMode: '按房间号',
  })
  await expect(page.locator('.day-room-card')).toContainText('测试住客')
})

test('/houseManage/days real provider keeps all orders for the same room and can search the secondary guest', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'house-days-real-multi-order-token')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  await page.route('**/api/roomStatusesToday/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        message: 'success',
        traceId: 'house-days-real-provider-multi-order',
        timestamp: new Date().toISOString(),
        data: {
          basic: {
            preComeNum: 2,
            preLeaveNum: 0,
            liveNum: 0,
            idleCleanNum: 0,
            idleDirtyNum: 0,
            liveCleanNum: 0,
            liveDirtyNum: 0,
            hourRoomOrderNum: 0,
            ltNum: 0,
            debtNum: 0,
            extendStayNum: 0,
          },
          roomCategories: [
            {
              roomCategoryId: 'cat-202',
              roomCategoryName: '豪华双床房',
              rooms: [
                {
                  roomId: 'room-202',
                  roomName: '202',
                  roomCategoryId: 'cat-202',
                  roomCategoryName: '豪华双床房',
                  isDirty: 0,
                  isOcc: 1,
                  isLive: 0,
                  isIdle: 0,
                  isPreCome: 1,
                  isPreLeave: 0,
                  isOrderRemark: 0,
                  isLt: 0,
                  isDebt: 0,
                  isHourRoomOrder: 0,
                  isExtendStay: 0,
                  guestName: 'Real Guest C',
                  orders: [
                    {
                      orderId: 'order-1',
                      guestName: 'Real Guest C',
                      guestMobile: '13900003103',
                      channelName: '携程',
                      totalPriceCent: 37800,
                    },
                    {
                      orderId: 'order-2',
                      guestName: '刘敏',
                      guestMobile: '13910003102',
                      channelName: '美团',
                      totalPriceCent: 42000,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    })
  })

  await page.goto('/#/houseManage/days?houseDaysProvider=real')

  await expect(page.locator('.day-room-area')).toContainText('Real Guest C')
  await expect(page.locator('.day-room-area')).toContainText('刘敏')

  await page.locator('.month-toolbar__actions input').fill('刘敏')
  await page.locator('.month-toolbar__actions input').press('Enter')

  await expect(page.locator('.day-room-area')).toContainText('刘敏')
})
