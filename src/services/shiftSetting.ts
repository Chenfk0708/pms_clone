const SHIFT_SETTING_PROVIDER_KEY = 'pms.shiftSettingProvider'

export const SHIFT_SETTING_CONFIG_PATH = '/shiftWorkConfig/page/get'
export const SHIFT_SETTING_GOODS_PATH = '/shiftWorkGoods/page/get'
export const SHIFT_SETTING_MEMBER_PATH = '/campRoles/get'

const realBaseUrl = 'https://hudson-prod.localhome.cn'
const defaultCampId = '1796067693589061634'

export type ShiftSettingProviderName = 'mock' | 'api'
export type ShiftSettingMockState = 'success' | 'empty' | 'error'

export type ShiftSettingFilters = {
  campId: string
  mockState: ShiftSettingMockState
}

export type ShiftMemberOption = {
  value: string
  label: string
}

export type ShiftConfig = {
  id: string
  name: string
  startTime: string
  endTime: string
  memberIds: string[]
  memberNames: string[]
  updatedAt: string
}

export type ShiftGoodsItem = {
  id: string
  name: string
  updatedAt: string
}

export type ShiftSettingDashboard = {
  filters: ShiftSettingFilters
  provider: ShiftSettingProviderName
  shiftConfigs: ShiftConfig[]
  goodsConfigs: ShiftGoodsItem[]
  memberOptions: ShiftMemberOption[]
  requestedAt: string
  audit: string[]
}

export type ShiftConfigDraft = {
  id?: string
  name: string
  startTime: string
  endTime: string
  memberIds: string[]
}

export type ShiftGoodsDraft = {
  id?: string
  name: string
}

