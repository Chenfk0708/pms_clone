export const STAFF_LIST_PROVIDER = 'mock';
export const STAFF_LIST_ENDPOINT = '/customer/staffList/bootstrap';
export const STAFF_LIST_TARGET_URL = 'https://minsubao.localhome.cn/customer/staffList';
export class StaffListServiceError extends Error {
    provider;
    request;
    response;
    constructor(provider, request, response) {
        super(response.message);
        this.name = 'StaffListServiceError';
        this.provider = provider;
        this.request = request;
        this.response = response;
    }
}
const generatedAt = '2026-05-19T10:00:00+08:00';
const defaultQuery = {
    campId: '1796067693589061634',
    scene: 'subscription-gate',
    productCode: 'scrm',
};
const baseData = {
    hero: {
        logoSrc: '/scrm-assets/brand-scrm-logo.png',
        title: '企微SCRM-员工管理',
        description: '实时获取企业微信员工，实现员工管理',
        actionText: '立即开通',
        badgeText: '限时免费',
    },
    detail: {
        title: '商品详情',
        images: [
            {
                id: 'hero',
                src: '/scrm-assets/brand-promotion-scrm-hero.png',
                alt: '企微SCRM高效获客留存',
            },
            {
                id: 'automation',
                src: '/scrm-assets/brand-promotion-scrm-auto.png',
                alt: '企微SCRM全自动留存用户',
            },
            {
                id: 'wechat',
                src: '/scrm-assets/brand-promotion-scrm-wechat.png',
                alt: '企微SCRM企业微信沟通转化',
            },
        ],
    },
    emptyState: {
        title: '暂未配置企微员工管理订阅信息',
        description: '当前门店暂未配置企微员工管理订阅信息，请先前往订阅中心完成上架或续费。',
    },
    routeTargets: {
        paymentDetail: '/version/applicationPayment/detail',
    },
};
export function resolveStaffListRuntimeConfig(location) {
    const searchParams = new URLSearchParams(location.search);
    const providerFromSearch = searchParams.get('staffListProvider');
    const stateFromSearch = searchParams.get('staffListMockState');
    return {
        provider: normalizeProvider(providerFromSearch) ?? normalizeProvider(readStorageValue('pms.staffList.provider')),
        mockState: normalizeMockState(stateFromSearch) ?? normalizeMockState(readStorageValue('pms.staffList.mockState')),
    };
}
export function createDefaultStaffListQuery(overrides = {}) {
    return {
        ...defaultQuery,
        provider: overrides.provider,
        mockState: overrides.mockState,
    };
}
export function buildStaffListRequest(query) {
    return {
        campId: query.campId,
        scene: query.scene,
        productCode: query.productCode,
    };
}
export async function loadStaffListViewModel(query, signal) {
    const provider = query.provider ?? resolveProvider();
    const mockState = query.mockState ?? resolveMockState();
    const request = buildStaffListRequest(query);
    await delay(160, signal);
    if (provider === 'api') {
        throw new StaffListServiceError(provider, request, {
            code: 503,
            message: '企微员工管理订阅信息暂时不可用，请稍后重试。',
            data: baseData,
            traceId: 'api-scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao-unavailable-001',
            timestamp: new Date().toISOString(),
        });
    }
    if (mockState === 'error') {
        throw new StaffListServiceError(provider, request, createEnvelope(mockState, 503, '企微员工管理订阅信息加载失败，请稍后重试。'));
    }
    const response = mockState === 'empty'
        ? createEnvelope(mockState, 0, 'success', {
            ...baseData,
            detail: {
                ...baseData.detail,
                images: [],
            },
        })
        : createEnvelope(mockState, 0, 'success');
    return adaptStaffListEnvelope(provider, request, response, mockState);
}
function adaptStaffListEnvelope(provider, request, response, state) {
    if (response.code !== 0) {
        throw new StaffListServiceError(provider, request, response);
    }
    return {
        ...response.data,
        provider,
        state,
        endpoint: STAFF_LIST_ENDPOINT,
        traceId: response.traceId,
        timestamp: response.timestamp,
        request,
    };
}
function createEnvelope(state, code, message, data = baseData) {
    return {
        code,
        message,
        data,
        traceId: `mock-scrm--qiwei-yuangong-guanli--qiwei-yuangong-liebiao-${state}-001`,
        timestamp: generatedAt,
    };
}
function delay(ms, signal) {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
function readStorageValue(key) {
    if (typeof window === 'undefined')
        return null;
    return window.localStorage.getItem(key);
}
function resolveProvider() {
    return normalizeProvider(readStorageValue('pms.staffList.provider')) ?? STAFF_LIST_PROVIDER;
}
function resolveMockState() {
    return normalizeMockState(readStorageValue('pms.staffList.mockState')) ?? 'success';
}
function normalizeProvider(value) {
    return value === 'api' || value === 'mock' ? value : undefined;
}
function normalizeMockState(value) {
    return value === 'empty' || value === 'error' || value === 'success' ? value : undefined;
}
