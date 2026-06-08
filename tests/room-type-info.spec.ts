import { expect, test } from '@playwright/test'

const appBaseURL = process.env.PMS_TEST_BASE_URL

function appUrl(routePath: string) {
  const normalizedPath = routePath.startsWith('/#') ? routePath : `/#${routePath}`
  return appBaseURL ? `${appBaseURL.replace(/\/$/, '')}${normalizedPath}` : normalizedPath
}

async function openRoomTypeInfo(
  page: import('@playwright/test').Page,
  routePath = '/setting/roomTypeInfo',
  mockState: 'success' | 'empty' | 'error' = 'success',
) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript((state) => {
    window.localStorage.setItem('pms_token', 'room-type-token')
    window.localStorage.setItem('pms.roomTypeInfoProvider', 'mock')
    window.localStorage.setItem('pms.roomTypeInfoMockState', state)
  }, mockState)
  await page.goto(appUrl(routePath), { waitUntil: 'domcontentloaded' })
}

test('room type location region picker includes current Shenzhen districts', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo/edit?mode=create')

  await page.locator('.room-type-edit-page__tabs button').nth(1).click()
  await page.getByLabel('独立位置').check()
  await page.locator('.room-type-region-picker__button').click()

  await page.getByRole('option', { name: '广东省' }).click()
  await page.getByRole('option', { name: '深圳市' }).click()

  const districtColumn = page.locator('.room-type-region-picker__column').nth(2)
  await expect(districtColumn).toContainText('龙华区')
  await expect(districtColumn).toContainText('坪山区')
  await expect(districtColumn).toContainText('光明区')
})

test('room type facility step matches target facility groups', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo/edit?mode=create')

  await page.locator('.room-type-edit-page__tabs button').nth(2).click()

  await expect(page.getByLabel('出租类型')).toBeVisible()
  await expect(page.getByLabel('房源类型')).toBeVisible()
  await expect(page.locator('.room-type-facility-section')).toContainText('核心设施（必填）')
  await expect(page.locator('.room-type-facility-section')).toContainText('入住服务')
  await expect(page.locator('.room-type-facility-section')).toContainText('儿童')
  await expect(page.locator('.room-type-facility-section')).toContainText('卫生')
  await expect(page.locator('.room-type-facility-section')).toContainText('周边500米')
  await expect(page.locator('.room-type-facility-section')).toContainText('质量')

  for (const label of ['餐桌', '一次性杯子', '抽油烟机', '自助入住', '儿童书籍', '儿童智能机器人', '白色床品', '泳池']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible()
  }

  await expect(page.getByLabel('床品更换')).toBeVisible()
  await expect(page.getByLabel('装修风格')).toBeVisible()
})

test('room type detail time selects include 1 to 24 oclock options', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo/edit?mode=create')

  await page.locator('.room-type-edit-page__tabs button').nth(3).click()

  const expectedOptions = [
    { value: '', label: '请选择' },
    ...Array.from({ length: 24 }, (_, index) => {
      const hour = String(index + 1)
      return { value: hour, label: `${hour} 点` }
    }),
  ]

  for (const label of ['最早入住时间', '最晚离店时间', '最晚入住时间']) {
    const actualOptions = await page.getByLabel(label).locator('option').evaluateAll((options) =>
      options.map((option) => ({
        value: option.getAttribute('value') ?? '',
        label: option.textContent?.trim() ?? '',
      })),
    )
    expect(actualOptions).toEqual(expectedOptions)
  }
})

