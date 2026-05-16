import { useState } from 'react'
import './ApiKeysPage.css'

export function ApiKeysPage() {
  const [status, setStatus] = useState('')

  return (
    <section className="api-keys-page" aria-label="API keys">
      <div className="api-keys-card">
        <h1>API keys</h1>
        <p className="api-keys-desc">此API keys用于Locals AI使用，请妥善保存。</p>
        <p className="api-keys-warning">不要与他人共享你的 API key，或将其暴露在浏览器中。</p>

        <div className="api-keys-empty" aria-label="API keys 空态">
          <div className="api-keys-empty__icon" aria-hidden="true">
            <span />
            <i />
          </div>
          <p>暂未生成路客云API keys，点击下方按钮获取API Keys</p>
          <button
            type="button"
            className="api-keys-primary"
            onClick={() => setStatus('本地复刻不会生成真实 API key。请在真实系统中确认生成操作。')}
          >
            获取API keys
          </button>
        </div>

        {status ? (
          <div className="api-keys-status" role="status">
            {status}
          </div>
        ) : null}
      </div>
    </section>
  )
}
