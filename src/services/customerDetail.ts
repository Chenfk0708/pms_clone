import type { CustomerRecord } from './customerList'

export type CustomerDetailTab = 'profile' | 'member' | 'orders' | 'coupons'
export type CustomerDetailProvider = 'mock' | 'api'

export type CustomerFollowRecord = {
  id: string
  owner: string
  time: string
  content: string
}

export type CustomerAssetCard = {
  title: string
  lines: string[]
  action?: string
  placeholder?: string
}

export type CustomerDetailData = {
  provider: CustomerDetailProvider
  endpoint: string
  requestBody: Record<string, unknown>
  id: string
  name: string
  mobile: string
  avatarText: string
  customerNo: string
  memberLevel: string
  customerStatus: string
  becomeCustomerTime: string
  followPublicAccountTime: string
  channelText: string
  tags: string[]
  basicInfo: Array<{ label: string; value: string }>
  followRecords: CustomerFollowRecord[]
  assetCards: CustomerAssetCard[]
  tradeInfo: Array<{ label: string; value: string }>
}

type HudsonResponse<T> = {
  code?: number
  message?: string | null
  success?: boolean
  errorCode?: string | number | null
  errorMsg?: string | null
  errorDetail?: string | null
  data?: T | null
  traceId?: string | null
  timestamp?: string | null
}

type RawCustomerDetail = {
  customerId?: string
  memberId?: string
  name?: string
  nickName?: string
  mobile?: string
  memberNo?: string
  memberCardName?: string | null
  profileJson?: string | null
  lastActiveAt?: string | null
  status?: number | null
}

type CustomerDetailInput = CustomerRecord | string | null | undefined

export const CUSTOMER_DETAIL_PATH = '/customers/detail/get'
export const CUSTOMER_DETAIL_PROVIDER = 'mock'
const DEFAULT_CAMP_ID = '10001'

const defaultDetail: CustomerDetailData = {
  provider: 'mock',
  endpoint: 'static-customer-detail',
  requestBody: {},
  id: '1801949727954239490',
  name: 'pTu748894801',
  mobile: '2729',
  avatarText: 'P',
  customerNo: '1801949727954239490',
  memberLevel: '普通会员',
  customerStatus: '正常',
  becomeCustomerTime: '2024-06-15 08:07:48',
  followPublicAccountTime: '-',
  channelText: '美团民宿（首次）',
  tags: [],
  basicInfo: [
    { label: '手机号', value: '2729' },
    { label: '姓名', value: 'pTu748894801' },
    { label: '生日', value: '-' },
    { label: '性别', value: '-' },
    { label: '地区', value: '-' },
    { label: '微信', value: '-' },
    { label: '邮箱', value: '-' },
    { label: 'QQ', value: '-' },
    { label: '是否加微信', value: '-' },
    { label: '是否加群', value: '-' },
    { label: '备注', value: '-' },
  ],
  followRecords: [],
  assetCards: [
    {
      title: '优惠券',
      lines: ['可用优惠券 0', '已失效 0', '已使用 0'],
      action: '送优惠券',
    },
    {
      title: '积分',
      lines: [],
      placeholder: '后续更新，敬请期待',
    },
    {
      title: '账户余额',
      lines: [],
      placeholder: '后续更新，敬请期待',
    },
  ],
  tradeInfo: [
    { label: '最近交易时间', value: '2024/05/30' },
    { label: '最近消费金额', value: '19.8' },
    { label: '累计消费金额', value: '19.8' },
    { label: '累计消费次数', value: '1' },
    { label: '客单价', value: '19.8' },
  ],
}

