export type CompanyInfoProviderName = 'mock' | 'api'
export type CompanyInfoMockMode = 'success' | 'empty' | 'error'

export type CompanyInfoQuery = {
  campId: string
  includeImages: boolean
  provider?: CompanyInfoProviderName
}

export type CompanyInfoImage = {
  id: string
  name: string
  url: string
  uploadedAt: string
}

export type CompanyInfoProfile = {
  name: string
  type: string
  phone: string
  city: string
  address: string
  images: CompanyInfoImage[]
}

export type CompanyInfoField = {
  label: string
  value: string
}

export type CompanyInfoEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

export type CompanyInfoViewModel = {
  provider: CompanyInfoProviderName
  profile: CompanyInfoProfile | null
  fields: CompanyInfoField[]
  cityOptions: string[]
  contract: {
    provider: CompanyInfoProviderName
    path: string
    method: 'POST'
    requestBody: CompanyInfoQuery
    traceId: string
    timestamp: string
  }
}

const COMPANY_INFO_GET_ENDPOINT = '/company/info/get'
const COMPANY_INFO_SAVE_ENDPOINT = '/company/info/save'
const TASK_ID = 'shezhi--qiye-shezhi--qiye-xinxi'
const DEFAULT_CAMP_ID = '1796067693589061634'
const RESPONSE_TIMESTAMP = '2026-05-19T18:30:00+08:00'
const CITY_OPTIONS = ['深圳 / 福田', '广州 / 天河', '上海 / 静安']

const defaultProfile: CompanyInfoProfile = {
  name: '路客云6TS5的店铺',
  type: '民宿',
  phone: '',
  city: '',
  address: '',
  images: [],
}

let mockProfileState: CompanyInfoProfile = cloneProfile(defaultProfile)

export class CompanyInfoRequestError extends Error {
  constructor(message = '企业信息加载失败') {
    super(message)
    this.name = 'CompanyInfoRequestError'
  }
}

export const defaultCompanyInfoQuery: CompanyInfoQuery = {
  campId: DEFAULT_CAMP_ID,
  includeImages: true,
}

export async function fetchCompanyInfo(query: CompanyInfoQuery = defaultCompanyInfoQuery, signal?: AbortSignal): Promise<CompanyInfoViewModel> {
  const provider = resolveProvider(query.provider)
  const normalizedQuery = { ...defaultCompanyInfoQuery, ...query, provider: undefined }

  if (provider === 'mock') {
    return waitForMockCompanyInfo(normalizedQuery)
  }

  const response = await fetch(COMPANY_INFO_GET_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(normalizedQuery),
    signal,
  })
  const payload = (await readJson(response)) as CompanyInfoEnvelope<unknown> | null
  if (!response.ok || !payload || payload.code !== 0) {
    throw new CompanyInfoRequestError(payload?.message ?? `企业信息加载失败（HTTP ${response.status}）`)
  }
  return buildViewModel(provider, normalizedQuery, payload.data, payload.traceId, payload.timestamp)
}

export async function saveCompanyInfo(profile: CompanyInfoProfile): Promise<CompanyInfoViewModel> {
  const provider = resolveProvider()
  const normalizedProfile = normalizeProfile(profile)
  const requestBody = { ...defaultCompanyInfoQuery, profile: normalizedProfile }

  if (provider === 'mock') {
    mockProfileState = cloneProfile(normalizedProfile)
    return buildViewModel(
      provider,
      defaultCompanyInfoQuery,
      mockProfileState,
      `mock-${TASK_ID}-save-001`,
      RESPONSE_TIMESTAMP,
    )
  }

  const response = await fetch(COMPANY_INFO_SAVE_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
  })
  const payload = (await readJson(response)) as CompanyInfoEnvelope<unknown> | null
  if (!response.ok || !payload || payload.code !== 0) {
    throw new CompanyInfoRequestError(payload?.message ?? `企业信息保存失败（HTTP ${response.status}）`)
  }
  return buildViewModel(provider, defaultCompanyInfoQuery, normalizedProfile, payload.traceId, payload.timestamp)
}

export function createEmptyCompanyInfoDraft(): CompanyInfoProfile {
  return {
    name: '',
    type: '民宿',
    phone: '',
    city: '',
    address: '',
    images: [],
  }
}

export function createUploadedCompanyImage(existingImages: CompanyInfoImage[]): CompanyInfoImage {
  const nextIndex = existingImages.length + 1
  return {
    id: `image-${nextIndex}`,
    name: `企业门头-0${nextIndex}.png`,
    url: `https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/localhomeqy/company/company-image-0${nextIndex}.png`,
    uploadedAt: '2026-05-19 18:30',
  }
}

