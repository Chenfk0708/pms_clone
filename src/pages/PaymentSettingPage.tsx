import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  createPaymentMethod,
  loadPaymentSettingPage,
  movePaymentMethod,
  updatePaymentMethodStatus,
  type PaymentSettingMutationData,
  type PaymentSettingPageData,
} from '../services/paymentSetting'
import './PaymentSettingPage.css'

type InlineAddState = {
  name: string
  error: string
  isSubmitting: boolean
} | null

export function PaymentSettingPage() {
  const [pageData, setPageData] = useState<PaymentSettingPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('支付方式设置加载中')
  const [inlineAdd, setInlineAdd] = useState<InlineAddState>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [lastMutation, setLastMutation] = useState<PaymentSettingMutationData | null>(null)
  const [hoveredEnabledMethodId, setHoveredEnabledMethodId] = useState<string | null>(null)
  const [draggingMethodId, setDraggingMethodId] = useState<string | null>(null)
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
    ...(lastMutation?.requestSummary ?? []),
  ]

  function triggerReload(message: string) {
    setIsLoading(true)
    setError('')
    nextSuccessFeedback.current = message
    setReloadToken((value) => value + 1)
  }

  function openInlineAdd() {
    setInlineAdd({
      name: '',
      error: '',
      isSubmitting: false,
    })
  }

  async function handleCreate() {
    if (!inlineAdd) return

    const name = inlineAdd.name.trim()
    if (!name) {
      setInlineAdd({ ...inlineAdd, error: '请输入支付方式名称' })
      return
    }

    setInlineAdd({ ...inlineAdd, error: '', isSubmitting: true })

    try {
      const result = await createPaymentMethod({
        name,
        status: 'enabled',
      })
      setLastMutation(result)
      setInlineAdd(null)
      triggerReload(result.message)
    } catch (mutationError) {
      setInlineAdd({
        ...inlineAdd,
        error: mutationError instanceof Error ? mutationError.message : '新增支付方式失败，请稍后重试',
        isSubmitting: false,
      })
    }
  }

  async function handleDisable(methodId: string) {
    try {
      const result = await updatePaymentMethodStatus({ methodId, nextStatus: 'disabled' })
      setLastMutation(result)
      triggerReload(result.message)
    } catch (mutationError) {
      setFeedback(mutationError instanceof Error ? mutationError.message : '支付方式停用失败，请稍后重试')
    }
  }

  async function handleEnable(methodId: string) {
    try {
      const result = await updatePaymentMethodStatus({ methodId, nextStatus: 'enabled' })
      setLastMutation(result)
      triggerReload(result.message)
    } catch (mutationError) {
      setFeedback(mutationError instanceof Error ? mutationError.message : '支付方式启用失败，请稍后重试')
    }
  }

  async function handleSortDrop(targetMethodId: string) {
    if (!pageData || !draggingMethodId || draggingMethodId === targetMethodId) {
      setDraggingMethodId(null)
      return
    }

    const enabledIds = pageData.enabledMethods.map((method) => method.id)
    const fromIndex = enabledIds.indexOf(draggingMethodId)
    const toIndex = enabledIds.indexOf(targetMethodId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggingMethodId(null)
      return
    }

    const direction = fromIndex < toIndex ? 'down' : 'up'

    try {
      let result: PaymentSettingMutationData | null = null
      for (let step = 0; step < Math.abs(toIndex - fromIndex); step += 1) {
        result = await movePaymentMethod({ methodId: draggingMethodId, direction })
      }
      if (result) {
        setLastMutation(result)
        triggerReload('支付方式排序已更新')
      }
    } catch (mutationError) {
      setFeedback(mutationError instanceof Error ? mutationError.message : '支付方式排序失败，请稍后重试')
    } finally {
      setDraggingMethodId(null)
    }
  }

  return (
    <div className="payment-setting-page">
      <section className="payment-setting-panel" aria-label="支付方式设置">
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
              <button
                type="button"
                className="payment-setting-primary payment-setting-primary--compact"
                onClick={openInlineAdd}
                disabled={inlineAdd !== null}
              >
                新增
              </button>
            </div>
            <div className="payment-setting-grid" aria-label="已启用支付方式列表">
              {pageData.enabledMethods.map((method) => (
                <PaymentMethodTile
                  key={method.id}
                  method={method}
                  isHovering={hoveredEnabledMethodId === method.id}
                  isDragging={draggingMethodId === method.id}
                  onDisable={() => handleDisable(method.id)}
                  onDragStart={() => setDraggingMethodId(method.id)}
                  onDragEnd={() => setDraggingMethodId(null)}
                  onDragEnter={() => setHoveredEnabledMethodId(method.id)}
                  onMouseEnter={() => setHoveredEnabledMethodId(method.id)}
                  onMouseLeave={() => setHoveredEnabledMethodId((current) => (current === method.id ? null : current))}
                  onDrop={() => void handleSortDrop(method.id)}
                />
              ))}
              {inlineAdd ? (
                <InlineAddTile
                  value={inlineAdd.name}
                  error={inlineAdd.error}
                  isSubmitting={inlineAdd.isSubmitting}
                  onChange={(value) => setInlineAdd({ ...inlineAdd, name: value, error: '' })}
                  onConfirm={() => void handleCreate()}
                  onCancel={() => setInlineAdd(null)}
                />
              ) : null}
            </div>

            <div className="payment-setting-divider" />

            <div className="payment-setting-heading-row">
              <SectionHeading>已停用支付方式</SectionHeading>
            </div>
            <div className="payment-setting-disabled" aria-label="已停用支付方式列表">
              {pageData.disabledMethods.map((method) => (
                <PaymentMethodTile
                  key={method.id}
                  method={method}
                  variant="disabled"
                  onEnable={() => handleEnable(method.id)}
                />
              ))}
            </div>
          </>
        ) : null}

        <pre className="payment-setting-contract" data-testid="payment-setting-service-contract" aria-hidden="true">
          {contractLines.join('\n')}
        </pre>
      </section>

    </div>
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="payment-setting-title">
      <span aria-hidden="true" />
      {children}
    </h2>
  )
}

