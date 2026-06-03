import { expect, test, type APIRequestContext } from '@playwright/test'
import { loginViaGateway, REAL_AUTH_DEFAULT_BASE_URL } from './helpers/real-auth'

const baseURL = REAL_AUTH_DEFAULT_BASE_URL
const campId = '10001'
const poiId = '11001'
const roomCategoryId = '22001'
const roomId = '23001'

type ApiPayload<T> = {
  code: number
  message?: string
  data: T
}

async function postGateway<T>(request: APIRequestContext, token: string, path: string, data: unknown) {
  const response = await request.post(`${baseURL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
  const responseText = await response.text()
  expect(response.ok(), `${path} HTTP ${response.status()}: ${responseText}`).toBeTruthy()
  const payload = JSON.parse(responseText) as ApiPayload<T>
  expect(payload.code, `${path} business response: ${responseText}`).toBe(0)
  expect(payload.data, `${path} should return data`).toBeTruthy()
  return payload.data
}

test('order mutations create, save guests, check in and check out through real gateway APIs', async ({ request }) => {
  const token = await loginViaGateway(request)
  const suffix = `${Date.now()}`
  const orderId = `9${suffix.slice(-12)}`
  const guestName = `TDD-order-${suffix}`
  const today = new Date()
  const checkInDate = new Date(today)
  checkInDate.setDate(today.getDate() + 1)
  const checkOutDate = new Date(today)
  checkOutDate.setDate(today.getDate() + 2)
  const toDateText = (value: Date) => value.toISOString().slice(0, 10)

  const createResult = await postGateway<{ orderId: string; status: string; guestCount: number; message: string }>(
    request,
    token,
    '/orders/create',
    {
      orderId,
      campId,
      poiId,
      roomCategoryId,
      roomId,
      guestName,
      guestMobile: '13990000001',
      checkInDate: toDateText(checkInDate),
      checkOutDate: toDateText(checkOutDate),
      totalPrice: 28800,
      totalPayPrice: 0,
      paymentStatus: 'unpaid',
      remark: `real order mutation smoke ${suffix}`,
      guests: [
        {
          guestId: `${orderId}01`,
          guestName,
          guestMobile: '13990000001',
          guestIdCard: `ID${orderId}01`,
          guestType: 'adult',
        },
      ],
    },
  )
  expect(createResult.orderId).toBe(orderId)
  expect(createResult.status).toBe('booked')
  expect(createResult.guestCount).toBe(1)

  const detailAfterCreate = await postGateway<{
    orderId: string
    status: string
    guestName: string
    roomCategoryId: string
    roomId: string
    totalPrice: number
    totalPayPrice: number
    guests: Array<{ guestName: string; guestMobile: string; guestIdCard: string; guestType: string }>
  }>(request, token, '/orders/detail/get', { campId, orderId })
  expect(detailAfterCreate.orderId).toBe(orderId)
  expect(detailAfterCreate.status).toBe('booked')
  expect(detailAfterCreate.guestName).toBe(guestName)
  expect(detailAfterCreate.roomCategoryId).toBe(roomCategoryId)
  expect(detailAfterCreate.roomId).toBe(roomId)
  expect(detailAfterCreate.totalPrice).toBe(28800)
  expect(detailAfterCreate.totalPayPrice).toBe(0)
  expect(detailAfterCreate.guests).toHaveLength(1)
  expect(detailAfterCreate.guests[0].guestName).toBe(guestName)

  const pageAfterCreate = await postGateway<{ total: number; list: Array<{ orderId: string; guestName: string; orderState?: number }> }>(
    request,
    token,
    '/orders/page/get',
    { campId, pageNum: 1, pageSize: 20, orderType: '', isLt: 0, searchContent: guestName },
  )
  expect(pageAfterCreate.total).toBeGreaterThanOrEqual(1)
  expect(pageAfterCreate.list.map((item) => item.orderId)).toContain(orderId)

  const saveGuestsResult = await postGateway<{ orderId: string; guestCount: number; message: string }>(
    request,
    token,
    `/orders/${orderId}/guests/save`,
    {
      campId,
      guests: [
        {
          guestId: `${orderId}11`,
          guestName,
          guestMobile: '13990000001',
          guestIdCard: `ID${orderId}11`,
          guestType: 'adult',
        },
        {
          guestId: `${orderId}12`,
          guestName: `${guestName}-companion`,
          guestMobile: '13990000002',
          guestIdCard: `ID${orderId}12`,
          guestType: 'adult',
        },
      ],
    },
  )
  expect(saveGuestsResult.orderId).toBe(orderId)
  expect(saveGuestsResult.guestCount).toBe(2)

  const detailAfterGuestsSave = await postGateway<{ guests: Array<{ guestName: string }> }>(
    request,
    token,
    '/orders/detail/get',
    { campId, orderId },
  )
  expect(detailAfterGuestsSave.guests.map((guest) => guest.guestName)).toEqual([guestName, `${guestName}-companion`])

  const checkInResult = await postGateway<{ orderId: string; status: string; message: string }>(
    request,
    token,
    `/orders/${orderId}/check-in`,
    { campId },
  )
  expect(checkInResult.orderId).toBe(orderId)
  expect(checkInResult.status).toBe('checked_in')

  const detailAfterCheckIn = await postGateway<{ status: string }>(request, token, '/orders/detail/get', { campId, orderId })
  expect(detailAfterCheckIn.status).toBe('checked_in')

  const checkOutResult = await postGateway<{ orderId: string; status: string; message: string }>(
    request,
    token,
    `/orders/${orderId}/check-out`,
    { campId },
  )
  expect(checkOutResult.orderId).toBe(orderId)
  expect(checkOutResult.status).toBe('completed')

  const detailAfterCheckOut = await postGateway<{ status: string; paymentStatus: string }>(
    request,
    token,
    '/orders/detail/get',
    { campId, orderId },
  )
  expect(detailAfterCheckOut.status).toBe('completed')
  expect(detailAfterCheckOut.paymentStatus).toBe('paid')
})
