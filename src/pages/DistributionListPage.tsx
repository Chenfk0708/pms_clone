import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultDistributionFilters,
  distributionListEndpoints,
  fetchDistributionDashboard,
  localDistributionChannelId,
  localDistributionStatusStorageKey,
  type DistributionChannel,
  type DistributionDashboard,
  type DistributionFilters,
  type DistributionProgress,
  type DistributionRoomCategory,
  type DistributionTab,
} from '../services/distributionList'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './DistributionListPage.css'

const actionButtons = [
  { label: '提现教程', route: '/statistics/distributionOrder' },
  { label: '房态管理', route: '/houseManage/months' },
  { label: '房价管理', route: '/houseManage/houseCale' },
  { label: '房型管理', route: '/setting/roomTypeInfo' },
]

type ImportDialogMode = 'store' | 'room' | null

export function DistributionListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [filters, setFilters] = useState<DistributionFilters>(() =>
    createDefaultDistributionFilters(new URLSearchParams(location.search)),
  )
  const [keywordDraft, setKeywordDraft] = useState(filters.keyword)
  const [dashboard, setDashboard] = useState<DistributionDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [drawerRoomId, setDrawerRoomId] = useState<string | null>(null)
  const [roomProgressMap, setRoomProgressMap] = useState<Record<string, DistributionProgress>>({})
  const [importMenuOpen, setImportMenuOpen] = useState(false)
  const [importDialogMode, setImportDialogMode] = useState<ImportDialogMode>(null)
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: dashboard?.stores.map((store) => ({
      id: store.id,
      label: store.label,
    })),
    enabled: dashboard?.provider === 'api',
  })

  const updateFilters = (nextFilters: (current: DistributionFilters) => DistributionFilters) => {
    setNotice('')
    setLoading(true)
    setError('')
    setOpenMenuId(null)
    setImportMenuOpen(false)
    setFilters(nextFilters)
  }

  useEffect(() => {
    const nextFilters = createDefaultDistributionFilters(new URLSearchParams(location.search))
    setFilters((current) => ({
      ...current,
      ...nextFilters,
    }))
    setLoading(true)
    setError('')
    setOpenMenuId(null)
    setImportMenuOpen(false)
  }, [location.search])

  useEffect(() => {
    setKeywordDraft(filters.keyword)
  }, [filters.keyword])

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

  const allRows = useMemo(() => {
    if (!dashboard) return []
    return [...dashboard.distributedRooms, ...dashboard.undistributedRooms].map((room) => ({
      ...room,
      progress: roomProgressMap[room.id] ?? room.progress,
    }))
  }, [dashboard, roomProgressMap])

  const visibleRows = useMemo(() => {
    const targetProgress: DistributionProgress = filters.tab === 'distributed' ? 'distributing' : 'closed'
    return allRows.filter((room) => room.progress === targetProgress)
  }, [allRows, filters.tab])

  const selectedRoom = useMemo(() => allRows.find((room) => room.id === drawerRoomId) ?? null, [allRows, drawerRoomId])

  const requestSnapshot = dashboard ? JSON.stringify(dashboard.request) : JSON.stringify({ filters })

  const reload = (message = '分销列表已刷新') => {
    updateFilters((current) => ({ ...current, scenario: 'success', page: 1 }))
    window.setTimeout(() => setNotice(message), 120)
  }

  const selectTab = (nextTab: DistributionTab) => {
    updateFilters((current) => ({ ...current, tab: nextTab, page: 1 }))
  }

  const applyKeywordSearch = () => {
    updateFilters((current) => ({ ...current, keyword: keywordDraft.trim(), page: 1 }))
  }

  const applyRoomProgress = (room: DistributionRoomCategory, nextProgress: DistributionProgress, channelIds?: string[]) => {
    const nextChannelIds = nextProgress === 'distributing' ? channelIds ?? room.channelIds : []
    persistLocalDistributionStatus(room.id, nextProgress, channelIds)
    setRoomProgressMap((current) => ({ ...current, [room.id]: nextProgress }))
    setDashboard((current) => {
      if (!current) return current
      const roomById = new Map<string, DistributionRoomCategory>()
      ;[...current.distributedRooms, ...current.undistributedRooms].forEach((item) => {
        roomById.set(item.id, item)
      })
      const sourceRoom = roomById.get(room.id) ?? room
      roomById.set(room.id, { ...sourceRoom, progress: nextProgress, channelIds: nextChannelIds })
      const nextRooms = Array.from(roomById.values())
      const distributedRooms = nextRooms.filter((item) => item.progress === 'distributing')
      const undistributedRooms = nextRooms.filter((item) => item.progress === 'closed')
      const activeRows = filters.tab === 'distributed' ? distributedRooms : undistributedRooms
      return {
        ...current,
        distributedRooms,
        undistributedRooms,
        pagination: {
          ...current.pagination,
          total: activeRows.length,
        },
      }
    })
    const actionText = nextProgress === 'closed' ? '关闭' : '开启'
    const channelText = channelIds ? `关联 ${nextChannelIds.length} 个渠道` : '宿银平台分销'
    setNotice(`${room.name} 已${actionText}${channelText}`)
    setOpenMenuId(null)
  }

  const toggleDistribution = (room: DistributionRoomCategory) => {
    const currentProgress = roomProgressMap[room.id] ?? room.progress
    applyRoomProgress(room, currentProgress === 'closed' ? 'distributing' : 'closed')
  }

  return (
    <div
      className={`distribution-list-page${loading ? ' is-loading' : ''}`}
      data-testid="distribution-list-contract"
      data-provider={dashboard?.provider ?? 'api'}
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
            <StoreSelectControl
              className="distribution-store-switch"
              label="未分销门店切换"
              options={storeOptions.map((store) => ({ id: store.id, name: store.label }))}
              value={filters.poiId}
              disabled={storeLoading}
              onChange={(storeId) =>
                updateFilters((current) => ({
                  ...current,
                  poiId: storeId,
                  page: 1,
                }))
              }
              settingsLabel="门店设置"
              onSettingsClick={() => navigate('/InformationMaintenance/campInfo')}
            />

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

        <div className="distribution-filter-bar" role="search" aria-label="分销房型筛选">
          <label>
            <span>房型</span>
            <input
              type="search"
              placeholder="搜索房型或原因"
              value={keywordDraft}
              onChange={(event) => setKeywordDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyKeywordSearch()
              }}
            />
          </label>
          <button type="button" className="is-primary" onClick={applyKeywordSearch}>
            查询
          </button>
          <button
            type="button"
            className="is-light"
            onClick={() => {
              setKeywordDraft('')
              updateFilters((current) => ({ ...current, keyword: '', page: 1 }))
            }}
          >
            重置
          </button>
        </div>

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
            channels={dashboard.channels}
            emptyText={filters.tab === 'distributed' ? '当前条件暂无已分销房型' : '当前条件暂无未分销房型'}
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
        <DistributionConfigDrawer
          room={selectedRoom}
          channels={dashboard.channels}
          onClose={() => setDrawerRoomId(null)}
          onProgressChange={applyRoomProgress}
        />
      ) : null}

      {importDialogMode ? (
        <ChannelImportDialog
          mode={importDialogMode}
          channels={dashboard?.channels ?? []}
          onClose={() => setImportDialogMode(null)}
        />
      ) : null}
    </div>
  )
}

