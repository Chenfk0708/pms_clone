import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AutoStrategySettingPage } from '../../src/pages/AutoStrategySettingPage'
import './styles.css'

function HarnessApp() {
  return (
    <div className="harness-shell">
      <header className="topnav">
        <Link className="is-active" to="/setting/IntelligenceSetting">
          设置
        </Link>
      </header>

      <div className="harness-body">
        <aside className="harness-sidebar">
          <Link className="is-active" to="/setting/IntelligenceSetting">
            自动策略设置
          </Link>
        </aside>

        <main className="page-content">
          <div className="page-header">页面头部</div>
          <AutoStrategySettingPage />
        </main>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<HarnessApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
