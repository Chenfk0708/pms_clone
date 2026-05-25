import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AiRadarPage } from './pages/AiRadarPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { ApplicationPaymentDetailPage } from './pages/ApplicationPaymentDetailPage';
import { ApplicationPaymentPage } from './pages/ApplicationPaymentPage';
import { AutoStrategySettingPage } from './pages/AutoStrategySettingPage';
import { BrandWebsitePage } from './pages/BrandWebsitePage';
import { CalendarRoomPage } from './pages/CalendarRoomPage';
import { CampInfoPage } from './pages/CampInfoPage';
import { CardVerificationPage } from './pages/CardVerificationPage';
import { CleanLogPage } from './pages/CleanLogPage';
import { CleanSettingPage } from './pages/CleanSettingPage';
import { CleanStaffPage } from './pages/CleanStaffPage';
import { CleanStatisticsPage } from './pages/CleanStatisticsPage';
import { CleanTaskPage } from './pages/CleanTaskPage';
import { CompanyInfoPage } from './pages/CompanyInfoPage';
import { CompanyQualificationPage } from './pages/CompanyQualificationPage';
import { ComprehensiveMonthlyReportPage } from './pages/ComprehensiveMonthlyReportPage';
import { CouponPage } from './pages/CouponPage';
import { CustomChannelPage } from './pages/CustomChannelPage';
import { CustomerAddBatchPage } from './pages/CustomerAddBatchPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { CustomerListPage } from './pages/CustomerListPage';
import { CustomerMarketingPage } from './pages/CustomerMarketingPage';
import { CustomerTagPage } from './pages/CustomerTagPage';
import { DistributionDisplacementPage } from './pages/DistributionDisplacementPage';
import { DistributionListPage } from './pages/DistributionListPage';
import { DistributionOrderPage } from './pages/DistributionOrderPage';
import { ExpendSettingPage } from './pages/ExpendSettingPage';
import { FinanceSettingPage } from './pages/FinanceSettingPage';
import { FullMarketingPage } from './pages/FullMarketingPage';
import { GlobalSettingPage } from './pages/GlobalSettingPage';
import { HotelPackageOrderPage } from './pages/HotelPackageOrderPage';
import { HotelProductPage } from './pages/HotelProductPage';
import { HouseDaysPage } from './pages/HouseDaysPage';
import { HouseMonthsPage } from './pages/HouseMonthsPage';
import { HouseStatusSharingPage } from './pages/HouseStatusSharingPage';
import { HouseStatusLogsPage } from './pages/HouseStatusLogsPage';
import { ImSettingPage } from './pages/ImSettingPage';
import { IncomeReportPage } from './pages/IncomeReportPage';
import { InformationOverviewPage } from './pages/InformationOverviewPage';
import { LedgerEntryPage } from './pages/LedgerEntryPage';
import { LocalsMallPage } from './pages/LocalsMallPage';
import { MemberEquityPage } from './pages/MemberEquityPage';
import { MemberPointsPage } from './pages/MemberPointsPage';
import { MemberSettingPage } from './pages/MemberSettingPage';
import { MyBenefitPage } from './pages/MyBenefitPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { NotificationSettingPage } from './pages/NotificationSettingPage';
import { OrderLedgerPage } from './pages/OrderLedgerPage';
import { OrdersPage } from './pages/OrdersPage';
import { OtaPage } from './pages/OtaPage';
import { PaymentSettingPage } from './pages/PaymentSettingPage';
import { PermissionSettingPage } from './pages/PermissionSettingPage';
import { PicturesVideosPage } from './pages/PicturesVideosPage';
import { PresaleCouponMallReportPage } from './pages/PresaleCouponMallReportPage';
import { PresaleGoodsPage } from './pages/PresaleGoodsPage';
import { PresaleOrderPage } from './pages/PresaleOrderPage';
import { PresaleSalesReportPage } from './pages/PresaleSalesReportPage';
import { PriceLogPage } from './pages/PriceLogPage';
import { PricePage } from './pages/PricePage';
import { PrintSettingPage } from './pages/PrintSettingPage';
import { PrivatePage } from './pages/PrivatePage';
import { ProfitReportPage } from './pages/ProfitReportPage';
import { PsbLogPage } from './pages/PsbLogPage';
import { PsbPolicePage } from './pages/PsbPolicePage';
import { ReceptionConfigPage } from './pages/ReceptionConfigPage';
import { ReportPage } from './pages/ReportPage';
import { RoomSituationPage } from './pages/RoomSituationPage';
import { RoomTypeInfoPage } from './pages/RoomTypeInfoPage';
import { SalesReportPage } from './pages/SalesReportPage';
import { ScrmGeneralPage } from './pages/ScrmGeneralPage';
import { ScrmMemberLevelPage } from './pages/ScrmMemberLevelPage';
import { ScrmSidebarPreviewPage } from './pages/ScrmSidebarPreviewPage';
import { ShiftRecordPage } from './pages/ShiftRecordPage';
import { ShiftSettingPage } from './pages/ShiftSettingPage';
import { SmartDoorLockPage } from './pages/SmartDoorLockPage';
import { SmartHardwareMallPage } from './pages/SmartHardwareMallPage';
import { SmartHotelGlobalSettingPage } from './pages/SmartHotelGlobalSettingPage';
import { SmartHotelSettingsPage } from './pages/SmartHotelSettingsPage';
import { SmartIdCardReaderPage } from './pages/SmartIdCardReaderPage';
import { SmartSelfCheckinPage } from './pages/SmartSelfCheckinPage';
import { SmsSettingPage } from './pages/SmsSettingPage';
import { SocialPage, SocialSettingPage } from './pages/SocialPage';
import { SortSettingPage } from './pages/SortSettingPage';
import { StaffListPage } from './pages/StaffListPage';
import { StatementOrderPage } from './pages/StatementOrderPage';
import { StatisticsDistributionOrderPage } from './pages/StatisticsDistributionOrderPage';
import { SubscriptionDisplacementBenefitPage } from './pages/SubscriptionDisplacementBenefitPage';
import { TotalLedgerPage } from './pages/TotalLedgerPage';
import { VersionSubscriptionPage } from './pages/VersionSubscriptionPage';
import { WechatServicePage } from './pages/WechatServicePage';
import { WorkspacePage } from './pages/WorkspacePage';
import { WriteExpendSettingPage } from './pages/WriteExpendSettingPage';
import './pages/TopNavFloor.css';
const pageTitles = {
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
    '/InformationMaintenance/campInfo/sort': '门店信息',
    '/InformationMaintenance/qualification': '企业资质',
    '/CompanySetting/Apikeys': 'API keys',
    '/CompanySetting/CompanyInfo': '企业信息',
};
function RoutedApp() {
    const location = useLocation();
    const normalizedPath = normalizePath(location.pathname);
    if (normalizedPath !== location.pathname) {
        return _jsx(Navigate, { to: `${normalizedPath}${location.search}${location.hash}`, replace: true });
    }
    const pageTitle = resolvePageTitle(normalizedPath, location.search);
    return (_jsx(AppShell, { path: normalizedPath, pageTitle: pageTitle, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/workspace", replace: true }) }), _jsx(Route, { path: "/workspace", element: _jsx(WorkspacePage, {}) }), _jsx(Route, { path: "/houseManage/months", element: _jsx(HouseMonthsPage, {}) }), _jsx(Route, { path: "/houseManage/days", element: _jsx(HouseDaysPage, {}) }), _jsx(Route, { path: "/houseManage/months/sharingRoomStatus", element: _jsx(HouseStatusSharingPage, {}) }), _jsx(Route, { path: "/houseManage/logs/status", element: _jsx(HouseStatusLogsPage, {}) }), _jsx(Route, { path: "/houseManage/houseCale", element: _jsx(PricePage, {}) }), _jsx(Route, { path: "/houseManage/channelPrice", element: _jsx(PricePage, {}) }), _jsx(Route, { path: "/houseManage/priceComparison", element: _jsx(PricePage, {}) }), _jsx(Route, { path: "/houseManage/retailPrice", element: _jsx(PricePage, {}) }), _jsx(Route, { path: "/houseManage/retailPrice/hourSetting", element: _jsx(PricePage, {}) }), _jsx(Route, { path: "/houseManage/otherPrice", element: _jsx(PricePage, {}) }), _jsx(Route, { path: "/houseManage/priceBoard", element: _jsx(PricePage, {}) }), _jsx(Route, { path: "/houseManage/logs/price", element: _jsx(PriceLogPage, {}) }), _jsx(Route, { path: "/houseManage/houseStatus", element: _jsx(RoomSituationPage, {}) }), _jsx(Route, { path: "/cleanManage/cleanTask", element: _jsx(CleanTaskPage, {}) }), _jsx(Route, { path: "/cleanManage/cleanStatistics", element: _jsx(CleanStatisticsPage, {}) }), _jsx(Route, { path: "/cleanManage/cleanStaff", element: _jsx(CleanStaffPage, {}) }), _jsx(Route, { path: "/cleanManage/cleanSetting", element: _jsx(CleanSettingPage, {}) }), _jsx(Route, { path: "/cleanManage/cleanLog", element: _jsx(CleanLogPage, {}) }), _jsx(Route, { path: "/order/house-order/list", element: _jsx(OrdersPage, {}) }), _jsx(Route, { path: "/order/house-longRental-order/list", element: _jsx(OrdersPage, { variant: "longRental" }) }), _jsx(Route, { path: "/mallManagement/orderManagement", element: _jsx(PresaleOrderPage, {}) }), _jsx(Route, { path: "/mallManagement/verificationManagement", element: _jsx(CardVerificationPage, {}) }), _jsx(Route, { path: "/mallManagement/hotelPackageOrder", element: _jsx(HotelPackageOrderPage, {}) }), _jsx(Route, { path: "/mallManagement/goodsManagement", element: _jsx(PresaleGoodsPage, {}) }), _jsx(Route, { path: "/mallManagement/goodsManagement/edit", element: _jsx(PresaleGoodsPage, {}) }), _jsx(Route, { path: "/mallManagement/couponMgt", element: _jsx(CouponPage, {}) }), _jsx(Route, { path: "/mallManagement/couponMgt/edit", element: _jsx(CouponPage, {}) }), _jsx(Route, { path: "/mallManagement/hotelProduct", element: _jsx(HotelProductPage, {}) }), _jsx(Route, { path: "/mallManagement/hotelProduct/edit", element: _jsx(HotelProductPage, {}) }), _jsx(Route, { path: "/mallManagement/weapp/decorate", element: _jsx(BrandWebsitePage, {}) }), _jsx(Route, { path: "/mallManagement/distribution", element: _jsx(FullMarketingPage, {}) }), _jsx(Route, { path: "/setting/localRoomTypeProductionSetting", element: _jsx(CalendarRoomPage, {}) }), _jsx(Route, { path: "/setting/localRoomTypeProductionSetting/channelGoodsSetting", element: _jsx(CalendarRoomPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo/floor", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo/floor/*", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo/floors", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo/floorManage", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo/tag", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo/tag/*", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo/tags", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo/tagManage", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/roomTypeInfo/edit", element: _jsx(RoomTypeInfoPage, {}) }), _jsx(Route, { path: "/setting/picturesAndVideos", element: _jsx(PicturesVideosPage, {}) }), _jsx(Route, { path: "/setting/imSetting", element: _jsx(ImSettingPage, {}) }), _jsx(Route, { path: "/setting/notification", element: _jsx(NotificationCenterPage, {}) }), _jsx(Route, { path: "/setting/wechatPushSetting", element: _jsx(NotificationSettingPage, {}) }), _jsx(Route, { path: "/setting/customChannel", element: _jsx(CustomChannelPage, {}) }), _jsx(Route, { path: "/setting/paymentSetting", element: _jsx(PaymentSettingPage, {}) }), _jsx(Route, { path: "/setting/balanceAndTemplate", element: _jsx(SmsSettingPage, {}) }), _jsx(Route, { path: "/setting/expendSetting", element: _jsx(ExpendSettingPage, {}) }), _jsx(Route, { path: "/setting/writeExpendSetting", element: _jsx(WriteExpendSettingPage, {}) }), _jsx(Route, { path: "/setting/sortSetting", element: _jsx(SortSettingPage, {}) }), _jsx(Route, { path: "/setting/finance", element: _jsx(FinanceSettingPage, {}) }), _jsx(Route, { path: "/setting/IntelligenceSetting", element: _jsx(AutoStrategySettingPage, {}) }), _jsx(Route, { path: "/setting/shiftSetting", element: _jsx(ShiftSettingPage, {}) }), _jsx(Route, { path: "/setting/print", element: _jsx(PrintSettingPage, {}) }), _jsx(Route, { path: "/setting/role", element: _jsx(PermissionSettingPage, {}) }), _jsx(Route, { path: "/setting/member", element: _jsx(MemberSettingPage, {}) }), _jsx(Route, { path: "/setting/member/actions", element: _jsx(MemberSettingPage, {}) }), _jsx(Route, { path: "/version/myBenefit", element: _jsx(MyBenefitPage, {}) }), _jsx(Route, { path: "/version/displacementBenefit", element: _jsx(SubscriptionDisplacementBenefitPage, {}) }), _jsx(Route, { path: "/version/subscriptionCenter", element: _jsx(VersionSubscriptionPage, {}) }), _jsx(Route, { path: "/version/applicationPayment", element: _jsx(ApplicationPaymentPage, {}) }), _jsx(Route, { path: "/version/applicationPayment/detail", element: _jsx(ApplicationPaymentDetailPage, {}) }), _jsx(Route, { path: "/version/localsMall", element: _jsx(LocalsMallPage, {}) }), _jsx(Route, { path: "/version/localsMall/detail", element: _jsx(LocalsMallPage, {}) }), _jsx(Route, { path: "/channels/ota", element: _jsx(OtaPage, {}) }), _jsx(Route, { path: "/channels/ota/log", element: _jsx(OtaPage, {}) }), _jsx(Route, { path: "/channels/ota/detail", element: _jsx(OtaPage, {}) }), _jsx(Route, { path: "/channels/social", element: _jsx(SocialPage, {}) }), _jsx(Route, { path: "/channels/social/setting", element: _jsx(SocialSettingPage, {}) }), _jsx(Route, { path: "/channels/private", element: _jsx(PrivatePage, {}) }), _jsx(Route, { path: "/channels/private/program", element: _jsx(BrandWebsitePage, { variant: "program" }) }), _jsx(Route, { path: "/channels/private/setting/weComSetting", element: _jsx(PrivatePage, {}) }), _jsx(Route, { path: "/channels/private/setting/authorizationSettings", element: _jsx(PrivatePage, {}) }), _jsx(Route, { path: "/setting/weComSetting", element: _jsx(PrivatePage, {}) }), _jsx(Route, { path: "/setting/authorizationSettings", element: _jsx(PrivatePage, {}) }), _jsx(Route, { path: "/channels/distribution/distributionSecond", element: _jsx(DistributionListPage, {}) }), _jsx(Route, { path: "/channels/distribution/distributiondisplacement", element: _jsx(DistributionDisplacementPage, {}) }), _jsx(Route, { path: "/channels/distribution/distributionOrderSettlement", element: _jsx(DistributionOrderPage, {}) }), _jsx(Route, { path: "/scrm/general", element: _jsx(ScrmGeneralPage, {}) }), _jsx(Route, { path: "/scrm/memberCenter/level", element: _jsx(ScrmMemberLevelPage, {}) }), _jsx(Route, { path: "/scrm/memberCenter/integrate", element: _jsx(MemberPointsPage, {}) }), _jsx(Route, { path: "/scrm/memberCenter/equity", element: _jsx(MemberEquityPage, {}) }), _jsx(Route, { path: "/scrm/sidebarPreview", element: _jsx(ScrmSidebarPreviewPage, {}) }), _jsx(Route, { path: "/scrm/sidebar/preview", element: _jsx(ScrmSidebarPreviewPage, {}) }), _jsx(Route, { path: "/scrm/wechatService/manage", element: _jsx(WechatServicePage, {}) }), _jsx(Route, { path: "/scrm/wechatService/receptionConfig", element: _jsx(ReceptionConfigPage, {}) }), _jsx(Route, { path: "/scrm/marketing/customer", element: _jsx(CustomerMarketingPage, {}) }), _jsx(Route, { path: "/customer/list", element: _jsx(CustomerListPage, {}) }), _jsx(Route, { path: "/customer/list/detail", element: _jsx(CustomerDetailPage, {}) }), _jsx(Route, { path: "/customer/tag", element: _jsx(CustomerTagPage, {}) }), _jsx(Route, { path: "/customer/addBatch", element: _jsx(CustomerAddBatchPage, {}) }), _jsx(Route, { path: "/customer/staffList", element: _jsx(StaffListPage, {}) }), _jsx(Route, { path: "/channels/globalRadar/globalData", element: _jsx(AiRadarPage, {}) }), _jsx(Route, { path: "/channels/globalRadar/globalSetting", element: _jsx(GlobalSettingPage, {}) }), _jsx(Route, { path: "/smartHotel/smartHome", element: _jsx(SmartSelfCheckinPage, {}) }), _jsx(Route, { path: "/smartHotel/checkInGuide", element: _jsx(SmartHotelGlobalSettingPage, {}) }), _jsx(Route, { path: "/smartHotel/smartSettings", element: _jsx(SmartHotelSettingsPage, {}) }), _jsx(Route, { path: "/smartHotel/smartHardware/mall", element: _jsx(SmartHardwareMallPage, {}) }), _jsx(Route, { path: "/smartHotel/smartHardware/mall/detail", element: _jsx(SmartHardwareMallPage, {}) }), _jsx(Route, { path: "/smartHotel/smartHardware/smartLook", element: _jsx(SmartDoorLockPage, {}) }), _jsx(Route, { path: "/smartHotel/smartHardware/IDCardReader", element: _jsx(SmartIdCardReaderPage, {}) }), _jsx(Route, { path: "/psb/list", element: _jsx(PsbPolicePage, {}) }), _jsx(Route, { path: "/psb/log", element: _jsx(PsbLogPage, {}) }), _jsx(Route, { path: "/statistics/report", element: _jsx(ReportPage, {}) }), _jsx(Route, { path: "/statistics/stay", element: _jsx(IncomeReportPage, {}) }), _jsx(Route, { path: "/statistics/sale", element: _jsx(SalesReportPage, {}) }), _jsx(Route, { path: "/statistics/ledger", element: _jsx(LedgerEntryPage, {}) }), _jsx(Route, { path: "/statistics/orderLedger", element: _jsx(OrderLedgerPage, {}) }), _jsx(Route, { path: "/statistics/statementOrder", element: _jsx(StatementOrderPage, {}) }), _jsx(Route, { path: "/statistics/shift/record", element: _jsx(ShiftRecordPage, {}) }), _jsx(Route, { path: "/statistics/totalLedger", element: _jsx(TotalLedgerPage, {}) }), _jsx(Route, { path: "/statistics/profitReport", element: _jsx(ProfitReportPage, {}) }), _jsx(Route, { path: "/statistics/Comprehensive", element: _jsx(ComprehensiveMonthlyReportPage, {}) }), _jsx(Route, { path: "/statistics/Comprehensive/Monthly", element: _jsx(ComprehensiveMonthlyReportPage, {}) }), _jsx(Route, { path: "/statistics/roomSituation", element: _jsx(RoomSituationPage, {}) }), _jsx(Route, { path: "/statistics/presale", element: _jsx(PresaleSalesReportPage, {}) }), _jsx(Route, { path: "/statistics/preSaleCouponMall", element: _jsx(PresaleCouponMallReportPage, {}) }), _jsx(Route, { path: "/statistics/distributionOrder", element: _jsx(StatisticsDistributionOrderPage, {}) }), _jsx(Route, { path: "/CompanySetting/Apikeys", element: _jsx(ApiKeysPage, {}) }), _jsx(Route, { path: "/CompanySetting/CompanyInfo", element: _jsx(CompanyInfoPage, {}) }), _jsx(Route, { path: "/InformationMaintenance/informationOvervie", element: _jsx(Navigate, { to: "/InformationMaintenance/informationOverview", replace: true }) }), _jsx(Route, { path: "/InformationMaintenance/informationOverview", element: _jsx(InformationOverviewPage, {}) }), _jsx(Route, { path: "/InformationMaintenance/campInfo", element: _jsx(CampInfoPage, {}) }), _jsx(Route, { path: "/InformationMaintenance/campInfo/detail", element: _jsx(CampInfoPage, {}) }), _jsx(Route, { path: "/InformationMaintenance/campInfo/edit", element: _jsx(CampInfoPage, {}) }), _jsx(Route, { path: "/InformationMaintenance/campInfo/sort", element: _jsx(CampInfoPage, {}) }), _jsx(Route, { path: "/InformationMaintenance/companyInfo", element: _jsx(Navigate, { to: "/CompanySetting/CompanyInfo", replace: true }) }), _jsx(Route, { path: "/InformationMaintenance/qualification", element: _jsx(CompanyQualificationPage, {}) }), _jsx(Route, { path: "/InformationMaintenance/*", element: _jsx(InformationOverviewPage, {}) }), _jsx(Route, { path: "*", element: _jsx(PlaceholderPage, { title: pageTitle, description: "\u5F53\u524D\u8DEF\u5F84\u672A\u63A5\u5165\u5177\u4F53\u9875\u9762\uFF0C\u8BF7\u7EE7\u7EED\u8865\u5145\u5BF9\u5E94\u8DEF\u7531\u6216\u9875\u9762\u5B9E\u73B0\u3002" }) })] }) }));
}
function resolvePageTitle(pathname, search) {
    if (pathname === '/version/applicationPayment/detail') {
        const app = new URLSearchParams(search).get('app');
        if (app === 'smartPricing')
            return '智能调价';
        if (app === 'globalRadar')
            return '全域雷达';
        if (app === 'douyin')
            return '抖音直连';
        if (app === 'im')
            return '会话升级版';
    }
    if (pageTitles[pathname])
        return pageTitles[pathname];
    if (pathname.startsWith('/InformationMaintenance/'))
        return '设置';
    if (pathname.startsWith('/channels/private/'))
        return '私域';
    if (pathname.startsWith('/version/'))
        return '订阅中心';
    if (pathname.startsWith('/setting/'))
        return '设置';
    if (pathname.startsWith('/scrm/') || pathname.startsWith('/customer/'))
        return 'SCRM';
    if (pathname.startsWith('/cleanManage/'))
        return '保洁管理';
    if (pathname.startsWith('/statistics/'))
        return '报表';
    if (pathname.startsWith('/smartHotel/') || pathname.startsWith('/psb/'))
        return '智慧酒店';
    return 'PMS 页面';
}
function normalizePath(pathname) {
    if (pathname === '/')
        return pathname;
    return pathname.replace(/\/+$/, '');
}
function PlaceholderPage({ title, description }) {
    return (_jsxs("section", { style: {
            minHeight: 'calc(100vh - 58px)',
            padding: '32px',
            borderRadius: '16px',
            background: '#fff',
        }, children: [_jsx("p", { style: { margin: 0, color: '#667085', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }, children: "PMS Clone" }), _jsx("h1", { style: { margin: '12px 0 0', fontSize: '32px' }, children: title }), _jsx("p", { style: { margin: '12px 0 0', maxWidth: '720px', color: '#475467', lineHeight: 1.7 }, children: description })] }));
}
export default RoutedApp;