function RoomTable({
  label,
  rows,
  channels,
  emptyText,
  progressHeader,
  openMenuId,
  onToggleMenu,
  onToggleDistribution,
  onEditChannel,
}: {
  label: string
  rows: DistributionRoomCategory[]
  channels: DistributionChannel[]
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
            rows.map((room) => {
              const currentProgress = room.progress
              const progressText = formatDistributionProgress(currentProgress, room.channelIds, channels)
              return (
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
                    <span className={`distribution-progress distribution-progress--${currentProgress}`} data-progress={currentProgress}>
                      {progressText}
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
                            {currentProgress === 'closed' ? '开启分销' : '关闭分销'}
                          </button>
                          <button type="button" role="menuitem" onClick={() => onEditChannel(room)}>
                            渠道编辑
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })
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
  onProgressChange,
}: {
  room: DistributionRoomCategory
  channels: DistributionChannel[]
  onClose: () => void
  onProgressChange: (room: DistributionRoomCategory, nextProgress: DistributionProgress, channelIds?: string[]) => void
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

  const toggleEnabled = () => {
    const nextEnabled = !enabled
    setEnabled(nextEnabled)
    onProgressChange(room, nextEnabled ? 'distributing' : 'closed', nextEnabled ? selectedChannelIds : [])
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
            x
          </button>
        </header>

        <div className="distribution-config-drawer__body">
          <section className="distribution-config-switch">
            <div>
              <strong>{enabled ? '宿银平台分销已开启' : '宿银平台分销已关闭'}</strong>
              <span>{room.name}</span>
            </div>
            <button
              type="button"
              className={`distribution-config-switch__toggle${enabled ? ' is-active' : ''}`}
              aria-pressed={enabled}
              aria-label={enabled ? '宿银平台分销已开启' : '宿银平台分销已关闭'}
              onClick={toggleEnabled}
            >
              <span />
            </button>
          </section>

          <section className="distribution-config-card" aria-label="聚合分销渠道">
            <div className="distribution-config-card__top">
              <div>
                <h3>聚合分销渠道</h3>
                <p>当前分销情况: {selectedChannelIds.length}/{channels.length}</p>
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
                      const nextProgress = draftChannelIds.length > 0 ? 'distributing' : 'closed'
                      setSelectedChannelIds(draftChannelIds)
                      setEnabled(nextProgress === 'distributing')
                      setIsEditing(false)
                      onProgressChange(room, nextProgress, draftChannelIds)
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
          本期先联通本地渠道 <span>宿银平台</span>；携程、美团、途家等第三方渠道完成授权适配后，会在这里追加渠道卡片和同步状态。
        </footer>
      </aside>
    </div>
  )
}

function ChannelImportDialog({
  mode,
  channels,
  onClose,
}: {
  mode: Exclude<ImportDialogMode, null>
  channels: DistributionChannel[]
  onClose: () => void
}) {
  const layerRef = useRef<HTMLDivElement | null>(null)
  const title = mode === 'store' ? '完善门店信息' : '完善房型信息'
  const visibleChannels = channels.length > 0 ? channels : [{ id: localDistributionChannelId, name: '宿银平台' }]

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
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="distribution-import-dialog__close" aria-label="关闭弹窗" onClick={onClose}>
          x
        </button>

        <p className="distribution-import-dialog__intro">{title}</p>
        <div className="distribution-import-dialog__channels">
          {visibleChannels.map((channel, index) => (
            <button key={channel.id} type="button" className={index === 0 ? 'is-active' : ''} disabled={index > 0}>
              {channel.name}
            </button>
          ))}
        </div>
        <p className="distribution-import-dialog__desc">
          当前系统还没有对接第三方平台，本地房型会先作为宿银平台分销数据展示。后续接入第三方后，这里再按渠道授权拉取门店和房型资料。
        </p>

        <div className="distribution-import-dialog__footer">
          <button type="button" className="distribution-import-dialog__confirm" onClick={onClose}>
            知道了
          </button>
        </div>
      </section>
    </div>
  )
}

function formatDistributionProgress(
  progress: DistributionProgress,
  channelIds: string[],
  channels: DistributionChannel[],
) {
  if (progress === 'closed') return '已关闭'
  const activeChannels = resolveActiveChannels(channelIds, channels)
  if (activeChannels.length === 0) return '未关联渠道'
  if (activeChannels.length === 1) return `${activeChannels[0].name}分销中`
  return `已关联 ${activeChannels.length} 个渠道`
}

function resolveActiveChannels(channelIds: string[], channels: DistributionChannel[]) {
  const channelById = new Map(channels.map((channel) => [channel.id, channel]))
  return channelIds.map((channelId) => channelById.get(channelId)).filter((channel): channel is DistributionChannel => Boolean(channel))
}

function persistLocalDistributionStatus(roomId: string, progress: DistributionProgress, channelIds?: string[]) {
  if (typeof window === 'undefined') return
  const nextState = channelIds
    ? { progress, channelIds: progress === 'distributing' && channelIds.length > 0 ? channelIds : [] }
    : progress
  try {
    const current = JSON.parse(window.localStorage.getItem(localDistributionStatusStorageKey) || '{}') as Record<
      string,
      DistributionProgress | { progress: DistributionProgress; channelIds: string[] }
    >
    window.localStorage.setItem(localDistributionStatusStorageKey, JSON.stringify({ ...current, [roomId]: nextState }))
  } catch {
    window.localStorage.setItem(localDistributionStatusStorageKey, JSON.stringify({ [roomId]: nextState }))
  }
}
