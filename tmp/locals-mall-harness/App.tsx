import { Navigate, Route, Routes } from 'react-router-dom'
import '../../src/index.css'
import { LocalsMallPage } from '../../src/pages/LocalsMallPage'

type PlaceholderPageProps = {
  title: string
}

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main
      aria-label={title}
      style={{
        minHeight: '100vh',
        padding: '24px',
        background: '#f3f6fb',
      }}
    >
      <section
        style={{
          maxWidth: '640px',
          padding: '24px',
          border: '1px solid #dfe5f1',
          borderRadius: '16px',
          background: '#fff',
        }}
      >
        <p style={{ margin: 0, color: '#667085', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          PMS Clone
        </p>
        <h1 style={{ margin: '12px 0 0', fontSize: '28px', color: '#24324a' }}>{title}</h1>
        <p style={{ margin: '12px 0 0', color: '#475467', lineHeight: 1.7 }}>路客商城专项验证占位路由。</p>
      </section>
    </main>
  )
}

export default function App() {
  return (
    <div className="page-content" style={{ paddingTop: 0 }}>
      <Routes>
        <Route path="/" element={<Navigate to="/version/localsMall" replace />} />
        <Route path="/version/localsMall" element={<LocalsMallPage />} />
        <Route path="/version/localsMall/detail" element={<LocalsMallPage />} />
        <Route path="/version/myBenefit" element={<PlaceholderPage title="我的权益" />} />
        <Route path="/version/displacementBenefit" element={<PlaceholderPage title="置换权益" />} />
        <Route path="/version/subscriptionCenter" element={<PlaceholderPage title="版本订阅" />} />
        <Route path="/version/applicationPayment" element={<PlaceholderPage title="应用订阅" />} />
        <Route path="/cleanManage/cleanSetting" element={<PlaceholderPage title="全局设置" />} />
        <Route path="/customer/addBatch" element={<PlaceholderPage title="批量加好友" />} />
        <Route path="/smartHotel/checkInGuide" element={<PlaceholderPage title="全局设置" />} />
        <Route path="/smartHotel/smartHome" element={<PlaceholderPage title="自助入住" />} />
        <Route path="/smartHotel/smartHardware/smartLook" element={<PlaceholderPage title="智能门锁" />} />
        <Route path="*" element={<PlaceholderPage title="路客商城专项路由" />} />
      </Routes>
    </div>
  )
}
