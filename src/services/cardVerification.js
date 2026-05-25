const HUDSON_BASE_URL = 'https://hudson-prod.localhome.cn';
const TICKET_PAGE_PATH = '/ticket/page/get';
const TICKET_CHECK_PATH = '/ticket/check';
const CAMPS_PATH = '/camps/get';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
export class CardVerificationRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CardVerificationRequestError';
    }
}
export function createCardVerificationRequestBody(filters) {
    return {
        campId: filters.campId ?? 'mock-camp-1796067693589061634',
        pageNum: filters.pageNum || 1,
        pageSize: filters.pageSize || 20,
        current: filters.pageNum || 1,
        ticketItemVerifyState: filters.ticketItemVerifyState || 1,
    };
}
export async function loadCardVerificationData(filters, signal) {
    const provider = resolveProviderName();
    if (provider === 'mock') {
        return loadMockCardVerificationData(filters);
    }
    const campId = filters.campId || (await fetchDefaultCampId(signal));
    const requestBody = createCardVerificationRequestBody({ ...filters, campId });
    const payload = await postHudson(TICKET_PAGE_PATH, requestBody, signal);
    return adaptCardVerificationPayload(payload, requestBody, 'real', 'real-hudson-ticket-page');
}
export async function checkCardVerificationTicket(ticketNo, campId, signal) {
    const provider = resolveProviderName();
    if (provider === 'mock') {
        return checkMockTicket(ticketNo);
    }
    const resolvedCampId = campId || (await fetchDefaultCampId(signal));
    const payload = await postHudson(TICKET_CHECK_PATH, { campId: resolvedCampId, ticketNo }, signal);
    const record = asRecord(payload);
    const row = adaptTicketRow(record, 0);
    return {
        provider: 'real',
        ticketNo,
        row,
        message: row ? '核销成功' : '卡券已核验',
        traceId: 'real-hudson-ticket-check',
        timestamp: new Date().toISOString(),
    };
}
function loadMockCardVerificationData(filters) {
    const mode = resolveMockMode();
    const requestBody = createCardVerificationRequestBody(filters);
    const response = mode === 'error'
        ? mockErrorEnvelope()
        : mode === 'empty'
            ? mockEmptyEnvelope()
            : mockSuccessEnvelope(requestBody);
    if (response.code !== 0) {
        throw new CardVerificationRequestError(response.message);
    }
    return adaptCardVerificationPayload(response.data, requestBody, 'mock', response.traceId, response.timestamp, mode);
}
function checkMockTicket(ticketNo) {
    const normalized = ticketNo.trim();
    if (!normalized) {
        throw new CardVerificationRequestError('请输入卡券码');
    }
    const rows = mockRows();
    const matched = rows.find((row) => row.ticketNo === normalized);
    const row = matched ??
        {
            id: `ticket-${normalized}`,
            ticketNo: normalized,
            category: '民宿预售券',
            productName: '天落大床电竞套间',
            ticketName: '周末双人入住券',
            userName: '现场核销',
            userMobile: '138****1802',
            price: '328.00',
            verifier: '路客云管理员',
            verifiedAt: '2026-05-18 15:08:00',
            orderNo: 'PO20260518002',
            status: '已核销',
        };
    return {
        provider: 'mock',
        ticketNo: normalized,
        row,
        message: '核销成功',
        traceId: 'mock-dingdan--yushouquan-dingdan--kaquan-hexiao-check-001',
        timestamp: MOCK_TIMESTAMP,
    };
}
async function fetchDefaultCampId(signal) {
    const payload = await postHudson(CAMPS_PATH, {}, signal);
    const camp = Array.isArray(payload.camps) ? payload.camps.find((item) => item.campId) : null;
    if (!camp?.campId) {
        throw new CardVerificationRequestError('/camps/get 未返回可用 campId');
    }
    return camp.campId;
}
async function postHudson(path, body, signal) {
    const response = await fetch(`${HUDSON_BASE_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok) {
        throw new CardVerificationRequestError(`${path} 返回 HTTP ${response.status}`);
    }
    if (!payload || typeof payload !== 'object') {
        throw new CardVerificationRequestError(`${path} 响应不是 JSON 对象`);
    }
    if (payload.success === false) {
        throw new CardVerificationRequestError(payload.errorMsg || payload.errorDetail || payload.errorCode || `${path} 返回业务失败`);
    }
    return payload.data;
}
function adaptCardVerificationPayload(payload, requestBody, provider, traceId, timestamp = new Date().toISOString(), mode) {
    const data = asRecord(payload);
    const list = Array.isArray(data.list) ? data.list : [];
    const page = toNumber(data.pageNum ?? data.current, toNumber(requestBody.pageNum, 1));
    const pageSize = toNumber(data.size ?? data.pageSize, toNumber(requestBody.pageSize, 20));
    const total = toNumber(data.total, list.length);
    return {
        provider,
        mode,
        endpoint: provider === 'mock' ? 'POST /mock/cardVerification/ticket/page/get' : `${HUDSON_BASE_URL}${TICKET_PAGE_PATH}`,
        requestBody,
        rows: list.map(adaptTicketRow),
        pagination: {
            page,
            pageSize,
            total,
            hasNextPage: Boolean(data.hasNextPage) || page * pageSize < total,
        },
        traceId,
        timestamp,
    };
}
function adaptTicketRow(value, index) {
    const record = asRecord(value);
    const order = asRecord(record.orderView ?? record.order);
    const detail = asRecord(record.ticketItemView ?? record.ticketItem ?? record.orderDetailView);
    return {
        id: pickString(record, ['ticketItemId', 'ticketId', 'id']) ?? `ticket-row-${index}`,
        ticketNo: pickString(record, ['ticketNo', 'ticketCode', 'code']) ?? `UNKNOWN-${index + 1}`,
        category: pickString(detail, ['categoryName']) ?? pickString(record, ['categoryName']) ?? '预售券',
        productName: pickString(detail, ['roomCategoryName', 'goodsName', 'productName']) ?? pickString(record, ['productName']) ?? '-',
        ticketName: pickString(detail, ['ticketName', 'roomCategoryProductName', 'skuName']) ?? pickString(record, ['ticketName']) ?? '-',
        userName: pickString(record, ['nickName', 'userName', 'buyerName']) ?? '-',
        userMobile: maskPhone(pickString(record, ['userMobile', 'buyerMobile', 'mobile', 'phone']) ?? '-'),
        price: formatMoney(record.price ?? record.salePrice ?? record.amount ?? detail.price),
        verifier: pickString(record, ['verifyUserName', 'verifier', 'operatorName']) ?? '-',
        verifiedAt: pickString(record, ['verifiedAt', 'verifyTime', 'usedTime']) ?? '-',
        orderNo: pickString(order, ['orderNo', 'orderId']) ?? pickString(record, ['orderNo', 'orderId']) ?? '-',
        status: ticketStatusLabel(record.ticketItemVerifyState ?? record.verifyState ?? record.status),
    };
}
function resolveProviderName() {
    const configured = readRuntimeConfig('pmsCardVerificationProvider') || import.meta.env.VITE_CARD_VERIFICATION_PROVIDER;
    return configured === 'real' ? 'real' : 'mock';
}
function resolveMockMode() {
    const configured = readRuntimeConfig('pmsCardVerificationMockMode') || import.meta.env.VITE_CARD_VERIFICATION_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function mockSuccessEnvelope(requestBody) {
    const list = mockRows();
    return {
        code: 0,
        message: 'success',
        data: {
            list,
            pageNum: toNumber(requestBody.pageNum, 1),
            size: toNumber(requestBody.pageSize, 20),
            total: list.length,
            hasNextPage: false,
        },
        traceId: 'mock-dingdan--yushouquan-dingdan--kaquan-hexiao-list-001',
        timestamp: MOCK_TIMESTAMP,
    };
}
function mockEmptyEnvelope() {
    return {
        code: 0,
        message: 'success',
        data: {
            list: [],
            pageNum: 1,
            size: 20,
            total: 0,
            hasNextPage: false,
        },
        traceId: 'mock-dingdan--yushouquan-dingdan--kaquan-hexiao-empty-001',
        timestamp: MOCK_TIMESTAMP,
    };
}
function mockErrorEnvelope() {
    return {
        code: 50001,
        message: '核销记录加载失败',
        data: null,
        traceId: 'mock-dingdan--yushouquan-dingdan--kaquan-hexiao-error-001',
        timestamp: MOCK_TIMESTAMP,
    };
}
function mockRows() {
    return [
        {
            id: 'ticket-row-001',
            ticketNo: 'LK20260518001',
            category: '民宿预售券',
            productName: '天落大床电竞套间',
            ticketName: '周末双人入住券',
            userName: '陈先生',
            userMobile: '138****1801',
            price: '328.00',
            verifier: '路客云管理员',
            verifiedAt: '2026-05-18 10:22:31',
            orderNo: 'PO20260518001',
            status: '已核销',
        },
        {
            id: 'ticket-row-002',
            ticketNo: 'LK20260518002',
            category: '酒店套餐',
            productName: '总裁套间',
            ticketName: '工作日入住券',
            userName: '林女士',
            userMobile: '139****1802',
            price: '468.00',
            verifier: '前台小李',
            verifiedAt: '2026-05-18 11:04:18',
            orderNo: 'PO20260518002',
            status: '已核销',
        },
        {
            id: 'ticket-row-003',
            ticketNo: 'LK20260518003',
            category: '民宿预售券',
            productName: '顶层套房（浴缸巨幕电竞麻将）',
            ticketName: '节假日补差券',
            userName: '王女士',
            userMobile: '137****1803',
            price: '128.00',
            verifier: '路客云管理员',
            verifiedAt: '2026-05-18 12:36:09',
            orderNo: 'PO20260518003',
            status: '已核销',
        },
    ];
}
function ticketStatusLabel(value) {
    const key = String(value ?? '');
    if (key === '0')
        return '待核销';
    if (key === '1' || key === '' || key === '已核销')
        return '已核销';
    if (key === '2')
        return '已退款';
    if (key === '3')
        return '已过期';
    return key || '-';
}
function pickString(record, keys) {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'string' && value.trim())
            return value.trim();
        if (typeof value === 'number')
            return String(value);
    }
    return undefined;
}
function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function formatMoney(value) {
    if (value === null || value === undefined || value === '')
        return '-';
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric))
        return String(value);
    const yuan = Math.abs(numeric) >= 100 ? numeric / 100 : numeric;
    return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(yuan);
}
function maskPhone(value) {
    if (!/^1\d{10}$/.test(value))
        return value;
    return `${value.slice(0, 3)}****${value.slice(7)}`;
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
