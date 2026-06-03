import { expect, test, type APIRequestContext } from '@playwright/test'
import { loginViaGateway, REAL_AUTH_DEFAULT_BASE_URL } from './helpers/real-auth'

const baseURL = REAL_AUTH_DEFAULT_BASE_URL
const campId = '10001'
const storeId = '11001'
const groupId = '21001'

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
  expect(payload.code).toBe(0)
  expect(payload.data).toBeTruthy()
  return payload.data
}

test('room type mutations create, link, update and delete through real gateway APIs', async ({ request }) => {
  const token = await loginViaGateway(request)
  const suffix = `${Date.now()}`
  const roomTypeName = `TDD-room-type-${suffix}`
  let createdRoomCategoryId = ''

  try {
    const createResult = await postGateway<{ roomCategoryId: string; message: string }>(request, token, '/roomCategory/save', {
      campId,
      form: {
        roomTypeName,
        storeId,
        groupId,
        roomCount: '2',
        roomNos: [`TDD-${suffix}-1`, `TDD-${suffix}-2`],
        weekdayPrice: '268',
        weekendPrice: '288',
        holidayPrice: '308',
        rentalType: 'entire',
        propertyType: 'apartment',
        guestCount: '2',
        displayName: roomTypeName,
        earliestCheckIn: '14',
        latestCheckIn: '23',
        latestCheckOut: '12',
        highlightDescription: 'real smoke create',
        nearbyDescription: 'real smoke nearby',
        articleDescription: 'real smoke article',
      },
    })

    createdRoomCategoryId = createResult.roomCategoryId
    expect(createdRoomCategoryId).toBeTruthy()
    expect(createResult.message).toBeTruthy()

    const detailAfterCreate = await postGateway<{ form: { roomTypeName: string; roomNos: string[] } }>(
      request,
      token,
      '/roomCategory/detail/get',
      { campId, roomCategoryId: createdRoomCategoryId, mode: 'detail' },
    )
    expect(detailAfterCreate.form.roomTypeName).toBe(roomTypeName)
    expect(detailAfterCreate.form.roomNos).toEqual([`TDD-${suffix}-1`, `TDD-${suffix}-2`])

    const listAfterCreate = await postGateway<{ total: number; list: Array<{ roomCategoryId: string; roomCategoryName: string }> }>(
      request,
      token,
      '/roomCategories/page/get',
      { campId, roomCategoryName: roomTypeName, pageNum: 1, pageSize: 20, current: 1 },
    )
    expect(listAfterCreate.total).toBeGreaterThanOrEqual(1)
    expect(listAfterCreate.list.map((item) => item.roomCategoryId)).toContain(createdRoomCategoryId)

    const linkage = await postGateway<{ candidates: Array<{ id: string; name: string; selected: boolean }> }>(
      request,
      token,
      '/roomCategory/linkage/get',
      { campId, roomCategoryId: createdRoomCategoryId },
    )
    expect(linkage.candidates.length).toBeGreaterThan(0)
    const linkedRoomCategoryId = linkage.candidates.find((candidate) => candidate.id !== createdRoomCategoryId)?.id
    expect(linkedRoomCategoryId).toBeTruthy()

    const linkageSave = await postGateway<{ message: string }>(request, token, '/roomCategory/linkage/save', {
      campId,
      roomCategoryId: createdRoomCategoryId,
      linkedRoomCategoryIds: [linkedRoomCategoryId],
    })
    expect(linkageSave.message).toBeTruthy()

    const linkageAfterSave = await postGateway<{ candidates: Array<{ id: string; selected: boolean }> }>(
      request,
      token,
      '/roomCategory/linkage/get',
      { campId, roomCategoryId: createdRoomCategoryId },
    )
    expect(linkageAfterSave.candidates.find((candidate) => candidate.id === linkedRoomCategoryId)?.selected).toBeTruthy()

    const updatedRoomTypeName = `${roomTypeName}-updated`
    const updateResult = await postGateway<{ roomCategoryId: string; message: string }>(request, token, '/roomCategory/save', {
      campId,
      form: {
        roomTypeId: createdRoomCategoryId,
        roomTypeName: updatedRoomTypeName,
        storeId,
        groupId,
        roomCount: '1',
        roomNos: [`TDD-${suffix}-3`],
        weekdayPrice: '299',
        weekendPrice: '399',
        holidayPrice: '499',
        rentalType: 'entire',
        propertyType: 'apartment',
        guestCount: '3',
        displayName: updatedRoomTypeName,
        earliestCheckIn: '14',
        latestCheckIn: '23',
        latestCheckOut: '12',
        highlightDescription: 'real smoke update',
        nearbyDescription: 'real smoke nearby update',
        articleDescription: 'real smoke article update',
      },
    })
    expect(updateResult.roomCategoryId).toBe(createdRoomCategoryId)
    expect(updateResult.message).toBeTruthy()

    const detailAfterUpdate = await postGateway<{ form: { roomTypeName: string; roomNos: string[]; weekdayPrice: string } }>(
      request,
      token,
      '/roomCategory/detail/get',
      { campId, roomCategoryId: createdRoomCategoryId, mode: 'detail' },
    )
    expect(detailAfterUpdate.form.roomTypeName).toBe(updatedRoomTypeName)
    expect(detailAfterUpdate.form.roomNos).toEqual([`TDD-${suffix}-3`])
    expect(detailAfterUpdate.form.weekdayPrice).toBe('299')
  } finally {
    if (createdRoomCategoryId) {
      const deleteResult = await postGateway<{ message: string }>(request, token, '/roomCategory/delete', {
        campId,
        roomCategoryId: createdRoomCategoryId,
      })
      expect(deleteResult.message).toBeTruthy()

      const listAfterDelete = await postGateway<{ total: number; list: Array<{ roomCategoryId: string }> }>(
        request,
        token,
        '/roomCategories/page/get',
        { campId, roomCategoryName: roomTypeName, pageNum: 1, pageSize: 20, current: 1 },
      )
      expect(listAfterDelete.list.map((item) => item.roomCategoryId)).not.toContain(createdRoomCategoryId)
    }
  }
})
