export const centralPriceEndpoint = '/api/roomCategoryStatuses/central/get';
export const centralSaleStatusEndpoint = '/api/roomCategoryStatuses/central/saleStatus/save';
export const centralPriceBusinessSourceLabel = '中央价格服务';
export const DEFAULT_LOCAL_CHANNEL_ID = '100';
export const DEFAULT_LOCAL_CHANNEL_NAME = '宿银平台';
const channelIdByName = {
    [DEFAULT_LOCAL_CHANNEL_NAME]: DEFAULT_LOCAL_CHANNEL_ID,
    途家: '2',
    小猪: '3',
    携程: '4',
    美团酒店: '5',
    飞猪淘酒店: '6',
    路客云聚合: '7',
    木鸟: '8',
};
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
export function getCentralPriceRequestDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${byType.year}-${byType.month}-${byType.day}`;
}
export function createCentralPriceRequestBody(filters) {
    return {
        campId: null,
        channelIds: resolveChannelIds(filters.selectedChannel),
        roomCategoryGroupIds: null,
        roomCategoryProductSaleType: null,
        roomCategoryIds: filters.selectedRoomCategoryIds.length ? filters.selectedRoomCategoryIds : null,
        date: filters.date,
        days: 30,
        poiIds: filters.selectedStoreId === 'all' ? null : [filters.selectedStoreId],
        pageNum: filters.pageNum,
        pageSize: filters.pageSize,
    };
}
export async function fetchCentralPrices(filters, signal) {
    const requestBody = createCentralPriceRequestBody(filters);
    if (resolveCentralPriceProviderName() === 'mock') {
        return fetchMockCentralPrices(requestBody);
    }
    try {
        const response = await fetch(centralPriceEndpoint, {
            method: 'POST',
            credentials: 'include',
            signal,
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        const payload = await readJson(response);
        if (!response.ok) {
            return {
                ok: false,
                endpoint: centralPriceEndpoint,
                requestBody,
                status: response.status,
                message: extractErrorMessage(payload) || `中央价接口返回 HTTP ${response.status}`,
            };
        }
        if (!payload || typeof payload !== 'object') {
            return {
                ok: false,
                endpoint: centralPriceEndpoint,
                requestBody,
                status: response.status,
                message: '中央价接口响应不是 JSON 对象',
            };
        }
        if ('success' in payload && payload.success !== true) {
            return {
                ok: false,
                endpoint: centralPriceEndpoint,
                requestBody,
                status: response.status,
                message: extractErrorMessage(payload) || '中央价接口返回失败',
            };
        }
        return { ok: true, data: adaptCentralPriceResponse(payload, requestBody, 'real') };
    }
    catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
            throw error;
        return {
            ok: false,
            endpoint: centralPriceEndpoint,
            requestBody,
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
export async function saveCentralSaleStatus(input, signal) {
    const requestBody = {
        campId: input.campId ?? null,
        roomCategoryId: input.roomCategoryId,
        date: input.date,
        saleEnabled: input.saleEnabled,
    };
    const response = await fetch(centralSaleStatusEndpoint, {
        method: 'POST',
        credentials: 'include',
        signal,
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });
    const payload = await readJson(response);
    if (!response.ok) {
        throw new Error(extractErrorMessage(payload) || `中央价售卖状态保存失败，HTTP ${response.status}`);
    }
    if (!payload || typeof payload !== 'object') {
        throw new Error('中央价售卖状态保存响应不是 JSON 对象');
    }
    if (isFailureEnvelope(payload)) {
        throw new Error(extractErrorMessage(payload) || '中央价售卖状态保存失败');
    }
    const data = asRecord(asRecord(payload).data);
    return {
        roomCategoryId: String(data.roomCategoryId ?? input.roomCategoryId),
        date: String(data.date ?? input.date),
        saleEnabled: data.saleEnabled === undefined ? input.saleEnabled : data.saleEnabled !== false,
    };
}
export function getCentralPriceSourceLabel() {
    return centralPriceBusinessSourceLabel;
}
function resolveCentralPriceProviderName() {
    const configured = readRuntimeConfig('pms.centralPriceProvider') || import.meta.env.VITE_CENTRAL_PRICE_PROVIDER;
    return configured === 'mock' ? 'mock' : 'real';
}
function resolveCentralPriceMockMode() {
    const configured = readRuntimeConfig('pms.centralPriceMockMode') || import.meta.env.VITE_CENTRAL_PRICE_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function fetchMockCentralPrices(requestBody) {
    const mode = resolveCentralPriceMockMode();
    const response = mode === 'error'
        ? mockCentralPriceErrorEnvelope()
        : mode === 'empty'
            ? mockCentralPriceEmptyEnvelope(requestBody)
            : mockCentralPriceSuccessEnvelope(requestBody);
    if (response.code !== 0) {
        return {
            ok: false,
            endpoint: 'central-price-mock-provider',
            requestBody,
            status: response.code,
            message: `${response.message}（traceId: ${response.traceId}）`,
        };
    }
    return { ok: true, data: adaptCentralPriceResponse(response, requestBody, 'mock') };
}
function successEnvelope(traceId, data) {
    return {
        code: 0,
        message: 'success',
        data,
        traceId,
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockCentralPriceErrorEnvelope() {
    return {
        code: 50001,
        message: 'mock 中央价接口模拟失败',
        data: null,
        traceId: 'mock-fangtai--fangjia-guanli--zhongyang-jiage-error-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockCentralPriceEmptyEnvelope(requestBody) {
    return successEnvelope('mock-fangtai--fangjia-guanli--zhongyang-jiage-empty-001', {
        list: [],
        pagination: {
            page: toNumber(requestBody.pageNum, 1),
            pageSize: toNumber(requestBody.pageSize, 15),
            total: 0,
        },
        roomStatusViews: [],
        pageX: {
            total: 0,
            pageNum: toNumber(requestBody.pageNum, 1),
            pageSize: toNumber(requestBody.pageSize, 15),
            hasNextPage: false,
        },
    });
}
function mockCentralPriceSuccessEnvelope(requestBody) {
    const startDate = String(requestBody.date ?? getCentralPriceRequestDate());
    const dates = Array.from({ length: 30 }, (_, index) => addDays(startDate, index));
    const commonChannels = [
        { channelId: '100', channelName: '宿银平台', expressValue: '1.00', priceDelta: 0 },
    ];
    return successEnvelope('mock-fangtai--fangjia-guanli--zhongyang-jiage-list-001', {
        list: [],
        pagination: {
            page: toNumber(requestBody.pageNum, 1),
            pageSize: toNumber(requestBody.pageSize, 15),
            total: 2,
        },
        roomStatusViews: [
            buildMockRoom({
                roomCategoryId: 'central-deluxe-suite',
                roomCategoryName: '臻选豪华套房',
                normalPrice: 73000,
                normalActualSalePrice: 73000,
                totalStock: 2,
                dates,
                channels: commonChannels,
            }),
            buildMockRoom({
                roomCategoryId: 'central-cinema-room',
                roomCategoryName: '观影大床房',
                normalPrice: 29800,
                normalActualSalePrice: 29800,
                totalStock: 3,
                dates,
                channels: commonChannels,
            }),
        ],
        pageX: {
            total: 2,
            pageNum: toNumber(requestBody.pageNum, 1),
            pageSize: toNumber(requestBody.pageSize, 15),
            hasNextPage: false,
        },
    });
}
function buildMockRoom({ roomCategoryId, roomCategoryName, normalPrice, normalActualSalePrice, totalStock, dates, channels, }) {
    const statusViews = dates.map((date, index) => ({
        date,
        totalStock: Math.max(totalStock - (index % 3 === 2 ? 1 : 0), 0),
        price: normalActualSalePrice + (index % 7 >= 5 ? 20000 : 0),
        saleEnabled: true,
    }));
    return {
        roomCategoryId,
        roomCategoryName,
        normalPrice,
        normalActualSalePrice,
        statusViews,
        channelRoomCategoryStatuses: channels.map((channel, channelIndex) => ({
            channelId: channel.channelId,
            channelName: channel.channelName,
            channelRoomCategoryName: `${roomCategoryName}<无早>`,
            expressValue: channel.expressValue,
            normalPrice,
            normalActualSalePrice,
            statusViews: statusViews.map((item, statusIndex) => {
                const adjustedPrice = item.price + (channel.priceDelta ?? 0) + ((channelIndex + statusIndex) % 3 === 0 ? 1000 : 0);
                return {
                    date: item.date,
                    price: adjustedPrice,
                    salePrice: Math.round(adjustedPrice * Number(channel.expressValue)),
                };
            }),
        })),
    };
}
export function adaptCentralPriceResponse(payload, requestBody, provider = 'real') {
    const root = asRecord(payload);
    const data = asRecord(root.data);
    const roomStatusViews = Array.isArray(data.roomStatusViews) ? data.roomStatusViews.map(asRecord) : [];
    const dates = buildDates(roomStatusViews, String(requestBody.date ?? getCentralPriceRequestDate()));
    const pageX = asRecord(data.pageX);
    return {
        endpoint: provider === 'mock' ? 'central-price-mock-provider' : centralPriceEndpoint,
        provider,
        sourceLabel: centralPriceBusinessSourceLabel,
        requestBody,
        dates,
        rooms: roomStatusViews.map((room, index) => adaptRoom(room, dates, index)),
        page: {
            total: toNumber(pageX.total, roomStatusViews.length),
            pageNum: toNumber(pageX.pageNum ?? pageX.current, toNumber(requestBody.pageNum, 1)),
            pageSize: toNumber(pageX.pageSize ?? pageX.size, toNumber(requestBody.pageSize, 15)),
            hasNextPage: Boolean(pageX.hasNextPage),
        },
    };
}
function adaptRoom(room, dates, index) {
    const statusViews = Array.isArray(room.statusViews) ? room.statusViews.map(asRecord) : [];
    const channelRows = Array.isArray(room.channelRoomCategoryStatuses)
        ? room.channelRoomCategoryStatuses.map((item) => adaptChannelRow(asRecord(item), dates))
        : [];
    return {
        id: String(room.roomCategoryId ?? `central-room-${index}`),
        name: String(room.roomCategoryName ?? `未命名房型 ${index + 1}`),
        basePrice: formatMoney(room.normalActualSalePrice ?? room.normalPrice),
        stock: formatStock(statusViews[0]?.totalStock),
        prices: dates.map((date) => {
            const status = statusViews.find((item) => item.date === date.key) ?? {};
            return {
                price: formatMoney(status.price ?? status.salePrice ?? status.basePrice),
                stock: formatStock(status.totalStock),
                saleEnabled: status.saleEnabled !== false,
            };
        }),
        channelRows,
    };
}
function adaptChannelRow(row, dates) {
    const statusViews = Array.isArray(row.statusViews) ? row.statusViews.map(asRecord) : [];
    return {
        channel: String(row.channelName ?? '未知渠道'),
        coefficient: row.expressValue == null ? '-' : String(row.expressValue),
        basePrice: formatMoney(row.normalActualSalePrice ?? row.normalPrice),
        product: typeof row.channelRoomCategoryName === 'string' ? row.channelRoomCategoryName : undefined,
        prices: dates.map((date) => {
            const status = statusViews.find((item) => item.date === date.key) ?? {};
            return formatMoney(status.salePrice ?? status.price);
        }),
        comparePrices: dates.map((date) => {
            const status = statusViews.find((item) => item.date === date.key) ?? {};
            return formatMoney(status.price ?? status.basePrice);
        }),
    };
}
function buildDates(rooms, fallbackDate) {
    const firstRoomStatuses = Array.isArray(rooms[0]?.statusViews) ? rooms[0].statusViews.map(asRecord) : [];
    const sourceDates = firstRoomStatuses.map((item) => String(item.date ?? '')).filter(Boolean);
    const dates = sourceDates.length > 0 ? sourceDates : Array.from({ length: 30 }, (_, index) => addDays(fallbackDate, index));
    return dates.map((date, index) => {
        const parsed = new Date(`${date}T00:00:00+08:00`);
        const dateLabel = date.slice(5).replace('-', '.');
        return {
            key: date,
            label: index === 0 ? '今日' : dateLabel,
            dateLabel,
            weekday: weekdays[parsed.getDay()] ?? '',
        };
    });
}
function addDays(date, offset) {
    const parsed = new Date(`${date}T00:00:00+08:00`);
    parsed.setDate(parsed.getDate() + offset);
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}
function resolveChannelIds(channel) {
    const normalized = channel.trim();
    if (!normalized || normalized === '渠道' || normalized === '全部渠道') {
        return [DEFAULT_LOCAL_CHANNEL_ID];
    }
    const id = channelIdByName[normalized];
    if (id)
        return [id];
    return /^\d+$/.test(normalized) ? [normalized] : [DEFAULT_LOCAL_CHANNEL_ID];
}
function formatStock(value) {
    if (value === null || value === undefined || value === '')
        return '-';
    return `余${value}`;
}
function formatMoney(value) {
    if (value === null || value === undefined || value === '')
        return '-';
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric))
        return String(value);
    const amount = numeric / 100;
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(amount);
}
async function readJson(response) {
    try {
        return await response.json();
    }
    catch {
        return null;
    }
}
function extractErrorMessage(payload) {
    const record = asRecord(payload);
    const message = String(record.errorMsg ?? record.message ?? record.errorDetail ?? '').trim();
    return message === 'null' || message === 'undefined' ? '' : message;
}
function isFailureEnvelope(payload) {
    const record = asRecord(payload);
    if ('success' in record)
        return record.success !== true;
    if ('code' in record)
        return Number(record.code) !== 0;
    return false;
}
function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
