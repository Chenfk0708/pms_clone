import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchCustomerDetail, type CustomerDetailData, type CustomerDetailTab } from '../services/customerDetail'
import './CustomerDetailPage.css'

const tabs: Array<{ key: CustomerDetailTab; label: string }> = [
  { key: 'profile', label: '客户概况' },
  { key: 'member', label: '会员信息' },
  { key: 'orders', label: '交易订单' },
  { key: 'coupons', label: '优惠券明细' },
]

export function CustomerDetailPage() {
  const [searchParams] = useSearchParams()
  const [detail, setDetail] = useState<CustomerDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<CustomerDetailTab>('profile')
  const [followDialogOpen, setFollowDialogOpen] = useState(false)
  const [followContent, setFollowContent] = useState('')
  const customerId = searchParams.get('id') ?? ''

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError('')
      try {
        const nextDetail = await fetchCustomerDetail(customerId, controller.signal)
        setDetail(nextDetail)
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : '客户详情加载失败')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [customerId])

  const tabContent = useMemo(() => {
    if (activeTab === 'profile') {
      return <ProfileTab detail={detail} onOpenFollowDialog={() => setFollowDialogOpen(true)} />
    }

    const currentLabel = tabs.find((item) => item.key === activeTab)?.label ?? '详情'
    return (
      <section className="customer-detail-placeholder" aria-label={`${currentLabel}内容`}>
        <strong>{currentLabel}</strong>
        <p>该页签内容先按目标站布局预留，后续按同样风格继续补齐。</p>
      </section>
    )
  }, [activeTab, detail])

  return (
    <div className="customer-detail-page">
      <div className="customer-detail-breadcrumb">
        <Link to="/customer/list">客户列表</Link>
        <span>/</span>
        <strong>客户详情</strong>
      </div>

      <section className="customer-detail-shell">
        <pre
          hidden
          data-testid="customer-detail-contract"
          data-provider={detail?.provider ?? 'mock'}
          data-endpoint={detail?.endpoint ?? 'static-customer-detail'}
        >
          {detail ? JSON.stringify(detail.requestBody) : '{}'}
        </pre>
        <nav className="customer-detail-tabs" aria-label="客户详情标签">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" className={activeTab === tab.key ? 'is-active' : ''} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </nav>

        {loading ? (
          <section className="customer-detail-state" aria-label="客户详情加载状态">
            <strong>正在加载客户详情</strong>
          </section>
        ) : null}

        {error ? (
          <section className="customer-detail-state customer-detail-state--error" role="alert" aria-label="客户详情错误">
            <strong>客户详情加载失败</strong>
            <p>{error}</p>
          </section>
        ) : null}

        {!loading && !error ? tabContent : null}
      </section>

      {followDialogOpen ? (
        <div className="customer-detail-modal-backdrop">
          <section className="customer-detail-modal" role="dialog" aria-modal="true" aria-label="添加跟进">
            <header>
              <strong>添加跟进</strong>
              <button type="button" aria-label="×" onClick={() => setFollowDialogOpen(false)}>
                ×
              </button>
            </header>
            <div className="customer-detail-modal__body">
              <label className="customer-detail-modal-field">
                <span>
                  <b aria-hidden="true">*</b>
                  跟进记录
                </span>
                <textarea placeholder="请输入跟进记录" value={followContent} onChange={(event) => setFollowContent(event.target.value)} />
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setFollowDialogOpen(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={() => setFollowDialogOpen(false)}>
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function ProfileTab({ detail, onOpenFollowDialog }: { detail: CustomerDetailData | null; onOpenFollowDialog: () => void }) {
  if (!detail) return null

  return (
    <div className="customer-detail-overview">
      <section className="customer-detail-summary" aria-label="客户摘要">
        <div className="customer-detail-summary__main">
          <div className="customer-detail-avatar" aria-hidden="true">
            {detail.avatarText}
          </div>
          <div className="customer-detail-identity">
            <div className="customer-detail-name-row">
              <strong>{detail.name}</strong>
              <span>{detail.mobile}</span>
            </div>
            <div className="customer-detail-badges">
              <span>客户</span>
              <span>会员：{detail.memberLevel}</span>
            </div>
            <div className="customer-detail-meta">
              <span>客户编号：{detail.customerNo}</span>
              <span>成为客户时间：{detail.becomeCustomerTime}</span>
              <span>客户状态：{detail.customerStatus}</span>
              <span>关注公众号时间：{detail.followPublicAccountTime}</span>
            </div>
            <div className="customer-detail-meta">
              <span>客户渠道：{detail.channelText}</span>
            </div>
            <div className="customer-detail-tags">
              <span>客户标签：</span>
              {detail.tags.length ? detail.tags.map((tag) => <em key={tag}>{tag}</em>) : <i>-</i>}
            </div>
          </div>
        </div>
        <div className="customer-detail-actions">
          <button type="button">送优惠券</button>
          <button type="button">修改会员等级</button>
          <button type="button">修改标签</button>
        </div>
      </section>

      <section className="customer-detail-block" aria-label="基础信息">
        <header>
          <strong>基础信息</strong>
          <button type="button" className="is-primary" onClick={onOpenFollowDialog}>
            编辑
          </button>
        </header>
        <div className="customer-detail-basic-grid">
          {detail.basicInfo.map((item) => (
            <div key={item.label} className="customer-detail-basic-item">
              <span>{item.label}：</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="customer-detail-block" aria-label="跟进记录">
        <header>
          <strong>跟进记录</strong>
          <button type="button" className="customer-detail-link-button" onClick={onOpenFollowDialog}>
            添加跟进
          </button>
        </header>
        <div className="customer-detail-follow-table">
          <div className="customer-detail-follow-head">
            <span>跟进人</span>
            <span>跟进时间</span>
            <span>跟进记录</span>
          </div>
          {detail.followRecords.length ? (
            detail.followRecords.map((record) => (
              <div key={record.id} className="customer-detail-follow-row">
                <span>{record.owner}</span>
                <span>{record.time}</span>
                <span>{record.content}</span>
              </div>
            ))
          ) : (
            <div className="customer-detail-follow-empty">暂无数据</div>
          )}
        </div>
      </section>

      <section className="customer-detail-block" aria-label="资产信息">
        <header>
          <strong>资产信息</strong>
        </header>
        <div className="customer-detail-assets">
          {detail.assetCards.map((card) => (
            <article key={card.title} className="customer-detail-asset-card">
              <strong>{card.title}</strong>
              {card.lines.length ? (
                <div className="customer-detail-asset-lines">
                  {card.lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              ) : (
                <div className="customer-detail-asset-placeholder">{card.placeholder}</div>
              )}
              {card.action ? <button type="button">{card.action}</button> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="customer-detail-block" aria-label="交易信息">
        <header>
          <strong>交易信息</strong>
        </header>
        <div className="customer-detail-trade-grid">
          {detail.tradeInfo.map((item) => (
            <div key={item.label} className="customer-detail-trade-item">
              <span>{item.label}：</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
