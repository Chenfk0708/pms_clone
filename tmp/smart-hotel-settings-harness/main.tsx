import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import '../../src/index.css'
import { AppShell } from '../../src/components/AppShell'
import { SmartHotelSettingsPage } from '../../src/pages/SmartHotelSettingsPage'

const titleMap: Record<string, string> = {
  '/smartHotel/smartSettings': '智住小程序',
  '/smartHotel/smartHome': '自助入住',
  '/smartHotel/checkInGuide': '全局设置',
  '/smartHotel/smartHardware/mall': '智能硬件商城',
  '/statistics/statementOrder': '品牌小程序订单',
  '/version/localsMall': '路客商城',
  '/setting/notification': '通知设置',
  '/statistics/shift/record': '交接班',
  '/InformationMaintenance/campInfo': '门店信息',
  '/setting/member': '成员设置',
  '/CompanySetting/Apikeys': 'API keys',
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section
      style={{
        margin: '24px',
        padding: '24px',
        borderRadius: '24px',
        background: '#fff',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
      }}
      aria-label={`${title}占位页`}
    >
      <h1 style={{ margin: 0, fontSize: '28px' }}>{title}</h1>
      <p style={{ margin: '12px 0 0', color: 'rgba(15, 23, 42, 0.64)' }}>
        该路由仅用于智住小程序页的联动验证。
      </p>
    </section>
  )
}

function RoutedHarness() {
  const location = useLocation()
  const pageTitle = titleMap[location.pathname] ?? '智住小程序'

  return (
    <AppShell path={location.pathname} pageTitle={pageTitle}>
      <Routes>
        <Route path="/" element={<Navigate to="/smartHotel/smartSettings" replace />} />
        <Route path="/workspace" element={<Navigate to="/smartHotel/smartSettings" replace />} />
        <Route path="/smartHotel/smartSettings" element={<SmartHotelSettingsPage />} />
        <Route path="/smartHotel/smartHome" element={<PlaceholderPage title="自助入住" />} />
        <Route path="/smartHotel/checkInGuide" element={<PlaceholderPage title="全局设置" />} />
        <Route path="/smartHotel/smartHardware/mall" element={<PlaceholderPage title="智能硬件商城" />} />
        <Route path="/statistics/statementOrder" element={<PlaceholderPage title="品牌小程序订单" />} />
        <Route path="/version/localsMall" element={<PlaceholderPage title="路客商城" />} />
        <Route path="/setting/notification" element={<PlaceholderPage title="通知设置" />} />
        <Route path="/statistics/shift/record" element={<PlaceholderPage title="交接班" />} />
        <Route path="/InformationMaintenance/campInfo" element={<PlaceholderPage title="门店信息" />} />
        <Route path="/setting/member" element={<PlaceholderPage title="成员设置" />} />
        <Route path="/CompanySetting/Apikeys" element={<PlaceholderPage title="API keys" />} />
        <Route path="*" element={<Navigate to="/smartHotel/smartSettings" replace />} />
      </Routes>
    </AppShell>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoutedHarness />
    </BrowserRouter>
  </React.StrictMode>,
)
