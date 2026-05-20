import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { PicturesVideosPage } from '../../src/pages/PicturesVideosPage'
import '../../src/index.css'

export function HarnessShell() {
  const location = useLocation()
  const isSettingPath = location.pathname.startsWith('/setting/') || location.pathname.startsWith('/InformationMaintenance/')

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">LOCALS</div>
          <div className="brand-store">
            <strong>路客云测试门店</strong>
            <span>畅享版</span>
          </div>
        </div>

        <nav className="topnav" aria-label="顶部导航">
          <NavLink
            to="/InformationMaintenance/informationOverview"
            className={() => `topnav-link${isSettingPath ? ' is-active' : ''}`}
          >
            设置
          </NavLink>
        </nav>

        <div className="topbar-actions" aria-label="顶部工具栏" />
      </header>

      <div className="page-body">
        <aside className="sidebar" aria-label="设置信息维护侧边导航">
          <section className="sidebar-group sidebar-group--module is-expanded is-active-group">
            <button type="button" className="sidebar-group-title is-active" aria-expanded="true">
              <span className="sidebar-group-heading" role="heading" aria-level={2}>
                信息维护
              </span>
            </button>

            <div className="sidebar-items">
              <NavLink to="/InformationMaintenance/informationOverview" className="sidebar-link">
                信息概览
              </NavLink>
              <NavLink
                to="/setting/picturesAndVideos"
                className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
              >
                图片视频
              </NavLink>
            </div>
          </section>
        </aside>

        <main className="page-content">
          <div className="page-header">
            <div>
              <p className="eyebrow">PMS Clone Prototype</p>
              <h1>图片视频</h1>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<Navigate to="/setting/picturesAndVideos" replace />} />
            <Route path="/InformationMaintenance/informationOverview" element={<PlaceholderPage title="信息概览" />} />
            <Route path="/setting/picturesAndVideos" element={<PicturesVideosPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section
      style={{
        minHeight: 'calc(100vh - 58px)',
        padding: '32px',
        borderRadius: '16px',
        background: '#fff',
      }}
    >
      <h1 style={{ margin: 0 }}>{title}</h1>
    </section>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <HarnessShell />
  </BrowserRouter>,
)
