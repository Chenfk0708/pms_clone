import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './HouseStatusSharingPage.css'

export function HouseStatusSharingPage() {
  const navigate = useNavigate()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [roomPickerOpen, setRoomPickerOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [requiresLogin, setRequiresLogin] = useState(true)
  const [shareDateMode, setShareDateMode] = useState<'unlimited' | 'custom'>('unlimited')
  const [stats, setStats] = useState(['入住率'])
  const [roomStateVisible, setRoomStateVisible] = useState(true)
  const [orderFields, setOrderFields] = useState<string[]>([])
  const [multiViewEnabled, setMultiViewEnabled] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [expandedRoomTypes, setExpandedRoomTypes] = useState<string[]>([
    '总裁套间（桑拿浴缸露台电竞麻将）',
    '顶层套房（浴缸巨幕电竞麻将）',
    '天落大床电竞套间',
    '观影大床房',
  ])
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [roomKeyword, setRoomKeyword] = useState('')
  const [roomTag, setRoomTag] = useState('')

  const shareMemberLabel = feedback.includes('成员') ? feedback : ''
  const shareRoomLabel =
    selectedRooms.length > 0 ? `已添加分享房间 ${selectedRooms.length} 间` : feedback.includes('房间') ? feedback : ''

  const roomGroups = [
    { roomType: '总裁套间（桑拿浴缸露台电竞麻将）', rooms: ['房间1'] },
    { roomType: '顶层套房（浴缸巨幕电竞麻将）', rooms: ['房间1'] },
    { roomType: '天落大床电竞套间', rooms: ['1'] },
    { roomType: '观影大床房', rooms: ['房间1'] },
  ]

  function toggleArrayValue(value: string, current: string[], setter: (next: string[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  function closeDialog() {
    setCreateDialogOpen(false)
    setRoomPickerOpen(false)
  }

  function toggleExpandedRoomType(roomType: string) {
    setExpandedRoomTypes((current) =>
      current.includes(roomType) ? current.filter((item) => item !== roomType) : [...current, roomType],
    )
  }

  function toggleSelectedRoom(roomKey: string) {
    setSelectedRooms((current) =>
      current.includes(roomKey) ? current.filter((item) => item !== roomKey) : [...current, roomKey],
    )
  }

  return (
    <div className="page-stack room-status-sharing-page">
      <section className="room-status-sharing-card">
        <header className="room-status-sharing-card__header">
          <div className="room-status-sharing-breadcrumb" aria-label="房态分享导航">
            <button type="button" onClick={() => navigate('/houseManage/months')}>
              月房态
            </button>
            <span>/</span>
            <strong>分享房态</strong>
          </div>
          <button type="button" className="room-status-sharing-card__primary" onClick={() => setCreateDialogOpen(true)}>
            新增房态分享
          </button>
        </header>

        <div className="room-status-sharing-table" role="table" aria-label="房态分享列表">
          <div className="room-status-sharing-table__head" role="rowgroup">
            <div className="room-status-sharing-table__row room-status-sharing-table__row--head" role="row">
              {['标题', '房间数', '房间号', '需要登陆', '分享成员', '分享日期', '分享链接', '操作'].map((column) => (
                <div key={column} role="columnheader">
                  {column}
                </div>
              ))}
            </div>
          </div>

          <div className="room-status-sharing-table__body" role="rowgroup">
            <div className="room-status-sharing-empty" role="status" aria-label="房态分享空状态">
              <div className="room-status-sharing-empty__icon" aria-hidden="true">
                <span />
              </div>
              <p>暂无数据</p>
            </div>
          </div>
        </div>
      </section>

      {createDialogOpen ? (
        <div className="room-status-sharing-dialog-mask" role="presentation" onClick={closeDialog}>
          <section
            className="room-status-sharing-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="创建房态分享"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="room-status-sharing-dialog__header">
              <div>
                <strong>创建房态分享</strong>
                <p>分享内容包含敏感信息，仅限分享成员登录后查看。</p>
              </div>
              <button type="button" aria-label="关闭创建房态分享" onClick={closeDialog}>
                ×
              </button>
            </header>

            <div className="room-status-sharing-dialog__body">
              <label className="room-status-sharing-dialog__field room-status-sharing-dialog__field--title">
                <span>* 标题：</span>
                <div className="room-status-sharing-dialog__title-wrap">
                  <input
                    aria-label="分享标题"
                    maxLength={30}
                    placeholder="请输入标题"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  <em>{title.length} / 30</em>
                </div>
              </label>

              <div className="room-status-sharing-dialog__field">
                <span>* 是否登录：</span>
                <div className="room-status-sharing-dialog__radio-group" role="radiogroup" aria-label="是否登录">
                  <label>
                    <input
                      type="radio"
                      name="share-login"
                      checked={requiresLogin}
                      onChange={() => setRequiresLogin(true)}
                    />
                    <span>是</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="share-login"
                      checked={!requiresLogin}
                      onChange={() => setRequiresLogin(false)}
                    />
                    <span>否</span>
                  </label>
                </div>
              </div>

              <div className="room-status-sharing-dialog__field">
                <span>* 分享成员：</span>
                <div className="room-status-sharing-dialog__inline">
                  <button
                    type="button"
                    className="room-status-sharing-dialog__outline-button"
                    onClick={() => setFeedback('已选择分享成员')}
                  >
                    ＋ 选择成员
                  </button>
                  {shareMemberLabel ? <small>{shareMemberLabel}</small> : null}
                </div>
              </div>

              <div className="room-status-sharing-dialog__field">
                <span>统计数据：</span>
                <div className="room-status-sharing-dialog__checkbox-row">
                  {['入住率', '间夜数', '平均房费', '总房费'].map((item) => (
                    <label key={item}>
                      <input
                        type="checkbox"
                        checked={stats.includes(item)}
                        onChange={() => toggleArrayValue(item, stats, setStats)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="room-status-sharing-dialog__field">
                <span>房间状态：</span>
                <button
                  type="button"
                  className={`room-status-sharing-dialog__switch${roomStateVisible ? ' is-on' : ''}`}
                  role="switch"
                  aria-checked={roomStateVisible}
                  aria-label="房间状态"
                  onClick={() => setRoomStateVisible((current) => !current)}
                >
                  <span />
                </button>
              </div>

              <div className="room-status-sharing-dialog__field">
                <span>订单数据：</span>
                <div className="room-status-sharing-dialog__checkbox-row">
                  {['房客姓名', '渠道来源', '房费', '订单备注'].map((item) => (
                    <label key={item}>
                      <input
                        type="checkbox"
                        checked={orderFields.includes(item)}
                        onChange={() => toggleArrayValue(item, orderFields, setOrderFields)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="room-status-sharing-dialog__field">
                <span>* 分享日期：</span>
                <div className="room-status-sharing-dialog__radio-group" role="radiogroup" aria-label="分享日期">
                  <label>
                    <input
                      type="radio"
                      name="share-date-mode"
                      checked={shareDateMode === 'unlimited'}
                      onChange={() => setShareDateMode('unlimited')}
                    />
                    <span>不限</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="share-date-mode"
                      checked={shareDateMode === 'custom'}
                      onChange={() => setShareDateMode('custom')}
                    />
                    <span>自定义</span>
                  </label>
                </div>
                {shareDateMode === 'custom' ? (
                  <input className="room-status-sharing-dialog__date-input" type="date" aria-label="自定义分享日期" />
                ) : (
                  <i className="room-status-sharing-dialog__date-placeholder" aria-hidden="true">
                    -
                  </i>
                )}
              </div>

              <div className="room-status-sharing-dialog__field">
                <span>* 分享房间：</span>
                <div className="room-status-sharing-dialog__inline">
                  <button
                    type="button"
                    className="room-status-sharing-dialog__outline-button"
                    onClick={() => setRoomPickerOpen(true)}
                  >
                    ＋ 添加房间
                  </button>
                  {shareRoomLabel ? <small>{shareRoomLabel}</small> : null}
                </div>
              </div>

              <div className="room-status-sharing-dialog__field">
                <span>多视图：</span>
                <button
                  type="button"
                  className={`room-status-sharing-dialog__switch${multiViewEnabled ? ' is-on' : ''}`}
                  role="switch"
                  aria-checked={multiViewEnabled}
                  aria-label="多视图"
                  onClick={() => setMultiViewEnabled((current) => !current)}
                >
                  <span />
                </button>
              </div>
            </div>

            <footer className="room-status-sharing-dialog__footer">
              <button type="button" className="room-status-sharing-dialog__footer-button" onClick={closeDialog}>
                取消
              </button>
              <button
                type="button"
                className="room-status-sharing-dialog__footer-button is-primary"
                onClick={() => {
                  setFeedback(`已创建房态分享：${title || '未命名分享'}`)
                  closeDialog()
                }}
              >
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {roomPickerOpen ? (
        <div className="room-status-sharing-dialog-mask" role="presentation" onClick={() => setRoomPickerOpen(false)}>
          <section
            className="room-status-sharing-dialog room-status-sharing-dialog--picker"
            role="dialog"
            aria-modal="true"
            aria-label="选择房间"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="room-status-sharing-dialog__header">
              <strong>选择房间</strong>
              <button type="button" aria-label="关闭选择房间" onClick={() => setRoomPickerOpen(false)}>
                ×
              </button>
            </header>

            <div className="room-status-sharing-room-picker">
              <div className="room-status-sharing-room-picker__toolbar">
                <select aria-label="房型标签" value={roomTag} onChange={(event) => setRoomTag(event.target.value)}>
                  <option value="">请选择房型标签</option>
                  <option value="电竞">电竞</option>
                  <option value="观影">观影</option>
                </select>
                <input
                  aria-label="搜索房间"
                  value={roomKeyword}
                  placeholder="输入房间/房型名称"
                  onChange={(event) => setRoomKeyword(event.target.value)}
                />
              </div>

              <div className="room-status-sharing-room-picker__list">
                {roomGroups.map((group) => {
                  const visibleRooms = group.rooms.filter((room) => `${group.roomType}${room}`.includes(roomKeyword.trim()))
                  if (!visibleRooms.length) return null

                  const allChecked = visibleRooms.every((room) => selectedRooms.includes(`${group.roomType}-${room}`))
                  return (
                    <section key={group.roomType} className="room-status-sharing-room-picker__group">
                      <label className="room-status-sharing-room-picker__group-row">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={() =>
                            setSelectedRooms((current) => {
                              const keys = visibleRooms.map((room) => `${group.roomType}-${room}`)
                              return allChecked
                                ? current.filter((item) => !keys.includes(item))
                                : Array.from(new Set([...current, ...keys]))
                            })
                          }
                        />
                        <span>{group.roomType}</span>
                        <button
                          type="button"
                          className={`room-status-sharing-room-picker__arrow${expandedRoomTypes.includes(group.roomType) ? ' is-open' : ''}`}
                          aria-label={`${expandedRoomTypes.includes(group.roomType) ? '收起' : '展开'}${group.roomType}`}
                          onClick={(event) => {
                            event.preventDefault()
                            toggleExpandedRoomType(group.roomType)
                          }}
                        >
                          ▾
                        </button>
                      </label>

                      {expandedRoomTypes.includes(group.roomType) ? (
                        <div className="room-status-sharing-room-picker__children">
                          {visibleRooms.map((room) => {
                            const roomKey = `${group.roomType}-${room}`
                            return (
                              <label key={roomKey} className="room-status-sharing-room-picker__room-row">
                                <input
                                  type="checkbox"
                                  checked={selectedRooms.includes(roomKey)}
                                  onChange={() => toggleSelectedRoom(roomKey)}
                                />
                                <span>{room}</span>
                              </label>
                            )
                          })}
                        </div>
                      ) : null}
                    </section>
                  )
                })}
              </div>
            </div>

            <footer className="room-status-sharing-dialog__footer">
              <button
                type="button"
                className="room-status-sharing-dialog__footer-button"
                onClick={() => setRoomPickerOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="room-status-sharing-dialog__footer-button is-primary"
                onClick={() => {
                  setFeedback(selectedRooms.length > 0 ? `已添加分享房间 ${selectedRooms.length} 间` : '已添加分享房间')
                  setRoomPickerOpen(false)
                }}
              >
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {feedback ? (
        <div className="room-status-sharing-feedback" role="status" aria-live="polite">
          {feedback}
        </div>
      ) : null}
    </div>
  )
}

type OrderRefreshPopoverProps = {
  open: boolean
  onRefresh: () => void
}

export function OrderRefreshPopover({ open, onRefresh }: OrderRefreshPopoverProps) {
  if (!open) return null

  return (
    <div className="room-status-refresh-popover" role="dialog" aria-label="订单刷新">
      <header>订单刷新</header>
      <div className="room-status-refresh-popover__body">美团酒店订单</div>
      <footer>
        <button type="button" className="room-status-refresh-popover__primary" onClick={onRefresh}>
          刷新
        </button>
      </footer>
    </div>
  )
}
