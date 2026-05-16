import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './CalendarRoomPage.css'

type FilterKey = 'channel' | 'status'

interface ProductItem {
  name: string
  channel: string
  breakfast: string
  refund: string
  actions: string[]
  status?: 'online' | 'offline'
}

interface RoomTypeRow {
  name: string
  count: number
  channels: string[]
  products: ProductItem[]
}

const storeName = '天落会宿公寓(前海壹方城宝安中心店)'

const channelOptions = ['途家', '美团民宿', '小猪', '携程', '美团酒店', '飞猪淘酒店', '路客云聚合', '木鸟']
const statusOptions = ['全部', '上架', '下架']

const roomRows: RoomTypeRow[] = [
  {
    name: '顶层套房（浴缸巨幕电竞麻将）',
    count: 11,
    channels: ['途', '美', '猪', '携', '飞', '聚', '鸟'],
    products: [
      {
        name: '桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾｜电竞百寸电脑｜天落床｜欢乐海岸宝安中心｜会展中心',
        channel: '途家',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
      {
        name: '浴缸可观影打麻将电竞电脑/聚会派对/近湾区之光摩天轮/近地铁/万元天落床宝安中心深圳湾欢乐海岸近机场',
        channel: '途家',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
      {
        name: '浴缸可观影可打麻将电竞电脑/顶层近湾区之光摩天轮/聚会派对/近地铁/万元天落床+欧式大床/河流桌宝中深圳湾欢乐海岸近机场',
        channel: '美团民宿',
        breakfast: '无早餐',
        refund: '阶梯退',
        actions: ['预览', '编辑', '修改价格', '上架'],
        status: 'offline',
      },
      {
        name: '天落床 真悬浮体验 70寸巨屏4K电视观影',
        channel: '小猪',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
      {
        name: '顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）<无早>',
        channel: '携程',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '修改价格', '下架'],
      },
      {
        name: '顶层套房（浴缸巨幕电竞麻将）',
        channel: '飞猪淘酒店',
        breakfast: '无早餐',
        refund: '未入住任意退',
        actions: ['预览', '修改价格', '下架'],
      },
      {
        name: '顶层套房（浴缸巨幕电竞麻将）',
        channel: '路客云聚合',
        breakfast: '无早餐',
        refund: '灵活',
        actions: ['编辑', '修改价格', '下架'],
      },
      {
        name: '浴缸可观影打麻将电竞电脑/聚会派对/近湾区之光摩天轮/近机场深圳湾近地铁宝安中心',
        channel: '木鸟',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
    ],
  },
  {
    name: '总裁套间（桑拿浴缸露台电竞麻将）',
    count: 9,
    channels: ['途', '美', '猪', '携', '飞', '聚', '鸟'],
    products: [
      {
        name: '桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾｜电竞百寸电脑｜天落床｜欢乐海岸宝安中心｜会展中心',
        channel: '途家',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
      {
        name: '轰趴浴缸麻将桑拿观',
        channel: '美团民宿',
        breakfast: '无早餐',
        refund: '阶梯退',
        actions: ['预览', '编辑', '修改价格', '上架'],
        status: 'offline',
      },
      {
        name: '浴缸桑拿台球乒乓环绕4米巨幕电脑 变形金刚 钢铁侠之家',
        channel: '小猪',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
      {
        name: '总裁套间（桑拿浴缸露台电竞麻将）',
        channel: '飞猪淘酒店',
        breakfast: '无早餐',
        refund: '未入住任意退',
        actions: ['预览', '修改价格', '下架'],
      },
      {
        name: '百万豪装♛台球乒乓桑拿浴缸百平露台俯瞰摩天轮深圳湾｜三联屏电竞电脑｜会展中心前海',
        channel: '木鸟',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
    ],
  },
  {
    name: '天落大床电竞套间',
    count: 8,
    channels: ['美', '猪', '携', '飞', '聚', '鸟'],
    products: [
      {
        name: '万元天落床｜观影电竞房40寸4K4060显卡升降电脑｜河流桌按摩椅｜俯瞰摩天轮深圳湾欢乐海岸｜宝安中心壹方城机场会展',
        channel: '美团民宿',
        breakfast: '无早餐',
        refund: '阶梯退',
        actions: ['预览', '编辑', '修改价格', '上架'],
        status: 'offline',
      },
      {
        name: '天落床真悬浮体验',
        channel: '小猪',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
      {
        name: '天落大床电竞套间',
        channel: '路客云聚合',
        breakfast: '无早餐',
        refund: '阶梯退',
        actions: ['编辑', '修改价格', '下架'],
      },
      {
        name: '万元天落床｜带鱼屏40寸4K4060升降电竞电脑｜河流桌按摩椅｜俯瞰摩天轮深圳湾',
        channel: '木鸟',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
    ],
  },
  {
    name: '观影大床房',
    count: 8,
    channels: ['途', '美', '携', '飞', '聚', '鸟'],
    products: [
      {
        name: '90寸4K影院｜珍藏河流桌｜深圳湾欢乐海岸宝安中心壹方城前海机场会展中心',
        channel: '途家',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
      {
        name: '90寸4K影院｜珍藏河流桌｜深圳湾欢乐海岸宝安中心壹方城前海机场会展中心',
        channel: '美团民宿',
        breakfast: '无早餐',
        refund: '阶梯退',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
      {
        name: '观影大床房-不含早-入住当天18点前可免费取消',
        channel: '美团酒店',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '修改价格', '下架'],
      },
      {
        name: '观影大床房',
        channel: '路客云聚合',
        breakfast: '无早餐',
        refund: '灵活',
        actions: ['编辑', '修改价格', '下架'],
      },
      {
        name: '特工密室/90寸4K影院｜河流桌｜宝安中心深圳湾欢乐海岸机场前海湾',
        channel: '木鸟',
        breakfast: '无早餐',
        refund: '-',
        actions: ['预览', '编辑', '修改价格', '下架'],
      },
    ],
  },
]

const calendarRoomConversations = [
  ['携程民宿-【M335275070】', '咨询中', '途家', '顶层套房（浴缸巨幕电竞麻将）', '房:加了'],
  ['携程民宿-【M566739056】', '咨询中', '途家', '总裁套间（桑拿浴缸露台电竞麻将）', '房:已办理退房'],
  ['携程民宿-【_WECHAT349】', '咨询中', '途家', '总裁套间（桑拿浴缸露台电竞麻将）', ''],
  ['CqBv9667', '咨询中', '途家', '', '房:不客气哈~'],
  ['去哪民宿-【去哪儿用户】', '咨询中', '途家 02.19-02.21（2晚）', '总裁套间（桑拿浴缸露台电竞麻将）', '房:亲 有的'],
  ['携程民宿-【M614718025】', '咨询中', '途家', '顶层套房（浴缸巨幕电竞麻将）', '房:什么时间段呢几号到几…'],
]

export function CalendarRoomPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/channelGoodsSetting')) {
    return <CalendarRoomEditPage />
  }

  return <CalendarRoomListPage />
}

function CalendarRoomListPage() {
  const navigate = useNavigate()
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [values, setValues] = useState<Record<FilterKey, string>>({
    channel: '',
    status: '全部',
  })
  const [keyword, setKeyword] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [notice, setNotice] = useState('')

  function chooseFilter(value: string) {
    if (!openFilter) return
    setValues((current) => ({ ...current, [openFilter]: value }))
    setOpenFilter(null)
  }

  function resetFilters() {
    setValues({ channel: '', status: '全部' })
    setKeyword('')
    setOpenFilter(null)
    setNotice('')
  }

  const currentOptions =
    openFilter === 'channel'
      ? { label: '渠道', options: channelOptions }
      : openFilter === 'status'
        ? { label: '上架状态', options: statusOptions }
        : null

  return (
    <div className="calendar-room-page" data-conversation-count={calendarRoomConversations.length}>
      <h1 className="sr-only-heading">日历房</h1>

      <section className="calendar-room-query" aria-label="日历房筛选">
        <div className="calendar-room-query__top">
          <label className="calendar-room-store">
            <span>全部门店</span>
            <button type="button" aria-label={`全部门店 ${storeName}`} className="calendar-room-store__select">
              {storeName}
            </button>
          </label>
          <div className="calendar-room-query__actions">
            <button type="button" onClick={() => navigate('/setting/roomTypeInfo')}>
              房型管理
            </button>
            <button
              type="button"
              className="is-primary"
              onClick={() => navigate('/setting/localRoomTypeProductionSetting/channelGoodsSetting')}
            >
              新增售卖产品
            </button>
          </div>
        </div>

        <div className="calendar-room-query__filters">
          <label className="calendar-room-field calendar-room-search">
            <span>搜索：</span>
            <input
              value={keyword}
              placeholder="请输入房型名称"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
          <FilterButton
            label="渠道"
            value={values.channel}
            placeholder="请选择渠道"
            isOpen={openFilter === 'channel'}
            onToggle={() => setOpenFilter(openFilter === 'channel' ? null : 'channel')}
          />
          <FilterButton
            label="上架状态"
            value={values.status}
            placeholder="全部"
            isOpen={openFilter === 'status'}
            onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
          />
          <button type="button" className="calendar-room-expand-all" onClick={() => setIsExpanded((value) => !value)}>
            {isExpanded ? '收起' : '展开'}
          </button>
          <button type="button" className="calendar-room-reset" onClick={resetFilters}>
            重 置
          </button>
          <button type="button" className="calendar-room-search-button" onClick={() => setNotice('已查询日历房售卖产品')}>
            搜 索
          </button>
        </div>

        {currentOptions ? (
          <div className="calendar-room-options" role="listbox" aria-label={`${currentOptions.label}选项`}>
            {currentOptions.options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={(openFilter === 'channel' ? values.channel : values.status) === option}
                onClick={() => chooseFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {notice ? (
        <div className="calendar-room-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="calendar-room-table" aria-label="日历房售卖产品列表">
        <div className="calendar-room-table__head">
          {['展开', '房型名称', '关联渠道', '产品数量', '操作'].map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        {roomRows.map((room) => (
          <RoomRow key={room.name} room={room} isExpanded={isExpanded} onToggle={() => setIsExpanded((value) => !value)} />
        ))}
      </section>

      <div className="calendar-room-pagination" aria-label="日历房分页">
        <span>第 1-4 条/总共 4 条</span>
        <button type="button" className="is-active">
          1
        </button>
        <button type="button">20 条/页</button>
      </div>
    </div>
  )
}

function RoomRow({
  room,
  isExpanded,
  onToggle,
}: {
  room: RoomTypeRow
  isExpanded: boolean
  onToggle: () => void
}) {
  const navigate = useNavigate()

  return (
    <article className="calendar-room-table__group">
      <div className="calendar-room-table__room-row">
        <div>
          <button type="button" className="calendar-room-row-toggle" onClick={onToggle}>
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>
        <div className="calendar-room-name">{room.name}</div>
        <div className="calendar-room-channels" aria-label={`${room.name}关联渠道`}>
          {room.channels.map((channel, index) => (
            <span key={`${room.name}-${channel}-${index}`} style={{ zIndex: room.channels.length - index }}>
              {channel}
            </span>
          ))}
        </div>
        <div>{room.count}</div>
        <div className="calendar-room-actions">
          <button type="button" onClick={() => navigate('/setting/roomTypeInfo/edit')}>
            编辑房型
          </button>
          <button type="button" onClick={() => navigate('/houseManage/houseCale')}>
            房价管理
          </button>
        </div>
      </div>
      {isExpanded ? <ProductDetails room={room} /> : null}
    </article>
  )
}

function ProductDetails({ room }: { room: RoomTypeRow }) {
  return (
    <div className="calendar-room-products" aria-label={`${room.name}产品明细`}>
      {room.products.map((product, index) => (
        <article key={`${room.name}-${product.name}-${index}`} className="calendar-room-product-card">
          <div className="calendar-room-product-card__main">
            <ProductField label="产品名称：" value={product.name} />
            <ProductField label="渠道：" value={product.channel} />
            <ProductField label="早餐类型：" value={product.breakfast} />
            <ProductField label="退订政策：" value={product.refund} />
          </div>
          <div className="calendar-room-product-card__actions">
            {product.actions.map((action) => (
              <button
                key={action}
                type="button"
                className={action === '上架' ? 'is-offline-action' : action === '下架' ? 'is-danger-link' : ''}
              >
                {action}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function ProductField({ label, value }: { label: string; value: string }) {
  return (
    <div className="calendar-room-product-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FilterButton({
  label,
  value,
  placeholder,
  isOpen,
  onToggle,
}: {
  label: string
  value: string
  placeholder: string
  isOpen: boolean
  onToggle: () => void
}) {
  const displayValue = value || placeholder

  return (
    <label className="calendar-room-field">
      <span>{label}：</span>
      <button
        type="button"
        className="calendar-room-select"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label} ${displayValue}`}
        onClick={onToggle}
      >
        {displayValue}
      </button>
    </label>
  )
}

function CalendarRoomEditPage() {
  const navigate = useNavigate()
  const [activeChannel, setActiveChannel] = useState('微信小程序')

  return (
    <div className="calendar-room-edit-page">
      <h1 className="sr-only-heading">日历房</h1>
      <div className="calendar-room-breadcrumb">日历房 / <strong>新增产品</strong></div>
      <div className="calendar-room-channel-tabs" role="tablist" aria-label="售卖渠道">
        {['微信小程序', '小红书小程序', '抖音来客', '自助机', '同程民宿', '途家民宿', '美团民宿', '小猪民宿', '木鸟民宿', '路客云聚合'].map((channel) => (
          <button
            key={channel}
            type="button"
            role="tab"
            aria-selected={activeChannel === channel}
            className={activeChannel === channel ? 'is-active' : ''}
            onClick={() => setActiveChannel(channel)}
          >
            {channel}
          </button>
        ))}
      </div>
      <section className="calendar-room-edit-card" aria-label="新增产品">
        <button type="button" className="calendar-room-pick-room">
          选择房型
        </button>
        <EditField label="房型">
          <button type="button" className="calendar-room-form-select">
            请选择
          </button>
        </EditField>
        <EditField label="售卖产品名称">
          <input readOnly value="系统自动生成，物理房型名称-早餐-退改规则" />
          <em>名称仅对商家侧展示，名称格式如：高级大床房-2份早餐-入住当天18:00前可取消</em>
        </EditField>
        <EditField label="产品类型">
          <div className="calendar-room-radio-row">
            <label>
              <input type="radio" name="productType" defaultChecked />
              全日房
            </label>
            <label>
              <input type="radio" name="productType" />
              钟点房
            </label>
          </div>
        </EditField>
        <EditField label="早餐">
          <div className="calendar-room-breakfast">
            <input aria-label="早餐份数" defaultValue="0" />
            <span>份早餐</span>
          </div>
        </EditField>
        <EditField label="取消规则">
          <div className="calendar-room-radio-row">
            {['未入住任意退', '阶梯退', '限时退', '不可退'].map((item, index) => (
              <label key={item}>
                <input type="radio" name="refundRule" defaultChecked={index === 0} />
                {item}
              </label>
            ))}
          </div>
        </EditField>
        <EditField label="房价">
          <p>创建之后前往【渠道RP价】设置或检查对应价格</p>
        </EditField>
        <footer className="calendar-room-edit-footer">
          <button type="button" onClick={() => navigate('/setting/localRoomTypeProductionSetting')}>
            取 消
          </button>
          <button type="button" className="is-primary">
            确 定
          </button>
        </footer>
      </section>
    </div>
  )
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="calendar-room-edit-field">
      <span>{label}</span>
      <div>{children}</div>
    </label>
  )
}