export async function fetchCustomerDetail(customer: CustomerDetailInput, signal?: AbortSignal): Promise<CustomerDetailData> {
  if (resolveProvider() === 'api') {
    const customerId = typeof customer === 'string' ? customer : customer?.id
    return fetchApiCustomerDetail(customerId, signal)
  }

  await delay(120, signal)

  if (!customer) {
    return defaultDetail
  }

  if (typeof customer === 'string') {
    if (!customer) {
      return defaultDetail
    }

    return {
      ...defaultDetail,
      id: customer,
      customerNo: customer,
      requestBody: {
        customerId: customer,
      },
    }
  }

  return {
    ...defaultDetail,
    id: customer.id,
    name: customer.name,
    mobile: customer.mobile,
    avatarText: customer.name.slice(0, 1).toUpperCase(),
    customerNo: customer.memberNo,
    memberLevel: customer.memberCardName,
    customerStatus: '正常',
    becomeCustomerTime: customer.firstMemberTime,
    channelText: `${customer.channelName}${customer.channelName === '-' ? '' : '（首次）'}`,
    tags: customer.tagNames,
    tradeInfo: [
      { label: '最近交易时间', value: customer.lastConsumeTime === '-' ? '-' : customer.lastConsumeTime.slice(0, 10).replace(/-/g, '/') },
      { label: '最近消费金额', value: customer.lastConsumePrice },
      { label: '累计消费金额', value: customer.totalConsumePrice },
      { label: '累计消费次数', value: customer.totalConsumeCount },
      { label: '客单价', value: customer.avgConsumePrice },
    ],
  }
}

async function fetchApiCustomerDetail(customerId: string | undefined, signal?: AbortSignal): Promise<CustomerDetailData> {
  if (!customerId) {
    throw new Error('客户详情缺少 customerId')
  }

  const requestBody = {
    campId: resolveCampId(),
    customerId,
  }
  const response = await fetch(`/api${CUSTOMER_DETAIL_PATH}`, {
    method: 'POST',
    credentials: 'include',
    headers: createJsonHeaders(),
    body: JSON.stringify(requestBody),
    signal,
  })
  const payload = (await response.json().catch(() => null)) as HudsonResponse<RawCustomerDetail> | null
  if (!response.ok || isFailedResponse(payload) || !payload?.data) {
    throw new Error(extractErrorMessage(payload) || `${CUSTOMER_DETAIL_PATH} HTTP ${response.status}`)
  }

  return adaptApiCustomerDetail(payload.data, requestBody)
}

function adaptApiCustomerDetail(raw: RawCustomerDetail, requestBody: Record<string, unknown>): CustomerDetailData {
  const profile = parseObject(raw.profileJson)
  const id = readString(raw.customerId) || readString(raw.memberId) || readString(requestBody.customerId)
  const name = readString(raw.name) || readString(raw.nickName) || readString(profile.name) || '-'
  const mobile = readString(raw.mobile) || readString(profile.mobile) || '-'
  const memberCardName = readString(raw.memberCardName) || readString(profile.memberCardName) || '-'
  const channelName = readString(profile.channelName) || '-'
  const tagNames = readStringArray(profile.tagNames)
  const followRecords = readFollowRecords(profile.followRecords)
  const lastConsumeTime = readString(profile.lastConsumeTime) || readString(raw.lastActiveAt) || '-'

  return {
    ...defaultDetail,
    provider: 'api',
    endpoint: CUSTOMER_DETAIL_PATH,
    requestBody,
    id,
    name,
    mobile,
    avatarText: name === '-' ? '-' : name.slice(0, 1).toUpperCase(),
    customerNo: readString(raw.memberNo) || readString(profile.memberNo) || id,
    memberLevel: memberCardName,
    customerStatus: readString(profile.memberStatusText) || statusText(raw.status),
    becomeCustomerTime: readString(profile.firstMemberTime) || '-',
    followPublicAccountTime: readString(profile.followPublicAccountTime) || '-',
    channelText: `${channelName}${channelName === '-' ? '' : '（首次）'}`,
    tags: tagNames,
    basicInfo: [
      { label: '手机号', value: mobile },
      { label: '姓名', value: name },
      { label: '生日', value: readString(profile.birthday) || '-' },
      { label: '性别', value: readString(profile.gender) || '-' },
      { label: '地区', value: readString(profile.region) || '-' },
      { label: '微信', value: readString(profile.wechat) || '-' },
      { label: '邮箱', value: readString(profile.email) || '-' },
      { label: 'QQ', value: readString(profile.qq) || '-' },
      { label: '是否加微信', value: yesNo(readNullableNumber(profile.isJoinWxCp)) },
      { label: '是否加群', value: yesNo(readNullableNumber(profile.isJoinGroup)) },
      { label: '备注', value: readString(profile.remark) || '-' },
    ],
    followRecords,
    assetCards: [
      {
        title: '优惠券',
        lines: [
          `可用优惠券 ${readNumber(profile.couponAvailable)}`,
          `已失效 ${readNumber(profile.couponExpired)}`,
          `已使用 ${readNumber(profile.couponUsed)}`,
        ],
        action: '送优惠券',
      },
      {
        title: '积分',
        lines: [`当前积分 ${readNumber(profile.points)}`],
      },
      {
        title: '账户余额',
        lines: [`余额 ${formatDisplayMoney(profile.balance)}`],
      },
    ],
    tradeInfo: [
      { label: '最近交易时间', value: lastConsumeTime === '-' ? '-' : lastConsumeTime.slice(0, 10).replace(/-/g, '/') },
      { label: '最近消费金额', value: formatCentMoney(readNullableNumber(profile.lastConsumePrice)) },
      { label: '累计消费金额', value: formatCentMoney(readNullableNumber(profile.totalConsumePrice)) },
      { label: '累计消费次数', value: String(readNumber(profile.totalConsumeCount)) },
      { label: '客单价', value: formatCentMoney(readNullableNumber(profile.avgConsumePrice)) },
    ],
  }
}

