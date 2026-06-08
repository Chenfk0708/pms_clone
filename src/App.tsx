import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AiRadarPage } from './pages/AiRadarPage'
import { ApiKeysPage } from './pages/ApiKeysPage'
import { ApplicationPaymentDetailPage } from './pages/ApplicationPaymentDetailPage'
import { ApplicationPaymentPage } from './pages/ApplicationPaymentPage'
import { AutoStrategySettingPage } from './pages/AutoStrategySettingPage'
import { BrandWebsitePage } from './pages/BrandWebsitePage'
import { CalendarRoomPage } from './pages/CalendarRoomPage'
import { CampInfoPage } from './pages/CampInfoPage'
import { CardVerificationPage } from './pages/CardVerificationPage'
import { CleanLogPage } from './pages/CleanLogPage'
import { CleanSettingPage } from './pages/CleanSettingPage'
import { CleanStaffPage } from './pages/CleanStaffPage'
import { CleanStatisticsPage } from './pages/CleanStatisticsPage'
import { CleanTaskPage } from './pages/CleanTaskPage'
import { CompanyInfoPage } from './pages/CompanyInfoPage'
import { CompanyQualificationPage } from './pages/CompanyQualificationPage'
import { ComprehensiveMonthlyReportPage } from './pages/ComprehensiveMonthlyReportPage'
import { CouponPage } from './pages/CouponPage'
import { CustomChannelPage } from './pages/CustomChannelPage'
import { CustomerAddBatchPage } from './pages/CustomerAddBatchPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { CustomerListPage } from './pages/CustomerListPage'
import { CustomerMarketingPage } from './pages/CustomerMarketingPage'
import { CustomerTagPage } from './pages/CustomerTagPage'
import { DistributionDisplacementPage } from './pages/DistributionDisplacementPage'
import { DistributionListPage } from './pages/DistributionListPage'
import { DistributionOrderPage } from './pages/DistributionOrderPage'
import { ExpendSettingPage } from './pages/ExpendSettingPage'
import { FinanceSettingPage } from './pages/FinanceSettingPage'
import { FullMarketingPage } from './pages/FullMarketingPage'
import { GlobalSettingPage } from './pages/GlobalSettingPage'
import { HotelPackageOrderPage } from './pages/HotelPackageOrderPage'
import { HotelProductPage } from './pages/HotelProductPage'
import { HouseDaysPage } from './pages/HouseDaysPage'
import { HouseMonthsPage } from './pages/HouseMonthsPage'
import { HouseStatusSharingPage } from './pages/HouseStatusSharingPage'
import { HouseStatusLogsPage } from './pages/HouseStatusLogsPage'
import { ImSettingPage } from './pages/ImSettingPage'
import { IncomeReportPage } from './pages/IncomeReportPage'
import { InformationOverviewPage } from './pages/InformationOverviewPage'
import { LedgerEntryPage } from './pages/LedgerEntryPage'
import { LocalsMallPage } from './pages/LocalsMallPage'
import { LoginPage } from './pages/LoginPage'
import { MemberEquityPage } from './pages/MemberEquityPage'
import { MemberPointsPage } from './pages/MemberPointsPage'
import { MemberSettingPage } from './pages/MemberSettingPage'
import { MyBenefitPage } from './pages/MyBenefitPage'
import { NotificationCenterPage } from './pages/NotificationCenterPage'
import { NotificationSettingPage } from './pages/NotificationSettingPage'
import { OrderLedgerPage } from './pages/OrderLedgerPage'
import { OrdersPage } from './pages/OrdersPage'
import { OtaPage } from './pages/OtaPage'
import { PaymentSettingPage } from './pages/PaymentSettingPage'
import { PermissionSettingPage } from './pages/PermissionSettingPage'
import { PicturesVideosPage } from './pages/PicturesVideosPage'
import { PresaleCouponMallReportPage } from './pages/PresaleCouponMallReportPage'
import { PresaleGoodsPage } from './pages/PresaleGoodsPage'
import { PresaleOrderPage } from './pages/PresaleOrderPage'
import { PresaleSalesReportPage } from './pages/PresaleSalesReportPage'
import { PriceLogPage } from './pages/PriceLogPage'
import { PricePage } from './pages/PricePage'
import { PrintSettingPage } from './pages/PrintSettingPage'
import { PrivatePage } from './pages/PrivatePage'
import { ProfitReportPage } from './pages/ProfitReportPage'
import { PsbLogPage } from './pages/PsbLogPage'
import { PsbPolicePage } from './pages/PsbPolicePage'
import { ReceptionConfigPage } from './pages/ReceptionConfigPage'
import { ReportPage } from './pages/ReportPage'
import { RoomSituationPage } from './pages/RoomSituationPage'
import { RoomTypeInfoPage } from './pages/RoomTypeInfoPage'
import { SalesReportPage } from './pages/SalesReportPage'
import { ScrmGeneralPage } from './pages/ScrmGeneralPage'
import { ScrmMemberLevelPage } from './pages/ScrmMemberLevelPage'
import { ScrmSidebarPreviewPage } from './pages/ScrmSidebarPreviewPage'
import { ShiftRecordPage } from './pages/ShiftRecordPage'
import { ShiftSettingPage } from './pages/ShiftSettingPage'
import { SmartDoorLockPage } from './pages/SmartDoorLockPage'
import { SmartHardwareMallPage } from './pages/SmartHardwareMallPage'
import { SmartHotelGlobalSettingPage } from './pages/SmartHotelGlobalSettingPage'
import { SmartHotelSettingsPage } from './pages/SmartHotelSettingsPage'
import { SmartIdCardReaderPage } from './pages/SmartIdCardReaderPage'
import { SmartSelfCheckinPage } from './pages/SmartSelfCheckinPage'
import { SmsSettingPage } from './pages/SmsSettingPage'
import { SocialPage, SocialSettingPage } from './pages/SocialPage'
import { SortSettingPage } from './pages/SortSettingPage'
import { StaffListPage } from './pages/StaffListPage'
import { StatementOrderPage } from './pages/StatementOrderPage'
import { StatisticsDistributionOrderPage } from './pages/StatisticsDistributionOrderPage'
import { SubscriptionDisplacementBenefitPage } from './pages/SubscriptionDisplacementBenefitPage'
import { TotalLedgerPage } from './pages/TotalLedgerPage'
import { VersionSubscriptionPage } from './pages/VersionSubscriptionPage'
import { WechatServicePage } from './pages/WechatServicePage'
import { WorkspacePage } from './pages/WorkspacePage'
import { WriteExpendSettingPage } from './pages/WriteExpendSettingPage'
import './pages/TopNavFloor.css'

