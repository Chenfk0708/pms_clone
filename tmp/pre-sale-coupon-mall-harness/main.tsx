import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import '../../src/index.css'
import '../../src/pages/TopNavFloor.css'
import { PresaleCouponMallReportPage } from '../../src/pages/PresaleCouponMallReportPage'

function AppFrame() {
  const location = useLocation()
  const reportActive = location.pathname.startsWith('/statistics')

  return (
    <div className="app-shell">
      <nav aria-label="顶部导航" className="topnav">
        <NavLink className={reportActive ? 'topnav-link is-active' : 'topnav-link'} to="/statistics/preSaleCouponMall">
          报表
        </NavLink>
      </nav>

      <main className="page-content">
        <header className="page-header" hidden />
        <aside className="app-sidebar">
          <NavLink
            className={({ isActive }) => (isActive ? 'sidebar-link is-active' : 'sidebar-link')}
            to="/statistics/preSaleCouponMall"
          >
            预售券核销明细
          </NavLink>
          <NavLink className="sidebar-link" to="/statistics/presale">
            预售券销售统计
          </NavLink>
        </aside>

        <section className="page-body">
          <Routes>
            <Route path="/statistics/preSaleCouponMall" element={<PresaleCouponMallReportPage />} />
            <Route path="/statistics/presale" element={<RouteStub title="预售券销售统计" />} />
            <Route path="*" element={<PresaleCouponMallReportPage />} />
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
