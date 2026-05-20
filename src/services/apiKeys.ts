const HUDSON_BASE_URL = 'https://hudson-prod.localhome.cn'

export const API_KEYS_GET_PATH = '/user/secret/get'
export const API_KEYS_GENERATE_PATH = '/user/secret/generate'

const API_KEYS_PROVIDER_KEY = 'pms.apiKeys.provider'
const API_KEYS_FETCH_STATE_KEY = 'pms.apiKeys.mockState'
const API_KEYS_GENERATE_STATE_KEY = 'pms.apiKeys.generateMockState'
const API_KEYS_LAST_REQUEST_KEY = 'pms.apiKeys.lastRequest'
const API_KEYS_GENERATION_COUNTER_KEY = 'pms.apiKeys.generationCounter'
const DEFAULT_MOCK_CAMP_ID = '1796067693589061634'

export type ApiKeysProviderName = 'mock' | 'api'
export type ApiKeysMockState = 'success' | 'empty' | 'error'
export type ApiKeysGenerateState = 'success' | 'error'
export type ApiKeysAction = 'get' | 'generate'

type HudsonResponse<T> = {
  success?: boolean
  errorCode?: string | null
  errorMsg?: string | null
  errorDetail?: string | null
  data?: T
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type ApiKeysPayload = {
  keyRecord: ApiKeyRecord | null
  activityLog: ApiKeysActivity[]
}

export type ApiKeyRecord = {
  appId: string
  accessKeyId: string
  secretKeyPreview: string
  createdAt: string
  lastUsedAt: string
  rotationTip: string
  status: 'active'
  scopes: string[]
}

export type ApiKeysActivity = {
  id: string
  title: string
  detail: string
  occurredAt: string
}

export type ApiKeysDiagnostics = {
  provider: ApiKeysProviderName
  action: ApiKeysAction
  state: ApiKeysMockState
  endpoint: string
  requestBody: {
    campId: string
  }
  traceId: string
  timestamp: string
}

export type ApiKeysPageData = {
  provider: ApiKeysProviderName
  action: ApiKeysAction
  state: ApiKeysMockState
  endpoint: string
  requestBody: {
    campId: string
  }
  keyRecord: ApiKeyRecord | null
  activityLog: ApiKeysActivity[]
  traceId: string
  timestamp: string
  diagnostics: ApiKeysDiagnostics
}

export function resolveApiKeysProviderName(): ApiKeysProviderName {
  if (typeof window === 'undefined') return 'mock'
  return window.localStorage.getItem(API_KEYS_PROVIDER_KEY) === 'api' ? 'api' : 'mock'
}

export function resolveApiKeysQuery(search: string): { mockState?: ApiKeysMockState } {
  const params = new URLSearchParams(search)
  const state = params.get('mockState')

  return {
    mockState: state === 'success' || state === 'empty' || state === 'error' ? state : undefined,
  }
}

export function resolveApiKeysCampId() {
  if (typeof window === 'undefined') return DEFAULT_MOCK_CAMP_ID

  const fromQuery = new URLSearchParams(window.location.search).get('campId')
  const fromStorage = window.localStorage.getItem('pmsCampId')
  const fromEnv = import.meta.env.VITE_PMS_CAMP_ID as string | undefined

  return fromQuery || fromStorage || fromEnv || DEFAULT_MOCK_CAMP_ID
}

export async function fetchApiKeysPageData(overrides: {
  provider?: ApiKeysProviderName
  mockState?: ApiKeysMockState
  campId?: string
} = {}): Promise<ApiKeysPageData> {
  const provider = overrides.provider ?? resolveApiKeysProviderName()
  const requestBody = {
    campId: overrides.campId ?? resolveApiKeysCampId(),
  }

  if (provider === 'api') {
    const response = await fetch(`${HUDSON_BASE_URL}${API_KEYS_GET_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    })
    const payload = (await response.json()) as HudsonResponse<unknown>

    if (!response.ok || payload.success === false) {
      throw new Error(payload.errorMsg || 'API keys 加载失败，请稍后重试')
    }

    return adaptHudsonPayload('get', provider, requestBody, payload.data)
  }

  const state = overrides.mockState ?? resolveFetchMockState()
  const envelope = await fetchMockApiKeysEnvelope('get', state)
  return adaptEnvelope('get', provider, requestBody, envelope, state)
}

export async function generateApiKeys(overrides: {
  provider?: ApiKeysProviderName
  campId?: string
} = {}): Promise<ApiKeysPageData> {
  const provider = overrides.provider ?? resolveApiKeysProviderName()
  const requestBody = {
    campId: overrides.campId ?? resolveApiKeysCampId(),
  }

  if (provider === 'api') {
    const response = await fetch(`${HUDSON_BASE_URL}${API_KEYS_GENERATE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    })
    const payload = (await response.json()) as HudsonResponse<unknown>

    if (!response.ok || payload.success === false) {
      throw new Error(payload.errorMsg || 'API keys 生成失败，请稍后重试')
    }

    return adaptHudsonPayload('generate', provider, requestBody, payload.data)
  }

  const envelope = await fetchMockApiKeysEnvelope('generate', resolveGenerateMockState())
  return adaptEnvelope('generate', provider, requestBody, envelope, 'success')
}

function adaptHudsonPayload(
  action: ApiKeysAction,
  provider: ApiKeysProviderName,
  requestBody: { campId: string },
  payload: unknown,
): ApiKeysPageData {
  if (action === 'get' && (payload === '' || payload === null || payload === undefined)) {
    return buildPageData({
      provider,
      action,
      state: 'empty',
      endpoint: `${HUDSON_BASE_URL}${API_KEYS_GET_PATH}`,
      requestBody,
      keyRecord: null,
      activityLog: [],
      traceId: 'api-shezhi--qiye-shezhi--api-keys-get-empty',
      timestamp: new Date().toISOString(),
    })
  }

  throw new Error('API keys 实时接口返回结构待确认，请先核对 user/secret 契约')
}

async function fetchMockApiKeysEnvelope(
  action: ApiKeysAction,
  state: ApiKeysMockState | ApiKeysGenerateState,
): Promise<UnifiedEnvelope<ApiKeysPayload>> {
  await delay(160)

  if (state === 'error') {
    return {
      code: 50001,
      message: action === 'get' ? 'API keys 加载失败，请稍后重试' : 'API keys 生成失败，请稍后重试',
      data: {
        keyRecord: null,
        activityLog: [],
      },
      traceId: `mock-shezhi--qiye-shezhi--api-keys-${action}-error-001`,
      timestamp: '2026-05-19T10:00:00+08:00',
    }
  }

  if (action === 'get' && state === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: {
        keyRecord: null,
        activityLog: [],
      },
      traceId: 'mock-shezhi--qiye-shezhi--api-keys-get-empty-001',
      timestamp: '2026-05-19T10:00:00+08:00',
    }
  }

  const version = nextGenerationVersion(action === 'get' ? 'peek' : 'increment')
  const keyRecord = createMockKeyRecord(version)

  return {
    code: 0,
    message: 'success',
    data: {
      keyRecord,
      activityLog: [
        {
          id: `activity-${version}`,
          title: action === 'generate' ? '已生成新的 API keys' : '最近一次密钥巡检完成',
          detail:
            action === 'generate'
              ? '请同步更新 Locals AI 服务端配置。'
              : '当前凭证状态正常，可继续用于 Locals AI 服务端接入。',
          occurredAt: keyRecord.createdAt,
        },
        {
          id: `rotation-${version}`,
          title: '建议每 90 天轮换一次',
          detail: '若已在多个服务端节点接入，请在切换窗口内完成更新。',
          occurredAt: '2026-05-19 09:45',
        },
      ],
    },
    traceId: `mock-shezhi--qiye-shezhi--api-keys-${action}-success-${String(version).padStart(3, '0')}`,
    timestamp: '2026-05-19T10:00:00+08:00',
  }
}

