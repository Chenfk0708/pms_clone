const SMART_ID_CARD_READER_PROVIDER_KEY = 'pms.smartIdCardReaderProvider'
const DEFAULT_CAMP_ID = '1796067693589061634'
const DEFAULT_TIMESTAMP = '2026-05-19T10:00:00+08:00'
const DASHBOARD_ENDPOINT = '/mock/smartHotel/idCardReader/dashboard'

export type SmartIdCardReaderProviderName = 'mock' | 'api'
export type SmartIdCardReaderMockState = 'success' | 'empty' | 'error'
export type SmartIdCardReaderDeviceStatus = 'all' | 'connected' | 'pending' | 'warning'
export type SmartIdCardReaderDatePreset = 'today' | '7d' | '30d'

export type SmartIdCardReaderFilters = {
  campId: string
  datePreset: SmartIdCardReaderDatePreset
  deviceStatus: SmartIdCardReaderDeviceStatus
  keyword: string
  mockState: SmartIdCardReaderMockState
}

export type SmartIdCardReaderMetric = {
  id: string
  label: string
  value: string
  detail: string
  tone: 'default' | 'success' | 'warning'
}

export type SmartIdCardReaderGuestPreview = {
  guestName: string
  maskedIdNumber: string
  roomType: string
  roomNo: string
}

export type SmartIdCardReaderRecord = {
  id: string
  guestName: string
  maskedIdNumber: string
  scannedAt: string
  roomType: string
  roomNo: string
  orderNo: string
  deviceName: string
  result: '已录入' | '待调试' | '需复核'
  resultTone: 'success' | 'warning' | 'default'
  deviceStatus: Exclude<SmartIdCardReaderDeviceStatus, 'all'>
  note: string
}

export type SmartIdCardReaderQuickLink = {
  id: string
  label: string
  description: string
  path: string
}

export type SmartIdCardReaderDashboard = {
  provider: SmartIdCardReaderProviderName
  traceId: string
  requestedAt: string
  requestedAtLabel: string
  versionLabel: string
  setupStatus: string
  currentBrand: string
  brandOptions: string[]
  assistantPackageName: string
  metrics: SmartIdCardReaderMetric[]
  guestPreview: SmartIdCardReaderGuestPreview
  records: SmartIdCardReaderRecord[]
  quickLinks: SmartIdCardReaderQuickLink[]
  emptyState?: {
    title: string
    description: string
  }
}

type SmartIdCardReaderEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type SmartIdCardReaderPayload = Omit<SmartIdCardReaderDashboard, 'provider' | 'traceId'>

const basePreview: SmartIdCardReaderGuestPreview = {
  guestName: '',
  maskedIdNumber: '',
  roomType: '读取后将自动匹配订单房型',
  roomNo: '读取后自动展示房间号',
}

const baseRecords: SmartIdCardReaderRecord[] = [
  {
    id: 'reader-record-001',
    guestName: '张小雅',
    maskedIdNumber: '4401********0621',
    scannedAt: '2026-05-19 09:12:18',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    roomNo: '1808',
    orderNo: 'LK202605190001',
    deviceName: '华视 CRD-3000',
    result: '已录入',
    resultTone: 'success',
    deviceStatus: 'connected',
    note: '已同步入住单与公安上报队列。',
  },
  {
    id: 'reader-record-002',
    guestName: '李文博',
    maskedIdNumber: '3205********4417',
    scannedAt: '2026-05-19 08:46:03',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    roomNo: '待分配',
    orderNo: 'LK202605190017',
    deviceName: '精伦 iDR212',
    result: '待调试',
    resultTone: 'warning',
    deviceStatus: 'pending',
    note: 'PMS 助手未完成串口授权，需要在前台电脑重新授权。',
  },
  {
    id: 'reader-record-003',
    guestName: '陈嘉欣',
    maskedIdNumber: '4403********1018',
    scannedAt: '2026-05-18 21:35:49',
    roomType: '天落大床电竞套间',
    roomNo: '1603',
    orderNo: 'LK202605180126',
    deviceName: '华视 CRD-3000',
    result: '需复核',
    resultTone: 'default',
    deviceStatus: 'warning',
    note: '证件人像已读取，但订单手机号与登记手机号不一致。',
  },
]

