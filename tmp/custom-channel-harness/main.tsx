import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '../../src/components/AppShell'
import { CustomChannelPage } from '../../src/pages/CustomChannelPage'
import '../../src/index.css'

function HarnessLayout() {
  const location = useLocation()

  return (
    <AppShell path={location.pathname} pageTitle="自定义渠道">
      <Routes>
        <Route path="/" element={<Navigate to="/setting/customChannel" replace />} />
        <Route path="/setting/customChannel" element={<CustomChannelPage />} />
        <Route path="/InformationMaintenance/informationOverview" element={<RouteStub title="基础信息" />} />
        <Route path="/setting/globalSetting" element={<RouteStub title="全局设置" />} />
        <Route path="*" element={<Navigate to="/setting/customChannel" replace />} />
      </Routes>
    </AppShell>
  )
}

function RouteStub({ title }: { title: string }) {
  return (
    <section aria-label={title} style={{ padding: 24 }}>
      <h1>{title}</h1>
      <p>{title} 路由占位已加载。</p>
    </section>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <HarnessLayout />
    </BrowserRouter>
  </React.StrictMode>,
)