type PlaceholderPageProps = {
  title: string
  description: string
}

const pageTitles: Record<string, string> = {
  '/workspace': '首页工作台',
  '/houseManage/months': '月房态',
  '/houseManage/days': '日房态',
  '/houseManage/months/sharingRoomStatus': '分享房态',
  '/houseManage/logs/status': '房态日志',
  '/houseManage/houseCale': '中央价',
  '/houseManage/channelPrice': '渠道 RP 价',
  '/houseManage/priceComparison': '竞争圈比价',
  '/houseManage/retailPrice': '门市价',
  '/houseManage/retailPrice/hourSetting': '门市价',
  '/houseManage/otherPrice': '其他价格',
  '/houseManage/priceBoard': '电子房价牌',
  '/houseManage/logs/price': '调价日志',
  '/houseManage/houseStatus': '房情表',
  '/cleanManage/cleanSetting': '保洁设置',
  '/cleanManage/cleanTask': '保洁任务',
  '/cleanManage/cleanStatistics': '保洁统计',
  '/cleanManage/cleanStaff': '保洁人员',
  '/cleanManage/cleanLog': '保洁日志',
  '/order/house-order/list': '住宿订单',
  '/order/house-longRental-order/list': '长租订单',
  '/mallManagement/orderManagement': '预售券订单',
  '/mallManagement/verificationManagement': '卡券核销',
  '/mallManagement/hotelPackageOrder': '酒店套餐订单',
  '/mallManagement/goodsManagement': '预售券',
  '/mallManagement/goodsManagement/edit': '预售券',
  '/mallManagement/couponMgt': '优惠券',
  '/mallManagement/couponMgt/edit': '优惠券',
  '/mallManagement/hotelProduct': '酒店套餐',
  '/mallManagement/hotelProduct/edit': '酒店套餐',
  '/mallManagement/weapp/decorate': '品牌官网',
  '/mallManagement/distribution': '全员营销',
  '/channels/ota': 'OTA',
  '/channels/ota/log': 'OTA',
  '/channels/ota/detail': 'OTA',
  '/channels/social': '社媒',
  '/channels/social/setting': '社媒',
  '/channels/private': '私域',
  '/channels/private/program': '私域',
  '/channels/private/setting/weComSetting': '私域',
  '/channels/private/setting/authorizationSettings': '私域',
  '/channels/distribution/distributionSecond': '聚合分销',
  '/channels/distribution/distributiondisplacement': '置换权益',
  '/channels/distribution/distributionOrderSettlement': '聚合分销订单',
  '/scrm/general': 'SCRM',
  '/scrm/memberCenter/level': '会员等级',
  '/scrm/memberCenter/integrate': '会员积分',
  '/scrm/memberCenter/equity': '会员权益',
  '/scrm/sidebarPreview': '聊天工具栏',
  '/scrm/sidebar/preview': '聊天工具栏',
  '/scrm/wechatService/manage': '微信客服',
  '/scrm/wechatService/receptionConfig': '接待配置',
  '/scrm/marketing/customer': '客户营销',
  '/customer/list': '客户列表',
  '/customer/list/detail': '客户详情',
  '/customer/tag': '客户标签',
  '/customer/addBatch': '批量加好友',
  '/customer/staffList': '企微员工列表',
  '/channels/globalRadar/globalData': 'AI全域雷达',
  '/channels/globalRadar/globalSetting': 'AI全域雷达',
  '/smartHotel/smartHome': '自助入住',
  '/smartHotel/checkInGuide': '全局设置',
  '/smartHotel/smartSettings': '智住小程序',
  '/smartHotel/smartHardware/mall': '智能硬件商城',
  '/smartHotel/smartHardware/mall/detail': '智能硬件商城',
  '/smartHotel/smartHardware/smartLook': '智能门锁',
  '/smartHotel/smartHardware/IDCardReader': '身份证读卡器',
  '/psb/list': 'PSB公安对接',
  '/psb/log': '上报日志',
  '/statistics/report': '统计总览',
  '/statistics/sale': '销况报表',
  '/statistics/stay': '收入报表',
  '/statistics/ledger': '记一笔明细',
  '/statistics/orderLedger': '收支明细',
  '/statistics/statementOrder': '品牌小程序订单',
  '/statistics/shift/record': '交接班',
  '/statistics/totalLedger': '收支汇总',
  '/statistics/profitReport': '利润报表',
  '/statistics/Comprehensive': '综合月报',
  '/statistics/Comprehensive/Monthly': '综合月报',
  '/statistics/presale': '预售券销售统计',
  '/statistics/preSaleCouponMall': '预售券核销明细',
  '/statistics/distributionOrder': '聚合分销订单',
  '/statistics/roomSituation': '房情表',
  '/setting/localRoomTypeProductionSetting': '日历房',
  '/setting/localRoomTypeProductionSetting/channelGoodsSetting': '日历房',
  '/setting/roomTypeInfo': '房型信息',
  '/setting/roomTypeInfo/tag': '房型信息',
  '/setting/roomTypeInfo/tags': '房型信息',
  '/setting/roomTypeInfo/tagManage': '房型信息',
  '/setting/roomTypeInfo/edit': '房型信息',
  '/setting/picturesAndVideos': '图片视频',
  '/setting/imSetting': '会话设置',
  '/setting/notification': '消息通知',
  '/setting/wechatPushSetting': '通知设置',
  '/setting/customChannel': '自定义渠道',
  '/setting/paymentSetting': '支付方式设置',
  '/setting/balanceAndTemplate': '短信设置',
  '/setting/expendSetting': '收入/支出设置',
  '/setting/writeExpendSetting': '记一笔设置',
  '/setting/sortSetting': '排序设置',
  '/setting/finance': '财务设置',
  '/setting/IntelligenceSetting': '自动策略设置',
  '/setting/shiftSetting': '交接班设置',
  '/setting/print': '打印设置',
  '/setting/role': '权限设置',
  '/setting/member': '成员设置',
  '/setting/member/actions': '成员设置',
  '/version/myBenefit': '我的权益',
  '/version/displacementBenefit': '置换权益',
  '/version/subscriptionCenter': '版本订阅',
  '/version/applicationPayment': '应用订阅',
  '/version/applicationPayment/detail': '应用订阅详情',
  '/version/localsMall': '路客商城',
  '/version/localsMall/detail': '路客商城',
  '/InformationMaintenance/informationOverview': '设置',
  '/InformationMaintenance/campInfo': '门店信息',
  '/InformationMaintenance/campInfo/detail': '门店信息',
  '/InformationMaintenance/campInfo/edit': '门店信息',
  '/InformationMaintenance/campInfo/new': '门店信息',
  '/InformationMaintenance/campInfo/sort': '门店信息',
  '/InformationMaintenance/qualification': '企业资质',
  '/CompanySetting/Apikeys': 'API keys',
  '/CompanySetting/CompanyInfo': '企业信息',
}

