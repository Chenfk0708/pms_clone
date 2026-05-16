import { useState, type CSSProperties } from 'react'
import './CustomChannelPage.css'

const systemChannels = [
  '自来客',
  '路客云聚合',
  '美团民宿',
  '美团酒店',
  '途家',
  '途家直连',
  '爱彼迎',
  '飞猪淘酒店',
  '飞猪民宿直连',
  '飞猪酒店直连',
  '小猪',
  '木鸟',
  '品牌小程序',
  '抖音小程序',
  '小红书',
  '百度',
  '微店',
  '携程',
  '携程国际',
  '58同城',
  '贝壳',
  '安居客',
  '艺龙',
  '京东直连',
  '房多多',
  '住多多',
  '云客赞',
  '千里马',
  '联联',
  '享库',
  '千千惠',
  '侠侣',
  '抖音',
  'Agoda',
  'Booking',
  'Expidia',
  'Homeaway',
  'Verbo',
  '其他',
  '高德酒店直连',
  '秋果',
  '轻住',
  '旅划算',
  '昇途',
  '尚美',
  '同程酒店直连',
  '抖音来客',
  '同程民宿直连',
  '路客云',
  '凤悦',
  '自助机RW',
  '同程民宿',
  '去哪儿酒店直连',
  '自助机YZ',
  '自助机ZD',
  '自助机PY',
  '自助机CQ',
  '锦江',
  '抖音来客直连',
  '自助机微住',
  '华住MO',
  '自助机PC',
  '视频号',
  '美酒分销',
  '自助机YK',
  '自营',
  '深圳捷旅',
  'Hotelbeds',
  'MG',
  '自助机KT',
  '自助机LM',
]

const channelColors = [
  '#6f89d1',
  '#263f86',
  '#ffc20c',
  '#08a6c8',
  '#ff6827',
  '#ff6a21',
  '#ff5561',
  '#edc36b',
  '#f0c46a',
  '#edc36b',
  '#fb3d70',
  '#ff792b',
  '#6ed331',
  '#801d72',
  '#ff1e3b',
  '#f52325',
  '#cf3737',
  '#0868e5',
  '#24c2df',
  '#ff7900',
  '#3268e4',
  '#20a719',
  '#f00000',
  '#e6291f',
  '#ff2814',
  '#ff0635',
  '#ff6841',
  '#40516a',
  '#13aee0',
  '#fc1d4e',
  '#5057df',
  '#ffe000',
  '#801d72',
  '#d9d9d9',
  '#d9461c',
  '#0076b6',
  '#095fe0',
  '#d9d9d9',
  '#bfc8d8',
  '#108df0',
  '#211c1d',
  '#314f88',
  '#ff9018',
  '#d79c2c',
  '#e25747',
  '#09bd72',
  '#1cc8df',
  '#0cbc72',
  '#07c676',
  '#14b7c1',
  '#0db5bf',
  '#08bd69',
  '#20527f',
  '#20527f',
  '#20527f',
  '#20527f',
  '#20527f',
  '#22539a',
  '#18cbed',
  '#1dc7ef',
  '#d9d9d9',
  '#1f5284',
  '#08ba65',
  '#0fb8de',
  '#20527f',
  '#20527f',
  '#20527f',
  '#20527f',
  '#20509a',
  '#20509a',
]

export function CustomChannelPage() {
  const [editing, setEditing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="custom-channel-page">
      <div className="custom-channel-tip">
        系统默认渠道不支持编辑和删除。点击“编辑”按钮，可停用或启用渠道，停用后不能在列表选项看到。
      </div>

      <section className="custom-channel-section">
        <header className="custom-channel-title">
          <h2>系统默认渠道</h2>
          <button type="button" className="custom-channel-primary" onClick={() => setEditing((value) => !value)}>
            {editing ? '保 存' : '编 辑'}
          </button>
        </header>
        <div className="custom-channel-grid" aria-label="系统默认渠道">
          {systemChannels.map((name, index) => (
            <label key={name} className="custom-channel-card" style={{ '--channel-color': channelColors[index] } as CSSProperties}>
              {editing ? <input type="checkbox" defaultChecked aria-label={`${name}启用`} /> : null}
              <span>{name}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="custom-channel-section custom-channel-section--custom">
        <header className="custom-channel-title">
          <h2>自定义渠道</h2>
          <button type="button" className="custom-channel-secondary" onClick={() => setDialogOpen(true)}>
            添加渠道
          </button>
        </header>
        <div className="custom-channel-empty" aria-label="自定义渠道空态">
        </div>
      </section>

      {dialogOpen ? (
        <div className="custom-channel-modal-backdrop">
          <div className="custom-channel-modal" role="dialog" aria-modal="true" aria-label="添加渠道">
            <header>
              <h2>添加渠道</h2>
              <button type="button" aria-label="关闭" onClick={() => setDialogOpen(false)} />
            </header>
            <label>
              <span>渠道名称</span>
              <input aria-label="渠道名称" placeholder="请输入渠道名称" />
            </label>
            <label>
              <span>渠道颜色</span>
              <button type="button" className="custom-channel-color-picker" aria-label="渠道颜色">
                请选择渠道颜色
              </button>
            </label>
            <footer>
              <button type="button" onClick={() => setDialogOpen(false)}>
                取 消
              </button>
              <button type="button" className="custom-channel-primary" onClick={() => setDialogOpen(false)}>
                确 定
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