test('room type photo step uploads image and saves photo metadata through api provider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'room-type-token')
    window.localStorage.setItem('pms.roomTypeInfoProvider', 'api')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  const capturedRequests: Array<{ url: string; headers: Record<string, string>; body?: Record<string, unknown>; rawBody?: string }> = []
  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: {
          list: [{ poiId: '11001', poiName: '门店A' }],
          total: 1,
          pageNum: 1,
          size: 100,
        },
      },
    })
  })
  await page.route('**/api/roomCategory/detail/get', async (route) => {
    capturedRequests.push({
      url: route.request().url(),
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'create-detail-trace-001',
        timestamp: '2026-06-02T12:00:00+08:00',
        data: {
          mode: 'create',
          title: '新增房型',
          steps: ['基础信息', '位置信息', '房型设施', '详细介绍', '照片信息'],
          form: {
            roomTypeName: '',
            storeId: '11001',
            groupId: '21001',
            roomCount: '1',
            roomNos: ['A-101'],
            photoCounts: { cover: 0, livingRoom: 0, kitchen: 0, other: 0, bathroom: 0, building: 0, entertainment: 0, uncategorized: 0 },
          },
        },
      },
    })
  })
  await page.route('**/api/roomCategory/photo/upload', async (route) => {
    capturedRequests.push({
      url: route.request().url(),
      headers: route.request().headers(),
      rawBody: route.request().postData() ?? '',
    })
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'photo-upload-trace-001',
        timestamp: '2026-06-02T12:00:00+08:00',
        data: {
          id: 'photo-cover-001',
          name: 'cover.png',
          url: 'https://assets.localhome.cn/room-type/cover.png',
          size: 70,
          mimeType: 'image/png',
        },
      },
    })
  })
  await page.route('**/api/roomCategory/save', async (route) => {
    capturedRequests.push({
      url: route.request().url(),
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'save-with-photo-trace-001',
        timestamp: '2026-06-02T12:00:00+08:00',
        data: { roomCategoryId: '93001', message: '房型已创建' },
      },
    })
  })

  await page.goto(appUrl('/setting/roomTypeInfo/edit?mode=create'), { waitUntil: 'domcontentloaded' })
  await page.getByLabel('房型名称').fill('带图房型')
  await page.locator('.room-type-edit-page__tabs button').nth(4).click()

  const coverInput = page.locator('input[type="file"][aria-label="上传封面"]')
  await coverInput.setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64'),
  })

  await expect(page.locator('.room-type-edit-page__photo-row').first()).toContainText('封面(1/1)')
  await expect(page.getByRole('img', { name: 'cover.png' })).toHaveAttribute('src', 'https://assets.localhome.cn/room-type/cover.png')
  await Promise.all([
    page.waitForURL(/\/setting\/roomTypeInfo$/),
    page.getByRole('button', { name: '保存并退出' }).click(),
  ])

  const uploadRequest = capturedRequests.find((request) => request.url.includes('/roomCategory/photo/upload'))
  expect(uploadRequest?.headers.authorization).toBe('Bearer room-type-token')
  expect(uploadRequest?.headers['content-type']).toContain('multipart/form-data')
  expect(uploadRequest?.rawBody).toContain('cover.png')
  expect(uploadRequest?.rawBody).toContain('cover')

  const saveRequest = capturedRequests.find((request) => request.url.includes('/roomCategory/save'))
  expect(saveRequest?.body).toMatchObject({
    campId: '10001',
    form: expect.objectContaining({
      roomTypeName: '带图房型',
      photos: [
        expect.objectContaining({
          id: 'photo-cover-001',
          sectionKey: 'cover',
          name: 'cover.png',
          url: 'https://assets.localhome.cn/room-type/cover.png',
          mimeType: 'image/png',
          size: 70,
          sortOrder: 1,
        }),
      ],
      photoCounts: expect.objectContaining({ cover: 1 }),
    }),
  })
})

