import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createRoomTypeFloor,
  createRoomTypeTag,
  createQuickRoomNoSuggestion,
  deleteRoomType,
  loadRoomTypeFloorPage,
  loadRoomTypeInfoDashboard,
  loadRoomTypeInfoDraft,
  loadRoomTypeLinkage,
  loadRoomTypeRooms,
  loadRoomTypeTagPage,
  saveRoomTypeDraft,
  saveRoomTypeLinkage,
  type RoomTypeInfoDashboard,
  type RoomTypeInfoDraft,
  type RoomTypeInfoEditMode,
  type RoomTypeFloorPageData,
  type RoomTypeInfoLinkageDialog,
  type RoomTypeInfoQuery,
  type RoomTypeInfoRow,
  type RoomTypeInfoRoomsDialog,
  type RoomTypeTagPageData,
} from '../services/roomTypeInfo'
import './RoomTypeInfoPage.css'

type OpenSelect = 'store' | 'group' | null

type ActiveDialog =
  | { kind: 'rooms'; data: RoomTypeInfoRoomsDialog }
  | { kind: 'linkage'; data: RoomTypeInfoLinkageDialog; keyword: string; appliedKeyword: string; selectedIds: string[] }
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

const roomTypeEditStoreOptions = [{ id: '1796425098638573570', label: '天落会宿公寓(前海壹方城宝安中心店)' }]
const roomTypeRentalTypeOptions = [
  { value: '', label: '请选择出租类型' },
  { value: 'entire', label: '整套出租' },
  { value: 'independent', label: '独立单间' },
]
const roomTypePropertyTypeOptions = [
  { value: '', label: '请选择房源类型' },
  { value: 'apartment', label: '公寓' },
  { value: 'homestay', label: '民宿' },
]
const roomTypeTimeOptions = [
  { value: '', label: '请选择' },
  { value: '12', label: '12 点' },
  { value: '14', label: '14 点' },
  { value: '24', label: '24 点' },
]
const roomTypeCountOptions = Array.from({ length: 11 }, (_, index) => ({ value: String(index), label: String(index) }))
const roomTypePhotoSections = [
  { key: 'cover', label: '封面', limit: 1 },
  { key: 'livingRoom', label: '客厅', limit: 10 },
  { key: 'kitchen', label: '厨房', limit: 10 },
  { key: 'other', label: '其它', limit: 1000 },
  { key: 'bathroom', label: '卫浴', limit: 10 },
  { key: 'building', label: '建筑', limit: 10 },
  { key: 'entertainment', label: '娱乐', limit: 10 },
  { key: 'uncategorized', label: '未分类', limit: 100 },
] as const

export function RoomTypeInfoPage() {
  const location = useLocation()

  if (
    location.pathname.includes('/setting/roomTypeInfo/tag') ||
    location.pathname.endsWith('/setting/roomTypeInfo/tags') ||
    location.pathname.endsWith('/setting/roomTypeInfo/tagManage')
  ) {
    return <RoomTypeTagPage />
  }

  if (
    location.pathname.includes('/setting/roomTypeInfo/floor') ||
    location.pathname.endsWith('/setting/roomTypeInfo/floors') ||
    location.pathname.endsWith('/setting/roomTypeInfo/floorManage')
  ) {
    return <RoomTypeFloorPage />
  }

  if (location.pathname.endsWith('/edit')) {
    return <RoomTypeEditPage />
  }

  return <RoomTypeListPage />
}

