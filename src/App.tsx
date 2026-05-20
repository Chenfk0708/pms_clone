import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AutoStrategySettingPage } from './pages/AutoStrategySettingPage'
import { ApplicationPaymentDetailPage } from './pages/ApplicationPaymentDetailPage'
import { ApplicationPaymentPage } from './pages/ApplicationPaymentPage'
import { CleanSettingPage } from './pages/CleanSettingPage'
import { CompanyInfoPage } from './pages/CompanyInfoPage'
import { CustomerAddBatchPage } from './pages/CustomerAddBatchPage'
import { ExpendSettingPage } from './pages/ExpendSettingPage'
import { FinanceSettingPage } from './pages/FinanceSettingPage'
import { ImSettingPage } from './pages/ImSettingPage'
import { IncomeReportPage } from './pages/IncomeReportPage'
import { LocalsMallPage } from './pages/LocalsMallPage'
import { MemberSettingPage } from './pages/MemberSettingPage'
import { MyBenefitPage } from './pages/MyBenefitPage'
import { NotificationSettingPage } from './pages/NotificationSettingPage'
import { OrderLedgerPage } from './pages/OrderLedgerPage'
import { PrintSettingPage } from './pages/PrintSettingPage'
import { RoomTypeInfoPage } from './pages/RoomTypeInfoPage'
import { SalesReportPage } from './pages/SalesReportPage'
import { ShiftRecordPage } from './pages/ShiftRecordPage'
import { ShiftSettingPage } from './pages/ShiftSettingPage'
import { SmsSettingPage } from './pages/SmsSettingPage'
import { SmartHotelGlobalSettingPage } from './pages/SmartHotelGlobalSettingPage'
import { SmartHotelSettingsPage } from './pages/SmartHotelSettingsPage'
import { SmartSelfCheckinPage } from './pages/SmartSelfCheckinPage'
import { SortSettingPage } from './pages/SortSettingPage'
import { SubscriptionDisplacementBenefitPage } from './pages/SubscriptionDisplacementBenefitPage'
import { VersionSubscriptionPage } from './pages/VersionSubscriptionPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { WriteExpendSettingPage } from './pages/WriteExpendSettingPage'
import './pages/TopNavFloor.css'

type PlaceholderPageProps = {
  title: string
  description: string
}

function RoutedApp() {
  const location = useLocation()
  const pageTitle = resolveKnownPageTitle(location.pathname) || resolvePageTitle(location.pathname)

  return (
    <AppShell path={location.pathname} pageTitle={pageTitle}>
      <Routes>
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/setting/imSetting" element={<ImSettingPage />} />
        <Route path="/setting/balanceAndTemplate" element={<SmsSettingPage />} />
        <Route path="/setting/member" element={<MemberSettingPage />} />
        <Route path="/setting/member/actions" element={<MemberSettingPage />} />
        <Route path="/setting/wechatPushSetting" element={<NotificationSettingPage />} />
        <Route path="/CompanySetting/CompanyInfo" element={<CompanyInfoPage />} />
        <Route path="/setting/expendSetting" element={<ExpendSettingPage />} />
        <Route path="/setting/IntelligenceSetting" element={<AutoStrategySettingPage />} />
        <Route path="/setting/finance" element={<FinanceSettingPage />} />
        <Route path="/setting/print" element={<PrintSettingPage />} />
        <Route path="/setting/writeExpendSetting" element={<WriteExpendSettingPage />} />
        <Route path="/setting/roomTypeInfo" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/edit" element={<RoomTypeInfoPage />} />
        <Route path="/setting/sortSetting" element={<SortSettingPage />} />
        <Route path="/setting/shiftSetting" element={<ShiftSettingPage />} />

        <Route path="/statistics/report" element={<PlaceholderPage title="统计总览" description="查看经营指标、报表概览与常用分析入口。" />} />
        <Route path="/statistics/shift/record" element={<ShiftRecordPage />} />
        <Route path="/statistics/stay" element={<IncomeReportPage />} />
        <Route path="/statistics/sale" element={<SalesReportPage />} />
        <Route path="/statistics/orderLedger" element={<OrderLedgerPage />} />
        <Route path="/statistics/ledger" element={<PlaceholderPage title="记一笔明细" description="记录临时收入与支出，并同步到财务分析链路。" />} />
        <Route path="/statistics/totalLedger" element={<PlaceholderPage title="收支汇总" description="查看周期收支汇总、分类统计与经营趋势概览。" />} />
        <Route path="/statistics/roomSituation" element={<PlaceholderPage title="房情表" description="查看房态、入住安排、预抵与退房相关经营信息。" />} />

        <Route path="/order/house-order/list" element={<PlaceholderPage title="住宿订单" description="查看住宿订单列表、订单状态和订单详情信息。" />} />

        <Route path="/version/myBenefit" element={<MyBenefitPage />} />
        <Route path="/version/displacementBenefit" element={<SubscriptionDisplacementBenefitPage />} />
        <Route path="/version/subscriptionCenter" element={<VersionSubscriptionPage />} />
        <Route path="/version/applicationPayment" element={<ApplicationPaymentPage />} />
        <Route path="/version/applicationPayment/detail" element={<ApplicationPaymentDetailPage />} />
        <Route path="/version/localsMall" element={<LocalsMallPage />} />
        <Route path="/version/localsMall/detail" element={<LocalsMallPage />} />

        <Route path="/cleanManage/cleanSetting" element={<CleanSettingPage />} />
        <Route path="/customer/addBatch" element={<CustomerAddBatchPage />} />

        <Route path="/smartHotel/checkInGuide" element={<SmartHotelGlobalSettingPage />} />
        <Route path="/smartHotel/smartHome" element={<SmartSelfCheckinPage />} />
        <Route path="/smartHotel/smartSettings" element={<SmartHotelSettingsPage />} />

        <Route path="/scrm/wechatService/manage" element={<PlaceholderPage title="微信客服" description="查看客户会话、接待状态与客服协同处理入口。" />} />
        <Route path="/scrm/wechatService/receptionConfig" element={<PlaceholderPage title="接待配置" description="配置接待分配、消息承接与客服接待规则。" />} />
        <Route path="/scrm/sidebarPreview" element={<PlaceholderPage title="聊天工具栏" description="查看客服工具栏、快捷操作与会话辅助能力。" />} />

        <Route path="*" element={<PlaceholderPage title={pageTitle} description="当前页面已纳入统一业务外壳，可继续承接后续业务扩展。" />} />
      </Routes>
    </AppShell>
  )
}

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section
      style={{
        minHeight: 'calc(100vh - 58px)',
        padding: '32px',
        borderRadius: '16px',
        background: '#fff',
      }}
    >
      <p style={{ margin: 0, color: '#667085', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        PMS Clone
      </p>
      <h1 style={{ margin: '12px 0 0', fontSize: '32px' }}>{title}</h1>
      <p style={{ margin: '12px 0 0', maxWidth: '720px', color: '#475467', lineHeight: 1.7 }}>{description}</p>
    </section>
  )
}