test('room type info loads real poi store options and filters by selected store', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'room-type-token')
    window.localStorage.setItem('pms.roomTypeInfoProvider', 'api')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  const storeRequests: Array<Record<string, unknown>> = []
  const roomTypeRequests: Array<Record<string, unknown>> = []

  await page.route('**/api/select/poi/page/get', async (route) => {
    storeRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: {
          list: [
            { poiId: '11001', poiName: 'API Store A' },
            { poiId: '22002', poiName: 'API Store B' },
          ],
          total: 2,
          pageNum: 1,
          size: 100,
        },
      },
    })
  })
  await page.route('**/api/roomCategoryGroups/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: [{ id: '21001', name: '默认分组' }],
      },
    })
  })
  await page.route('**/api/roomCategories/page/get', async (route) => {
    const body = (route.request().postDataJSON() as Record<string, unknown>) ?? {}
    roomTypeRequests.push(body)
    const selectedPoiId = body.poiId === '22002' ? '22002' : 'all'
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: {
          total: 1,
          size: 20,
          current: 1,
          pageNum: 1,
          pages: 1,
          hasNextPage: false,
          list: [
            {
              id: `room-type-${selectedPoiId}`,
              roomCategoryId: `room-type-${selectedPoiId}`,
              roomCategoryName: selectedPoiId === '22002' ? 'Store B Room Type' : 'All Store Room Type',
              poiId: selectedPoiId === '22002' ? '22002' : '11001',
              poiName: selectedPoiId === '22002' ? 'API Store B' : 'API Store A',
              roomNum: 1,
              roomNames: 'A-101',
              roomCategoryGroupId: '21001',
              roomCategoryGroupName: '默认分组',
              linkRcs: [],
            },
          ],
        },
      },
    })
  })

  await page.goto(appUrl('/setting/roomTypeInfo'), { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('button', { name: '门店 全部门店' })).toBeVisible()
  await expect(page.getByTestId('room-type-info-row')).toContainText('All Store Room Type')

  await page.getByRole('button', { name: '门店 全部门店' }).click()
  await page.getByRole('option', { name: 'API Store B' }).click()
  await page.getByRole('button', { name: '查 询' }).click()

  await expect(page.getByRole('button', { name: '门店 API Store B' })).toBeVisible()
  await expect(page.getByTestId('room-type-info-row')).toContainText('Store B Room Type')
  expect(storeRequests[0]).toMatchObject({ campId: '10001', pageNum: 1, pageSize: 100 })
  expect(roomTypeRequests.at(-1)).toMatchObject({ campId: '10001', poiId: '22002' })
})

test('room type edit page loads real store options for owning store select', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'room-type-token')
    window.localStorage.setItem('pms.roomTypeInfoProvider', 'api')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  const storeRequests: Array<Record<string, unknown>> = []
  await page.route('**/api/select/poi/page/get', async (route) => {
    storeRequests.push((route.request().postDataJSON() as Record<string, unknown>) ?? {})
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: {
          list: [
            { poiId: '11001', poiName: 'API Store A' },
            { poiId: '22002', poiName: 'API Store B' },
          ],
        },
      },
    })
  })
  await page.route('**/api/roomCategory/detail/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'create-detail-trace-002',
        timestamp: '2026-06-05T12:00:00+08:00',
        data: {
          mode: 'create',
          title: '新增房型',
          steps: ['基础信息', '位置信息', '房型设施', '详细介绍', '照片信息'],
          form: {
            roomTypeName: '',
            storeId: '22002',
            groupId: '21001',
            roomCount: '1',
            roomNos: ['B-201'],
            photoCounts: { cover: 0, livingRoom: 0, kitchen: 0, other: 0, bathroom: 0, building: 0, entertainment: 0, uncategorized: 0 },
          },
        },
      },
    })
  })

  await page.goto(appUrl('/setting/roomTypeInfo/edit?mode=create'), { waitUntil: 'domcontentloaded' })

  const storeSelect = page.getByLabel('所属门店')
  await expect(storeSelect).toHaveValue('22002')
  await expect(storeSelect.locator('option')).toHaveText(['API Store A', 'API Store B'])
  expect(storeRequests[0]).toMatchObject({ campId: '10001', pageNum: 1, pageSize: 100 })
})

