import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '../../src/index.css'
import { StaffListHarnessApp } from './StaffListHarnessApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StaffListHarnessApp />
  </BrowserRouter>,
)