function resolvePageTitle(pathname: string) {
  if (pathname === '/workspace') return '工作台'
  if (pathname === '/setting/sortSetting') return '排序设置'
  if (pathname === '/setting/finance') return '财务设置'
  if (pathname === '/CompanySetting/CompanyInfo') return '企业信息'
  if (pathname === '/statistics/report') return '统计总览'
  if (pathname === '/statistics/stay') return '收入报表'
  if (pathname === '/statistics/sale') return '销售报表'
  if (pathname === '/statistics/orderLedger') return '收支明细'
  if (pathname === '/statistics/ledger') return '记一笔明细'
  if (pathname === '/statistics/totalLedger') return '收支汇总'
  if (pathname === '/statistics/roomSituation') return '房情表'
  if (pathname === '/order/house-order/list') return '住宿订单'
  if (pathname === '/setting/expendSetting') return '收入/支出设置'
  if (pathname === '/setting/print') return '打印设置'
  if (pathname === '/setting/imSetting') return '会话设置'
  if (pathname === '/setting/balanceAndTemplate') return '短信设置'
  if (pathname === '/setting/member' || pathname === '/setting/member/actions') return '成员设置'
  if (pathname === '/smartHotel/checkInGuide') return '全局设置'
  if (pathname === '/smartHotel/smartHome') return '自助入住'
  if (pathname === '/smartHotel/smartSettings') return '智慧酒店设置'
  if (pathname.startsWith('/version/')) return '订阅中心'
  if (pathname.startsWith('/setting/')) return '设置'
  if (pathname.startsWith('/scrm/')) return 'SCRM'
  if (pathname.startsWith('/cleanManage/')) return '保洁管理'
  return 'PMS 页面'
}

function resolveKnownPageTitle(pathname: string) {
  if (pathname === '/workspace') return '工作台'
  if (pathname === '/setting/sortSetting') return '排序设置'
  if (pathname === '/setting/finance') return '财务设置'
  if (pathname === '/statistics/shift/record') return '交接班'
  if (pathname === '/setting/shiftSetting') return '交接班设置'
  if (pathname === '/setting/print') return '打印设置'
  if (pathname === '/version/myBenefit') return '我的权益'
  if (pathname === '/version/displacementBenefit') return '置换权益'
  if (pathname === '/version/subscriptionCenter') return '版本订阅'
  if (pathname === '/version/applicationPayment') return '应用订阅'
  if (pathname === '/version/applicationPayment/detail') return '应用订阅详情'
  if (pathname === '/version/localsMall' || pathname === '/version/localsMall/detail') return '旅客商城'
  if (pathname === '/cleanManage/cleanSetting') return '保洁设置'
  if (pathname === '/customer/addBatch') return '批量加好友'
  return resolvePageTitle(pathname)
}

export default RoutedApp
