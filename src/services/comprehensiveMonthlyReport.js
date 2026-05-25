export class ComprehensiveMonthlyReportServiceError extends Error {
    response;
    constructor(response) {
        super(response.message);
        this.name = 'ComprehensiveMonthlyReportServiceError';
        this.response = response;
    }
}
const TASK_ID = 'baobiao--tongji-baobiao--zonghe-yuebao';
const ENDPOINT = 'https://hudson-prod.localhome.cn/report/monthly/page/get';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_QUERY_RANGE = {
    startDate: '2026-01-01',
    endDate: '2026-04-30',
};
const DEFAULT_PAGE_SIZE = 20;
const mockItems = [
    createMockItem('2026年04月', '2026-04-01', '2026-04-30', {
        includeCommissionRoomPrice: 21843.69,
        orderOtherExpense: 0,
        writeDownIncome: 0,
        businessIncome: 21843.69,
        occ: '29.17%',
        adr: 624.11,
        revPar: 182.05,
        createTime: '2026-05-01T09:41:53+08:00',
        userName: '系统自动',
        inventory: 120,
        openRoomCount: 35,
    }),
    createMockItem('2026年03月', '2026-03-01', '2026-03-31', {
        includeCommissionRoomPrice: 27305.34,
        orderOtherExpense: 0,
        writeDownIncome: 0,
        businessIncome: 27305.34,
        occ: '39.52%',
        adr: 557.25,
        revPar: 220.23,
        createTime: '2026-04-01T09:38:28+08:00',
        userName: '系统自动',
        inventory: 124,
        openRoomCount: 49,
    }),
    createMockItem('2026年02月', '2026-02-01', '2026-02-28', {
        includeCommissionRoomPrice: 21430.66,
        orderOtherExpense: 0,
        writeDownIncome: 0,
        businessIncome: 21430.66,
        occ: '31.25%',
        adr: 612.3,
        revPar: 191.34,
        createTime: '2026-03-01T09:46:34+08:00',
        userName: '系统自动',
        inventory: 112,
        openRoomCount: 35,
    }),
    createMockItem('2026年01月', '2026-01-01', '2026-01-31', {
        includeCommissionRoomPrice: 19137.88,
        orderOtherExpense: 0,
        writeDownIncome: 0,
        businessIncome: 19137.88,
        occ: '35.48%',
        adr: 434.95,
        revPar: 154.32,
        createTime: '2026-02-01T09:38:51+08:00',
        userName: '系统自动',
        inventory: 124,
        openRoomCount: 44,
    }),
];
export function createDefaultComprehensiveMonthlyReportQuery(overrides = {}) {
    return {
        campId: overrides.campId || DEFAULT_CAMP_ID,
        startDate: overrides.startDate || DEFAULT_QUERY_RANGE.startDate,
        endDate: overrides.endDate || DEFAULT_QUERY_RANGE.endDate,
        page: overrides.page ?? 1,
        pageSize: overrides.pageSize ?? DEFAULT_PAGE_SIZE,
        provider: overrides.provider,
        mockState: overrides.mockState,
    };
}
export function resolveComprehensiveMonthlyRuntimeConfig(search) {
    const params = new URLSearchParams(search);
    const queryProvider = params.get('provider') || params.get('comprehensiveMonthlyReportProvider');
    const queryMockState = params.get('mockState') || params.get('comprehensiveMonthlyReportMockState');
    return {
        provider: queryProvider === 'api' ? 'api' : readProviderFromStorage(),
        mockState: normalizeMockState(queryMockState) ?? readMockStateFromStorage() ?? 'success',
    };
}
export function readComprehensiveMonthlySelection(search) {
    const params = new URLSearchParams(search);
    const startDate = params.get('startDate')?.trim() || '';
    const endDate = params.get('endDate')?.trim() || '';
    if (!startDate || !endDate)
        return null;
    return { startDate, endDate };
}
export async function loadComprehensiveMonthlyReportList(query, signal) {
    const provider = query.provider ?? readProviderFromStorage();
    if (provider === 'api') {
        return loadFromApi(query, signal);
    }
    return loadFromMock(query, signal);
}
export function findComprehensiveMonthlyReportRow(rows, selection) {
    if (!selection)
        return rows[0] ?? null;
    return rows.find((row) => row.startDate === selection.startDate && row.endDate === selection.endDate) ?? null;
}
export async function runComprehensiveMonthlyReportAction(action, provider, signal) {
    await delay(action === 'refresh' ? 260 : 180, signal);
    const traceId = provider === 'api'
        ? `api-${TASK_ID}-${action}`
        : `mock-${TASK_ID}-${action}-${action === 'refresh' ? '001' : '002'}`;
    return {
        traceId,
        timestamp: new Date().toISOString(),
        message: action === 'refresh' ? '报告已更新' : '打印任务已创建',
    };
}
async function loadFromMock(query, signal) {
    await delay(120, signal);
    const state = query.mockState ?? readMockStateFromStorage() ?? 'success';
    const requestBody = createRequestBody(query);
    if (state === 'error') {
        throw new ComprehensiveMonthlyReportServiceError({
            code: 50301,
            message: '综合月报加载失败，请稍后重试',
            data: null,
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: '2026-05-19T08:35:27+08:00',
        });
    }
    const rows = state === 'empty' ? [] : paginate(mockItems, query.page, query.pageSize);
    return adaptEnvelope({
        code: 0,
        message: 'success',
        data: {
            list: rows,
            pagination: {
                page: query.page,
                pageSize: query.pageSize,
                total: state === 'empty' ? 0 : mockItems.length,
            },
        },
        traceId: `mock-${TASK_ID}-${state === 'empty' ? 'empty' : 'list'}-001`,
        timestamp: '2026-05-19T08:35:27+08:00',
    }, requestBody, 'mock', state);
}
async function loadFromApi(query, signal) {
    const requestBody = createRequestBody(query);
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok || payload?.success === false) {
        throw new Error(payload?.errorMsg || payload?.errorCode || `综合月报接口返回 HTTP ${response.status}`);
    }
    const rawData = payload?.data;
    if (!rawData) {
        throw new Error('综合月报接口响应缺少 data 字段');
    }
    const items = asArray(rawData.list).map(adaptTargetItem);
    return adaptEnvelope({
        code: 0,
        message: 'success',
        data: {
            list: items,
            pagination: {
                page: readNumber(rawData.current ?? rawData.pageNum, query.page),
                pageSize: readNumber(rawData.size, query.pageSize),
                total: readNumber(rawData.total, items.length),
            },
        },
        traceId: `api-${TASK_ID}-list`,
        timestamp: new Date().toISOString(),
    }, requestBody, 'api', items.length === 0 ? 'empty' : 'success');
}
function adaptEnvelope(envelope, requestBody, provider, state) {
    if (envelope.code !== 0 || !envelope.data) {
        throw new ComprehensiveMonthlyReportServiceError(envelope);
    }
    return {
        provider,
        state,
        endpoint: ENDPOINT,
        requestBody,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
        rows: envelope.data.list.map(adaptRow),
        pagination: envelope.data.pagination,
    };
}
function adaptRow(item) {
    const grossRoomFee = item.includeCommissionRoomPrice;
    const otherExpense = item.orderOtherExpense;
    const writeDownIncome = item.writeDownIncome;
    const businessIncome = item.businessIncome;
    const commission = roundAmount(Math.max(grossRoomFee + otherExpense + writeDownIncome - businessIncome, 0));
    const netRoomFee = roundAmount(grossRoomFee - commission);
    const totalIncome = roundAmount(grossRoomFee + otherExpense);
    const occupancy = formatPercent(item.occ);
    return {
        id: `${item.startDate}-${item.endDate}`,
        monthLabel: item.date,
        rangeLabel: `${formatCompactDate(item.startDate)} - ${formatCompactDate(item.endDate)}`,
        revenueText: formatAmount(businessIncome),
        occText: occupancy,
        adrText: formatAmount(item.adr),
        revParText: formatAmount(item.revPar),
        generatedAtText: formatDateTimeWithBreak(item.createTime),
        creatorText: item.userName || '系统自动',
        startDate: formatDate(item.startDate),
        endDate: formatDate(item.endDate),
        summaryPairs: [
            { leftLabel: '房费（含佣）', leftValue: formatAmount(grossRoomFee), rightLabel: '入住率OCC', rightValue: occupancy },
            { leftLabel: '房费（减佣）', leftValue: formatAmount(netRoomFee), rightLabel: 'ADR', rightValue: formatAmount(item.adr) },
            { leftLabel: '佣金', leftValue: formatAmount(commission), rightLabel: '全日房ADR', rightValue: formatAmount(item.adr) },
            { leftLabel: '其他消费', leftValue: formatAmount(otherExpense), rightLabel: '钟点房ADR', rightValue: formatAmount(0) },
            { leftLabel: '订单总收入', leftValue: formatAmount(totalIncome), rightLabel: 'REVPAR', rightValue: formatAmount(item.revPar) },
            { leftLabel: '记一笔收入', leftValue: formatAmount(writeDownIncome), rightLabel: '总开房数', rightValue: String(item.inventory) },
            { leftLabel: '总营收（含佣）', leftValue: formatAmount(roundAmount(businessIncome + commission)), rightLabel: '过夜开房数', rightValue: String(item.openRoomCount) },
            { leftLabel: '总营收（减佣）', leftValue: formatAmount(businessIncome), rightLabel: '钟点房开房数', rightValue: '0' },
        ],
        detailRows: [
            {
                id: `${item.startDate}-summary`,
                cells: [
                    formatAmount(grossRoomFee),
                    formatAmount(netRoomFee),
                    formatAmount(commission),
                    formatAmount(otherExpense),
                    formatAmount(writeDownIncome),
                    formatAmount(roundAmount(totalIncome)),
                    formatAmount(businessIncome),
                    occupancy,
                    formatAmount(item.adr),
                    formatAmount(item.revPar),
                ],
            },
        ],
    };
}
function adaptTargetItem(value) {
    const record = asRecord(value);
    const startDate = readNumber(record.startDate, Date.parse('2026-01-01T00:00:00+08:00'));
    const endDate = readNumber(record.endDate, Date.parse('2026-01-31T00:00:00+08:00'));
    return {
        date: String(record.date ?? formatMonthLabel(startDate)),
        startDate,
        endDate,
        includeCommissionRoomPrice: readNumber(record.includeCommissionRoomPrice, 0),
        orderOtherExpense: readNumber(record.orderOtherExpense, 0),
        writeDownIncome: readNumber(record.writeDownIncome, 0),
        businessIncome: readNumber(record.businessIncome, 0),
        occ: typeof record.occ === 'string' ? record.occ : readNumber(record.occ, 0),
        adr: readNumber(record.adr, 0),
        revPar: readNumber(record.revPar, 0),
        createTime: readNumber(record.createTime, startDate),
        userId: record.userId == null ? null : String(record.userId),
        userName: record.userName == null ? '系统自动' : String(record.userName),
        inventory: readNumber(record.inventory, 0),
        openRoomCount: readNumber(record.openRoomCount, 0),
    };
}
function createRequestBody(query) {
    return {
        campId: query.campId,
        startDate: query.startDate,
        endDate: query.endDate,
        pageNum: query.page,
        pageSize: query.pageSize,
    };
}
function createMockItem(date, startDate, endDate, values) {
    return {
        date,
        startDate: Date.parse(`${startDate}T00:00:00+08:00`),
        endDate: Date.parse(`${endDate}T00:00:00+08:00`),
        includeCommissionRoomPrice: values.includeCommissionRoomPrice,
        orderOtherExpense: values.orderOtherExpense,
        writeDownIncome: values.writeDownIncome,
        businessIncome: values.businessIncome,
        occ: values.occ,
        adr: values.adr,
        revPar: values.revPar,
        createTime: Date.parse(values.createTime),
        userId: null,
        userName: values.userName,
        inventory: values.inventory,
        openRoomCount: values.openRoomCount,
    };
}
function paginate(list, page, pageSize) {
    const start = Math.max(page - 1, 0) * pageSize;
    return list.slice(start, start + pageSize);
}
function readProviderFromStorage() {
    if (typeof window === 'undefined')
        return 'mock';
    const configured = window.localStorage.getItem('pms.comprehensiveMonthlyReportProvider')?.trim() ||
        import.meta.env.VITE_COMPREHENSIVE_MONTHLY_REPORT_PROVIDER;
    return configured === 'api' ? 'api' : 'mock';
}
function readMockStateFromStorage() {
    if (typeof window === 'undefined')
        return null;
    const configured = window.localStorage.getItem('pms.comprehensiveMonthlyReportMockState')?.trim() ||
        import.meta.env.VITE_COMPREHENSIVE_MONTHLY_REPORT_MOCK_STATE;
    return normalizeMockState(configured);
}
function normalizeMockState(value) {
    return value === 'success' || value === 'empty' || value === 'error' ? value : null;
}
function delay(ms, signal) {
    if (signal?.aborted)
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
function formatAmount(value) {
    return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function formatPercent(value) {
    if (typeof value === 'string')
        return value;
    return `${new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`;
}
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function formatCompactDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}
function formatMonthLabel(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月`;
}
function formatDateTimeWithBreak(timestamp) {
    const date = new Date(timestamp);
    return `${formatDate(timestamp)}\n${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
function pad(value) {
    return String(value).padStart(2, '0');
}
export const comprehensiveMonthlyDetailColumns = [
    '房费（含佣）',
    '房费（减佣）',
    '佣金',
    '其他消费',
    '记一笔收入',
    '订单总收入',
    '总营收（减佣）',
    '入住率OCC',
    '平均房价ADR',
    '平均客房收益RevPar',
];
