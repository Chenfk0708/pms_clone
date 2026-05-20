import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import {
  createDefaultMyBenefitQuery,
  createMyBenefitExpandTask,
  createMyBenefitExportTask,
  createMyBenefitRenewTask,
  fetchMyBenefitDashboard,
  type MyBenefitQuery,
  type MyBenefitRecord,
  type MyBenefitResource,
  type MyBenefitTab,
  type MyBenefitViewModel,
} from '../services/myBenefit'
import './MyBenefitPage.css'

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

type LoadState = 'loading' | 'success' | 'empty' | 'error'

export function MyBenefitPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<MyBenefitViewModel | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [notice, setNotice] = useState('')
  const [recordDetailId, setRecordDetailId] = useState<string | null>(null)
  const [resourceDetailId, setResourceDetailId] = useState<string | null>(null)
  const [refreshSeed, setRefreshSeed] = useState(0)

  const query = useMemo<MyBenefitQuery>(
    () =>
      createDefaultMyBenefitQuery({
        search: `?${searchParams.toString()}`,
      }),
    [searchParams],
  )
  const upgradeOpen = searchParams.get('upgrade') === '1'

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => setLoadState('loading'))

    fetchMyBenefitDashboard(query, controller.signal)
      .then((result) => {
        setView(result.view)
        setLoadState(result.view.state === 'empty' ? 'empty' : 'success')
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadState('error')
        setNotice(error instanceof Error ? error.message : '我的权益加载失败，请稍后重试')
      })

    return () => controller.abort()
  }, [query, refreshSeed])

  const activeTab = query.activeTab
  const selectedRecord = view?.records.find((record) => record.id === recordDetailId) ?? null
  const selectedResource = view?.resources.find((resource) => resource.id === resourceDetailId) ?? null

  function updateSearchParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams)
    mutate(next)
    setSearchParams(next)
  }

  function switchTab(nextTab: MyBenefitTab) {
    updateSearchParams((next) => {
      next.set('tab', nextTab)
      next.delete('upgrade')
    })
  }

  function setUpgradeState(nextOpen: boolean) {
    updateSearchParams((next) => {
      if (nextOpen) {
        next.set('upgrade', '1')
        next.set('tab', 'resources')
      } else {
        next.delete('upgrade')
      }
    })
  }

  function refreshDashboard() {
    setNotice('')
    updateSearchParams((next) => {
      next.delete('myBenefitMockState')
    })
    setLoadState('loading')
    setRefreshSeed((value) => value + 1)
    window.localStorage.removeItem('pms.myBenefitMockState')
    setNotice('权益数据已刷新')
  }

  function exportRecords() {
    const task = createMyBenefitExportTask(query)
    setNotice(`导出任务已创建：${task.taskId}`)
  }

  function renewBenefit() {
    const task = createMyBenefitRenewTask(query)
    setNotice(`续费任务已创建：${task.taskId}`)
  }

  function expandResource(resource: MyBenefitResource) {
    createMyBenefitExpandTask(query, resource)
    setResourceDetailId(resource.id)
    setNotice(`已生成 ${resource.name} 扩容咨询单`)
  }

  function retryFromError() {
    setNotice('')
    updateSearchParams((next) => {
      next.delete('myBenefitMockState')
    })
  }

  return (
    <div
      className="my-benefit-page"
      data-provider={view?.provider ?? query.provider ?? 'mock'}
      data-response-state={loadState}
      data-active-tab={activeTab}
      data-upgrade-open={upgradeOpen ? 'true' : 'false'}
    >
      <VersionSideNav />
      <main className="my-benefit-main">
        <section className="my-benefit-tabs" role="tablist" aria-label="我的权益视图">
          <button type="button" role="tab" aria-selected={activeTab === 'resources'} onClick={() => switchTab('resources')}>
            版本资源
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'services'} onClick={() => switchTab('services')}>
            功能服务
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'records'} onClick={() => switchTab('records')}>
            开通记录
          </button>
        </section>

        <section className="my-benefit-toolbar" aria-label="权益工具栏">
          <button type="button" onClick={refreshDashboard}>
            刷新权益
          </button>
          <button type="button" onClick={exportRecords}>
            导出记录
          </button>
          <button type="button" onClick={() => navigate('/version/applicationPayment')}>
            去应用订阅
          </button>
        </section>

        {notice ? (
          <div className="my-benefit-notice" role="status" aria-label="我的权益操作反馈">
            {notice}
          </div>
        ) : null}

        {loadState === 'loading' ? <LoadingState /> : null}

        {loadState === 'error' ? (
          <section className="my-benefit-error" role="alert" aria-label="我的权益数据错误">
            <strong>我的权益加载失败，请稍后重试</strong>
            <p>当前无法读取权益资源、功能服务与开通记录，请重试后继续。</p>
            <button type="button" onClick={retryFromError}>
              重试
            </button>
          </section>
        ) : null}

        {loadState !== 'error' && view ? (
          <>
            <section className="my-benefit-version" aria-label="当前版本">
              <div className="my-benefit-version__icon" aria-hidden="true" />
              <div>
                <p className="my-benefit-version__eyebrow">{view.versionBadge}</p>
                <h1>当前版本：{view.currentVersionName}</h1>
                <p>
                  有效期到：{view.expiresAtText}
                  <button type="button" onClick={() => switchTab('records')}>
                    开通记录
                  </button>
                </p>
              </div>
              <div className="my-benefit-version__actions">
                <button type="button" className="is-outline" onClick={renewBenefit}>
                  续 费
                </button>
                <button type="button" className="is-primary" onClick={() => setUpgradeState(true)}>
                  版本升级
                </button>
              </div>
            </section>

            <section className="my-benefit-overview" aria-label="权益快览">
              {view.overviewCards.map((card) => (
                <article key={card.id} className="my-benefit-overview__card">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.detail}</p>
                </article>
              ))}
            </section>

            {loadState === 'empty' ? (
              <section className="my-benefit-empty-state" aria-label="权益空态">
                <strong>当前权益资源为空</strong>
                <span>请确认门店订阅状态或切换到其他版本后再查看。</span>
              </section>
            ) : upgradeOpen ? (
              <UpgradePanel view={view} onClose={() => setUpgradeState(false)} onViewSubscription={() => navigate('/version/subscriptionCenter')} />
            ) : activeTab === 'resources' ? (
              <ResourceTable resources={view.resources} onExpand={expandResource} />
            ) : activeTab === 'services' ? (
              <ServicesPanel view={view} onNavigate={(path) => navigate(path)} />
            ) : (
              <RecordsPanel records={view.records} onOpenDetail={setRecordDetailId} />
            )}
          </>
        ) : null}
      </main>

      {selectedRecord ? <RecordDialog record={selectedRecord} onClose={() => setRecordDetailId(null)} /> : null}
      {selectedResource ? <ResourceDialog resource={selectedResource} onClose={() => setResourceDetailId(null)} /> : null}
    </div>
  )
}

