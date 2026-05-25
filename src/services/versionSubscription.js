const VERSION_SUBSCRIPTION_PROVIDER_KEY = 'pms.versionSubscriptionProvider';
const VERSION_SUBSCRIPTION_STATE_KEY = 'pms.versionSubscriptionMockState';
const VERSION_SUBSCRIPTION_DIAGNOSTIC_KEY = 'pms.versionSubscription.lastRequest';
const VERSION_SUBSCRIPTION_TIMESTAMP = '2026-05-19T19:30:00+08:00';
const DEFAULT_CAMP_ID = '1796067693589061634';
export const VERSION_SUBSCRIPTION_DASHBOARD_PATH = '/edition/resource/get';
export const VERSION_SUBSCRIPTION_CATALOG_PATH = '/weiRoomCategories/page/get';
export const VERSION_SUBSCRIPTION_ORDER_PATH = '/version/subscription/order/submit';
const durations = [
    { id: '1y', label: '一年', multiplier: 1 },
    { id: '2y', label: '两年', multiplier: 2 },
    { id: 'forever', label: '无期限', multiplier: 5 },
];
const featureGroups = [
    {
        title: '专业住宿管理',
        items: [
            { name: '智能房态房价', enabled: true },
            { name: '订单管理', enabled: true },
            { name: '多渠道消息聚合', enabled: true },
            { name: '包栋/联动关房', enabled: true },
            { name: '多岗位协同', enabled: true },
            { name: '支持日历房、多种售卖产品', enabled: true },
            { name: '支持日房态/月房态', enabled: true },
            { name: '线上收付款', enabled: true },
            { name: '房态分享', enabled: true },
            { name: 'AI全域雷达', enabled: false },
            { name: '支持预售券/酒店套餐', enabled: false },
            { name: '智能保洁', enabled: false },
        ],
    },
    {
        title: 'SCRM',
        items: [
            { name: '客户管理', enabled: true },
            { name: '客户标签', enabled: true },
            { name: '企微直连', enabled: false },
        ],
    },
    {
        title: '多端应用',
        items: [
            { name: '电脑端', enabled: true },
            { name: '移动APP', enabled: true },
            { name: '小程序商家端', enabled: true },
        ],
    },
    {
        title: '专业报表',
        items: [
            { name: '基础报表', enabled: true },
            { name: '综合月报', enabled: true },
            { name: '夜审', enabled: true },
            { name: '交接班', enabled: false },
        ],
    },
    {
        title: '智能房价',
        items: [
            { name: '中央价格（一键改价）', enabled: true },
            { name: '实际售卖价模式', enabled: true },
            { name: '竞争圈比价', enabled: false },
            { name: '智能调价', enabled: false },
        ],
    },
    {
        title: '智慧酒店',
        items: [
            { name: '直连智能门锁', enabled: true },
            { name: '短信自助入住', enabled: true },
            { name: '公安身份验证', enabled: true },
            { name: '二维码自助入住', enabled: true },
            { name: '在线押金', enabled: true },
            { name: '制卡门锁直连', enabled: false },
            { name: '自助机入住', enabled: false },
            { name: '电子房价牌', enabled: false },
            { name: '旅业系统对接', enabled: false },
        ],
    },
    {
        title: '民宿渠道',
        items: [
            { name: '美团民宿直连', enabled: true },
            { name: '途家直连', enabled: true },
            { name: '小猪直连', enabled: true },
            { name: '木鸟直连', enabled: true },
        ],
    },
    {
        title: '酒店渠道',
        items: [
            { name: '携程直连', enabled: true },
            { name: '美团酒店直连', enabled: true },
            { name: '飞猪淘酒店直连', enabled: true },
            { name: '飞猪百途直连', enabled: true },
        ],
    },
    {
        title: '国际渠道',
        items: [
            { name: 'booking直连', enabled: false },
            { name: 'airbnb直连', enabled: false },
            { name: 'trip.com直连', enabled: false },
        ],
    },
    {
        title: '社媒渠道',
        items: [
            { name: '抖音直连', enabled: false },
            { name: '抖音共管', enabled: false },
            { name: '视频号', enabled: false },
        ],
    },
    {
        title: '私域渠道',
        items: [
            { name: '品牌小程序', enabled: false },
            { name: '企业微信、公众号', enabled: false },
        ],
    },
    {
        title: '多业态管理',
        items: [
            { name: '住宿营收报表', enabled: true },
            { name: '餐饮营收报表', enabled: true },
            { name: '商超营收报表', enabled: true },
            { name: '娱乐营收报表', enabled: true },
            { name: '场地营收报表', enabled: true },
        ],
    },
    {
        title: '路客云聚合渠道',
        items: [{ name: '路客云聚合渠道', enabled: true }],
    },
    {
        title: '服务特权',
        items: [
            { name: '专业培训', enabled: true },
            { name: '金牌讲师服务', enabled: true },
            { name: '一对一服务', enabled: true },
            { name: '按需定制功能', enabled: false },
        ],
    },
];
export function createDefaultVersionSubscriptionFilters(searchParams = new URLSearchParams()) {
    return {
        campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
        mockState: toMockState(searchParams.get('mockState') || searchParams.get('versionSubscriptionMockState')),
    };
}
export function buildVersionSubscriptionDashboardRequest(filters) {
    return {
        campId: filters.campId,
    };
}
export function buildVersionSubscriptionCatalogRequest(filters) {
    return {
        goodsTypes: [2],
        campId: '64',
        buyCampId: filters.campId,
        roomCategoryTypes: [1],
    };
}
export async function fetchVersionSubscriptionDashboard(filters, provider = getVersionSubscriptionProvider()) {
    validateFilters(filters);
    const diagnostics = {
        provider,
        state: filters.mockState,
        dashboardEndpoint: VERSION_SUBSCRIPTION_DASHBOARD_PATH,
        catalogEndpoint: VERSION_SUBSCRIPTION_CATALOG_PATH,
        dashboardRequest: buildVersionSubscriptionDashboardRequest(filters),
        catalogRequest: buildVersionSubscriptionCatalogRequest(filters),
    };
    writeDiagnostics(diagnostics);
    if (provider === 'api') {
        throw new Error('版本订阅加载失败，请稍后重试');
    }
    await delay(120);
    if (filters.mockState === 'error') {
        throw new Error('版本订阅加载失败，请稍后重试');
    }
    const dashboardEnvelope = createMockDashboardEnvelope(filters);
    const catalogEnvelope = createMockCatalogEnvelope(filters);
    return adaptVersionSubscriptionDashboard(filters, provider, dashboardEnvelope, catalogEnvelope);
}
export async function submitVersionSubscriptionOrder(filters, dashboard, selectedPlanId, durationId, agreed) {
    if (!agreed) {
        throw new Error('请先阅读并同意购买协议');
    }
    const plan = dashboard.plans.find((item) => item.id === selectedPlanId);
    const duration = dashboard.durations.find((item) => item.id === durationId);
    if (!plan || !duration) {
        throw new Error('当前订阅方案不可用，请稍后重试');
    }
    const request = {
        campId: filters.campId,
        editionId: plan.editionId,
        duration: duration.id,
        quantity: duration.multiplier,
    };
    writeDiagnostics({
        provider: dashboard.provider,
        state: dashboard.state,
        dashboardEndpoint: VERSION_SUBSCRIPTION_DASHBOARD_PATH,
        catalogEndpoint: VERSION_SUBSCRIPTION_CATALOG_PATH,
        dashboardRequest: buildVersionSubscriptionDashboardRequest(filters),
        catalogRequest: buildVersionSubscriptionCatalogRequest(filters),
        orderEndpoint: VERSION_SUBSCRIPTION_ORDER_PATH,
        orderRequest: request,
    });
    await delay(120);
    return {
        message: `${plan.name}购买信息已生成`,
        redirectTo: `/version/applicationPayment/detail?plan=${plan.id}&duration=${duration.id}`,
    };
}
export function calculateVersionSubscriptionTotal(dashboard, selectedPlanId, durationId) {
    const plan = dashboard.plans.find((item) => item.id === selectedPlanId);
    const duration = dashboard.durations.find((item) => item.id === durationId);
    if (!plan || !duration)
        return 0;
    return plan.price * duration.multiplier;
}
function adaptVersionSubscriptionDashboard(filters, provider, dashboardEnvelope, catalogEnvelope) {
    if (dashboardEnvelope.code !== 0 || catalogEnvelope.code !== 0) {
        throw new Error(dashboardEnvelope.message || catalogEnvelope.message || '版本订阅加载失败，请稍后重试');
    }
    const dashboardData = dashboardEnvelope.data;
    const catalogData = catalogEnvelope.data;
    if (!dashboardData || !catalogData || !Array.isArray(dashboardData.quotas) || !Array.isArray(catalogData.plans)) {
        throw new Error('版本订阅加载失败，请稍后重试');
    }
    const currentPlan = catalogData.plans.find((item) => item.current) ?? catalogData.plans[0] ?? null;
    return {
        provider,
        state: filters.mockState === 'empty' ? 'empty' : 'success',
        traceId: dashboardEnvelope.traceId,
        requestedAt: dashboardEnvelope.timestamp,
        campId: filters.campId,
        campName: dashboardData.campName,
        buildVersion: dashboardData.buildVersion,
        currentPlanId: currentPlan?.id ?? 'delight',
        currentPlanName: dashboardData.editionName,
        expirationDate: dashboardData.expirationDate,
        quotas: dashboardData.quotas,
        plans: catalogData.plans,
        featureGroups: catalogData.featureGroups,
        durations,
        agreementName: '畅享版购买协议',
        compareSummary: '不同版本按套餐开放不同能力范围，当前页面以版本、资源和功能矩阵统一展示。',
    };
}
function createMockDashboardEnvelope(filters) {
    const quotas = filters.mockState === 'empty'
        ? [
            createQuota('stores', '门店', 0, 0),
            createQuota('companies', '企业', 0, 0),
            createQuota('inventory', '库存', 0, 0),
            createQuota('members', '成员账号', 0, 0),
        ]
        : [
            createQuota('stores', '门店', 1, 1),
            createQuota('companies', '企业', 1, 1),
            createQuota('inventory', '库存', 10, 4),
            createQuota('members', '成员账号', 3, 3),
        ];
    return {
        code: 0,
        message: 'success',
        data: {
            editionId: '9',
            editionName: '畅享版',
            campName: '路客云6TS5的店铺',
            buildVersion: 'v4.10.7',
            expirationDate: '2027-09-28',
            quotas,
        },
        traceId: `mock-yingyong-dingyue--quanyi-yu-dingyue--banben-dingyue-dashboard-${filters.mockState}`,
        timestamp: VERSION_SUBSCRIPTION_TIMESTAMP,
    };
}
function createMockCatalogEnvelope(filters) {
    return {
        code: 0,
        message: 'success',
        data: {
            plans: filters.mockState === 'empty'
                ? []
                : [
                    createPlan('standard', '1', '标准版', 'standard', 0, '免费使用', '', '适合单店基础运营。', false),
                    createPlan('delight', '9', '畅享版', 'delight', 1388, '1388元/一年', '原价:1588元/一年', '当前版本，覆盖住宿管理、基础渠道和专业报表。', true),
                    createPlan('advanced', '2', '高级版', 'advanced', 2388, '2388元/一年', '原价:2800元/一年', '适合多门店运营与增量扩容。', false),
                    createPlan('professional', '3', '专业版', 'professional', 4888, '4888元/一年', '原价:5800元/一年', '适合连锁和高频业务协同。', false),
                    createPlan('flagship', '4', '旗舰版', 'flagship', 8888, '8888元/一年', '原价:9800元/一年', '适合复杂渠道与多业态场景。', false),
                    createPlan('custom', '5', '定制版', 'custom', 50000, '50000元/起', '', '适合集团定制与专属服务。', false),
                ],
            featureGroups: filters.mockState === 'empty' ? [] : featureGroups,
        },
        traceId: `mock-yingyong-dingyue--quanyi-yu-dingyue--banben-dingyue-catalog-${filters.mockState}`,
        timestamp: VERSION_SUBSCRIPTION_TIMESTAMP,
    };
}
function createQuota(id, name, total, used) {
    return {
        id,
        name,
        total,
        used,
        unit: '个',
    };
}
function createPlan(id, editionId, name, tone, price, priceLabel, originalPriceLabel, summary, current) {
    return {
        id,
        editionId,
        name,
        tone,
        current,
        price,
        priceLabel,
        originalPriceLabel,
        badge: '特别优惠',
        summary,
    };
}
function validateFilters(filters) {
    if (!filters.campId) {
        throw new Error('缺少 campId，无法加载版本订阅');
    }
}
function getVersionSubscriptionProvider() {
    if (typeof window === 'undefined')
        return 'mock';
    return window.localStorage.getItem(VERSION_SUBSCRIPTION_PROVIDER_KEY) === 'api' ? 'api' : 'mock';
}
function toMockState(rawValue) {
    if (rawValue === 'empty' || rawValue === 'error')
        return rawValue;
    if (typeof window === 'undefined')
        return 'success';
    const storedValue = window.localStorage.getItem(VERSION_SUBSCRIPTION_STATE_KEY);
    return storedValue === 'empty' || storedValue === 'error' ? storedValue : 'success';
}
function writeDiagnostics(value) {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem(VERSION_SUBSCRIPTION_DIAGNOSTIC_KEY, JSON.stringify(value));
}
function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