function RoutedApp() {
  const location = useLocation()
  const normalizedPath = normalizePath(location.pathname)

  if (normalizedPath !== location.pathname) {
    return <Navigate to={`${normalizedPath}${location.search}${location.hash}`} replace />
  }

  const pageTitle = resolvePageTitle(normalizedPath, location.search)

  if (normalizedPath === '/login') {
    return <LoginPage />
  }

  return (
    <AppShell path={normalizedPath} pageTitle={pageTitle}>
      <Routes>
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route path="/workspace" element={<WorkspacePage />} />

        <Route path="/houseManage/months" element={<HouseMonthsPage />} />
        <Route path="/houseManage/days" element={<HouseDaysPage />} />
        <Route path="/houseManage/months/sharingRoomStatus" element={<HouseStatusSharingPage />} />
        <Route path="/houseManage/logs/status" element={<HouseStatusLogsPage />} />
        <Route path="/houseManage/houseCale" element={<PricePage />} />
        <Route path="/houseManage/channelPrice" element={<PricePage />} />
        <Route path="/houseManage/priceComparison" element={<PricePage />} />
        <Route path="/houseManage/retailPrice" element={<PricePage />} />
        <Route path="/houseManage/retailPrice/hourSetting" element={<PricePage />} />
        <Route path="/houseManage/otherPrice" element={<PricePage />} />
        <Route path="/houseManage/priceBoard" element={<PricePage />} />
        <Route path="/houseManage/logs/price" element={<PriceLogPage />} />
        <Route path="/houseManage/houseStatus" element={<RoomSituationPage />} />

        <Route path="/cleanManage/cleanTask" element={<CleanTaskPage />} />
        <Route path="/cleanManage/cleanStatistics" element={<CleanStatisticsPage />} />
        <Route path="/cleanManage/cleanStaff" element={<CleanStaffPage />} />
        <Route path="/cleanManage/cleanSetting" element={<CleanSettingPage />} />
        <Route path="/cleanManage/cleanLog" element={<CleanLogPage />} />

        <Route path="/order/house-order/list" element={<OrdersPage />} />
        <Route path="/order/house-longRental-order/list" element={<OrdersPage variant="longRental" />} />

        <Route path="/mallManagement/orderManagement" element={<PresaleOrderPage />} />
        <Route path="/mallManagement/verificationManagement" element={<CardVerificationPage />} />
        <Route path="/mallManagement/hotelPackageOrder" element={<HotelPackageOrderPage />} />
        <Route path="/mallManagement/goodsManagement" element={<PresaleGoodsPage />} />
        <Route path="/mallManagement/goodsManagement/edit" element={<PresaleGoodsPage />} />
        <Route path="/mallManagement/couponMgt" element={<CouponPage />} />
        <Route path="/mallManagement/couponMgt/edit" element={<CouponPage />} />
        <Route path="/mallManagement/hotelProduct" element={<HotelProductPage />} />
        <Route path="/mallManagement/hotelProduct/edit" element={<HotelProductPage />} />
        <Route path="/mallManagement/weapp/decorate" element={<BrandWebsitePage />} />
        <Route path="/mallManagement/distribution" element={<FullMarketingPage />} />

        <Route path="/setting/localRoomTypeProductionSetting" element={<CalendarRoomPage />} />
        <Route path="/setting/localRoomTypeProductionSetting/channelGoodsSetting" element={<CalendarRoomPage />} />
        <Route path="/setting/roomTypeInfo" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/floor" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/floor/*" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/floors" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/floorManage" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/tag" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/tag/*" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/tags" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/tagManage" element={<RoomTypeInfoPage />} />
        <Route path="/setting/roomTypeInfo/edit" element={<RoomTypeInfoPage />} />
        <Route path="/setting/picturesAndVideos" element={<PicturesVideosPage />} />
        <Route path="/setting/imSetting" element={<ImSettingPage />} />
        <Route path="/setting/notification" element={<NotificationCenterPage />} />
        <Route path="/setting/wechatPushSetting" element={<NotificationSettingPage />} />
        <Route path="/setting/customChannel" element={<CustomChannelPage />} />
        <Route path="/setting/paymentSetting" element={<PaymentSettingPage />} />
        <Route path="/setting/balanceAndTemplate" element={<SmsSettingPage />} />
        <Route path="/setting/expendSetting" element={<ExpendSettingPage />} />
        <Route path="/setting/writeExpendSetting" element={<WriteExpendSettingPage />} />
        <Route path="/setting/sortSetting" element={<SortSettingPage />} />
        <Route path="/setting/finance" element={<FinanceSettingPage />} />
        <Route path="/setting/IntelligenceSetting" element={<AutoStrategySettingPage />} />
        <Route path="/setting/shiftSetting" element={<ShiftSettingPage />} />
        <Route path="/setting/print" element={<PrintSettingPage />} />
        <Route path="/setting/role" element={<PermissionSettingPage />} />
        <Route path="/setting/member" element={<MemberSettingPage />} />
        <Route path="/setting/member/actions" element={<MemberSettingPage />} />

        <Route path="/version/myBenefit" element={<MyBenefitPage />} />
        <Route path="/version/displacementBenefit" element={<SubscriptionDisplacementBenefitPage />} />
        <Route path="/version/subscriptionCenter" element={<VersionSubscriptionPage />} />
        <Route path="/version/applicationPayment" element={<ApplicationPaymentPage />} />
        <Route path="/version/applicationPayment/detail" element={<ApplicationPaymentDetailPage />} />
        <Route path="/version/localsMall" element={<LocalsMallPage />} />
        <Route path="/version/localsMall/detail" element={<LocalsMallPage />} />

        <Route path="/channels/ota" element={<OtaPage />} />
        <Route path="/channels/ota/log" element={<OtaPage />} />
        <Route path="/channels/ota/detail" element={<OtaPage />} />
        <Route path="/channels/social" element={<SocialPage />} />
        <Route path="/channels/social/setting" element={<SocialSettingPage />} />
        <Route path="/channels/private" element={<PrivatePage />} />
        <Route path="/channels/private/program" element={<BrandWebsitePage variant="program" />} />
        <Route path="/channels/private/setting/weComSetting" element={<PrivatePage />} />
        <Route path="/channels/private/setting/authorizationSettings" element={<PrivatePage />} />
        <Route path="/setting/weComSetting" element={<PrivatePage />} />
        <Route path="/setting/authorizationSettings" element={<PrivatePage />} />
        <Route path="/channels/distribution/distributionSecond" element={<DistributionListPage />} />
        <Route path="/channels/distribution/distributiondisplacement" element={<DistributionDisplacementPage />} />
        <Route path="/channels/distribution/distributionOrderSettlement" element={<DistributionOrderPage />} />

        <Route path="/scrm/general" element={<ScrmGeneralPage />} />
        <Route path="/scrm/memberCenter/level" element={<ScrmMemberLevelPage />} />
        <Route path="/scrm/memberCenter/integrate" element={<MemberPointsPage />} />
        <Route path="/scrm/memberCenter/equity" element={<MemberEquityPage />} />
        <Route path="/scrm/sidebarPreview" element={<ScrmSidebarPreviewPage />} />
        <Route path="/scrm/sidebar/preview" element={<ScrmSidebarPreviewPage />} />
        <Route path="/scrm/wechatService/manage" element={<WechatServicePage />} />
        <Route path="/scrm/wechatService/receptionConfig" element={<ReceptionConfigPage />} />
        <Route path="/scrm/marketing/customer" element={<CustomerMarketingPage />} />

        <Route path="/customer/list" element={<CustomerListPage />} />
        <Route path="/customer/list/detail" element={<CustomerDetailPage />} />
        <Route path="/customer/tag" element={<CustomerTagPage />} />
        <Route path="/customer/addBatch" element={<CustomerAddBatchPage />} />
        <Route path="/customer/staffList" element={<StaffListPage />} />

        <Route path="/channels/globalRadar/globalData" element={<AiRadarPage />} />
        <Route path="/channels/globalRadar/globalSetting" element={<GlobalSettingPage />} />

        <Route path="/smartHotel/smartHome" element={<SmartSelfCheckinPage />} />
        <Route path="/smartHotel/checkInGuide" element={<SmartHotelGlobalSettingPage />} />
        <Route path="/smartHotel/smartSettings" element={<SmartHotelSettingsPage />} />
        <Route path="/smartHotel/smartHardware/mall" element={<SmartHardwareMallPage />} />
        <Route path="/smartHotel/smartHardware/mall/detail" element={<SmartHardwareMallPage />} />
        <Route path="/smartHotel/smartHardware/smartLook" element={<SmartDoorLockPage />} />
        <Route path="/smartHotel/smartHardware/IDCardReader" element={<SmartIdCardReaderPage />} />

        <Route path="/psb/list" element={<PsbPolicePage />} />
        <Route path="/psb/log" element={<PsbLogPage />} />

        <Route path="/statistics/report" element={<ReportPage />} />
        <Route path="/statistics/stay" element={<IncomeReportPage />} />
        <Route path="/statistics/sale" element={<SalesReportPage />} />
        <Route path="/statistics/ledger" element={<LedgerEntryPage />} />
        <Route path="/statistics/orderLedger" element={<OrderLedgerPage />} />
        <Route path="/statistics/statementOrder" element={<StatementOrderPage />} />
        <Route path="/statistics/shift/record" element={<ShiftRecordPage />} />
        <Route path="/statistics/totalLedger" element={<TotalLedgerPage />} />
        <Route path="/statistics/profitReport" element={<ProfitReportPage />} />
        <Route path="/statistics/Comprehensive" element={<ComprehensiveMonthlyReportPage />} />
        <Route path="/statistics/Comprehensive/Monthly" element={<ComprehensiveMonthlyReportPage />} />
        <Route path="/statistics/roomSituation" element={<RoomSituationPage />} />
        <Route path="/statistics/presale" element={<PresaleSalesReportPage />} />
        <Route path="/statistics/preSaleCouponMall" element={<PresaleCouponMallReportPage />} />
        <Route path="/statistics/distributionOrder" element={<StatisticsDistributionOrderPage />} />

        <Route path="/CompanySetting/Apikeys" element={<ApiKeysPage />} />
        <Route path="/CompanySetting/CompanyInfo" element={<CompanyInfoPage />} />

        <Route path="/InformationMaintenance/informationOvervie" element={<Navigate to="/InformationMaintenance/informationOverview" replace />} />
        <Route path="/InformationMaintenance/informationOverview" element={<InformationOverviewPage />} />
        <Route path="/InformationMaintenance/campInfo" element={<CampInfoPage />} />
        <Route path="/InformationMaintenance/campInfo/detail" element={<CampInfoPage />} />
        <Route path="/InformationMaintenance/campInfo/edit" element={<CampInfoPage />} />
        <Route path="/InformationMaintenance/campInfo/new" element={<CampInfoPage />} />
        <Route path="/InformationMaintenance/campInfo/sort" element={<CampInfoPage />} />
        <Route path="/InformationMaintenance/companyInfo" element={<Navigate to="/CompanySetting/CompanyInfo" replace />} />
        <Route path="/InformationMaintenance/qualification" element={<CompanyQualificationPage />} />
        <Route path="/InformationMaintenance/*" element={<InformationOverviewPage />} />

        <Route path="*" element={<PlaceholderPage title={pageTitle} description="当前路径未接入具体页面，请继续补充对应路由或页面实现。" />} />
      </Routes>
    </AppShell>
  )
}

function resolvePageTitle(pathname: string, search: string) {
  if (pathname === '/version/applicationPayment/detail') {
    const app = new URLSearchParams(search).get('app')

    if (app === 'smartPricing') return '智能调价'
    if (app === 'globalRadar') return '全域雷达'
    if (app === 'douyin') return '抖音直连'
    if (app === 'im') return '会话升级版'
  }

  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/InformationMaintenance/')) return '设置'
  if (pathname.startsWith('/channels/private/')) return '私域'
  if (pathname.startsWith('/version/')) return '订阅中心'
  if (pathname.startsWith('/setting/')) return '设置'
  if (pathname.startsWith('/scrm/') || pathname.startsWith('/customer/')) return 'SCRM'
  if (pathname.startsWith('/cleanManage/')) return '保洁管理'
  if (pathname.startsWith('/statistics/')) return '报表'
  if (pathname.startsWith('/smartHotel/') || pathname.startsWith('/psb/')) return '智慧酒店'
  return 'PMS 页面'
}

function normalizePath(pathname: string) {
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '')
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

export default RoutedApp
