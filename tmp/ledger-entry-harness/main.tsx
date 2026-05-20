import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import '../../src/index.css'
import { LedgerEntryPage } from '../../src/pages/LedgerEntryPage'

function AppFrame() {
  const location = useLocation()
  const reportActive = location.pathname.startsWith('/statistics')

  return (
    <div className="app-shell">
      <nav aria-label="顶部导航" className="topnav">
        <NavLink className={reportActive ? 'topnav-link is-active' : 'topnav-link'} to="/statistics/ledger">
          报表
        </NavLink>
      </nav>

      <main className="page-content">
        <header className="page-header" hidden />
        <aside className="app-sidebar">
          <NavLink className={({ isActive }) => (isActive ? 'sidebar-link is-active' : 'sidebar-link')} to="/statistics/ledger">
            记一笔明细
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? 'sidebar-link is-active' : 'sidebar-link')}
            to="/statistics/orderLedger"
          >
            收支明细
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? 'sidebar-link is-active' : 'sidebar-link')}
            to="/statistics/totalLedger"
          >
            收支汇总
          </NavLink>
        </aside>

        <section className="page-body">
          <Routes>
            <Route path="/statistics/ledger" element={<LedgerEntryPage />} />
            <Route path="/statistics/orderLedger" element={<RouteStub title="收支明细" />} />
            <Route path="/statistics/totalLedger" element={<RouteStub title="收支汇总" />} />
            <Route path="*" element={<LedgerEntryPage />} />
          </Routes>
        </section>
      </main>
    </div>
  )
}

function RouteStub({ title }: { title: string }) {
  return (
    <section aria-label={title} style={{ padding: 24 }}>
      <h1>{title}</h1>
      <p>{title} 路由承接成功。</p>
    </section>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppFrame />
    </BrowserRouter>
  </React.StrictMode>,
)
