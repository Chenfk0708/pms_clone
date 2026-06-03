const HUDSON_BASE_URL = '/api';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
const REAL_REQUEST_PATHS = [
    '/camps/get',
    '/select/poi/page/get',
    '/roomCategories/page/get',
    '/roomCategoryPrice/salePriceSetting/get',
    '/systemConfig/price/storesPriceShow/get',
    '/roomCategoryStatuses/roomCategory/get',
];
async function postHudson(endpoint, body, signal) {
    const response = await fetch(`${HUDSON_BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });
    if (!response.ok) {
        throw new Error(`${endpoint} 返回 HTTP ${response.status}`);
    }
    const payload = (await response.json());
    if (payload.success !== true) {
        throw new Error(`${endpoint} 返回业务错误：${payload.errorMsg ?? payload.errorCode ?? '未知错误'}`);
    }
    return payload.data;
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function resolveRetailPriceProviderName() {
    const configured = readRuntimeConfig('pmsRetailPriceProvider') || import.meta.env.VITE_RETAIL_PRICE_PROVIDER;
    return configured === 'real' ? 'real' : 'mock';
}
function resolveRetailPriceMockMode() {
    const configured = readRuntimeConfig('pmsRetailPriceMockMode') || import.meta.env.VITE_RETAIL_PRICE_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function envelope(traceId, data) {
    return {
        code: 0,
        message: 'success',
        data,
        traceId,
        timestamp: MOCK_TIMESTAMP,
    };
}
function errorEnvelope() {
    return {
        code: 50001,
        message: '门市价数据加载失败',
        data: null,
        traceId: 'mock-fangtai--fangjia-guanli--menshijia-error-001',
        timestamp: MOCK_TIMESTAMP,
    };
}
function unwrapEnvelope(response) {
    if (response.code !== 0) {
        throw new Error(`${response.message}（traceId: ${response.traceId}）`);
    }
    return response.data;
}
function asList(value) {
    if (!value || typeof value !== 'object')
        return [];
    const list = value.list;
    return Array.isArray(list) ? list : [];
}
function readCampId(campsData) {
    const camps = campsData?.camps;
    const camp = Array.isArray(camps) ? camps.find((item) => item.campId) : null;
    if (!camp?.campId) {
        throw new Error('/camps/get 未返回可用 campId');
    }
    return { campId: camp.campId, campName: camp.name ?? '当前门店' };
}
export async function loadRetailPriceData(query = {}, signal) {
    if (resolveRetailPriceProviderName() === 'mock') {
        return loadMockRetailPriceData(query);
    }
    const campInfo = readCampId(await postHudson('/camps/get', {}, signal));
    const campId = campInfo.campId;
    const keyword = query.keyword ?? '';
    const today = new Date().toISOString().slice(0, 10);
    const [storesData, roomsData, salePriceSetting, storesPriceShow, statuses] = await Promise.all([
        postHudson('/select/poi/page/get', {
            campId,
            pageSize: 999,
            pageNum: 1,
            channelId: 0,
            isAvailability: '1',
        }, signal),
        postHudson('/roomCategories/page/get', {
            campId,
            pageSize: 999,
            pageNum: 1,
            roomCategoryName: keyword,
            keyword,
            cityIds: [],
            channelId: '',
        }, signal),
        postHudson('/roomCategoryPrice/salePriceSetting/get', { campId }, signal),
        postHudson('/systemConfig/price/storesPriceShow/get', { campId }, signal),
        postHudson('/roomCategoryStatuses/roomCategory/get', {
            campId,
            roomCategoryGroupIds: null,
            roomCategoryProductSaleType: null,
            roomCategoryIds: query.roomCategoryIds?.length ? query.roomCategoryIds : null,
            date: today,
            days: 30,
            poiIds: query.poiIds?.length ? query.poiIds : null,
            isStores: 1,
        }, signal),
    ]);
    return {
        providerName: 'real',
        campId,
        campName: campInfo.campName,
        stores: asList(storesData),
        rooms: asList(roomsData),
        salePriceSetting: salePriceSetting ?? {},
        storesPriceShow,
        statuses,
        requestedAt: new Date().toISOString(),
        traceIds: ['real-hudson-response'],
        requestSummary: REAL_REQUEST_PATHS.map((path) => `POST ${path}`),
    };
}
function loadMockRetailPriceData(query = {}) {
    const mode = resolveRetailPriceMockMode();
    if (mode === 'error') {
        unwrapEnvelope(errorEnvelope());
    }
    const bundle = mode === 'empty' ? mockEmptyBundle() : mockSuccessBundle(query);
    const camp = unwrapEnvelope(bundle.camp);
    const storesData = unwrapEnvelope(bundle.stores);
    const roomsData = unwrapEnvelope(bundle.rooms);
    const salePriceSetting = unwrapEnvelope(bundle.salePriceSetting);
    const storesPriceShow = unwrapEnvelope(bundle.storesPriceShow);
    const statuses = unwrapEnvelope(bundle.statuses);
    return {
        providerName: 'mock',
        mockMode: mode,
        campId: camp.campId,
        campName: camp.campName,
        stores: storesData.list,
        rooms: roomsData.list,
        salePriceSetting,
        storesPriceShow,
        statuses,
        requestedAt: MOCK_TIMESTAMP,
        traceIds: [
            bundle.stores.traceId,
            bundle.camp.traceId,
            bundle.rooms.traceId,
            bundle.salePriceSetting.traceId,
            bundle.storesPriceShow.traceId,
            bundle.statuses.traceId,
        ],
        requestSummary: [
            'mock provider: POST /houseManage/retailPrice/overview',
            'mock provider: POST /houseManage/retailPrice/rooms',
            'mock provider: POST /houseManage/retailPrice/statuses',
        ],
    };
}
function mockSuccessBundle(query) {
    const rooms = [
        { roomCategoryId: '1796425099729092609', roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）' },
        { roomCategoryId: '1796425099485822977', roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）' },
    ].filter((room) => {
        const keyword = query.keyword?.trim();
        if (!keyword)
            return true;
        return room.roomCategoryName.includes(keyword) || room.roomCategoryId.includes(keyword);
    });
    return {
        camp: envelope('mock-fangtai--fangjia-guanli--menshijia-camp-001', {
            campId: 'mock-camp-001',
            campName: '路客云6TS5的店铺',
        }),
        stores: envelope('mock-fangtai--fangjia-guanli--menshijia-overview-001', {
            list: [
                { poiId: '1796425098638573570', poiName: '天落会宿公寓(前海壹方城宝安中心店)' },
                { poiId: '1796425098638573571', poiName: '天落会宿公寓(深圳湾科技园店)' },
            ],
            pagination: { page: 1, pageSize: 20, total: 2 },
        }),
        rooms: envelope('mock-fangtai--fangjia-guanli--menshijia-rooms-001', {
            list: rooms,
            pagination: { page: 1, pageSize: 20, total: rooms.length },
        }),
        salePriceSetting: envelope('mock-fangtai--fangjia-guanli--menshijia-setting-001', {
            isInitPriceDisplay: 1,
            pricePriceInterfaceDisplayType: '2',
            priceSalePriceSettings: [],
        }),
        storesPriceShow: envelope('mock-fangtai--fangjia-guanli--menshijia-store-show-001', {
            displayMode: 'allStores',
        }),
        statuses: envelope('mock-fangtai--fangjia-guanli--menshijia-statuses-001', {
            dateRange: { startDate: '2026-05-18', days: 30 },
            selectedPoiIds: query.poiIds ?? [],
            selectedRoomCategoryIds: query.roomCategoryIds ?? [],
        }),
    };
}
function mockEmptyBundle() {
    return {
        camp: envelope('mock-fangtai--fangjia-guanli--menshijia-camp-empty-001', {
            campId: 'mock-camp-empty',
            campName: '空态门店组',
        }),
        stores: envelope('mock-fangtai--fangjia-guanli--menshijia-overview-empty-001', {
            list: [],
            pagination: { page: 1, pageSize: 20, total: 0 },
        }),
        rooms: envelope('mock-fangtai--fangjia-guanli--menshijia-rooms-empty-001', {
            list: [],
            pagination: { page: 1, pageSize: 20, total: 0 },
        }),
        salePriceSetting: envelope('mock-fangtai--fangjia-guanli--menshijia-setting-empty-001', {
            isInitPriceDisplay: 1,
            pricePriceInterfaceDisplayType: '2',
            priceSalePriceSettings: [],
        }),
        storesPriceShow: envelope('mock-fangtai--fangjia-guanli--menshijia-store-show-empty-001', {
            displayMode: 'empty',
        }),
        statuses: envelope('mock-fangtai--fangjia-guanli--menshijia-statuses-empty-001', {
            dateRange: { startDate: '2026-05-18', days: 30 },
            selectedPoiIds: [],
            selectedRoomCategoryIds: [],
        }),
    };
}
