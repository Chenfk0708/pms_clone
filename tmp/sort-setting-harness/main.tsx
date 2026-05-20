import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AppShell } from '../../src/components/AppShell'
import { SortSettingPage } from '../../src/pages/SortSettingPage'
import '../../src/index.css'

function HarnessApp() {
  const location = useLocation()

  return (
    <AppShell path={location.pathname} pageTitle="排序设置">
      <SortSettingPage />
    </AppShell>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <HarnessApp />
    </BrowserRouter>
  </StrictMode>,
)