export type ShiftSettingMutationResult = {
  provider: ShiftSettingProviderName
  message: string
  dashboard: ShiftSettingDashboard
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HudsonEnvelope<T> = {
  success?: boolean
  errorCode?: string | null
  errorMsg?: string | null
  errorDetail?: string | null
  data?: T
}

type ShiftSettingPayload = {
  shiftConfigs: ShiftConfig[]
  goodsConfigs: ShiftGoodsItem[]
  memberOptions: ShiftMemberOption[]
}

const baseMemberOptions: ShiftMemberOption[] = [
  { value: 'member-1', label: '路客云6TS5' },
  { value: 'member-2', label: '陈早班' },
  { value: 'member-3', label: '李前台' },
  { value: 'member-4', label: '王夜班' },
]

const baseShiftConfigs: ShiftConfig[] = [
  {
    id: 'shift-1',
    name: '早班',
    startTime: '08:00',
    endTime: '16:00',
    memberIds: ['member-1', 'member-2'],
    memberNames: ['路客云6TS5', '陈早班'],
    updatedAt: '2026-05-19 11:18:34',
  },
  {
    id: 'shift-2',
    name: '夜班',
    startTime: '16:00',
    endTime: '23:30',
    memberIds: ['member-3', 'member-4'],
    memberNames: ['李前台', '王夜班'],
    updatedAt: '2026-05-19 11:18:34',
  },
]

const baseGoodsConfigs: ShiftGoodsItem[] = [
  {
    id: 'goods-1',
    name: '房卡',
    updatedAt: '2026-05-19 11:18:34',
  },
  {
    id: 'goods-2',
    name: '备用金',
    updatedAt: '2026-05-19 11:18:34',
  },
]

let mockShiftConfigs = cloneShiftConfigs(baseShiftConfigs)
let mockGoodsConfigs = cloneGoodsConfigs(baseGoodsConfigs)

export function createDefaultShiftSettingFilters(searchParams = new URLSearchParams()): ShiftSettingFilters {
  return {
    campId: searchParams.get('campId') || defaultCampId,
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export async function fetchShiftSettingDashboard(
  filters: ShiftSettingFilters,
  providerName = getShiftSettingProviderName(),
  signal?: AbortSignal,
): Promise<ShiftSettingDashboard> {
  validateFilters(filters)

  if (providerName === 'api') {
    return fetchApiShiftSettingDashboard(filters, signal)
  }

  const envelope = await fetchMockShiftSettingDashboard(filters, signal)
  return adaptShiftSettingEnvelope(envelope, filters, providerName)
}

export async function saveShiftConfigs(
  filters: ShiftSettingFilters,
  drafts: ShiftConfigDraft[],
  providerName = getShiftSettingProviderName(),
  signal?: AbortSignal,
): Promise<ShiftSettingMutationResult> {
  validateFilters(filters)
  validateShiftDrafts(drafts)

  if (providerName === 'api') {
    throw new Error('交接班设置保存接口暂未接入，请稍后重试')
  }

  await delay(120, signal)
  mockShiftConfigs = drafts.map((draft, index) => toShiftConfig(draft, index))
  const dashboard = adaptShiftSettingEnvelope(
    createMockSuccessEnvelope(filters, {
      shiftConfigs: mockShiftConfigs,
      goodsConfigs: mockGoodsConfigs,
      memberOptions: baseMemberOptions,
    }),
    filters,
    providerName,
  )

  return {
    provider: providerName,
    message: '已保存班次设置',
    dashboard,
  }
}

export async function saveShiftGoods(
  filters: ShiftSettingFilters,
  drafts: ShiftGoodsDraft[],
  providerName = getShiftSettingProviderName(),
  signal?: AbortSignal,
): Promise<ShiftSettingMutationResult> {
  validateFilters(filters)
  validateGoodsDrafts(drafts)

  if (providerName === 'api') {
    throw new Error('交班物品保存接口暂未接入，请稍后重试')
  }

  await delay(120, signal)
  mockGoodsConfigs = drafts.map((draft, index) => toShiftGoodsItem(draft, index))
  const dashboard = adaptShiftSettingEnvelope(
    createMockSuccessEnvelope(filters, {
      shiftConfigs: mockShiftConfigs,
      goodsConfigs: mockGoodsConfigs,
      memberOptions: baseMemberOptions,
    }),
    filters,
    providerName,
  )

  return {
    provider: providerName,
    message: '已保存交班物品',
    dashboard,
  }
}

function getShiftSettingProviderName(): ShiftSettingProviderName {
  if (typeof window === 'undefined') return 'mock'
  const configured = window.localStorage.getItem(SHIFT_SETTING_PROVIDER_KEY)?.trim()
  return configured === 'api' ? 'api' : 'mock'
}

async function fetchMockShiftSettingDashboard(
  filters: ShiftSettingFilters,
  signal?: AbortSignal,
): Promise<UnifiedEnvelope<ShiftSettingPayload>> {
  await delay(180, signal)

  if (filters.mockState === 'error') {
    return {
      code: 50310,
      message: '交接班设置加载失败，请稍后重试',
      data: {
        shiftConfigs: [],
        goodsConfigs: [],
        memberOptions: baseMemberOptions,
      },
      traceId: 'mock-shezhi--tongyong-shezhi--jiaojieban-shezhi-error-001',
      timestamp: '2026-05-19T11:18:34+08:00',
    }
  }

  if (filters.mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: {
        shiftConfigs: [],
        goodsConfigs: [],
        memberOptions: baseMemberOptions,
      },
      traceId: 'mock-shezhi--tongyong-shezhi--jiaojieban-shezhi-empty-001',
      timestamp: '2026-05-19T11:18:34+08:00',
    }
  }

  return createMockSuccessEnvelope(filters, {
    shiftConfigs: mockShiftConfigs,
    goodsConfigs: mockGoodsConfigs,
    memberOptions: baseMemberOptions,
  })
}

function createMockSuccessEnvelope(filters: ShiftSettingFilters, payload: ShiftSettingPayload) {
  return {
    code: 0,
    message: 'success',
    data: {
      shiftConfigs: cloneShiftConfigs(payload.shiftConfigs),
      goodsConfigs: cloneGoodsConfigs(payload.goodsConfigs),
      memberOptions: payload.memberOptions.map((item) => ({ ...item })),
    },
    traceId:
      filters.mockState === 'empty'
        ? 'mock-shezhi--tongyong-shezhi--jiaojieban-shezhi-empty-001'
        : 'mock-shezhi--tongyong-shezhi--jiaojieban-shezhi-success-001',
    timestamp: '2026-05-19T11:18:34+08:00',
  } satisfies UnifiedEnvelope<ShiftSettingPayload>
}

function adaptShiftSettingEnvelope(
  envelope: UnifiedEnvelope<ShiftSettingPayload>,
  filters: ShiftSettingFilters,
  provider: ShiftSettingProviderName,
): ShiftSettingDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '交接班设置加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !Array.isArray(data.shiftConfigs) || !Array.isArray(data.goodsConfigs) || !Array.isArray(data.memberOptions)) {
    throw new Error('交接班设置响应结构异常，请稍后重试')
  }

  return {
    filters,
    provider,
    shiftConfigs: cloneShiftConfigs(data.shiftConfigs),
    goodsConfigs: cloneGoodsConfigs(data.goodsConfigs),
    memberOptions: data.memberOptions.map((item) => ({ ...item })),
    requestedAt: envelope.timestamp,
    audit: [
      `provider=${provider}`,
      `configPath=${SHIFT_SETTING_CONFIG_PATH}`,
      `goodsPath=${SHIFT_SETTING_GOODS_PATH}`,
      `memberPath=${SHIFT_SETTING_MEMBER_PATH}`,
      `campId=${filters.campId}`,
      `mockState=${filters.mockState}`,
      `shiftCount=${data.shiftConfigs.length}`,
      `goodsCount=${data.goodsConfigs.length}`,
      `memberCount=${data.memberOptions.length}`,
      `traceId=${envelope.traceId}`,
    ],
  }
}

