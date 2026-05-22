import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createDefaultDistributionFilters,
  distributionListEndpoints,
  fetchDistributionDashboard,
  type DistributionChannel,
  type DistributionDashboard,
  type DistributionFilters,
  type DistributionProgress,
  type DistributionRoomCategory,
  type DistributionTab,
} from '../services/distributionList'
import './DistributionListPage.css'

const actionButtons = [
  { label: '提现教程', route: '/statistics/distributionOrder' },
  { label: '房态管理', route: '/houseManage/months' },
  { label: '房价管理', route: '/houseManage/houseCale' },
  { label: '房型管理', route: '/setting/roomTypeInfo' },
]

type ImportDialogMode = 'store' | 'room' | null

const importStoreOptions = [
  '天落会宿公寓(前海壹方城宝安中心店)',
  '天落会宿公寓(科技园店)',
]

export function DistributionListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<DistributionFilters>(() =>
    createDefaultDistributionFilters(new URLSearchParams(window.location.search)),
  )
  const [dashboard, setDashboard] = useState<DistributionDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [drawerRoomId, setDrawerRoomId] = useState<string | null>(null)
  const [roomProgressMap, setRoomProgressMap] = useState<Record<string, DistributionProgress>>({})
  const [importMenuOpen, setImportMenuOpen] = useState(false)
  const [importDialogMode, setImportDialogMode] = useState<ImportDialogMode>(null)

  const updateFilters = (nextFilters: (current: DistributionFilters) => DistributionFilters) => {
    setNotice('')
    setLoading(true)
    setError('')
    setOpenMenuId(null)
    setImportMenuOpen(false)
    setFilters(nextFilters)
  }

  useEffect(() => {
    let active = true

    fetchDistributionDashboard(filters)
      .then((result) => {
        if (!active) return
        setDashboard(result)
        setLoading(false)
      })
      .catch((reason: Error) => {
        if (!active) return
        setDashboard(null)
        setError(reason.message)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filters])

  useEffect(() => {
    if (!dashboard) return
    const nextMap = [...dashboard.distributedRooms, ...dashboard.undistributedRooms].reduce<Record<string, DistributionProgress>>(
      (result, room) => {
        result[room.id] = room.progress
        return result
      },
      {},
    )
    setRoomProgressMap(nextMap)
  }, [dashboard])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const visibleRows = useMemo(() => {
    if (!dashboard) return []
    const list = filters.tab === 'distributed' ? dashboard.distributedRooms : dashboard.undistributedRooms
    return list.map((room) => ({
      ...room,
      progress: roomProgressMap[room.id] ?? room.progress,
    }))
  }, [dashboard, filters.tab, roomProgressMap])

  const selectedRoom = useMemo(
    () => visibleRows.find((room) => room.id === drawerRoomId) ?? null,
    [drawerRoomId, visibleRows],
  )

  const currentStoreLabel = useMemo(() => {
    const matched = dashboard?.stores.find((store) => store.id === filters.poiId)
    return matched?.label ?? dashboard?.stores[1]?.label ?? '天落会宿...'
  }, [dashboard, filters.poiId])

  const requestSnapshot = dashboard ? JSON.stringify(dashboard.request) : JSON.stringify({ filters })

  const reload = (message = '分销列表已刷新') => {
    updateFilters((current) => ({ ...current, scenario: 'success', page: 1 }))
    window.setTimeout(() => setNotice(message), 120)
  }

  const selectTab = (nextTab: DistributionTab) => {
    updateFilters((current) => ({ ...current, tab: nextTab, page: 1 }))
  }

  const toggleDistribution = (room: DistributionRoomCategory) => {
    setRoomProgressMap((current) => {
      const currentProgress = current[room.id] ?? room.progress
      const nextProgress = currentProgress === 'closed' ? 'distributing' : 'closed'
      window.setTimeout(() => setNotice(`${room.name} 已${nextProgress === 'closed' ? '关闭' : '打开'}分销`), 0)
      return { ...current, [room.id]: nextProgress }
    })
    setOpenMenuId(null)
  }

  return (
    <div
      className={`distribution-list-page${loading ? ' is-loading' : ''}`}
      data-testid="distribution-list-contract"
      data-provider={dashboard?.provider ?? 'mock'}
      data-endpoint-camp-flow={distributionListEndpoints.campFlow}
      data-endpoint-room-categories={distributionListEndpoints.roomCategories}
      data-endpoint-undistributed={distributionListEndpoints.undistributedRoomCategories}
      data-request={requestSnapshot}
      onClick={() => {
        if (openMenuId) setOpenMenuId(null)
        if (importMenuOpen) setImportMenuOpen(false)
      }}
    >
      <section className="distribution-page-main">
        <div className="distribution-page-main__header">
          <div className="distribution-list-tabs" role="group" aria-label="分销状态">
            <button type="button" className={filters.tab === 'distributed' ? 'is-active' : ''} onClick={() => selectTab('distributed')}>
              已分销
            </button>
            <button
              type="button"
              className={filters.tab === 'undistributed' ? 'is-active' : ''}
              onClick={() => selectTab('undistributed')}
            >
              未分销
            </button>
          </div>

          {filters.tab === 'distributed' ? (
            <div className="distribution-panel__actions">
              {actionButtons.map((action, index) => (
                <button
                  key={action.label}
                  type="button"
                  className={index === 0 ? 'is-outline' : 'is-primary'}
                  onClick={() => navigate(action.route)}
                >
                  {action.label}
                </button>
              ))}
              <button type="button" className="is-light" onClick={() => reload()}>
                刷新
              </button>
            </div>
          ) : null}
        </div>

        {filters.tab === 'undistributed' ? (
          <div className="distribution-undistributed-toolbar">
            <div className="distribution-store-switch" aria-label="未分销门店切换">
              <button type="button" className="is-active">
                全部门店
              </button>
              <button type="button" className="is-store" title={currentStoreLabel}>
                {currentStoreLabel}
              </button>
              <button
                type="button"
                className="is-setting"
                aria-label="门店设置"
                onClick={(event) => {
                  event.stopPropagation()
                  navigate('/InformationMaintenance/campInfo')
                }}
              >
                ⚙
              </button>
            </div>

            <div className="distribution-panel__actions">
              <button type="button" className="is-disabled" disabled>
                一键上架
              </button>
              <div className="distribution-import-menu">
                <button
                  type="button"
                  className="is-primary"
                  aria-expanded={importMenuOpen}
                  onClick={(event) => {
                    event.stopPropagation()
                    setImportMenuOpen((current) => !current)
                  }}
                >
                  渠道导入完善
                </button>
                {importMenuOpen ? (
                  <div className="distribution-import-menu__panel" role="menu" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setImportDialogMode('store')
                        setImportMenuOpen(false)
                      }}
                    >
                      完善门店信息
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setImportDialogMode('room')
                        setImportMenuOpen(false)
                      }}
                    >
                      完善房型信息
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <section className="distribution-state distribution-state--error" role="alert">
            <strong>分销列表加载失败</strong>
            <p>{error}</p>
            <button type="button" onClick={() => reload('分销列表已恢复')}>
              重试
            </button>
          </section>
        ) : null}

        {!error && dashboard ? (
          <RoomTable
            label={filters.tab === 'distributed' ? '已分销房型表' : '未分销房型表'}
            rows={visibleRows}
            emptyText={filters.tab === 'distributed' ? '当前条件暂无房型数据' : '暂无数据'}
            progressHeader={filters.tab === 'distributed' ? '分销进度' : '原因'}
            openMenuId={openMenuId}
            onToggleMenu={setOpenMenuId}
            onToggleDistribution={toggleDistribution}
            onEditChannel={(room) => {
              setDrawerRoomId(room.id)
              setOpenMenuId(null)
            }}
          />
        ) : null}
      </section>

      {loading ? <div className="distribution-loading">分销列表加载中...</div> : null}

      {notice ? (
        <div className="distribution-toast" role="status">
          {notice}
        </div>
      ) : null}

      {selectedRoom && dashboard ? (
        <DistributionConfigDrawer room={selectedRoom} channels={dashboard.channels} onClose={() => setDrawerRoomId(null)} />
      ) : null}

      {importDialogMode ? (
        <ChannelImportDialog mode={importDialogMode} onClose={() => setImportDialogMode(null)} />
      ) : null}
    </div>
  )
}

