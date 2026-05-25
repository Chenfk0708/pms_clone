const PSB_POLICE_PROVIDER_KEY = 'pms.psbPoliceProvider';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_TIMESTAMP = '2026-05-19T17:20:00+08:00';
export const PSB_SYSTEM_NAME = '广东旅业系统';
const mockStores = [
    {
        poiId: '1796425098638573570',
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
    },
];
const mockRoomCategories = [
    {
        roomCategoryId: 'room-category-001',
        roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
        roomCount: 1,
    },
    {
        roomCategoryId: 'room-category-002',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomCount: 1,
    },
    {
        roomCategoryId: 'room-category-003',
        roomCategoryName: '天落大床电竞套间',
        roomCount: 1,
    },
    {
        roomCategoryId: 'room-category-004',
        roomCategoryName: '观影大床房',
        roomCount: 1,
    },
];
export function createDefaultPsbPoliceFilters(searchParams = new URLSearchParams()) {
    return {
        campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
        mockState: toMockState(searchParams.get('mockState')),
    };
}
export async function fetchPsbPolicePageData(filters, signal, providerName = getPsbPoliceProviderName()) {
    validateFilters(filters);
    if (providerName === 'api') {
        throw new Error('PSB公安对接列表加载失败，请稍后重试');
    }
    await waitForMockLatency(signal);
    if (filters.mockState === 'error') {
        throw new Error('PSB公安对接列表加载失败，请稍后重试');
    }
    const envelope = buildListEnvelope(filters);
    return adaptListEnvelope(envelope, providerName, filters);
}
export async function submitPsbPoliceRegistration(input, filters, signal, providerName = getPsbPoliceProviderName()) {
    validateFilters(filters);
    if (providerName === 'api') {
        throw new Error('PSB公安对接资料提交失败，请稍后重试');
    }
    await waitForMockLatency(signal);
    if (filters.mockState === 'error') {
        throw new Error('PSB公安对接资料提交失败，请稍后重试');
    }
    const selectedStore = mockStores.find((store) => store.poiId === input.poiId) ?? mockStores[0];
    const roomCount = mockRoomCategories.reduce((sum, category) => sum + category.roomCount, 0);
    return {
        traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie-submit-001',
        feedbackMessage: 'PSB公安对接商户已新增',
        createdRow: {
            id: `psb-row-${input.travelBusinessCode}`,
            systemName: input.systemName,
            hotelCode: input.hotelCode,
            typeLabel: '正式对接',
            merchantName: input.merchantName,
            storeName: selectedStore.poiName,
            roomCount,
        },
    };
}
function getPsbPoliceProviderName() {
    if (typeof window === 'undefined')
        return 'mock';
    const configured = window.localStorage.getItem(PSB_POLICE_PROVIDER_KEY);
    return configured === 'api' ? 'api' : 'mock';
}
function buildListEnvelope(filters) {
    const rows = filters.mockState === 'empty' ? [] : [];
    return {
        code: 0,
        message: 'success',
        data: {
            rows,
            stores: mockStores,
            roomCategories: mockRoomCategories,
            pagination: {
                page: 1,
                pageSize: 20,
                total: rows.length,
            },
        },
        traceId: `mock-zhihui-jiudian--zhizhu-yu-yingjian--psb-gongan-duijie-${filters.mockState}-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function adaptListEnvelope(envelope, provider, filters) {
    if (envelope.code !== 0 || !envelope.data) {
        throw new Error(envelope.message || 'PSB公安对接列表加载失败，请稍后重试');
    }
    return {
        provider,
        traceId: envelope.traceId,
        campId: filters.campId,
        rows: envelope.data.rows,
        stores: envelope.data.stores,
        roomCategories: envelope.data.roomCategories,
        pagination: envelope.data.pagination,
        requestSummary: [
            `provider: ${provider}`,
            'list: /account/roomPoliceSubmission/page/get',
            'stores: /select/poi/page/get',
            'rooms: /roomCategories/page/get',
            `traceId: ${envelope.traceId}`,
        ],
    };
}
function validateFilters(filters) {
    if (!filters.campId.trim()) {
        throw new Error('PSB公安对接门店参数不正确');
    }
}
function toMockState(value) {
    return value === 'empty' || value === 'error' ? value : 'success';
}
async function waitForMockLatency(signal) {
    if (signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');
    await new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, 120);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
