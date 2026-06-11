import { apiPost } from '../api/client'
import { resolveCurrentCampId } from '../utils/camp'

export const MEMBER_SETTING_PROVIDER_KEY = 'pms.memberSetting.provider'
export const MEMBER_SETTING_MOCK_STATE_KEY = 'pms.memberSetting.mockState'
export const MEMBER_SETTING_ENDPOINT = '/setting/member/bootstrap'
export const MEMBER_SETTING_API_BOOTSTRAP_ENDPOINT = '/memberSettings/bootstrap'
export const MEMBER_SETTING_API_SAVE_ENDPOINT = '/memberSettings/save'
export const MEMBER_SETTING_API_WECOM_BIND_ENDPOINT = '/memberSettings/wecom/bind'
export const MEMBER_SETTING_TARGET_URL = 'https://minsubao.localhome.cn/setting/member'

const DEFAULT_CAMP_ID = '10001'
const DEFAULT_TIMESTAMP = '2026-05-20T00:35:00+08:00'
const DEFAULT_PAGE_SIZE = 20
const DEFAULT_PROVIDER: MemberSettingProvider = 'api'
const ROLE_ALL_NAME = '全部'
const TRACE_PREFIX = 'mock-shezhi--qiye-shezhi--chengyuan-shezhi'

export type MemberSettingProvider = 'mock' | 'api'
export type MemberSettingMockState = 'success' | 'empty' | 'error'
export type MemberSettingRouteMode = 'list' | 'create' | 'edit'

export type MemberSettingQuery = {
  campId: string
  keyword: string
  roleName: string
  page: number
  pageSize: number
  provider?: MemberSettingProvider
  mockState?: MemberSettingMockState
  routeMode: MemberSettingRouteMode
  editUserId?: string | null
}

export type MemberSettingRole = {
  roleId: string
  roleName: string
}

export type MemberSettingRoomCategory = {
  roomCategoryId: string
  roomCategoryName: string
  roomIds: string[]
}

export type MemberSettingMember = {
  userId: string
  name: string
  phone: string
  roleId: string
  roleName: string
  wecomStatus: 'bound' | 'unbound'
  wecomLabel: string
  email: string
  roomCategoryIds: string[]
}

export type MemberSettingDraft = {
  userId?: string
  name: string
  phone: string
  roleId: string
  roleName: string
  roomCategoryIds: string[]
}

