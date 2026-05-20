export const CUSTOMER_LIST_PATH = '/member/page/get'
export const CUSTOMER_EXPORT_PATH = '/member/export/create'
export const CUSTOMER_SAVE_PATH = '/member/save'
export const CUSTOMER_PROVIDER = 'mock'

export type CustomerListScenario = 'success' | 'empty' | 'error'
export type CustomerStatus = '' | 'NORMAL' | 'FROZEN' | 'BLACKLIST'
export type CustomerIdentity = '' | 'MEMBER' | 'WECHAT' | 'CHANNEL'
export type CustomerWechatState = '' | 'JOINED' | 'NOT_JOINED'
export type CustomerGender = '' | 'MALE' | 'FEMALE' | 'UNKNOWN'

export type CustomerListQuery = {
  campId: string
  pageNum: number
  pageSize: number
  memberSearchType: 'mobile' | 'name' | 'memberNo'
  keyword: string
  status: CustomerStatus
  identity: CustomerIdentity
  memberCardId: string
  wechatState: CustomerWechatState
  gender: CustomerGender
  ageRange: string
  firstMemberStartTime: string
  firstMemberEndTime: string
  firstMemberCardStartTime: string
  firstMemberCardEndTime: string
  lastFollowStartTime: string
  lastFollowEndTime: string
  lastConsumeStartTime: string
  lastConsumeEndTime: string
  lastConsumeMin: string
  lastConsumeMax: string
  totalConsumeMin: string
  totalConsumeMax: string
  avgConsumeMin: string
  avgConsumeMax: string
  scenario?: CustomerListScenario
}

export type CustomerOption = {
  id: string
  label: string
}

export type CustomerRecord = {
  id: string
  name: string
  mobile: string
  memberNo: string
  channelName: string
  memberCardName: string
  tagNames: string[]
  lastConsumePrice: string
  totalConsumeCount: string
  totalConsumePrice: string
  avgConsumePrice: string
  isJoinWxCp: string
  isJoinWx: string
  isJoinGroup: string
  firstMemberTime: string
  firstMemberCardTime: string
  lastConsumeTime: string
  lastFollowTime: string
  remark: string
}

export type CustomerListDashboard = {
  provider: 'mock' | 'api'
  endpoint: string
  requestBody: Record<string, unknown>
  statusOptions: Array<CustomerOption & { id: CustomerStatus }>
  identityOptions: Array<CustomerOption & { id: CustomerIdentity }>
  memberCardOptions: CustomerOption[]
  wechatOptions: Array<CustomerOption & { id: CustomerWechatState }>
  genderOptions: Array<CustomerOption & { id: CustomerGender }>
  ageOptions: CustomerOption[]
  summary: {
    total: number
    normal: number
    joinedWechat: number
    highValue: number
  }
  rows: CustomerRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
    hasNextPage: boolean
  }
  traceId: string
  timestamp: string
}

