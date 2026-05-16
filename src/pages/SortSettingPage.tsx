import { useState } from 'react'
import './SortSettingPage.css'

type SortTab = 'store' | 'room' | 'goods'

interface SortTabOption {
  key: SortTab
  label: string
  ariaLabel: string
  items: string[]
}

const sortTabs: SortTabOption[] = [
  {
    key: 'store',
    label: '门店排序',
    ariaLabel: '门店排序列表',
    items: ['天落会宿公寓(前海壹方城宝安中心店)'],
  },
  {
    key: 'room',
    label: '房型排序',
    ariaLabel: '房型排序列表',
    items: ['顶层套房（浴缸巨幕电竞麻将）', '总裁套间（桑拿浴缸露台电竞麻将）', '天落大床电竞套间', '观影大床房'],
  },
  {
    key: 'goods',
    label: '商品排序',
    ariaLabel: '商品排序列表',
    items: [
      '桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾',
      '巨幕电竞麻将双床套房',
      '观影大床房限时特惠',
      '天落大床电竞套间套餐',
    ],
  },
]

export function SortSettingPage() {
  const [activeTab, setActiveTab] = useState<SortTab>('store')
  const [saved, setSaved] = useState(false)
  const active = sortTabs.find((tab) => tab.key === activeTab) ?? sortTabs[0]

  return (
    <section className="sort-setting-page" aria-label="排序设置">
      <div className="sort-setting-toolbar">
        <div className="sort-setting-tabs" role="tablist" aria-label="排序方式">
          {sortTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={activeTab === tab.key ? 'is-active' : ''}
              onClick={() => {
                setActiveTab(tab.key)
                setSaved(false)
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="sort-setting-info" aria-hidden="true">
          i
        </span>
      </div>

      <p className="sort-setting-tip">拖拽即可进行排序，选定排序方式之后，系统将按照下方顺序展示</p>

      <div className="sort-setting-list" aria-label={active.ariaLabel}>
        {active.items.map((item) => (
          <article className="sort-setting-item" key={item}>
            <span className="sort-setting-drag-handle" aria-hidden="true">
              ⋮⋮
            </span>
            <span>{item}</span>
          </article>
        ))}
      </div>

      <button type="button" className="sort-setting-save" onClick={() => setSaved(true)}>
        保存排序
      </button>
      {saved ? <div className="sort-setting-toast">排序已保存</div> : null}
    </section>
  )
}