function RoomTypeTagPage() {
  const navigate = useNavigate()
  const [pageData, setPageData] = useState<RoomTypeTagPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftRoomTypeId, setDraftRoomTypeId] = useState('')
  const [saving, setSaving] = useState(false)
  const [reloadSeed, setReloadSeed] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPage() {
      setLoading(true)
      setError('')
      try {
        const nextPageData = await loadRoomTypeTagPage(controller.signal)
        setPageData(nextPageData)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setPageData(null)
        setError(loadError instanceof Error ? loadError.message : '房型标签加载失败')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadPage()
    return () => controller.abort()
  }, [reloadSeed])

  useEffect(() => {
    if (!statusMessage) return
    const timer = window.setTimeout(() => setStatusMessage(''), 2400)
    return () => window.clearTimeout(timer)
  }, [statusMessage])

  async function handleCreateTag() {
    setSaving(true)
    try {
      const result = await createRoomTypeTag({ name: draftName, roomTypeId: draftRoomTypeId })
      setShowCreateModal(false)
      setDraftName('')
      setDraftRoomTypeId('')
      setStatusMessage(result.message)
      setReloadSeed((value) => value + 1)
    } catch (saveError) {
      setStatusMessage(saveError instanceof Error ? saveError.message : '房型标签创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="room-type-tags-page">
      <div className="room-type-tags-page__breadcrumb">
        <button type="button" onClick={() => navigate('/setting/roomTypeInfo')}>
          房型设置
        </button>
        <span>/</span>
        <strong>房型标签</strong>
      </div>

      <section className="room-type-tags-page__card">
        <div className="room-type-tags-page__toolbar">
          <button type="button" className="is-primary" onClick={() => setShowCreateModal(true)}>
            新增标签
          </button>
        </div>

        {loading ? <StatePanel title="房型标签加载中" detail="正在同步房型标签列表，请稍候。" /> : null}

        {!loading && error ? (
          <StatePanel
            title="房型标签加载失败"
            detail={error}
            action={<button onClick={() => setReloadSeed((value) => value + 1)}>重新加载</button>}
          />
        ) : null}

        {!loading && !error ? (
          <div className="room-type-tags-table" role="table" aria-label="房型标签列表">
            <div className="room-type-tags-table__head" role="row">
              <div role="columnheader">分组名称</div>
              <div role="columnheader">房型</div>
              <div role="columnheader">操作</div>
            </div>
            {pageData?.rows.length ? (
              <div className="room-type-tags-table__body">
                {pageData.rows.map((row) => (
                  <div key={row.id} className="room-type-tags-table__row" role="row">
                    <div role="cell">{row.name}</div>
                    <div role="cell">{row.roomTypeNames.join('、')}</div>
                    <div role="cell" className="room-type-tags-table__actions">
                      <button type="button" onClick={() => setStatusMessage(`已查看 ${row.name} 标签`)}>
                        详情
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="room-type-tags-table__empty" role="status" aria-label="房型标签空态">
                <div className="room-type-tags-table__empty-icon" aria-hidden="true" />
                <span>暂无数据</span>
              </div>
            )}
          </div>
        ) : null}
      </section>

      {showCreateModal ? (
        <div className="room-type-info-modal-backdrop room-type-tags-modal-backdrop">
          <div className="room-type-tags-modal" role="dialog" aria-label="添加房型标签" aria-modal="true">
            <div className="room-type-tags-modal__header">
              <h2>添加房型标签</h2>
              <button type="button" aria-label="关闭添加房型标签" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="room-type-tags-modal__body">
              <label className="room-type-tags-modal__field">
                <span>
                  <b>*</b> 分组名称:
                </span>
                <input value={draftName} placeholder="请输入" onChange={(event) => setDraftName(event.target.value)} />
              </label>
              <label className="room-type-tags-modal__field">
                <span>关联房型:</span>
                <select value={draftRoomTypeId} onChange={(event) => setDraftRoomTypeId(event.target.value)}>
                  <option value="">选择关联房型</option>
                  {pageData?.roomTypeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="room-type-tags-modal__actions">
              <button type="button" onClick={() => setShowCreateModal(false)}>
                取 消
              </button>
              <button type="button" className="is-primary" disabled={saving} onClick={() => void handleCreateTag()}>
                确 定
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="room-type-info-status" role="status" aria-live="polite">
          {statusMessage}
        </div>
      ) : null}
    </div>
  )
}

function RoomTypeFloorPage() {
  const navigate = useNavigate()
  const [pageData, setPageData] = useState<RoomTypeFloorPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftRoomTypeId, setDraftRoomTypeId] = useState('')
  const [saving, setSaving] = useState(false)
  const [reloadSeed, setReloadSeed] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPage() {
      setLoading(true)
      setError('')
      try {
        const nextPageData = await loadRoomTypeFloorPage(controller.signal)
        setPageData(nextPageData)
      } catch (loadError) {
        if (controller.signal.aborted) return
        setPageData(null)
        setError(loadError instanceof Error ? loadError.message : '楼层信息加载失败')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadPage()
    return () => controller.abort()
  }, [reloadSeed])

  useEffect(() => {
    if (!statusMessage) return
    const timer = window.setTimeout(() => setStatusMessage(''), 2400)
    return () => window.clearTimeout(timer)
  }, [statusMessage])

  async function handleCreateFloor() {
    setSaving(true)
    try {
      const result = await createRoomTypeFloor({ name: draftName, roomTypeId: draftRoomTypeId })
      setShowCreateModal(false)
      setDraftName('')
      setDraftRoomTypeId('')
      setStatusMessage(result.message)
      setReloadSeed((value) => value + 1)
    } catch (saveError) {
      setStatusMessage(saveError instanceof Error ? saveError.message : '楼层信息创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="room-type-tags-page room-type-floors-page">
      <div className="room-type-tags-page__breadcrumb">
        <button type="button" onClick={() => navigate('/setting/roomTypeInfo')}>
          房型设置
        </button>
        <span>/</span>
        <strong>楼层管理</strong>
      </div>

      <section className="room-type-tags-page__card">
        <div className="room-type-tags-page__toolbar">
          <button type="button" className="is-primary" onClick={() => setShowCreateModal(true)}>
            添加楼层
          </button>
        </div>

        {loading ? <StatePanel title="楼层信息加载中" detail="正在同步楼层列表，请稍候。" /> : null}

        {!loading && error ? (
          <StatePanel
            title="楼层信息加载失败"
            detail={error}
            action={<button onClick={() => setReloadSeed((value) => value + 1)}>重新加载</button>}
          />
        ) : null}

        {!loading && !error ? (
          <div className="room-type-tags-table" role="table" aria-label="楼层信息列表">
            <div className="room-type-tags-table__head" role="row">
              <div role="columnheader">楼层名</div>
              <div role="columnheader">房间</div>
              <div role="columnheader">操作</div>
            </div>
            {pageData?.rows.length ? (
              <div className="room-type-tags-table__body">
                {pageData.rows.map((row) => (
                  <div key={row.id} className="room-type-tags-table__row" role="row">
                    <div role="cell">{row.name}</div>
                    <div role="cell">{row.roomTypeNames.join('、')}</div>
                    <div role="cell" className="room-type-tags-table__actions">
                      <button type="button" onClick={() => setStatusMessage(`已查看${row.name}楼层`)}>
                        详情
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="room-type-tags-table__empty" role="status" aria-label="楼层信息空状态">
                <div className="room-type-tags-table__empty-icon" aria-hidden="true" />
                <span>暂无数据</span>
              </div>
            )}
          </div>
        ) : null}
      </section>

      {showCreateModal ? (
        <div className="room-type-info-modal-backdrop room-type-tags-modal-backdrop">
          <div className="room-type-tags-modal room-type-floors-modal" role="dialog" aria-label="添加楼层" aria-modal="true">
            <div className="room-type-tags-modal__header">
              <h2>添加楼层</h2>
              <button type="button" aria-label="关闭添加楼层" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="room-type-tags-modal__body">
              <label className="room-type-tags-modal__field">
                <span>
                  <b>*</b> 楼层名称:
                </span>
                <input value={draftName} placeholder="请输入" onChange={(event) => setDraftName(event.target.value)} />
              </label>
              <label className="room-type-tags-modal__field">
                <span>关联房间:</span>
                <select value={draftRoomTypeId} onChange={(event) => setDraftRoomTypeId(event.target.value)}>
                  <option value="">请选择</option>
                  {pageData?.roomTypeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="room-type-tags-modal__actions">
              <button type="button" onClick={() => setShowCreateModal(false)}>
                取 消
              </button>
              <button type="button" className="is-primary" disabled={saving} onClick={() => void handleCreateFloor()}>
                确 定
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="room-type-info-status" role="status" aria-live="polite">
          {statusMessage}
        </div>
      ) : null}
    </div>
  )
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
            <button type="button" onClick={() => navigate('/setting/roomTypeInfo/tag')}>
              标签管理
            </button>
            <button type="button" onClick={() => navigate('/setting/roomTypeInfo/floor')}>
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

  function updateForm<Key extends keyof RoomTypeInfoDraft['form']>(key: Key, value: RoomTypeInfoDraft['form'][Key]) {
    if (!draft) return
    setDraft({ ...draft, form: { ...draft.form, [key]: value } })
  }

  function syncRoomCount(nextCountText: string) {
    if (!draft) return
    const safeCount = Math.max(1, Number.parseInt(nextCountText, 10) || 1)
    const currentRoomNos = draft.form.roomNos.length ? [...draft.form.roomNos] : ['房间1']
    const nextRoomNos =
      currentRoomNos.length >= safeCount
        ? currentRoomNos.slice(0, safeCount)
        : [
            ...currentRoomNos,
            ...Array.from({ length: safeCount - currentRoomNos.length }, (_, index) => `房间${currentRoomNos.length + index + 1}`),
          ]

    setDraft({
      ...draft,
      form: {
        ...draft.form,
        roomCount: String(safeCount),
        roomNos: nextRoomNos,
      },
    })
  }

  function updateRoomNo(index: number, value: string) {
    if (!draft) return
    const nextRoomNos = draft.form.roomNos.map((item, currentIndex) => (currentIndex === index ? value : item))
    updateForm('roomNos', nextRoomNos)
  }

  function addRoomNo() {
    if (!draft) return
    const nextRoomNos = [...draft.form.roomNos, `房间${draft.form.roomNos.length + 1}`]
    setDraft({
      ...draft,
      form: {
        ...draft.form,
        roomNos: nextRoomNos,
        roomCount: String(nextRoomNos.length),
      },
    })
  }

  function removeRoomNo(index: number) {
    if (!draft || draft.form.roomNos.length <= 1) return
    const nextRoomNos = draft.form.roomNos.filter((_, currentIndex) => currentIndex !== index)
    setDraft({
      ...draft,
      form: {
        ...draft.form,
        roomNos: nextRoomNos,
        roomCount: String(nextRoomNos.length),
      },
    })
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

  const isCreateMode = draft.mode === 'create'

  return (
    <div className="room-type-edit-page">
      <div className="room-type-edit-page__breadcrumb">
        <button type="button" onClick={() => navigate('/setting/roomTypeInfo')}>
          房型设置
        </button>
        <span>/</span>
        <strong>{draft.title}</strong>
      </div>

      <section className="room-type-edit-page__shell">
        <div className="room-type-edit-page__tabs" aria-label="房型设置步骤">
          {draft.steps.map((step, index) => (
            <button
              key={step}
              type="button"
              className={index === activeStep ? 'is-active' : ''}
              aria-current={index === activeStep ? 'step' : undefined}
              onClick={() => setActiveStep(index)}
            >
              {step}
            </button>
          ))}
        </div>

        <div className="room-type-edit-page__panel">
          {activeStep === 0 ? (
            <section className="room-type-edit-page__section">
              <h2>基础信息</h2>
              <div className="room-type-edit-page__field-list">
                <label className="room-type-edit-page__field">
                  <span>所属门店:</span>
                  <select
                    aria-label="所属门店"
                    value={draft.form.storeId}
                    onChange={(event) => updateForm('storeId', event.target.value)}
                  >
                    {roomTypeEditStoreOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="room-type-edit-page__field">
                  <span>房型名称:</span>
                  <div className="room-type-edit-page__field-stack">
                    <input
                      aria-label="房型名称"
                      value={draft.form.roomTypeName}
                      placeholder="请输入房型名称"
                      onChange={(event) => updateForm('roomTypeName', event.target.value)}
                    />
                    <small>内部自用，不对外展示</small>
                  </div>
                </label>

                <label className="room-type-edit-page__field">
                  <span>房间数量:</span>
                  <div className="room-type-edit-page__suffix-input">
                    <input
                      aria-label="房间数量"
                      inputMode="numeric"
                      value={draft.form.roomCount}
                      onChange={(event) => syncRoomCount(event.target.value)}
                    />
                    <em>间</em>
                  </div>
                </label>

                <div className="room-type-edit-page__field">
                  <span>房间号:</span>
                  <div className="room-type-edit-page__room-list">
                    {draft.form.roomNos.map((roomNo, index) => (
                      <div key={`${index}-${roomNo}`} className="room-type-edit-page__room-row">
                        <input
                          aria-label={`房间号${index + 1}`}
                          value={roomNo}
                          onChange={(event) => updateRoomNo(index, event.target.value)}
                        />
                        <button type="button" className="room-type-edit-page__room-remove" aria-label={`删除房间号${index + 1}`} onClick={() => removeRoomNo(index)}>
                          ⊖
                        </button>
                        {index === 0 ? (
                          <button type="button" className="is-primary room-type-edit-page__room-add" onClick={() => addRoomNo()}>
                            ＋ 添加房间
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <label className="room-type-edit-page__field">
                  <span>平日价:</span>
                  <div className="room-type-edit-page__suffix-input">
                    <input
                      aria-label="平日价"
                      inputMode="decimal"
                      value={draft.form.weekdayPrice}
                      placeholder="请输入平日价"
                      onChange={(event) => updateForm('weekdayPrice', event.target.value)}
                    />
                    <em>元</em>
                  </div>
                </label>

                <label className="room-type-edit-page__field">
                  <span>周末价:</span>
                  <div className="room-type-edit-page__suffix-input">
                    <input
                      aria-label="周末价"
                      inputMode="decimal"
                      value={draft.form.weekendPrice}
                      placeholder="请输入周末价"
                      onChange={(event) => updateForm('weekendPrice', event.target.value)}
                    />
                    <em>元</em>
                  </div>
                </label>

                <label className="room-type-edit-page__field">
                  <span>节假日价:</span>
                  <div className="room-type-edit-page__suffix-input">
                    <input
                      aria-label="节假日价"
                      inputMode="decimal"
                      value={draft.form.holidayPrice}
                      placeholder="请输入节假日价"
                      onChange={(event) => updateForm('holidayPrice', event.target.value)}
                    />
                    <em>元</em>
                  </div>
                </label>

                <p className="room-type-edit-page__tip">
                  创建完成房源后，价格请前往<span>房态房价-房价管理</span>处查看与管理
                </p>
              </div>
            </section>
          ) : null}

          {activeStep === 1 ? (
            <section className="room-type-edit-page__section">
              <h2>位置信息</h2>
              <div className="room-type-edit-page__field-list">
                <div className="room-type-edit-page__field">
                  <span>所在位置:</span>
                  <div className="room-type-edit-page__radio-row">
                    <label>
                      <input
                        type="radio"
                        name="location-mode"
                        checked={draft.form.locationMode === 'same-store'}
                        onChange={() => updateForm('locationMode', 'same-store')}
                      />
                      同门店位置
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="location-mode"
                        checked={draft.form.locationMode === 'independent'}
                        onChange={() => updateForm('locationMode', 'independent')}
                      />
                      独立位置
                    </label>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 2 ? (
            <section className="room-type-edit-page__section">
              <h2>房型信息</h2>
              <div className="room-type-edit-page__field-list">
                <label className="room-type-edit-page__field">
                  <span>出租类型:</span>
                  <select aria-label="出租类型" value={draft.form.rentalType} onChange={(event) => updateForm('rentalType', event.target.value)}>
                    {roomTypeRentalTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="room-type-edit-page__field">
                  <span>房源类型:</span>
                  <select aria-label="房源类型" value={draft.form.propertyType} onChange={(event) => updateForm('propertyType', event.target.value)}>
                    {roomTypePropertyTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="room-type-edit-page__field">
                  <span>整套面积:</span>
                  <div className="room-type-edit-page__suffix-input">
                    <input
                      aria-label="整套面积"
                      inputMode="decimal"
                      value={draft.form.suiteArea}
                      onChange={(event) => updateForm('suiteArea', event.target.value)}
                    />
                    <em>㎡</em>
                  </div>
                </label>

                <label className="room-type-edit-page__field">
                  <span>可住人数:</span>
                  <div className="room-type-edit-page__suffix-input">
                    <input
                      aria-label="可住人数"
                      inputMode="numeric"
                      value={draft.form.guestCount}
                      onChange={(event) => updateForm('guestCount', event.target.value)}
                    />
                    <em>人</em>
                  </div>
                </label>

                <div className="room-type-edit-page__field">
                  <span>整套户型:</span>
                  <div className="room-type-edit-page__suite-grid">
                    <select aria-label="室" value={draft.form.bedroomCount} onChange={(event) => updateForm('bedroomCount', event.target.value)}>
                      {roomTypeCountOptions.map((option) => (
                        <option key={`bedroom-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <b>室</b>
                    <select aria-label="厅" value={draft.form.livingRoomCount} onChange={(event) => updateForm('livingRoomCount', event.target.value)}>
                      {roomTypeCountOptions.map((option) => (
                        <option key={`living-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <b>厅</b>
                    <select aria-label="厨" value={draft.form.kitchenCount} onChange={(event) => updateForm('kitchenCount', event.target.value)}>
                      {roomTypeCountOptions.map((option) => (
                        <option key={`kitchen-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <b>厨</b>
                    <select aria-label="卫" value={draft.form.bathroomCount} onChange={(event) => updateForm('bathroomCount', event.target.value)}>
                      {roomTypeCountOptions.map((option) => (
                        <option key={`bathroom-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <b>卫</b>
                  </div>
                </div>

                <div className="room-type-edit-page__field">
                  <span>卫生间类型:</span>
                  <div className="room-type-edit-page__radio-row">
                    <label>
                      <input
                        type="radio"
                        name="bathroom-type"
                        checked={draft.form.bathroomType === 'private'}
                        onChange={() => updateForm('bathroomType', 'private')}
                      />
                      独卫
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="bathroom-type"
                        checked={draft.form.bathroomType === 'shared'}
                        onChange={() => updateForm('bathroomType', 'shared')}
                      />
                      公卫
                    </label>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 3 ? (
            <section className="room-type-edit-page__section">
              <h2>详细介绍</h2>
              <div className="room-type-edit-page__field-list">
                <label className="room-type-edit-page__field">
                  <span>对外展示名称:</span>
                  <input
                    aria-label="对外展示名称"
                    value={draft.form.displayName}
                    placeholder="请输入"
                    onChange={(event) => updateForm('displayName', event.target.value)}
                  />
                </label>

                <label className="room-type-edit-page__field">
                  <span>最早入住时间:</span>
                  <select aria-label="最早入住时间" value={draft.form.earliestCheckIn} onChange={(event) => updateForm('earliestCheckIn', event.target.value)}>
                    {roomTypeTimeOptions.map((option) => (
                      <option key={`earliest-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="room-type-edit-page__field">
                  <span>最晚离店时间:</span>
                  <select aria-label="最晚离店时间" value={draft.form.latestCheckOut} onChange={(event) => updateForm('latestCheckOut', event.target.value)}>
                    {roomTypeTimeOptions.map((option) => (
                      <option key={`checkout-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="room-type-edit-page__field">
                  <span>最晚入住时间:</span>
                  <select aria-label="最晚入住时间" value={draft.form.latestCheckIn} onChange={(event) => updateForm('latestCheckIn', event.target.value)}>
                    {roomTypeTimeOptions.map((option) => (
                      <option key={`checkin-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="room-type-edit-page__field is-textarea">
                  <span>亮点介绍:</span>
                  <textarea
                    aria-label="亮点介绍"
                    value={draft.form.highlightDescription}
                    onChange={(event) => updateForm('highlightDescription', event.target.value)}
                  />
                </label>

                <label className="room-type-edit-page__field is-textarea">
                  <span>周边介绍:</span>
                  <textarea
                    aria-label="周边介绍"
                    value={draft.form.nearbyDescription}
                    onChange={(event) => updateForm('nearbyDescription', event.target.value)}
                  />
                </label>

                <div className="room-type-edit-page__field is-editor">
                  <span>图文介绍:</span>
                  <div className="room-type-edit-page__editor">
                    <div className="room-type-edit-page__editor-toolbar" aria-hidden="true">
                      <button type="button">H</button>
                      <button type="button">B</button>
                      <button type="button">I</button>
                      <button type="button">U</button>
                      <button type="button">S</button>
                      <span>字号</span>
                      <span>行高</span>
                      <button type="button">Pen</button>
                      <button type="button">Bg</button>
                      <button type="button">Link</button>
                      <button type="button">UL</button>
                      <button type="button">OL</button>
                      <button type="button">Q</button>
                      <button type="button">Face</button>
                      <button type="button">Table</button>
                      <button type="button">Undo</button>
                      <button type="button">Redo</button>
                      <button type="button">Img</button>
                      <span>预览</span>
                    </div>
                    <textarea
                      aria-label="图文介绍正文"
                      value={draft.form.articleDescription}
                      placeholder="请输入正文"
                      onChange={(event) => updateForm('articleDescription', event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 4 ? (
            <section className="room-type-edit-page__section">
              <h2>照片信息</h2>
              <div className="room-type-edit-page__photo-list">
                {roomTypePhotoSections.map((section) => (
                  <div key={section.key} className="room-type-edit-page__photo-row">
                    <span>
                      {section.label}({draft.form.photoCounts[section.key] ?? 0}/{section.limit}):
                    </span>
                    <button type="button" className="room-type-edit-page__upload-card">
                      <b>＋</b>
                      <em>上传</em>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <div className="room-type-edit-page__actions">
        {activeStep < draft.steps.length - 1 ? (
          <button
            type="button"
            className="is-primary-ghost"
            onClick={() => setActiveStep(Math.min(activeStep + 1, draft.steps.length - 1))}
          >
            下一步
          </button>
        ) : null}

        {activeStep === 0 && isCreateMode ? (
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              updateForm('roomNos', createQuickRoomNoSuggestion(draft.form.roomCount))
              setStatusMessage('已生成房间号草案')
            }}
          >
            快捷创建
          </button>
        ) : null}

        {(activeStep > 0 || !isCreateMode) ? (
          <button type="button" className="is-primary" disabled={saving} onClick={() => void handleSave()}>
            保存并退出
          </button>
        ) : null}
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
