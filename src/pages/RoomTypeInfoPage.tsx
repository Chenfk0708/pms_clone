import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createRoomTypeFloor,
  createRoomTypeTag,
  createQuickRoomNoSuggestion,
  deleteRoomType,
  getRoomTypeInfoProviderName,
  loadRoomTypeFloorPage,
  loadRoomTypeInfoDashboard,
  loadRoomTypeInfoDraft,
  loadRoomTypeLinkage,
  loadRoomTypeRooms,
  loadRoomTypeTagPage,
  saveRoomTypeDraft,
  saveRoomTypeLinkage,
  uploadRoomTypePhoto,
  type RoomTypeInfoDashboard,
  type RoomTypeInfoDraft,
  type RoomTypeInfoEditMode,
  type RoomTypeFloorPageData,
  type RoomTypeInfoLinkageDialog,
  type RoomTypePhoto,
  type RoomTypePhotoSectionKey,
  type RoomTypeInfoQuery,
  type RoomTypeInfoRow,
  type RoomTypeInfoRoomsDialog,
  type RoomTypeTagPageData,
} from '../services/roomTypeInfo'
import { fetchStoreOptions, type StoreOption } from '../services/storeOptions'
import { RoomTypeLocationSection } from '../components/RoomTypeLocationSection'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './RoomTypeInfoPage.css'

