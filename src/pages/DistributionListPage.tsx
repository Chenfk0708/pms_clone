import { useEffect, useMemo, useState } from 'react'
import {
  createDefaultDistributionFilters,
  distributionListEndpoints,
  fetchDistributionDashboard,
  type DistributionDashboard,
  type DistributionFilters,
  type DistributionRoomCategory,
  type DistributionTab,
} from '../services/distributionList'
import './DistributionListPage.css'

const actionButtons = [
  { label: '提现教程', route: '/statistics/distributionOrder' },
  { label: '房态管理', route: '/houseManage/months' },
  { label: '房价管理', route: '/houseManage/houseCale' },
  { label: '房型管理', route: '/setting/roomTypeInfo' },
  { label: '分销配置', route: '/channels/distribution/distributiondisplacement' },
]

export function DistributionListPage() {
  const [filters, setFilters] = useState<DistributionFilters>(() =>
    createDefaultDistributionFilters(new URLSearchParams(window.location.search)),
  )
  const [keywordDraft, setKeywordDraft] = useState(filters.keyword)
  const [dashboard, setDashboard] = useState<DistributionDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<DistributionRoomCategory | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
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

  const visibleRows = useMemo(() => {
    if (!dashboard) return []
    return filters.tab === 'distributed' ? dashboard.distributedRooms : dashboard.undistributedRooms
  }, [dashboard, filters.tab])

  const requestSnapshot = dashboard ? JSON.stringify(dashboard.request) : JSON.stringify({ filters })

  const reload = (message = '分销列表已刷新') => {
    setNotice('')
    setFilters((current) => ({ ...current, scenario: 'success', page: 1 }))
    window.setTimeout(() => setNotice(message), 120)
  }

  const selectTab = (nextTab: DistributionTab) => {
    setShowImportMenu(false)
    setNotice('')
    setFilters((current) => ({ ...current, tab: nextTab, page: 1 }))
  }

  const query = () => {
    setFilters((current) => ({ ...current, keyword: keywordDraft, page: 1, scenario: 'success' }))
    setNotice('已按当前条件查询分销列表')
  }

  const reset = () => {
    setKeywordDraft('')
    setFilters((current) => ({ ...current, keyword: '', poiId: 'ALL', page: 1, scenario: 'success' }))
    setNotice('筛选条件已重置')
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
    >
      <div className="distribution-list-tabs" role="group" aria-label="分销状态">
        <button type="button" className={filters.tab === 'distributed' ? 'is-active' : ''} onClick={() => selectTab('distributed')}>
          已分销
        </button>
        <button type="button" className={filters.tab === 'undistributed' ? 'is-active' : ''} onClick={() => selectTab('undistributed')}>
          未分销
        </button>
      </div>

      <section className="distribution-list-filter" aria-label="分销列表筛选">
        <label>
          <span>门店</span>
          <select
            value={filters.poiId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, poiId: event.target.value, page: 1, scenario: 'success' }))
            }
          >
            {(dashboard?.stores ?? []).map((store) => (
              <option key={store.id} value={store.id}>
                {store.label}
              </option>
            ))}
          </select>
        </label>
        <label className="distribution-list-filter__keyword">
          <span>房型</span>
          <input
            value={keywordDraft}
            placeholder="搜索房型或原因"
            onChange={(event) => setKeywordDraft(event.target.value)}
          />
        </label>
        <div className="distribution-list-filter__actions">
          <button type="button" className="is-primary" onClick={query} disabled={loading}>
            查询
          </button>
          <button type="button" onClick={reset} disabled={loading}>
            重置
          </button>
          <button type="button" onClick={() => reload()} disabled={loading}>
            刷新
          </button>
          <button type="button" onClick={() => setNotice('导出任务已创建')} disabled={loading}>
            导出
          </button>
        </div>
      </section>

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
        <>
          <section className="distribution-overview" aria-label="分销概览">
            {dashboard.metrics.map((metric) => (
              <button
                type="button"
                key={metric.key}
                className="distribution-metric"
                onClick={() => setNotice(`${metric.label}：${metric.detail}`)}
              >
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <em>{metric.detail}</em>
              </button>
            ))}
          </section>

          <section className="distribution-channel-strip" aria-label="分销渠道概览">
            {dashboard.channels.map((channel) => (
              <button
                type="button"
                key={channel.id}
                onClick={() => setNotice(`${channel.name}预计订单 ${channel.expectedOrders} 单`)}
              >
                <strong>{channel.name}</strong>
                <span>{channel.statusLabel}</span>
                <em>{channel.expectedOrders}单</em>
              </button>
            ))}
          </section>

          {filters.tab === 'distributed' ? (
            <section className="distribution-panel distribution-panel--distributed" aria-label="已分销操作">
              <div className="distribution-panel__actions">
                {actionButtons.map((action, index) => (
                  <button
                    key={action.label}
                    type="button"
                    className={index === 0 ? 'is-outline' : 'is-primary'}
                    onClick={() => setNotice(`${action.label}入口已准备，路径 ${action.route}`)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <RoomTable label="已分销房型表" rows={visibleRows} emptyText="当前条件暂无分销房型" onDetail={setSelectedRoom} />
            </section>
          ) : (
            <section className="distribution-panel" aria-label="未分销列表">
              <div className="distribution-toolbar">
                <div className="distribution-panel__actions">
                  <button
                    type="button"
                    className="is-primary"
                    onClick={() => setNotice('已创建上架任务')}
                    disabled={visibleRows.length === 0}
                  >
                    一键上架
                  </button>
                  <div className="distribution-dropdown">
                    <button
                      type="button"
                      className="is-primary"
                      aria-expanded={showImportMenu}
                      onClick={() => setShowImportMenu((value) => !value)}
                    >
                      渠道导入完善
                    </button>
                    {showImportMenu ? (
                      <div className="distribution-dropdown__menu" role="menu">
                        <button type="button" role="menuitem" onClick={() => setNotice('OTA 导入任务已创建')}>
                          OTA 导入完善
                        </button>
                        <button type="button" role="menuitem" onClick={() => setNotice('模板导入任务已创建')}>
                          模板导入完善
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <RoomTable label="未分销房型表" rows={visibleRows} emptyText="当前条件暂无待完善房型" onDetail={setSelectedRoom} />
            </section>
          )}
        </>
      ) : null}

      {loading ? <div className="distribution-loading">分销列表加载中...</div> : null}

      {notice ? (
        <div className="distribution-toast" role="status">
          {notice}
        </div>
      ) : null}

      {selectedRoom ? (
        <div className="distribution-modal" role="presentation">
          <div className="distribution-dialog" role="dialog" aria-modal="true" aria-label="分销详情">
            <div className="distribution-dialog__header">
              <h2>{selectedRoom.name}</h2>
              <button type="button" onClick={() => setSelectedRoom(null)} aria-label="关闭详情">
                ×
              </button>
            </div>
            <dl>
              <div>
                <dt>门店</dt>
                <dd>{selectedRoom.storeName}</dd>
              </div>
              <div>
                <dt>渠道同步</dt>
                <dd>{selectedRoom.channelName} / {selectedRoom.syncStatusLabel}</dd>
              </div>
              <div>
                <dt>库存与价格</dt>
                <dd>{selectedRoom.inventory} 间 / ¥{selectedRoom.price}</dd>
              </div>
              <div>
                <dt>处理结果</dt>
                <dd>{selectedRoom.reason}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RoomTable({
  label,
  rows,
  emptyText,
  onDetail,
}: {
  label: string
  rows: DistributionRoomCategory[]
  emptyText: string
  onDetail: (room: DistributionRoomCategory) => void
}) {
  return (
    <div className="distribution-table-wrap">
      <table className="distribution-table" aria-label={label}>
        <thead>
          <tr>
            <th>房型</th>
            <th>门店</th>
            <th>渠道</th>
            <th>状态/原因</th>
            <th>库存</th>
            <th>价格</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((room) => (
              <tr key={room.id}>
                <td>{room.name}</td>
                <td>{room.storeName}</td>
                <td>{room.channelName}</td>
                <td>{room.syncStatusLabel}，{room.reason}</td>
                <td>{room.inventory}</td>
                <td>¥{room.price}</td>
                <td>
                  <button type="button" className="distribution-table__link" onClick={() => onDetail(room)}>
                    详情
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr className="distribution-empty-row">
              <td colSpan={7}>
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
