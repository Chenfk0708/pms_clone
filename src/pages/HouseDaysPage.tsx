import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchHouseDays,
  resolveHouseDaysQueryFromLocation,
  type HouseDaysRoomCard,
  type HouseDaysViewModel,
} from '../services/houseDays'
import './HouseDaysPage.css'

export function HouseDaysPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('按房型')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [selectedChannel, setSelectedChannel] = useState('')
  const [selectedRoomType, setSelectedRoomType] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [queryKeyword, setQueryKeyword] = useState('')
  const [openMenu, setOpenMenu] = useState<'settings' | 'clean' | 'openClose' | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [showStatusSettings, setShowStatusSettings] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<HouseDaysRoomCard | null>(null)
  const [keyword, setKeyword] = useState('')
  const [feedback, setFeedback] = useState('')
  const [data, setData] = useState<HouseDaysViewModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const source = resolveHouseDaysQueryFromLocation(window.location)

    void Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return null
        setLoading(true)
        setError('')
        return fetchHouseDays(
          {
            provider: source.provider,
            mockState: source.mockState,
            keyword: queryKeyword,
            viewMode,
            statusFilters: selectedFilters,
            channel: selectedChannel,
            roomType: selectedRoomType,
            tag: selectedTag,
          },
          controller.signal,
        )
      })
      .then((nextData) => {
        if (!nextData) return
        setData(nextData)
      })
      .catch((nextError: unknown) => {
        if (nextError instanceof DOMException && nextError.name === 'AbortError') return
        setError('日房态数据加载失败，请稍后重试。')
        setData(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [queryKeyword, viewMode, selectedFilters, selectedChannel, selectedRoomType, selectedTag, refreshTick])

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null)
        setShowLegend(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleFilter = (label: string) => {
    setSelectedFilters((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    )
    setFeedback(`${label}筛选已更新，日房态已按当前条件刷新。`)
  }

  const blockAction = (message: string) => {
    setOpenMenu(null)
    setFeedback(message)
  }

  const resetFilters = () => {
    setSelectedFilters([])
    setKeyword('')
    setQueryKeyword('')
    setSelectedChannel('')
    setSelectedRoomType('')
    setSelectedTag('')
    setRefreshTick((tick) => tick + 1)
    setFeedback('日房态已刷新，筛选条件已重置。')
  }

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setQueryKeyword(keyword)
      setFeedback(`已按“${keyword || '全部房间'}”更新日房态。`)
    }
  }

  const viewModes = data?.viewModes ?? ['按房型', '按房间号', '按楼层']
  const statusGroups = data?.statusGroups ?? []
  const roomCards = data?.rooms ?? []
  const routeTargets = data?.routeTargets ?? {
    months: '/houseManage/months',
    price: '/houseManage/houseCale',
    storeSettings: '/InformationMaintenance/campInfo',
  }

  return (
    <div className="page-stack day-status-page">
      <section className="toolbar-card day-toolbar">
        {error ? (
          <div className="day-data-error" role="alert" aria-label="日房态数据错误">
            <span>{error}</span>
            <button type="button" onClick={() => setRefreshTick((tick) => tick + 1)}>
              重试
            </button>
          </div>
        ) : null}
        <div className="day-feedback" role="status" aria-label="日房态操作反馈" aria-live="polite">
          {feedback}
        </div>
        <div className="day-notice">
          <span>ⓘ</span>
          <p>智能调价监测到您当前入住率低于 50%，建议调价获得额外更多订单</p>
          <button type="button">忽略</button>
          <button type="button">立即调价</button>
        </div>
        <div className="toolbar-row">
          <div className="segmented">
            <button type="button" onClick={() => navigate(routeTargets.months)}>
              月房态
            </button>
            <button type="button" className="is-active">
              日房态
            </button>
          </div>
          <div className="toolbar-actions day-toolbar__search">
            <input
              type="text"
              placeholder="输入客户姓名/手机/房间/渠道单/备注"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button type="button" className="primary-action" onClick={() => blockAction('请连接读卡器后重试，或手动搜索住客信息。')}>
              读卡
            </button>
            <button type="button" className="primary-action" onClick={() => navigate(routeTargets.price)}>
              房价管理
            </button>
            <button
              type="button"
              className="primary-action"
              onClick={() => setOpenMenu(openMenu === 'settings' ? null : 'settings')}
            >
              更多设置
            </button>
            {openMenu === 'settings' ? (
              <div className="day-popover-menu" role="menu" aria-label="更多设置">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowLegend(true)
                    setOpenMenu(null)
                    setFeedback('已打开图例说明。')
                  }}
                >
                  图例说明
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowStatusSettings(true)
                    setOpenMenu(null)
                    setFeedback('已打开房态设置。')
                  }}
                >
                  房态设置
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="toolbar-row toolbar-filters">
          <button type="button" className="chip is-active">
            全部门店
          </button>
          <button type="button" className="chip">
            天落会宿公寓(前海壹方城宝安中心店)
          </button>
          <button
            type="button"
            className="icon-chip"
            aria-label="门店设置"
            onClick={() => navigate(routeTargets.storeSettings)}
          >
            ⚙
          </button>
          <div className="toolbar-actions">
            <div className="day-action-popover">
              <button type="button" onClick={() => setOpenMenu(openMenu === 'clean' ? null : 'clean')}>
                批量设脏/净
              </button>
              {openMenu === 'clean' ? (
                <div className="day-popover-menu day-popover-menu--batch" role="menu" aria-label="批量设脏/净">
                  <button type="button" role="menuitem" onClick={() => blockAction('请选择房间后再批量设脏。')}>
                    批量设脏
                  </button>
                  <button type="button" role="menuitem" onClick={() => blockAction('请选择房间后再批量设净。')}>
                    批量设净
                  </button>
                </div>
              ) : null}
            </div>
            <div className="day-action-popover">
              <button type="button" onClick={() => setOpenMenu(openMenu === 'openClose' ? null : 'openClose')}>
                批量开/关房
              </button>
              {openMenu === 'openClose' ? (
                <div className="day-popover-menu day-popover-menu--batch" role="menu" aria-label="批量开/关房">
                  <button type="button" role="menuitem" onClick={() => blockAction('请选择房间后再批量关房。')}>
                    批量关房
                  </button>
                  <button type="button" role="menuitem" onClick={() => blockAction('请选择房间后再批量开房。')}>
                    批量开房
                  </button>
                </div>
              ) : null}
            </div>
            <button type="button" aria-label="刷新" onClick={resetFilters}>
              ↻
            </button>
            <button type="button" aria-label="重新加载" onClick={resetFilters}>
              ⟳
            </button>
          </div>
        </div>
      </section>

      <section className="day-status-layout">
        <div className="day-room-area">
          {roomCards.map((room) => (
            <section key={room.id} className="day-room-group">
              <h3>{room.roomType}</h3>
              <article
                className="day-room-card"
                data-tone={room.booking?.tone ?? 'empty'}
                aria-label={`${room.roomType} ${room.roomName}`}
                tabIndex={0}
                onClick={() => {
                  setSelectedRoom(room)
                  setFeedback(`已打开 ${room.roomName} 房间详情。`)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedRoom(room)
                    setFeedback(`已打开 ${room.roomName} 房间详情。`)
                  }
                }}
              >
                <strong>{room.roomName}</strong>
                <span>{room.roomType}</span>
                {room.booking ? (
                  <div className="day-room-booking">
                    <strong>{room.booking.guest}</strong>
                    <span>{room.booking.channel}</span>
                    <span>{room.booking.price}</span>
                  </div>
                ) : null}
                {room.hasTag ? <b aria-label="备注标签">◇</b> : null}
              </article>
            </section>
          ))}
          {!loading && !error && roomCards.length === 0 ? (
            <div className="day-empty-state">
              <strong>暂无日房态数据</strong>
              <span>当前条件下没有可展示房间，请调整筛选条件后重试。</span>
            </div>
          ) : null}
        </div>

        <aside className="day-filter-panel">
          <div className="day-filter-tabs">
            {viewModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={viewMode === mode ? 'is-active' : ''}
                onClick={() => {
                  setViewMode(mode)
                  setFeedback(`已切换为${mode}。`)
                }}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="day-filter-summary">{viewMode}视图</div>
          {selectedFilters.length ? (
            <div className="day-filter-tags">
              {selectedFilters.map((filter) => (
                <span key={filter}>已筛选：{filter}</span>
              ))}
            </div>
          ) : null}

          {statusGroups.map((group) => (
            <section key={group.title} className="day-filter-group">
              <h3>{group.title}</h3>
              <div className="day-filter-options">
                {group.items.map((item) => (
                  <label key={item.label}>
                    <span style={{ '--tag-color': item.color ?? '#eef1f6' } as CSSProperties}>{item.label}</span>
                    <strong>{item.value}</strong>
                    <input
                      type="checkbox"
                      aria-label={item.label}
                      checked={selectedFilters.includes(item.label)}
                      onChange={() => toggleFilter(item.label)}
                    />
                  </label>
                ))}
              </div>
            </section>
          ))}

          <section className="day-filter-group">
            <h3>渠道</h3>
            <select
              aria-label="渠道"
              value={selectedChannel}
              onChange={(event) => {
                setSelectedChannel(event.target.value)
                setFeedback(`渠道筛选已切换：${event.target.selectedOptions[0]?.text ?? event.target.value}。`)
              }}
            >
              {(data?.channelOptions ?? [{ id: '', name: '渠道' }]).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </section>
          <section className="day-filter-group">
            <h3>房型</h3>
            <select
              aria-label="房型"
              value={selectedRoomType}
              onChange={(event) => {
                setSelectedRoomType(event.target.value)
                setFeedback(`房型筛选已切换：${event.target.selectedOptions[0]?.text ?? event.target.value}。`)
              }}
            >
              {(data?.roomTypeOptions ?? [{ id: '', name: '房型' }]).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </section>
          <section className="day-filter-group">
            <h3>标签</h3>
            <select
              aria-label="标签"
              value={selectedTag}
              onChange={(event) => {
                setSelectedTag(event.target.value)
                setFeedback(`标签筛选已切换：${event.target.selectedOptions[0]?.text ?? event.target.value}。`)
              }}
            >
              {(data?.tagOptions ?? [{ id: '', name: '房型标签' }]).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </section>
        </aside>
      </section>
      {showLegend ? (
        <aside className="day-legend-dialog" role="dialog" aria-label="图例说明">
          <header>
            <strong>图例说明</strong>
            <button type="button" aria-label="关闭图例说明" onClick={() => setShowLegend(false)}>
              ×
            </button>
          </header>
          <p>空净：可售且已清洁；空脏：可售但待清洁；关房：不可售房间。</p>
          <p>批量操作需要先选择房间，执行前会再次确认。</p>
        </aside>
      ) : null}
      {selectedRoom ? (
        <aside className="day-detail-dialog" role="dialog" aria-label="房间详情">
          <header>
            <strong>房间详情</strong>
            <button type="button" aria-label="关闭房间详情" onClick={() => setSelectedRoom(null)}>
              ×
            </button>
          </header>
          <div className="day-detail-dialog__body">
            <p>
              <span>房型</span>
              <strong>{selectedRoom.roomType}</strong>
            </p>
            <p>
              <span>房间</span>
              <strong>{selectedRoom.roomName}</strong>
            </p>
            <p>
              <span>状态</span>
              <strong>{selectedRoom.booking ? '在住' : '空净'}</strong>
            </p>
            {selectedRoom.booking ? (
              <>
                <p>
                  <span>住客</span>
                  <strong>{selectedRoom.booking.guest}</strong>
                </p>
                <p>
                  <span>渠道</span>
                  <strong>{selectedRoom.booking.channel}</strong>
                </p>
                <p>
                  <span>房费</span>
                  <strong>{selectedRoom.booking.price}</strong>
                </p>
              </>
            ) : null}
          </div>
          <footer>
            <button type="button" onClick={() => blockAction('已为当前房间创建保洁提醒。')}>保洁提醒</button>
            <button type="button" className="primary-action" onClick={() => blockAction(selectedRoom.booking ? '已打开办理入住流程。' : '已打开新增预订流程。')}>
              {selectedRoom.booking ? '办理入住' : '新增预订'}
            </button>
          </footer>
        </aside>
      ) : null}
      {showStatusSettings ? (
        <aside className="day-detail-dialog" role="dialog" aria-label="房态设置">
          <header>
            <strong>房态设置</strong>
            <button type="button" aria-label="关闭房态设置" onClick={() => setShowStatusSettings(false)}>
              ×
            </button>
          </header>
          <div className="day-detail-dialog__body">
            <label>
              <span>自动刷新</span>
              <select defaultValue="5">
                <option value="5">每 5 分钟</option>
                <option value="15">每 15 分钟</option>
                <option value="manual">手动刷新</option>
              </select>
            </label>
            <label>
              <span>默认视图</span>
              <select defaultValue={viewMode}>
                {viewModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <footer>
            <button type="button" onClick={() => setShowStatusSettings(false)}>取消</button>
            <button
              type="button"
              className="primary-action"
              onClick={() => {
                setShowStatusSettings(false)
                setFeedback('房态设置已保存。')
              }}
            >
              保存设置
            </button>
          </footer>
        </aside>
      ) : null}
    </div>
  )
}
