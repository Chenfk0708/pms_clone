export type PicturesVideosProviderName = 'mock' | 'api'
export type PicturesVideosMockState = 'success' | 'empty' | 'error'
export type PicturesVideosTabKey = 'picture' | 'attachment'

export type PicturesVideosRequest = {
  campId: string
  pageNum: number
  pageSize: number
  path: string
  orderBy: string
  name: string
  bizTypes: number[]
  state?: PicturesVideosMockState
}

export type PicturesVideosItem = {
  id: string
  name: string
  isDir: boolean
  path: string
  format: string | null
  size: number | null
  width: number | null
  height: number | null
  url: string | null
  createdAt: number
}

export type PicturesVideosViewModel = {
  provider: PicturesVideosProviderName
  state: PicturesVideosMockState
  request: Omit<PicturesVideosRequest, 'state'>
  contract: {
    endpoint: '/medias/page/get'
    method: 'POST'
    traceId: string
    request: Omit<PicturesVideosRequest, 'state'>
  }
  tabs: Array<{ key: PicturesVideosTabKey; label: string }>
  title: string
  breadcrumbLabel: string
  uploadTargetLabel: string
  uploadGuide: string[]
  items: PicturesVideosItem[]
  pagination: {
    total: number
    pageNum: number
    pageSize: number
    pages: number
  }
  updatedAt: string
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type RawMediaRecord = {
  mediaId: string
  campId: string
  isDir: 0 | 1
  path: string
  name: string
  format: string | null
  size: number | null
  width: number | null
  height: number | null
  url: string | null
  createTime: number
}

type RawMediaPage = {
  total: number
  size: number
  current: number
  extraInfo: null
  pageNum: number
  hasNextPage: boolean
  pages: number
  list: RawMediaRecord[]
}

const RESPONSE_TIMESTAMP = '2026-05-19T22:15:00+08:00'
const REQUEST_ENDPOINT = '/medias/page/get' as const
const LAST_REQUEST_STORAGE_KEY = 'pms.picturesVideos.lastRequest'
const DEFAULT_CAMP_ID = '1796067693589061634'

const baseRecords: RawMediaRecord[] = [
  {
    mediaId: '2056681222674485249',
    campId: DEFAULT_CAMP_ID,
    isDir: 1,
    path: '/',
    name: '新建文件夹',
    format: null,
    size: null,
    width: null,
    height: null,
    url: null,
    createTime: 1779185989431,
  },
]

export class PicturesVideosServiceError extends Error {
  readonly response: ApiEnvelope<null>
  readonly provider: PicturesVideosProviderName
  readonly state: PicturesVideosMockState
  readonly request: Omit<PicturesVideosRequest, 'state'>

  constructor(message: string, response: ApiEnvelope<null>, request: PicturesVideosRequest) {
    super(message)
    this.name = 'PicturesVideosServiceError'
    this.response = response
    this.provider = resolvePicturesVideosProvider()
    this.state = request.state ?? 'success'
    this.request = toContractRequest(request)
  }
}

export function defaultPicturesVideosRequest(
  state: PicturesVideosMockState = resolvePicturesVideosMockState(),
): PicturesVideosRequest {
  return {
    campId: DEFAULT_CAMP_ID,
    pageNum: 1,
    pageSize: 50,
    path: '/',
    orderBy: 'create_time desc',
    name: '',
    bizTypes: [1],
    state,
  }
}

export function resolvePicturesVideosProvider(): PicturesVideosProviderName {
  const configured = readRuntimeConfig('pms.picturesVideosProvider') || import.meta.env.VITE_PICTURES_VIDEOS_PROVIDER
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

export function resolvePicturesVideosMockState(search = currentSearch()): PicturesVideosMockState {
  const params = new URLSearchParams(search)
  const configured =
    params.get('picturesVideosMockState') ||
    readRuntimeConfig('pms.picturesVideosMockState') ||
    import.meta.env.VITE_PICTURES_VIDEOS_MOCK_STATE

  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

export async function fetchPicturesVideosView(
  request: PicturesVideosRequest,
  signal?: AbortSignal,
): Promise<PicturesVideosViewModel> {
  const provider = resolvePicturesVideosProvider()
  const normalizedRequest = normalizeRequest(request)

  recordLastRequest(provider, normalizedRequest.state ?? 'success', normalizedRequest)

  if (provider === 'api') {
    throw new PicturesVideosServiceError(
      '图片视频数据加载失败，请稍后重试',
      envelope(503, 'service unavailable', null, 'api-setting-pictures-videos-unavailable'),
      normalizedRequest,
    )
  }

  await waitForMockLatency(signal)

  if (normalizedRequest.state === 'error') {
    throw new PicturesVideosServiceError(
      '图片视频数据加载失败，请稍后重试',
      envelope(50031, 'pictures and videos query failed', null, 'mock-setting-pictures-videos-error-001'),
      normalizedRequest,
    )
  }

  const response = buildMockResponse(normalizedRequest)
  return adaptPicturesVideosResponse(provider, normalizedRequest, response)
}

function normalizeRequest(request: PicturesVideosRequest): PicturesVideosRequest {
  const defaults = defaultPicturesVideosRequest(request.state ?? resolvePicturesVideosMockState())
  const state = request.state === 'empty' || request.state === 'error' ? request.state : 'success'

  return {
    ...defaults,
    ...request,
    campId: request.campId || defaults.campId,
    pageNum: Number.isFinite(request.pageNum) && request.pageNum > 0 ? Math.floor(request.pageNum) : defaults.pageNum,
    pageSize:
      Number.isFinite(request.pageSize) && request.pageSize > 0 ? Math.floor(request.pageSize) : defaults.pageSize,
    path: request.path || defaults.path,
    orderBy: request.orderBy || defaults.orderBy,
    name: request.name.trim(),
    bizTypes: request.bizTypes?.length ? [...request.bizTypes] : defaults.bizTypes,
    state,
  }
}

function buildMockResponse(request: PicturesVideosRequest): ApiEnvelope<RawMediaPage> {
  const filtered = request.state === 'empty' ? [] : filterMediaRecords(request)
  const start = (request.pageNum - 1) * request.pageSize
  const list = filtered.slice(start, start + request.pageSize)

  return envelope(
    0,
    'success',
    {
      total: filtered.length,
      size: request.pageSize,
      current: request.pageNum,
      extraInfo: null,
      pageNum: request.pageNum,
      hasNextPage: start + request.pageSize < filtered.length,
      pages: filtered.length === 0 ? 0 : Math.ceil(filtered.length / request.pageSize),
      list,
    },
    filtered.length === 0 ? 'mock-setting-pictures-videos-empty-001' : 'mock-setting-pictures-videos-list-001',
  )
}

function filterMediaRecords(request: PicturesVideosRequest) {
  const keyword = request.name.toLowerCase()

  if (!keyword) return baseRecords
  return baseRecords.filter((record) => record.name.toLowerCase().includes(keyword))
}

function adaptPicturesVideosResponse(
  provider: PicturesVideosProviderName,
  request: PicturesVideosRequest,
  response: ApiEnvelope<RawMediaPage>,
): PicturesVideosViewModel {
  if (response.code !== 0) {
    throw new Error(response.message || '图片视频数据加载失败')
  }

  const contractRequest = toContractRequest(request)
  const state = request.state ?? 'success'

  return {
    provider,
    state: state === 'success' && response.data.total === 0 ? 'empty' : state,
    request: contractRequest,
    contract: {
      endpoint: REQUEST_ENDPOINT,
      method: 'POST',
      traceId: response.traceId,
      request: contractRequest,
    },
    tabs: [
      { key: 'picture', label: '图片管理' },
      { key: 'attachment', label: '附件管理' },
    ],
    title: '图片视频',
    breadcrumbLabel: '全部附件',
    uploadTargetLabel: '全部附件',
    uploadGuide: [
      '为了保证附件的正常使用，单个附件最大支持 20M',
      'jpg、jpeg、png格式附件上传',
      '支持选择多张图片上传，支持拖拽文件夹上传',
    ],
    items: response.data.list.map((item) => ({
      id: item.mediaId,
      name: item.name,
      isDir: item.isDir === 1,
      path: item.path,
      format: item.format,
      size: item.size,
      width: item.width,
      height: item.height,
      url: item.url,
      createdAt: item.createTime,
    })),
    pagination: {
      total: response.data.total,
      pageNum: response.data.pageNum,
      pageSize: response.data.size,
      pages: response.data.pages,
    },
    updatedAt: RESPONSE_TIMESTAMP,
  }
}

function toContractRequest(request: PicturesVideosRequest): Omit<PicturesVideosRequest, 'state'> {
  return {
    campId: request.campId,
    pageNum: request.pageNum,
    pageSize: request.pageSize,
    path: request.path,
    orderBy: request.orderBy,
    name: request.name,
    bizTypes: [...request.bizTypes],
  }
}

function recordLastRequest(
  provider: PicturesVideosProviderName,
  state: PicturesVideosMockState,
  request: PicturesVideosRequest,
) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    LAST_REQUEST_STORAGE_KEY,
    JSON.stringify({
      provider,
      state,
      endpoint: REQUEST_ENDPOINT,
      method: 'POST',
      request: toContractRequest(request),
      recordedAt: RESPONSE_TIMESTAMP,
    }),
  )
}

function envelope<T>(code: number, message: string, data: T, traceId: string): ApiEnvelope<T> {
  return {
    code,
    message,
    data,
    traceId,
    timestamp: RESPONSE_TIMESTAMP,
  }
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function currentSearch() {
  if (typeof window === 'undefined') return ''
  return window.location.search
}

function waitForMockLatency(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Request aborted', 'AbortError'))
      return
    }

    const timer = window.setTimeout(resolve, 180)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Request aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
