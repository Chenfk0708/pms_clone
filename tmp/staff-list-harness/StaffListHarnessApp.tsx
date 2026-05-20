import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '../../src/components/AppShell'
import { StaffListPage } from '../../src/pages/StaffListPage'
import { CleanSettingPage } from '../../src/pages/CleanSettingPage'

const pageTitleMap: Record<string, string> = {
  '/customer/staffList': '企微员工列表',
  '/version/applicationPayment/detail': '应用订阅',
}

export function StaffListHarnessApp() {
  const location = useLocation()
  const pageTitle = pageTitleMap[location.pathname] ?? '企微员工列表'

  return (
    <AppShell path={location.pathname} pageTitle={pageTitle}>
      <Routes>
        <Route path="/" element={<Navigate to="/customer/staffList" replace />} />
        <Route path="/customer/staffList" element={<StaffListPage />} />
        <Route path="/version/applicationPayment/detail" element={<CleanSettingPage />} />
      </Routes>
    </AppShell>
  )
}
