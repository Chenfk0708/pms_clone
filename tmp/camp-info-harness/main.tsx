import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '../../src/components/AppShell'
import { CampInfoPage } from '../../src/pages/CampInfoPage'
import '../../src/index.css'
import '../../src/pages/TopNavFloor.css'

function RoutedHarness() {
  const location = useLocation()

  return (
    <AppShell path={location.pathname} pageTitle="门店信息">
      <Routes>
        <Route path="/" element={<Navigate to="/InformationMaintenance/campInfo" replace />} />
        <Route path="/InformationMaintenance/campInfo" element={<CampInfoPage />} />
        <Route path="/InformationMaintenance/campInfo/edit" element={<CampInfoPage />} />
        <Route path="/InformationMaintenance/campInfo/sort" element={<CampInfoPage />} />
      </Routes>
    </AppShell>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RoutedHarness />
    </BrowserRouter>
  </StrictMode>,
)
