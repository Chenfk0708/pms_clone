import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createQuickRoomNoSuggestion,
  deleteRoomType,
  loadRoomTypeInfoDashboard,
  loadRoomTypeInfoDraft,
  loadRoomTypeLinkage,
  loadRoomTypeRooms,
  loadRoomTypeUtilityDialog,
  saveRoomTypeDraft,
  saveRoomTypeLinkage,
  type RoomTypeInfoDashboard,
  type RoomTypeInfoDraft,
  type RoomTypeInfoEditMode,
  type RoomTypeInfoLinkageDialog,
  type RoomTypeInfoQuery,
  type RoomTypeInfoRow,
  type RoomTypeInfoRoomsDialog,
  type RoomTypeInfoUtilityDialog,
} from '../services/roomTypeInfo'
import './RoomTypeInfoPage.css'

type OpenSelect = 'store' | 'group' | null

type ActiveDialog =
  | { kind: 'rooms'; data: RoomTypeInfoRoomsDialog }
  | { kind: 'linkage'; data: RoomTypeInfoLinkageDialog; keyword: string; appliedKeyword: string; selectedIds: string[] }
  | { kind: 'utility'; data: RoomTypeInfoUtilityDialog }
  | { kind: 'delete'; row: RoomTypeInfoRow; busy: boolean }
  | null

type EditRouteState = {
  mode?: RoomTypeInfoEditMode
  roomTypeId?: string
}

const emptyQuery: RoomTypeInfoQuery = {
  storeId: '',
  groupId: '',
  keyword: '',
  pageNum: 1,
  pageSize: 20,
  current: 1,
}

export function RoomTypeInfoPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/edit')) {
    return <RoomTypeEditPage />
  }

  return <RoomTypeListPage />
}

function RoomTypeListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [queryDraft, setQueryDraft] = useState<RoomTypeInfoQuery>(emptyQuery)
  const [submittedQuery, setSubmittedQuery] = useState<RoomTypeInfoQuery>(emptyQuery)
  const [dashboard, setDashboard] = useState<RoomTypeInfoDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [openSelect, setOpenSelect] = useState<OpenSelect>(null)
  const [dialog, setDialog] = useState<ActiveDialog>(null)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const nextDashboard = await loadRoomTypeInfoDashboard(submittedQuery, controller.signal)
        setDashboard(nextDashboard)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setDashboard(null)
        setError(loadError instanceof Error ? loadError.message : '房型信息加载失败')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadDashboard()
    return () => controller.abort()
  }, [submittedQuery, location.search])

  useEffect(() => {
    if (!statusMessage) return
    const timer = window.setTimeout(() => setStatusMessage(''), 2400)
    return () => window.clearTimeout(timer)
  }, [statusMessage])

  const hasRows = (dashboard?.rows.length ?? 0) > 0

  async function openUtilityDialog(kind: 'tags' | 'floors') {
    setBusy(true)
    try {
      const data = await loadRoomTypeUtilityDialog(kind)
      setDialog({ kind: 'utility', data })
    } catch (openError) {
      setStatusMessage(openError instanceof Error ? openError.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  async function openRoomsDialog(row: RoomTypeInfoRow) {
    setBusy(true)
    try {
      const data = await loadRoomTypeRooms(row.id)
      setDialog({ kind: 'rooms', data })
    } catch (openError) {
      setStatusMessage(openError instanceof Error ? openError.message : '房间列表加载失败')
    } finally {
      setBusy(false)
    }
  }

  async function openLinkageDialog(row: RoomTypeInfoRow) {
    setBusy(true)
    try {
      const data = await loadRoomTypeLinkage(row.id)
      setDialog({
        kind: 'linkage',
        data,
        keyword: '',
        appliedKeyword: '',
        selectedIds: data.candidates.filter((item) => item.selected).map((item) => item.id),
      })
    } catch (openError) {
      setStatusMessage(openError instanceof Error ? openError.message : '联动关房加载失败')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!dialog || dialog.kind !== 'delete') return

    setDialog({ ...dialog, busy: true })
    try {
      const result = await deleteRoomType(dialog.row.id)
      setDialog(null)
      setStatusMessage(result.message)
      setSubmittedQuery({ ...submittedQuery })
    } catch (deleteError) {
      setDialog({ ...dialog, busy: false })
      setStatusMessage(deleteError instanceof Error ? deleteError.message : '删除失败')
    }
  }

  async function confirmLinkage() {
    if (!dialog || dialog.kind !== 'linkage') return

    try {
      const result = await saveRoomTypeLinkage(dialog.data.roomTypeId, dialog.selectedIds)
      setDialog(null)
      setStatusMessage(result.message)
      setSubmittedQuery({ ...submittedQuery })
    } catch (saveError) {
      setStatusMessage(saveError instanceof Error ? saveError.message : '联动关房保存失败')
    }
  }

  const linkageCandidates =
    dialog && dialog.kind === 'linkage'
      ? dialog.data.candidates.filter((item) => item.name.includes(dialog.appliedKeyword.trim()))
      : []

  return (
    <div className="room-type-info-page">
      <h1 className="sr-only-heading">房型信息</h1>

      {dashboard ? (
        <div
          data-testid="room-type-info-contract"
          data-provider={dashboard.provider}
          data-endpoint={dashboard.endpoint}
          data-trace-id={dashboard.traceId}
          data-request-summary={dashboard.requestSummary.join(' | ')}
          hidden
        />
      ) : null}

      <section className="room-type-info-query" aria-label="房型信息筛选">
        <FilterSelector
          label="门店"
          open={openSelect === 'store'}
          value={dashboard?.stores.find((item) => item.id === queryDraft.storeId)?.label || ''}
          placeholder="门店 请选择"
          options={dashboard?.stores ?? []}
          onToggle={() => setOpenSelect(openSelect === 'store' ? null : 'store')}
          onSelect={(value) => {
            setQueryDraft({ ...queryDraft, storeId: value })
            setOpenSelect(null)
          }}
        />
        <FilterSelector
          label="分组"
          open={openSelect === 'group'}
          value={dashboard?.groups.find((item) => item.id === queryDraft.groupId)?.label || ''}
          placeholder="分组 请选择"
          options={dashboard?.groups ?? []}
          onToggle={() => setOpenSelect(openSelect === 'group' ? null : 'group')}
          onSelect={(value) => {
            setQueryDraft({ ...queryDraft, groupId: value })
            setOpenSelect(null)
          }}
        />
        <label className="room-type-info-filter room-type-info-filter--keyword">
          <span>房型名称</span>
          <input
            aria-label="房型名称"
            value={queryDraft.keyword || ''}
            onChange={(event) => setQueryDraft({ ...queryDraft, keyword: event.target.value })}
            placeholder="请输入房型名称"
          />
        </label>
        <div className="room-type-info-actions">
          <button
            type="button"
            onClick={() => {
              setOpenSelect(null)
              setQueryDraft(emptyQuery)
              setSubmittedQuery(emptyQuery)
            }}
          >
            重 置
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              setOpenSelect(null)
              setSubmittedQuery({ ...queryDraft })
            }}
          >
            查 询
          </button>
        </div>
      </section>

      <section className="room-type-info-panel">
        <div className="room-type-info-toolbar">
          <div className="room-type-info-stock">
            <span>当前系统库存：</span>
            <strong>
              {dashboard?.stockSummary.used ?? 0}/{dashboard?.stockSummary.total ?? 0}
            </strong>
            <em>
              （{dashboard?.stockSummary.startDate ?? '--'} 至 {dashboard?.stockSummary.endDate ?? '--'}）
            </em>
          </div>
          <div className="room-type-info-tools" aria-label="房型信息工具栏">
            <button type="button" onClick={() => navigate('/setting/roomTypeInfo/edit?mode=create', { state: { mode: 'create' } })}>
              添加房型
            </button>
            <button type="button" onClick={() => void openUtilityDialog('tags')}>
              标签管理
            </button>
            <button type="button" onClick={() => void openUtilityDialog('floors')}>
              楼层管理
            </button>
          </div>
        </div>

        {loading ? (
          <StatePanel title="房型信息加载中" detail="正在同步房型列表和筛选项，请稍候。" />
        ) : null}

        {!loading && error ? (
          <StatePanel
            title="房型信息加载失败"
            detail={error}
            action={<button onClick={() => setSubmittedQuery({ ...submittedQuery })}>重新加载</button>}
          />
        ) : null}

        {!loading && !error && !hasRows ? (
          <StatePanel title="暂无房型数据" detail="当前筛选条件下没有可展示的房型，请调整门店、分组或房型名称。" />
        ) : null}

        {!loading && !error && hasRows && dashboard ? (
          <>
            <div className="room-type-info-table" role="table" aria-label="房型信息列表">
              <div className="room-type-info-table__head" role="row">
                {['房型名称', '门店', '房间数量', '房间号', '联动房型', '分组', '操作'].map((column) => (
                  <div key={column} role="columnheader">
                    {column}
                  </div>
                ))}
              </div>
              <div className="room-type-info-table__body">
                {dashboard.rows.map((row) => (
                  <div className="room-type-info-table__row" role="row" key={row.id} data-testid="room-type-info-row">
                    <div role="cell">{row.name}</div>
                    <div role="cell">{row.storeName}</div>
                    <div role="cell">{row.roomCount}</div>
                    <div role="cell">{row.roomNames.join('、')}</div>
                    <div role="cell">{row.linkedRoomTypeNames.join('、')}</div>
                    <div role="cell">{row.groupName}</div>
                    <div role="cell" className="room-type-info-row-actions">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/setting/roomTypeInfo/edit?mode=detail&id=${row.id}`, {
                            state: { mode: 'detail', roomTypeId: row.id },
                          })
                        }
                      >
                        详情
                      </button>
                      <button type="button" onClick={() => void openRoomsDialog(row)}>
                        房间
                      </button>
                      <button type="button" onClick={() => void openLinkageDialog(row)}>
                        联动关房
                      </button>
                      <button type="button" className="is-danger" onClick={() => setDialog({ kind: 'delete', row, busy: false })}>
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="room-type-info-pagination">
              <span>
                第 1-{dashboard.rows.length} 条/总共 {dashboard.pagination.total} 条
              </span>
              <button type="button" aria-current="page">
                1
              </button>
              <button type="button">20 条/页</button>
            </div>
          </>
        ) : null}
      </section>

      {busy ? <div className="room-type-info-busy">处理中...</div> : null}

      {dialog?.kind === 'rooms' ? (
        <Dialog title="房间列表" onClose={() => setDialog(null)}>
          <div className="room-type-info-room-table">
            <div className="room-type-info-room-table__head">
              <span>房间名称</span>
              <span>房型名称</span>
              <span>门锁情况</span>
              <span>楼层名称</span>
            </div>
            {dialog.data.rooms.map((room) => (
              <div className="room-type-info-room-table__row" key={room.id}>
                <span>{room.roomName}</span>
                <span>{room.roomTypeName}</span>
                <span>{room.lockStatus}</span>
                <span>{room.floorName}</span>
              </div>
            ))}
          </div>
        </Dialog>
      ) : null}

      {dialog?.kind === 'linkage' ? (
        <Dialog title="联动关房" onClose={() => setDialog(null)}>
          <p className="room-type-info-modal__copy">{dialog.data.description}</p>
          <div className="room-type-info-linkage-search">
            <input
              aria-label="联动房型搜索"
              placeholder="请输入名称"
              value={dialog.keyword}
              onChange={(event) => setDialog({ ...dialog, keyword: event.target.value })}
            />
            <button type="button" onClick={() => setDialog({ ...dialog, keyword: '', appliedKeyword: '', selectedIds: [] })}>
              重 置
            </button>
            <button type="button" className="is-primary" onClick={() => setDialog({ ...dialog, appliedKeyword: dialog.keyword })}>
              搜 索
            </button>
          </div>
          <div className="room-type-info-linkage-toolbar">
            <span>已选中 {dialog.selectedIds.length} 项</span>
            <button
              type="button"
              onClick={() =>
                setDialog({
                  ...dialog,
                  selectedIds: linkageCandidates.map((item) => item.id),
                })
              }
            >
              全 选
            </button>
          </div>
          <div className="room-type-info-linkage-list">
            {linkageCandidates.map((item) => (
              <label key={item.id} className="room-type-info-linkage-item">
                <input
                  type="checkbox"
                  checked={dialog.selectedIds.includes(item.id)}
                  onChange={(event) => {
                    const nextSelectedIds = event.target.checked
                      ? [...dialog.selectedIds, item.id]
                      : dialog.selectedIds.filter((currentId) => currentId !== item.id)
                    setDialog({ ...dialog, selectedIds: nextSelectedIds })
                  }}
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
          <div className="room-type-info-modal__actions">
            <button type="button" className="is-primary" onClick={() => void confirmLinkage()}>
              确 定
            </button>
          </div>
        </Dialog>
      ) : null}

      {dialog?.kind === 'utility' ? (
        <Dialog title={dialog.data.title} onClose={() => setDialog(null)}>
          <div className="room-type-info-utility-list">
            {dialog.data.items.map((item) => (
              <article className="room-type-info-utility-item" key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.count} 个房型/房间</span>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </Dialog>
      ) : null}

      {dialog?.kind === 'delete' ? (
        <Dialog title="确认删除房型" onClose={() => setDialog(null)}>
          <p className="room-type-info-modal__copy">
            删除房型后将无法恢复，已产生的订单不会产生影响，未完成的保洁任务将同步删除，请谨慎操作
          </p>
          <div className="room-type-info-modal__actions">
            <button type="button" onClick={() => setDialog(null)}>
              取 消
            </button>
            <button type="button" className="is-danger-solid" disabled={dialog.busy} onClick={() => void confirmDelete()}>
              删 除
            </button>
          </div>
        </Dialog>
      ) : null}

      {statusMessage ? (
        <div className="room-type-info-status" role="status" aria-live="polite">
          {statusMessage}
        </div>
      ) : null}
    </div>
  )
}

function RoomTypeEditPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = (location.state ?? {}) as EditRouteState
  const params = new URLSearchParams(location.search)
  const mode = (routeState.mode || params.get('mode') || 'create') as RoomTypeInfoEditMode
  const roomTypeId = routeState.roomTypeId || params.get('id') || ''

  const [draft, setDraft] = useState<RoomTypeInfoDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDraft() {
      setLoading(true)
      setError('')
      try {
        const nextDraft = await loadRoomTypeInfoDraft(mode, roomTypeId, controller.signal)
        setDraft(nextDraft)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setDraft(null)
        setError(loadError instanceof Error ? loadError.message : '房型详情加载失败')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadDraft()
    return () => controller.abort()
  }, [mode, roomTypeId])

  useEffect(() => {
    if (!statusMessage) return
    const timer = window.setTimeout(() => setStatusMessage(''), 2400)
    return () => window.clearTimeout(timer)
  }, [statusMessage])

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    try {
      const result = await saveRoomTypeDraft(draft.form)
      setStatusMessage(result.message)
      navigate('/setting/roomTypeInfo')
    } catch (saveError) {
      setStatusMessage(saveError instanceof Error ? saveError.message : '房型保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="room-type-edit-page">
        <StatePanel title="房型详情加载中" detail="正在准备房型草案，请稍候。" />
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="room-type-edit-page">
        <StatePanel title="房型详情加载失败" detail={error || '当前房型不可用'} />
      </div>
    )
  }

  return (
    <div className="room-type-edit-page">
      <h1>{draft.title}</h1>
      <div className="room-type-edit-page__steps" aria-label="房型设置步骤">
        {draft.steps.map((step, index) => (
          <span key={step} className={index === activeStep ? 'is-active' : ''}>
            {step}
          </span>
        ))}
      </div>

      <div className="room-type-edit-page__form">
        <label>
          <span>房型名称</span>
          <input
            aria-label="房型名称"
            value={draft.form.roomTypeName}
            onChange={(event) => setDraft({ ...draft, form: { ...draft.form, roomTypeName: event.target.value } })}
          />
        </label>
        <label>
          <span>门店</span>
          <input aria-label="门店" value="天落会宿公寓(前海壹方城宝安中心店)" readOnly />
        </label>
        <label>
          <span>分组</span>
          <input aria-label="分组" value="天落会宿公寓(前海壹方城宝安中心店)" readOnly />
        </label>
        <label>
          <span>房间数量</span>
          <input
            aria-label="房间数量"
            value={draft.form.roomCount}
            onChange={(event) => setDraft({ ...draft, form: { ...draft.form, roomCount: event.target.value } })}
          />
        </label>
        <label>
          <span>房间号</span>
          <input
            aria-label="房间号"
            value={draft.form.roomNo}
            onChange={(event) => setDraft({ ...draft, form: { ...draft.form, roomNo: event.target.value } })}
          />
        </label>
      </div>

      <div className="room-type-edit-page__actions">
        <button type="button" onClick={() => navigate('/setting/roomTypeInfo')}>
          返回列表
        </button>
        <button type="button" disabled={saving} onClick={() => void handleSave()}>
          保存并退出
        </button>
        {draft.mode === 'create' ? (
          <button
            type="button"
            onClick={() => {
              setDraft({
                ...draft,
                form: {
                  ...draft.form,
                  roomNo: createQuickRoomNoSuggestion(draft.form.roomCount),
                },
              })
              setStatusMessage('已生成房间号草案')
            }}
          >
            快捷创建
          </button>
        ) : null}
        <button type="button" className="is-primary" onClick={() => setActiveStep(Math.min(activeStep + 1, draft.steps.length - 1))}>
          下一步
        </button>
      </div>

      {statusMessage ? (
        <div className="room-type-info-status" role="status" aria-live="polite">
          {statusMessage}
        </div>
      ) : null}
    </div>
  )
}

function FilterSelector(props: {
  label: string
  placeholder: string
  value: string
  open: boolean
  options: Array<{ id: string; label: string }>
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  const buttonLabel = props.value ? `${props.label} ${props.value}` : props.placeholder

  return (
    <div className="room-type-info-filter">
      <span>{props.label}</span>
      <button type="button" onClick={props.onToggle}>
        {buttonLabel}
      </button>
      {props.open ? (
        <div className="room-type-info-dropdown" role="listbox" aria-label={`${props.label}选项`}>
          {props.options.map((option) => (
            <button key={option.id} type="button" role="option" onClick={() => props.onSelect(option.id)}>
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Dialog(props: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') props.onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [props])

  return (
    <div className="room-type-info-modal-backdrop">
      <div className="room-type-info-modal" role="dialog" aria-label={props.title} aria-modal="true">
        <div className="room-type-info-modal__header">
          <h2>{props.title}</h2>
          <button type="button" onClick={props.onClose}>
            关闭
          </button>
        </div>
        {props.children}
      </div>
    </div>
  )
}

function StatePanel(props: { title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="room-type-info-state">
      <strong>{props.title}</strong>
      <p>{props.detail}</p>
      {props.action}
    </div>
  )
}