function adaptEnvelope(
  action: ApiKeysAction,
  provider: ApiKeysProviderName,
  requestBody: { campId: string },
  envelope: UnifiedEnvelope<ApiKeysPayload>,
  state: ApiKeysMockState,
): ApiKeysPageData {
  if (envelope.code !== 0) {
    persistDiagnostics({
      provider,
      action,
      state: 'error',
      endpoint: `${HUDSON_BASE_URL}${action === 'get' ? API_KEYS_GET_PATH : API_KEYS_GENERATE_PATH}`,
      requestBody,
      traceId: envelope.traceId,
      timestamp: envelope.timestamp,
    })
    throw new Error(envelope.message || 'API keys 请求失败')
  }

  return buildPageData({
    provider,
    action,
    state,
    endpoint: `${HUDSON_BASE_URL}${action === 'get' ? API_KEYS_GET_PATH : API_KEYS_GENERATE_PATH}`,
    requestBody,
    keyRecord: envelope.data.keyRecord,
    activityLog: envelope.data.activityLog,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
  })
}

function buildPageData(input: {
  provider: ApiKeysProviderName
  action: ApiKeysAction
  state: ApiKeysMockState
  endpoint: string
  requestBody: { campId: string }
  keyRecord: ApiKeyRecord | null
  activityLog: ApiKeysActivity[]
  traceId: string
  timestamp: string
}): ApiKeysPageData {
  const diagnostics = {
    provider: input.provider,
    action: input.action,
    state: input.state,
    endpoint: input.endpoint,
    requestBody: input.requestBody,
    traceId: input.traceId,
    timestamp: input.timestamp,
  } satisfies ApiKeysDiagnostics

  persistDiagnostics(diagnostics)

  return {
    ...input,
    diagnostics,
  }
}

