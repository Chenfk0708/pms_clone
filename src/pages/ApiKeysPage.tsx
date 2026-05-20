import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  fetchApiKeysPageData,
  generateApiKeys,
  resolveApiKeysCampId,
  resolveApiKeysQuery,
  type ApiKeysDiagnostics,
  type ApiKeysPageData,
} from '../services/apiKeys'
import './ApiKeysPage.css'

const pageDescription = '此API keys用于Locals AI使用，请妥善保存。'
const pageWarning = '不要与他人共享你的 API key，或将其暴露在浏览器中。'

export function ApiKeysPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = useMemo(() => resolveApiKeysQuery(location.search), [location.search])
  const [pageData, setPageData] = useState<ApiKeysPageData | null>(null)
  const [diagnostics, setDiagnostics] = useState<ApiKeysDiagnostics | null>(null)
  const [feedback, setFeedback] = useState('正在加载 API keys')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)

  useEffect(() => {
    void loadPageData('initial')
    // Route query should drive the first fetch only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.mockState])

  const contractText = JSON.stringify(diagnostics, null, 2)

  async function loadPageData(reason: 'initial' | 'retry') {
    setIsLoading(true)
    setError('')
    setFeedback(reason === 'retry' ? '正在重新加载 API keys' : '正在加载 API keys')

    try {
      const nextData = await fetchApiKeysPageData({
        campId: resolveApiKeysCampId(),
        mockState: query.mockState,
      })

      setPageData(nextData)
      setDiagnostics(nextData.diagnostics)
      setFeedback(nextData.keyRecord ? 'API keys 已同步' : '暂未生成 API keys')
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'API keys 加载失败，请稍后重试'
      setPageData(null)
      setDiagnostics(readDiagnostics())
      setError(message)
      setFeedback(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGenerate(source: 'create' | 'regenerate') {
    setIsSubmitting(true)
    setError('')
    setFeedback(source === 'create' ? '正在生成 API keys' : '正在重新生成 API keys')

    try {
      const nextData = await generateApiKeys({ campId: resolveApiKeysCampId() })
      setPageData(nextData)
      setDiagnostics(nextData.diagnostics)
      setFeedback(source === 'create' ? 'API keys 已生成' : '已重新生成 API keys')
      setRegenerateOpen(false)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'API keys 生成失败，请稍后重试'
      setDiagnostics(readDiagnostics())
      setError(message)
      setFeedback(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCopy(label: 'Access Key ID' | 'Secret Key') {
    setFeedback(`${label} 已复制`)
  }

  return (
    <section className="api-keys-page" aria-label="API keys">
      <pre hidden data-testid="api-keys-service-contract">
        {contractText}
      </pre>

      <div className="api-keys-card">
        <header className="api-keys-header">
          <div>
            <h1>API keys</h1>
            <p className="api-keys-copy">
              <span>{pageDescription}</span>
              <span className="api-keys-copy__warning">{pageWarning}</span>
            </p>
          </div>
          <button type="button" className="api-keys-secondary" onClick={() => navigate('/CompanySetting/CompanyInfo')}>
            查看企业信息
          </button>
        </header>

        <div className="api-keys-status" role="status" aria-label="API keys操作反馈">
          {feedback}
        </div>

        {isLoading ? (
          <section className="api-keys-loading" aria-label="API keys加载状态">
            <div className="api-keys-skeleton api-keys-skeleton--title" />
            <div className="api-keys-skeleton" />
            <div className="api-keys-skeleton api-keys-skeleton--short" />
          </section>
        ) : null}

        {error ? (
          <section className="api-keys-error" role="alert" aria-label="API keys数据错误">
            <strong>API keys 加载失败，请稍后重试</strong>
            <span>{error}</span>
            <button type="button" className="api-keys-primary" onClick={() => void loadPageData('retry')} disabled={isSubmitting}>
              重新加载
            </button>
          </section>
        ) : null}

        {!isLoading && !error && pageData?.keyRecord === null ? (
          <section className="api-keys-empty" aria-label="API keys空状态">
            <p>暂未生成路客云API keys，点击下方按钮获取API Keys</p>
            <div className="api-keys-actions">
              <button
                type="button"
                className="api-keys-primary"
                onClick={() => void handleGenerate('create')}
                disabled={isSubmitting}
              >
                {isSubmitting ? '生成中...' : '获取API keys'}
              </button>
            </div>
          </section>
        ) : null}

        {!isLoading && !error && pageData?.keyRecord ? (
          <div className="api-keys-layout">
            <section className="api-keys-panel api-keys-panel--credential">
              <div className="api-keys-panel__head">
                <div>
                  <h2>当前凭证</h2>
                  <p>请仅在 Locals AI 服务端或安全密钥管理系统中保存 Secret Key。</p>
                </div>
                <span className="api-keys-badge">已启用</span>
              </div>

              <dl className="api-keys-grid">
                <div>
                  <dt>App ID</dt>
                  <dd>{pageData.keyRecord.appId}</dd>
                </div>
                <div>
                  <dt>Access Key ID</dt>
                  <dd data-testid="api-keys-access-key-id">{pageData.keyRecord.accessKeyId}</dd>
                </div>
                <div>
                  <dt>Secret Key</dt>
                  <dd>{pageData.keyRecord.secretKeyPreview}</dd>
                </div>
                <div>
                  <dt>生成时间</dt>
                  <dd>{pageData.keyRecord.createdAt}</dd>
                </div>
                <div>
                  <dt>最近使用</dt>
                  <dd>{pageData.keyRecord.lastUsedAt}</dd>
                </div>
                <div>
                  <dt>轮换建议</dt>
                  <dd>{pageData.keyRecord.rotationTip}</dd>
                </div>
              </dl>

              <div className="api-keys-actions">
                <button type="button" className="api-keys-primary" onClick={() => handleCopy('Access Key ID')}>
                  复制 Access Key ID
                </button>
                <button type="button" className="api-keys-secondary" onClick={() => handleCopy('Secret Key')}>
                  复制 Secret Key
                </button>
                <button type="button" className="api-keys-secondary" onClick={() => setGuideOpen(true)}>
                  查看接入说明
                </button>
                <button
                  type="button"
                  className="api-keys-secondary"
                  onClick={() => setRegenerateOpen(true)}
                  disabled={isSubmitting}
                >
                  重新生成
                </button>
              </div>
            </section>

            <section className="api-keys-panel" aria-label="API keys权限范围">
              <h2>权限范围</h2>
              <ul className="api-keys-list">
                {pageData.keyRecord.scopes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="api-keys-panel" aria-label="API keys操作记录">
              <h2>操作记录</h2>
              <ul className="api-keys-timeline">
                {pageData.activityLog.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                    <em>{item.occurredAt}</em>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>

      {guideOpen ? (
        <div className="api-keys-modal-backdrop">
          <section role="dialog" aria-modal="true" aria-label="Locals AI 接入说明" className="api-keys-modal">
            <h2>Locals AI 接入说明</h2>
            <ul className="api-keys-guide">
              <li>请在服务端安全保存 Secret Key，不要写入浏览器侧代码。</li>
              <li>建议按环境拆分凭证，并在切换窗口内完成轮换。</li>
              <li>若重新生成 API keys，请同步更新所有已接入节点。</li>
            </ul>
            <button type="button" className="api-keys-primary" onClick={() => setGuideOpen(false)}>
              关闭接入说明
            </button>
          </section>
        </div>
      ) : null}

      {regenerateOpen ? (
        <div className="api-keys-modal-backdrop">
          <section role="dialog" aria-modal="true" aria-label="确认重新生成 API keys" className="api-keys-modal">
            <h2>确认重新生成 API keys</h2>
            <p>重新生成后，请同步更新 Locals AI 配置，旧凭证将不再继续使用。</p>
            <div className="api-keys-modal__actions">
              <button type="button" className="api-keys-secondary" onClick={() => setRegenerateOpen(false)}>
                取消
              </button>
              <button type="button" className="api-keys-primary" onClick={() => void handleGenerate('regenerate')} disabled={isSubmitting}>
                确认重新生成
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

function readDiagnostics() {
  if (typeof window === 'undefined') return null

  const rawText = window.localStorage.getItem('pms.apiKeys.lastRequest')
  return rawText ? (JSON.parse(rawText) as ApiKeysDiagnostics) : null
}
