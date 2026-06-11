import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  bindMemberWecom,
  createDefaultMemberSettingQuery,
  createEditorDraft,
  loadMemberSettingViewModel,
  MEMBER_SETTING_API_BOOTSTRAP_ENDPOINT,
  MEMBER_SETTING_ENDPOINT,
  MemberSettingServiceError,
  resolveMemberSettingRuntimeConfig,
  saveMemberSettingMember,
  type MemberSettingDraft,
  type MemberSettingMember,
  type MemberSettingMockState,
  type MemberSettingQuery,
  type MemberSettingRoomCategory,
  type MemberSettingViewModel,
} from '../services/memberSetting'
import { validatePersonName, validateRequiredMainlandMobile } from '../utils/inputValidation'
import './MemberSettingPage.css'

type MemberFormErrors = Partial<Record<'name' | 'phone', string>>

type ContractState = {
  provider: string
  responseState: 'loading' | 'success' | 'empty' | 'error'
  endpoint: string
  traceId: string
  timestamp: string
  routeMode: 'list' | 'create' | 'edit'
  request: Record<string, unknown>
}

type LoadState =
  | { kind: 'loading'; contract: ContractState }
  | { kind: 'ready'; data: MemberSettingViewModel; contract: ContractState }
  | { kind: 'error'; message: string; contract: ContractState }

const defaultContract: ContractState = {
  provider: 'api',
  responseState: 'loading',
  endpoint: MEMBER_SETTING_API_BOOTSTRAP_ENDPOINT,
  traceId: '',
  timestamp: '',
  routeMode: 'list',
  request: {},
}

export function MemberSettingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const flashMessage = readLocationFlashMessage(location.state)
  const runtimeConfig = useMemo(
    () => resolveMemberSettingRuntimeConfig({ pathname: location.pathname, search: location.search }),
    [location.pathname, location.search],
  )
  const query = useMemo(() => createDefaultMemberSettingQuery(runtimeConfig), [runtimeConfig])
  const queryKey = JSON.stringify(query)

  return <MemberSettingSurface key={queryKey} flashMessage={flashMessage} navigate={navigate} query={query} />
}

