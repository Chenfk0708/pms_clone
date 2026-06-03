export const PRICE_LOG_LIST_ENDPOINT = '/houseManage/logs/price/list';
export const PRICE_LOG_EXPORT_ENDPOINT = '/houseManage/logs/price/export';
export const PRICE_LOG_CHANNELS_ENDPOINT = '/api/channels/get';
export const PRICE_LOG_ROOM_CATEGORIES_ENDPOINT = '/api/roomCategories/page/get';
const TASK_ID = 'fangtai--fangjia-guanli--tiaojia-rizhi';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
export async function fetchPriceLogs(query, signal) {
    const provider = query.provider ?? resolvePriceLogProvider();
    const request = buildPriceLogRequest(query);
    const envelope = provider === 'api' ? await fetchApiPriceLogs(query, request, signal) : await fetchMockPriceLogs(query, request, signal);
    const data = unwrapEnvelope(envelope);
    const state = query.mockState ?? 'success';
    const diagnostics = {
        endpoint: provider === 'api' ? PRICE_LOG_CHANNELS_ENDPOINT : PRICE_LOG_LIST_ENDPOINT,
        provider,
        state,
        traceId: envelope.traceId,
        request,
    };
    writeDiagnostics(diagnostics);
    return {
        view: {
            rows: data.list.map(adaptRow),
            pagination: data.pagination,
            channelOptions: [{ label: '请选择', value: '' }, ...data.dictionaries.channels],
            adjustmentOptions: data.dictionaries.adjustmentModes,
            refreshedAt: envelope.timestamp,
        },
        diagnostics,
    };
}
export function resolvePriceLogQueryFromLocation(location) {
    const params = new URLSearchParams(location.search);
    const provider = params.get('priceLogProvider');
    const mockState = params.get('priceLogMockState');
    return {
        provider: provider === 'api' || provider === 'mock' ? provider : undefined,
        mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
    };
}
export function getDefaultPriceLogChannelOptions() {
    return [{ label: '请选择', value: '' }, ...channelOptions];
}
export function getDefaultPriceLogAdjustmentOptions() {
    return adjustmentOptions;
}
export function createPriceLogExportRequest(query) {
    return {
        endpoint: PRICE_LOG_EXPORT_ENDPOINT,
        request: buildPriceLogRequest(query),
        traceId: `mock-${TASK_ID}-export-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
function resolvePriceLogProvider() {
    const configured = readRuntimeConfig('pms.priceLogProvider') || import.meta.env.VITE_PRICE_LOG_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
async function fetchMockPriceLogs(query, request, signal) {
    void request;
    await delay(80, signal);
    const state = query.mockState ?? 'success';
    if (state === 'error') {
        return {
            code: 50001,
            message: '调价日志数据加载失败，请稍后重试',
            data: createBackendData([], query),
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: MOCK_TIMESTAMP,
        };
    }
    const rows = state === 'empty' ? [] : filterRows(mockRows, query);
    return {
        code: 0,
        message: 'success',
        data: createBackendData(rows, query),
        traceId: `mock-${TASK_ID}-${state === 'empty' ? 'empty' : 'list'}-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
async function fetchApiPriceLogs(query, _request, signal) {
    const evidence = await fetchPriceLogEvidence({ campId: query.campId, keyword: query.keyword, channelId: query.channelId }, signal);
    return {
        code: 0,
        message: 'success',
        data: createBackendData([], query, evidence.channels.map((channel) => ({
            label: channel.channelName ?? channel.name ?? String(channel.channelId ?? '未知渠道'),
            value: String(channel.channelId ?? ''),
        }))),
        traceId: `api-${TASK_ID}-context-001`,
        timestamp: new Date().toISOString(),
    };
}
function createBackendData(rows, query, channels = channelOptions) {
    return {
        list: rows,
        pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total: rows.length,
        },
        dictionaries: {
            channels,
            adjustmentModes: adjustmentOptions,
        },
    };
}
function buildPriceLogRequest(query) {
    return {
        campId: query.campId,
        keyword: query.keyword,
        adjustType: query.adjustmentMode === '系统调整' ? 'system' : 'manual',
        channelId: query.channelId,
        adjustmentStart: query.adjustmentStart,
        adjustmentEnd: query.adjustmentEnd,
        operationStart: query.operationStart,
        operationEnd: query.operationEnd,
        operator: query.operator,
        page: query.page,
        pageSize: query.pageSize,
    };
}
function filterRows(rows, query) {
    return rows.filter((row) => {
        const keyword = query.keyword.trim();
        const operator = query.operator.trim();
        const matchesKeyword = !keyword ||
            row.logId?.includes(keyword) ||
            row.roomCategoryName?.includes(keyword) ||
            row.actionContent?.includes(keyword) ||
            row.channelName?.includes(keyword);
        const matchesChannel = !query.channelId || channelIdByName[row.channelName ?? ''] === query.channelId;
        const matchesAdjustment = !query.adjustmentMode || row.adjustTypeName === query.adjustmentMode;
        const matchesOperator = !operator || row.operatorName?.includes(operator);
        return matchesKeyword && matchesChannel && matchesAdjustment && matchesOperator;
    });
}
function adaptRow(row) {
    return {
        id: readString(row.logId, '未知日志'),
        roomType: readString(row.roomCategoryName, '未知房型'),
        priceDate: readString(row.priceDate, '-'),
        actionContent: readString(row.actionContent, '-'),
        adjustmentMode: readString(row.adjustTypeName, '-'),
        channel: readString(row.channelName, '-'),
        channelPrice: formatMoney(row.channelSalePrice),
        operator: readString(row.operatorName, '-'),
        operationTime: readString(row.operationTime, '-'),
    };
}
function unwrapEnvelope(envelope) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '调价日志数据加载失败，请稍后重试');
    }
    return envelope.data;
}
function writeDiagnostics(diagnostics) {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem('pms.priceLog.lastRequest', JSON.stringify(diagnostics));
}
function readString(value, fallback) {
    if (value === null || value === undefined || value === '')
        return fallback;
    return String(value);
}
function formatMoney(value) {
    if (value === null || value === undefined || value === '')
        return '-';
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric))
        return String(value);
    return `¥${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(numeric / 100)}`;
}
function delay(ms, signal) {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('调价日志请求已取消', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('调价日志请求已取消', 'AbortError'));
        }, { once: true });
    });
}
async function fetchPriceLogEvidence(query, signal) {
    const channelsBody = {
        campId: query.campId,
        hasAllChannel: 1,
    };
    const roomCategoriesBody = {
        campId: query.campId,
        pageSize: 999,
        pageNum: 1,
        roomCategoryName: query.keyword ?? '',
        keyword: query.keyword ?? '',
        cityIds: [],
        channelId: query.channelId ?? '',
    };
    const [channelsPayload, roomCategoriesPayload] = await Promise.all([
        postJson(PRICE_LOG_CHANNELS_ENDPOINT, channelsBody, signal),
        postJson(PRICE_LOG_ROOM_CATEGORIES_ENDPOINT, roomCategoriesBody, signal),
    ]);
    return {
        channels: readArray(readRecord(channelsPayload.data).channels).map(adaptChannel).filter((item) => Boolean(item)),
        roomCategories: readArray(readRecord(roomCategoriesPayload.data).list)
            .map(adaptRoomCategory)
            .filter((item) => Boolean(item)),
        capturedListEndpoint: false,
        requests: [
            { endpoint: PRICE_LOG_CHANNELS_ENDPOINT, body: channelsBody },
            { endpoint: PRICE_LOG_ROOM_CATEGORIES_ENDPOINT, body: roomCategoriesBody },
        ],
    };
}
async function postJson(endpoint, body, signal) {
    const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        signal,
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    let payload;
    try {
        payload = (await response.json());
    }
    catch {
        payload = null;
    }
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    if (!payload || typeof payload !== 'object') {
        throw new Error('接口响应不是 JSON 对象');
    }
    if (payload.success !== true) {
        throw new Error(payload.errorMsg || payload.errorDetail || '接口返回失败');
    }
    return payload;
}
function readRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function readArray(value) {
    return Array.isArray(value) ? value : [];
}
function isRecord(value) {
    return Boolean(value && typeof value === 'object');
}
function adaptChannel(value) {
    if (!isRecord(value))
        return null;
    return {
        channelId: readStringOrNumber(value.channelId ?? value.id),
        channelName: readOptionalString(value.channelName ?? value.name),
        name: readOptionalString(value.name),
    };
}
function adaptRoomCategory(value) {
    if (!isRecord(value))
        return null;
    return {
        roomCategoryId: readStringOrNumber(value.roomCategoryId ?? value.id),
        roomCategoryName: readOptionalString(value.roomCategoryName ?? value.name),
        name: readOptionalString(value.name),
    };
}
function readOptionalString(value) {
    if (value === null || value === undefined || value === '')
        return undefined;
    return String(value);
}
function readStringOrNumber(value) {
    if (typeof value === 'string' || typeof value === 'number')
        return value;
    return readOptionalString(value);
}
const adjustmentOptions = [
    { label: '手动调整', value: 'manual' },
    { label: '系统调整', value: 'system' },
];
const channelOptions = [
    { label: '自来客', value: '0' },
    { label: '路客云聚合', value: '17' },
    { label: '美团民宿', value: '3' },
    { label: '美团酒店', value: '6' },
    { label: '途家', value: '2' },
    { label: '途家直连', value: '49' },
    { label: '爱彼迎', value: '1' },
    { label: '飞猪淘酒店', value: '8' },
    { label: '飞猪民宿直连', value: '59' },
    { label: '飞猪酒店直连', value: '60' },
];
const channelIdByName = Object.fromEntries(channelOptions.map((option) => [option.label, option.value]));
const mockRows = [
    {
        logId: 'PL202605180001',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        priceDate: '2026-05-18',
        actionContent: '基础价从 930.00 调整为 960.00，同步周末价规则',
        adjustTypeName: '手动调整',
        channelName: '飞猪淘酒店',
        channelSalePrice: 96000,
        operatorName: '超级管理员',
        operationTime: '2026-05-18 10:08:21',
    },
    {
        logId: 'PL202605180002',
        roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
        priceDate: '2026-05-19',
        actionContent: '智能调价任务根据入住率上调 12%',
        adjustTypeName: '系统调整',
        channelName: '路客云聚合',
        channelSalePrice: 73000,
        operatorName: '系统同步',
        operationTime: '2026-05-18 10:12:42',
    },
];
