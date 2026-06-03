const realBaseUrl = '/api';
const flowEndpoint = '/report/flows/get';
const defaultCampId = '1796067693589061634';
const defaultCampName = '天落会宿公寓(前海壹方城宝安中心店)';
const mockRows = [
    {
        orderId: '2054409001821356034',
        customerInfo: '陈崇科/+8618319045566',
        roomCategoryName: '天落大床电竞套间',
        bookedTime: '2026-05-13 11:50:49',
        invoicePrice: 435,
        commission: 65.25,
        incomePrice: 369.75,
        settledPrice: 0,
        settledState: 'pending',
    },
];
export async function loadDistributionOrderData(query, signal) {
    if (resolveProvider() === 'api') {
        return loadRealDistributionOrderData(query, signal);
    }
    await waitForMockLatency(signal);
    const envelope = buildMockEnvelope(query);
    return adaptEnvelope(envelope, query, 'mock');
}
export function getDistributionOrderProviderName() {
    return resolveProvider();
}
function resolveProvider() {
    const configured = readRuntimeConfig('pms.distributionOrderProvider') || import.meta.env.VITE_DISTRIBUTION_ORDER_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function resolveMockMode() {
    const fromUrl = readUrlMockMode();
    if (fromUrl)
        return fromUrl;
    const configured = readRuntimeConfig('pms.distributionOrderMockMode') || import.meta.env.VITE_DISTRIBUTION_ORDER_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function readUrlMockMode() {
    if (typeof window === 'undefined')
        return '';
    const params = new URLSearchParams(window.location.search);
    const configured = params.get('mockState') || params.get('distributionOrderMockMode');
    return configured === 'empty' || configured === 'error' || configured === 'success' ? configured : '';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
async function waitForMockLatency(signal) {
    if (signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');
    await new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, 80);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
function buildMockEnvelope(query) {
    const mode = resolveMockMode();
    if (mode === 'error') {
        return {
            code: 50318,
            message: '聚合分销订单服务暂不可用，请稍后重试',
            data: null,
            traceId: 'mock-juhe-fenxiao--fenxiao--juhe-fenxiao-dingdan-error-001',
            timestamp: '2026-05-18T10:00:00+08:00',
        };
    }
    const list = mode === 'empty' ? [] : filterRows(mockRows, query);
    const summary = summarizeRows(list);
    return {
        code: 0,
        message: 'success',
        data: {
            camp: {
                campId: query.campId || defaultCampId,
                campName: defaultCampName,
            },
            list,
            summary,
            pagination: {
                page: query.page ?? 1,
                pageSize: query.pageSize ?? 20,
                total: mode === 'empty' ? 0 : 2,
            },
        },
        traceId: mode === 'empty'
            ? 'mock-juhe-fenxiao--fenxiao--juhe-fenxiao-dingdan-empty-001'
            : 'mock-juhe-fenxiao--fenxiao--juhe-fenxiao-dingdan-list-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function filterRows(rows, query) {
    const keyword = query.keyword?.trim();
    return rows.filter((item) => {
        if (query.settlementState && item.settledState !== query.settlementState)
            return false;
        if (keyword &&
            !item.orderId.includes(keyword) &&
            !item.customerInfo.includes(keyword) &&
            !item.roomCategoryName.includes(keyword)) {
            return false;
        }
        return true;
    });
}
function summarizeRows(rows) {
    return rows.reduce((summary, item) => ({
        invoicePrice: roundAmount(summary.invoicePrice + item.invoicePrice),
        commission: roundAmount(summary.commission + item.commission),
        incomePrice: roundAmount(summary.incomePrice + item.incomePrice),
        settledPrice: roundAmount(summary.settledPrice + item.settledPrice),
    }), { invoicePrice: 0, commission: 0, incomePrice: 0, settledPrice: 0 });
}
function adaptEnvelope(envelope, query, provider) {
    if (envelope.code !== 0 || !envelope.data) {
        throw new Error(envelope.message || '聚合分销订单服务暂不可用，请稍后重试');
    }
    return {
        provider,
        campId: envelope.data.camp.campId,
        campName: envelope.data.camp.campName,
        list: envelope.data.list,
        summary: envelope.data.summary,
        pagination: envelope.data.pagination,
        requestedAt: envelope.timestamp,
        requestSummary: buildRequestSummary(query, envelope.traceId),
    };
}
async function loadRealDistributionOrderData(query, signal) {
    const payload = await postHudson(flowEndpoint, createRealRequest(query), signal);
    const record = asRecord(payload);
    const list = asArray(record.list).map(adaptRealItem);
    const pagination = {
        page: readNumber(record.pageNum ?? record.current, query.page ?? 1),
        pageSize: readNumber(record.size, query.pageSize ?? 20),
        total: readNumber(record.total, list.length),
    };
    return {
        provider: 'api',
        campId: query.campId || defaultCampId,
        campName: defaultCampName,
        list,
        summary: summarizeRows(list),
        pagination,
        requestedAt: new Date().toISOString(),
        requestSummary: buildRequestSummary(query, 'api-hudson-report-flows-get'),
    };
}
function createRealRequest(query) {
    return {
        campId: query.campId || defaultCampId,
        pageNum: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        current: query.page ?? 1,
        bookingStartDate: query.bookingStartDate,
        bookingEndDate: query.bookingEndDate,
        keyword: query.keyword?.trim() || undefined,
        settledState: query.settlementState || undefined,
        breakTemp: false,
    };
}
async function postHudson(endpoint, body, signal) {
    const response = await fetch(`${realBaseUrl}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });
    let payload;
    try {
        payload = (await response.json());
    }
    catch {
        payload = null;
    }
    if (!response.ok || payload?.success === false) {
        throw new Error(payload?.errorMsg ?? payload?.errorCode ?? `${endpoint} 返回 HTTP ${response.status}`);
    }
    if (!payload || payload.data === undefined || payload.data === null) {
        throw new Error(`${endpoint} 响应缺少 data 字段`);
    }
    return payload.data;
}
function adaptRealItem(value) {
    const item = asRecord(value);
    return {
        orderId: String(item.orderId ?? ''),
        customerInfo: String(item.customerInfo ?? ''),
        roomCategoryName: String(item.roomCategoryName ?? ''),
        bookedTime: String(item.bookedTimeStr ?? item.bookedTime ?? ''),
        invoicePrice: readNumber(item.invoicePrice, 0),
        commission: readNumber(item.commission, 0),
        incomePrice: readNumber(item.incomePrice, 0),
        settledPrice: readNumber(item.settledPrice, 0),
        settledState: readSettlementState(item.settledState),
    };
}
function readSettlementState(value) {
    return value === 1 || value === 'settled' || value === '已结算' ? 'settled' : 'pending';
}
function buildRequestSummary(query, traceId) {
    return [
        `traceId=${traceId}`,
        `path=${flowEndpoint}`,
        `campId=${query.campId || defaultCampId}`,
        `bookingStartDate=${query.bookingStartDate}`,
        `bookingEndDate=${query.bookingEndDate}`,
        `keyword=${query.keyword?.trim() || '全部订单'}`,
        `settlementState=${query.settlementState || '全部结算状态'}`,
        `page=${query.page ?? 1}`,
        `pageSize=${query.pageSize ?? 20}`,
    ];
}
function readNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function roundAmount(value) {
    return Math.round(value * 100) / 100;
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
