import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './RoomTypeInfoPage.css'

type DialogType = 'rooms' | 'linkage' | null

interface RoomTypeRow {
  name: string
  store: string
  roomCount: string
  roomNo: string
  linked: string
  group: string
}

const storeName = '天落会宿公寓(前海壹方城宝安中心店)'

const rows: RoomTypeRow[] = [
  { name: '顶层套房（浴缸巨幕电竞麻将）', store: storeName, roomCount: '1', roomNo: '房间1', linked: '', group: '' },
  { name: '总裁套间（桑拿浴缸露台电竞麻将）', store: storeName, roomCount: '1', roomNo: '房间1', linked: '', group: '' },
  { name: '天落大床电竞套间', store: storeName, roomCount: '1', roomNo: '1', linked: '', group: '' },
  { name: '观影大床房', store: storeName, roomCount: '1', roomNo: '房间1', linked: '', group: '' },
]

const steps = ['基础信息', '位置信息', '房型设施', '详细介绍', '照片信息']

export function RoomTypeInfoPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/edit')) {
    return <RoomTypeEditPage />
  }

  return <RoomTypeListPage />
}

function RoomTypeListPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [openSelect, setOpenSelect] = useState<'store' | 'group' | null>(null)
  const [dialog, setDialog] = useState<DialogType>(null)
  const [activeRow, setActiveRow] = useState(rows[0])

  function openDialog(type: Exclude<DialogType, null>, row: RoomTypeRow) {
    setActiveRow(row)
    setDialog(type)
  }

  useEffect(() => {
    if (!dialog) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDialog(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dialog])

  return (
    <div className="room-type-info-page">
      <h1 className="sr-only-heading">房型信息</h1>

      <section className="room-type-info-query" aria-label="房型信息筛选">
        <div className="room-type-info-filter">
          <span>门店</span>
          <button type="button" onClick={() => setOpenSelect(openSelect === 'store' ? null : 'store')}>
            门店 请选择
          </button>
          {openSelect === 'store' ? (
            <div className="room-type-info-dropdown" role="listbox" aria-label="门店选项">
              <button type="button" role="option" onClick={() => setOpenSelect(null)}>
                {storeName}
              </button>
            </div>
          ) : null}
        </div>
        <div className="room-type-info-filter">
          <span>分组</span>
          <button type="button" onClick={() => setOpenSelect(openSelect === 'group' ? null : 'group')}>
            分组 请选择
          </button>
          {openSelect === 'group' ? (
            <div className="room-type-info-dropdown" role="listbox" aria-label="分组选项">
              <button type="button" role="option" onClick={() => setOpenSelect(null)}>
                {storeName}
              </button>
            </div>
          ) : null}
        </div>
        <label className="room-type-info-filter room-type-info-filter--keyword">
          <span>房型名称</span>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入" />
        </label>
        <div className="room-type-info-actions">
          <button type="button" onClick={() => setKeyword('')}>
            重 置
          </button>
          <button type="button" className="is-primary">
            查 询
          </button>
        </div>
      </section>

      <section className="room-type-info-panel">
        <div className="room-type-info-toolbar">
          <div className="room-type-info-stock">
            <span>当前系统库存：</span>
            <strong>4/10</strong>
            <em>（2025.09.28 至 2027.09.28 ）</em>
          </div>
          <div className="room-type-info-tools">
            <button type="button" onClick={() => navigate('/setting/roomTypeInfo/edit')}>
              添加房型
            </button>
            <button type="button">标签管理</button>
            <button type="button">楼层管理</button>
          </div>
        </div>

        <div className="room-type-info-table" role="table" aria-label="房型信息列表">
          <div className="room-type-info-table__head" role="row">
            {['房型名称', '门店', '房间数量', '房间号', '联动房型', '分组', '操作'].map((column) => (
              <div key={column} role="columnheader">
                {column}
              </div>
            ))}
          </div>
          <div className="room-type-info-table__body">
            {rows.map((row) => (
              <div className="room-type-info-table__row" role="row" key={row.name}>
                <div role="cell">{row.name}</div>
                <div role="cell">{row.store}</div>
                <div role="cell">{row.roomCount}</div>
                <div role="cell">{row.roomNo}</div>
                <div role="cell">{row.linked}</div>
                <div role="cell">{row.group}</div>
                <div role="cell" className="room-type-info-row-actions">
                  <button type="button" onClick={() => navigate('/setting/roomTypeInfo/edit', { state: { row } })}>
                    详情
                  </button>
                  <button type="button" onClick={() => openDialog('rooms', row)}>
                    房间
                  </button>
                  <button type="button" onClick={() => openDialog('linkage', row)}>
                    联动关房
                  </button>
                  <button type="button" className="is-danger">
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="room-type-info-pagination">
          <span>第 1-4 条/总共 4 条</span>
          <button type="button" aria-current="page">
            1
          </button>
          <button type="button">20 条/页</button>
        </div>
      </section>

      {dialog === 'rooms' ? <RoomListDialog row={activeRow} onClose={() => setDialog(null)} /> : null}
      {dialog === 'linkage' ? <LinkageDialog row={activeRow} onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

function RoomListDialog({ row, onClose }: { row: RoomTypeRow; onClose: () => void }) {
  return (
    <div className="room-type-info-modal-backdrop" onMouseDown={onClose}>
      <section className="room-type-info-modal room-type-info-modal--rooms" role="dialog" aria-label="房间列表" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="room-type-info-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2>房间列表</h2>
        <div className="room-type-info-room-table">
          <div className="room-type-info-room-table__head">
            <span>房间名称</span>
            <span>房型名称</span>
            <span>门锁情况</span>
            <span>楼层名称</span>
          </div>
          <div className="room-type-info-room-table__row">
            <span>{row.roomNo}</span>
            <span>{row.name}</span>
            <span>未绑定</span>
            <span>去设置</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function LinkageDialog({ row, onClose }: { row: RoomTypeRow; onClose: () => void }) {
  const options = rows.filter((item) => item.name !== row.name)

  return (
    <div className="room-type-info-modal-backdrop" onMouseDown={onClose}>
      <section className="room-type-info-modal room-type-info-modal--linkage" role="dialog" aria-label="联动关房" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="room-type-info-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2>联动关房</h2>
        <p>设置联动关房后，当前房型关房将联动关联的房型全部关房，关联的房型任一关房，将联动当前房型关房。适用于整租/包栋场景；</p>
        <div className="room-type-info-linkage-search">
          <input placeholder="请输入名称" />
          <button type="button">重 置</button>
          <button type="button" className="is-primary">
            搜 索
          </button>
        </div>
        <div className="room-type-info-linkage-options">
          {options.map((item) => (
            <label key={item.name}>
              <input type="checkbox" />
              <span>{item.name}</span>
            </label>
          ))}
        </div>
        <div className="room-type-info-linkage-footer">
          <span>已选中 0 项</span>
          <button type="button">全 选</button>
          <button type="button" className="is-primary">
            确 定
          </button>
        </div>
      </section>
    </div>
  )
}

function RoomTypeEditPage() {
  const location = useLocation()
  const selectedRow = (location.state as { row?: RoomTypeRow } | null)?.row
  const isDetail = Boolean(selectedRow)

  return (
    <div className="room-type-edit-page">
      <div className="room-type-edit-title">
        <span>房型设置/</span>
        <h1>{isDetail ? '详细信息' : '新增房型'}</h1>
      </div>
      <nav className="room-type-edit-steps" aria-label="房型设置步骤">
        {steps.map((step, index) => (
          <span key={step} className={index === 0 ? 'is-active' : ''}>
            {step}
          </span>
        ))}
      </nav>
      <section className="room-type-edit-card">
        <h2>基础信息</h2>
        <div className="room-type-edit-form">
          <label>
            <span>所属门店</span>
            <button type="button">{storeName}</button>
          </label>
          <label>
            <span>房型名称</span>
            <input aria-label="房型名称" placeholder="请输入房型名称" defaultValue={selectedRow?.name ?? ''} />
            <em>内部自用，不对外展示</em>
          </label>
          <label>
            <span>房间数量</span>
            <input aria-label="房间数量" defaultValue="1" />
            <small>间</small>
          </label>
          <label>
            <span>房间号</span>
            <input aria-label="房间号" placeholder="请输入房间号" defaultValue={selectedRow?.roomNo ?? '房间1'} />
            <button type="button" className="room-type-edit-add-room">
              添加房间
            </button>
          </label>
          {!isDetail ? (
            <>
              <label>
                <span>平日价</span>
                <input placeholder="请输入平日价" />
                <small>元</small>
              </label>
              <label>
                <span>周末价</span>
                <input placeholder="请输入周末价" />
                <small>元</small>
              </label>
              <label>
                <span>节假日价</span>
                <input placeholder="请输入节假日价" />
                <small>元</small>
              </label>
              <p className="room-type-edit-tip">创建完成房源后，价格请前往房态房价-房价管理 处查看与管理</p>
            </>
          ) : null}
        </div>
      </section>
      <footer className="room-type-edit-footer">
        <button type="button">下一步</button>
        <button type="button" className="is-primary">
          {isDetail ? '保存并退出' : '快捷创建'}
        </button>
      </footer>
    </div>
  )
}
