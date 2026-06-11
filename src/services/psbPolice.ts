import { validateCredentialNumber, validatePersonName } from '../utils/inputValidation'

const PSB_POLICE_PROVIDER_KEY = 'pms.psbPoliceProvider'
const DEFAULT_CAMP_ID = '1796067693589061634'
const DEFAULT_TIMESTAMP = '2026-05-19T17:20:00+08:00'

export const PSB_SYSTEM_NAME = '广东旅业系统'

export type PsbPoliceProviderName = 'mock' | 'api'
export type PsbPoliceMockState = 'success' | 'empty' | 'error'

export type PsbPoliceFilters = {
  campId: string
  mockState: PsbPoliceMockState
}

export type PsbPoliceRow = {
  id: string
  systemName: string
  hotelCode: string
  typeLabel: string
  merchantName: string
  storeName: string
  roomCount: number
}

export type PsbStoreOption = {
  poiId: string
  poiName: string
}

export type PsbRoomCategoryOption = {
  roomCategoryId: string
  roomCategoryName: string
  roomCount: number
}

export type PsbPolicePageData = {
  provider: PsbPoliceProviderName
  traceId: string
  campId: string
  rows: PsbPoliceRow[]
  stores: PsbStoreOption[]
  roomCategories: PsbRoomCategoryOption[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  requestSummary: string[]
}

export type PsbPoliceSubmissionInput = {
  systemName: string
  merchantName: string
  poiId: string
  travelBusinessName: string
  travelBusinessCode: string
  socialCreditCode: string
  travelBusinessAddress: string
  districtCode: string
  registerCode: string
  hotelCode: string
  accessKeyId: string
  devicePublicKey: string
  devicePrivateKey: string
  registrantName: string
  registrantIdNumber: string
}

export type PsbPoliceSubmissionResult = {
  traceId: string
  feedbackMessage: string
  createdRow: PsbPoliceRow
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T | null
  traceId: string
  timestamp: string
}

const mockStores: PsbStoreOption[] = [
  {
    poiId: '1796425098638573570',
    poiName: '天落会宿公寓(前海壹方城宝安中心店)',
  },
]

const mockRoomCategories: PsbRoomCategoryOption[] = [
  {
    roomCategoryId: 'room-category-001',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    roomCount: 1,
  },
  {
    roomCategoryId: 'room-category-002',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    roomCount: 1,
  },
  {
    roomCategoryId: 'room-category-003',
    roomCategoryName: '天落大床电竞套间',
    roomCount: 1,
  },
  {
    roomCategoryId: 'room-category-004',
    roomCategoryName: '观影大床房',
    roomCount: 1,
  },
]

export function createDefaultPsbPoliceFilters(
  searchParams = new URLSearchParams(),
): PsbPoliceFilters {
  return {
    campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export async function fetchPsbPolicePageData(
  filters: PsbPoliceFilters,
  signal?: AbortSignal,
  providerName = getPsbPoliceProviderName(),
): Promise<PsbPolicePageData> {
  validateFilters(filters)

  if (providerName === 'api') {
    throw new Error('PSB公安对接列表加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)

  if (filters.mockState === 'error') {
    throw new Error('PSB公安对接列表加载失败，请稍后重试')
  }

  const envelope = buildListEnvelope(filters)
  return adaptListEnvelope(envelope, providerName, filters)
}

export async function submitPsbPoliceRegistration(
  input: PsbPoliceSubmissionInput,
  filters: PsbPoliceFilters,
  signal?: AbortSignal,
  providerName = getPsbPoliceProviderName(),
): Promise<PsbPoliceSubmissionResult> {
  validateFilters(filters)
  validateSubmissionInput(input)

  if (providerName === 'api') {
    throw new Error('PSB公安对接资料提交失败，请稍后重试')
  }

  await waitForMockLatency(signal)

  if (filters.mockState === 'error') {
    throw new Error('PSB公安对接资料提交失败，请稍后重试')
  }

  const selectedStore =
    mockStores.find((store) => store.poiId === input.poiId) ?? mockStores[0]
  const roomCount = mockRoomCategories.reduce(
    (sum, category) => sum + category.roomCount,
    0,
  )

  return {
    traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie-submit-001',
    feedbackMessage: 'PSB公安对接商户已新增',
    createdRow: {
      id: `psb-row-${input.travelBusinessCode}`,
      systemName: input.systemName,
      hotelCode: input.hotelCode,
      typeLabel: '正式对接',
      merchantName: input.merchantName,
      storeName: selectedStore.poiName,
      roomCount,
    },
  }
}

function getPsbPoliceProviderName(): PsbPoliceProviderName {
  if (typeof window === 'undefined') return 'mock'
  const configured = window.localStorage.getItem(PSB_POLICE_PROVIDER_KEY)
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

function buildListEnvelope(
  filters: PsbPoliceFilters,
): UnifiedEnvelope<{
  rows: PsbPoliceRow[]
  stores: PsbStoreOption[]
  roomCategories: PsbRoomCategoryOption[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}> {
  const rows = filters.mockState === 'empty' ? [] : []

  return {
    code: 0,
    message: 'success',
    data: {
      rows,
      stores: mockStores,
      roomCategories: mockRoomCategories,
      pagination: {
        page: 1,
        pageSize: 20,
        total: rows.length,
      },
    },
    traceId: `mock-zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie-${filters.mockState}-001`,
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function adaptListEnvelope(
  envelope: UnifiedEnvelope<{
    rows: PsbPoliceRow[]
    stores: PsbStoreOption[]
    roomCategories: PsbRoomCategoryOption[]
    pagination: {
      page: number
      pageSize: number
      total: number
    }
  }>,
  provider: PsbPoliceProviderName,
  filters: PsbPoliceFilters,
): PsbPolicePageData {
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.message || 'PSB公安对接列表加载失败，请稍后重试')
  }

  return {
    provider,
    traceId: envelope.traceId,
    campId: filters.campId,
    rows: envelope.data.rows,
    stores: envelope.data.stores,
    roomCategories: envelope.data.roomCategories,
    pagination: envelope.data.pagination,
    requestSummary: [
      `provider: ${provider}`,
      'list: /account/roomPoliceSubmission/page/get',
      'stores: /select/poi/page/get',
      'rooms: /roomCategories/page/get',
      `traceId: ${envelope.traceId}`,
    ],
  }
}

function validateFilters(filters: PsbPoliceFilters) {
  if (!filters.campId.trim()) {
    throw new Error('PSB公安对接门店参数不正确')
  }
}

function validateSubmissionInput(input: PsbPoliceSubmissionInput) {
  const nameError = validatePersonName(input.registrantName)
  if (nameError) throw new Error(nameError)

  const credentialError = validateCredentialNumber('居民身份证', input.registrantIdNumber)
  if (credentialError) throw new Error(credentialError)
}

function toMockState(value: string | null): PsbPoliceMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 120)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