function persistDiagnostics(diagnostics: ApiKeysDiagnostics) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(API_KEYS_LAST_REQUEST_KEY, JSON.stringify(diagnostics))
}

function resolveFetchMockState(): ApiKeysMockState {
  if (typeof window === 'undefined') return 'empty'
  const configured = window.localStorage.getItem(API_KEYS_FETCH_STATE_KEY)
  if (configured === 'success' || configured === 'empty' || configured === 'error') return configured
  return 'empty'
}

function resolveGenerateMockState(): ApiKeysGenerateState {
  if (typeof window === 'undefined') return 'success'
  return window.localStorage.getItem(API_KEYS_GENERATE_STATE_KEY) === 'error' ? 'error' : 'success'
}

function nextGenerationVersion(mode: 'peek' | 'increment') {
  if (typeof window === 'undefined') return 1

  const current = Number(window.localStorage.getItem(API_KEYS_GENERATION_COUNTER_KEY) || '0')
  if (mode === 'peek') {
    const stable = current > 0 ? current : 1
    if (current <= 0) {
      window.localStorage.setItem(API_KEYS_GENERATION_COUNTER_KEY, String(stable))
    }
    return stable
  }

  const next = current > 0 ? current + 1 : 1
  window.localStorage.setItem(API_KEYS_GENERATION_COUNTER_KEY, String(next))
  return next
}

function createMockKeyRecord(version: number): ApiKeyRecord {
  const padded = String(version).padStart(3, '0')

  return {
    appId: `locals-ai-${padded}`,
    accessKeyId: `ak_local_20260519_${padded}`,
    secretKeyPreview: `sk_local_20260519_${padded}_****************`,
    createdAt: `2026-05-19 10:${String(10 + version).padStart(2, '0')}`,
    lastUsedAt: version === 1 ? '尚未使用' : `2026-05-19 11:${String(version).padStart(2, '0')}`,
    rotationTip: '建议在 90 天内完成轮换',
    status: 'active',
    scopes: ['Locals AI 服务端接入', '推理调用鉴权', '环境隔离密钥托管'],
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