async function fetchApiShiftSettingDashboard(
  filters: ShiftSettingFilters,
  signal?: AbortSignal,
): Promise<ShiftSettingDashboard> {
  const [configPayload, goodsPayload, memberPayload] = await Promise.all([
    postHudson<Record<string, unknown>>(SHIFT_SETTING_CONFIG_PATH, { campId: filters.campId, pageNum: 1, pageSize: 999 }, signal),
    postHudson<Record<string, unknown>>(SHIFT_SETTING_GOODS_PATH, { campId: filters.campId, pageNum: 1, pageSize: 999 }, signal),
    postHudson<Record<string, unknown>>(SHIFT_SETTING_MEMBER_PATH, { campId: filters.campId }, signal),
  ])

  const memberOptions = adaptMemberOptions(memberPayload)
  const shiftConfigs = asArray(configPayload.list ?? configPayload.records ?? configPayload.data).map((item, index) =>
    adaptApiShiftConfig(item, memberOptions, index),
  )
  const goodsConfigs = asArray(goodsPayload.list ?? goodsPayload.records ?? goodsPayload.data).map((item, index) =>
    adaptApiGoodsItem(item, index),
  )

  return {
    filters,
    provider: 'api',
    shiftConfigs,
    goodsConfigs,
    memberOptions,
    requestedAt: new Date().toISOString(),
    audit: [
      'provider=api',
      `configPath=${SHIFT_SETTING_CONFIG_PATH}`,
      `goodsPath=${SHIFT_SETTING_GOODS_PATH}`,
      `memberPath=${SHIFT_SETTING_MEMBER_PATH}`,
      `campId=${filters.campId}`,
      `mockState=${filters.mockState}`,
      `shiftCount=${shiftConfigs.length}`,
      `goodsCount=${goodsConfigs.length}`,
      `memberCount=${memberOptions.length}`,
    ],
  }
}

async function postHudson<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${realBaseUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: HudsonEnvelope<T> | null
  try {
    payload = (await response.json()) as HudsonEnvelope<T>
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.errorMsg || payload?.errorDetail || payload?.errorCode || `${path} 请求失败，HTTP ${response.status}`)
  }

  if (!payload || payload.data === undefined || payload.data === null) {
    throw new Error(`${path} 响应缺少 data 字段`)
  }

  return payload.data
}

function adaptApiShiftConfig(value: unknown, memberOptions: ShiftMemberOption[], index: number): ShiftConfig {
  const record = asRecord(value)
  const memberIds = asArray(record.memberIds ?? record.userIds ?? record.shiftUserIds)
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
  const fallbackMemberNames = readString(record, ['memberNames', 'memberName', 'userNames'])
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
  const memberNames =
    memberIds.length > 0
      ? memberIds
          .map((id) => memberOptions.find((option) => option.value === id)?.label || '')
          .filter(Boolean)
      : fallbackMemberNames

  return {
    id: readString(record, ['id', 'shiftWorkConfigId']) || `api-shift-${index + 1}`,
    name: readString(record, ['shiftName', 'name', 'workName']) || `班次${index + 1}`,
    startTime: normalizeTime(readString(record, ['startTime', 'beginTime', 'workStartTime'])),
    endTime: normalizeTime(readString(record, ['endTime', 'finishTime', 'workEndTime'])),
    memberIds,
    memberNames,
    updatedAt: readString(record, ['updateTime', 'updatedAt', 'createTime']),
  }
}

