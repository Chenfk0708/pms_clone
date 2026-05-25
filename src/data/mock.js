export const topNav = [
    { label: '首页', path: '/workspace' },
    { label: '房态', path: '/houseManage/months' },
    { label: '房价', path: '/houseManage/houseCale' },
    { label: '订单', path: '/order/house-order/list' },
    { label: '售卖/产品', path: '/setting/localRoomTypeProductionSetting' },
    { label: 'OTA', path: '/channels/ota' },
    { label: '社媒', path: '/channels/social' },
    { label: '私域', path: '/channels/private' },
    { label: '聚合分销', path: '/channels/distribution/distributionSecond', badge: 'HOT' },
    { label: 'SCRM', path: '/scrm/general' },
    { label: 'AI全域雷达', path: '/channels/globalRadar/globalData' },
    { label: '智慧酒店', path: '/smartHotel/smartHome' },
    { label: '报表', path: '/statistics/report' },
    { label: '设置', path: '/InformationMaintenance/informationOverview' },
];
export const sideNavByPath = {
    '/workspace': [],
    '/houseManage/months': [
        {
            title: '房态管理',
            items: [
                { label: '月房态', path: '/houseManage/months' },
                { label: '日房态', path: '/houseManage/days' },
                { label: '房态日志', path: '/houseManage/logs/status' },
            ],
        },
        {
            title: '房价管理',
            items: [
                { label: '中央价', path: '/houseManage/houseCale' },
                { label: '渠道RP价', path: '/houseManage/channelPrice' },
                { label: '竞争圈比价', path: '/houseManage/priceComparison' },
                { label: '门市价', path: '/houseManage/retailPrice' },
                { label: '其他价格', path: '/houseManage/otherPrice' },
                { label: '电子房价牌', path: '/houseManage/priceBoard' },
                { label: '调价日志', path: '/houseManage/logs/price' },
            ],
        },
        {
            title: '房情表',
            items: [{ label: '房情表', path: '/houseManage/houseStatus' }],
        },
        {
            title: '保洁管理',
            items: [
                { label: '保洁任务', path: '/cleanManage/cleanTask' },
                { label: '保洁统计', path: '/cleanManage/cleanStatistics' },
                { label: '保洁人员', path: '/cleanManage/cleanStaff' },
                { label: '保洁设置', path: '/cleanManage/cleanSetting' },
                { label: '保洁日志', path: '/cleanManage/cleanLog' },
            ],
        },
    ],
    '/order/house-order/list': [
        {
            title: '住宿订单',
            items: [
                { label: '住宿订单', path: '/order/house-order/list' },
                { label: '长租订单', path: '/order/house-longRental-order/list' },
            ],
        },
        {
            title: '预售券订单',
            items: [
                { label: '预售券订单', path: '/mallManagement/orderManagement' },
                { label: '卡券核销', path: '/mallManagement/verificationManagement' },
                { label: '酒店套餐订单', path: '/mallManagement/hotelPackageOrder' },
            ],
        },
    ],
    '/houseManage/houseCale': [
        {
            title: '房态管理',
            items: [
                { label: '月房态', path: '/houseManage/months' },
                { label: '日房态', path: '/houseManage/days' },
                { label: '房态日志', path: '/houseManage/logs/status' },
            ],
        },
        {
            title: '房价管理',
            items: [
                { label: '中央价', path: '/houseManage/houseCale' },
                { label: '渠道RP价', path: '/houseManage/channelPrice' },
                { label: '竞争圈比价', path: '/houseManage/priceComparison' },
                { label: '门市价', path: '/houseManage/retailPrice' },
                { label: '其他价格', path: '/houseManage/otherPrice' },
                { label: '电子房价牌', path: '/houseManage/priceBoard' },
                { label: '调价日志', path: '/houseManage/logs/price' },
            ],
        },
        {
            title: '房情表',
            items: [{ label: '房情表', path: '/houseManage/houseStatus' }],
        },
        {
            title: '保洁管理',
            items: [
                { label: '保洁任务', path: '/cleanManage/cleanTask' },
                { label: '保洁统计', path: '/cleanManage/cleanStatistics' },
                { label: '保洁人员', path: '/cleanManage/cleanStaff' },
                { label: '保洁设置', path: '/cleanManage/cleanSetting' },
                { label: '保洁日志', path: '/cleanManage/cleanLog' },
            ],
        },
    ],
    '/channels/ota': [
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
            items: [{ label: '私域', path: '/channels/private' }],
        },
    ],
    '/statistics/report': [
        {
            title: '统计报表',
            items: [
                { label: '统计概览', path: '/statistics/report' },
                { label: '收入报表', path: '/statistics/stay' },
                { label: '销况报表', path: '/statistics/sale' },
                { label: '利润报表', path: '/statistics/profitReport' },
                { label: '综合月报', path: '/statistics/Comprehensive' },
            ],
        },
        {
            title: '收支明细表',
            items: [
                { label: '收支汇总', path: '/statistics/totalLedger' },
                { label: '收支明细', path: '/statistics/orderLedger' },
                { label: '记一笔明细', path: '/statistics/ledger' },
            ],
        },
        {
            title: '结算表',
            items: [
                { label: '品牌小程序订单', path: '/statistics/statementOrder' },
                { label: '聚合分销订单', path: '/statistics/distributionOrder' },
            ],
        },
        {
            title: '预售券数据',
            items: [
                { label: '预售券销售统计', path: '/statistics/presale' },
                { label: '预售券核销明细', path: '/statistics/preSaleCouponMall' },
            ],
        },
        {
            title: '交接班',
            items: [{ label: '交接班', path: '/statistics/shift/record' }],
        },
    ],
};
const settingNav = [
    {
        title: '日历房',
        items: [{ label: '日历房', path: '/setting/localRoomTypeProductionSetting' }],
    },
    {
        title: '预售券',
        items: [
            { label: '预售券', path: '/mallManagement/goodsManagement' },
            { label: '酒店套餐', path: '/mallManagement/hotelProduct' },
        ],
    },
];
const scrmNav = [
    {
        title: 'SCRM',
        items: [{ label: '鎬昏', path: '/scrm/general' }],
    },
];
const smartHotelNav = [
    {
        title: '智住管理',
        items: [
            { label: '自助入住', path: '/smartHotel/smartHome' },
            { label: '全局设置', path: '/smartHotel/checkInGuide' },
            { label: '智住小程序', path: '/smartHotel/smartSettings' },
        ],
    },
    {
        title: '智能硬件',
        items: [
            { label: '智能硬件商城', path: '/smartHotel/smartHardware/mall' },
            { label: '智能门锁', path: '/smartHotel/smartHardware/smartLook' },
            { label: '身份证读卡器', path: '/smartHotel/smartHardware/IDCardReader' },
        ],
    },
    {
        title: '公安对接',
        items: [
            { label: 'PSB公安对接', path: '/psb/list' },
            { label: '上报日志', path: '/psb/log' },
        ],
    },
];
const informationNav = [
    {
        title: '璁剧疆',
        items: [{ label: '淇℃伅缁存姢姒傝', path: '/InformationMaintenance/informationOverview' }],
    },
];
const sideNavByPrefix = [
    { prefix: '/houseManage/', groups: sideNavByPath['/houseManage/houseCale'] },
    { prefix: '/cleanManage/', groups: sideNavByPath['/houseManage/months'] },
    { prefix: '/order/', groups: sideNavByPath['/order/house-order/list'] },
    { prefix: '/mallManagement/goodsManagement', groups: settingNav },
    { prefix: '/mallManagement/hotelProduct', groups: settingNav },
    { prefix: '/mallManagement/', groups: sideNavByPath['/order/house-order/list'] },
    { prefix: '/channels/', groups: sideNavByPath['/channels/ota'] },
    { prefix: '/statistics/', groups: sideNavByPath['/statistics/report'] },
    { prefix: '/setting/', groups: settingNav },
    { prefix: '/scrm/', groups: scrmNav },
    { prefix: '/smartHotel/', groups: smartHotelNav },
    { prefix: '/psb/', groups: smartHotelNav },
    { prefix: '/InformationMaintenance/', groups: informationNav },
];
export function resolveSideNav(path) {
    const exactMatch = sideNavByPath[path];
    if (exactMatch)
        return exactMatch;
    const prefixMatch = sideNavByPrefix.find((item) => path.startsWith(item.prefix));
    return prefixMatch?.groups ?? [];
}
export const workspaceMetrics = [
    { label: '预抵', value: '0' },
    { label: '在住', value: '3' },
    { label: '预离', value: '0' },
    { label: '可售', value: '0' },
    { label: '维修房', value: '0' },
    { label: '脏房', value: '1' },
    { label: '异常', value: '920', accent: 'rose' },
    { label: '总营业收入', value: '¥1,103.04', accent: 'orange' },
];
export const revenueMetrics = [
    {
        label: '营业收入',
        value: '¥396',
        detailLeft: '预计总收入 ¥0',
        detailRight: '记一笔 / 其他收入支出 ¥0',
        accent: 'amber',
    },
    {
        label: '入住率OCC',
        value: '50%',
        detailLeft: '已售房间数 2',
        detailRight: '总房数 4',
        accent: 'mint',
    },
    {
        label: '平均客房收益RevPAR',
        value: '¥99',
        detailLeft: '全日房 ¥396',
        detailRight: '钟点房 ¥0',
        accent: 'peach',
    },
    {
        label: '平均房费ADR',
        value: '¥198',
        detailLeft: '入住率OCC 50%',
        detailRight: '平均房费ADR ¥198',
        accent: 'sky',
    },
];
export const donutSlices = [
    { label: '携程', value: '50.00%', color: '#2269df' },
    { label: '途家', value: '25.00%', color: '#ff7a2e' },
    { label: '飞猪淘酒店', value: '25.00%', color: '#f0c56b' },
];
export const houseDates = [
    { date: '05.10', weekday: '日', remaining: '余2间' },
    { date: '05.11', weekday: '一', remaining: '余0间', highlight: true },
    { date: '05.12', weekday: '二', remaining: '余3间' },
    { date: '05.13', weekday: '三', remaining: '余3间' },
    { date: '05.14', weekday: '四', remaining: '余3间' },
    { date: '05.15', weekday: '五', remaining: '余3间' },
    { date: '05.16', weekday: '六', remaining: '余4间' },
    { date: '05.17', weekday: '日', remaining: '余4间' },
];
export const houseRows = [
    {
        roomType: '顶层套房（浴缸巨幕电竞麻将）',
        roomName: '房间1',
        cells: [
            { status: '余1', tone: 'empty' },
            { status: '售罄', tone: 'blocked' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
        ],
    },
    {
        roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomName: '房间1',
        cells: [
            { status: '余1', tone: 'empty' },
            { status: '乔孜琦', note: '途家', price: '¥3,203.1', tone: 'booking-orange' },
            { status: '售罄', tone: 'blocked' },
            { status: '售罄', tone: 'blocked' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
        ],
    },
    {
        roomType: '天落大床电竞套间',
        roomName: '1',
        cells: [
            { status: '王永祥', note: '携程', price: '¥138.65', tone: 'booking-blue' },
            { status: '停用', tone: 'blocked' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
        ],
    },
    {
        roomType: '观影大床房',
        roomName: '房间1',
        cells: [
            { status: '张张', note: '携程', price: '¥163.94', tone: 'booking-blue' },
            { status: '张张', note: '携程', price: '¥163.94', tone: 'booking-blue' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
            { status: '余1', tone: 'empty' },
        ],
    },
];
export const orderQuickFilters = [
    '全部',
    '今日新单',
    '今日预抵',
    '今日在住',
    '今日预离',
    '明日入住',
    '明日退房',
    '待接单',
    '待退款',
    '异常订单',
];
export const orderColumns = [
    '订单号',
    '渠道',
    '订单状态',
    '联系人',
    '手机号',
    '入住类型',
    '房型',
    '房间',
    '门店',
    '入住时间',
    '离开时间',
    '入住状态',
    '售后状态',
    '房费(减佣)',
    '其他消费',
    '房费(含佣)',
    '订单总收入',
    '订单欠款',
    '预订时间',
    '渠道单号',
    '操作',
    '占库存',
    '已排房',
    '计入统计',
];
export const orderRows = [
    {
        orderNo: '2053550785075990529',
        channel: '携程',
        status: '进行中',
        contact: '张**',
        phone: '-',
        stayType: '全日房',
        roomType: '观影大床房',
        room: '房间1',
        store: '天落方城',
        checkInAt: '2026-05-11 15:00',
        leaveAt: '2026-05-12 12:00',
        liveStatus: '入住中',
        afterSaleStatus: '--',
        roomRevenueNet: '163.94',
        otherExpense: '0',
        roomRevenueGross: '211',
        totalRevenue: '211',
        debt: '0',
        bookedAt: '2026-05-11 03:00:34',
        channelOrderNo: '1128',
        stockFlag: '✓',
        roomFlag: '✓',
        planFlag: '✓',
    },
    {
        orderNo: '2053433299810766850',
        channel: '途家',
        status: '进行中',
        contact: '乔**',
        phone: '-',
        stayType: '全日房',
        roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
        room: '房间1',
        store: '天落方城',
        checkInAt: '2026-05-11 15:00',
        leaveAt: '2026-05-16 12:00',
        liveStatus: '入住中',
        afterSaleStatus: '--',
        roomRevenueNet: '3203.1',
        otherExpense: '0',
        roomRevenueGross: '3559',
        totalRevenue: '3559',
        debt: '0',
        bookedAt: '2026-05-10 19:13:38',
        channelOrderNo: '1',
        stockFlag: '✓',
        roomFlag: '✓',
        planFlag: '✓',
    },
    {
        orderNo: '2052953037821870082',
        channel: '飞猪淘酒店',
        status: '进行中',
        contact: '黄**',
        phone: '+86173****3805',
        stayType: '全日房',
        roomType: '顶层套房（浴缸巨幕电竞麻将）',
        room: '-',
        store: '天落方城',
        checkInAt: '2026-05-10 15:00',
        leaveAt: '2026-05-16 12:00',
        liveStatus: '入住中',
        afterSaleStatus: '--',
        roomRevenueNet: '1743.86',
        otherExpense: '0',
        roomRevenueGross: '1863.38',
        totalRevenue: '1863.38',
        debt: '0',
        bookedAt: '2026-05-09 20:15:08',
        channelOrderNo: '***',
        stockFlag: '×',
        roomFlag: '×',
        planFlag: '×',
        needsRoomAssignment: true,
    },
    {
        orderNo: '2052023970676416514',
        channel: '携程',
        status: '已取消',
        contact: '曾**鹏',
        phone: '-',
        stayType: '全日房',
        roomType: '观影大床房',
        room: '-',
        store: '天落方城',
        checkInAt: '2026-05-08 15:00',
        leaveAt: '2026-05-09 12:00',
        liveStatus: '已取消',
        afterSaleStatus: '--',
        roomRevenueNet: '0',
        otherExpense: '0',
        roomRevenueGross: '0',
        totalRevenue: '0',
        debt: '0',
        bookedAt: '2026-05-08 07:28:12',
        channelOrderNo: '***',
        stockFlag: '×',
        roomFlag: '×',
        planFlag: '×',
    },
];
export const priceDates = [
    { date: '05.11', weekday: '一' },
    { date: '05.12', weekday: '二' },
    { date: '05.13', weekday: '三' },
    { date: '05.14', weekday: '四' },
    { date: '05.15', weekday: '五' },
    { date: '05.16', weekday: '六' },
    { date: '05.17', weekday: '日' },
    { date: '05.18', weekday: '一' },
];
export const priceRows = [
    {
        channel: '途家',
        coefficient: '-',
        basePrice: '730',
        prices: ['730', '730', '730', '730', '930', '930', '730', '730'],
        comparePrices: ['768.42', '768.42', '768.42', '768.42', '978.94', '978.94', '768.42', '768.42'],
    },
    {
        channel: '小猪',
        coefficient: '-',
        basePrice: '730',
        prices: ['730', '730', '730', '730', '930', '930', '730', '730'],
        comparePrices: ['730', '730', '730', '730', '930', '930', '730', '730'],
    },
    {
        channel: '携程',
        coefficient: '-',
        basePrice: '-',
        prices: ['-', '-', '-', '-', '-', '-', '-', '-'],
        comparePrices: ['-', '-', '-', '-', '-', '-', '-', '-'],
    },
    {
        channel: '飞猪淘酒店',
        coefficient: '-',
        basePrice: '730',
        prices: ['730', '730', '730', '730', '930', '930', '730', '730'],
        comparePrices: ['376.2', '376.2', '376.2', '376.2', '418.2', '418.2', '376.2', '376.2'],
    },
    {
        channel: '木鸟',
        coefficient: '-',
        basePrice: '730',
        prices: ['730', '730', '730', '730', '930', '930', '730', '730'],
        comparePrices: ['811.11', '811.11', '811.11', '811.11', '1033.33', '1033.33', '811.11', '811.11'],
    },
];
export const otaConnectedCards = [
    { name: '携程', relation: '关联房型4/4' },
    { name: '美团酒店', relation: '关联房型4/4' },
    { name: '飞猪淘酒店', relation: '关联房型4/4' },
    { name: '美团民宿', relation: '关联房型4/4' },
    { name: '途家', relation: '关联房型4/4' },
    { name: '木鸟', relation: '关联房型4/4' },
    { name: '小猪', relation: '关联房型4/4' },
    { name: '路客云聚合', relation: '关联房型4/4' },
];
export const otaPendingCards = [
    { name: '携程玩乐' },
    { name: 'Booking' },
    { name: '携程国际' },
    { name: '爱彼迎' },
    { name: '同程民宿' },
    { name: '58同城' },
    { name: '贝壳' },
    { name: '腾讯地图' },
];
export const reportBusinessCards = [
    { label: '总营业收入', value: '¥396' },
    { label: '住宿', value: '¥0' },
    { label: '餐饮', value: '¥0' },
    { label: '商超', value: '¥0' },
    { label: '娱乐', value: '¥0' },
    { label: '场地', value: '¥0' },
];
export const reportOperationCards = [
    { label: '总营业收入', value: '¥396', detailA: '房费(含佣) ¥396', detailB: '其他消费 ¥0 / 记一笔收入 ¥0' },
    { label: '入住率OCC', value: '50%', detailA: '已售房间数 2', detailB: '总房间数 4' },
    { label: '平均房费ADR', value: '¥198', detailA: '全日房费(含佣) ¥396', detailB: '钟点房费(含佣) ¥0' },
    { label: '平均客房收益RevPAR', value: '¥99', detailA: '入住率OCC 50%', detailB: '平均房费ADR ¥198' },
    { label: '已售房间数', value: '2', detailA: '全日房已售房间数 2', detailB: '钟点房已售房间数 0' },
];