function resolveProvider(): CustomerDetailProvider {
  const configured =
    readRuntimeConfig('pms.customerDetail.provider') ||
    readRuntimeConfig('pmsCustomerDetailProvider') ||
    (import.meta.env.VITE_CUSTOMER_DETAIL_PROVIDER as string | undefined) ||
    (import.meta.env.VITE_PMS_CUSTOMER_DETAIL_PROVIDER as string | undefined) ||
    CUSTOMER_DETAIL_PROVIDER
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

function createJsonHeaders() {
  const headers = new Headers({ 'content-type': 'application/json' })
  const token = readRuntimeConfig('pms_token')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

function isFailedResponse(payload: HudsonResponse<unknown> | null) {
  if (!payload) return false
  if (payload.code !== undefined) return payload.code !== 0
  return payload.success === false
}

function extractErrorMessage(payload: HudsonResponse<unknown> | null) {
  if (!payload) return ''
  return String(payload.message || payload.errorMsg || payload.errorDetail || payload.errorCode || '')
}

function resolveCampId() {
  return (
    readRuntimeConfig('pmsCampId') ||
    readRuntimeConfig('pms.currentCampId') ||
    readCampIdFromStoredObject('pms.currentCamp') ||
    readCampIdFromStoredObject('pms.camp') ||
    (import.meta.env.VITE_PMS_CAMP_ID as string | undefined) ||
    DEFAULT_CAMP_ID
  )
}

function readCampIdFromStoredObject(key: string) {
  const raw = readRuntimeConfig(key)
  if (!raw) return ''
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    return readString(value.campId) || readString(value.id) || ''
  } catch {
    return ''
  }
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function parseObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function readFollowRecords(value: unknown): CustomerFollowRecord[] {
  if (!Array.isArray(value)) return []
  return value.map((item, index) => {
    const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    return {
      id: readString(record.id) || `follow-${index}`,
      owner: readString(record.owner) || '-',
      time: readString(record.time) || '-',
      content: readString(record.content) || '-',
    }
  })
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => readString(item)).filter(Boolean) : []
}

function readString(value: unknown) {
  return value === null || value === undefined || value === '' ? '' : String(value)
}

function readNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function readNumber(value: unknown) {
  return readNullableNumber(value) ?? 0
}

function formatCentMoney(value: number | null) {
  if (value === null || value === undefined) return '-'
  return (value / 100).toFixed(2)
}

function formatDisplayMoney(value: unknown) {
  const numeric = readNullableNumber(value)
  if (numeric === null) return '0.00'
  return numeric.toFixed(2)
}

function statusText(value: number | null | undefined) {
  if (value === 1) return '正常'
  if (value === 0) return '停用'
  return '-'
}

function yesNo(value: number | null) {
  if (value === 1) return '是'
  if (value === 0) return '否'
  return '-'
}

function delay(ms: number, signal?: AbortSignal) {
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