function RoomTable({
  label,
  rows,
  emptyText,
  progressHeader,
  openMenuId,
  onToggleMenu,
  onToggleDistribution,
  onEditChannel,
}: {
  label: string
  rows: DistributionRoomCategory[]
  emptyText: string
  progressHeader: string
  openMenuId: string | null
  onToggleMenu: (roomId: string | null) => void
  onToggleDistribution: (room: DistributionRoomCategory) => void
  onEditChannel: (room: DistributionRoomCategory) => void
}) {
  return (
    <div className="distribution-table-wrap">
      <table className="distribution-table distribution-table--compact" aria-label={label}>
        <thead>
          <tr>
            <th>房型</th>
            <th>{progressHeader}</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((room) => (
              <tr key={room.id}>
                <td>
                  <div className="distribution-room-cell">
                    <img src={room.thumbnail} alt="" />
                    <div className="distribution-room-cell__content">
                      <strong>{room.name}</strong>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`distribution-progress distribution-progress--${room.progress}`} data-progress={room.progress}>
                    {room.progress === 'distributing' ? '分销中' : '关闭'}
                  </span>
                </td>
                <td>
                  <div className="distribution-more">
                    <button
                      type="button"
                      className="distribution-more__trigger"
                      aria-expanded={openMenuId === room.id}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleMenu(openMenuId === room.id ? null : room.id)
                      }}
                    >
                      更多
                    </button>
                    {openMenuId === room.id ? (
                      <div className="distribution-more__menu" role="menu" onClick={(event) => event.stopPropagation()}>
                        <button type="button" role="menuitem" onClick={() => onToggleDistribution(room)}>
                          {room.progress === 'closed' ? '打开' : '关闭'}
                        </button>
                        <button type="button" role="menuitem" onClick={() => onEditChannel(room)}>
                          编辑渠道
                        </button>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr className="distribution-empty-row">
              <td colSpan={3}>
                <div className="distribution-empty">
                  <span aria-hidden="true" />
                  <p>{emptyText}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function DistributionConfigDrawer({
  room,
  channels,
  onClose,
}: {
  room: DistributionRoomCategory
  channels: DistributionChannel[]
  onClose: () => void
}) {
  const [enabled, setEnabled] = useState(room.progress === 'distributing')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedChannelIds, setSelectedChannelIds] = useState(room.channelIds)
  const [draftChannelIds, setDraftChannelIds] = useState(room.channelIds)
  const layerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setEnabled(room.progress === 'distributing')
    setSelectedChannelIds(room.channelIds)
    setDraftChannelIds(room.channelIds)
    setIsEditing(false)
  }, [room])

  const toggleChannel = (channelId: string) => {
    setDraftChannelIds((current) =>
      current.includes(channelId) ? current.filter((item) => item !== channelId) : [...current, channelId],
    )
  }

  return (
    <div
      ref={layerRef}
      className="distribution-config-drawer-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === layerRef.current) onClose()
      }}
    >
      <aside
        className="distribution-config-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="分销配置"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="distribution-config-drawer__header">
          <h2>分销配置</h2>
          <button type="button" aria-label="关闭分销配置" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="distribution-config-drawer__body">
          <section className="distribution-config-switch">
            <div>
              <strong>{enabled ? '聚合分销已开启' : '聚合分销已关闭'}</strong>
              <span>{room.name}</span>
            </div>
            <button
              type="button"
              className={`distribution-config-switch__toggle${enabled ? ' is-active' : ''}`}
              aria-pressed={enabled}
              aria-label={enabled ? '聚合分销已开启' : '聚合分销已关闭'}
              onClick={() => setEnabled((current) => !current)}
            >
              <span />
            </button>
          </section>

          <section className="distribution-config-card" aria-label="聚合分销渠道">
            <div className="distribution-config-card__top">
              <div>
                <h3>聚合分销渠道</h3>
                <p>
                  当前分销情况：{selectedChannelIds.length}/{channels.length}
                </p>
              </div>
              {isEditing ? (
                <div className="distribution-config-card__actions">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftChannelIds(selectedChannelIds)
                      setIsEditing(false)
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="is-strong"
                    onClick={() => {
                      setSelectedChannelIds(draftChannelIds)
                      setIsEditing(false)
                    }}
                  >
                    保存
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setIsEditing(true)}>
                  编辑
                </button>
              )}
            </div>

            <div className="distribution-config-card__grid">
              {channels.map((channel) => {
                const active = (isEditing ? draftChannelIds : selectedChannelIds).includes(channel.id)
                return (
                  <button
                    key={channel.id}
                    type="button"
                    className={`distribution-channel-chip${active ? ' is-active' : ''}${isEditing ? ' is-editable' : ''}`}
                    onClick={() => {
                      if (isEditing) toggleChannel(channel.id)
                    }}
                  >
                    <span style={{ ['--channel-color' as string]: channel.color }}>{channel.shortName}</span>
                    <strong>{channel.name}</strong>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <footer className="distribution-config-drawer__footer">
          开通聚合分销时，您已阅读并同意
          <span>《路客云分销协议》</span>
          ，如有疑问，您可
          <a href="/" onClick={(event) => event.preventDefault()}>
            联系客服
          </a>
        </footer>
      </aside>
    </div>
  )
}

function ChannelImportDialog({
  mode,
  onClose,
}: {
  mode: Exclude<ImportDialogMode, null>
  onClose: () => void
}) {
  const layerRef = useRef<HTMLDivElement | null>(null)
  const [roomType, setRoomType] = useState<'prepay' | 'cash'>('prepay')
  const [connectEnabled, setConnectEnabled] = useState(true)
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState(importStoreOptions[0])

  return (
    <div
      ref={layerRef}
      className="distribution-dialog-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === layerRef.current) onClose()
      }}
    >
      <section
        className="distribution-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'store' ? '完善门店信息' : '完善房型信息'}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="distribution-import-dialog__close" aria-label="关闭弹窗" onClick={onClose}>
          ×
        </button>

        <p className="distribution-import-dialog__intro">请选择您上线的渠道（单选），酒店渠道能导入的信息能完善~</p>

        <div className="distribution-import-dialog__channels">
          <button type="button" className="is-active">
            携程酒店
          </button>
          {mode === 'room' ? <button type="button">美团民宿</button> : null}
        </div>

        <p className="distribution-import-dialog__desc">请授权渠道，我们将会为您自动直连并完善门店信息</p>

        <div className="distribution-import-form">
          <label className="distribution-import-form__row">
            <span>当前门店:</span>
            <div className="distribution-import-form__field-wrap">
              <div className="distribution-import-form__select-wrap">
                <button
                  type="button"
                  className="distribution-import-form__select"
                  aria-expanded={storeDropdownOpen}
                  onClick={() => setStoreDropdownOpen((current) => !current)}
                >
                  <span>{selectedStore}</span>
                  <em>⌄</em>
                </button>
                {storeDropdownOpen ? (
                  <div className="distribution-import-form__dropdown" role="listbox">
                    {importStoreOptions.map((store) => (
                      <button
                        key={store}
                        type="button"
                        role="option"
                        className={selectedStore === store ? 'is-selected' : ''}
                        onClick={() => {
                          setSelectedStore(store)
                          setStoreDropdownOpen(false)
                        }}
                      >
                        {store}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" className="distribution-import-form__link">
                新增门店
              </button>
            </div>
          </label>

          <div className="distribution-import-form__row">
            <span>子酒店类型:</span>
            <div className="distribution-import-form__radios">
              <label>
                <input type="radio" checked={roomType === 'prepay'} onChange={() => setRoomType('prepay')} />
                <span>预付</span>
              </label>
              <label>
                <input type="radio" checked={roomType === 'cash'} onChange={() => setRoomType('cash')} />
                <span>现付</span>
              </label>
            </div>
          </div>

          <label className="distribution-import-form__row">
            <span>子酒店ID:</span>
            <div className="distribution-import-form__input-wrap">
              <input type="text" placeholder="请输入子酒店ID" />
              <button type="button" className="distribution-import-form__help" aria-label="查看帮助">
                ?
              </button>
            </div>
          </label>

          <label className="distribution-import-form__row">
            <span>酒店名称:</span>
            <input type="text" placeholder="请确保输入与携程一致的酒店名称" />
          </label>

          <label className="distribution-import-form__checkbox">
            <input type="checkbox" checked={connectEnabled} onChange={() => setConnectEnabled((current) => !current)} />
            <span>同时完成携程直连</span>
          </label>
        </div>

        <div className="distribution-import-dialog__footer">
          <button type="button" className="distribution-import-dialog__confirm" onClick={onClose}>
            确认
          </button>
        </div>
      </section>
    </div>
  )
}
