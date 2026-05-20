import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '../../src/components/AppShell'
import { ApiKeysPage } from '../../src/pages/ApiKeysPage'
import '../../src/index.css'

function HarnessLayout() {
  const location = useLocation()

  return (
    <AppShell path={location.pathname} pageTitle="API keys">
      <Routes>
        <Route path="/" element={<Navigate to="/CompanySetting/Apikeys" replace />} />
        <Route path="/CompanySetting/Apikeys" element={<ApiKeysPage />} />
        <Route path="/CompanySetting/CompanyInfo" element={<section style={{ padding: 24 }}>企业信息</section>} />
      </Routes>
    </AppShell>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <HarnessLayout />
    </BrowserRouter>
  </React.StrictMode>,
)
