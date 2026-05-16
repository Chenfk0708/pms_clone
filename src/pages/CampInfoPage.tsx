import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './CampInfoPage.css'

type SortTab = 'store' | 'roomType' | 'goods'

interface RoomTypeItem {
  name: string
  image: string
  roomCount: string
  room: string
}

const storeName = '天落会宿公寓(前海壹方城宝安中心店)'
const storeAddress = '深圳宝安区新安街道海裕社区N15幸福海岸花园10栋30楼, 中国'

const roomTypes: RoomTypeItem[] = [
  { name: '顶层套房（浴缸巨幕电竞麻将）', image: 'night', roomCount: '1', room: '房间1' },
  { name: '总裁套间（桑拿浴缸露台电竞麻将）', image: 'suite', roomCount: '1', room: '房间1' },
  { name: '天落大床电竞套间', image: 'bed', roomCount: '1', room: '1' },
  { name: '观影大床房', image: 'film', roomCount: '1', room: '房间1' },
]

export function CampInfoPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/edit')) return <CampInfoEditPage />
  if (location.pathname.endsWith('/sort')) return <CampInfoSortPage />
  return <CampInfoListPage />
}

function CampInfoListPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [notice, setNotice] = useState('')
  const [showNewStoreLimit, setShowNewStoreLimit] = useState(false)

  return (
    <div className="camp-info-page">
      <h1 className="sr-only-heading">门店信息</h1>
      <section className="camp-info-query" aria-label="门店信息筛选">
        <label>
          <span>门店名称:</span>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入" />
        </label>
        <div className="camp-info-query__actions">
          <button type="button" className="is-primary" onClick={() => setNotice('已按当前条件查询')}>
            查 询
          </button>
          <button type="button" onClick={() => setKeyword('')}>
            重 置
          </button>
        </div>
      </section>

      <section className="camp-info-summary">
        <div>
          <span>当前系统门店：</span>
          <strong>1/1</strong>
          <em>（2025.09.28 至 2027.09.28 ）</em>
        </div>
        <div className="camp-info-summary__actions">
          <button type="button" className="is-primary" onClick={() => setShowNewStoreLimit(true)}>
            新建门店
          </button>
          <button type="button" className="is-primary" onClick={() => setNotice('已打开一键导入菜单')}>
            一键导入⌄
          </button>
          <button type="button" className="is-primary" onClick={() => navigate('/InformationMaintenance/campInfo/sort')}>
            门店排序
          </button>
        </div>
      </section>

      <section className="camp-info-table" role="table" aria-label="门店信息列表">
        <div className="camp-info-table__head" role="row">
          <div role="columnheader" />
          <div role="columnheader">门店名称</div>
          <div role="columnheader">门店类型</div>
          <div role="columnheader">图片</div>
          <div role="columnheader">地址</div>
          <div role="columnheader">上架房型数量</div>
          <div role="columnheader">操作</div>
        </div>
        <div className="camp-info-table__row" role="row">
          <div role="cell">
            <button
              type="button"
              className={expanded ? 'camp-info-expand is-open' : 'camp-info-expand'}
              aria-label="展开门店房型"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? '−' : '+'}
            </button>
          </div>
          <div role="cell">{storeName}</div>
          <div role="cell">酒店</div>
          <div role="cell">
            <div className="camp-info-thumb" aria-label="门店图片预览" />
          </div>
          <div role="cell">{storeAddress}</div>
          <div role="cell">4</div>
          <div role="cell" className="camp-info-actions">
            <button type="button" onClick={() => navigate('/InformationMaintenance/campInfo/edit')}>
              详情
            </button>
            <button type="button" onClick={() => navigate('/InformationMaintenance/campInfo/edit')}>
              编辑
            </button>
            <button type="button" onClick={() => setNotice('已下架当前门店')}>
              下架
            </button>
            <button type="button" className="is-danger" onClick={() => setNotice('删除前需要二次确认')}>
              删除
            </button>
          </div>
        </div>
        {expanded ? (
          <div className="camp-info-room-detail" role="rowgroup" aria-label="门店房型明细">
            {roomTypes.map((room) => (
              <article key={room.name} className="camp-info-room-row">
                <div className={`camp-info-room-image camp-info-room-image--${room.image}`} />
                <div>
                  <p>房型名称: {room.name}</p>
                  <p>房间数量: {room.roomCount}</p>
                </div>
                <div>房间: {room.room}</div>
                <div className="camp-info-room-actions">
                  <button type="button">修改</button>
                  <button type="button">房间</button>
                  <button type="button">联动关房</button>
                  <button type="button" className="is-danger">
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <footer className="camp-info-pagination">
        <span>第 1-1 条/总共 1 条</span>
        <button type="button" aria-current="page">
          1
        </button>
        <button type="button">20 条/页</button>
      </footer>
      {showNewStoreLimit ? (
        <div className="camp-info-modal-backdrop">
          <section
            className="camp-info-limit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="camp-info-limit-title"
          >
            <h2 id="camp-info-limit-title">门店剩余数量不足</h2>
            <p>您当前门店数量已达到上限，无法新增，可扩容后重试</p>
            <footer>
              <button type="button" onClick={() => setShowNewStoreLimit(false)}>
                取消操作
              </button>
              <button type="button" className="is-primary" onClick={() => setNotice('已跳转至扩容入口')}>
                前往扩容
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {notice ? <div role="status" className="camp-info-toast">{notice}</div> : null}
    </div>
  )
}

function CampInfoEditPage() {
  const navigate = useNavigate()
  const [tag, setTag] = useState('')

  return (
    <div className="camp-info-page camp-info-edit-page">
      <div className="camp-info-edit-title">
        <span>门店信息 /</span>
        <h1>编辑</h1>
      </div>
      <nav className="camp-info-steps" aria-label="门店信息步骤">
        <span className="is-active">
          <b>1</b>
          基本信息
        </span>
        <i />
        <span>
          <b>2</b>
          详细介绍
        </span>
      </nav>
      <section className="camp-info-form-card">
        <div className="camp-info-form-grid">
          <label>
            <span>* 门店名称</span>
            <input aria-label="门店名称" defaultValue={storeName} placeholder="请输入门店名称" />
          </label>
          <label>
            <span>* 门店类型</span>
            <button type="button" className="camp-info-select">
              酒店
            </button>
          </label>
          <label>
            <span>* 联系电话</span>
            <input aria-label="联系电话" defaultValue="+86-18123941382" />
          </label>
          <label className="camp-info-tag-row">
            <span>门店标签</span>
            <input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="请输入门店标签" />
            <button type="button">＋ 添加门店标签</button>
          </label>
          <div className="camp-info-upload-row">
            <span>* 门店图片</span>
            <div className="camp-info-photo-grid" aria-label="门店图片">
              {Array.from({ length: 9 }, (_, index) => (
                <div key={index} className={`camp-info-photo camp-info-photo--${index + 1}`} />
              ))}
              <button type="button" className="camp-info-upload-button">＋<br />上传</button>
            </div>
            <p>
              <em>第一张图片将会作为封面</em>
              <button type="button">调整图片顺序</button>
            </p>
          </div>
          <label>
            <span>* 所在城市</span>
            <button type="button" className="camp-info-select">
              广东省/深圳市/宝安区
            </button>
          </label>
          <label>
            <span>* 街道地址</span>
            <input defaultValue="深圳宝安区新安街道海裕社区N15幸福海岸花园" />
          </label>
          <label>
            <span>小区名称</span>
            <input placeholder="请输入小区名称" />
          </label>
          <label>
            <span>* 单元、门牌号</span>
            <input defaultValue="10栋30楼" />
          </label>
          <label className="camp-info-address">
            <span>* 详细地址</span>
            <textarea defaultValue={storeAddress} />
          </label>
          <div className="camp-info-map">
            <span>地图位置</span>
            <div className="camp-info-map__canvas">
              <button type="button">+</button>
              <button type="button">−</button>
              <small>© 2026 AutoNavi - GS(2023)4677号</small>
            </div>
            <p>若地图自动获取坐标有误，请拖动图标至正确坐标</p>
          </div>
        </div>
      </section>
      <footer className="camp-info-edit-footer">
        <button type="button" onClick={() => navigate('/InformationMaintenance/campInfo')}>
          取 消
        </button>
        <button type="button" className="is-primary">
          下一步
        </button>
      </footer>
    </div>
  )
}

function CampInfoSortPage() {
  const [activeTab, setActiveTab] = useState<SortTab>('store')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 1800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const items =
    activeTab === 'store'
      ? [storeName]
      : activeTab === 'roomType'
        ? roomTypes.map((room) => room.name)
        : ['桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾', '双人电竞麻将套票', '巨幕观影套餐', '延迟退房权益']

  return (
    <div className="camp-info-page camp-info-sort-page">
      <div className="camp-info-sort-tabs" role="tablist" aria-label="排序类型">
        {[
          ['store', '门店排序'],
          ['roomType', '房型排序'],
          ['goods', '商品排序'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key as SortTab)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="camp-info-sort-help">拖拽即可进行排序，选定排序方式之后，系统将按照下方顺序展示</p>
      <section className="camp-info-sort-list" aria-label={activeTab === 'store' ? '门店排序列表' : activeTab === 'roomType' ? '房型排序列表' : '商品排序列表'}>
        {items.map((item) => (
          <article key={item} className="camp-info-sort-item">
            <span className="camp-info-drag-handle">⋮⋮</span>
            <strong>{item}</strong>
          </article>
        ))}
      </section>
      <button type="button" className="camp-info-save-sort is-primary" onClick={() => setNotice('排序已保存')}>
        保存排序
      </button>
      {notice ? <div role="status" className="camp-info-toast">{notice}</div> : null}
    </div>
  )
}