function PaymentMethodTile({
  method,
  variant = 'enabled',
  isHovering = false,
  isDragging = false,
  onDisable,
  onEnable,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDrop,
  onMouseEnter,
  onMouseLeave,
}: {
  method: PaymentSettingPageData['enabledMethods'][number]
  variant?: 'enabled' | 'disabled'
  isHovering?: boolean
  isDragging?: boolean
  onDisable?: () => void
  onEnable?: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onDragEnter?: () => void
  onDrop?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  return (
    <article
      className={`payment-method-tile payment-method-tile--${variant}${isDragging ? ' is-dragging' : ''}`}
      data-testid="payment-method-tile"
      data-method-id={method.id}
      data-status={variant}
      draggable={variant === 'enabled'}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={variant === 'enabled' ? (event) => event.preventDefault() : undefined}
      onDrop={variant === 'enabled' ? onDrop : undefined}
      onDragEnter={variant === 'enabled' ? onDragEnter : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="payment-method-tile__handle" aria-hidden="true">
        ⋮⋮
      </span>
      <strong>{method.name}</strong>
      {method.isSystemDefault ? <span className="payment-method-tile__badge">默认</span> : null}
      {variant === 'enabled' && isHovering ? (
        <button
          type="button"
          className="payment-method-tile__disable"
          aria-label={`停用 ${method.name}`}
          data-tooltip="停用"
          onClick={onDisable}
        >
          ×
        </button>
      ) : null}
      {variant === 'disabled' ? (
        <button type="button" className="payment-method-tile__enable" onClick={onEnable}>
          启用
        </button>
      ) : null}
    </article>
  )
}

function InlineAddTile({
  value,
  error,
  isSubmitting,
  onChange,
  onConfirm,
  onCancel,
}: {
  value: string
  error: string
  isSubmitting: boolean
  onChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="payment-method-tile payment-method-tile--editing" data-testid="payment-method-inline-add">
      <span className="payment-method-tile__handle" aria-hidden="true">
        ⋮⋮
      </span>
      <div className="payment-method-tile__editor">
        <input
          type="text"
          aria-label="新增支付方式名称"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="请输入"
        />
        <button type="button" className="is-confirm" aria-label="确认新增支付方式" onClick={onConfirm} disabled={isSubmitting}>
          √
        </button>
        <button type="button" className="is-cancel" aria-label="取消新增支付方式" onClick={onCancel} disabled={isSubmitting}>
          ×
        </button>
      </div>
      {error ? <p className="payment-method-tile__error">{error}</p> : null}
    </div>
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
