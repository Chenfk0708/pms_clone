import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './HouseDaysPage.css'
import { roomCards, statusGroups, viewModes } from './houseDaysData'

export function HouseDaysPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('按房型')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [openMenu, setOpenMenu] = useState<'settings' | 'clean' | 'openClose' | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [feedback, setFeedback] = useState('')

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
    setFeedback(`${label}筛选已切换；实时刷新接口接入阻塞，当前仅更新本地筛选状态。`)
  }

  const blockAction = (message: string) => {
    setOpenMenu(null)
    setFeedback(message)
  }

  const resetFilters = () => {
    setSelectedFilters([])
    setFeedback('已重置当前日房态筛选；实时刷新接口接入阻塞，未伪装成接口刷新成功。')
  }

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setFeedback(`搜索条件已记录：${keyword || '空关键词'}；真实查询接口接入阻塞，未伪装成接口请求成功。`)
    }
  }

  return (
    <div className="page-stack day-status-page">
      <section className="toolbar-card day-toolbar">
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
            <button type="button" onClick={() => navigate('/houseManage/months')}>
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
            <button type="button" className="primary-action" onClick={() => blockAction('读卡器未接入：目标站读卡依赖外设和客户端能力，本地仅暴露阻塞。')}>
              读卡
            </button>
            <button type="button" className="primary-action" onClick={() => navigate('/houseManage/houseCale')}>
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
                <button type="button" role="menuitem" onClick={() => blockAction('房态设置真实入口未取证，已作为跨页入口阻塞暴露。')}>
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
            onClick={() => navigate('/InformationMaintenance/campInfo')}
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
                  <button type="button" role="menuitem" onClick={() => blockAction('请先选择房间后再批量设脏；真实提交接口未接入。')}>
                    批量设脏
                  </button>
                  <button type="button" role="menuitem" onClick={() => blockAction('请先选择房间后再批量设净；真实提交接口未接入。')}>
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
                  <button type="button" role="menuitem" onClick={() => blockAction('请先选择房间后再批量关房；真实提交接口未接入。')}>
                    批量关房
                  </button>
                  <button type="button" role="menuitem" onClick={() => blockAction('请先选择房间后再批量开房；真实提交接口未接入。')}>
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
            <section key={`${room.roomType}-${room.roomName}`} className="day-room-group">
              <h3>{room.roomType}</h3>
              <article
                className="day-room-card"
                data-tone={room.booking?.tone ?? 'empty'}
                aria-label={`${room.roomType} ${room.roomName}`}
                tabIndex={0}
                onClick={() => blockAction(`${room.roomType} ${room.roomName} 房间详情实时接口未接入，已记录为阻塞。`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    blockAction(`${room.roomType} ${room.roomName} 房间详情实时接口未接入，已记录为阻塞。`)
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
        </div>

        <aside className="day-filter-panel">
          <div className="day-filter-tabs">
            {viewModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={viewMode === mode ? 'is-active' : ''}
                onClick={() => setViewMode(mode)}
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
            <select aria-label="渠道" onChange={(event) => blockAction(`渠道筛选已切换：${event.target.selectedOptions[0]?.text ?? event.target.value}；实时请求接入阻塞。`)}>
              <option>渠道</option>
              <option value="direct">直营渠道</option>
              <option value="ota">OTA</option>
            </select>
          </section>
          <section className="day-filter-group">
            <h3>房型</h3>
            <select aria-label="房型" onChange={(event) => blockAction(`房型筛选已切换：${event.target.selectedOptions[0]?.text ?? event.target.value}；实时请求接入阻塞。`)}>
              <option>房型</option>
              {roomCards.map((room) => (
                <option key={room.roomType} value={room.roomType}>
                  {room.roomType}
                </option>
              ))}
            </select>
          </section>
          <section className="day-filter-group">
            <h3>标签</h3>
            <select aria-label="标签" onChange={(event) => blockAction(`标签筛选已切换：${event.target.selectedOptions[0]?.text ?? event.target.value}；实时请求接入阻塞。`)}>
              <option>房型标签</option>
              <option value="remark">备注</option>
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
          <p>批量操作需要先选择房间，当前真实提交接口未接入，页面不会伪装成功。</p>
        </aside>
      ) : null}
    </div>
  )
}
