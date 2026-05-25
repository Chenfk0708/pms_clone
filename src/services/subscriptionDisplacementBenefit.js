const HUDSON_BASE_URL = 'https://hudson-prod.localhome.cn';
const TASK_ID = 'yingyong-dingyue--quanyi-yu-dingyue--zhihuan-quanyi';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_TIMESTAMP = '2026-05-19T20:40:00+08:00';
const PROVIDER_KEY = 'pms.subscriptionDisplacementBenefit.provider';
const DIAGNOSTICS_KEY = 'pms.subscriptionDisplacementBenefit.lastRequest';
export const SUBSCRIPTION_DISPLACEMENT_BENEFIT_ENDPOINT = `${HUDSON_BASE_URL}/edition/replace/order/get`;
export const SUBSCRIPTION_DISPLACEMENT_BENEFIT_PAYMENT_TYPES_ENDPOINT = `${HUDSON_BASE_URL}/paymentTypes/get/v2`;
export const SUBSCRIPTION_DISPLACEMENT_BENEFIT_LOCAL_PATH = '/version/displacementBenefit';
export class SubscriptionDisplacementBenefitServiceError extends Error {
    diagnostics;
    constructor(message, diagnostics) {
        super(message);
        this.name = 'SubscriptionDisplacementBenefitServiceError';
        this.diagnostics = diagnostics;
    }
}
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
const paymentTypeSummary = ['住宿收入', '平台代收', '尾房置换结算'];
export const defaultSubscriptionDisplacementBenefitFilters = {
    campId: DEFAULT_CAMP_ID,
    startDate: '',
    endDate: '',
    pageNum: 1,
    pageSize: 20,
};
export function readInitialSubscriptionDisplacementBenefitFilters() {
    const params = new URLSearchParams(window.location.search);
    return {
        ...defaultSubscriptionDisplacementBenefitFilters,
        campId: params.get('campId') || DEFAULT_CAMP_ID,
        startDate: params.get('startDate') ?? '',
        endDate: params.get('endDate') ?? '',
        pageNum: Number(params.get('pageNum') ?? '1') || 1,
        pageSize: Number(params.get('pageSize') ?? '20') || 20,
    };
}
export function getSubscriptionDisplacementBenefitProvider() {
    if (typeof window === 'undefined')
        return 'mock';
    return window.localStorage.getItem(PROVIDER_KEY) === 'api' ? 'api' : 'mock';
}
export function getSubscriptionDisplacementBenefitMockState() {
    const state = new URLSearchParams(window.location.search).get('mockState');
    if (state === 'empty' || state === 'error')
        return state;
    return 'success';
}
export function buildSubscriptionDisplacementBenefitRequestBody(filters) {
    return {
        campId: filters.campId,
        pageNum: filters.pageNum,
        pageSize: filters.pageSize,
        current: filters.pageNum,
        receiverStartTime: toStartOfDay(filters.startDate),
        receiverEndTime: toNextDayStart(filters.endDate),
    };
}
export function buildSubscriptionDisplacementBenefitPaymentTypesRequestBody(filters) {
    return {
        campId: filters.campId,
        bizTypes: [3],
        isEnable: 1,
    };
}
export async function loadSubscriptionDisplacementBenefitData(filters, options) {
    const provider = getSubscriptionDisplacementBenefitProvider();
    const requestBody = buildSubscriptionDisplacementBenefitRequestBody(filters);
    const paymentTypesRequestBody = buildSubscriptionDisplacementBenefitPaymentTypesRequestBody(filters);
    const state = options?.mockState ?? getSubscriptionDisplacementBenefitMockState();
    const action = options?.action ?? 'load';
    if (provider === 'api') {
        return loadFromApi(requestBody, paymentTypesRequestBody, state, action, options?.signal);
    }
    return loadFromMock(filters, requestBody, paymentTypesRequestBody, state, action, options?.signal);
}
export async function exportSubscriptionDisplacementBenefitData(filters) {
    const provider = getSubscriptionDisplacementBenefitProvider();
    const state = getSubscriptionDisplacementBenefitMockState();
    const requestBody = buildSubscriptionDisplacementBenefitRequestBody(filters);
    const paymentTypesRequestBody = buildSubscriptionDisplacementBenefitPaymentTypesRequestBody(filters);
    await delay(120);
    const filteredRows = state === 'empty' ? [] : filterRows(filters);
    const diagnostics = createDiagnostics({
        provider,
        action: 'export',
        state,
        requestBody,
        paymentTypesRequestBody,
        traceId: `mock-${TASK_ID}-export-001`,
        timestamp: new Date().toISOString(),
        total: filteredRows.length,
    });
    writeDiagnostics(diagnostics);
    if (state === 'error') {
        throw new SubscriptionDisplacementBenefitServiceError('导出任务创建失败，请稍后重试。', diagnostics);
    }
    return {
        provider,
        traceId: diagnostics.traceId,
        timestamp: diagnostics.timestamp,
        total: filteredRows.length,
        message: `导出任务已创建，共 ${filteredRows.length} 条`,
    };
}
async function loadFromMock(filters, requestBody, paymentTypesRequestBody, state, action, signal) {
    await delay(120, signal);
    const diagnosticsBase = {
        provider: 'mock',
        action,
        state,
        requestBody,
        paymentTypesRequestBody,
    };
    if (isInvalidDateRange(filters)) {
        const diagnostics = createDiagnostics({
            ...diagnosticsBase,
            traceId: `mock-${TASK_ID}-invalid-date-001`,
            timestamp: DEFAULT_TIMESTAMP,
            total: 0,
        });
        writeDiagnostics(diagnostics);
        throw new SubscriptionDisplacementBenefitServiceError('日期范围不合法，请重新选择。', diagnostics);
    }
    if (state === 'error') {
        const diagnostics = createDiagnostics({
            ...diagnosticsBase,
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: DEFAULT_TIMESTAMP,
            total: 0,
        });
        writeDiagnostics(diagnostics);
        throw new SubscriptionDisplacementBenefitServiceError('置换权益数据加载失败，请稍后重试。', diagnostics);
    }
    const filteredRows = state === 'empty' ? [] : filterRows(filters);
    const envelope = createMockEnvelope(filteredRows, filters, requestBody, state);
    const paymentEnvelope = createPaymentTypesEnvelope();
    return adaptUnifiedResponse('mock', action, requestBody, paymentTypesRequestBody, state, envelope, paymentEnvelope);
}
async function loadFromApi(requestBody, paymentTypesRequestBody, state, action, signal) {
    const [listResponse, paymentTypesResponse] = await Promise.all([
        fetch(SUBSCRIPTION_DISPLACEMENT_BENEFIT_ENDPOINT, {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal,
        }),
        fetch(SUBSCRIPTION_DISPLACEMENT_BENEFIT_PAYMENT_TYPES_ENDPOINT, {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(paymentTypesRequestBody),
            signal,
        }),
    ]);
    const listPayload = (await listResponse.json().catch(() => null));
    const paymentTypesPayload = (await paymentTypesResponse.json().catch(() => null));
    if (!listResponse.ok) {
        throw new Error(`置换权益接口返回 HTTP ${listResponse.status}`);
    }
    return adaptTargetPayload(requestBody, paymentTypesRequestBody, state, action, listPayload, paymentTypesPayload);
}
function createMockEnvelope(list, filters, requestBody, state) {
    return {
        code: 0,
        message: 'success',
        data: {
            request: {
                provider: 'mock',
                path: SUBSCRIPTION_DISPLACEMENT_BENEFIT_LOCAL_PATH,
                targetEndpoint: SUBSCRIPTION_DISPLACEMENT_BENEFIT_ENDPOINT,
                body: requestBody,
                scenario: state,
            },
            summary: buildSummary(list),
            list: paginate(list, filters),
            pagination: {
                page: filters.pageNum,
                pageSize: filters.pageSize,
                total: list.length,
            },
        },
        traceId: `mock-${TASK_ID}-list-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function createPaymentTypesEnvelope() {
    return {
        code: 0,
        message: 'success',
        data: {
            paymentGroups: [
                {
                    groupType: 1,
                    groupTypeName: '住宿',
                    paymentTypes: [
                        {
                            paymentTypeId: 'benefit-001',
                            paymentTypeName: '尾房置换结算',
                            ignoreOrderGetItem: 0,
                            isCustom: 0,
                            isIncome: 1,
                            isEnable: 1,
                            bizType: 3,
                            groupType: 1,
                        },
                    ],
                },
            ],
        },
        traceId: `mock-${TASK_ID}-payment-types-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function adaptUnifiedResponse(provider, action, requestBody, paymentTypesRequestBody, state, envelope, paymentEnvelope) {
    if (envelope.code !== 0) {
        const diagnostics = createDiagnostics({
            provider,
            action,
            state,
            requestBody,
            paymentTypesRequestBody,
            traceId: envelope.traceId,
            timestamp: envelope.timestamp,
            total: 0,
        });
        writeDiagnostics(diagnostics);
        throw new SubscriptionDisplacementBenefitServiceError(envelope.message || '置换权益数据加载失败，请稍后重试。', diagnostics);
    }
    const total = envelope.data.pagination.total;
    const diagnostics = createDiagnostics({
        provider,
        action,
        state,
        requestBody,
        paymentTypesRequestBody,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
        total,
    });
    writeDiagnostics(diagnostics);
    return {
        provider,
        endpoint: SUBSCRIPTION_DISPLACEMENT_BENEFIT_ENDPOINT,
        paymentTypesEndpoint: SUBSCRIPTION_DISPLACEMENT_BENEFIT_PAYMENT_TYPES_ENDPOINT,
        requestBody,
        paymentTypesRequestBody,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
        summary: {
            pendingReplaceAmountText: money(envelope.data.summary.pendingReplaceAmount),
            completedReplaceAmountText: money(envelope.data.summary.completedReplaceAmount),
        },
        rows: envelope.data.list.map(adaptRow),
        pagination: envelope.data.pagination,
        paymentTypeSummary: adaptPaymentTypes(paymentEnvelope.data),
        diagnostics,
    };
}
function adaptTargetPayload(requestBody, paymentTypesRequestBody, state, action, listPayload, paymentTypesPayload) {
    const listData = asRecord(listPayload?.data);
    const list = toArray(listData.list ?? listData.records ?? listData.rows);
    const total = toNumber(listData.total, list.length);
    const traceId = `api-${TASK_ID}-list`;
    const timestamp = new Date().toISOString();
    const diagnostics = createDiagnostics({
        provider: 'api',
        action,
        state,
        requestBody,
        paymentTypesRequestBody,
        traceId,
        timestamp,
        total,
    });
    writeDiagnostics(diagnostics);
    return {
        provider: 'api',
        endpoint: SUBSCRIPTION_DISPLACEMENT_BENEFIT_ENDPOINT,
        paymentTypesEndpoint: SUBSCRIPTION_DISPLACEMENT_BENEFIT_PAYMENT_TYPES_ENDPOINT,
        requestBody,
        paymentTypesRequestBody,
        traceId,
        timestamp,
        summary: {
            pendingReplaceAmountText: money(listData.pendingReplaceAmount ?? listData.waitReplaceAmount ?? 0),
            completedReplaceAmountText: money(listData.completedReplaceAmount ?? listData.finishReplaceAmount ?? 0),
        },
        rows: list.map(adaptUnknownRow),
        pagination: {
            page: toNumber(listData.current ?? listData.pageNum, 1),
            pageSize: toNumber(listData.size ?? listData.pageSize, 20),
            total,
        },
        paymentTypeSummary: adaptPaymentTypes(paymentTypesPayload?.data),
        diagnostics,
    };
}
function adaptPaymentTypes(payload) {
    const groups = Array.isArray(payload?.paymentGroups) ? payload.paymentGroups : [];
    const names = groups.flatMap((group) => Array.isArray(group.paymentTypes) ? group.paymentTypes.map((item) => item.paymentTypeName).filter(Boolean) : []);
    return names.length > 0 ? names.slice(0, 3) : paymentTypeSummary;
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
function createDiagnostics(input) {
    return {
        provider: input.provider,
        action: input.action,
        state: input.state,
        endpoint: SUBSCRIPTION_DISPLACEMENT_BENEFIT_ENDPOINT,
        paymentTypesEndpoint: SUBSCRIPTION_DISPLACEMENT_BENEFIT_PAYMENT_TYPES_ENDPOINT,
        requestBody: input.requestBody,
        paymentTypesRequestBody: input.paymentTypesRequestBody,
        traceId: input.traceId,
        timestamp: input.timestamp,
        total: input.total,
    };
}
function writeDiagnostics(value) {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem(DIAGNOSTICS_KEY, JSON.stringify(value));
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
function delay(ms, signal) {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        function onAbort() {
            window.clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            reject(new DOMException('Aborted', 'AbortError'));
        }
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}