test('room type save shows backend business error message when request fails', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'room-type-token')
    window.localStorage.setItem('pms.roomTypeInfoProvider', 'api')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  await page.route('**/api/select/poi/page/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: {
          list: [{ poiId: '11001', poiName: '门店A' }],
          total: 1,
          pageNum: 1,
          size: 100,
        },
      },
    })
  })
  await page.route('**/api/roomCategory/detail/get', async (route) => {
    await route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        traceId: 'create-detail-trace-002',
        timestamp: '2026-06-02T12:00:00+08:00',
        data: {
          mode: 'create',
          title: '新增房型',
          steps: ['基础信息', '位置信息', '房型设施', '详细介绍', '照片信息'],
          form: {
            roomTypeName: '',
            storeId: '11001',
            groupId: '21001',
            roomCount: '1',
            roomNos: ['房间1'],
            photoCounts: { cover: 0, livingRoom: 0, kitchen: 0, other: 0, bathroom: 0, building: 0, entertainment: 0, uncategorized: 0 },
          },
        },
      },
    })
  })
  await page.route('**/api/roomCategory/save', async (route) => {
    await route.fulfill({
      status: 500,
      json: {
        code: 40001,
        success: false,
        message: '房间号已存在：房间1',
        errorMsg: '房间号已存在：房间1',
        traceId: 'save-business-error-trace-001',
        timestamp: '2026-06-02T12:00:00+08:00',
        data: null,
      },
    })
  })

  await page.goto(appUrl('/setting/roomTypeInfo/edit?mode=create'), { waitUntil: 'domcontentloaded' })
  await page.getByLabel('房型名称').fill('重复房间号房型')
  await page.locator('.room-type-edit-page__tabs button').nth(1).click()
  await page.getByRole('button', { name: '保存并退出' }).click()

  await expect(page.locator('.room-type-info-status')).toContainText('房间号已存在：房间1')
})

test('房型信息首屏由统一服务层驱动', async ({ page }) => {
  await openRoomTypeInfo(page)

  await expect(page.locator('.page-content > .page-header')).toBeHidden()
  await expect(page.getByTestId('room-type-info-contract')).toHaveAttribute('data-provider', 'mock')
  await expect(page.getByTestId('room-type-info-contract')).toHaveAttribute('data-endpoint', /roomCategories\/page\/get/)
  await expect(page.getByTestId('room-type-info-contract')).toHaveAttribute('data-trace-id', /room-type-info-/)
  await expect(page.locator('.room-type-info-query')).toBeVisible()
  await expect(page.locator('.room-type-info-toolbar')).toContainText('4/10')
  await expect(page.locator('.room-type-info-tools button')).toHaveCount(3)
  await expect(page.getByRole('table', { name: '房型信息列表' })).toBeVisible()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(4)
  await expect(page.getByTestId('room-type-info-row').first()).toContainText('顶层套房')
  await expect(page.getByAltText('顶层套房（浴缸巨幕电竞麻将）照片')).toBeVisible()
})

