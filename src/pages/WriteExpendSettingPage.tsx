import { useState } from 'react'
import './WriteExpendSettingPage.css'

type LedgerTab = 'income' | 'expense'

interface PaymentGroup {
  name: string
  items: string[]
}

const incomeGroups: PaymentGroup[] = [
  {
    name: '住宿',
    items: [
      '房费',
      '清洁费',
      '押金',
      '加床',
      '加人',
      '退订扣款',
      '损坏赔偿',
      '其他收入',
      '长租租金',
      '长租押金',
      '加时(延迟退房)',
      '餐饮',
      '旅游服务',
      '押金扣款',
      '钟点房',
      '开票金额',
      '长租宽带费',
      '长租公摊费',
      '长租卫生费',
      '长租物管费',
      '长租停车费',
      '长租钥匙费用',
      '长租水费',
      '长租电费',
      '长租逾期费',
      '长租账单',
      '押金逾期费',
    ],
  },
  { name: '餐饮', items: [] },
  { name: '商超', items: [] },
  { name: '娱乐', items: [] },
  { name: '场地', items: [] },
]

const expenseGroups: PaymentGroup[] = [
  {
    name: '住宿',
    items: ['退款', '采购', '维修费', '水费', '电费', '燃气费', '保洁费', '物业费', '宽带费', '其他支出'],
  },
  { name: '餐饮', items: [] },
  { name: '商超', items: [] },
  { name: '娱乐', items: [] },
  { name: '场地', items: [] },
]

export function WriteExpendSettingPage() {
  const [activeTab, setActiveTab] = useState<LedgerTab>('income')
  const [dialogGroup, setDialogGroup] = useState('餐饮')
  const [dialogOpen, setDialogOpen] = useState(false)

  const groups = activeTab === 'income' ? incomeGroups : expenseGroups
  const panelLabel = activeTab === 'income' ? '收入项设置' : '支出项设置'

  function openDialog(groupName = '餐饮') {
    setDialogGroup(groupName)
    setDialogOpen(true)
  }

  return (
    <div className="write-expend-page">
      <section className="write-expend-card" aria-label="记一笔设置">
        <div className="write-expend-toolbar">
          <p>系统默认项目不支持编辑和删除，可直接拖动调整排序。</p>
          <button type="button" className="write-expend-primary" onClick={() => openDialog()}>
            新 增
          </button>
        </div>

        <div className="write-expend-tabs" role="tablist" aria-label="记一笔项目类型">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'income'}
            className={activeTab === 'income' ? 'is-active' : ''}
            onClick={() => setActiveTab('income')}
          >
            收入项
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'expense'}
            className={activeTab === 'expense' ? 'is-active' : ''}
            onClick={() => setActiveTab('expense')}
          >
            支出项
          </button>
        </div>

        <section className="write-expend-groups" aria-label={panelLabel}>
          {groups.map((group) => (
            <PaymentGroupSection key={`${activeTab}-${group.name}`} group={group} onAdd={() => openDialog(group.name)} />
          ))}
          <div className="write-expend-divider" />
          <section className="write-expend-disabled" aria-label="已停用项">
            <h2>已停用项</h2>
            <div />
          </section>
        </section>
      </section>

      {dialogOpen ? <AddItemDialog groupName={dialogGroup} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}

function PaymentGroupSection({ group, onAdd }: { group: PaymentGroup; onAdd: () => void }) {
  return (
    <section className="write-expend-group">
      <h2>{group.name}</h2>
      <div className={group.items.length > 0 ? 'write-expend-item-grid' : 'write-expend-empty-box'}>
        {group.items.length > 0 ? (
          group.items.map((name) => <PaymentItemCard key={name} name={name} />)
        ) : (
          <p>
            暂无项目，
            <button type="button" onClick={onAdd}>
              点击新增
            </button>
          </p>
        )}
      </div>
    </section>
  )
}

function PaymentItemCard({ name }: { name: string }) {
  return (
    <article className="write-expend-item">
      <span className="write-expend-drag" aria-hidden="true">
        ⋮⋮
      </span>
      <span className="write-expend-item-name">{name}</span>
      <span className="write-expend-lock" aria-hidden="true" />
      <span className="write-expend-default-badge">默认</span>
    </article>
  )
}

function AddItemDialog({ groupName, onClose }: { groupName: string; onClose: () => void }) {
  return (
    <div className="write-expend-modal-backdrop">
      <section className="write-expend-modal" role="dialog" aria-modal="true" aria-label="新增">
        <header>
          <h2>新增</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>
        <form>
          <label className="write-expend-form-row">
            <span>选择业态</span>
            <button type="button" className="write-expend-select">
              {groupName}
              <i aria-hidden="true">⌄</i>
            </button>
          </label>
          <label className="write-expend-form-row">
            <span>
              <em>*</em>
              名称
            </span>
            <input type="text" placeholder="请输入名称" aria-label="名称" />
          </label>
        </form>
        <footer>
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="write-expend-primary" onClick={onClose}>
            完 成
          </button>
        </footer>
      </section>
    </div>
  )
}