export type MemberSettingViewModel = {
  provider: MemberSettingProvider
  state: MemberSettingMockState
  endpoint: string
  traceId: string
  timestamp: string
  request: Record<string, unknown>
  routeMode: MemberSettingRouteMode
  summary: {
    usedEmployeeNum: number
    employeeNum: number
  }
  roles: MemberSettingRole[]
  members: MemberSettingMember[]
  pendingFlows: {
    flowId: string
    name: string
  }[]
  roomCategories: MemberSettingRoomCategory[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  editor: {
    title: string
    submitText: string
    breadcrumbText: string
    rolePlaceholder: string
    roomSearchPlaceholder: string
    draft: MemberSettingDraft
  }
}

type MemberSettingRuntimeConfig = {
  provider: MemberSettingProvider
  mockState: MemberSettingMockState
  routeMode: MemberSettingRouteMode
  editUserId: string | null
}

type MemberSettingEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type MemberSettingPayload = {
  summary: {
    usedEmployeeNum: number
    employeeNum: number
  }
  roles: MemberSettingRole[]
  members: MemberSettingMember[]
  pendingFlows: {
    flowId: string
    name: string
  }[]
  roomCategories: MemberSettingRoomCategory[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  editor: MemberSettingViewModel['editor']
}

export class MemberSettingServiceError extends Error {
  provider: MemberSettingProvider
  request: Record<string, unknown>
  response: MemberSettingEnvelope<MemberSettingPayload>

  constructor(provider: MemberSettingProvider, request: Record<string, unknown>, response: MemberSettingEnvelope<MemberSettingPayload>) {
    super(response.message)
    this.name = 'MemberSettingServiceError'
    this.provider = provider
    this.request = request
    this.response = response
  }
}

const roleOptions: MemberSettingRole[] = [
  { roleId: 'all', roleName: ROLE_ALL_NAME },
  { roleId: 'admin', roleName: '管理员' },
  { roleId: 'housekeeper', roleName: '管家' },
  { roleId: 'investor', roleName: '投资人' },
  { roleId: 'cleaner', roleName: '保洁员' },
  { roleId: 'smart-housekeeper', roleName: '智住管家' },
  { roleId: 'owner', roleName: '业主' },
  { roleId: 'locals-ai', roleName: 'localsAI' },
]

const roomCategories: MemberSettingRoomCategory[] = [
  {
    roomCategoryId: '1796425099729092609',
    roomCategoryName: '观影大床房',
    roomIds: ['room-001'],
  },
  {
    roomCategoryId: '1796425099485822977',
    roomCategoryName: '天落大床电竞套间',
    roomIds: ['room-002'],
  },
  {
    roomCategoryId: '1796425099242553345',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    roomIds: ['room-003'],
  },
  {
    roomCategoryId: '1796425098965729282',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    roomIds: ['room-004'],
  },
]

const initialMembers: MemberSettingMember[] = [
  {
    userId: '1796067694000000001',
    name: '路客云6TS5',
    phone: '18123941382',
    roleId: '',
    roleName: '-',
    wecomStatus: 'unbound',
    wecomLabel: '点击绑定',
    email: '-',
    roomCategoryIds: roomCategories.map((item) => item.roomCategoryId),
  },
]

let mockMembers = initialMembers.map(cloneMember)

export function resolveMemberSettingRuntimeConfig(location: { pathname: string; search: string }): MemberSettingRuntimeConfig {
  const searchParams = new URLSearchParams(location.search)
  const routeMode: MemberSettingRouteMode = location.pathname.endsWith('/actions')
    ? searchParams.get('mode') === 'edit'
      ? 'edit'
      : 'create'
    : 'list'

  return {
    provider: normalizeProvider(searchParams.get('memberSettingProvider')) ?? readProvider(),
    mockState: normalizeMockState(searchParams.get('memberSettingMockState')) ?? readMockState(),
    routeMode,
    editUserId: searchParams.get('userId'),
  }
}

export function createDefaultMemberSettingQuery(config: MemberSettingRuntimeConfig): MemberSettingQuery {
  return {
    campId: resolveCurrentCampId(DEFAULT_CAMP_ID),
    keyword: '',
    roleName: ROLE_ALL_NAME,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    provider: config.provider,
    mockState: config.mockState,
    routeMode: config.routeMode,
    editUserId: config.editUserId,
  }
}

export async function loadMemberSettingViewModel(
  query: MemberSettingQuery,
  signal?: AbortSignal,
): Promise<MemberSettingViewModel> {
  const provider = query.provider ?? DEFAULT_PROVIDER
  const request = buildMemberSettingRequest(query)
  const requestedState = query.mockState ?? 'success'

  if (provider === 'api') {
    const data = await apiPost<MemberSettingPayload>(MEMBER_SETTING_API_BOOTSTRAP_ENDPOINT, request, signal)
    return adaptMemberSettingEnvelope(
      provider,
      request,
      createApiEnvelope(data, 'member-settings-bootstrap'),
      normalizeResponseState(data),
      query.routeMode,
      MEMBER_SETTING_API_BOOTSTRAP_ENDPOINT,
    )
  }

  await delay(180, signal)

  if (requestedState === 'error') {
    throw new MemberSettingServiceError(provider, request, createEnvelope('error', 50001, '成员设置数据加载失败，请稍后重试'))
  }

  const members = requestedState === 'empty' ? [] : filterMembers(query)
  const responseState: MemberSettingMockState = members.length === 0 ? 'empty' : 'success'
  const response = createEnvelope(responseState, 0, 'success', buildPayload(query, members))

  return adaptMemberSettingEnvelope(provider, request, response, responseState, query.routeMode)
}

export async function bindMemberWecom(
  query: MemberSettingQuery,
  userId: string,
  signal?: AbortSignal,
): Promise<MemberSettingMember[]> {
  const provider = query.provider ?? DEFAULT_PROVIDER
  const request = { campId: query.campId, userId }

  if (provider === 'api') {
    const data = await apiPost<MemberSettingPayload>(MEMBER_SETTING_API_WECOM_BIND_ENDPOINT, request, signal)
    return cloneMembers(data.members ?? [])
  }

  await delay(120, signal)

  let found = false
  mockMembers = mockMembers.map((member) => {
    if (member.userId !== userId) {
      return member
    }

    found = true
    return {
      ...member,
      wecomStatus: 'bound',
      wecomLabel: '已绑定',
    }
  })

  if (!found) {
    throw new MemberSettingServiceError(provider, request, createEnvelope('error', 40404, '未找到要绑定的成员'))
  }

  return cloneMembers(mockMembers)
}

export async function saveMemberSettingMember(
  query: MemberSettingQuery,
  draft: MemberSettingDraft,
  signal?: AbortSignal,
): Promise<MemberSettingMember[]> {
  const request = {
    campId: query.campId,
    routeMode: query.routeMode,
    draft,
  }

  validateDraft(draft)

  const provider = query.provider ?? DEFAULT_PROVIDER
  if (provider === 'api') {
    const data = await apiPost<MemberSettingPayload>(MEMBER_SETTING_API_SAVE_ENDPOINT, request, signal)
    return cloneMembers(data.members ?? [])
  }

  await delay(180, signal)

  if (draft.userId) {
    let found = false
    mockMembers = mockMembers.map((member) => {
      if (member.userId !== draft.userId) {
        return member
      }

      found = true
      return {
        ...member,
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        roleId: draft.roleId,
        roleName: draft.roleName,
        roomCategoryIds: [...draft.roomCategoryIds],
      }
    })

    if (!found) {
      throw new MemberSettingServiceError(provider, request, createEnvelope('error', 40404, '未找到要编辑的成员'))
    }
  } else {
    mockMembers = [
      ...mockMembers,
      {
        userId: `1796067694${String(mockMembers.length + 2).padStart(9, '0')}`,
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        roleId: draft.roleId,
        roleName: draft.roleName,
        wecomStatus: 'unbound',
        wecomLabel: '点击绑定',
        email: '-',
        roomCategoryIds: [...draft.roomCategoryIds],
      },
    ]
  }

  return cloneMembers(mockMembers)
}

export function createEditorDraft(query: MemberSettingQuery): MemberSettingDraft {
  const member = query.editUserId ? mockMembers.find((item) => item.userId === query.editUserId) : null

  if (!member) {
    return {
      name: '',
      phone: '',
      roleId: '',
      roleName: '',
      roomCategoryIds: [],
    }
  }

  const fallbackRole = roleOptions.find((role) => role.roleName !== ROLE_ALL_NAME) ?? roleOptions[0]
  return {
    userId: member.userId,
    name: member.name,
    phone: member.phone,
    roleId: member.roleId || fallbackRole.roleId,
    roleName: member.roleName === '-' ? fallbackRole.roleName : member.roleName,
    roomCategoryIds: [...member.roomCategoryIds],
  }
}

function buildMemberSettingRequest(query: MemberSettingQuery) {
  return {
    campId: query.campId,
    keyword: query.keyword,
    roleName: query.roleName,
    page: query.page,
    pageSize: query.pageSize,
    routeMode: query.routeMode,
    editUserId: query.editUserId ?? null,
  }
}

function buildPayload(query: MemberSettingQuery, members: MemberSettingMember[]): MemberSettingPayload {
  const editorTitle = query.routeMode === 'edit' ? '编辑成员' : '添加成员'
  const editorDraft = createEditorDraft(query)

  return {
    summary: {
      usedEmployeeNum: mockMembers.length,
      employeeNum: 3,
    },
    roles: roleOptions,
    members: members.map(cloneMember),
    pendingFlows: [],
    roomCategories,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: members.length,
    },
    editor: {
      title: editorTitle,
      submitText: query.routeMode === 'edit' ? '保存' : '提交',
      breadcrumbText: `成员设置 / ${editorTitle}`,
      rolePlaceholder: '请选择角色',
      roomSearchPlaceholder: '搜索房型名称',
      draft: editorDraft,
    },
  }
}

function filterMembers(query: MemberSettingQuery) {
  const normalizedKeyword = query.keyword.trim()
  const normalizedRole = query.roleName || ROLE_ALL_NAME

  return mockMembers.filter((member) => {
    const matchesKeyword =
      normalizedKeyword.length === 0 ||
      member.name.includes(normalizedKeyword) ||
      member.phone.includes(normalizedKeyword) ||
      member.roleName.includes(normalizedKeyword)
    const matchesRole = normalizedRole === ROLE_ALL_NAME || member.roleName === normalizedRole

    return matchesKeyword && matchesRole
  })
}

function adaptMemberSettingEnvelope(
  provider: MemberSettingProvider,
  request: Record<string, unknown>,
  response: MemberSettingEnvelope<MemberSettingPayload>,
  state: MemberSettingMockState,
  routeMode: MemberSettingRouteMode,
  endpoint = MEMBER_SETTING_ENDPOINT,
): MemberSettingViewModel {
  if (response.code !== 0) {
    throw new MemberSettingServiceError(provider, request, response)
  }

  return {
    ...response.data,
    provider,
    state,
    endpoint,
    traceId: response.traceId,
    timestamp: response.timestamp,
    request,
    routeMode,
  }
}


function createApiEnvelope(data: MemberSettingPayload, traceId: string): MemberSettingEnvelope<MemberSettingPayload> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId,
    timestamp: new Date().toISOString(),
  }
}

