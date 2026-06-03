const RESPONSE_TIMESTAMP = '2026-05-19T16:40:00+08:00';
const PRIMARY_STORE_ID = '1796067693589061634';
const PRIMARY_STORE_NAME = '天落会宿公寓(前海壹方城宝安中心店)';
const ALL_STORES_ID = 'all-stores';
const LEDGER_ENTRY_PROVIDER_KEY = 'pms.ledgerEntryProvider';
const realBaseUrl = '/api';
const poiEndpoint = '/select/poi/page/get';
const roomCategoriesEndpoint = '/roomCategories/page/get';
const paymentWaysEndpoint = '/paymentWays/get';
const roomsEndpoint = '/rooms/get';
const ledgerDashboardEndpoint = '/orderLedger/dashboard/get';
const ledgerRows = [
    {
        id: 'ledger-20260518-001',
        accountName: '订单房费入账',
        isIncome: 1,
        typeName: '收入',
        amount: 1680,
        paymentWayName: '微信支付',
        roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
        roomName: '顶层套房 01',
        note: '携程订单 M335275070 完成结算',
        operatorName: '系统自动入账',
        channelName: '携程民宿',
        gmtCreate: '2026-05-18 10:20:12',
    },
    {
        id: 'ledger-20260518-002',
        accountName: '保洁服务采购',
        isIncome: 0,
        typeName: '支出',
        amount: 220,
        paymentWayName: '支付宝',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomName: '总裁套间 02',
        note: '周末深度保洁补差',
        operatorName: '店长 刘敏',
        channelName: '线下采购',
        gmtCreate: '2026-05-18 14:08:33',
    },
    {
        id: 'ledger-20260517-003',
        accountName: '加时房费补收',
        isIncome: 1,
        typeName: '收入',
        amount: 368,
        paymentWayName: '美团支付',
        roomCategoryName: '观影大床房',
        roomName: '观影大床房(房间1)',
        note: '凌晨延时退房补收 2 小时',
        operatorName: '前台 小路',
        channelName: '美团民宿',
        gmtCreate: '2026-05-17 23:18:08',
    },
    {
        id: 'ledger-20260517-004',
        accountName: '零食补货',
        isIncome: 0,
        typeName: '支出',
        amount: 96,
        paymentWayName: '现金',
        roomCategoryName: '天落大床电竞套间',
        roomName: '电竞套间 03',
        note: '补充房内饮品与零食',
        operatorName: '采购 阿泽',
        channelName: '门店仓库',
        gmtCreate: '2026-05-17 11:42:51',
    },
    {
        id: 'ledger-20260516-005',
        accountName: '押金转房费',
        isIncome: 1,
        typeName: '收入',
        amount: 520,
        paymentWayName: '银行卡',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomName: '总裁套间 06',
        note: '入住押金结转至房费',
        operatorName: '前台 小苏',
        channelName: '门店直销',
        gmtCreate: '2026-05-16 18:06:17',
    },
    {
        id: 'ledger-20260516-006',
        accountName: '布草清洗费',
        isIncome: 0,
        typeName: '支出',
        amount: 180,
        paymentWayName: '对公转账',
        roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
        roomName: '顶层套房 02',
        note: '周中批量清洗结算',
        operatorName: '运营主管',
        channelName: '洗涤供应商',
        gmtCreate: '2026-05-16 16:24:05',
    },
];
const stores = [
    { id: ALL_STORES_ID, name: '全部门店' },
    { id: PRIMARY_STORE_ID, name: PRIMARY_STORE_NAME },
];
const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'income', label: '收入' },
    { value: 'expense', label: '支出' },
];
const roomCategories = [
    { roomCategoryId: 'all', name: '请选择房型' },
    { roomCategoryId: '1796425099729092609', name: '观影大床房' },
    { roomCategoryId: '1796425099485822977', name: '天落大床电竞套间' },
    { roomCategoryId: '1796425099242553345', name: '总裁套间（桑拿浴缸露台电竞麻将）' },
    { roomCategoryId: '1796425098965729282', name: '顶层套房（浴缸巨幕电竞麻将）' },
];
const paymentWays = [
    { paymentWayId: 'wechat', paymentWayName: '微信支付' },
    { paymentWayId: 'alipay', paymentWayName: '支付宝' },
    { paymentWayId: 'bank-card', paymentWayName: '银行卡' },
    { paymentWayId: 'cash', paymentWayName: '现金' },
    { paymentWayId: 'public-transfer', paymentWayName: '对公转账' },
];
export class LedgerEntryServiceError extends Error {
    response;
    provider;
    state;
    request;
    constructor(message, response, request) {
        super(message);
        this.name = 'LedgerEntryServiceError';
        this.response = response;
        this.provider = resolveLedgerEntryProvider();
        this.state = 'error';
        this.request = request;
    }
}
export function defaultLedgerEntryQuery() {
    return {
        storeId: ALL_STORES_ID,
        storeName: '全部门店',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        type: 'all',
        roomCategoryId: 'all',
        page: 1,
        pageSize: 10,
        state: 'success',
    };
}
export function resolveLedgerEntryProvider(searchParams = readLedgerEntrySearchParams()) {
    const urlValue = searchParams.get('provider')?.trim() || searchParams.get('ledgerEntryProvider')?.trim();
    const localValue = typeof window !== 'undefined' ? window.localStorage.getItem(LEDGER_ENTRY_PROVIDER_KEY)?.trim() : null;
    const envValue = import.meta.env.VITE_LEDGER_ENTRY_PROVIDER?.trim();
    const provider = (urlValue || localValue || envValue || 'api').toLowerCase();
    if (provider === 'mock' || provider === 'api')
        return provider;
    if (provider === 'real')
        return 'api';
    throw new Error(`Unsupported ledger entry provider: ${provider}`);
}
export async function fetchLedgerEntryDashboard(request, signal) {
    const provider = resolveLedgerEntryProvider();
    const normalizedRequest = normalizeQuery(request);
    validateQuery(normalizedRequest);
    if (provider === 'api') {
        return fetchApiLedgerEntryDashboard(normalizedRequest, signal);
    }
    await waitForMockLatency(signal);
    if (normalizedRequest.state === 'error') {
        throw new LedgerEntryServiceError('记一笔明细数据加载失败，请稍后重试', failEnvelope('LEDGER_ENTRY_QUERY_FAILED', '账本明细查询失败', null), normalizedRequest);
    }
    const roomCategoriesEnvelope = makeRoomCategoriesEnvelope();
    const paymentWaysEnvelope = makePaymentWaysEnvelope();
    const roomCategoryRoomsEnvelope = makeRoomsEnvelope();
    const ledgerEnvelope = makeLedgerEnvelope(normalizedRequest);
    return adaptDashboard(provider, normalizedRequest, roomCategoriesEnvelope, paymentWaysEnvelope, roomCategoryRoomsEnvelope, ledgerEnvelope);
}
export async function createLedgerEntryExportTask(request, signal) {
    validateQuery(normalizeQuery(request));
    await waitForMockLatency(signal);
    return okEnvelope({
        taskId: 'ledger-entry-export-20260519-001',
        requestedAt: RESPONSE_TIMESTAMP,
        targetRoute: '/statistics/orderLedger',
    });
}
function normalizeQuery(request) {
    const defaults = defaultLedgerEntryQuery();
    const state = request.state === 'empty' || request.state === 'error' ? request.state : 'success';
    const store = stores.find((item) => item.id === request.storeId);
    return {
        ...defaults,
        ...request,
        storeId: request.storeId || defaults.storeId,
        storeName: store?.name ?? request.storeName ?? defaults.storeName,
        type: request.type === 'income' || request.type === 'expense' ? request.type : 'all',
        roomCategoryId: request.roomCategoryId || defaults.roomCategoryId,
        page: Number.isFinite(request.page) && request.page > 0 ? Math.floor(request.page) : defaults.page,
        pageSize: Number.isFinite(request.pageSize) && request.pageSize > 0 ? Math.floor(request.pageSize) : defaults.pageSize,
        state,
    };
}
function validateQuery(request) {
    if (request.startDate > request.endDate) {
        throw new LedgerEntryServiceError('开始日期不能晚于结束日期', failEnvelope('LEDGER_ENTRY_INVALID_DATE_RANGE', '开始日期不能晚于结束日期', null), request);
    }
}
async function fetchApiLedgerEntryDashboard(request, signal) {
    const campId = resolveCampId();
    const ledgerRequest = {
        campId,
        pageNum: request.page,
        pageSize: request.pageSize,
        beginTime: toDayStart(request.startDate),
        endTime: toDayEnd(request.endDate),
        isIncome: request.type === 'income' ? 1 : request.type === 'expense' ? 0 : null,
        roomCategoryId: request.roomCategoryId === 'all' ? null : request.roomCategoryId,
    };
    const [poiEnvelope, roomCategoriesEnvelope, paymentWaysEnvelope, roomsEnvelope, ledgerEnvelope] = await Promise.all([
        postHudson(poiEndpoint, { campId, pageNum: 1, pageSize: 100 }, signal),
        postHudson(roomCategoriesEndpoint, { campId, pageNum: 1, pageSize: 100 }, signal),
        postHudson(paymentWaysEndpoint, { campId }, signal),
        postHudson(roomsEndpoint, { campId }, signal),
        postHudson(ledgerDashboardEndpoint, ledgerRequest, signal),
    ]);
    return adaptDashboard('api', request, roomCategoriesEnvelope, paymentWaysEnvelope, roomsEnvelope, ledgerEnvelope, poiEnvelope);
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
    if (!response.ok || !payload) {
        throw new Error(`${endpoint} request failed`);
    }
    if ('code' in payload && payload.code !== 0) {
        throw new Error(payload.message || `${endpoint} business error`);
    }
    if ('success' in payload && payload.success === false) {
        throw new Error(payload.errorMsg ?? payload.errorDetail ?? `${endpoint} business error`);
    }
    if (payload.data === undefined || payload.data === null) {
        throw new Error(`${endpoint} response missing data`);
    }
    return okEnvelope(payload.data);
}
function makeRoomCategoriesEnvelope() {
    return okEnvelope({
        total: roomCategories.length - 1,
        size: 999,
        current: 1,
        extraInfo: null,
        pageNum: 1,
        hasNextPage: false,
        pages: 1,
        list: roomCategories.slice(1).map((item) => ({ roomCategoryId: item.roomCategoryId, name: item.name })),
    });
}
function makePaymentWaysEnvelope() {
    return okEnvelope({ paymentWays });
}
function makeRoomsEnvelope() {
    return okEnvelope({
        roomCategoryRooms: roomCategories.slice(1).map((category, index) => ({
            roomCategoryId: category.roomCategoryId,
            roomCategoryName: category.name,
            rooms: [
                { roomId: `${category.roomCategoryId}-0`, roomName: `${category.name} ${index + 1}号` },
                { roomId: `${category.roomCategoryId}-1`, roomName: `${category.name} ${index + 2}号` },
            ],
        })),
    });
}
function makeLedgerEnvelope(request) {
    const filteredList = request.state === 'empty' ? [] : filterLedgerRows(request);
    const startIndex = (request.page - 1) * request.pageSize;
    const pageList = filteredList.slice(startIndex, startIndex + request.pageSize);
    const income = filteredList.filter((item) => item.isIncome === 1).reduce((sum, item) => sum + item.amount, 0);
    const expend = filteredList.filter((item) => item.isIncome === 0).reduce((sum, item) => sum + item.amount, 0);
    return okEnvelope({
        costPricePages: {
            total: filteredList.length,
            size: request.pageSize,
            current: request.page,
            extraInfo: null,
            pageNum: request.page,
            hasNextPage: startIndex + request.pageSize < filteredList.length,
            pages: Math.max(1, Math.ceil(filteredList.length / request.pageSize)),
            list: pageList,
        },
        income,
        expend,
        netIncome: income - expend,
    });
}
function filterLedgerRows(request) {
    return ledgerRows.filter((row) => {
        const typeMatches = request.type === 'all' ||
            (request.type === 'income' && row.isIncome === 1) ||
            (request.type === 'expense' && row.isIncome === 0);
        const roomCategoryMatches = request.roomCategoryId === 'all' ||
            roomCategories.find((category) => category.roomCategoryId === request.roomCategoryId)?.name === row.roomCategoryName;
        const dateMatches = row.gmtCreate.slice(0, 10) >= request.startDate && row.gmtCreate.slice(0, 10) <= request.endDate;
        return typeMatches && roomCategoryMatches && dateMatches;
    });
}
function adaptDashboard(provider, request, roomCategoriesEnvelope, paymentWaysEnvelope, roomsEnvelope, ledgerEnvelope, poiEnvelope) {
    assertSuccess(roomCategoriesEnvelope);
    assertSuccess(paymentWaysEnvelope);
    assertSuccess(roomsEnvelope);
    assertSuccess(ledgerEnvelope);
    if (poiEnvelope)
        assertSuccess(poiEnvelope);
    const paymentWayNames = paymentWaysEnvelope.data.paymentWays.map((item) => item.paymentWayName);
    const storeList = poiEnvelope
        ? [
            { id: ALL_STORES_ID, name: '全部门店' },
            ...poiEnvelope.data.list.map((item) => ({ id: item.poiId, name: item.poiName })),
        ]
        : stores;
    const rows = ledgerEnvelope.data.costPricePages.list.map((row) => ({
        id: row.id,
        type: (row.isIncome === 1 ? 'income' : 'expense'),
        typeLabel: row.typeName,
        project: row.accountName,
        amount: row.amount,
        paymentWay: row.paymentWayName,
        occurredAt: row.gmtCreate,
        roomCategoryName: row.roomCategoryName,
        roomName: row.roomName,
        remark: row.note,
        operatorName: row.operatorName,
        channelName: row.channelName,
    }));
    const summaryCards = [
        {
            key: 'income',
            title: '收入(元)',
            amount: ledgerEnvelope.data.income,
            trend: rows.length ? `共 ${rows.filter((row) => row.type === 'income').length} 笔收入流水` : '当前周期暂无收入流水',
            detail: '收入明细来自账本分页接口，覆盖订单房费、押金转房费和加时补收等场景。',
        },
        {
            key: 'expense',
            title: '支出 (元)',
            amount: ledgerEnvelope.data.expend,
            trend: rows.length ? `共 ${rows.filter((row) => row.type === 'expense').length} 笔支出流水` : '当前周期暂无支出流水',
            detail: '支出明细来自账本分页接口，覆盖保洁、布草和门店补货等成本项目。',
        },
    ];
    const roomCategoryOptions = [
        { id: roomCategories[0].roomCategoryId, name: roomCategories[0].name },
        ...roomCategoriesEnvelope.data.list.map((item) => ({ id: item.roomCategoryId, name: item.name })),
    ];
    return {
        provider,
        state: request.state ?? 'success',
        request,
        stores: storeList,
        typeOptions,
        roomCategories: roomCategoryOptions,
        paymentWays: paymentWayNames,
        summaryCards,
        netIncome: ledgerEnvelope.data.netIncome,
        currency: 'CNY',
        rows,
        pagination: {
            page: ledgerEnvelope.data.costPricePages.current,
            pageSize: ledgerEnvelope.data.costPricePages.size,
            total: ledgerEnvelope.data.costPricePages.total,
        },
        updatedAt: RESPONSE_TIMESTAMP,
        traceIds: [
            'mock-ledger-room-categories-001',
            'mock-ledger-payment-ways-001',
            'mock-ledger-rooms-001',
            'mock-ledger-account-book-001',
        ],
    };
}
function assertSuccess(response) {
    if (!response.success) {
        throw new Error(response.errorMsg ?? '服务请求失败');
    }
}
function okEnvelope(data) {
    return {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data,
    };
}
function failEnvelope(errorCode, errorMsg, data) {
    return {
        success: false,
        errorCode,
        errorMsg,
        errorDetail: errorMsg,
        data,
    };
}
function waitForMockLatency(signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Request aborted', 'AbortError'));
            return;
        }
        const timer = window.setTimeout(resolve, 180);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Request aborted', 'AbortError'));
        }, { once: true });
    });
}
function readLedgerEntrySearchParams(baseParams = new URLSearchParams()) {
    const params = new URLSearchParams(baseParams);
    if (typeof window === 'undefined')
        return params;
    new URLSearchParams(window.location.search).forEach((value, key) => {
        if (!params.has(key))
            params.set(key, value);
    });
    const hashQuery = window.location.hash.split('?')[1];
    if (hashQuery) {
        new URLSearchParams(hashQuery).forEach((value, key) => {
            if (!params.has(key))
                params.set(key, value);
        });
    }
    return params;
}
function resolveCampId() {
    const params = readLedgerEntrySearchParams();
    const urlCampId = params.get('campId')?.trim();
    const storageCampId = typeof window !== 'undefined'
        ? window.localStorage.getItem('pmsCampId')?.trim() ||
            window.localStorage.getItem('pms.currentCampId')?.trim() ||
            ''
        : '';
    const envCampId = import.meta.env.VITE_PMS_CAMP_ID?.trim();
    return urlCampId || storageCampId || envCampId || PRIMARY_STORE_ID;
}
function toDayStart(value) {
    return value.length === 10 ? `${value} 00:00:00` : value;
}
function toDayEnd(value) {
    return value.length === 10 ? `${value} 23:59:59` : value;
}
