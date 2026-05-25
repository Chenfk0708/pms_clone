export const MY_BENEFIT_DASHBOARD_ENDPOINT = '/edition/resource/get';
export const MY_BENEFIT_EXPORT_ENDPOINT = '/version/myBenefit/export';
export const MY_BENEFIT_RENEW_ENDPOINT = '/version/myBenefit/renew';
export const MY_BENEFIT_EXPAND_ENDPOINT = '/version/myBenefit/expand';
const TASK_ID = 'yingyong-dingyue--quanyi-yu-dingyue--wode-quanyi';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_TIMESTAMP = '2026-05-19T19:40:00+08:00';
export function resolveMyBenefitRuntimeConfig(location) {
    const params = new URLSearchParams(location.search);
    const provider = params.get('myBenefitProvider');
    const mockState = params.get('myBenefitMockState');
    const activeTab = params.get('tab');
    return {
        provider: provider === 'api' || provider === 'mock' ? provider : undefined,
        mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
        activeTab: activeTab === 'services' || activeTab === 'records' ? activeTab : 'resources',
    };
}
export function resolveMyBenefitProvider() {
    const configured = readRuntimeConfig('pms.myBenefitProvider') || import.meta.env.VITE_MY_BENEFIT_PROVIDER;
    return configured === 'api' ? 'api' : 'mock';
}
export function createDefaultMyBenefitQuery(location = window.location) {
    const runtime = resolveMyBenefitRuntimeConfig(location);
    return {
        provider: runtime.provider,
        mockState: runtime.mockState,
        campId: DEFAULT_CAMP_ID,
        activeTab: runtime.activeTab ?? 'resources',
    };
}
export async function fetchMyBenefitDashboard(query, signal) {
    const provider = query.provider ?? resolveMyBenefitProvider();
    const state = query.mockState ?? readMyBenefitMockState();
    const request = buildMyBenefitRequest(query);
    const envelope = provider === 'api'
        ? await fetchApiMyBenefit(state, request, signal)
        : await fetchMockMyBenefit(state, request, signal);
    const diagnostics = {
        endpoint: MY_BENEFIT_DASHBOARD_ENDPOINT,
        provider,
        state,
        traceId: envelope.traceId,
        request,
    };
    writeDiagnostics(diagnostics);
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '我的权益加载失败，请稍后重试');
    }
    return {
        view: {
            ...envelope.data,
            provider,
            state,
        },
        diagnostics,
    };
}
export function createMyBenefitExportTask(query) {
    return createTask(query, MY_BENEFIT_EXPORT_ENDPOINT, 'mock-export', 'EXPORT-MY-BENEFIT-20260519-001');
}
export function createMyBenefitRenewTask(query) {
    return createTask(query, MY_BENEFIT_RENEW_ENDPOINT, 'mock-renew', 'RENEW-MY-BENEFIT-20260519-001');
}
export function createMyBenefitExpandTask(query, resource) {
    const task = createTask(query, MY_BENEFIT_EXPAND_ENDPOINT, `mock-expand-${resource.id}`, 'EXPAND-MY-BENEFIT-20260519-001');
    return {
        ...task,
        resourceId: resource.id,
        resourceName: resource.name,
    };
}
function createTask(query, endpoint, traceSuffix, taskId) {
    const diagnostics = {
        endpoint,
        provider: query.provider ?? resolveMyBenefitProvider(),
        state: query.mockState ?? readMyBenefitMockState(),
        traceId: `${traceSuffix}-${TASK_ID}-001`,
        request: buildMyBenefitRequest(query),
    };
    writeDiagnostics(diagnostics);
    return {
        taskId,
        timestamp: DEFAULT_TIMESTAMP,
        traceId: diagnostics.traceId,
    };
}
function buildMyBenefitRequest(query) {
    return {
        campId: query.campId || DEFAULT_CAMP_ID,
    };
}
function readMyBenefitMockState() {
    const configured = readRuntimeConfig('pms.myBenefitMockState') || import.meta.env.VITE_MY_BENEFIT_MOCK_STATE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
async function fetchMockMyBenefit(state, request, signal) {
    await delay(90, signal);
    if (state === 'error') {
        return {
            code: 50001,
            message: '我的权益加载失败，请稍后重试',
            data: createViewModel([], []),
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    const targetResponse = createMockTargetResponse(String(request.campId || DEFAULT_CAMP_ID));
    const resources = state === 'empty' ? [] : targetResponse.data.resourceGetViews.map(adaptTargetResource);
    const records = state === 'empty' ? [] : createRecords(resources);
    const normalizedState = resources.length === 0 ? 'empty' : 'success';
    return {
        code: 0,
        message: 'success',
        data: createViewModel(resources, records),
        traceId: `mock-${TASK_ID}-${normalizedState === 'empty' ? 'empty' : 'dashboard'}-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
async function fetchApiMyBenefit(_state, _request, signal) {
    await delay(90, signal);
    return {
        code: 50002,
        message: '我的权益加载失败，请稍后重试',
        data: createViewModel([], []),
        traceId: `api-${TASK_ID}-unavailable-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function createViewModel(resources, records) {
    const serviceGroups = createServiceGroups();
    return {
        currentVersionName: '畅享版',
        versionBadge: '当前版本',
        expiresAtText: '2027-09-28',
        refreshedAt: DEFAULT_TIMESTAMP,
        overviewCards: [
            {
                id: 'edition',
                label: '当前版本',
                value: '畅享版',
                detail: '覆盖住宿管理、基础渠道、报表和智慧酒店核心能力。',
            },
            {
                id: 'resources',
                label: '资源项',
                value: String(resources.length),
                detail: '资源数按照目标站的门店、库存、成员账号和渠道直连条目整理。',
            },
            {
                id: 'records',
                label: '开通记录',
                value: String(records.length),
                detail: '保留首购、扩容和系统赠送等关键开通事件，便于追溯。',
            },
            {
                id: 'services',
                label: '功能分组',
                value: String(serviceGroups.length),
                detail: '按专业住宿管理、SCRM、智慧酒店、报表等分组承接快捷入口。',
            },
        ],
        resources,
        serviceGroups,
        records,
        plans: [
            { id: 'standard', name: '标准版', price: '免费使用', tone: 'standard' },
            { id: 'enjoy', name: '畅享版', price: '1388元/一年', oldPrice: '1588元/一年', tag: '特别优惠', tone: 'enjoy', active: true },
            { id: 'advanced', name: '高级版', price: '2388元/一年', oldPrice: '2800元/一年', tag: '特别优惠', tone: 'advanced' },
            { id: 'pro', name: '专业版', price: '4888元/一年', oldPrice: '5800元/一年', tag: '特别优惠', tone: 'pro' },
            { id: 'flagship', name: '旗舰版', price: '8888元/一年', oldPrice: '9800元/一年', tag: '特别优惠', tone: 'flagship' },
            { id: 'custom', name: '定制版', price: '50000元/起', tag: '特别优惠', tone: 'custom' },
        ],
    };
}
function adaptTargetResource(item) {
    const totalText = item.quotaNum == null ? '-' : String(item.quotaNum);
    const usedText = item.usedQuotaView?.usedQuotaNum == null ? '-' : String(item.usedQuotaView.usedQuotaNum);
    const statusText = item.editionStatus === 1 ? '正常' : '停用';
    const expiresText = formatExpiration(item.expirationDate, item.isLongTerm);
    const sourceText = formatResourceFrom(item);
    const detailLines = [
        `资源类型：${item.goodsType === 2 ? '版本订阅资源' : '渠道/服务权益'}`,
        item.usedQuotaView?.campUsedQuotaViews[0]
            ? `已使用门店：${item.usedQuotaView.campUsedQuotaViews[0].campName}（${item.usedQuotaView.campUsedQuotaViews[0].usedQuotaNum}）`
            : '当前为渠道类权益，不区分门店占用数。',
        `权益有效期：${expiresText}`,
    ];
    return {
        id: normalizeId(item.resourceName),
        name: item.resourceName,
        totalText,
        usedText,
        sourceText,
        statusText,
        expiresText,
        actionLabel: item.goodsType === 2 ? '扩容' : null,
        goodsType: item.goodsType,
        detailLines,
    };
}
function formatResourceFrom(item) {
    if (item.goodsType === 2) {
        return `${item.resourceFrom.editionNum ?? 0}${item.isUnlimitedQuotaNum ? '+' : ''}`
            .replace(/^/, '畅享版(')
            .concat(')');
    }
    const details = item.resourceFrom.expandQuotaDetailView;
    if (details.some((detail) => detail.giftType != null)) {
        return '限时体验';
    }
    if (details.some((detail) => detail.payType != null)) {
        return '畅享版 + 扩容 (1)';
    }
    return '畅享版 + 系统赠送 (1)';
}
function formatExpiration(expirationDate, isLongTerm) {
    if (isLongTerm === 1)
        return '无期限';
    if (!expirationDate)
        return '-';
    const date = new Date(expirationDate);
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function createRecords(resources) {
    const coreResources = resources.filter((resource) => ['门店', '库存', '成员账号'].includes(resource.name));
    const channelResources = resources.filter((resource) => resource.goodsType === 7).slice(0, 3);
    return [
        {
            id: 'record-first-purchase',
            title: '畅享版首购',
            typeLabel: '版本订阅',
            sourceLabel: '首购开通',
            effectiveRange: '2026-09-29 至 2027-09-28',
            statusLabel: '生效中',
            description: '开通畅享版后同步获得门店、库存、成员账号等基础资源配额。',
            orderNo: 'VH202605180001',
            relatedResources: coreResources.map((resource) => resource.name),
        },
        {
            id: 'record-system-gift',
            title: '系统赠送渠道权益',
            typeLabel: '渠道直连',
            sourceLabel: '系统赠送',
            effectiveRange: '2026-09-29 至 2027-09-28',
            statusLabel: '生效中',
            description: '携程直连、美团酒店直连、线上付款等权益由版本订阅附赠。',
            orderNo: 'VH202605180018',
            relatedResources: channelResources.map((resource) => resource.name),
        },
        {
            id: 'record-manual-expand',
            title: '渠道扩容补充',
            typeLabel: '扩容',
            sourceLabel: '人工补充',
            effectiveRange: '无期限',
            statusLabel: '生效中',
            description: '木鸟、小猪等渠道通过扩容补充，便于后续门店规模扩大时复用。',
            orderNo: 'VH202605180089',
            relatedResources: resources.filter((resource) => resource.expiresText === '无期限').map((resource) => resource.name).slice(0, 3),
        },
    ];
}
function createServiceGroups() {
    return [
        {
            id: 'accommodation',
            title: '专业住宿管理',
            items: [
                { id: 'price', label: '智能房态房价', description: '跳转到房价管理，继续调整中央价格与渠道价。', path: '/houseManage/houseCale', badge: '核心' },
                { id: 'orders', label: '订单管理', description: '跳转到住宿订单，继续承接订单和入住管理。', path: '/order/house-order/list' },
                { id: 'calendar', label: '日历房', description: '跳转到日历房，承接库存与售卖产品配置。', path: '/setting/localRoomTypeProductionSetting' },
            ],
        },
        {
            id: 'scrm',
            title: 'SCRM',
            items: [
                { id: 'scrm-general', label: '客户管理', description: '跳转到 SCRM 总览，承接客户与消息场景。', path: '/scrm/general' },
                { id: 'member-level', label: '会员等级', description: '跳转到会员等级，查看会员规则承接。', path: '/scrm/memberCenter/level' },
                { id: 'member-equity', label: '会员权益', description: '跳转到会员权益，承接权益配置场景。', path: '/scrm/memberCenter/equity' },
            ],
        },
        {
            id: 'smart-hotel',
            title: '智慧酒店',
            items: [
                { id: 'checkin', label: '短信自助入住', description: '跳转到自助入住页，承接入住流程配置。', path: '/smartHotel/smartHome' },
                { id: 'lock', label: '直连智能门锁', description: '跳转到智能门锁页，承接门锁接入。', path: '/smartHotel/smartHardware/smartLook' },
                { id: 'psb', label: '公安身份验证', description: '跳转到公安对接页，承接身份验证。', path: '/psb/list' },
            ],
        },
        {
            id: 'report',
            title: '专业报表',
            items: [
                { id: 'overview', label: '统计总览', description: '跳转到统计总览，承接核心报表入口。', path: '/statistics/report' },
                { id: 'income', label: '收入报表', description: '跳转到收入报表，查看营收趋势。', path: '/statistics/stay' },
                { id: 'monthly', label: '综合月报', description: '跳转到综合月报，承接月度经营分析。', path: '/statistics/Comprehensive' },
            ],
        },
    ];
}
function writeDiagnostics(diagnostics) {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem('pms.myBenefit.lastRequest', JSON.stringify(diagnostics));
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function normalizeId(value) {
    return value.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '').toLowerCase();
}
function delay(ms, signal) {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('我的权益请求已取消', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('我的权益请求已取消', 'AbortError'));
        }, { once: true });
    });
}
function createMockTargetResponse(campId) {
    return {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data: {
            editionId: '9',
            editionName: '畅享版',
            editionType: 1,
            resourceGetViews: [
                createQuotaResource('门店', 1, 1, campId, '路客云6TS5的店铺', 1, null, null),
                createQuotaResource('企业', 1, 1, campId, '路客云6TS5的店铺', 1, null, null),
                createQuotaResource('库存', 10, 4, campId, '路客云6TS5的店铺', 10, null, null),
                createQuotaResource('成员账号', 3, 1, campId, '路客云6TS5的店铺', 3, null, null),
                createBenefitResource('携程直连', [{ payType: null, giftType: null, num: 1 }], Date.UTC(2027, 8, 28), 0),
                createBenefitResource('木鸟直连', [{ payType: 1, giftType: null, num: 1 }], Date.UTC(2100, 0, 1), 1),
                createBenefitResource('美团民宿直连', [{ payType: 1, giftType: null, num: 1 }], Date.UTC(2100, 0, 1), 1),
                createBenefitResource('途家直连', [{ payType: 1, giftType: null, num: 1 }], Date.UTC(2100, 0, 1), 1),
                createBenefitResource('飞猪直连', [{ payType: null, giftType: null, num: 1 }], Date.UTC(2027, 8, 28), 0),
                createBenefitResource('Booking', [{ payType: 2, giftType: 2, num: 730 }], Date.UTC(2027, 8, 28), 0),
                createBenefitResource('美团酒店直连', [{ payType: null, giftType: null, num: 1 }], Date.UTC(2027, 8, 28), 0),
                createBenefitResource('小猪直连', [{ payType: 1, giftType: null, num: 1 }], Date.UTC(2100, 0, 1), 1),
                createBenefitResource('线上付款', [{ payType: null, giftType: null, num: 1 }], Date.UTC(2027, 8, 28), 0),
                createBenefitResource('抖音直连', [{ payType: 2, giftType: 2, num: 730 }], Date.UTC(2027, 8, 28), 0),
            ],
            valueAddServices: null,
        },
    };
}
function createQuotaResource(resourceName, quotaNum, usedQuotaNum, campId, campName, editionNum, expirationDate, isLongTerm) {
    return {
        resourceName,
        quotaNum,
        isUnlimitedQuotaNum: 0,
        usedQuotaView: {
            usedQuotaNum,
            campUsedQuotaViews: [{ campId, campName, usedQuotaNum }],
        },
        resourceFrom: {
            editionNum,
            isUnlimitedEditionNum: 0,
            expandQuotaNum: 0,
            expandQuotaDetailView: [],
        },
        editionStatus: 1,
        goodsType: 2,
        expirationDate,
        isLongTerm,
    };
}
function createBenefitResource(resourceName, expandQuotaDetailView, expirationDate, isLongTerm) {
    return {
        resourceName,
        quotaNum: null,
        isUnlimitedQuotaNum: null,
        usedQuotaView: null,
        resourceFrom: {
            editionNum: null,
            isUnlimitedEditionNum: null,
            expandQuotaNum: null,
            expandQuotaDetailView,
        },
        editionStatus: 1,
        goodsType: 7,
        expirationDate,
        isLongTerm,
    };
}