function adaptApiGoodsItem(value: unknown, index: number): ShiftGoodsItem {
  const record = asRecord(value)
  return {
    id: readString(record, ['id', 'shiftWorkGoodsId']) || `api-goods-${index + 1}`,
    name: readString(record, ['goodsName', 'name']) || `物品${index + 1}`,
    updatedAt: readString(record, ['updateTime', 'updatedAt', 'createTime']),
  }
}

function adaptMemberOptions(payload: Record<string, unknown>) {
  const candidates = [
    ...asArray(payload.employees),
    ...asArray(payload.list),
    ...asArray(payload.records),
  ]

  const options = candidates
    .map((item) => {
      const record = asRecord(item)
      return {
        value: readString(record, ['userId', 'value', 'id']),
        label: readString(record, ['displayName', 'userName', 'name']),
      }
    })
    .filter((item) => item.value && item.label)

  return options.length > 0 ? options : baseMemberOptions.map((item) => ({ ...item }))
}

function toShiftConfig(draft: ShiftConfigDraft, index: number): ShiftConfig {
  const memberIds = draft.memberIds.map((item) => item.trim()).filter(Boolean)
  const memberNames = memberIds
    .map((memberId) => baseMemberOptions.find((option) => option.value === memberId)?.label || '')
    .filter(Boolean)

  return {
    id: draft.id?.trim() || `shift-${index + 1}`,
    name: draft.name.trim(),
    startTime: normalizeTime(draft.startTime),
    endTime: normalizeTime(draft.endTime),
    memberIds,
    memberNames,
    updatedAt: '2026-05-19 11:18:34',
  }
}

function toShiftGoodsItem(draft: ShiftGoodsDraft, index: number): ShiftGoodsItem {
  return {
    id: draft.id?.trim() || `goods-${index + 1}`,
    name: draft.name.trim(),
    updatedAt: '2026-05-19 11:18:34',
  }
}

function validateFilters(filters: ShiftSettingFilters) {
  if (!filters.campId.trim()) {
    throw new Error('交接班设置缺少门店营地参数')
  }
}

function validateShiftDrafts(drafts: ShiftConfigDraft[]) {
  if (drafts.length === 0) {
    throw new Error('请至少保留一条班次配置')
  }

  drafts.forEach((draft, index) => {
    if (!draft.name.trim()) {
      throw new Error(`请填写第 ${index + 1} 条班次名称`)
    }
    if (!draft.startTime.trim()) {
      throw new Error(`请选择第 ${index + 1} 条开始时间`)
    }
    if (!draft.endTime.trim()) {
      throw new Error(`请选择第 ${index + 1} 条结束时间`)
    }
    if (draft.memberIds.length === 0) {
      throw new Error(`请选择第 ${index + 1} 条班次成员`)
    }
  })
}

function validateGoodsDrafts(drafts: ShiftGoodsDraft[]) {
  if (drafts.length === 0) {
    throw new Error('请至少保留一条交班物品')
  }

  drafts.forEach((draft, index) => {
    if (!draft.name.trim()) {
      throw new Error(`请填写第 ${index + 1} 条物品名称`)
    }
  })
}

function toMockState(value: string | null): ShiftSettingMockState {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}

function normalizeTime(value: string) {
  if (!value) return ''
  const matched = value.match(/(\d{2}):(\d{2})/)
  return matched ? `${matched[1]}:${matched[2]}` : value
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function cloneShiftConfigs(items: ShiftConfig[]) {
  return items.map((item) => ({
    ...item,
    memberIds: [...item.memberIds],
    memberNames: [...item.memberNames],
  }))
}

function cloneGoodsConfigs(items: ShiftGoodsItem[]) {
  return items.map((item) => ({ ...item }))
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
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