test('房型信息支持筛选、重置和管理入口反馈', async ({ page }) => {
  await openRoomTypeInfo(page)

  await page.locator('.room-type-info-filter').first().getByRole('button').click()
  await expect(page.getByRole('option', { name: '天落会宿公寓(前海壹方城宝安中心店)' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByLabel('房型名称').fill('观影')
  await page.locator('.room-type-info-actions .is-primary').click()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(1)
  await expect(page.getByTestId('room-type-info-row').first()).toContainText('观影大床房')

  await page.locator('.room-type-info-actions button').first().click()
  await expect(page.getByLabel('房型名称')).toHaveValue('')
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(4)

  await page.getByRole('button', { name: '标签管理' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/tag$/)
  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')
  await expect(page.locator('.room-type-tags-table__empty')).toContainText('暂无数据')
  await page.getByRole('button', { name: '新增标签' }).click()
  await expect(page.getByRole('dialog', { name: '添加房型标签' })).toBeVisible()
  await page.getByRole('dialog', { name: '添加房型标签' }).getByRole('button', { name: '取 消' }).click()
  await page.locator('.room-type-tags-page__breadcrumb button').click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)

  await page.getByRole('button', { name: '楼层管理' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/floor$/)
  await expect(page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb')).toContainText('楼层管理')
  await expect(page.locator('.room-type-floors-page .room-type-tags-table__empty')).toContainText('暂无数据')
  await page.getByRole('button', { name: '添加楼层' }).click()
  await expect(page.getByRole('dialog', { name: '添加楼层' })).toBeVisible()
  await page.getByRole('dialog', { name: '添加楼层' }).getByRole('button', { name: '取 消' }).click()
  await page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb button').click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)
})

test('房型信息支持新增、详情、房间、联动关房和删除反馈', async ({ page }) => {
  await openRoomTypeInfo(page)

  await page.getByRole('button', { name: '添加房型' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit/)
  await expect(page.locator('.room-type-edit-page__breadcrumb')).toContainText('新增房型')
  await expect(page.locator('.room-type-edit-page__tabs button')).toHaveCount(5)
  await expect(page.getByLabel('房型名称')).toHaveValue('')
  await expect(page.getByLabel('房间数量')).toHaveValue('1')
  await expect(page.locator('.room-type-edit-page__room-add')).toBeVisible()
  await expect(page.getByRole('button', { name: '快捷创建' })).toBeVisible()

  await openRoomTypeInfo(page)
  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '详情' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit/)
  await expect(page.locator('.room-type-edit-page__breadcrumb')).toContainText('房型详情')
  await expect(page.getByLabel('房型名称')).toHaveValue(/顶层套房/)
  await expect(page.locator('.room-type-edit-page__tabs button').nth(1)).toBeVisible()
  await page.locator('.room-type-edit-page__tabs button').nth(3).click()
  await expect(page.getByLabel('对外展示名称')).toHaveValue(/顶层套房/)
  await page.locator('.room-type-edit-page__tabs button').nth(4).click()
  await expect(page.locator('.room-type-edit-page__photo-list')).toContainText('封面(0/1)')
  await expect(page.getByRole('button', { name: '保存并退出' })).toBeVisible()
  await page.locator('.room-type-edit-page__breadcrumb button').click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '房间' }).click()
  await expect(page.getByRole('dialog', { name: '房间列表' })).toContainText('房间1')
  await page.getByRole('dialog', { name: '房间列表' }).getByRole('button', { name: '关闭' }).click()

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '联动关房' }).click()
  const linkageDialog = page.getByRole('dialog', { name: '联动关房' })
  await expect(linkageDialog).toContainText('设置联动关房后')
  await linkageDialog.getByRole('checkbox').first().check()
  await linkageDialog.getByRole('button', { name: '确 定' }).click()
  await expect(page.getByRole('status')).toContainText('联动关房已更新')

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '删除' }).click()
  const confirmDialog = page.getByRole('dialog', { name: '确认删除房型' })
  await expect(confirmDialog).toContainText('删除房型后将无法恢复')
  await confirmDialog.getByRole('button', { name: '删 除' }).click()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(3)
  await expect(page.getByRole('status')).toContainText('房型已删除')
})

test('房型信息覆盖 empty 和 error 状态', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo', 'empty')
  await expect(page.getByText('暂无房型数据')).toBeVisible()
  await expect(page.getByRole('button', { name: '添加房型' })).toBeVisible()

  const errorPage = await page.context().newPage()
  await openRoomTypeInfo(errorPage, '/setting/roomTypeInfo', 'error')
  await expect(errorPage.locator('.room-type-info-state')).toContainText('房型信息加载失败')
  await expect(errorPage.getByRole('button', { name: '重新加载' })).toBeVisible()
})

test('房型标签页支持新增标签弹窗和返回列表', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo/tag')

  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')
  await expect(page.getByRole('button', { name: '新增标签' })).toBeVisible()
  await expect(page.locator('.room-type-tags-table__empty')).toContainText('暂无数据')

  await page.getByRole('button', { name: '新增标签' }).click()
  const dialog = page.getByRole('dialog', { name: '添加房型标签' })
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder('请输入').fill('电竞标签')
  await dialog.locator('select').selectOption({ index: 1 })
  await dialog.getByRole('button', { name: '确 定' }).click()

  await expect(page.locator('.room-type-info-status')).toContainText('房型标签已创建')
  await expect(page.locator('.room-type-tags-table__body')).toContainText('电竞标签')
  await page.locator('.room-type-tags-page__breadcrumb button').click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo$/)
})

test('房型标签管理兼容旧路径和子路径访问', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo/tags')
  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')

  await openRoomTypeInfo(page, '/setting/roomTypeInfo/tagManage')
  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')

  await openRoomTypeInfo(page, '/setting/roomTypeInfo/tag/detail')
  await expect(page.locator('.room-type-tags-page__breadcrumb')).toContainText('房型标签')
  await expect(page.getByRole('button', { name: '新增标签' })).toBeVisible()
})

