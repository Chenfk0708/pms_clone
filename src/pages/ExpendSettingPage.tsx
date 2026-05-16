import { useState } from 'react'
import './ExpendSettingPage.css'

type ExpendTab = 'income' | 'expense'

interface CategoryGroup {
  name: string
  items: string[]
}

const incomeGroups: CategoryGroup[] = [
  {
    name: '住宿',
    items: ['加床', '加人', '损坏赔偿', '其他收入', '加时(延迟退房)', '餐饮', '旅游服务'],
  },
  { name: '餐饮', items: [] },
  { name: '商超', items: [] },
  { name: '娱乐', items: [] },
  { name: '场地', items: [] },
]

const expenseGroups: CategoryGroup[] = [
  {
    name: '住宿',
    items: ['其他支出', '退房费', '其他佣金支出'],
  },
  { name: '餐饮', items: [] },
  { name: '商超', items: [] },
  { name: '娱乐', items: [] },
  { name: '场地', items: [] },
]

export function ExpendSettingPage() {
  const [activeTab, setActiveTab] = useState<ExpendTab>('income')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogGroup, setDialogGroup] = useState('餐饮')

  const groups = activeTab === 'income' ? incomeGroups : expenseGroups
  const panelLabel = activeTab === 'income' ? '收入项目列表' : '支出项目列表'

  function openDialog(groupName = '餐饮') {
    setDialogGroup(groupName)
    setDialogOpen(true)
  }

  return (
    <div className="expend-setting-page">
      <section className="expend-setting-card" aria-label="收入支出设置">
        <div className="expend-setting-toolbar">
          <p>系统默认项目不支持编辑和删除，可直接拖动调整排序。</p>
          <button type="button" className="expend-setting-primary" onClick={() => openDialog()}>
            新 增
          </button>
        </div>

        <div className="expend-setting-tabs" role="tablist" aria-label="收入支出项目类型">
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

        <section className="expend-setting-groups" aria-label={panelLabel}>
          {groups.map((group) => (
            <CategoryGroupSection key={`${activeTab}-${group.name}`} group={group} onAdd={() => openDialog(group.name)} />
          ))}
          <div className="expend-setting-divider" />
          <section className="expend-setting-disabled" aria-label="已停用项">
            <h2>已停用项</h2>
            <div />
          </section>
        </section>
      </section>

      {dialogOpen ? <AddCategoryDialog groupName={dialogGroup} onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}

function CategoryGroupSection({ group, onAdd }: { group: CategoryGroup; onAdd: () => void }) {
  return (
    <section className="expend-setting-group">
      <h2>{group.name}</h2>
      <div className={group.items.length > 0 ? 'expend-setting-item-grid' : 'expend-setting-empty-box'}>
        {group.items.length > 0 ? (
          group.items.map((name) => <CategoryCard key={name} name={name} />)
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

function CategoryCard({ name }: { name: string }) {
  return (
    <article className="expend-setting-item">
      <span className="expend-setting-drag" aria-hidden="true">
        ⋮⋮
      </span>
      <span className="expend-setting-item-name">{name}</span>
      <span className="expend-setting-lock" aria-hidden="true" />
      <span className="expend-setting-default-badge">默认</span>
    </article>
  )
}

function AddCategoryDialog({ groupName, onClose }: { groupName: string; onClose: () => void }) {
  return (
    <div className="expend-setting-modal-backdrop">
      <section className="expend-setting-modal" role="dialog" aria-modal="true" aria-label="新增">
        <header>
          <h2>新增</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            x
          </button>
        </header>
        <form>
          <label className="expend-setting-form-row">
            <span>选择业态</span>
            <button type="button" className="expend-setting-select">
              {groupName}
              <i aria-hidden="true">⌄</i>
            </button>
          </label>
          <label className="expend-setting-form-row">
            <span>
              <em>*</em>
              名称
            </span>
            <input type="text" aria-label="名称" />
          </label>
        </form>
        <footer>
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="expend-setting-primary" onClick={onClose}>
            完 成
          </button>
        </footer>
      </section>
    </div>
  )
}
