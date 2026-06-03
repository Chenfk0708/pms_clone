export const HOTEL_PACKAGE_ORDER_ENDPOINT = '/api/orders/page/get';
export const HOTEL_PACKAGE_ORDER_DEFAULT_PAGE_SIZE = 20;
const TASK_ID = 'dingdan--yushouquan-dingdan--jiudian-taocan-dingdan';
const HOTEL_PACKAGE_TYPE = '4';
const MOCK_CAMP_ID = 'camp-hotel-package-001';
const orderStateOptions = [
    { value: 'all', label: '全部' },
    { value: 'paid', label: '已支付' },
    { value: 'finished', label: '已完成' },
    { value: 'canceled', label: '已取消' },
];
const sourceOptions = [
    { value: 'brand', label: '品牌小程序' },
    { value: 'wechat', label: '微信商城' },
    { value: 'offline', label: '线下导入' },
    { value: 'distribution', label: '分销渠道' },
];
const afterSaleOptions = [
    { value: 'none', label: '无售后' },
    { value: 'refunding', label: '退款中' },
    { value: 'refunded', label: '退款成功' },
];
const baseRows = [
    {
        orderId: 'HPO-20260518-001',
        roomCategoryName: '总裁套间双晚套餐',
        count: 1,
        unitPrice: 129900,
        schedulePriceDiff: 0,
        paidAmount: 129900,
        contactPhone: '13800001234',
        orderState: '已支付',
        refundDisplayState: '无售后',
        orderChannelName: '微信商城',
        bookedAt: '2026-05-18 10:16',
    },
    {
        orderId: 'HPO-20260517-006',
        roomCategoryName: '顶层套房周末套餐',
        count: 2,
        unitPrice: 89900,
        schedulePriceDiff: 20000,
        paidAmount: 199800,
        contactPhone: '13800004567',
        orderState: '已完成',
        refundDisplayState: '无售后',
        orderChannelName: '微信商城',
        bookedAt: '2026-05-17 21:42',
    },
    {
        orderId: 'HPO-20260516-021',
        roomCategoryName: '电竞麻将房三小时套餐',
        count: 1,
        unitPrice: 35900,
        schedulePriceDiff: -3000,
        paidAmount: 32900,
        contactPhone: '13800007890',
        orderState: '已取消',
        refundDisplayState: '退款成功',
        orderChannelName: '微信商城',
        bookedAt: '2026-05-16 15:20',
    },
];
export function readInitialHotelPackageOrderFilters() {
    const params = new URLSearchParams(window.location.search);
    return {
        orderState: params.get('orderState') ?? 'all',
        source: params.get('source') ?? '',
        afterSale: params.get('afterSale') ?? '',
        keyword: params.get('keyword') ?? '',
        startDate: params.get('startDate') ?? '',
        endDate: params.get('endDate') ?? '',
        pageNum: Number(params.get('pageNum') ?? '1') || 1,
        pageSize: Number(params.get('pageSize') ?? String(HOTEL_PACKAGE_ORDER_DEFAULT_PAGE_SIZE)) || HOTEL_PACKAGE_ORDER_DEFAULT_PAGE_SIZE,
    };
}
export function getHotelPackageOrderProvider() {
    return normalizeProviderValue(window.localStorage.getItem('pmsHotelPackageOrderProvider')) === 'api' ? 'api' : 'mock';
}
export function getHotelPackageOrderMockState() {
    const state = new URLSearchParams(window.location.search).get('mockState');
    if (state === 'empty' || state === 'error')
        return state;
    return 'success';
}
export function createHotelPackageOrderRequestBody(filters) {
    return {
        campId: MOCK_CAMP_ID,
        pageNum: String(filters.pageNum || 1),
        pageSize: String(filters.pageSize || 20),
        orderStates: filters.orderState === 'all' ? [] : [filters.orderState],
        roomCategoryTypes: [HOTEL_PACKAGE_TYPE],
        categoryIds: [],
        orderChannelIds: filters.source ? [filters.source] : [],
        paymentWayIds: [],
        refundDisplayState: filters.afterSale || '',
        bookedStartDate: toStartOfDay(filters.startDate),
        bookedEndDate: toNextDayStart(filters.endDate),
        keyword: filters.keyword.trim(),
    };
}
export async function loadHotelPackageOrderData(filters, options) {
    const provider = getHotelPackageOrderProvider();
    const requestBody = createHotelPackageOrderRequestBody(filters);
    if (provider === 'api')
        return loadHotelPackageOrderFromApi(requestBody, options?.signal);
    return loadHotelPackageOrderFromMock(filters, requestBody, options?.mockState ?? getHotelPackageOrderMockState());
}
async function loadHotelPackageOrderFromMock(filters, requestBody, state) {
    await delay(180);
    if (state === 'error') {
        return {
            ok: false,
            provider: 'mock',
            endpoint: HOTEL_PACKAGE_ORDER_ENDPOINT,
            requestBody,
            message: '酒店套餐订单加载失败，请检查筛选条件后重试',
        };
    }
    return {
        ok: true,
        data: adaptResponsePackage(createMockResponse(filters, state), requestBody, 'mock'),
    };
}
async function loadHotelPackageOrderFromApi(requestBody, signal) {
    try {
        const response = await fetch(HOTEL_PACKAGE_ORDER_ENDPOINT, {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok)
            throw new Error(`酒店套餐订单接口返回 HTTP ${response.status}`);
        return { ok: true, data: adaptHudsonPayload(payload, requestBody) };
    }
    catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
            throw error;
        return {
            ok: false,
            provider: 'api',
            endpoint: HOTEL_PACKAGE_ORDER_ENDPOINT,
            requestBody,
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
function createMockResponse(filters, state) {
    const filteredRows = state === 'empty'
        ? []
        : baseRows.filter((row) => {
            const sourceMatch = !filters.source || sourceOptions.find((option) => option.value === filters.source)?.label === row.orderChannelName;
            const afterSaleMatch = !filters.afterSale || afterSaleOptions.find((option) => option.value === filters.afterSale)?.label === row.refundDisplayState;
            const keyword = filters.keyword.trim();
            const keywordMatch = !keyword || `${row.orderId} ${row.roomCategoryName} ${row.contactPhone}`.includes(keyword);
            return sourceMatch && afterSaleMatch && keywordMatch;
        });
    const start = (filters.pageNum - 1) * filters.pageSize;
    return {
        code: 0,
        message: 'success',
        data: {
            list: filteredRows.slice(start, start + filters.pageSize),
            pagination: { page: filters.pageNum, pageSize: filters.pageSize, total: filteredRows.length },
            options: { sources: sourceOptions, afterSales: afterSaleOptions, orderStates: orderStateOptions },
        },
        traceId: `mock-${TASK_ID}-list-001`,
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function adaptResponsePackage(payload, requestBody, provider) {
    return {
        provider,
        traceId: payload.traceId,
        endpoint: HOTEL_PACKAGE_ORDER_ENDPOINT,
        requestBody,
        rows: payload.data.list.map(adaptMockRow),
        pagination: payload.data.pagination,
        options: payload.data.options,
        requestedAt: payload.timestamp,
    };
}
function adaptHudsonPayload(payload, requestBody) {
    const data = asRecord(readPath(payload, ['data']));
    const list = toArray(data.list);
    const page = toNumber(data.pageNum ?? data.current, toNumber(requestBody.pageNum, 1));
    const pageSize = toNumber(data.size ?? data.pageSize, toNumber(requestBody.pageSize, 20));
    return {
        provider: 'api',
        traceId: 'api-hotel-package-order',
        endpoint: HOTEL_PACKAGE_ORDER_ENDPOINT,
        requestBody,
        rows: list.map(adaptHudsonRow),
        pagination: { page, pageSize, total: toNumber(data.total, list.length) },
        options: { sources: sourceOptions, afterSales: afterSaleOptions, orderStates: orderStateOptions },
        requestedAt: new Date().toISOString(),
    };
}
function adaptMockRow(row) {
    return {
        id: row.orderId,
        productName: row.roomCategoryName,
        quantity: String(row.count),
        unitPrice: formatMoney(row.unitPrice),
        schedulePriceDiff: formatMoney(row.schedulePriceDiff),
        paidAmount: formatMoney(row.paidAmount),
        contact: row.contactPhone,
        orderState: row.orderState,
        afterSaleState: row.refundDisplayState,
        sourceName: row.orderChannelName,
        bookedAt: row.bookedAt,
    };
}
function adaptHudsonRow(value, index) {
    const row = asRecord(value);
    const details = toArray(row.orderDetailViews);
    const firstDetail = asRecord(details[0]);
    return {
        id: pickString(row, ['orderId', 'id', 'orderNo']) ?? `hotel-package-order-${index}`,
        productName: pickString(firstDetail, ['roomCategoryName', 'goodsName', 'productName']) ??
            pickString(row, ['roomCategoryName', 'goodsName', 'productName']) ??
            '未命名套餐',
        quantity: pickString(firstDetail, ['count', 'quantity', 'num']) ?? pickString(row, ['count', 'quantity']) ?? '-',
        unitPrice: formatMoney(firstExisting(firstDetail, ['price', 'salePrice', 'unitPrice'])),
        schedulePriceDiff: formatMoney(firstExisting(row, ['schedulePriceDiff', 'diffAmount'])),
        paidAmount: formatMoney(firstExisting(row, ['paidAmount', 'realPayAmount', 'paymentAmount'])),
        contact: pickString(row, ['buyerMobile', 'contactPhone', 'mobile', 'phone']) ?? '-',
        orderState: pickString(row, ['orderStateName']) ?? String(row.orderState ?? '-'),
        afterSaleState: pickString(row, ['refundDisplayStateName']) ?? String(row.refundDisplayState ?? '-'),
        sourceName: pickString(row, ['orderChannelName', 'channelName']) ?? '-',
        bookedAt: pickString(row, ['bookedAt', 'createTime', 'createdAt']) ?? '-',
    };
}
function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function toStartOfDay(date) {
    if (!date)
        return '';
    const timestamp = new Date(`${date}T00:00:00+08:00`).getTime();
    return Number.isFinite(timestamp) ? timestamp : '';
}
function toNextDayStart(date) {
    if (!date)
        return '';
    const parsed = new Date(`${date}T00:00:00+08:00`);
    if (!Number.isFinite(parsed.getTime()))
        return '';
    parsed.setDate(parsed.getDate() + 1);
    return parsed.getTime();
}
function formatMoney(value) {
    if (value === null || value === undefined || value === '')
        return '-';
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric))
        return String(value);
    const yuan = Math.abs(numeric) >= 100 ? numeric / 100 : numeric;
    return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: Number.isInteger(yuan) ? 0 : 2, maximumFractionDigits: 2 }).format(yuan);
}
function firstExisting(record, keys) {
    for (const key of keys) {
        if (record[key] !== undefined && record[key] !== null && record[key] !== '')
            return record[key];
    }
    return undefined;
}
function pickString(value, keys) {
    const record = asRecord(value);
    for (const key of keys) {
        const candidate = record[key];
        if (typeof candidate === 'string' && candidate.trim())
            return candidate.trim();
        if (typeof candidate === 'number')
            return String(candidate);
    }
    return undefined;
}
function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function readPath(value, path) {
    let current = value;
    for (const segment of path) {
        if (!current || typeof current !== 'object')
            return undefined;
        current = current[segment];
    }
    return current;
}
function toArray(value) {
    return Array.isArray(value) ? value : [];
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function normalizeProviderValue(value) {
    return value === 'api' || value === 'real' ? 'api' : value === 'mock' ? 'mock' : undefined;
}