function VersionSideNav() {
  return (
    <aside className="my-benefit-sidebar" aria-label="权益与订阅侧栏">
      <div className="my-benefit-sidebar__root">订阅中心</div>
      <nav>
        {sideLinks.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `my-benefit-side-link${isActive ? ' is-active' : ''}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <span className="my-benefit-build">版本号：v4.10.7</span>
    </aside>
  )
}

function LoadingState() {
  return (
    <section className="my-benefit-loading" aria-label="权益加载中">
      <span className="my-benefit-loading__dot" aria-hidden="true" />
      <strong>正在刷新权益数据</strong>
      <p>正在同步当前版本、资源明细与开通记录。</p>
    </section>
  )
}

function ResourceTable({
  resources,
  onExpand,
}: {
  resources: MyBenefitResource[]
  onExpand: (resource: MyBenefitResource) => void
}) {
  return (
    <table className="my-benefit-table" aria-label="版本资源表">
      <thead>
        <tr>
          {['资源名称', '可用数量', '已经用数量', '资源来源', '状态', '有效期', '操作'].map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {resources.map((resource) => (
          <tr key={resource.id}>
            <td>{resource.name}</td>
            <td>{resource.totalText}</td>
            <td>{resource.usedText}</td>
            <td>{resource.sourceText}</td>
            <td>
              <span className="my-benefit-status">{resource.statusText}</span>
            </td>
            <td>{resource.expiresText}</td>
            <td>
              {resource.actionLabel ? (
                <button type="button" aria-label={`${resource.actionLabel} ${resource.name}`} onClick={() => onExpand(resource)}>
                  {resource.actionLabel}
                </button>
              ) : (
                '-'
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ServicesPanel({
  view,
  onNavigate,
}: {
  view: MyBenefitViewModel
  onNavigate: (path: string) => void
}) {
  return (
    <section className="my-benefit-services" aria-label="功能服务分组">
      {view.serviceGroups.map((group) => (
        <article key={group.id} className="my-benefit-service-group">
          <header>
            <h2>{group.title}</h2>
            <span>{group.items.length} 项承接入口</span>
          </header>
          <div className="my-benefit-service-grid">
            {group.items.map((item) => (
              <section key={item.id} className="my-benefit-service-card">
                <div>
                  <strong>{item.label}</strong>
                  {item.badge ? <em>{item.badge}</em> : null}
                </div>
                <p>{item.description}</p>
                <button type="button" aria-label={`打开 ${item.label}`} onClick={() => onNavigate(item.path)}>
                  打开
                </button>
              </section>
            ))}
          </div>
        </article>
      ))}
    </section>
  )
}

function RecordsPanel({
  records,
  onOpenDetail,
}: {
  records: MyBenefitRecord[]
  onOpenDetail: (recordId: string) => void
}) {
  return (
    <section className="my-benefit-records" aria-label="开通记录列表">
      {records.map((record) => (
        <article key={record.id} className="my-benefit-record">
          <div>
            <strong>{record.title}</strong>
            <span>{record.typeLabel}</span>
          </div>
          <p>{record.description}</p>
          <dl>
            <div>
              <dt>来源</dt>
              <dd>{record.sourceLabel}</dd>
            </div>
            <div>
              <dt>有效期</dt>
              <dd>{record.effectiveRange}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{record.statusLabel}</dd>
            </div>
          </dl>
          <button type="button" aria-label={`查看详情 ${record.title}`} onClick={() => onOpenDetail(record.id)}>
            查看详情
          </button>
        </article>
      ))}
    </section>
  )
}

function UpgradePanel({
  view,
  onClose,
  onViewSubscription,
}: {
  view: MyBenefitViewModel
  onClose: () => void
  onViewSubscription: () => void
}) {
  return (
    <section className="my-benefit-upgrade" aria-label="版本升级面板">
      <header className="my-benefit-upgrade__header">
        <div>
          <h1>当前版本：{view.currentVersionName}</h1>
          <p>有效期到：{view.expiresAtText}</p>
        </div>
        <div className="my-benefit-upgrade__actions">
          <button type="button" onClick={onViewSubscription}>
            查看版本订阅
          </button>
          <button type="button" className="is-outline" onClick={onClose}>
            返回资源
          </button>
        </div>
      </header>

      <section className="my-benefit-plan-row" aria-label="版本套餐">
        {view.plans.map((plan) => (
          <article key={plan.id} className={`my-benefit-plan my-benefit-plan--${plan.tone}${plan.active ? ' is-active' : ''}`} aria-label={plan.name}>
            {plan.tag ? <span>{plan.tag}</span> : null}
            <strong>{plan.name}</strong>
            <em>{plan.price}</em>
            {plan.oldPrice ? <del>原价:{plan.oldPrice}</del> : null}
          </article>
        ))}
      </section>

      <section className="my-benefit-feature-board" aria-label="版本订阅功能明细">
        <aside className="my-benefit-subscription-list">
          <h2>版本订阅</h2>
          <p>库存(10个)</p>
          <p>成员账号(3个)</p>
          <p>门店(1个)</p>
        </aside>

        <div className="my-benefit-feature-grid">
          <h2>功能订阅</h2>
          {view.serviceGroups.map((group) => (
            <section key={group.id} aria-label={group.title}>
              <h3>{group.title}</h3>
              {group.items.map((item) => (
                <p key={item.id}>{item.label}</p>
              ))}
            </section>
          ))}
        </div>

        <aside className="my-benefit-service-list">
          <h2>服务特权</h2>
          <p>专业培训</p>
          <p>金牌进群服务</p>
          <p>7x12小时在线客服</p>
        </aside>
      </section>
    </section>
  )
}

function RecordDialog({ record, onClose }: { record: MyBenefitRecord; onClose: () => void }) {
  return (
    <div className="my-benefit-modal" role="presentation">
      <div className="my-benefit-dialog" role="dialog" aria-modal="true" aria-label="记录详情">
        <button type="button" className="my-benefit-dialog__close" aria-label="关闭记录详情" onClick={onClose}>
          ×
        </button>
        <h2>{record.title}</h2>
        <p>{record.description}</p>
        <dl className="my-benefit-dialog__meta">
          <div>
            <dt>订单号</dt>
            <dd>{record.orderNo}</dd>
          </div>
          <div>
            <dt>来源</dt>
            <dd>{record.sourceLabel}</dd>
          </div>
          <div>
            <dt>权益范围</dt>
            <dd>{record.relatedResources.join('、')}</dd>
          </div>
          <div>
            <dt>有效期</dt>
            <dd>{record.effectiveRange}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function ResourceDialog({ resource, onClose }: { resource: MyBenefitResource; onClose: () => void }) {
  return (
    <div className="my-benefit-modal" role="presentation">
      <div className="my-benefit-dialog" role="dialog" aria-modal="true" aria-label={`${resource.name} 资源详情`}>
        <button type="button" className="my-benefit-dialog__close" aria-label="关闭资源详情" onClick={onClose}>
          ×
        </button>
        <h2>{resource.name}</h2>
        <p>当前资源支持继续扩容，后续可直接承接到应用订阅或人工咨询流程。</p>
        <ul className="my-benefit-dialog__list">
          {resource.detailLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