function normalizeResponseState(data: MemberSettingPayload): MemberSettingMockState {
  return Array.isArray(data.members) && data.members.length > 0 ? 'success' : 'empty'
}

function cloneMembers(members: MemberSettingMember[]): MemberSettingMember[] {
  return members.map(cloneMember)
}

function createEnvelope(
  state: MemberSettingMockState,
  code: number,
  message: string,
  data?: MemberSettingPayload,
): MemberSettingEnvelope<MemberSettingPayload> {
  return {
    code,
    message,
    data:
      data ??
      buildPayload(
        {
          campId: DEFAULT_CAMP_ID,
          keyword: '',
          roleName: ROLE_ALL_NAME,
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          routeMode: 'list',
        },
        [],
      ),
    traceId: `${TRACE_PREFIX}-${state}-001`,
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function cloneMember(member: MemberSettingMember): MemberSettingMember {
  return {
    ...member,
    roomCategoryIds: [...member.roomCategoryIds],
  }
}

function validateDraft(draft: MemberSettingDraft) {
  if (!draft.name.trim() || !draft.phone.trim() || !draft.roleId || !draft.roleName) {
    throw new Error('请完整填写成员姓名、手机号和角色')
  }

  if (!/^1\d{10}$/.test(draft.phone.trim())) {
    throw new Error('请输入正确的手机号')
  }

  if (draft.roomCategoryIds.length === 0) {
    throw new Error('请至少选择一个房型')
  }
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

function normalizeProvider(value: string | null | undefined): MemberSettingProvider | undefined {
  if (value === 'api' || value === 'real') return 'api'
  if (value === 'mock') return 'mock'
  return undefined
}

function normalizeMockState(value: string | null | undefined): MemberSettingMockState | undefined {
  return value === 'empty' || value === 'error' || value === 'success' ? value : undefined
}

function readProvider(): MemberSettingProvider {
  if (typeof window === 'undefined') {
    return DEFAULT_PROVIDER
  }

  const provider = normalizeProvider(window.localStorage.getItem(MEMBER_SETTING_PROVIDER_KEY))
  return provider ?? DEFAULT_PROVIDER
}

function readMockState(): MemberSettingMockState {
  if (typeof window === 'undefined') {
    return 'success'
  }

  return normalizeMockState(window.localStorage.getItem(MEMBER_SETTING_MOCK_STATE_KEY)) ?? 'success'
}