type OpenSelect = 'group' | null
type RoomTypePhotoSection = (typeof roomTypePhotoSections)[number]

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
  storeId: 'all',
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
  ...Array.from({ length: 24 }, (_, index) => {
    const hour = String(index + 1)
    return { value: hour, label: `${hour} 点` }
  }),
]
const roomTypeCountOptions = Array.from({ length: 11 }, (_, index) => ({ value: String(index), label: String(index) }))
const roomTypeBedSheetChangeOptions = [
  { value: '', label: '请选择' },
  { value: 'one-guest-one-change', label: '一客一换' },
  { value: 'daily', label: '每天更换' },
  { value: 'two-days', label: '每两天更换' },
  { value: 'weekly', label: '每周更换' },
]
const roomTypeDecorationStyleOptions = [
  { value: '', label: '请选择' },
  { value: 'modern', label: '现代简约' },
  { value: 'nordic', label: '北欧' },
  { value: 'chinese', label: '新中式' },
  { value: 'japanese', label: '日式' },
  { value: 'luxury', label: '轻奢' },
]
const roomTypeFacilityGroups = [
  {
    title: '核心设施（必填）',
    options: [
      { id: 'air-conditioner', label: '空调' },
      { id: 'tv', label: '电视' },
      { id: 'fridge', label: '冰箱' },
      { id: 'washer', label: '洗衣机' },
      { id: 'water-heater', label: '热水器' },
      { id: 'wifi', label: '无线网络' },
      { id: 'kitchen', label: '厨房' },
      { id: 'dining-table', label: '餐桌' },
      { id: 'disposable-cup', label: '一次性杯子' },
      { id: 'range-hood', label: '抽油烟机' },
    ],
  },
  {
    title: '入住服务',
    options: [
      { id: 'self-checkin', label: '自助入住' },
      { id: 'free-parking', label: '免费停车' },
      { id: 'paid-parking', label: '付费停车' },
      { id: 'luggage-storage', label: '行李寄存' },
      { id: 'airport-transfer', label: '接送机' },
      { id: 'breakfast', label: '早餐' },
      { id: 'car-rental', label: '租车服务' },
      { id: 'ev-charger', label: '充电车位' },
      { id: 'free-water', label: '免费瓶装水' },
      { id: 'team-building', label: '支持团建会议' },
      { id: 'long-rent', label: '可长租' },
      { id: 'butler', label: '管家式服务' },
    ],
  },
  {
    title: '儿童',
    options: [
      { id: 'kids-books', label: '儿童书籍' },
      { id: 'kids-toys', label: '儿童玩具' },
      { id: 'kids-tableware', label: '儿童餐具' },
      { id: 'kids-chair', label: '儿童专用椅' },
      { id: 'kids-bath', label: '儿童洗浴设施' },
      { id: 'corner-protection', label: '桌角防护' },
      { id: 'stroller', label: '儿童推车' },
      { id: 'kids-guardrail', label: '儿童护栏' },
      { id: 'learning-machine', label: '智能学习机' },
      { id: 'storybook-machine', label: '绘本故事机' },
      { id: 'kids-tent', label: '儿童帐篷' },
      { id: 'kids-slide', label: '儿童秋千滑梯' },
      { id: 'kids-robot', label: '儿童智能机器人' },
      { id: 'diaper-table', label: '婴儿尿布台' },
    ],
  },
  {
    title: '卫生',
    control: 'bedSheetChange',
    options: [
      { id: 'cleaning-tools', label: '打扫工具' },
      { id: 'hand-sanitizer', label: '消毒洗手液' },
      { id: 'home-disinfectant', label: '家用消毒液' },
      { id: 'disposable-gloves', label: '一次性手套' },
      { id: 'disinfectant', label: '除菌液' },
      { id: 'air-purifier', label: '空气净化器' },
      { id: 'fresh-air', label: '新风系统' },
      { id: 'disposable-toilet-cover', label: '一次性马桶套' },
      { id: 'disposable-bathtub-cover', label: '一次性浴缸套' },
      { id: 'disposable-towel', label: '一次性毛巾' },
      { id: 'odor-proof-drain', label: '防臭地漏' },
      { id: 'air-freshener', label: '空气清新剂' },
      { id: 'mosquito-coil', label: '蚊香' },
      { id: 'insecticide', label: '杀虫剂' },
      { id: 'white-bedding', label: '白色床品' },
    ],
  },
  {
    title: '周边500米',
    options: [
      { id: 'market', label: '菜市场' },
      { id: 'park', label: '公园' },
      { id: 'supermarket', label: '超市' },
      { id: 'restaurant', label: '餐厅' },
      { id: 'pharmacy', label: '药店' },
      { id: 'atm', label: '提款机' },
      { id: 'garden', label: '公共花园' },
      { id: 'playground', label: '儿童乐园' },
      { id: 'gym', label: '健身房' },
      { id: 'pool', label: '泳池' },
    ],
  },
  {
    title: '质量',
    control: 'decorationStyle',
    options: [],
  },
] as const
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
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: dashboard?.stores ?? [{ id: 'all', label: '全部门店' }],
  })

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
        <StoreSelectControl
          className="room-type-info-store-select"
          label="门店"
          options={storeOptions.map((store) => ({ id: store.id, name: store.label }))}
          value={queryDraft.storeId}
          disabled={storeLoading}
          onChange={(storeId) => {
            setQueryDraft({ ...queryDraft, storeId })
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
                    <div role="cell" className="room-type-info-room-name">
                      {row.coverImageUrl ? (
                        <img className="room-type-info-room-name__thumb" src={row.coverImageUrl} alt={`${row.name}照片`} />
                      ) : (
                        <span className="room-type-info-room-name__placeholder" aria-hidden="true" />
                      )}
                      <span className="room-type-info-room-name__text" title={row.name}>
                        {row.name}
                      </span>
                    </div>
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
            删除房型后将无法恢复。当前或未来已有订单时不能删除；确认无相关订单后，房间和未完成保洁任务将同步删除。
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
  const [uploadingPhotoSections, setUploadingPhotoSections] = useState<Partial<Record<RoomTypePhotoSectionKey, boolean>>>({})
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>(roomTypeEditStoreOptions)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDraft() {
      setLoading(true)
      setError('')
      try {
        const [nextDraft, nextStoreOptions] = await Promise.all([
          loadRoomTypeInfoDraft(mode, roomTypeId, controller.signal),
          getRoomTypeInfoProviderName() === 'api'
            ? fetchStoreOptions({ signal: controller.signal, includeAll: false })
            : Promise.resolve(roomTypeEditStoreOptions),
        ])
        setStoreOptions(nextStoreOptions.length ? nextStoreOptions : roomTypeEditStoreOptions)
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

  function updateFormPatch(patch: Partial<RoomTypeInfoDraft['form']>) {
    if (!draft) return
    setDraft({ ...draft, form: { ...draft.form, ...patch } })
  }

  function toggleFacilityOption(optionId: string) {
    if (!draft) return
    const selectedFacilityIds = draft.form.selectedFacilityIds.includes(optionId)
      ? draft.form.selectedFacilityIds.filter((item) => item !== optionId)
      : [...draft.form.selectedFacilityIds, optionId]
    updateForm('selectedFacilityIds', selectedFacilityIds)
  }

  function syncRoomCount(nextCountText: string) {
    if (!draft) return
    const safeCount = Math.max(1, Number.parseInt(nextCountText, 10) || 1)
    const currentRoomNos = draft.form.roomNos.length ? [...draft.form.roomNos] : ['房间1']
    const currentRoomIds = draft.form.roomIds.length ? [...draft.form.roomIds] : []
    const nextRoomNos =
      currentRoomNos.length >= safeCount
        ? currentRoomNos.slice(0, safeCount)
        : [
            ...currentRoomNos,
            ...Array.from({ length: safeCount - currentRoomNos.length }, (_, index) => `房间${currentRoomNos.length + index + 1}`),
          ]
    const nextRoomIds =
      currentRoomIds.length >= safeCount
        ? currentRoomIds.slice(0, safeCount)
        : [...currentRoomIds, ...Array.from({ length: safeCount - currentRoomIds.length }, () => '')]

    setDraft({
      ...draft,
      form: {
        ...draft.form,
        roomCount: String(safeCount),
        roomIds: nextRoomIds,
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
    const nextRoomIds = [...draft.form.roomIds, '']
    setDraft({
      ...draft,
      form: {
        ...draft.form,
        roomIds: nextRoomIds,
        roomNos: nextRoomNos,
        roomCount: String(nextRoomNos.length),
      },
    })
  }

  function removeRoomNo(index: number) {
    if (!draft || draft.form.roomNos.length <= 1) return
    const nextRoomNos = draft.form.roomNos.filter((_, currentIndex) => currentIndex !== index)
    const nextRoomIds = draft.form.roomIds.filter((_, currentIndex) => currentIndex !== index)
    setDraft({
      ...draft,
      form: {
        ...draft.form,
        roomIds: nextRoomIds,
        roomNos: nextRoomNos,
        roomCount: String(nextRoomNos.length),
      },
    })
  }

  async function handlePhotoFiles(section: RoomTypePhotoSection, fileList: FileList | null) {
    if (!draft || !fileList?.length) return

    const existingCount = draft.form.photos.filter((photo) => photo.sectionKey === section.key).length
    const remaining = section.limit - existingCount
    const files = Array.from(fileList).slice(0, Math.max(0, remaining))
    if (!files.length) {
      setStatusMessage(`${section.label}最多上传 ${section.limit} 张`)
      return
    }

    setUploadingPhotoSections((value) => ({ ...value, [section.key]: true }))
    try {
      for (const file of files) {
        const uploadedPhoto = await uploadRoomTypePhoto({
          file,
          sectionKey: section.key,
          roomTypeId: draft.form.roomTypeId,
        })
        appendRoomTypePhoto(section.key, uploadedPhoto)
      }
      setStatusMessage('照片上传成功')
    } catch (uploadError) {
      setStatusMessage(uploadError instanceof Error ? uploadError.message : '照片上传失败')
    } finally {
      setUploadingPhotoSections((value) => ({ ...value, [section.key]: false }))
    }
  }

  function appendRoomTypePhoto(sectionKey: RoomTypePhotoSectionKey, photo: RoomTypePhoto) {
    setDraft((currentDraft) => {
      if (!currentDraft) return currentDraft
      const sectionPhotoCount = currentDraft.form.photos.filter((item) => item.sectionKey === sectionKey).length
      const nextPhotos = [
        ...currentDraft.form.photos,
        {
          ...photo,
          sectionKey,
          sortOrder: photo.sortOrder || sectionPhotoCount + 1,
        },
      ]
      return {
        ...currentDraft,
        form: {
          ...currentDraft.form,
          photos: nextPhotos,
          photoCounts: buildPhotoCounts(nextPhotos),
        },
      }
    })
  }

  function removeRoomTypePhoto(photoId: string) {
    setDraft((currentDraft) => {
      if (!currentDraft) return currentDraft
      const nextPhotos = currentDraft.form.photos.filter((photo) => photo.id !== photoId)
      return {
        ...currentDraft,
        form: {
          ...currentDraft.form,
          photos: nextPhotos,
          photoCounts: buildPhotoCounts(nextPhotos),
        },
      }
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
                    {storeOptions.map((option) => (
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
              <RoomTypeLocationSection form={draft.form} onChange={updateFormPatch} />
            </section>
          ) : null}

          {activeStep === 2 ? (
            <section className="room-type-edit-page__section">
              <h2>房型设施</h2>
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

              <div className="room-type-facility-section">
                {roomTypeFacilityGroups.map((group) => (
                  <section className="room-type-facility-section__group" key={group.title}>
                    <h3>{group.title}</h3>

                    {'control' in group && group.control === 'bedSheetChange' ? (
                      <label className="room-type-facility-section__inline-field">
                        <span>床品更换:</span>
                        <select
                          aria-label="床品更换"
                          value={draft.form.bedSheetChangePolicy}
                          onChange={(event) => updateForm('bedSheetChangePolicy', event.target.value)}
                        >
                          {roomTypeBedSheetChangeOptions.map((option) => (
                            <option key={option.value || 'empty-bed-sheet-policy'} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {'control' in group && group.control === 'decorationStyle' ? (
                      <label className="room-type-facility-section__inline-field">
                        <span>装修风格:</span>
                        <select
                          aria-label="装修风格"
                          value={draft.form.decorationStyle}
                          onChange={(event) => updateForm('decorationStyle', event.target.value)}
                        >
                          {roomTypeDecorationStyleOptions.map((option) => (
                            <option key={option.value || 'empty-decoration-style'} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {group.options.length ? (
                      <div className="room-type-facility-section__options">
                        {group.options.map((option) => {
                          const isSelected = draft.form.selectedFacilityIds.includes(option.id)
                          return (
                            <button
                              type="button"
                              className={isSelected ? 'is-selected' : ''}
                              aria-pressed={isSelected}
                              onClick={() => toggleFacilityOption(option.id)}
                              key={option.id}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                  </section>
                ))}
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
                {roomTypePhotoSections.map((section) => {
                  const sectionPhotos = draft.form.photos.filter((photo) => photo.sectionKey === section.key)
                  const isUploading = Boolean(uploadingPhotoSections[section.key])
                  const canUploadMore = sectionPhotos.length < section.limit
                  return (
                    <div key={section.key} className="room-type-edit-page__photo-row">
                      <span>
                        {section.label}({sectionPhotos.length}/{section.limit}):
                      </span>
                      <div className="room-type-edit-page__photo-items">
                        {sectionPhotos.map((photo) => (
                          <figure className="room-type-edit-page__photo-thumb" key={photo.id}>
                            <img src={photo.url} alt={photo.name} />
                            <figcaption title={photo.name}>{photo.name}</figcaption>
                            <button type="button" aria-label={`删除${photo.name}`} onClick={() => removeRoomTypePhoto(photo.id)}>
                              删除
                            </button>
                          </figure>
                        ))}
                        {canUploadMore ? (
                          <label className={isUploading ? 'room-type-edit-page__upload-card is-disabled' : 'room-type-edit-page__upload-card'}>
                            <input
                              className="room-type-edit-page__photo-input"
                              type="file"
                              accept="image/*"
                              multiple={section.limit > 1}
                              aria-label={`上传${section.label}`}
                              disabled={isUploading}
                              onChange={(event) => {
                                void handlePhotoFiles(section, event.target.files)
                                event.currentTarget.value = ''
                              }}
                            />
                            <b>＋</b>
                            <em>{isUploading ? '上传中' : '上传'}</em>
                          </label>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
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
              updateFormPatch({
                roomIds: [],
                roomNos: createQuickRoomNoSuggestion(draft.form.roomCount),
              })
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

function buildPhotoCounts(photos: RoomTypePhoto[]) {
  return Object.fromEntries(
    roomTypePhotoSections.map((section) => [section.key, photos.filter((photo) => photo.sectionKey === section.key).length]),
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