test('房型楼层管理兼容旧路径和子路径访问', async ({ page }) => {
  await openRoomTypeInfo(page, '/setting/roomTypeInfo/floors')
  await expect(page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb')).toContainText('楼层管理')

  await openRoomTypeInfo(page, '/setting/roomTypeInfo/floorManage')
  await expect(page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb')).toContainText('楼层管理')

  await openRoomTypeInfo(page, '/setting/roomTypeInfo/floor/detail')
  await expect(page.locator('.room-type-floors-page .room-type-tags-page__breadcrumb')).toContainText('楼层管理')
  await expect(page.getByRole('button', { name: '添加楼层' })).toBeVisible()
})

test('房型信息 api provider 使用真实详情、联动、保存和删除接口', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'room-type-token')
    window.localStorage.setItem('pms.roomTypeInfoProvider', 'api')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  const capturedRequests: Array<{ url: string; headers: Record<string, string>; body: Record<string, unknown> }> = []
  const capture = async (route: import('@playwright/test').Route, json: unknown) => {
    capturedRequests.push({
      url: route.request().url(),
      headers: route.request().headers(),
      body: (route.request().postDataJSON() as Record<string, unknown>) ?? {},
    })
    await route.fulfill({ json })
  }

  await page.route('**/api/select/poi/page/get', (route) =>
    capture(route, {
      code: 0,
      success: true,
      message: 'success',
      traceId: 'poi-trace-001',
      timestamp: '2026-05-30T12:00:00+08:00',
      data: [{ id: '11001', name: '门店A' }],
    }),
  )
  await page.route('**/api/roomCategoryGroups/get', (route) =>
    capture(route, {
      code: 0,
      success: true,
      message: 'success',
      traceId: 'group-trace-001',
      timestamp: '2026-05-30T12:00:00+08:00',
      data: [{ id: '21001', name: '分组A' }],
    }),
  )
  await page.route('**/api/roomCategories/page/get', (route) =>
    capture(route, {
      code: 0,
      success: true,
      message: 'success',
      traceId: 'room-page-trace-001',
      timestamp: '2026-05-30T12:00:00+08:00',
      data: {
        total: 2,
        size: 20,
        current: 1,
        pageNum: 1,
        pages: 1,
        hasNextPage: false,
        list: [
          {
            id: '92001',
            roomCategoryId: '92001',
            roomCategoryName: '特价单间',
            name: '单间',
            displayName: '单间',
            poiId: '11001',
            poiName: '门店A',
            roomNum: 1,
            roomNames: 'A-101',
            roomCategoryGroupId: '21001',
            roomCategoryGroupName: '分组A',
            mainPhoto: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 54%22%3E%3Crect width=%2296%22 height=%2254%22 fill=%22%23dce7f0%22/%3E%3Cpath d=%22M0 45h96V23L72 34 50 19 0 42z%22 fill=%22%2393a9b9%22/%3E%3Ccircle cx=%2274%22 cy=%2216%22 r=%227%22 fill=%22%23f7c873%22/%3E%3C/svg%3E',
            linkRcs: [{ roomCategoryId: '92002', roomCategoryName: '房型B' }],
          },
          {
            id: '92002',
            roomCategoryId: '92002',
            roomCategoryName: '房型B',
            name: '房型B',
            poiId: '11001',
            poiName: '门店A',
            roomNum: 1,
            roomNames: 'B-201',
            roomCategoryGroupId: '21001',
            roomCategoryGroupName: '分组A',
            linkRcs: [],
          },
        ],
      },
    }),
  )
  await page.route('**/api/rooms/get', (route) =>
    capture(route, {
      code: 0,
      success: true,
      message: 'success',
      traceId: 'rooms-trace-001',
      timestamp: '2026-05-30T12:00:00+08:00',
      data: [
        { id: '93001', roomId: '93001', name: 'A-101', roomName: 'A-101', lockStatus: 'online', floorName: '3F' },
      ],
    }),
  )
  await page.route('**/api/roomCategory/linkage/get', (route) =>
    capture(route, {
      code: 0,
      success: true,
      message: 'success',
      traceId: 'linkage-get-trace-001',
      timestamp: '2026-05-30T12:00:00+08:00',
        data: {
          roomTypeId: '92001',
          roomTypeName: '特价单间',
          description: '设置联动关房后会双向联动关房。',
          candidates: [
          { id: '92002', name: '房型B', selected: true },
          { id: '92003', name: '房型C', selected: false },
        ],
      },
    }),
  )
  await page.route('**/api/roomCategory/linkage/save', (route) =>
    capture(route, {
      code: 0,
      success: true,
      message: 'success',
      traceId: 'linkage-save-trace-001',
      timestamp: '2026-05-30T12:00:00+08:00',
      data: { message: '联动关房已更新' },
    }),
  )
  await page.route('**/api/roomCategory/delete', (route) =>
    capture(route, {
      code: 0,
      success: true,
      message: 'success',
      traceId: 'delete-trace-001',
      timestamp: '2026-05-30T12:00:00+08:00',
      data: { message: '房型已删除' },
    }),
  )
  await page.route('**/api/roomCategory/detail/get', (route) =>
    capture(route, {
      code: 0,
      success: true,
      message: 'success',
      traceId: 'detail-trace-001',
      timestamp: '2026-05-30T12:00:00+08:00',
      data: {
        mode: 'detail',
        title: '房型详情',
        steps: ['基础信息', '位置信息', '房型设施', '详细介绍', '照片信息'],
        form: {
          roomTypeId: '92001',
          roomTypeName: '特价单间',
          storeId: '11001',
          groupId: '21001',
          roomCount: '1',
          roomIds: ['93001'],
          roomNos: ['A-101'],
          weekdayPrice: '268',
          weekendPrice: '288',
          holidayPrice: '308',
          locationMode: 'same-store',
          rentalType: 'entire',
          propertyType: 'apartment',
          suiteArea: '68',
          guestCount: '2',
          bedroomCount: '1',
          livingRoomCount: '1',
          kitchenCount: '1',
          bathroomCount: '1',
          bathroomType: 'private',
          displayName: '单间',
          earliestCheckIn: '14',
          latestCheckOut: '12',
          latestCheckIn: '23',
          highlightDescription: '亮点',
          nearbyDescription: '周边',
          articleDescription: '图文',
          photoCounts: { cover: 1, livingRoom: 0, kitchen: 0, other: 0, bathroom: 0, building: 0, entertainment: 0, uncategorized: 0 },
        },
      },
    }),
  )
  await page.route('**/api/roomCategory/save', (route) =>
    capture(route, {
      code: 0,
      success: true,
      message: 'success',
      traceId: 'save-trace-001',
      timestamp: '2026-05-30T12:00:00+08:00',
      data: { roomCategoryId: '92001', message: '房型信息已保存' },
    }),
  )

  const byUrl = (fragment: string) => capturedRequests.filter((item) => item.url.includes(fragment))
  await page.goto(appUrl('/setting/roomTypeInfo'), { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('room-type-info-contract')).toHaveAttribute('data-provider', 'api')
  await expect(page.getByTestId('room-type-info-row').first().locator('.room-type-info-room-name__text')).toHaveText('特价单间')
  await expect(page.getByAltText('特价单间照片')).toBeVisible()
  expect(byUrl('/rooms/get')).toHaveLength(0)

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '房间' }).click()
  await expect(page.getByRole('dialog', { name: '房间列表' })).toContainText('A-101')
  await page.getByRole('dialog', { name: '房间列表' }).getByRole('button', { name: '关闭' }).click()

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '联动关房' }).click()
  const linkageDialog = page.getByRole('dialog', { name: '联动关房' })
  await expect(linkageDialog).toContainText('房型B')
  await linkageDialog.getByRole('checkbox').nth(1).check()
  await linkageDialog.getByRole('button', { name: '确 定' }).click()
  await expect(page.getByRole('status')).toContainText('联动关房已更新')

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '删除' }).click()
  await page.getByRole('dialog', { name: '确认删除房型' }).getByRole('button', { name: '删 除' }).click()
  await expect(page.getByRole('status')).toContainText('房型已删除')

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '详情' }).click()
  await expect(page).toHaveURL(/\/setting\/roomTypeInfo\/edit/)
  await expect(page.getByLabel('房型名称')).toHaveValue('特价单间')
  await page.getByLabel('房型名称').fill('特价单间改')
  await Promise.all([
    page.waitForURL(/\/setting\/roomTypeInfo$/),
    page.getByRole('button', { name: '保存并退出' }).click(),
  ])

  expect(byUrl('/rooms/get')[0].headers.authorization).toBe('Bearer room-type-token')
  expect(byUrl('/rooms/get')[0].body).toMatchObject({ campId: '10001', roomCategoryIds: ['92001'] })
  expect(byUrl('/roomCategory/linkage/get')[0].headers.authorization).toBe('Bearer room-type-token')
  expect(byUrl('/roomCategory/linkage/get')[0].body).toMatchObject({ campId: '10001', roomCategoryId: '92001' })
  expect(byUrl('/roomCategory/linkage/save')[0].body).toMatchObject({
    campId: '10001',
    roomCategoryId: '92001',
    linkedRoomCategoryIds: ['92002', '92003'],
  })
  expect(byUrl('/roomCategory/delete')[0].body).toMatchObject({ campId: '10001', roomCategoryId: '92001' })
  expect(byUrl('/roomCategory/detail/get')[0].body).toMatchObject({ campId: '10001', roomCategoryId: '92001' })
  expect(byUrl('/roomCategory/save')[0].body).toMatchObject({
    campId: '10001',
    form: expect.objectContaining({
      roomTypeId: '92001',
      roomTypeName: '特价单间改',
      storeId: '11001',
      groupId: '21001',
      roomIds: ['93001'],
      roomNos: ['A-101'],
    }),
  })
})

