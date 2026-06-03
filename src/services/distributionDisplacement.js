export const DISTRIBUTION_DISPLACEMENT_PROVIDER = 'mock';
export const DISTRIBUTION_DISPLACEMENT_ENDPOINT = '/api/edition/replace/order/get';
export const DISTRIBUTION_DISPLACEMENT_LOCAL_PATH = '/channels/distribution/distributiondisplacement';
export class DistributionDisplacementServiceError extends Error {
    response;
    constructor(response) {
        super(response.message);
        this.name = 'DistributionDisplacementServiceError';
        this.response = response;
    }
}
const TASK_ID = 'juhe-fenxiao--fenxiao--zhihuan-quanyi';
const MOCK_CAMP_ID = '1796067693589061634';
const timestamp = '2026-05-18T10:00:00+08:00';
const rows = [
    {
        replaceOrderId: 'replace-20260518-001',
        orderNo: 'DD-20260518-001',
        channelOrderNo: 'MT-75501842',
        replaceMonth: '2026-05',
        channelName: '美团民宿',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomName: '1802',
        contactName: '陈先生',
        contactMobile: '138****1024',
        stayStatus: 'living',
        settlementStatus: 'pending',
        checkInDate: '2026-05-17',
        checkOutDate: '2026-05-18',
        settlementDate: '2026-05-18',
        settlementAmount: 468000,
        replaceAmount: 286000,
        remark: '尾房置换权益待结算，订单已完成入住核对。',
    },
    {
        replaceOrderId: 'replace-20260517-006',
        orderNo: 'DD-20260517-006',
        channelOrderNo: 'TJ-86720119',
        replaceMonth: '2026-05',
        channelName: '途家',
        roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
        roomName: '2101',
        contactName: '李女士',
        contactMobile: '136****8890',
        stayStatus: 'checkedOut',
        settlementStatus: 'completed',
        checkInDate: '2026-05-14',
        checkOutDate: '2026-05-16',
        settlementDate: '2026-05-17',
        settlementAmount: 842000,
        replaceAmount: 842000,
        remark: '置换权益已结算入账。',
    },
    {
        replaceOrderId: 'replace-20260512-014',
        orderNo: 'DD-20260512-014',
        channelOrderNo: 'XZ-39154026',
        replaceMonth: '2026-05',
        channelName: '小猪',
        roomCategoryName: '天落大床电竞套间',
        roomName: '1208',
        contactName: '王先生',
        contactMobile: '159****7788',
        stayStatus: 'waiting',
        settlementStatus: 'pending',
        checkInDate: '2026-05-19',
        checkOutDate: '2026-05-20',
        settlementDate: '2026-05-22',
        settlementAmount: 1000000,
        replaceAmount: 1000000,
        remark: '已生成置换计划，等待入住完成后结算。',
    },
];
export const defaultDistributionDisplacementFilters = {
    campId: MOCK_CAMP_ID,
    startDate: '',
    endDate: '',
    pageNum: 1,
    pageSize: 20,
};
export function readInitialDistributionDisplacementFilters() {
    const params = new URLSearchParams(window.location.search);
    return {
        ...defaultDistributionDisplacementFilters,
        startDate: params.get('startDate') ?? '',
        endDate: params.get('endDate') ?? '',
        pageNum: Number(params.get('pageNum') ?? '1') || 1,
        pageSize: Number(params.get('pageSize') ?? '20') || 20,
    };
}
export function getDistributionDisplacementProvider() {
    return window.localStorage.getItem('pmsDistributionDisplacementProvider') === 'api' ? 'api' : DISTRIBUTION_DISPLACEMENT_PROVIDER;
}
export function getDistributionDisplacementMockState() {
    const state = new URLSearchParams(window.location.search).get('mockState');
    if (state === 'empty' || state === 'error')
        return state;
    return 'success';
}
export function buildDistributionDisplacementRequestBody(filters) {
    return {
        campId: filters.campId,
        pageNum: filters.pageNum,
        pageSize: filters.pageSize,
        current: filters.pageNum,
        receiverStartTime: toStartOfDay(filters.startDate),
        receiverEndTime: toNextDayStart(filters.endDate),
    };
}
export async function loadDistributionDisplacementData(filters, options) {
    const provider = getDistributionDisplacementProvider();
    const requestBody = buildDistributionDisplacementRequestBody(filters);
    if (provider === 'api')
        return loadFromApi(requestBody, options?.signal);
    return loadFromMock(filters, requestBody, options?.mockState ?? getDistributionDisplacementMockState());
}
async function loadFromMock(filters, requestBody, state) {
    await delay(120);
    const request = createRequest(requestBody, state, 'mock');
    if (isInvalidDateRange(filters)) {
        throw new DistributionDisplacementServiceError(createResponse(400, '日期范围不合法，请重新选择。', request, [], filters));
    }
    if (state === 'error') {
        throw new DistributionDisplacementServiceError(createResponse(503, '置换权益数据加载失败，请稍后重试。', request, [], filters));
    }
    const filteredRows = state === 'empty' ? [] : filterRows(filters);
    return adaptResponse(createResponse(0, 'success', request, filteredRows, filters), requestBody, 'mock');
}
async function loadFromApi(requestBody, signal) {
    const response = await fetch(DISTRIBUTION_DISPLACEMENT_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
        throw new Error(`置换权益接口返回 HTTP ${response.status}`);
    return adaptTargetPayload(payload, requestBody);
}
function createRequest(body, scenario, provider) {
    return {
        provider,
        path: DISTRIBUTION_DISPLACEMENT_LOCAL_PATH,
        targetEndpoint: DISTRIBUTION_DISPLACEMENT_ENDPOINT,
        body,
        scenario,
    };
}
function createResponse(code, message, request, list, filters) {
    return {
        code,
        message,
        data: {
            request,
            summary: buildSummary(list),
            list: paginate(list, filters),
            pagination: {
                page: filters.pageNum,
                pageSize: filters.pageSize,
                total: list.length,
            },
        },
        traceId: `mock-${TASK_ID}-${code === 0 ? 'list' : 'error'}-001`,
        timestamp,
    };
}
function adaptResponse(response, requestBody, provider) {
    if (response.code !== 0)
        throw new DistributionDisplacementServiceError(response);
    return {
        provider,
        endpoint: DISTRIBUTION_DISPLACEMENT_ENDPOINT,
        requestBody,
        traceId: response.traceId,
        timestamp: response.timestamp,
        summary: {
            pendingReplaceAmountText: money(response.data.summary.pendingReplaceAmount),
            completedReplaceAmountText: money(response.data.summary.completedReplaceAmount),
        },
        rows: response.data.list.map(adaptRow),
        pagination: response.data.pagination,
    };
}
function adaptTargetPayload(payload, requestBody) {
    const record = asRecord(payload);
    const data = asRecord(record.data);
    const list = toArray(data.list);
    return {
        provider: 'api',
        endpoint: DISTRIBUTION_DISPLACEMENT_ENDPOINT,
        requestBody,
        traceId: 'api-juhe-fenxiao--fenxiao--zhihuan-quanyi',
        timestamp: new Date().toISOString(),
        summary: {
            pendingReplaceAmountText: money(0),
            completedReplaceAmountText: money(0),
        },
        rows: list.map(adaptUnknownRow),
        pagination: {
            page: toNumber(data.current ?? data.pageNum, 1),
            pageSize: toNumber(data.size, 20),
            total: toNumber(data.total, list.length),
        },
    };
}
function adaptRow(row) {
    return {
        id: row.replaceOrderId,
        orderText: `${row.orderNo} / ${row.channelOrderNo}`,
        replaceMonth: row.replaceMonth,
        channelName: row.channelName,
        roomCategoryName: row.roomCategoryName,
        roomName: row.roomName,
        contactName: row.contactName,
        contactMobile: row.contactMobile,
        stayStatusLabel: stayStatusLabel(row.stayStatus),
        settlementStatusLabel: settlementStatusLabel(row.settlementStatus),
        stayDateRange: `${row.checkInDate} 至 ${row.checkOutDate}`,
        settlementDate: row.settlementDate,
        settlementAmountText: money(row.settlementAmount),
        replaceAmountText: money(row.replaceAmount),
        remark: row.remark,
    };
}
function adaptUnknownRow(value, index) {
    const row = asRecord(value);
    return {
        id: pickString(row, ['replaceOrderId', 'id', 'orderId']) ?? `replace-order-${index}`,
        orderText: `${pickString(row, ['orderNo']) ?? '-'} / ${pickString(row, ['channelOrderNo']) ?? '-'}`,
        replaceMonth: pickString(row, ['replaceMonth']) ?? '-',
        channelName: pickString(row, ['channelName']) ?? '-',
        roomCategoryName: pickString(row, ['roomCategoryName']) ?? '-',
        roomName: pickString(row, ['roomName']) ?? '-',
        contactName: pickString(row, ['contactName', 'receiverName']) ?? '-',
        contactMobile: pickString(row, ['contactMobile', 'receiverMobile']) ?? '-',
        stayStatusLabel: pickString(row, ['stayStatusName']) ?? '-',
        settlementStatusLabel: pickString(row, ['settlementStatusName']) ?? '-',
        stayDateRange: `${pickString(row, ['checkInDate']) ?? '-'} 至 ${pickString(row, ['checkOutDate']) ?? '-'}`,
        settlementDate: pickString(row, ['settlementDate']) ?? '-',
        settlementAmountText: money(row.settlementAmount),
        replaceAmountText: money(row.replaceAmount),
        remark: pickString(row, ['remark']) ?? '-',
    };
}
function buildSummary(list) {
    return list.reduce((summary, row) => {
        if (row.settlementStatus === 'completed')
            summary.completedReplaceAmount += row.replaceAmount;
        else
            summary.pendingReplaceAmount += row.replaceAmount;
        return summary;
    }, { pendingReplaceAmount: 0, completedReplaceAmount: 0 });
}
function filterRows(filters) {
    const start = toStartOfDay(filters.startDate);
    const end = toNextDayStart(filters.endDate);
    return rows.filter((row) => {
        const settlementTime = toStartOfDay(row.settlementDate);
        const matchesStart = typeof start === 'number' ? settlementTime !== null && settlementTime >= start : true;
        const matchesEnd = typeof end === 'number' ? settlementTime !== null && settlementTime < end : true;
        return matchesStart && matchesEnd;
    });
}
function paginate(list, filters) {
    const start = (filters.pageNum - 1) * filters.pageSize;
    return list.slice(start, start + filters.pageSize);
}
function isInvalidDateRange(filters) {
    const start = toStartOfDay(filters.startDate);
    const end = toNextDayStart(filters.endDate);
    return typeof start === 'number' && typeof end === 'number' && start >= end;
}
function stayStatusLabel(status) {
    const map = {
        waiting: '待入住',
        living: '入住中',
        checkedOut: '已退房',
    };
    return map[status];
}
function settlementStatusLabel(status) {
    return status === 'completed' ? '已置换' : '待置换';
}
function toStartOfDay(date) {
    if (!date)
        return null;
    const timestamp = new Date(`${date}T00:00:00+08:00`).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
}
function toNextDayStart(date) {
    const start = toStartOfDay(date);
    if (typeof start !== 'number')
        return null;
    return start + 24 * 60 * 60 * 1000;
}
function money(value) {
    if (value === null || value === undefined || value === '')
        return '¥0.00';
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric))
        return String(value);
    const yuan = Math.abs(numeric) >= 100 ? numeric / 100 : numeric;
    return `¥${new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(yuan)}`;
}
function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function toArray(value) {
    return Array.isArray(value) ? value : [];
}
function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
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
