const timestamp = '2026-05-18T10:00:00+08:00';
const endpoint = '/mallManagement/weapp/decorate/overview/get';
const stores = [
    { id: 'camp-ts5', name: '宿银' },
    { id: 'camp-hotel', name: '南山电竞酒店' },
    { id: 'camp-resort', name: '海岸露营地' },
];
const templates = [
    {
        id: 'camping',
        name: '露营地主题模板',
        scene: '户外露营、亲子团建、活动预约',
        status: 'using',
        colors: ['#ee5263', '#7c8a83', '#e75264'],
        previewImage: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0469557016661888.png',
        profileImage: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0386037526210836.png',
    },
    {
        id: 'hotel',
        name: '酒店主题模板',
        scene: '酒店预订、套餐售卖、会员转化',
        status: 'available',
        colors: ['#f05767', '#78877f', '#dc4d61'],
        previewImage: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/6610922389666490.png',
        profileImage: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0386037526210836.png',
    },
    {
        id: 'homestay',
        name: '民宿主题模板',
        scene: '民宿展示、房源搜索、私域复购',
        status: 'available',
        colors: ['#ef5363', '#7b887f', '#e24f63'],
        previewImage: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/4103834076457345.png',
        profileImage: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0386037526210836.png',
    },
    {
        id: 'default',
        name: '默认模板',
        scene: '标准官网、快速上线、通用门店',
        status: 'available',
        colors: ['#eb5363', '#76867e', '#dc4e60'],
        previewImage: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/9688575736882047.png',
        profileImage: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0386037526210836.png',
    },
];
const baseData = {
    camp: stores[0],
    stores,
    businessDate: '2026-05-18',
    metrics: [
        { id: 'visits', label: '今日访问', value: '1,286', unit: '次', trend: '较昨日 +12.4%' },
        { id: 'orders', label: '官网订单', value: '38', unit: '单', trend: '转化率 4.8%' },
        { id: 'sales', label: '套餐成交', value: '26,840', unit: '元', trend: '客单价 706 元' },
        { id: 'members', label: '新增会员', value: '73', unit: '人', trend: '私域留存 61%' },
    ],
    templates,
    coupons: [
        {
            id: 'coupon-spring',
            name: '春季连住券',
            status: 'active',
            validPeriod: '2026-05-01 至 2026-06-30',
            wechatViews: 482,
            douyinViews: 136,
            redbookViews: 92,
        },
        {
            id: 'coupon-family',
            name: '亲子套餐券',
            status: 'scheduled',
            validPeriod: '2026-06-01 至 2026-08-31',
            wechatViews: 260,
            douyinViews: 88,
            redbookViews: 51,
        },
    ],
    todos: [
        { id: 'todo-nav', title: '检查底部导航跳转', owner: '运营组', dueText: '今日 18:00 前' },
        { id: 'todo-coupon', title: '确认领券活动素材', owner: '市场组', dueText: '明日 12:00 前' },
        { id: 'todo-style', title: '同步官网主色到小程序', owner: '设计组', dueText: '本周内' },
    ],
    routeTargets: [
        { label: '房态', path: '/houseManage/days' },
        { label: '订单', path: '/mallManagement/orderManagement' },
        { label: '套餐', path: '/mallManagement/hotelProduct' },
        { label: '设置', path: '/InformationMaintenance/campInfo' },
    ],
    pageConfig: {
        storeName: '宿银',
        heroTitle: '住进城市里的露营地',
        primaryColor: '#405f9e',
        bottomNavigation: [
            { id: 'home', label: '首页' },
            { id: 'contact', label: '联系房东' },
            { id: 'profile', label: '个人中心' },
        ],
        floatingButtonEnabled: false,
        popupEnabled: false,
    },
};
export function loadBrandWebsiteData(query = {}) {
    const provider = resolveProvider();
    const scenario = resolveMockMode();
    const normalized = normalizeQuery(query);
    const response = createMockBrandWebsiteResponse(normalized, scenario);
    if (provider === 'api') {
        return adaptBrandWebsiteResponse(response, normalized, provider, scenario);
    }
    return adaptBrandWebsiteResponse(response, normalized, provider, scenario);
}
export function createMockBrandWebsiteResponse(query, scenario) {
    if (scenario === 'error') {
        return {
            code: 50029,
            message: '品牌官网数据加载失败',
            data: null,
            traceId: 'mock-ota--siyu--pinpai-guanwang-error-001',
            timestamp,
        };
    }
    const camp = stores.find((item) => item.id === query.campId) ?? stores[0];
    const keyword = query.keyword.trim();
    const coupons = scenario === 'empty' ? [] : filterCoupons(baseData.coupons, keyword);
    const data = {
        ...baseData,
        camp,
        businessDate: query.businessDate,
        coupons,
        templates: scenario === 'empty' ? [] : baseData.templates,
        metrics: camp.id === 'camp-hotel'
            ? [
                { id: 'visits', label: '今日访问', value: '1,064', unit: '次', trend: '酒店渠道 +8.1%' },
                { id: 'orders', label: '官网订单', value: '44', unit: '单', trend: '转化率 5.2%' },
                { id: 'sales', label: '套餐成交', value: '31,920', unit: '元', trend: '客单价 725 元' },
                { id: 'members', label: '新增会员', value: '58', unit: '人', trend: '私域留存 57%' },
            ]
            : baseData.metrics,
        pageConfig: {
            ...baseData.pageConfig,
            storeName: camp.name,
            heroTitle: camp.id === 'camp-hotel' ? '电竞套房限时热卖' : baseData.pageConfig.heroTitle,
        },
    };
    return {
        code: 0,
        message: 'success',
        data,
        traceId: scenario === 'empty'
            ? 'mock-ota--siyu--pinpai-guanwang-empty-001'
            : 'mock-ota--siyu--pinpai-guanwang-list-001',
        timestamp,
    };
}
function adaptBrandWebsiteResponse(response, query, provider, scenario) {
    if (response.code !== 0 || !response.data) {
        throw new Error(response.message || '品牌官网数据加载失败');
    }
    return {
        ...response.data,
        contract: {
            provider,
            scenario,
            traceId: response.traceId,
            request: {
                path: endpoint,
                method: 'POST',
                body: query,
            },
        },
    };
}
function filterCoupons(coupons, keyword) {
    if (!keyword)
        return coupons;
    return coupons.filter((item) => item.name.includes(keyword));
}
function normalizeQuery(query) {
    return {
        campId: query.campId || 'camp-ts5',
        businessDate: query.businessDate || '2026-05-18',
        keyword: query.keyword || '',
    };
}
function resolveProvider() {
    const configured = readRuntimeConfig('pms.brandWebsiteProvider') || import.meta.env.VITE_BRAND_WEBSITE_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function resolveMockMode() {
    const configured = readRuntimeConfig('pms.brandWebsiteMockMode') || import.meta.env.VITE_BRAND_WEBSITE_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
