import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  createPaymentMethod,
  createPaymentSettingExportTask,
  loadPaymentMethodDetail,
  loadPaymentSettingPage,
  movePaymentMethod,
  setDefaultPaymentMethod,
  updatePaymentMethodStatus,
  type PaymentMethodDetailData,
  type PaymentMethodStatus,
  type PaymentSettingMutationData,
  type PaymentSettingPageData,
} from '../services/paymentSetting'
import './PaymentSettingPage.css'

type AddDialogState = {
  name: string
  status: PaymentMethodStatus
  error: string
  isSubmitting: boolean
} | null

type DetailDialogState = {
  methodId: string
  detail: PaymentMethodDetailData | null
  error: string
  isLoading: boolean
  isMutating: boolean
} | null

export function PaymentSettingPage() {
  const [pageData, setPageData] = useState<PaymentSettingPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('支付方式设置加载中')
  const [addDialog, setAddDialog] = useState<AddDialogState>(null)
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [lastMutation, setLastMutation] = useState<PaymentSettingMutationData | null>(null)
  const nextSuccessFeedback = useRef('支付方式设置已更新')

  useEffect(() => {
    const controller = new AbortController()

    loadPaymentSettingPage({}, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setPageData(data)
        setFeedback(nextSuccessFeedback.current || '支付方式设置已更新')
        nextSuccessFeedback.current = '支付方式设置已更新'
      })
      .catch((loadError: Error) => {
        if (controller.signal.aborted) return
        setError(loadError.message || '支付方式设置加载失败，请稍后重试')
        setFeedback('支付方式设置加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [reloadToken])

  const contractLines = [
    ...(pageData?.requestSummary ?? []),
    ...(detailDialog?.detail?.requestSummary ?? []),
    ...(lastMutation?.requestSummary ?? []),
  ]

  function triggerReload(message: string) {
    setIsLoading(true)
    setError('')
    nextSuccessFeedback.current = message
    setReloadToken((value) => value + 1)
  }

  function openAddDialog() {
    setAddDialog({
      name: '',
      status: 'enabled',
      error: '',
      isSubmitting: false,
    })
  }

  async function openDetail(methodId: string) {
    setDetailDialog({
      methodId,
      detail: null,
      error: '',
      isLoading: true,
      isMutating: false,
    })

    try {
      const detail = await loadPaymentMethodDetail(methodId)
      setDetailDialog({
        methodId,
        detail,
        error: '',
        isLoading: false,
        isMutating: false,
      })
    } catch (detailError) {
      setDetailDialog({
        methodId,
        detail: null,
        error: detailError instanceof Error ? detailError.message : '支付方式详情加载失败，请稍后重试',
        isLoading: false,
        isMutating: false,
      })
    }
  }

  async function handleCreate() {
    if (!addDialog) return

    const name = addDialog.name.trim()
    if (!name) {
      setAddDialog({ ...addDialog, error: '请输入支付方式名称' })
      return
    }

    setAddDialog({ ...addDialog, error: '', isSubmitting: true })

    try {
      const result = await createPaymentMethod({
        name,
        status: addDialog.status,
      })
      setLastMutation(result)
      setAddDialog(null)
      triggerReload(result.message)
    } catch (mutationError) {
      setAddDialog({
        ...addDialog,
        error: mutationError instanceof Error ? mutationError.message : '新增支付方式失败，请稍后重试',
        isSubmitting: false,
      })
    }
  }

  async function handleDetailMutation(
    runner: () => Promise<PaymentSettingMutationData>,
    closeAfterSuccess = false,
  ) {
    if (!detailDialog) return

    setDetailDialog({ ...detailDialog, isMutating: true })
    try {
      const result = await runner()
      setLastMutation(result)
      if (closeAfterSuccess) {
        setDetailDialog(null)
      } else {
        setDetailDialog({ ...detailDialog, isMutating: false })
      }
      triggerReload(result.message)
    } catch (mutationError) {
      setDetailDialog({
        ...detailDialog,
        error: mutationError instanceof Error ? mutationError.message : '支付方式操作失败，请稍后重试',
        isMutating: false,
      })
    }
  }

  async function handleExport() {
    try {
      const result = await createPaymentSettingExportTask()
      setLastMutation(result)
      setFeedback(result.message)
    } catch (mutationError) {
      setFeedback(mutationError instanceof Error ? mutationError.message : '导出任务创建失败，请稍后重试')
    }
  }

  async function handleQuickEnable(methodId: string) {
    try {
      const result = await updatePaymentMethodStatus({ methodId, nextStatus: 'enabled' })
      setLastMutation(result)
      triggerReload(result.message)
    } catch (mutationError) {
      setFeedback(mutationError instanceof Error ? mutationError.message : '支付方式启用失败，请稍后重试')
    }
  }

  return (
    <div className="payment-setting-page">
      <section className="payment-setting-panel" aria-label="支付方式设置">
        <div className="payment-setting-toolbar">
          <div>
            <div className="payment-setting-panel-title">支付方式设置</div>
            <p>{pageData ? `${pageData.campName} · 最近更新时间 ${pageData.updatedAt}` : '支付方式配置按显式数据服务加载。'}</p>
          </div>
          <div className="payment-setting-toolbar__actions">
            <button type="button" className="payment-setting-secondary" onClick={() => triggerReload('支付方式设置已更新')}>
              刷新列表
            </button>
            <button type="button" className="payment-setting-secondary" onClick={handleExport}>
              导出设置
            </button>
            <button type="button" className="payment-setting-primary" onClick={openAddDialog}>
              新增支付方式
            </button>
          </div>
        </div>

        <div className="payment-setting-feedback" role="status" aria-label="支付方式设置操作反馈">
          {feedback}
        </div>

        <div className="payment-setting-notice" role="note">
          <span aria-hidden="true">!</span>
          {pageData?.notice ?? '系统默认支付方式不支持编辑和删除，可直接拖动调整排序。'}
        </div>

        {isLoading ? <LoadingState /> : null}

        {!isLoading && error ? (
          <section className="payment-setting-alert" role="alert">
            <strong>支付方式设置加载失败，请稍后重试</strong>
            <p>{error}</p>
            <button type="button" className="payment-setting-primary" onClick={() => triggerReload('支付方式设置已更新')}>
              重新加载支付方式设置
            </button>
          </section>
        ) : null}

        {!isLoading && !error && pageData ? (
          <>
            <div className="payment-setting-heading-row">
              <SectionHeading>已启用支付方式</SectionHeading>
              <span className="payment-setting-counter">{pageData.enabledMethods.length} 项</span>
            </div>
            <div className="payment-setting-grid" aria-label="已启用支付方式列表">
              {pageData.enabledMethods.length ? (
                pageData.enabledMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    detailButtonLabel={`查看 ${method.name} 详情`}
                    onDetail={() => openDetail(method.id)}
                  />
                ))
              ) : (
                <EmptySection message="当前没有已启用支付方式" />
              )}
            </div>

            <div className="payment-setting-divider" />

            <div className="payment-setting-heading-row">
              <SectionHeading>已停用支付方式</SectionHeading>
              <span className="payment-setting-counter">{pageData.disabledMethods.length} 项</span>
            </div>
            <div className="payment-setting-disabled" aria-label="已停用支付方式列表">
              {pageData.disabledMethods.length ? (
                pageData.disabledMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    detailButtonLabel={`查看 ${method.name} 详情`}
                    onDetail={() => openDetail(method.id)}
                    quickAction={
                      <button
                        type="button"
                        className="payment-setting-inline-action"
                        onClick={() => handleQuickEnable(method.id)}
                      >
                        启用 {method.name}
                      </button>
                    }
                  />
                ))
              ) : (
                <EmptySection message="当前没有已停用支付方式" />
              )}
            </div>
          </>
        ) : null}

        <pre className="payment-setting-contract" data-testid="payment-setting-service-contract" aria-hidden="true">
          {contractLines.join('\n')}
        </pre>
      </section>

      {addDialog ? (
        <div className="payment-setting-modal-backdrop">
          <section className="payment-setting-modal" role="dialog" aria-modal="true" aria-label="新增支付方式">
            <header>
              <h2>新增支付方式</h2>
              <button type="button" aria-label="关闭新增支付方式" onClick={() => setAddDialog(null)}>
                ×
              </button>
            </header>
            <div className="payment-setting-form">
              <label className="payment-setting-form-row">
                <span>支付方式名称</span>
                <input
                  type="text"
                  aria-label="支付方式名称"
                  value={addDialog.name}
                  onChange={(event) => setAddDialog({ ...addDialog, name: event.target.value, error: '' })}
                  placeholder="请输入支付方式名称"
                />
              </label>
              <div className="payment-setting-form-row payment-setting-form-row--column">
                <span>初始状态</span>
                <div className="payment-setting-toggle-group">
                  <button
                    type="button"
                    className={addDialog.status === 'enabled' ? 'is-selected' : ''}
                    onClick={() => setAddDialog({ ...addDialog, status: 'enabled' })}
                  >
                    启用
                  </button>
                  <button
                    type="button"
                    className={addDialog.status === 'disabled' ? 'is-selected' : ''}
                    onClick={() => setAddDialog({ ...addDialog, status: 'disabled' })}
                  >
                    停用
                  </button>
                </div>
              </div>
              {addDialog.error ? <p className="payment-setting-form-error">{addDialog.error}</p> : null}
            </div>
            <footer>
              <button type="button" onClick={() => setAddDialog(null)}>
                取消
              </button>
              <button
                type="button"
                className="payment-setting-primary"
                onClick={handleCreate}
                disabled={addDialog.isSubmitting}
              >
                保存支付方式
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {detailDialog ? (
        <div className="payment-setting-modal-backdrop">
          <section className="payment-setting-modal payment-setting-modal--detail" role="dialog" aria-modal="true" aria-label="支付方式详情">
            <header>
              <h2>{detailDialog.detail?.detail.name ?? '支付方式详情'}</h2>
              <button type="button" aria-label="关闭详情" onClick={() => setDetailDialog(null)}>
                ×
              </button>
            </header>

            {detailDialog.isLoading ? <LoadingState compact /> : null}

            {!detailDialog.isLoading && detailDialog.error ? <p className="payment-setting-form-error">{detailDialog.error}</p> : null}

            {!detailDialog.isLoading && detailDialog.detail ? (
              <div className="payment-setting-detail">
                <div className="payment-setting-detail__meta">
                  <span>{detailDialog.detail.detail.isSystemDefault ? '系统默认支付方式' : '自定义支付方式'}</span>
                  <span>{detailDialog.detail.detail.isPreferred ? '当前默认支付方式' : '可设为默认支付方式'}</span>
                </div>
                <dl className="payment-setting-detail__grid">
                  <div>
                    <dt>方式编码</dt>
                    <dd>{detailDialog.detail.detail.code}</dd>
                  </div>
                  <div>
                    <dt>结算账户</dt>
                    <dd>{detailDialog.detail.detail.settlementAccount}</dd>
                  </div>
                  <div>
                    <dt>适用场景</dt>
                    <dd>{detailDialog.detail.detail.availableScopes.join('、')}</dd>
                  </div>
                  <div>
                    <dt>最近使用</dt>
                    <dd>{detailDialog.detail.detail.lastUsedAt}</dd>
                  </div>
                  <div className="payment-setting-detail__full">
                    <dt>说明</dt>
                    <dd>{detailDialog.detail.detail.description}</dd>
                  </div>
                  <div className="payment-setting-detail__full">
                    <dt>备注</dt>
                    <dd>{detailDialog.detail.detail.remark}</dd>
                  </div>
                </dl>
                <p className="payment-setting-detail__usage">{detailDialog.detail.detail.usageCountLabel}</p>
                <div className="payment-setting-detail__actions">
                  <button
                    type="button"
                    className="payment-setting-secondary"
                    onClick={() =>
                      handleDetailMutation(() => movePaymentMethod({ methodId: detailDialog.methodId, direction: 'up' }))
                    }
                    disabled={detailDialog.isMutating}
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    className="payment-setting-secondary"
                    onClick={() =>
                      handleDetailMutation(() => movePaymentMethod({ methodId: detailDialog.methodId, direction: 'down' }))
                    }
                    disabled={detailDialog.isMutating}
                  >
                    下移
                  </button>
                  <button
                    type="button"
                    className="payment-setting-secondary"
                    onClick={() => handleDetailMutation(() => setDefaultPaymentMethod({ methodId: detailDialog.methodId }))}
                    disabled={detailDialog.isMutating || detailDialog.detail.detail.isPreferred}
                  >
                    设为默认支付方式
                  </button>
                  <button
                    type="button"
                    className="payment-setting-primary"
                    onClick={() =>
                      handleDetailMutation(
                        () =>
                          updatePaymentMethodStatus({
                            methodId: detailDialog.methodId,
                            nextStatus: detailDialog.detail?.detail.status === 'enabled' ? 'disabled' : 'enabled',
                          }),
                        true,
                      )
                    }
                    disabled={detailDialog.isMutating}
                  >
                    {detailDialog.detail.detail.status === 'enabled' ? '停用支付方式' : '启用支付方式'}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="payment-setting-title">
      <span aria-hidden="true" />
      {children}
    </h2>
  )
}

function PaymentMethodCard({
  method,
  detailButtonLabel,
  onDetail,
  quickAction,
}: {
  method: PaymentSettingPageData['enabledMethods'][number]
  detailButtonLabel: string
  onDetail: () => void
  quickAction?: ReactNode
}) {
  return (
    <article className={`payment-method-card payment-method-card--${method.status}`}>
      <div className="payment-method-card__top">
        <div>
          <strong>{method.name}</strong>
          <p>{method.description}</p>
        </div>
        <div className="payment-method-card__badges">
          {method.isSystemDefault ? <span className="payment-method-card__badge">系统默认</span> : null}
          {method.isPreferred ? <span className="payment-method-card__badge payment-method-card__badge--solid">默认支付</span> : null}
        </div>
      </div>
      <div className="payment-method-card__meta">
        <span>{method.availableScopes.join('、')}</span>
        <span>{method.updatedAt}</span>
      </div>
      <div className="payment-method-card__actions">
        <button type="button" className="payment-setting-inline-action" onClick={onDetail}>
          {detailButtonLabel}
        </button>
        {quickAction}
      </div>
    </article>
  )
}

function LoadingState({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`payment-setting-loading${compact ? ' payment-setting-loading--compact' : ''}`}>
      <span className="payment-setting-loading__dot" aria-hidden="true" />
      <p>支付方式设置加载中...</p>
    </div>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="payment-setting-empty">
      <strong>{message}</strong>
      <p>你可以新增支付方式，或者切换 mock/provider 状态继续验证页面反馈。</p>
    </div>
  )
}