test('房型信息删除遇到当前或未来订单时展示后端错误且保留行', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem('pms_token', 'room-type-token')
    window.localStorage.setItem('pms.roomTypeInfoProvider', 'api')
    window.localStorage.setItem('pmsCampId', '10001')
  })

  await page.route('**/api/select/poi/page/get', (route) =>
    route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: [{ id: '11001', name: '门店A' }],
      },
    }),
  )
  await page.route('**/api/roomCategoryGroups/get', (route) =>
    route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: [{ id: '21001', name: '分组A' }],
      },
    }),
  )
  await page.route('**/api/roomCategories/page/get', (route) =>
    route.fulfill({
      json: {
        code: 0,
        success: true,
        message: 'success',
        data: {
          total: 1,
          size: 20,
          current: 1,
          pageNum: 1,
          pages: 1,
          hasNextPage: false,
          list: [
            {
              id: '92001',
              roomCategoryId: '92001',
              roomCategoryName: '特价单间',
              name: '单间',
              poiId: '11001',
              poiName: '门店A',
              roomNum: 1,
              roomNames: 'A-101',
              roomCategoryGroupId: '21001',
              roomCategoryGroupName: '分组A',
              linkRcs: [],
            },
          ],
        },
      },
    }),
  )
  await page.route('**/api/roomCategory/delete', (route) =>
    route.fulfill({
      json: {
        code: 40001,
        success: false,
        message: '当前或未来已有订单，不能删除房型',
        errorMsg: '当前或未来已有订单，不能删除房型',
        data: null,
      },
    }),
  )

  await page.goto(appUrl('/setting/roomTypeInfo'), { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(1)

  await page.getByTestId('room-type-info-row').first().getByRole('button', { name: '删除' }).click()
  const confirmDialog = page.getByRole('dialog', { name: '确认删除房型' })
  await expect(confirmDialog).toContainText('当前或未来已有订单时不能删除')
  await confirmDialog.getByRole('button', { name: '删 除' }).click()

  await expect(page.getByRole('status')).toContainText('当前或未来已有订单，不能删除房型')
  await expect(confirmDialog).toBeVisible()
  await expect(page.getByTestId('room-type-info-row')).toHaveCount(1)
})
