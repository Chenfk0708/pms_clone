const realBaseUrl = '/api';
const totalLedgerEndpoint = '/accountBookPaymentWay/page/get';
const exportExcelMenuId = '1898993554540892176';
const defaultCampId = '1796067693589061634';
const defaultStoreName = '天落会宿公寓(前海壹方城宝安中心店)';
const mockTimestamp = '2026-05-19T17:40:00+08:00';
const mockLatencyMs = 900;
const defaultQuery = {
    campId: resolveCampId(),
    beginTime: '2026-05-18',
    endTime: '2026-05-18',
    poiIds: [],
    pageNum: 1,
    pageSize: 20,
};
const rangePresets = [
    { key: 'yesterday', label: '昨天', beginTime: '2026-05-18', endTime: '2026-05-18' },
    { key: 'today', label: '今天', beginTime: '2026-05-19', endTime: '2026-05-19' },
    { key: 'lastWeek', label: '上周', beginTime: '2026-05-11', endTime: '2026-05-17' },
    { key: 'thisWeek', label: '本周', beginTime: '2026-05-18', endTime: '2026-05-19' },
    { key: 'lastMonth', label: '上月', beginTime: '2026-04-01', endTime: '2026-04-30' },
    { key: 'thisMonth', label: '本月', beginTime: '2026-05-01', endTime: '2026-05-19' },
];
const storeOptions = [
    { id: 'all', label: '全部门店' },
    { id: defaultCampId, label: defaultStoreName },
];
const mockScenariosByRange = {
    yesterday: {
        paymentWays: [{ paymentWayId: '1', paymentWayName: '平台代收', incomePrice: 1002.54, expendPrice: 0 }],
        rows: [
            { date: '合计', values: { '1': 1002.54 } },
            { date: '2026-05-18', values: { '1': 1002.54 } },
        ],
    },
    today: {
        paymentWays: [{ paymentWayId: '1', paymentWayName: '平台代收', incomePrice: 328.66, expendPrice: 0 }],
        rows: [
            { date: '合计', values: { '1': 328.66 } },
            { date: '2026-05-19', values: { '1': 328.66 } },
        ],
    },
    lastWeek: {
        paymentWays: [{ paymentWayId: '1', paymentWayName: '平台代收', incomePrice: 3680.2, expendPrice: 126.4 }],
        rows: [
            { date: '合计', values: { '1': 3553.8 } },
            { date: '2026-05-11', values: { '1': 618.2 } },
            { date: '2026-05-12', values: { '1': 520.4 } },
            { date: '2026-05-13', values: { '1': 488.36 } },
            { date: '2026-05-14', values: { '1': 703.1 } },
            { date: '2026-05-15', values: { '1': 421.9 } },
            { date: '2026-05-16', values: { '1': 377.8 } },
            { date: '2026-05-17', values: { '1': 424.04 } },
        ],
    },
    thisWeek: {
        paymentWays: [{ paymentWayId: '1', paymentWayName: '平台代收', incomePrice: 1331.2, expendPrice: 0 }],
        rows: [
            { date: '合计', values: { '1': 1331.2 } },
            { date: '2026-05-18', values: { '1': 1002.54 } },
            { date: '2026-05-19', values: { '1': 328.66 } },
        ],
    },
    lastMonth: {
        paymentWays: [{ paymentWayId: '1', paymentWayName: '平台代收', incomePrice: 0, expendPrice: 0 }],
        rows: [{ date: '合计', values: { '1': 0 } }],
    },
    thisMonth: {
        paymentWays: [{ paymentWayId: '1', paymentWayName: '平台代收', incomePrice: 21024.36, expendPrice: 380.12 }],
        rows: [
            { date: '合计', values: { '1': 20644.24 } },
            { date: '2026-05-18', values: { '1': 1002.54 } },
            { date: '2026-05-19', values: { '1': 328.66 } },
        ],
    },
};
export function getDefaultTotalLedgerQuery() {
    return { ...defaultQuery, campId: resolveCampId(), poiIds: [...defaultQuery.poiIds] };
}
export function getTotalLedgerRangePresets() {
    return rangePresets.map((item) => ({ ...item }));
}
export function getDefaultTotalLedgerRangeKey(query) {
    return (rangePresets.find((item) => item.beginTime === query.beginTime && item.endTime === query.endTime)?.key ?? 'yesterday');
}
export function getTotalLedgerProviderName() {
    return resolveProvider();
}
export async function loadTotalLedgerData(query, signal) {
    if (resolveProvider() === 'api') {
        return loadRealTotalLedgerData(query, signal);
    }
    await waitForMockLatency(signal);
    const envelope = buildMockEnvelope(query);
    return adaptEnvelope(envelope, query, 'mock', resolveMockMode());
}
export async function exportTotalLedger(query, signal) {
    if (resolveProvider() === 'api') {
        await postHudson(totalLedgerEndpoint, {
            ...query,
            exportExcelMenuId,
            pageNum: 1,
            pageSize: 999999,
        }, signal);
        return {
            provider: 'api',
            traceId: 'api-accountBookPaymentWay-page-get-export',
            message: '已生成收支汇总导出任务',
        };
    }
    await waitForMockLatency(signal);
    if (resolveMockMode() === 'error') {
        throw new Error('收支汇总导出失败，请稍后重试');
    }
    return {
        provider: 'mock',
        traceId: `mock-baobiao--shouzhi-mingxibiao--shouzhi-huizong-export-${resolveMockMode()}-001`,
        message: '已生成收支汇总导出任务',
    };
}
function resolveProvider() {
    const configured = readRuntimeConfig('pms.totalLedgerProvider') || import.meta.env.VITE_TOTAL_LEDGER_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function resolveMockMode() {
    const fromUrl = readUrlMockMode();
    if (fromUrl)
        return fromUrl;
    const configured = readRuntimeConfig('pms.totalLedgerMockMode') || import.meta.env.VITE_TOTAL_LEDGER_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function readUrlMockMode() {
    if (typeof window === 'undefined')
        return '';
    const configured = readMockModeFromSearch(window.location.search) ||
        readMockModeFromSearch(window.location.hash.split('?')[1] ? `?${window.location.hash.split('?')[1]}` : '');
    return configured === 'success' || configured === 'empty' || configured === 'error' ? configured : '';
}
function readMockModeFromSearch(search) {
    const params = new URLSearchParams(search);
    return params.get('mockState') || params.get('totalLedgerMockMode') || '';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function resolveCampId(fallback = defaultCampId) {
    const storageCampId = readRuntimeConfig('pmsCampId') || readRuntimeConfig('pms.currentCampId') || readRuntimeConfig('pms.campId');
    const envCampId = import.meta.env.VITE_PMS_CAMP_ID?.trim() || '';
    return storageCampId || envCampId || fallback;
}
async function waitForMockLatency(signal) {
    if (signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');
    await new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, mockLatencyMs);
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
            message: '收支汇总服务暂不可用，请稍后重试',
            data: null,
            traceId: 'mock-baobiao--shouzhi-mingxibiao--shouzhi-huizong-error-001',
            timestamp: mockTimestamp,
        };
    }
    if (mode === 'empty') {
        return {
            code: 0,
            message: 'success',
            data: {
                total: 0,
                size: query.pageSize,
                current: query.pageNum,
                pageNum: query.pageNum,
                hasNextPage: false,
                pages: 0,
                list: [],
                extraInfo: {
                    income: [],
                    expend: [],
                    totalInfo: {
                        totalIncomePrice: 0,
                        totalExpendPrice: 0,
                        netIncome: 0,
                    },
                },
            },
            traceId: 'mock-baobiao--shouzhi-mingxibiao--shouzhi-huizong-empty-001',
            timestamp: mockTimestamp,
        };
    }
    const scenario = resolveScenario(query);
    const income = scenario.paymentWays.map((item) => ({
        paymentWayId: item.paymentWayId,
        paymentWayName: item.paymentWayName,
        price: item.incomePrice,
    }));
    const expend = scenario.paymentWays.map((item) => ({
        paymentWayId: item.paymentWayId,
        paymentWayName: item.paymentWayName,
        price: item.expendPrice,
    }));
    const totalIncomePrice = income.reduce((total, item) => total + item.price, 0);
    const totalExpendPrice = expend.reduce((total, item) => total + item.price, 0);
    return {
        code: 0,
        message: 'success',
        data: {
            total: scenario.rows.length,
            size: query.pageSize,
            current: query.pageNum,
            pageNum: query.pageNum,
            hasNextPage: false,
            pages: 1,
            list: scenario.rows.map((row) => ({
                date: row.date,
                paymentWayPriceDetailViews: scenario.paymentWays.map((item) => ({
                    paymentWayId: item.paymentWayId,
                    paymentWayName: item.paymentWayName,
                    price: row.values[item.paymentWayId] ?? 0,
                })),
            })),
            extraInfo: {
                income,
                expend,
                totalInfo: {
                    totalIncomePrice,
                    totalExpendPrice,
                    netIncome: roundAmount(totalIncomePrice - totalExpendPrice),
                },
            },
        },
        traceId: 'mock-baobiao--shouzhi-mingxibiao--shouzhi-huizong-success-001',
        timestamp: mockTimestamp,
    };
}
function resolveScenario(query) {
    const matchedRange = rangePresets.find((item) => item.beginTime === query.beginTime && item.endTime === query.endTime)?.key;
    return mockScenariosByRange[matchedRange ?? 'yesterday'];
}
function adaptEnvelope(envelope, query, provider, mockState) {
    if (envelope.code !== 0 || !envelope.data) {
        throw new Error(envelope.message || '收支汇总服务暂不可用，请稍后重试');
    }
    return adaptPayload(envelope.data, query, provider, mockState, envelope.traceId, envelope.timestamp);
}
async function loadRealTotalLedgerData(query, signal) {
    const apiQuery = { ...query, campId: resolveCampId(query.campId), poiIds: [...query.poiIds] };
    const payload = await postHudson(totalLedgerEndpoint, apiQuery, signal);
    return adaptPayload(payload, apiQuery, 'api', 'success', 'api-accountBookPaymentWay-page-get', new Date().toISOString());
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
        throw new Error(payload?.errorMsg ?? payload?.errorDetail ?? payload?.errorCode ?? `${endpoint} 返回 HTTP ${response.status}`);
    }
    if (!payload || payload.data === undefined || payload.data === null) {
        throw new Error(`${endpoint} 响应缺少 data 字段`);
    }
    return payload.data;
}
function adaptPayload(payload, query, provider, mockState, traceId, timestamp) {
    const record = asRecord(payload);
    const extraInfo = asRecord(record.extraInfo);
    const income = asArray(extraInfo.income).map(adaptPaymentWayAmount);
    const expend = asArray(extraInfo.expend).map(adaptPaymentWayAmount);
    const paymentWays = mergePaymentWays(income, expend);
    const rows = asArray(record.list).map((item) => adaptRow(item, paymentWays));
    const totalInfo = asRecord(extraInfo.totalInfo);
    return {
        provider,
        mockState,
        endpoint: totalLedgerEndpoint,
        exportEndpoint: totalLedgerEndpoint,
        traceId,
        timestamp,
        requestBody: { ...query, poiIds: [...query.poiIds] },
        requestSummary: buildRequestSummary(query, traceId),
        stores: storeOptions.map((item) => ({ ...item })),
        paymentWays,
        summary: {
            netIncome: readNumber(totalInfo.netIncome, income.reduce((sum, item) => sum + item.price, 0) - expend.reduce((sum, item) => sum + item.price, 0)),
            totalIncomePrice: readNumber(totalInfo.totalIncomePrice, income.reduce((sum, item) => sum + item.price, 0)),
            totalExpendPrice: readNumber(totalInfo.totalExpendPrice, expend.reduce((sum, item) => sum + item.price, 0)),
        },
        income,
        expend,
        rows,
        pagination: {
            current: readNumber(record.current ?? record.pageNum, query.pageNum),
            pageSize: readNumber(record.size, query.pageSize),
            total: readNumber(record.total, rows.length),
            pages: readNumber(record.pages, rows.length ? 1 : 0),
            hasNextPage: Boolean(record.hasNextPage),
        },
    };
}
function adaptPaymentWayAmount(value) {
    const item = asRecord(value);
    return {
        paymentWayId: String(item.paymentWayId ?? ''),
        paymentWayName: String(item.paymentWayName ?? ''),
        price: readNumber(item.price, 0),
    };
}
function mergePaymentWays(income, expend) {
    const merged = new Map();
    for (const item of income) {
        merged.set(item.paymentWayId, {
            paymentWayId: item.paymentWayId,
            paymentWayName: item.paymentWayName,
            incomePrice: item.price,
            expendPrice: 0,
        });
    }
    for (const item of expend) {
        const current = merged.get(item.paymentWayId);
        if (current) {
            current.expendPrice = item.price;
            if (!current.paymentWayName)
                current.paymentWayName = item.paymentWayName;
            continue;
        }
        merged.set(item.paymentWayId, {
            paymentWayId: item.paymentWayId,
            paymentWayName: item.paymentWayName,
            incomePrice: 0,
            expendPrice: item.price,
        });
    }
    return [...merged.values()];
}
function adaptRow(value, paymentWays) {
    const item = asRecord(value);
    const details = asArray(item.paymentWayPriceDetailViews).map(adaptPaymentWayAmount);
    const values = {};
    for (const way of paymentWays) {
        values[way.paymentWayId] = 0;
    }
    for (const detail of details) {
        values[detail.paymentWayId] = detail.price;
    }
    return {
        date: String(item.date ?? ''),
        paymentWayPriceDetailViews: details,
        values,
    };
}
function buildRequestSummary(query, traceId) {
    return [
        `traceId=${traceId}`,
        `path=${totalLedgerEndpoint}`,
        `campId=${query.campId}`,
        `beginTime=${query.beginTime}`,
        `endTime=${query.endTime}`,
        `poiIds=${query.poiIds.join(',') || '全部门店'}`,
        `pageNum=${query.pageNum}`,
        `pageSize=${query.pageSize}`,
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
