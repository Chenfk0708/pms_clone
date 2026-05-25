export const socialConnectedCards = [
    {
        name: '抖音来客',
        relation: '关联房型 0/0',
        support: '支持：日历房、预售券',
        action: '管理渠道',
        accent: 'blue',
    },
];
export const socialPendingCards = [
    { name: '小红书', action: '订阅开通', accent: 'red' },
    { name: '视频号', action: '订阅开通', accent: 'green' },
    { name: '抖音特价酒店', action: '订阅开通', accent: 'orange' },
];
export const privateCards = [
    { name: '企业微信', action: '立即关联', accent: 'blue' },
    { name: '公众号', action: '立即关联', accent: 'green' },
    { name: '品牌小程序', action: '订阅开通', accent: 'green' },
];
export const informationSummaryTags = [
    { label: '中等', tone: 'blue' },
    { label: '超越73%的同行', tone: 'blue' },
];
export const informationRadarMetrics = [
    { label: '门店信息', value: 35 },
    { label: '房型信息', value: 72 },
    { label: '房型设施', value: 60 },
    { label: '资质信息', value: 22 },
    { label: '图片视频', value: 88 },
];
export const informationFlowItems = [
    { name: 'OTA流量', detail: '7/7', accent: 'orange' },
    { name: '社媒流量', detail: '0/3', accent: 'blue' },
    { name: '私域流量', detail: '1/1', accent: 'green' },
];
export const channelSideNav = [
    {
        title: 'OTA',
        items: [{ label: 'OTA', path: '/channels/ota' }],
    },
    {
        title: '社媒',
        items: [{ label: '社媒', path: '/channels/social' }],
    },
    {
        title: '私域',
        items: [
            { label: '私域渠道', path: '/channels/private' },
            { label: '品牌小程序', path: '/channels/private/program' },
        ],
    },
];
export const distributionSideNav = [
    {
        title: '聚合分销',
        items: [
            { label: '分销列表', path: '/channels/distribution/distributionSecond' },
            { label: '聚合分销订单', path: '/channels/distribution/distributionOrderSettlement' },
            { label: '置换权益', path: '/channels/distribution/distributiondisplacement' },
        ],
    },
];
export const globalRadarSideNav = [
    {
        title: '',
        items: [
            { label: '全域数据', path: '/channels/globalRadar/globalData' },
            { label: '配置中心', path: '/channels/globalRadar/globalSetting' },
        ],
    },
];
export const informationSideNav = [
    {
        title: '信息维护',
        items: [
            { label: '信息概览', path: '/InformationMaintenance/informationOverview' },
            { label: '门店信息', path: '/InformationMaintenance/campInfo' },
            { label: '房型信息', path: '/setting/roomTypeInfo' },
            { label: '图片视频', path: '/setting/picturesAndVideos' },
        ],
    },
    {
        title: '企业设置',
        items: [
            { label: '企业信息', path: '/CompanySetting/CompanyInfo' },
            { label: '权限设置', path: '/setting/role' },
            { label: '成员设置', path: '/setting/member' },
            { label: '企业资质', path: '/InformationMaintenance/qualification' },
            { label: 'API keys', path: '/CompanySetting/Apikeys' },
        ],
    },
    {
        title: '通用设置',
        items: [
            { label: '会话设置', path: '/setting/imSetting' },
            { label: '自定义渠道', path: '/setting/customChannel' },
            { label: '支付方式设置', path: '/setting/paymentSetting' },
            { label: '收入/支出设置', path: '/setting/expendSetting' },
            { label: '记一笔设置', path: '/setting/writeExpendSetting' },
            { label: '排序设置', path: '/setting/sortSetting' },
            { label: '通知设置', path: '/setting/wechatPushSetting' },
            { label: '短信设置', path: '/setting/balanceAndTemplate' },
            { label: '财务设置', path: '/setting/finance' },
            { label: '自动策略设置', path: '/setting/IntelligenceSetting' },
            { label: '交接班设置', path: '/setting/shiftSetting' },
            { label: '打印设置', path: '/setting/print' },
        ],
    },
];
export const scrmSideNav = [
    {
        title: '',
        items: [{ label: '客户概况', path: '/scrm/general' }],
    },
    {
        title: '客户管理',
        items: [
            { label: '客户列表', path: '/customer/list' },
            { label: '客户标签', path: '/customer/tag' },
        ],
    },
    {
        title: '会员中心',
        items: [
            { label: '会员等级', path: '/scrm/memberCenter/level' },
            { label: '会员权益', path: '/scrm/memberCenter/equity' },
            { label: '会员积分', path: '/scrm/memberCenter/integrate' },
        ],
    },
    {
        title: '增长获客',
        items: [{ label: '批量加好友', path: '/customer/addBatch' }],
    },
    {
        title: '营销推广',
        items: [
            { label: '优惠券', path: '/mallManagement/couponMgt' },
            { label: '全员营销', path: '/mallManagement/distribution' },
            { label: '客户营销', path: '/scrm/marketing/customer' },
        ],
    },
    {
        title: '客户沟通',
        items: [
            { label: '聊天工具栏', path: '/scrm/sidebarPreview' },
            { label: '微信客服', path: '/scrm/wechatService/manage' },
            { label: '接待配置', path: '/scrm/wechatService/receptionConfig' },
        ],
    },
    {
        title: '企微员工管理',
        items: [{ label: '企微员工列表', path: '/customer/staffList' }],
    },
];