function MemberSettingSurface({
  flashMessage,
  navigate,
  query,
}: {
  flashMessage: string | null
  navigate: ReturnType<typeof useNavigate>
  query: MemberSettingQuery
}) {
  const pendingFeedbackRef = useRef(flashMessage)
  const [keyword, setKeyword] = useState(query.keyword)
  const [selectedRole, setSelectedRole] = useState(query.roleName)
  const [mockStateOverride, setMockStateOverride] = useState<MemberSettingMockState | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<LoadState>({
    kind: 'loading',
    contract: {
      ...defaultContract,
      provider: query.provider ?? 'api',
      routeMode: query.routeMode,
    },
  })
  const [feedback, setFeedback] = useState(flashMessage ?? (query.routeMode === 'list' ? '成员设置数据加载中...' : '正在加载成员表单...'))
  const [bindTarget, setBindTarget] = useState<MemberSettingMember | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [formRoleDropdownOpen, setFormRoleDropdownOpen] = useState(false)
  const [draft, setDraft] = useState<MemberSettingDraft>(createEditorDraft(query))
  const [roomSearch, setRoomSearch] = useState('')
  const [formError, setFormError] = useState('')
  const [formErrors, setFormErrors] = useState<MemberFormErrors>({})

  useEffect(() => {
    const abort = new AbortController()
    const requestQuery: MemberSettingQuery = {
      ...query,
      keyword: query.routeMode === 'list' ? keyword : query.keyword,
      roleName: query.routeMode === 'list' ? selectedRole : query.roleName,
      mockState: mockStateOverride ?? query.mockState,
    }

    queueMicrotask(() => {
      if (abort.signal.aborted) {
        return
      }

      setState((current) => ({
        kind: 'loading',
        contract: {
          ...current.contract,
          provider: requestQuery.provider ?? 'api',
          responseState: 'loading',
          routeMode: requestQuery.routeMode,
          request: requestQuery,
        },
      }))
    })

    loadMemberSettingViewModel(requestQuery, abort.signal)
      .then((data) => {
        if (data.routeMode !== 'list') {
          setDraft(data.editor.draft)
        }

        setState({
          kind: 'ready',
          data,
          contract: toContract(data),
        })

        if (data.routeMode === 'list') {
          if (pendingFeedbackRef.current) {
            setFeedback(pendingFeedbackRef.current)
            pendingFeedbackRef.current = null
          } else {
            setFeedback(data.state === 'empty' ? '暂无数据' : '成员设置数据已更新')
          }
        } else {
          setFeedback(data.editor.title)
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        const message = error instanceof Error ? error.message : '成员设置数据加载失败，请稍后重试'
        setState({
          kind: 'error',
          message,
          contract: toErrorContract(error, requestQuery),
        })
        setFeedback(message)
      })

    return () => abort.abort()
  }, [keyword, mockStateOverride, query, reloadKey, selectedRole])

  const contractJson = JSON.stringify(state.contract)
  const readyData = state.kind === 'ready' ? state.data : null
  const roomOptions = readyData?.roomCategories ?? []
  const filteredRoomOptions = roomOptions.filter((item) => item.roomCategoryName.includes(roomSearch.trim()))

  function updateDraft(nextPatch: Partial<MemberSettingDraft>) {
    setDraft((current) => ({ ...current, ...nextPatch }))
    setFormErrors((current) => {
      const nextErrors = { ...current }
      if ('name' in nextPatch) delete nextErrors.name
      if ('phone' in nextPatch) delete nextErrors.phone
      return nextErrors
    })
    setFormError('')
  }

  async function handleBindConfirm() {
    if (!bindTarget) {
      return
    }

    setIsSubmitting(true)
    try {
      await bindMemberWecom(query, bindTarget.userId)
      setBindTarget(null)
      pendingFeedbackRef.current = '企微绑定成功'
      setFeedback('企微绑定成功')
      setReloadKey((current) => current + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : '企微绑定失败，请稍后重试'
      setFeedback(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit() {
    setFormError('')
    const nextErrors: MemberFormErrors = {
      name: validatePersonName(draft.name),
      phone: validateRequiredMainlandMobile(draft.phone),
    }
    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as keyof MemberFormErrors]) delete nextErrors[key as keyof MemberFormErrors]
    })
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFeedback('请先修正成员信息格式')
      return
    }

    setIsSubmitting(true)

    try {
      await saveMemberSettingMember(query, draft)
      navigate(buildMemberSettingPath('/setting/member', query), {
        state: {
          memberSettingFlashMessage: '成员保存成功',
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '成员保存失败，请稍后重试'
      setFormError(message)
      setFeedback(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleRoomCategory(roomCategoryId: string, checked: boolean) {
    const nextIds = checked
      ? [...new Set([...draft.roomCategoryIds, roomCategoryId])]
      : draft.roomCategoryIds.filter((id) => id !== roomCategoryId)
    updateDraft({ roomCategoryIds: nextIds })
  }

  function toggleAllRoomCategories(checked: boolean) {
    updateDraft({ roomCategoryIds: checked ? roomOptions.map((item) => item.roomCategoryId) : [] })
  }

  return (
    <div className="member-setting-shell">
      <pre
        hidden
        data-testid="member-setting-service-contract"
        data-provider={state.contract.provider}
        data-response-state={state.contract.responseState}
        data-endpoint={state.contract.endpoint}
        data-route-mode={state.contract.routeMode}
      >
        {contractJson}
      </pre>

      {query.routeMode === 'list' ? (
        <div className="member-setting-page">
          <section className="member-setting-panel" aria-label="成员设置">
            <div className="member-setting-feedback" role="status" aria-label="成员设置操作反馈">
              {feedback}
            </div>

            <div className="member-filter-section">
              <div className="member-filter-row member-filter-row--fields">
                <label className="member-filter-control">
                  <span>搜索：</span>
                  <input
                    type="text"
                    placeholder="姓名/手机号/角色"
                    value={keyword}
                    onChange={(event) => {
                      setMockStateOverride(null)
                      setKeyword(event.target.value)
                    }}
                  />
                </label>

                <div className="member-filter-control member-filter-control--role">
                  <span>角色：</span>
                  <button
                    type="button"
                    className={`member-role-select${roleDropdownOpen ? ' is-open' : ''}`}
                    aria-haspopup="listbox"
                    aria-expanded={roleDropdownOpen}
                    disabled={state.kind !== 'ready'}
                    onClick={() => setRoleDropdownOpen((open) => !open)}
                  >
                    {selectedRole}
                  </button>
                  {roleDropdownOpen && readyData ? (
                    <ul className="member-role-options" role="listbox" aria-label="角色筛选">
                      {readyData.roles.map((role) => (
                        <li
                          key={role.roleId}
                          role="option"
                          aria-selected={selectedRole === role.roleName}
                          tabIndex={0}
                          onClick={() => {
                            setSelectedRole(role.roleName)
                            setMockStateOverride(null)
                            setRoleDropdownOpen(false)
                          }}
                        >
                          {role.roleName}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="member-filter-row member-filter-row--summary">
                <strong>
                  成员账号数：{readyData?.summary.usedEmployeeNum ?? 0}/{readyData?.summary.employeeNum ?? 0}
                </strong>
                <button
                  type="button"
                  className="member-primary-button"
                  disabled={state.kind !== 'ready'}
                  onClick={() => navigate(buildMemberSettingPath('/setting/member/actions', query))}
                >
                  添加成员
                </button>
              </div>
            </div>

            {state.kind === 'error' ? (
              <section className="member-state-card member-state-card--error" role="alert" aria-label="成员设置错误状态">
                <h2>成员设置数据加载失败</h2>
                <p>{state.message}</p>
                <button
                  type="button"
                  className="member-primary-button"
                  onClick={() => {
                    setMockStateOverride('success')
                    setReloadKey((current) => current + 1)
                  }}
                >
                  重试
                </button>
              </section>
            ) : null}

            {state.kind === 'loading' ? (
              <section className="member-state-card" role="status" aria-label="成员设置加载中">
                <h2>成员设置数据加载中</h2>
                <p>正在同步成员、角色和房型数据，请稍候。</p>
              </section>
            ) : null}

            {state.kind === 'ready' ? renderMemberList(state.data, navigate, setBindTarget, setFeedback) : null}
          </section>

          {bindTarget ? (
            <div className="member-modal-backdrop" role="presentation">
              <section className="member-dialog" role="dialog" aria-modal="true" aria-label="企微绑定">
                <header>
                  <h2>企微绑定</h2>
                  <button type="button" aria-label="关闭企微绑定" onClick={() => setBindTarget(null)}>
                    ×
                  </button>
                </header>
                <p>确认将当前成员标记为已绑定企微吗？</p>
                <strong>{bindTarget.name}</strong>
                <footer>
                  <button type="button" className="member-secondary-button" disabled={isSubmitting} onClick={() => setBindTarget(null)}>
                    取消
                  </button>
                  <button type="button" className="member-primary-button" disabled={isSubmitting} onClick={() => void handleBindConfirm()}>
                    确认绑定
                  </button>
                </footer>
              </section>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="member-action-page">
          <section className="member-action-panel" aria-label="添加成员">
            <div className="member-setting-feedback" role="status" aria-label="成员设置操作反馈">
              {feedback}
            </div>

            <div className="member-breadcrumb">
              <button type="button" onClick={() => navigate(buildMemberSettingPath('/setting/member', query))}>
                成员设置
              </button>
              <span>/</span>
              <strong>{readyData?.editor.title ?? '添加成员'}</strong>
            </div>

            {state.kind === 'error' ? (
              <section className="member-state-card member-state-card--error" role="alert" aria-label="成员设置错误状态">
                <h2>成员设置数据加载失败</h2>
                <p>{state.message}</p>
                <button
                  type="button"
                  className="member-primary-button"
                  onClick={() => {
                    setMockStateOverride('success')
                    setReloadKey((current) => current + 1)
                  }}
                >
                  重试
                </button>
              </section>
            ) : null}

            {state.kind === 'loading' ? (
              <section className="member-state-card" role="status" aria-label="成员设置加载中">
                <h2>成员设置数据加载中</h2>
                <p>正在同步成员、角色和房型数据，请稍候。</p>
              </section>
            ) : null}

            {state.kind === 'ready' ? (
              <MemberActionForm
                draft={draft}
                feedback={feedback}
                filteredRoomOptions={filteredRoomOptions}
                formError={formError}
                formErrors={formErrors}
                formRoleDropdownOpen={formRoleDropdownOpen}
                isSubmitting={isSubmitting}
                navigate={navigate}
                onRoleDropdownToggle={() => setFormRoleDropdownOpen((open) => !open)}
                onRoomSearchChange={setRoomSearch}
                onSubmit={() => void handleSubmit()}
                onToggleAllRoomCategories={toggleAllRoomCategories}
                onToggleRoomCategory={toggleRoomCategory}
                roomOptions={roomOptions}
                roomSearch={roomSearch}
                setFormRoleDropdownOpen={setFormRoleDropdownOpen}
                updateDraft={updateDraft}
                viewModel={state.data}
              />
            ) : null}
          </section>
        </div>
      )}
    </div>
  )
}

function MemberActionForm({
  draft,
  filteredRoomOptions,
  formError,
  formErrors,
  formRoleDropdownOpen,
  isSubmitting,
  navigate,
  onRoleDropdownToggle,
  onRoomSearchChange,
  onSubmit,
  onToggleAllRoomCategories,
  onToggleRoomCategory,
  roomOptions,
  roomSearch,
  setFormRoleDropdownOpen,
  updateDraft,
  viewModel,
}: {
  draft: MemberSettingDraft
  feedback: string
  filteredRoomOptions: MemberSettingRoomCategory[]
  formError: string
  formErrors: MemberFormErrors
  formRoleDropdownOpen: boolean
  isSubmitting: boolean
  navigate: ReturnType<typeof useNavigate>
  onRoleDropdownToggle: () => void
  onRoomSearchChange: (value: string) => void
  onSubmit: () => void
  onToggleAllRoomCategories: (checked: boolean) => void
  onToggleRoomCategory: (roomCategoryId: string, checked: boolean) => void
  roomOptions: MemberSettingRoomCategory[]
  roomSearch: string
  setFormRoleDropdownOpen: (open: boolean) => void
  updateDraft: (patch: Partial<MemberSettingDraft>) => void
  viewModel: MemberSettingViewModel
}) {
  return (
    <>
      <h1>基本资料</h1>
      <div className="member-action-form">
        <label className="member-action-field">
          <span>* 成员姓名：</span>
          <div className="member-action-field-control">
            <input
              aria-label="成员姓名"
              placeholder="请输入成员姓名"
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
            />
            {formErrors.name ? <small className="member-field-error">{formErrors.name}</small> : null}
          </div>
        </label>

        <label className="member-action-field">
          <span>* 手机号：</span>
          <div className="member-action-field-control">
            <input
              aria-label="手机号"
              placeholder="请输入手机号"
              value={draft.phone}
              onChange={(event) => updateDraft({ phone: event.target.value })}
            />
            {formErrors.phone ? <small className="member-field-error">{formErrors.phone}</small> : null}
          </div>
        </label>

        <div className="member-action-field">
          <span>角色：</span>
          <div className="member-form-role">
            <button type="button" className="member-action-select" onClick={onRoleDropdownToggle}>
              {draft.roleName || viewModel.editor.rolePlaceholder}
            </button>
            {formRoleDropdownOpen ? (
              <ul className="member-role-options member-role-options--form" role="listbox" aria-label="角色选择">
                {viewModel.roles
                  .filter((role) => role.roleName !== '全部')
                  .map((role) => (
                    <li
                      key={role.roleId}
                      role="option"
                      aria-selected={draft.roleId === role.roleId}
                      tabIndex={0}
                      onClick={() => {
                        updateDraft({ roleId: role.roleId, roleName: role.roleName })
                        setFormRoleDropdownOpen(false)
                      }}
                    >
                      {role.roleName}
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="member-room-section">
          <div className="member-room-heading">分配房型</div>
          <div>
            <div className="member-room-toolbar">
              <label className="member-check-all">
                <input
                  type="checkbox"
                  aria-label="全选"
                  checked={draft.roomCategoryIds.length === roomOptions.length && roomOptions.length > 0}
                  onChange={(event) => onToggleAllRoomCategories(event.target.checked)}
                />
                <span>全选</span>
              </label>

              <input
                className="member-room-search"
                placeholder={viewModel.editor.roomSearchPlaceholder}
                value={roomSearch}
                onChange={(event) => onRoomSearchChange(event.target.value)}
              />
            </div>

            <div className="member-room-list">
              {filteredRoomOptions.map((roomCategory) => (
                <RoomCategoryCheckbox
                  checked={draft.roomCategoryIds.includes(roomCategory.roomCategoryId)}
                  key={roomCategory.roomCategoryId}
                  roomCategory={roomCategory}
                  onChange={(checked) => onToggleRoomCategory(roomCategory.roomCategoryId, checked)}
                />
              ))}
            </div>
          </div>
        </div>

        {formError ? <div className="member-form-error">{formError}</div> : null}

        <div className="member-form-actions">
          <button type="button" className="member-secondary-button" onClick={() => navigate(buildMemberSettingPath('/setting/member', viewModel))}>
            取消
          </button>
          <button type="button" className="member-primary-button" disabled={isSubmitting} onClick={onSubmit}>
            {viewModel.editor.submitText}
          </button>
        </div>
      </div>
    </>
  )
}

function renderMemberList(
  viewModel: MemberSettingViewModel,
  navigate: ReturnType<typeof useNavigate>,
  setBindTarget: (member: MemberSettingMember | null) => void,
  setFeedback: (message: string) => void,
) {
  return (
    <>
      <div className="member-table-wrap" role="table" aria-label="成员账号列表">
        <div className="member-table-head" role="row">
          {['姓名', '手机号', '角色', '企微', '邮箱', '操作'].map((label) => (
            <div role="columnheader" key={label}>
              {label}
            </div>
          ))}
        </div>

        {viewModel.members.length > 0 ? (
          viewModel.members.map((member) => (
            <div className="member-table-row" role="row" key={member.userId}>
              <div role="cell">{member.name}</div>
              <div role="cell">{member.phone}</div>
              <div role="cell">{member.roleName}</div>
              <div role="cell">
                <button
                  type="button"
                  className="member-link-button"
                  onClick={() => {
                    setBindTarget(member)
                    setFeedback('请选择是否确认绑定企微')
                  }}
                >
                  {member.wecomLabel}
                </button>
              </div>
              <div role="cell">{member.email}</div>
              <div role="cell">
                <button
                  type="button"
                  className="member-link-button"
                  onClick={() =>
                    navigate(
                      buildMemberSettingPath('/setting/member/actions', viewModel, {
                        mode: 'edit',
                        userId: member.userId,
                      }),
                    )
                  }
                >
                  编辑
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="member-empty-row" role="row">
            <div role="cell">
              <div className="member-empty-state" aria-label="成员列表空态">
                <span aria-hidden="true">○</span>
                <strong>暂无数据</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="member-pagination" aria-label="成员分页">
        <span>
          第 1-{viewModel.members.length} 条，共 {viewModel.pagination.total} 条
        </span>
        <button type="button" aria-label="上一页" disabled />
        <strong>1</strong>
        <button type="button" aria-label="下一页" disabled />
        <button type="button" className="member-page-size">
          20 条/页
        </button>
      </footer>
    </>
  )
}

function RoomCategoryCheckbox({
  checked,
  roomCategory,
  onChange,
}: {
  checked: boolean
  roomCategory: MemberSettingRoomCategory
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="member-room-item">
      <input
        type="checkbox"
        aria-label={`房型 ${roomCategory.roomCategoryName}`}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{roomCategory.roomCategoryName}</span>
    </label>
  )
}

function toContract(data: MemberSettingViewModel): ContractState {
  return {
    provider: data.provider,
    responseState: data.state,
    endpoint: data.endpoint,
    traceId: data.traceId,
    timestamp: data.timestamp,
    routeMode: data.routeMode,
    request: data.request,
  }
}

function toErrorContract(error: unknown, query: MemberSettingQuery): ContractState {
  if (error instanceof MemberSettingServiceError) {
    return {
      provider: error.provider,
      responseState: 'error',
      endpoint: error.provider === 'api' ? MEMBER_SETTING_API_BOOTSTRAP_ENDPOINT : MEMBER_SETTING_ENDPOINT,
      traceId: error.response.traceId,
      timestamp: error.response.timestamp,
      routeMode: query.routeMode,
      request: error.request,
    }
  }

  return {
    provider: query.provider ?? 'api',
    responseState: 'error',
    endpoint: query.provider === 'mock' ? MEMBER_SETTING_ENDPOINT : MEMBER_SETTING_API_BOOTSTRAP_ENDPOINT,
    traceId: '',
    timestamp: '',
    routeMode: query.routeMode,
    request: query,
  }
}

function buildMemberSettingPath(
  pathname: string,
  source: Pick<MemberSettingQuery | MemberSettingViewModel, 'provider'>,
  params: Record<string, string | null | undefined> = {},
) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })
  if (source.provider === 'mock') {
    searchParams.set('memberSettingProvider', 'mock')
  }
  const search = searchParams.toString()
  return search ? `${pathname}?${search}` : pathname
}

function readLocationFlashMessage(state: unknown) {
  if (!state || typeof state !== 'object') {
    return null
  }

  const flashMessage = Reflect.get(state, 'memberSettingFlashMessage')
  return typeof flashMessage === 'string' ? flashMessage : null
}