export type CustomerSaveInput = {
  mobile: string
  name: string
  gender: string
  channelName: string
  firstMemberTime: string
  remark: string
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HudsonResponse<T> = {
  success?: boolean
  errorCode?: string | null
  errorMsg?: string | null
  errorDetail?: string | null
  data?: T
}

type RawCustomer = {
  memberId: string
  campId: string
  memberNo: string
  headImage: string | null
  nickName: string
  mobile: string
  name: string
  gender: number | null
  firstMemberTime: number | string | null
  isJoinWxCp: number | null
  memberIdentity: string | null
  lastFollowTime: number | string | null
  isJoinWx: number | null
  isJoinGroup: number | null
  memberCardName: string | null
  firstMemberCardTime: number | string | null
  lastConsumeTime: number | string | null
  lastConsumePrice: number | null
  totalConsumePrice: number | null
  totalConsumeCount: number | null
  avgConsumePrice: number | null
  channelId: string
  channelName: string
  memberCardId: string | null
  memberStatus: CustomerStatus
  remark: string | null
  age: number | null
  memberTagViews: Array<{ tagName?: string }>
}

type RawCustomerListData = {
  total: number
  size: number
  current: number
  pageNum: number
  hasNextPage: boolean
  pages: number
  list: RawCustomer[]
}

const generatedAt = '2026-05-18T10:00:00+08:00'
const tracePrefix = 'mock-scrm--kehu-guanli--kehu-liebiao'
const defaultCampId = '1796067693589061634'
const normalMemberCardId = '1796067693727473665'

export const customerStatusOptions: Array<CustomerOption & { id: CustomerStatus }> = [
  { id: '', label: '全部' },
  { id: 'NORMAL', label: '正常' },
  { id: 'FROZEN', label: '冻结' },
  { id: 'BLACKLIST', label: '黑名单' },
]

export const customerIdentityOptions: Array<CustomerOption & { id: CustomerIdentity }> = [
  { id: '', label: '全部客户' },
  { id: 'MEMBER', label: '会员客户' },
  { id: 'WECHAT', label: '企微客户' },
  { id: 'CHANNEL', label: '渠道客户' },
]

export const memberCardOptions: CustomerOption[] = [
  { id: '', label: '全部会员等级' },
  { id: normalMemberCardId, label: '普通会员' },
  { id: 'silver-card', label: '银卡会员' },
  { id: 'gold-card', label: '金卡会员' },
  { id: 'diamond-card', label: '钻石会员' },
]

export const customerWechatOptions: Array<CustomerOption & { id: CustomerWechatState }> = [
  { id: '', label: '全部' },
  { id: 'JOINED', label: '已添加' },
  { id: 'NOT_JOINED', label: '未添加' },
]

export const customerGenderOptions: Array<CustomerOption & { id: CustomerGender }> = [
  { id: '', label: '全部' },
  { id: 'MALE', label: '男' },
  { id: 'FEMALE', label: '女' },
  { id: 'UNKNOWN', label: '未知' },
]

export const customerAgeOptions: CustomerOption[] = [
  { id: '', label: '全部' },
  { id: '18-25', label: '18-25' },
  { id: '26-35', label: '26-35' },
  { id: '36-45', label: '36-45' },
  { id: '46+', label: '46岁以上' },
]

const rawCustomers: RawCustomer[] = [
  rawCustomer('1810493396951339010', '任清明', '13141204230', '携程', 63720, 1, '2024-07-09 09:57:17', {
    memberIdentity: 'WECHAT',
    isJoinWxCp: 1,
    isJoinWx: 1,
    isJoinGroup: 0,
    gender: 1,
    age: 31,
    lastFollowTime: '2024-07-09 13:20:00',
    remark: '高价值会员',
    tagNames: ['高净值', '近期消费'],
  }),
  rawCustomer('1862465040109776897', 'izu262346024', '0110', '美团民宿', null, null, '2024-11-29 19:54:03', {
    memberIdentity: 'CHANNEL',
    memberStatus: 'FROZEN',
    isJoinWxCp: 0,
    isJoinWx: 0,
    isJoinGroup: 0,
    gender: 2,
    age: 24,
  }),
  rawCustomer('1796067694142693378', '路客云6TS5', '18100001382', '自来客', null, null, '2024-05-30 14:34:42', {
    memberCardId: null,
    memberIdentity: 'MEMBER',
    memberStatus: 'NORMAL',
    isJoinWxCp: 0,
    isJoinWx: 0,
    isJoinGroup: 0,
    gender: 1,
    age: 42,
  }),
  rawCustomer('1801949715195166722', 'GHq721352403', '8788', '美团民宿', 1980, 3, '2024-06-15 20:07:45', {
    totalConsumePrice: 5940,
    memberIdentity: 'MEMBER',
    isJoinWxCp: 1,
    isJoinWx: 1,
    isJoinGroup: 1,
    gender: 2,
    age: 29,
    lastFollowTime: '2024-06-16 08:10:00',
  }),
  rawCustomer('1801949723525050371', 'gUM25201527', '6595', '美团民宿', 108702, 1, '2024-06-15 20:07:47', {
    memberIdentity: 'CHANNEL',
    isJoinWxCp: 0,
    isJoinWx: 0,
    isJoinGroup: 0,
    gender: 1,
    age: 37,
  }),
  rawCustomer('1801949727954239490', 'pTu748894801', '2729', '美团民宿', 1980, 1, '2024-06-15 20:07:48', {
    memberIdentity: 'MEMBER',
    isJoinWxCp: 1,
    isJoinWx: 0,
    isJoinGroup: 0,
    gender: 1,
    age: 22,
  }),
  rawCustomer('1801949777824514050', 'shB710890387', '2772', '美团民宿', 3762, 1, '2024-06-15 20:08:00', {
    memberIdentity: 'WECHAT',
    memberStatus: 'BLACKLIST',
    isJoinWxCp: 1,
    isJoinWx: 1,
    isJoinGroup: 1,
    gender: 2,
    age: 46,
  }),
  rawCustomer('1801949732022714369', 'pCG136191587', '1479', '美团民宿', 1683, 2, '2024-06-15 20:07:49', {
    totalConsumePrice: 3663,
    memberIdentity: 'MEMBER',
    isJoinWxCp: 0,
    isJoinWx: 0,
    isJoinGroup: 0,
    gender: 2,
    age: 34,
  }),
  rawCustomer('1801949753279447041', '是七啊838', '1974', '美团民宿', 1683, 1, '2024-06-15 20:07:54', {
    memberIdentity: 'CHANNEL',
    isJoinWxCp: 0,
    isJoinWx: 0,
    isJoinGroup: 0,
    gender: 2,
    age: 27,
  }),
  rawCustomer('1801949735889862657', 'bQm125435443', '7025', '美团民宿', 72720, 1, '2024-06-15 20:07:50', {
    memberIdentity: 'WECHAT',
    isJoinWxCp: 1,
    isJoinWx: 1,
    isJoinGroup: 1,
    gender: 1,
    age: 33,
    lastFollowTime: '2024-06-17 20:30:00',
  }),
  rawCustomer('1801949739694108674', 'lily937', '8231', '小猪', 32800, 2, '2024-06-18 12:10:22', {
    memberIdentity: 'MEMBER',
    isJoinWxCp: 0,
    isJoinWx: 0,
    isJoinGroup: 0,
    gender: 2,
    age: 25,
  }),
  rawCustomer('1801949743028576258', 'M614718025', '4518', '途家', 45800, 2, '2024-06-20 09:45:18', {
    memberIdentity: 'CHANNEL',
    isJoinWxCp: 1,
    isJoinWx: 0,
    isJoinGroup: 0,
    gender: 1,
    age: 39,
    lastFollowTime: '2024-06-21 09:00:00',
  }),
]

export function createDefaultCustomerListQuery(): CustomerListQuery {
  return {
    campId: defaultCampId,
    pageNum: 1,
    pageSize: 20,
    memberSearchType: 'mobile',
    keyword: '',
    status: '',
    identity: '',
    memberCardId: '',
    wechatState: '',
    gender: '',
    ageRange: '',
    firstMemberStartTime: '',
    firstMemberEndTime: '',
    firstMemberCardStartTime: '',
    firstMemberCardEndTime: '',
    lastFollowStartTime: '',
    lastFollowEndTime: '',
    lastConsumeStartTime: '',
    lastConsumeEndTime: '',
    lastConsumeMin: '',
    lastConsumeMax: '',
    totalConsumeMin: '',
    totalConsumeMax: '',
    avgConsumeMin: '',
    avgConsumeMax: '',
    scenario: 'success',
  }
}

export function createCustomerListRequestBody(query: CustomerListQuery): Record<string, unknown> {
  return {
    campId: query.campId,
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    current: query.pageNum,
    memberSearchType: query.memberSearchType,
    keyword: query.keyword.trim(),
    memberStatus: query.status,
    memberIdentity: query.identity,
    memberCardId: query.memberCardId,
    isJoinWxCp: query.wechatState === 'JOINED' ? 1 : query.wechatState === 'NOT_JOINED' ? 0 : '',
    gender: query.gender,
    ageRange: query.ageRange,
    firstMemberStartTime: query.firstMemberStartTime,
    firstMemberEndTime: query.firstMemberEndTime,
    firstMemberCardStartTime: query.firstMemberCardStartTime,
    firstMemberCardEndTime: query.firstMemberCardEndTime,
    lastFollowStartTime: query.lastFollowStartTime,
    lastFollowEndTime: query.lastFollowEndTime,
    lastConsumeStartTime: query.lastConsumeStartTime,
    lastConsumeEndTime: query.lastConsumeEndTime,
    lastConsumeMin: query.lastConsumeMin,
    lastConsumeMax: query.lastConsumeMax,
    totalConsumeMin: query.totalConsumeMin,
    totalConsumeMax: query.totalConsumeMax,
    avgConsumeMin: query.avgConsumeMin,
    avgConsumeMax: query.avgConsumeMax,
    breakTemp: false,
    memberTagIds: [],
  }
}

export async function fetchCustomerListDashboard(
  query: CustomerListQuery,
  signal?: AbortSignal,
): Promise<CustomerListDashboard> {
  const provider = resolveProvider()
  const scenario = query.scenario ?? resolveScenario()
  if (provider === 'api') return fetchApiCustomerList(query, signal)
  return fetchMockCustomerList({ ...query, scenario }, signal)
}

export async function createCustomerListExport(query: CustomerListQuery, signal?: AbortSignal) {
  await delay(120, signal)
  return createEnvelope(
    {
      taskId: 'export-customer-list-20260518-001',
      path: CUSTOMER_EXPORT_PATH,
      requestBody: createCustomerListRequestBody(query),
    },
    'export',
  )
}

export async function saveCustomer(input: CustomerSaveInput, signal?: AbortSignal) {
  await delay(120, signal)
  if (!input.mobile.trim()) {
    throw new Error('请输入手机号')
  }
  return createEnvelope(
    {
      saved: true,
      path: CUSTOMER_SAVE_PATH,
      memberId: 'customer-new-20260518',
      requestBody: input,
    },
    'save',
  )
}

async function fetchMockCustomerList(query: CustomerListQuery, signal?: AbortSignal): Promise<CustomerListDashboard> {
  await delay(120, signal)
  validateCustomerListQuery(query)
  if (query.scenario === 'error') {
    throw new Error('客户列表加载失败：/member/page/get 返回业务失败')
  }

  const filtered = query.scenario === 'empty' ? [] : filterCustomers(query)
  const pageList = paginate(filtered, query.pageNum, query.pageSize)
  const envelope = createEnvelope<RawCustomerListData>(
    {
      total: query.scenario === 'empty' ? 0 : 589,
      size: query.pageSize,
      current: query.pageNum,
      pageNum: query.pageNum,
      hasNextPage: query.pageNum * query.pageSize < 589,
      pages: 30,
      list: pageList,
    },
    'list',
  )
  return adaptCustomerListEnvelope(envelope, createCustomerListRequestBody(query), 'mock')
}

async function fetchApiCustomerList(query: CustomerListQuery, signal?: AbortSignal): Promise<CustomerListDashboard> {
  const requestBody = createCustomerListRequestBody(query)
  const response = await fetch(`https://hudson-prod.localhome.cn${CUSTOMER_LIST_PATH}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal,
  })
  const payload = (await response.json().catch(() => null)) as HudsonResponse<RawCustomerListData> | null
  if (!response.ok) {
    throw new Error(`${CUSTOMER_LIST_PATH} 返回 HTTP ${response.status}`)
  }
  if (!payload || payload.success === false || !payload.data) {
    throw new Error(payload?.errorMsg || payload?.errorDetail || '客户列表接口返回失败')
  }
  return adaptCustomerListEnvelope(createEnvelope(payload.data, 'api'), requestBody, 'api')
}

function adaptCustomerListEnvelope(
  envelope: ApiEnvelope<RawCustomerListData>,
  requestBody: Record<string, unknown>,
  provider: 'mock' | 'api',
): CustomerListDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '客户列表接口返回失败')
  }
  if (!envelope.data || !Array.isArray(envelope.data.list)) {
    throw new Error('客户列表响应缺少 data.list')
  }

  const rows = envelope.data.list.map(adaptCustomer)
  return {
    provider,
    endpoint: CUSTOMER_LIST_PATH,
    requestBody,
    statusOptions: customerStatusOptions,
    identityOptions: customerIdentityOptions,
    memberCardOptions,
    wechatOptions: customerWechatOptions,
    genderOptions: customerGenderOptions,
    ageOptions: customerAgeOptions,
    summary: {
      total: envelope.data.total,
      normal: envelope.data.total,
      joinedWechat: rows.filter((row) => row.isJoinWxCp === '是').length,
      highValue: rows.filter((row) => Number(row.totalConsumePrice) >= 500).length,
    },
    rows,
    pagination: {
      page: envelope.data.current || envelope.data.pageNum || 1,
      pageSize: envelope.data.size || 20,
      total: envelope.data.total || rows.length,
      hasNextPage: Boolean(envelope.data.hasNextPage),
    },
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
  }
}

function adaptCustomer(raw: RawCustomer): CustomerRecord {
  return {
    id: raw.memberId,
    name: raw.nickName || raw.name || '-',
    mobile: raw.mobile || '-',
    memberNo: raw.memberNo || raw.memberId,
    channelName: raw.channelName || '-',
    memberCardName: raw.memberCardName || '-',
    tagNames: Array.isArray(raw.memberTagViews)
      ? raw.memberTagViews.map((item) => String(item.tagName ?? '')).filter(Boolean)
      : [],
    lastConsumePrice: formatCentMoney(raw.lastConsumePrice),
    totalConsumeCount: raw.totalConsumeCount == null ? '-' : String(raw.totalConsumeCount),
    totalConsumePrice: formatCentMoney(raw.totalConsumePrice),
    avgConsumePrice: formatCentMoney(raw.avgConsumePrice),
    isJoinWxCp: yesNo(raw.isJoinWxCp),
    isJoinWx: yesNo(raw.isJoinWx),
    isJoinGroup: yesNo(raw.isJoinGroup),
    firstMemberTime: formatTime(raw.firstMemberTime),
    firstMemberCardTime: formatTime(raw.firstMemberCardTime),
    lastConsumeTime: formatTime(raw.lastConsumeTime),
    lastFollowTime: formatTime(raw.lastFollowTime),
    remark: raw.remark || '-',
  }
}

function filterCustomers(query: CustomerListQuery) {
  const keyword = query.keyword.trim().toLowerCase()
  return rawCustomers.filter((customer) => {
    if (query.status && customer.memberStatus !== query.status) return false
    if (query.identity && customer.memberIdentity !== query.identity) return false
    if (query.memberCardId && customer.memberCardId !== query.memberCardId) return false
    if (query.wechatState === 'JOINED' && customer.isJoinWxCp !== 1) return false
    if (query.wechatState === 'NOT_JOINED' && customer.isJoinWxCp !== 0) return false
    if (query.gender && genderToEnum(customer.gender) !== query.gender) return false
    if (query.ageRange && !matchesAgeRange(customer.age, query.ageRange)) return false
    if (!matchesDateRange(customer.firstMemberTime, query.firstMemberStartTime, query.firstMemberEndTime)) return false
    if (!matchesDateRange(customer.firstMemberCardTime, query.firstMemberCardStartTime, query.firstMemberCardEndTime)) return false
    if (!matchesDateRange(customer.lastFollowTime, query.lastFollowStartTime, query.lastFollowEndTime)) return false
    if (!matchesDateRange(customer.lastConsumeTime, query.lastConsumeStartTime, query.lastConsumeEndTime)) return false
    if (!matchesAmountRange(customer.lastConsumePrice, query.lastConsumeMin, query.lastConsumeMax)) return false
    if (!matchesAmountRange(customer.totalConsumePrice, query.totalConsumeMin, query.totalConsumeMax)) return false
    if (!matchesAmountRange(customer.avgConsumePrice, query.avgConsumeMin, query.avgConsumeMax)) return false
    if (keyword) {
      const source =
        query.memberSearchType === 'name'
          ? customer.nickName
          : query.memberSearchType === 'memberNo'
            ? customer.memberNo
            : customer.mobile
      if (!String(source).toLowerCase().includes(keyword)) return false
    }
    return true
  })
}

function rawCustomer(
  memberId: string,
  name: string,
  mobile: string,
  channelName: string,
  lastConsumePrice: number | null,
  totalConsumeCount: number | null,
  time: string,
  options: {
    memberCardId?: string | null
    totalConsumePrice?: number | null
    memberStatus?: CustomerStatus
    memberIdentity?: CustomerIdentity | null
    isJoinWxCp?: number | null
    isJoinWx?: number | null
    isJoinGroup?: number | null
    gender?: number | null
    age?: number | null
    lastFollowTime?: string | null
    lastConsumeTime?: string | null
    firstMemberCardTime?: string | null
    remark?: string | null
    tagNames?: string[]
  } = {},
): RawCustomer {
  const memberCardId = options.memberCardId ?? normalMemberCardId
  const totalConsumePrice = options.totalConsumePrice ?? lastConsumePrice
  return {
    memberId,
    campId: defaultCampId,
    memberNo: memberId,
    headImage: null,
    nickName: name,
    mobile,
    name,
    gender: options.gender ?? null,
    firstMemberTime: time,
    isJoinWxCp: options.isJoinWxCp ?? null,
    memberIdentity: options.memberIdentity ?? 'MEMBER',
    lastFollowTime: options.lastFollowTime ?? null,
    isJoinWx: options.isJoinWx ?? null,
    isJoinGroup: options.isJoinGroup ?? null,
    memberCardName: memberCardId ? '普通会员' : null,
    firstMemberCardTime: memberCardId ? (options.firstMemberCardTime ?? time) : null,
    lastConsumeTime: lastConsumePrice == null ? null : (options.lastConsumeTime ?? time),
    lastConsumePrice,
    totalConsumePrice,
    totalConsumeCount,
    avgConsumePrice: totalConsumeCount && totalConsumePrice ? Math.round(totalConsumePrice / totalConsumeCount) : lastConsumePrice,
    channelId: channelName === '携程' ? '5' : channelName === '小猪' ? '7' : channelName === '途家' ? '9' : '0',
    channelName,
    memberCardId,
    memberStatus: options.memberStatus ?? 'NORMAL',
    remark: options.remark ?? null,
    age: options.age ?? null,
    memberTagViews: (options.tagNames ?? []).map((tagName) => ({ tagName })),
  }
}

function createEnvelope<T>(data: T, trace: string): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId: `${tracePrefix}-${trace}-001`,
    timestamp: generatedAt,
  }
}

function paginate<T>(list: T[], pageNum: number, pageSize: number) {
  const start = (pageNum - 1) * pageSize
  return list.slice(start, start + pageSize)
}

function formatCentMoney(value: number | null) {
  if (value === null || value === undefined) return '-'
  return (value / 100).toFixed(2)
}

function formatTime(value: number | string | null) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string') return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function yesNo(value: number | null) {
  if (value === 1) return '是'
  if (value === 0) return '否'
  return '-'
}

function validateCustomerListQuery(query: CustomerListQuery) {
  const amountFields: Array<[string, string]> = [
    ['最近消费金额下限', query.lastConsumeMin],
    ['最近消费金额上限', query.lastConsumeMax],
    ['累计消费金额下限', query.totalConsumeMin],
    ['累计消费金额上限', query.totalConsumeMax],
    ['客单价下限', query.avgConsumeMin],
    ['客单价上限', query.avgConsumeMax],
  ]

  for (const [label, value] of amountFields) {
    if (!value) continue
    if (Number.isNaN(Number(value))) {
      throw new Error(`客户列表查询参数不合法：${label}必须为数字`)
    }
  }
}

function matchesAmountRange(value: number | null, min: string, max: string) {
  if (!min && !max) return true
  if (value === null || value === undefined) return false
  const amount = value / 100
  if (min && amount < Number(min)) return false
  if (max && amount > Number(max)) return false
  return true
}

function matchesDateRange(value: number | string | null, start: string, end: string) {
  if (!start && !end) return true
  if (value === null || value === undefined || value === '') return false
  const target = normalizeDateValue(value)
  if (!target) return false
  const startDate = start ? normalizeDateValue(start) : null
  const endDate = end ? normalizeDateValue(end) : null
  if (startDate && target < startDate) return false
  if (endDate && target > endDate) return false
  return true
}

function normalizeDateValue(value: number | string) {
  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function matchesAgeRange(age: number | null, ageRange: string) {
  if (!ageRange) return true
  if (age === null || age === undefined) return false
  if (ageRange === '18-25') return age >= 18 && age <= 25
  if (ageRange === '26-35') return age >= 26 && age <= 35
  if (ageRange === '36-45') return age >= 36 && age <= 45
  if (ageRange === '46+') return age >= 46
  return true
}

function genderToEnum(value: number | null): CustomerGender {
  if (value === 1) return 'MALE'
  if (value === 2) return 'FEMALE'
  return 'UNKNOWN'
}

function resolveProvider(): 'mock' | 'api' {
  if (typeof window === 'undefined') return CUSTOMER_PROVIDER
  return window.localStorage.getItem('pms.customerList.provider') === 'api' ? 'api' : 'mock'
}

function resolveScenario(): CustomerListScenario {
  if (typeof window === 'undefined') return 'success'
  const value = window.localStorage.getItem('pms.customerList.scenario')
  return value === 'empty' || value === 'error' ? value : 'success'
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
