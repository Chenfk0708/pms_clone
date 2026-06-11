import { expect, test, type Page, type Route } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const hashPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL.replace(/\/$/, '')}${hashPath}` : hashPath
}

async function openCampInfo(
  page: Page,
  options: {
    path?: string
    mode?: 'success' | 'empty' | 'error'
    latencyMs?: number
  } = {},
) {
  const { path = '/InformationMaintenance/campInfo', mode = 'success', latencyMs = 0 } = options
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(
    ({ mockMode, mockLatencyMs }) => {
      window.localStorage.setItem('pms_token', 'camp-info-test-token')
      window.localStorage.setItem('pms.campInfoProvider', 'mock')
      window.localStorage.setItem('pms.campInfoMockMode', mockMode)
      window.localStorage.setItem('pms.campInfoMockLatencyMs', String(mockLatencyMs))
    },
    { mockMode: mode, mockLatencyMs: latencyMs },
  )
  await page.goto(appUrl(path), { waitUntil: 'domcontentloaded' })
}

async function fulfillJson(route: Route, payload: unknown) {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

test('/InformationMaintenance/campInfo loads store data from the unified service layer', async ({ page }) => {
  await openCampInfo(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.locator('.camp-info-toolbar')).toHaveCount(0)
  await expect(page.getByTestId('camp-info-contract')).toBeHidden()
  await expect(page.getByTestId('camp-info-contract')).toContainText('"traceId":"mock-shezhi--xinxi-weihu--mendian-xinxi-list-001"')
  await expect(page.getByTestId('camp-info-contract')).toContainText('"/camps/get"')
  await expect(page.getByTestId('camp-info-contract')).toContainText('"/camp/get"')
  await expect(page.locator('.camp-info-query')).toBeVisible()
  await expect(page.locator('.camp-info-summary')).toContainText('1/1')
  await expect(page.locator('.camp-info-summary__actions button')).toHaveCount(3)
  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)

  await page.locator('.camp-info-query input').fill('前海')
  await page.locator('.camp-info-query__actions button').first().click()
  await expect(page.getByTestId('camp-info-contract')).toContainText('"keyword":"前海"')
  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)

  await page.locator('.camp-info-query input').fill('不存在的门店')
  await page.locator('.camp-info-query__actions button').first().click()
  await expect(page.locator('.camp-info-empty')).toBeVisible()

  await page.locator('.camp-info-query__actions button').nth(1).click()
  await expect(page.locator('.camp-info-query input')).toHaveValue('')
  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
})

test('/InformationMaintenance/campInfo covers expand, import, new store, detail, edit and sort interactions', async ({ page }) => {
  await openCampInfo(page)

  await page.locator('.camp-info-expand').click()
  await expect(page.locator('.camp-info-room-detail')).toBeVisible()
  await expect(page.locator('.camp-info-room-detail')).toContainText('顶层套房')

  await page.locator('.camp-info-summary__actions button').nth(1).click()
  await expect(page.locator('.camp-info-import-modal')).toBeVisible()
  await expect(page.locator('.camp-info-import-modal')).toContainText('导入门店基础资料')
  await page.locator('.camp-info-import-modal footer .is-primary').click()
  await expect(page.locator('.camp-info-import-modal')).toBeHidden()

  await page.locator('.camp-info-summary__actions button').first().click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/new$/)
  await expect(page.locator('.camp-info-edit-page')).toBeVisible()
  await expect(page.locator('.camp-info-edit-breadcrumb strong')).toContainText('新建门店')
  await expect(page.locator('input[aria-label="门店名称"]')).toHaveValue('')
  await expect(page.locator('input[aria-label="联系电话"]')).toHaveValue('')
  await expect(page.locator('.camp-info-address textarea')).toHaveValue('')
  await expect(page.locator('.camp-info-limit-modal')).toHaveCount(0)
  await page.getByLabel('门店名称').fill('新建门店测试')
  await page.getByLabel('门店类型').selectOption('公寓')
  await page.getByLabel('联系电话').fill('13800138000')
  await page.locator('.camp-info-address textarea').fill('深圳市南山区新建路 1 号')
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '保存并退出' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)
  await expect(page.locator('.camp-info-table__body')).toContainText('新建门店测试')

  await page.locator('.camp-info-actions button').first().click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/detail\?storeId=/)
  await expect(page.locator('.camp-info-detail-breadcrumb')).toBeVisible()
  await expect(page.locator('.camp-info-detail-shell')).toBeVisible()
  await expect(page.locator('.camp-info-detail-tabs [aria-selected="true"]')).toHaveCount(1)
  await page.locator('.camp-info-detail-tabs button').nth(1).click()
  await expect(page.locator('.camp-info-detail-tabs button').nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.camp-info-detail-room-list')).toBeVisible()
  await page.locator('.camp-info-detail-breadcrumb button').click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)

  await page.locator('.camp-info-actions button').nth(1).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo\/edit\?storeId=store-qianhai-001$/)
  await expect(page.locator('.camp-info-edit-page')).toBeVisible()
  await expect(page.locator('input[aria-label="门店名称"]')).toHaveValue('天落会宿公寓(前海壹方城宝安中心店)')
  await expect(page.locator('.camp-info-edit-breadcrumb')).toContainText('门店信息')
  await expect(page.locator('.camp-info-step.is-active')).toContainText('基本信息')
  await expect(page.locator('.camp-info-edit-basic')).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.locator('.camp-info-step.is-active')).toContainText('详细介绍')
  await expect(page.locator('.camp-info-edit-detail')).toBeVisible()
  await expect(page.getByLabel('文字介绍')).toBeVisible()
  await expect(page.locator('.camp-info-rich-editor')).toBeVisible()
  await page.getByRole('button', { name: '上一步' }).click()
  await expect(page.locator('.camp-info-edit-basic')).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '保存并退出' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)

  await openCampInfo(page, { path: '/InformationMaintenance/campInfo/sort' })
  await expect(page.locator('.camp-info-sort-page')).toBeVisible()
  await expect(page.locator('.camp-info-sort-list')).toContainText('天落会宿公寓')
  await page.getByRole('tab').nth(2).click()
  await expect(page.locator('.camp-info-sort-list')).toContainText('巨幕观影套餐')
})

test('/InformationMaintenance/campInfo validates contact phone before moving past basic info', async ({ page }) => {
  await openCampInfo(page, { path: '/InformationMaintenance/campInfo/new' })

  await page.getByLabel('门店名称').fill('新建门店测试')
  await page.getByLabel('门店类型').selectOption('公寓')
  await page.getByLabel('联系电话').fill('12000000000')
  await page.locator('.camp-info-address textarea').fill('深圳市南山区新建路 1 号')
  await page.getByRole('button', { name: '下一步' }).click()

  await expect(page.locator('.camp-info-field-error').filter({ hasText: '联系电话格式不正确' })).toBeVisible()
  await expect(page.locator('.camp-info-step.is-active')).toContainText('基本信息')
  await expect(page.locator('.camp-info-edit-basic')).toBeVisible()
  await expect(page.getByLabel('文字介绍')).toHaveCount(0)
})

test('/InformationMaintenance/campInfo uploads real store photos and uses the first one as list cover', async ({ page }) => {
  await openCampInfo(page, { path: '/InformationMaintenance/campInfo/edit?storeId=store-qianhai-001' })

  await expect(page.locator('.camp-info-edit-basic')).toBeVisible()
  await expect(page.locator('.camp-info-edit-photo-grid .camp-info-photo')).toHaveCount(0)
  await expect(page.locator('.camp-info-edit-photo-grid')).toContainText('暂无图片')

  const uploadInput = page.locator('input[type="file"][aria-label="上传门店图片"]')
  await uploadInput.setInputFiles({
    name: 'store-cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64'),
  })

  const uploadedPhoto = page.getByRole('img', { name: /store-cover\.png/ })
  await expect(uploadedPhoto).toHaveAttribute('src', /^data:image\/png;base64,/)
  await expect(page.locator('.camp-info-edit-photo-grid')).not.toContainText('暂无图片')

  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '保存并退出' }).click()
  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)

  const coverImage = page.locator('.camp-info-table__row img.camp-info-thumb').first()
  await expect(coverImage).toHaveAttribute('src', /^data:image\/png;base64,/)
  await expect(coverImage).toHaveAttribute('alt', /封面/)
})

test('/InformationMaintenance/campInfo saves edited API store fields and refreshes the list', async ({ page }) => {
  let serverStore = {
    campId: '10001',
    poiId: '11001',
    id: '11001',
    name: '路客云演示门店',
    poiName: '路客云演示门店',
    campName: '路客云演示门店',
    typeName: '酒店',
    cityName: '深圳市',
    cityPath: '广东省/深圳市/南山区',
    streetAddress: '深圳市南山区科技园演示地址',
    communityName: '联调社区',
    unitNo: '1 号',
    fullAddress: '深圳市南山区科技园演示地址 1 号',
    address: '深圳市南山区科技园演示地址 1 号',
    phone: '13800000001',
    contactNumber: '13800000001',
    tags: ['演示门店'],
    plainIntro: '接口返回的文字介绍',
    richIntro: '<p>接口返回的图文介绍</p>',
    coverImageDataUrl: '',
    photoCount: 0,
    roomTypeCount: 4,
  }
  const campGetRequests: Record<string, unknown>[] = []
  const poiPageRequests: Record<string, unknown>[] = []
  let saveBody: Record<string, unknown> | null = null
  let saveAuthorization = ''

  await page.route('**/api/camps/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        data: { camps: [{ campId: '10001', name: serverStore.name }] },
        traceId: 'test-camps-get',
        timestamp: '2026-06-04T10:00:00+08:00',
      }),
    })
  })
  await page.route('**/api/camp/get', async (route) => {
    campGetRequests.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        data: serverStore,
        traceId: 'test-camp-get',
        timestamp: '2026-06-04T10:00:00+08:00',
      }),
    })
  })
  await page.route('**/api/select/poi/page/get', async (route) => {
    poiPageRequests.push(route.request().postDataJSON() as Record<string, unknown>)
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: { total: 1, size: 20, current: 1, pageNum: 1, pages: 1, list: [serverStore] },
      traceId: 'test-poi-page-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/edition/resource/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        data: { expireDateRange: '2026.06.04 至 2027.06.03' },
        traceId: 'test-resource-get',
        timestamp: '2026-06-04T10:00:00+08:00',
      }),
    })
  })
  await page.route('**/api/roomCategories/page/get', async (route) => {
    await fulfillJson(route, {
      success: true,
      data: { total: 0, pageNum: 1, pageSize: 999, list: [] },
    })
  })
  await page.route('**/api/rooms/get', async (route) => {
    await fulfillJson(route, {
      success: true,
      data: { roomCategoryRooms: [] },
    })
  })
  await page.route('**/api/camp/save', async (route) => {
    const request = route.request()
    saveBody = request.postDataJSON() as Record<string, unknown>
    saveAuthorization = request.headers().authorization ?? ''
    serverStore = {
      ...serverStore,
      name: String(saveBody.name ?? saveBody.campName),
      poiName: String(saveBody.name ?? saveBody.campName),
      campName: String(saveBody.campName ?? saveBody.name),
      typeName: String(saveBody.typeName ?? saveBody.campTypeName),
      cityName: String(saveBody.cityName ?? saveBody.cityPath),
      cityPath: String(saveBody.cityPath ?? saveBody.cityName),
      streetAddress: String(saveBody.streetAddress ?? saveBody.address),
      communityName: String(saveBody.communityName ?? ''),
      unitNo: String(saveBody.unitNo ?? ''),
      fullAddress: String(saveBody.fullAddress ?? saveBody.address),
      address: String(saveBody.fullAddress ?? saveBody.address),
      phone: String(saveBody.phone ?? saveBody.contactNumber),
      contactNumber: String(saveBody.contactNumber ?? saveBody.phone),
      tags: Array.isArray(saveBody.tags) ? saveBody.tags.map(String) : String(saveBody.tags ?? '').split('/').map((item) => item.trim()).filter(Boolean),
      plainIntro: String(saveBody.plainIntro ?? ''),
      richIntro: String(saveBody.richIntro ?? ''),
      coverImageDataUrl: String(saveBody.coverImageDataUrl ?? ''),
      photoCount: Number(saveBody.photoCount ?? 0),
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        data: serverStore,
        traceId: 'test-camp-save',
        timestamp: '2026-06-04T10:01:00+08:00',
      }),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'camp-info-api-token')
    window.localStorage.setItem('pms.campInfoProvider', 'api')
  })
  await page.goto(appUrl('/InformationMaintenance/campInfo/edit?storeId=11001'), { waitUntil: 'domcontentloaded' })

  await expect(page.locator('.camp-info-edit-basic')).toBeVisible()
  expect(campGetRequests[0]).toMatchObject({ campId: '10001', storeId: '11001', poiId: '11001' })
  await expect(page.getByLabel('文字介绍')).not.toBeVisible()
  await page.getByLabel('门店名称').fill('联调门店-已保存')
  await page.getByLabel('联系电话').fill('13900001111')
  await page.locator('.camp-info-edit-tag-row input').fill('联调标签')
  await page.getByRole('button', { name: '+ 添加门店标签' }).click()
  const uploadInput = page.locator('input[type="file"][aria-label="上传门店图片"]')
  await uploadInput.setInputFiles({
    name: 'api-cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64'),
  })
  await page.locator('.camp-info-address textarea').fill('深圳市南山区联调路 88 号')
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByLabel('文字介绍')).toHaveValue('接口返回的文字介绍')
  await page.getByLabel('文字介绍').fill('联调后的文字介绍')
  await page.getByRole('textbox', { name: '图文介绍' }).fill('<p>联调后的图文介绍</p>')
  await page.getByRole('button', { name: '保存并退出' }).click()

  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)
  expect(saveAuthorization).toBe('Bearer camp-info-api-token')
  expect(saveBody).toMatchObject({
    campId: '10001',
    storeId: '11001',
    poiId: '11001',
    campName: '联调门店-已保存',
    name: '联调门店-已保存',
    phone: '13900001111',
    contactNumber: '13900001111',
    fullAddress: '深圳市南山区联调路 88 号',
    plainIntro: '联调后的文字介绍',
    richIntro: '<p>联调后的图文介绍</p>',
    photoCount: 1,
  })
  expect(saveBody?.tags).toEqual(expect.arrayContaining(['联调标签']))
  expect(String(saveBody?.coverImageDataUrl)).toMatch(/^data:image\/png;base64,/)
  expect(poiPageRequests.at(-1)).toMatchObject({ campId: '10001', pageNum: 1, pageSize: 20, isAvailability: '1' })
  await expect(page.locator('.camp-info-table__body')).toContainText('联调门店-已保存')
  await expect(page.locator('.camp-info-table__body')).toContainText('联调标签')
  await expect(page.locator('.camp-info-table__row img.camp-info-thumb').first()).toHaveAttribute(
    'src',
    /^data:image\/png;base64,/,
  )
})

test('/InformationMaintenance/campInfo expands API store rows with real room categories and rooms', async ({ page }) => {
  let poiPageRequest: Record<string, unknown> | null = null
  let roomCategoryRequest: Record<string, unknown> | null = null
  let roomsRequest: Record<string, unknown> | null = null

  await page.route('**/api/camps/get', async (route) => {
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: { camps: [{ campId: '10001', name: 'API Camp' }] },
      traceId: 'test-camps-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/select/poi/page/get', async (route) => {
    poiPageRequest = route.request().postDataJSON() as Record<string, unknown>
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: {
        total: 1,
        size: 20,
        current: 1,
        pageNum: 1,
        pages: 1,
        list: [
          {
            campId: '10001',
            poiId: '11001',
            id: '11001',
            poiName: 'API Store A',
            name: 'API Store A',
            typeName: 'Hotel',
            cityPath: 'Shenzhen/Nanshan',
            fullAddress: 'Nanshan demo address',
            contactNumber: '13800000001',
            tagsJson: '["api-store"]',
            coverImageDataUrl: 'data:image/png;base64,api-cover',
            photoCount: 1,
            roomTypeCount: 99,
          },
        ],
      },
      traceId: 'test-poi-page-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/camp/get', async (route) => {
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: {
        campId: '10001',
        name: 'API Camp',
        campName: 'API Camp',
        typeName: 'Hotel',
        cityName: 'Shenzhen',
        address: 'Nanshan demo address',
        phone: '13800000001',
        tags: ['api-store'],
        roomTypeCount: 99,
      },
      traceId: 'test-camp-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/edition/resource/get', async (route) => {
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: { expireDateRange: '2026.06.04 - 2027.06.03' },
      traceId: 'test-resource-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/roomCategories/page/get', async (route) => {
    roomCategoryRequest = route.request().postDataJSON() as Record<string, unknown>
    await fulfillJson(route, {
      success: true,
      data: {
        total: 2,
        pageNum: 1,
        pageSize: 999,
        list: [
          {
            roomCategoryId: 'rc-a',
            roomCategoryName: 'Real Suite A',
            mainPhotoMediaUrl: 'https://example.com/real-suite-a.jpg',
            roomNum: 2,
            roomNames: '201,202',
          },
          {
            id: 'rc-b',
            name: 'Real Suite B',
            roomNum: 1,
          },
        ],
      },
    })
  })
  await page.route('**/api/rooms/get', async (route) => {
    roomsRequest = route.request().postDataJSON() as Record<string, unknown>
    await fulfillJson(route, {
      success: true,
      data: {
        roomCategoryRooms: [
          {
            roomCategoryId: 'rc-a',
            roomCategoryName: 'Real Suite A',
            rooms: [
              { roomId: 'room-201', roomName: '201' },
              { roomId: 'room-202', roomName: '202' },
            ],
          },
          {
            roomCategoryId: 'rc-b',
            roomCategoryName: 'Real Suite B',
            rooms: [{ roomId: 'room-301', roomName: '301' }],
          },
        ],
      },
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'camp-info-api-token')
    window.localStorage.setItem('pms.campInfoProvider', 'api')
  })
  await page.goto(appUrl('/InformationMaintenance/campInfo'), { waitUntil: 'domcontentloaded' })

  await expect(page.locator('.camp-info-table__body')).toContainText('API Store A')
  await expect(page.locator('.camp-info-table__row img.camp-info-thumb').first()).toHaveAttribute(
    'src',
    'data:image/png;base64,api-cover',
  )
  await page.locator('.camp-info-expand').click()
  const roomDetail = page.locator('.camp-info-room-detail')
  await expect(roomDetail).toBeVisible()
  await expect(roomDetail).toContainText('Real Suite A')
  await expect(roomDetail).toContainText('Real Suite B')
  await expect(roomDetail).toContainText('201')
  await expect(roomDetail).toContainText('202')
  await expect(roomDetail).toContainText('301')
  await expect(roomDetail.locator('img.camp-info-room-image').first()).toHaveAttribute(
    'src',
    'https://example.com/real-suite-a.jpg',
  )
  await expect(roomDetail.locator('.camp-info-room-image--night')).toHaveCount(0)
  await expect(page.locator('.camp-info-table__body [role="cell"]').nth(5)).toContainText('2')
  expect(poiPageRequest).toMatchObject({ campId: '10001', pageNum: 1, pageSize: 20, isAvailability: '1' })
  expect(roomCategoryRequest).toMatchObject({ campId: '10001', poiId: '11001', pageNum: 1, pageSize: 999 })
  expect(roomsRequest).toMatchObject({ campId: '10001', roomCategoryIds: ['rc-a', 'rc-b'] })
})

test('/InformationMaintenance/campInfo creates API stores under the current camp instead of using the draft id as campId', async ({ page }) => {
  let savedStore: Record<string, unknown> | null = null
  let saveBody: Record<string, unknown> | null = null

  await page.route('**/api/camps/get', async (route) => {
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: { camps: [{ campId: '10001', name: 'API Camp' }] },
      traceId: 'test-camps-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/select/poi/page/get', async (route) => {
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: {
        total: savedStore ? 1 : 0,
        size: 20,
        current: 1,
        pageNum: 1,
        pages: savedStore ? 1 : 0,
        list: savedStore ? [savedStore] : [],
      },
      traceId: 'test-poi-page-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/edition/resource/get', async (route) => {
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: { expireDateRange: '2026.06.04 - 2027.06.03' },
      traceId: 'test-resource-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/roomCategories/page/get', async (route) => {
    await fulfillJson(route, {
      success: true,
      data: { total: 0, pageNum: 1, pageSize: 999, list: [] },
    })
  })
  await page.route('**/api/camp/save', async (route) => {
    saveBody = route.request().postDataJSON() as Record<string, unknown>
    savedStore = {
      campId: '10001',
      poiId: '22001',
      id: '22001',
      poiName: String(saveBody.name ?? saveBody.campName),
      name: String(saveBody.name ?? saveBody.campName),
      typeName: String(saveBody.typeName ?? ''),
      cityPath: String(saveBody.cityPath ?? ''),
      fullAddress: String(saveBody.fullAddress ?? saveBody.address ?? ''),
      contactNumber: String(saveBody.contactNumber ?? saveBody.phone ?? ''),
      tags: Array.isArray(saveBody.tags) ? saveBody.tags : [],
      coverImageDataUrl: String(saveBody.coverImageDataUrl ?? ''),
      photoCount: Number(saveBody.photoCount ?? 0),
    }
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: savedStore,
      traceId: 'test-camp-save',
      timestamp: '2026-06-04T10:01:00+08:00',
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'camp-info-api-token')
    window.localStorage.setItem('pms.campInfoProvider', 'api')
  })
  await page.goto(appUrl('/InformationMaintenance/campInfo/new'), { waitUntil: 'domcontentloaded' })

  await page.getByLabel('门店名称').fill('API 新建门店')
  await page.getByLabel('门店类型').selectOption('公寓')
  await page.getByLabel('联系电话').fill('13800138000')
  await page.locator('.camp-info-address textarea').fill('深圳市南山区新建联调路 1 号')
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '保存并退出' }).click()

  await expect(page).toHaveURL(/\/InformationMaintenance\/campInfo$/)
  expect(saveBody).toMatchObject({
    campId: '10001',
    campName: 'API 新建门店',
    name: 'API 新建门店',
    typeName: '公寓',
    phone: '13800138000',
    fullAddress: '深圳市南山区新建联调路 1 号',
  })
  expect(String(saveBody?.storeId)).toMatch(/^new-camp-info-store-/)
  expect(saveBody?.storeId).not.toBe(saveBody?.campId)
  await expect(page.locator('.camp-info-table__body')).toContainText('API 新建门店')
})

test('/InformationMaintenance/campInfo preserves large API poiId strings when saving a newly created store again', async ({ page }) => {
  const exactPoiId = '2062748026877456385'
  let saveBody: Record<string, unknown> | null = null

  await page.route('**/api/camps/get', async (route) => {
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: { camps: [{ campId: '10001', name: 'API Camp' }] },
      traceId: 'test-camps-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/select/poi/page/get', async (route) => {
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: {
        total: 1,
        size: 20,
        current: 1,
        pageNum: 1,
        pages: 1,
        list: [
          {
            campId: '10001',
            poiId: exactPoiId,
            id: exactPoiId,
            value: exactPoiId,
            poiName: 'API 新建大 ID 门店',
            name: 'API 新建大 ID 门店',
            typeName: '酒店',
            fullAddress: '深圳市南山区新建联调路 1 号',
            contactNumber: '13800138000',
            tags: [],
          },
        ],
      },
      traceId: 'test-poi-page-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/edition/resource/get', async (route) => {
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: { expireDateRange: '2026.06.04 - 2027.06.03' },
      traceId: 'test-resource-get',
      timestamp: '2026-06-04T10:00:00+08:00',
    })
  })
  await page.route('**/api/roomCategories/page/get', async (route) => {
    await fulfillJson(route, {
      success: true,
      data: { total: 0, pageNum: 1, pageSize: 999, list: [] },
    })
  })
  await page.route('**/api/rooms/get', async (route) => {
    await fulfillJson(route, {
      success: true,
      data: { roomCategoryRooms: [] },
    })
  })
  await page.route('**/api/camp/get', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: `{"code":0,"message":"success","data":{"campId":10001,"campName":"API Camp","name":"API 新建大 ID 门店","cityName":"深圳市","address":"深圳市南山区新建联调路 1 号","contactNumber":"13800138000","poiId":${exactPoiId},"poiName":"API 新建大 ID 门店","poiType":"酒店","typeName":"酒店","campTypeName":"酒店","phone":"13800138000","cityPath":"深圳市","streetAddress":"深圳市南山区新建联调路 1 号","communityName":null,"unitNo":null,"fullAddress":"深圳市南山区新建联调路 1 号","tags":[],"plainIntro":null,"richIntro":null,"coverImageDataUrl":null,"photoCount":0,"camp":{"campId":10001,"campName":"API Camp","name":"API Camp","poiId":${exactPoiId},"poiName":"API 新建大 ID 门店","typeName":"酒店","campTypeName":"酒店","cityName":"深圳市","cityPath":"深圳市","address":"深圳市南山区新建联调路 1 号","streetAddress":"深圳市南山区新建联调路 1 号","communityName":null,"unitNo":null,"fullAddress":"深圳市南山区新建联调路 1 号","contactNumber":"13800138000","phone":"13800138000","tags":[],"plainIntro":null,"richIntro":null,"coverImageDataUrl":null,"photoCount":0}},"traceId":"test-camp-get","timestamp":"2026-06-04T10:00:00+08:00"}`,
    })
  })
  await page.route('**/api/camp/save', async (route) => {
    saveBody = route.request().postDataJSON() as Record<string, unknown>
    await fulfillJson(route, {
      code: 0,
      message: 'success',
      data: {
        campId: '10001',
        poiId: exactPoiId,
        id: exactPoiId,
        poiName: String(saveBody.name ?? saveBody.campName),
        name: String(saveBody.name ?? saveBody.campName),
        typeName: String(saveBody.typeName ?? ''),
        fullAddress: String(saveBody.fullAddress ?? saveBody.address ?? ''),
        contactNumber: String(saveBody.contactNumber ?? saveBody.phone ?? ''),
        tags: Array.isArray(saveBody.tags) ? saveBody.tags : [],
      },
      traceId: 'test-camp-save',
      timestamp: '2026-06-04T10:01:00+08:00',
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'camp-info-api-token')
    window.localStorage.setItem('pms.campInfoProvider', 'api')
  })
  await page.goto(appUrl('/InformationMaintenance/campInfo'), { waitUntil: 'domcontentloaded' })
  await page.locator('.camp-info-actions button').nth(1).click()

  await expect(page).toHaveURL(new RegExp(`/InformationMaintenance/campInfo/edit\\?storeId=${exactPoiId}$`))
  await expect(page.locator('.camp-info-edit-basic')).toBeVisible()
  await page.getByLabel('门店名称').fill('API 新建大 ID 门店-已保存')
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '保存并退出' }).click()

  expect(saveBody).toMatchObject({
    campId: '10001',
    storeId: exactPoiId,
    poiId: exactPoiId,
    campName: 'API 新建大 ID 门店-已保存',
  })
})

test('/InformationMaintenance/campInfo shows loading feedback while the mock provider is pending', async ({ page }) => {
  await openCampInfo(page, { latencyMs: 1200 })

  await expect(page.locator('.camp-info-loading')).toBeVisible()
  await expect(page.locator('.camp-info-query__actions button').first()).toBeDisabled()
  await expect(page.locator('.camp-info-query__actions button').nth(1)).toBeDisabled()
  await expect(page.locator('.camp-info-summary__actions button').first()).toBeDisabled()
  await expect(page.locator('.camp-info-summary__actions button').nth(1)).toBeDisabled()

  await expect(page.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
})

test('/InformationMaintenance/campInfo handles empty and error responses with retry', async ({ browser }) => {
  const emptyPage = await browser.newPage()
  await openCampInfo(emptyPage, { mode: 'empty' })
  await expect(emptyPage.locator('.camp-info-empty')).toBeVisible()
  await expect(emptyPage.locator('.camp-info-summary__actions button').first()).toBeVisible()

  const errorPage = await browser.newPage()
  await openCampInfo(errorPage, { mode: 'error' })
  await expect(errorPage.locator('.camp-info-error')).toBeVisible()
  await errorPage.evaluate(() => window.localStorage.setItem('pms.campInfoMockMode', 'success'))
  await errorPage.locator('.camp-info-error .is-primary').click()
  await expect(errorPage.locator('.camp-info-table__body [role="row"]')).toHaveCount(1)
})
