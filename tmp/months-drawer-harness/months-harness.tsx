import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import '../../src/index.css'
import { HouseMonthsPage } from '../../src/pages/HouseMonthsPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<HouseMonthsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