async function waitForMockCompanyInfo(query: CompanyInfoQuery) {
  const latencyMs = resolveMockLatencyMs()
  if (latencyMs > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, latencyMs))
  }

  const mode = resolveMockMode()
  if (mode === 'error') {
    throw new CompanyInfoRequestError('企业信息加载失败')
  }

  const data = mode === 'empty' ? null : cloneProfile(mockProfileState)
  return buildViewModel(
    'mock',
    query,
    data,
    `mock-${TASK_ID}-${mode === 'empty' ? 'empty' : 'detail'}-001`,
    RESPONSE_TIMESTAMP,
  )
}

function buildViewModel(
  provider: CompanyInfoProviderName,
  requestBody: CompanyInfoQuery,
  input: unknown,
  traceId: string,
  timestamp: string,
): CompanyInfoViewModel {
  const profile = adaptProfile(input)
  return {
    provider,
    profile,
    fields: buildFields(profile),
    cityOptions: [...CITY_OPTIONS],
    contract: {
      provider,
      path: COMPANY_INFO_GET_ENDPOINT,
      method: 'POST',
      requestBody,
      traceId,
      timestamp,
    },
  }
}

function adaptProfile(input: unknown): CompanyInfoProfile | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Partial<CompanyInfoProfile>
  return {
    name: typeof record.name === 'string' ? record.name : '',
    type: typeof record.type === 'string' ? record.type : '民宿',
    phone: typeof record.phone === 'string' ? record.phone : '',
    city: typeof record.city === 'string' ? record.city : '',
    address: typeof record.address === 'string' ? record.address : '',
    images: Array.isArray(record.images)
      ? record.images
          .filter((item): item is CompanyInfoImage => Boolean(item && typeof item === 'object'))
          .map((item) => ({
            id: String(item.id ?? ''),
            name: String(item.name ?? ''),
            url: String(item.url ?? ''),
            uploadedAt: String(item.uploadedAt ?? ''),
          }))
          .filter((item) => item.id && item.name)
      : [],
  }
}

function buildFields(profile: CompanyInfoProfile | null): CompanyInfoField[] {
  if (!profile) {
    return [
      { label: '企业名称', value: '暂未填写' },
      { label: '企业类型', value: '暂未填写' },
      { label: '联系电话', value: '暂未填写' },
      { label: '所在城市', value: '暂未填写' },
      { label: '详细地址', value: '暂未填写' },
    ]
  }
  return [
    { label: '企业名称', value: profile.name || '暂无企业名称' },
    { label: '企业类型', value: profile.type || '暂无企业类型' },
    { label: '联系电话', value: profile.phone || '暂无联系电话' },
    { label: '所在城市', value: profile.city || '暂无所在城市' },
    { label: '详细地址', value: profile.address || '暂无详细地址' },
  ]
}

function normalizeProfile(profile: CompanyInfoProfile): CompanyInfoProfile {
  return {
    name: profile.name.trim(),
    type: profile.type.trim() || '民宿',
    phone: profile.phone.trim(),
    city: profile.city.trim(),
    address: profile.address.trim(),
    images: profile.images.map((item) => ({ ...item })),
  }
}

function cloneProfile(profile: CompanyInfoProfile): CompanyInfoProfile {
  return {
    ...profile,
    images: profile.images.map((item) => ({ ...item })),
  }
}

function resolveProvider(explicitProvider?: CompanyInfoProviderName): CompanyInfoProviderName {
  const configured =
    explicitProvider ||
    readRuntimeConfig('pms.companyInfo.provider') ||
    (import.meta.env.VITE_COMPANY_INFO_PROVIDER as string | undefined)
  return configured === 'api' ? 'api' : 'mock'
}

function resolveMockMode(): CompanyInfoMockMode {
  const fromUrl = readUrlMockMode()
  if (fromUrl) return fromUrl
  const configured =
    readRuntimeConfig('pms.companyInfo.mockMode') ||
    (import.meta.env.VITE_COMPANY_INFO_MOCK_MODE as string | undefined)
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readUrlMockMode(): CompanyInfoMockMode | '' {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  const configured = params.get('mockState') || params.get('companyInfoMockMode')
  return configured === 'empty' || configured === 'error' ? configured : ''
}

function resolveMockLatencyMs() {
  const configured = Number(readRuntimeConfig('pms.companyInfo.mockLatencyMs'))
  return Number.isFinite(configured) && configured > 0 ? configured : 0
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}