const quickLinks: SmartIdCardReaderQuickLink[] = [
  {
    id: 'smart-lock',
    label: '智能门锁',
    description: '查看门锁设备状态与密码下发策略。',
    path: '/smartHotel/smartHardware/smartLook',
  },
  {
    id: 'psb',
    label: '公安对接',
    description: '核对身份证读取后的登记与上报链路。',
    path: '/psb/list',
  },
  {
    id: 'mall',
    label: '智能硬件商城',
    description: '补充采购读卡器、门锁与自助机设备。',
    path: '/smartHotel/smartHardware/mall',
  },
  {
    id: 'global-setting',
    label: '全局设置',
    description: '联动自助入住与入住引导规则。',
    path: '/smartHotel/checkInGuide',
  },
]

export function createDefaultSmartIdCardReaderFilters(
  searchParams = new URLSearchParams(),
): SmartIdCardReaderFilters {
  return {
    campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
    datePreset: toDatePreset(searchParams.get('datePreset')),
    deviceStatus: toDeviceStatus(searchParams.get('deviceStatus')),
    keyword: searchParams.get('keyword')?.trim() || '',
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export async function fetchSmartIdCardReaderDashboard(
  filters: SmartIdCardReaderFilters,
  signal?: AbortSignal,
  providerName = getSmartIdCardReaderProviderName(),
): Promise<SmartIdCardReaderDashboard> {
  validateFilters(filters)

  if (providerName === 'api') {
    throw new Error('身份证读卡器数据加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)
  const envelope = buildMockEnvelope(filters)
  return adaptSmartIdCardReaderEnvelope(envelope, providerName)
}

export function getSmartIdCardReaderProviderName(): SmartIdCardReaderProviderName {
  if (typeof window === 'undefined') return 'mock'
  const configured = window.localStorage.getItem(SMART_ID_CARD_READER_PROVIDER_KEY)
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

export function getSmartIdCardReaderRequestSummary(
  filters: SmartIdCardReaderFilters,
  traceId: string,
) {
  return [
    `traceId=${traceId}`,
    `path=${DASHBOARD_ENDPOINT}`,
    `campId=${filters.campId}`,
    `datePreset=${filters.datePreset}`,
    `deviceStatus=${filters.deviceStatus}`,
    `keyword=${filters.keyword || '全部住客'}`,
    `mockState=${filters.mockState}`,
  ]
}

function buildMockEnvelope(
  filters: SmartIdCardReaderFilters,
): SmartIdCardReaderEnvelope<SmartIdCardReaderPayload> {
  if (filters.mockState === 'error') {
    return {
      code: 50304,
      message: '身份证读卡器数据加载失败，请稍后重试',
      data: createDashboardPayload([], filters, '已连接'),
      traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--shenfenzheng-dukaki-error-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  const records =
    filters.mockState === 'empty' ? [] : filterRecords(baseRecords, filters.deviceStatus, filters.keyword)

  const setupStatus = filters.deviceStatus === 'pending' ? '待调试' : '已连接'

  return {
    code: 0,
    message: 'success',
    data: createDashboardPayload(records, filters, setupStatus),
    traceId:
      filters.mockState === 'empty'
        ? 'mock-zhihui-jiudian--zhizhu-yu-yingjian--shenfenzheng-dukaki-empty-001'
        : 'mock-zhihui-jiudian--zhizhu-yu-yingjian--shenfenzheng-dukaki-success-001',
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function createDashboardPayload(
  records: SmartIdCardReaderRecord[],
  filters: SmartIdCardReaderFilters,
  setupStatus: string,
): SmartIdCardReaderPayload {
  const connectedCount = records.filter((record) => record.deviceStatus === 'connected').length
  const warningCount = records.filter((record) => record.deviceStatus !== 'connected').length
  const todayReadCount = records.length
  const successRate = todayReadCount
    ? `${Math.round((connectedCount / todayReadCount) * 1000) / 10}%`
    : '0%'

  return {
    requestedAt: DEFAULT_TIMESTAMP,
    requestedAtLabel: `最近同步：${formatTimestamp(DEFAULT_TIMESTAMP)}`,
    versionLabel: '版本号：v4.10.7',
    setupStatus,
    currentBrand: '华视',
    brandOptions: ['华视', '精伦', '新中新'],
    assistantPackageName: 'PMS 助手',
    metrics: [
      {
        id: 'device-count',
        label: '已接入设备',
        value: String(Math.max(connectedCount, filters.mockState === 'empty' ? 0 : 3)),
        detail: '前台电脑、备用前台与夜审工作站均已登记。',
        tone: 'default',
      },
      {
        id: 'success-rate',
        label: '今日读卡成功率',
        value: filters.mockState === 'empty' ? '0%' : successRate,
        detail: '读卡成功后会自动联动入住单与公安上报。',
        tone: 'success',
      },
      {
        id: 'warning-count',
        label: '待处理异常',
        value: String(filters.mockState === 'empty' ? 0 : Math.max(warningCount, 1)),
        detail: '包括串口授权、读卡失败与订单信息复核。',
        tone: 'warning',
      },
      {
        id: 'pending-checkin',
        label: '待读卡入住',
        value: String(filters.mockState === 'empty' ? 0 : Math.max(records.length, 2)),
        detail: '排队入住单可在前台直接完成身份证录入。',
        tone: 'default',
      },
    ],
    guestPreview: basePreview,
    records,
    quickLinks,
    emptyState:
      filters.mockState === 'empty'
        ? {
            title: '当前筛选条件下暂无读卡记录',
            description: '可先完成设备接入，再从待入住订单直接触发身份证读取。',
          }
        : undefined,
  }
}

function adaptSmartIdCardReaderEnvelope(
  envelope: SmartIdCardReaderEnvelope<SmartIdCardReaderPayload>,
  provider: SmartIdCardReaderProviderName,
): SmartIdCardReaderDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '身份证读卡器数据加载失败，请稍后重试')
  }

  return {
    ...envelope.data,
    provider,
    traceId: envelope.traceId,
  }
}

function filterRecords(
  records: SmartIdCardReaderRecord[],
  deviceStatus: SmartIdCardReaderDeviceStatus,
  keyword: string,
) {
  const normalizedKeyword = keyword.trim()
  return records.filter((record) => {
    if (deviceStatus !== 'all' && record.deviceStatus !== deviceStatus) return false
    if (!normalizedKeyword) return true

    return (
      record.guestName.includes(normalizedKeyword) ||
      record.maskedIdNumber.includes(normalizedKeyword) ||
      record.orderNo.includes(normalizedKeyword) ||
      record.deviceName.includes(normalizedKeyword)
    )
  })
}

function validateFilters(filters: SmartIdCardReaderFilters) {
  if (!filters.campId.trim()) {
    throw new Error('身份证读卡器门店参数不正确')
  }
}

function toMockState(value: string | null): SmartIdCardReaderMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}

function toDatePreset(value: string | null): SmartIdCardReaderDatePreset {
  return value === '7d' || value === '30d' ? value : 'today'
}

function toDeviceStatus(value: string | null): SmartIdCardReaderDeviceStatus {
  return value === 'connected' || value === 'pending' || value === 'warning' ? value : 'all'
}

function formatTimestamp(timestamp: string) {
  return timestamp.replace('T', ' ').slice(0, 16)
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  await new Promise<void>((resolve, reject) => {
    const timer = globalThis.setTimeout(resolve, 120)
    signal?.addEventListener(
      'abort',
      () => {
        globalThis.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
