export class ChannelPriceRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ChannelPriceRequestError';
    }
}
export const channelPriceEndpoint = '/api/roomCategoryStatuses/roomCategory/channel/get';
export const channelPriceMockSourceLabel = '统一响应包 mock provider';
export async function fetchChannelPriceRows(filters, signal) {
    const body = createChannelPriceRequestBody(filters);
    if (resolveChannelPriceProviderName(filters.provider) === 'mock') {
        return fetchMockChannelPriceRows(body);
    }
    const response = await fetch(channelPriceEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
        signal,
    });
    const payload = await readJson(response);
    if (!response.ok || isFailedResponse(payload)) {
        throw new ChannelPriceRequestError(extractErrorMessage(payload) ?? `HTTP ${response.status}`);
    }
    return adaptChannelPriceData(payload?.data, body, 'real');
}
export function createChannelPriceRequestBody(filters) {
    return {
        campId: filters.campId,
        channelIds: filters.channel && filters.channel !== '渠道' && filters.channel !== '全部渠道' ? [filters.channel] : null,
        roomCategoryGroupIds: null,
        roomCategoryProductSaleType: null,
        roomCategoryIds: filters.roomCategoryIds?.length ? filters.roomCategoryIds : null,
        date: filters.date,
        days: 30,
        poiIds: null,
        pageNum: 1,
        pageSize: 15,
        isFinalChannelRp: 1,
    };
}
function fetchMockChannelPriceRows(requestBody) {
    const mode = resolveChannelPriceMockMode();
    const response = mode === 'error'
        ? mockChannelPriceErrorEnvelope()
        : mode === 'empty'
            ? mockChannelPriceEmptyEnvelope()
            : mockChannelPriceSuccessEnvelope(requestBody);
    if (response.code !== 0) {
        throw new ChannelPriceRequestError(`${response.message}（traceId: ${response.traceId}）`);
    }
    return adaptChannelPriceData(response.data, requestBody, 'mock');
}
function adaptChannelPriceData(data, requestBody, provider) {
    return {
        rows: adaptChannelPriceRows(data),
        requestBody,
        endpoint: provider === 'mock' ? channelPriceMockSourceLabel : channelPriceEndpoint,
        provider,
        sourceLabel: provider === 'mock' ? channelPriceMockSourceLabel : channelPriceEndpoint.replace('/api/', ''),
    };
}
export function adaptChannelPriceRows(data) {
    if (!data || typeof data !== 'object')
        return [];
    const directRows = readRows(data);
    if (directRows.length > 0)
        return directRows;
    const roomInfos = readProperty(data, 'roomCategoryInfos');
    if (!Array.isArray(roomInfos))
        return [];
    return roomInfos.flatMap((roomInfo) => readRows(roomInfo));
}
function readRows(value) {
    if (!value || typeof value !== 'object')
        return [];
    const rows = readProperty(value, 'rows');
    if (Array.isArray(rows))
        return rows.map(adaptRow).filter((row) => Boolean(row));
    const list = readProperty(value, 'list');
    if (Array.isArray(list))
        return list.map(adaptRow).filter((row) => Boolean(row));
    const products = readProperty(value, 'roomCategoryProductPriceInfos') ?? readProperty(value, 'roomCategoryProducts');
    if (Array.isArray(products)) {
        return products.map(adaptRow).filter((row) => Boolean(row));
    }
    return [];
}
function adaptRow(value) {
    if (!value || typeof value !== 'object')
        return null;
    const record = value;
    const channel = readString(record.roomCategoryName) ?? readString(record.channel) ?? readString(record.name);
    const product = readString(record.product) ?? readString(record.roomCategoryProductName) ?? readString(record.title);
    if (!channel && !product)
        return null;
    const prices = readStringArray(record.prices) ?? readPriceCells(record);
    const comparePrices = readStringArray(record.comparePrices) ?? readStringArray(record.linePrices) ?? prices.map(() => '-');
    return {
        channel: channel ?? product ?? '未命名产品',
        coefficient: readString(record.coefficient) ?? readString(record.rate) ?? readString(record.rpRate) ?? '-',
        basePrice: readString(record.basePrice) ?? readString(record.price) ?? prices[0] ?? '-',
        prices,
        comparePrices,
        product: product ?? undefined,
        channelBadgeId: inferChannelBadgeId(record, channel, product),
    };
}
function readPriceCells(record) {
    const candidates = [record.priceInfos, record.datePrices, record.roomCategoryStatusViews, record.channelStatusViews];
    for (const candidate of candidates) {
        if (!Array.isArray(candidate))
            continue;
        const values = candidate
            .map((item) => {
            if (!item || typeof item !== 'object')
                return null;
            const itemRecord = item;
            return readString(itemRecord.salePrice) ?? readString(itemRecord.price) ?? readString(itemRecord.finalPrice);
        })
            .filter((item) => Boolean(item));
        if (values.length > 0)
            return values;
    }
    return [];
}
function inferChannelBadgeId(record, channel, product) {
    const explicit = readString(record.channelBadgeId) ??
        readString(record.badgeId) ??
        readString(record.channelKey) ??
        readString(record.channelCode) ??
        readString(record.channelType) ??
        readString(record.providerCode);
    const explicitMatch = matchBadgeId(explicit);
    if (explicitMatch)
        return explicitMatch;
    const combined = [
        channel,
        product,
        readString(record.channelName),
        readString(record.platformName),
        readString(record.platform),
        readString(record.providerName),
        readString(record.otaName),
        readString(record.title),
    ]
        .filter(Boolean)
        .join(' ');
    return matchBadgeId(combined);
}
function matchBadgeId(value) {
    if (!value)
        return undefined;
    const text = value.toLowerCase();
    if (text.includes('tujia') || value.includes('途家'))
        return 'tujia';
    if (text.includes('ctrip') || value.includes('携程'))
        return 'ctrip';
    if (text.includes('feizhu') || text.includes('fliggy') || value.includes('飞猪'))
        return 'feizhu';
    if (text.includes('meituan-hotel') || value.includes('美团酒店'))
        return 'meituanHotel';
    if (text.includes('meituan-homestay') || value.includes('美团民宿') || value.includes('美团'))
        return 'meituanHomestay';
    if (text.includes('muniao') || value.includes('木鸟'))
        return 'muniao';
    if (text.includes('xiaozhu') || value.includes('小猪'))
        return 'xiaozhu';
    if (text.includes('locals') || value.includes('路客云聚合'))
        return 'locals';
    return undefined;
}
function resolveChannelPriceProviderName(explicitProvider) {
    const configured = explicitProvider ||
        readRuntimeConfig('pms.channelPriceProvider') ||
        import.meta.env.VITE_CHANNEL_PRICE_PROVIDER;
    return configured === 'mock' ? 'mock' : 'real';
}
function resolveChannelPriceMockMode() {
    const configured = readRuntimeConfig('pms.channelPriceMockMode') ||
        import.meta.env.VITE_CHANNEL_PRICE_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function mockChannelPriceSuccessEnvelope(requestBody) {
    const channelIds = Array.isArray(requestBody.channelIds) ? requestBody.channelIds.map((item) => String(item)) : [];
    const channelName = channelIds[0];
    const productPrefix = channelName ? `${channelName}渠道` : '模拟渠道RP价';
    const list = [
        {
            channel: '模拟渠道RP价房型A',
            coefficient: '*0.88',
            basePrice: '399',
            product: `${productPrefix}产品A<无早>`,
            prices: ['321', '322', '323', '324', '421', '422', '323', '324'],
            comparePrices: ['399', '399', '399', '399', '499', '499', '399', '399'],
        },
        {
            channel: '模拟渠道RP价房型B',
            coefficient: '*0.91',
            basePrice: '559',
            product: `${productPrefix}产品B<双早>`,
            prices: ['508', '508', '509', '509', '609', '609', '508', '508'],
            comparePrices: ['559', '559', '559', '559', '669', '669', '559', '559'],
        },
    ];
    return {
        code: 0,
        message: 'success',
        data: {
            list,
            pagination: {
                page: 1,
                pageSize: 20,
                total: list.length,
            },
        },
        traceId: 'mock-fangtai--fangjia-guanli--jvdao-prjia-list-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockChannelPriceEmptyEnvelope() {
    return {
        code: 0,
        message: 'success',
        data: {
            list: [],
            pagination: {
                page: 1,
                pageSize: 20,
                total: 0,
            },
        },
        traceId: 'mock-fangtai--fangjia-guanli--jvdao-prjia-empty-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockChannelPriceErrorEnvelope() {
    return {
        code: 50001,
        message: 'mock 渠道RP价接口模拟失败',
        data: null,
        traceId: 'mock-fangtai--fangjia-guanli--jvdao-prjia-error-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
async function readJson(response) {
    try {
        return (await response.json());
    }
    catch {
        return null;
    }
}
function isFailedResponse(payload) {
    if (!payload)
        return false;
    if (payload.code !== undefined)
        return payload.code !== 0;
    return payload.success === false;
}
function extractErrorMessage(payload) {
    if (!payload)
        return null;
    return payload.message ?? payload.errorMsg ?? payload.errorCode ?? null;
}
function readString(value) {
    if (value === null || value === undefined || value === '')
        return null;
    return String(value);
}
function readStringArray(value) {
    if (!Array.isArray(value))
        return null;
    return value.map((item) => String(item));
}
function readProperty(value, key) {
    if (!value || typeof value !== 'object')
        return undefined;
    return value[key];
}
