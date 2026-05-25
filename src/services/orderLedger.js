const RESPONSE_TIMESTAMP = '2026-05-19T08:38:18+08:00';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_STORE_ID = '1796425098638573570';
const ORDER_LEDGER_PROVIDER_KEY = 'pms.orderLedgerProvider';
const ORDER_LEDGER_STATE_KEY = 'pms.orderLedgerMockState';
const storeOptions = [
    {
        poiId: DEFAULT_STORE_ID,
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
    },
];
const paymentTypes = [
    { paymentTypeId: '1', paymentTypeName: '房费', isIncome: 1, isEnable: 1, bizType: 3, groupType: 1 },
    { paymentTypeId: '2', paymentTypeName: '保洁费', isIncome: 1, isEnable: 1, bizType: 1, groupType: 1 },
    { paymentTypeId: '4', paymentTypeName: '押金', isIncome: 1, isEnable: 1, bizType: 3, groupType: 1 },
    { paymentTypeId: '10', paymentTypeName: '其他收入', isIncome: 1, isEnable: 1, bizType: 1, groupType: 1 },
    { paymentTypeId: '11', paymentTypeName: '保洁费', isIncome: 0, isEnable: 1, bizType: 3, groupType: 1 },
    { paymentTypeId: '12', paymentTypeName: '佣金支出', isIncome: 0, isEnable: 1, bizType: 3, groupType: 1 },
    { paymentTypeId: '20', paymentTypeName: '其他支出', isIncome: 0, isEnable: 1, bizType: 1, groupType: 1 },
];
const paymentWays = [
    { paymentWayId: '1', paymentWayName: '平台代收', isEnable: 1 },
    { paymentWayId: '2', paymentWayName: '微信', isEnable: 1 },
    { paymentWayId: '3', paymentWayName: '支付宝', isEnable: 1 },
    { paymentWayId: '4', paymentWayName: '其他', isEnable: 1 },
    { paymentWayId: '5', paymentWayName: '现金', isEnable: 1 },
    { paymentWayId: '6', paymentWayName: '银行卡转账', isEnable: 1 },
    { paymentWayId: '13', paymentWayName: '暂未收款', isEnable: 1 },
];
const roomGroups = [
    {
        roomCategoryId: '1796425099729092609',
        roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
        rooms: [{ roomId: '1796425099804581889', roomName: '房间1' }],
    },
    {
        roomCategoryId: '1796425099485822977',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        rooms: [{ roomId: '1796425099544543234', roomName: '房间1' }],
    },
    {
        roomCategoryId: '1796425099242553345',
        roomCategoryName: '天落大床电竞套间',
        rooms: [{ roomId: '1796425099301273602', roomName: '房间1' }],
    },
    {
        roomCategoryId: '1796425098965729282',
        roomCategoryName: '观影大床房',
        rooms: [{ roomId: '1796425099024449538', roomName: '房间1' }],
    },
];
const baseRecords = [
    {
        costPriceId: '2056357485361668098',
        poiId: DEFAULT_STORE_ID,
        tradeDate: '2026-05-18',
        tradeTime: '2026-05-18 20:53:23',
        paymentTime: null,
        paymentTypeId: '1',
        paymentTypeName: '房费',
        paymentWayId: '13',
        paymentWayName: '暂未收款',
        isIncome: 1,
        isInComeName: '收入',
        price: 335.88,
        paymentOutId: '-',
        orderId: '2056357481704235009',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomId: '1796425099544543234',
        roomName: '房间1',
        remark: '-',
        operationUserName: '-',
        debtPrice: 0,
        type: 1,
        typeName: '住宿订单',
        detail: {
            channelName: '路客云聚合',
            channelOrderNo: '10085200031107',
            roomLabel: '总裁套间（桑拿浴缸露台电竞麻将）(房间1)',
            statusLabel: '待入住',
            totalAmount: 365,
            stayRange: '2026.05.24-2026.05.25 1晚',
            guestSummary: '入住人（0/2）',
            productName: '总裁套间（独享浴缸桑拿房露台台球麻将）<无早>',
            breakdownTitle: '房费(减佣)',
            breakdownAmount: 285.44,
            totalIncome: 365,
            roomBreakdown: [
                {
                    date: '2026-05-24',
                    roomLabel: '总裁套间（桑拿浴缸露台电竞麻将）(房间1)',
                    amount: 285.44,
                },
            ],
            extraLines: [
                { title: '房费收款', primary: '收款金额：￥335.88', secondary: '房费欠款：￥0' },
                { title: '其他收入/支出', primary: '0项 / ￥0.00' },
                { title: '押金信息', primary: '押金金额：￥0' },
                { title: '订单欠款', primary: '￥0' },
            ],
            paymentRecords: [],
        },
    },
    {
        costPriceId: '2056348435290955777',
        poiId: DEFAULT_STORE_ID,
        tradeDate: '2026-05-18',
        tradeTime: '2026-05-18 20:17:14',
        paymentTime: null,
        paymentTypeId: '1',
        paymentTypeName: '房费',
        paymentWayId: '13',
        paymentWayName: '暂未收款',
        isIncome: 1,
        isInComeName: '收入',
        price: 666.66,
        paymentOutId: '-',
        orderId: '2056348430102917121',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomId: '1796425099544543234',
        roomName: '房间1',
        remark: '-',
        operationUserName: '-',
        debtPrice: 0,
        type: 1,
        typeName: '住宿订单',
        detail: {
            channelName: '路客云聚合',
            channelOrderNo: '10085200031108',
            roomLabel: '总裁套间（桑拿浴缸露台电竞麻将）(房间1)',
            statusLabel: '已确认',
            totalAmount: 666.66,
            stayRange: '2026.05.23-2026.05.24 1晚',
            guestSummary: '入住人（2/2）',
            productName: '总裁套间（桑拿浴缸露台电竞麻将）<含双早>',
            breakdownTitle: '房费(减佣)',
            breakdownAmount: 566.66,
            totalIncome: 666.66,
            roomBreakdown: [
                {
                    date: '2026-05-23',
                    roomLabel: '总裁套间（桑拿浴缸露台电竞麻将）(房间1)',
                    amount: 566.66,
                },
            ],
            extraLines: [
                { title: '房费收款', primary: '收款金额：￥666.66', secondary: '房费欠款：￥0' },
                { title: '其他收入/支出', primary: '0项 / ￥0.00' },
                { title: '押金信息', primary: '押金金额：￥0' },
                { title: '订单欠款', primary: '￥0' },
            ],
            paymentRecords: [],
        },
    },
    {
        costPriceId: '2056420000000000001',
        poiId: DEFAULT_STORE_ID,
        tradeDate: '2026-05-20',
        tradeTime: '2026-05-20 10:08:21',
        paymentTime: '2026-05-20 10:08:21',
        paymentTypeId: '11',
        paymentTypeName: '保洁费',
        paymentWayId: '2',
        paymentWayName: '微信',
        isIncome: 0,
        isInComeName: '支出',
        price: 128.5,
        paymentOutId: 'WX202605200001',
        orderId: '-',
        roomCategoryName: '观影大床房',
        roomId: '1796425099024449538',
        roomName: '房间1',
        remark: '保洁师傅结算',
        operationUserName: '前台小路',
        debtPrice: 0,
        type: 2,
        typeName: '记一笔',
        detail: {
            channelName: '记一笔',
            channelOrderNo: 'MANUAL-202605200001',
            roomLabel: '观影大床房(房间1)',
            statusLabel: '已完成',
            totalAmount: 128.5,
            stayRange: '2026.05.20',
            guestSummary: '手工流水',
            productName: '保洁费结算',
            breakdownTitle: '支出项目',
            breakdownAmount: 128.5,
            totalIncome: 0,
            roomBreakdown: [
                {
                    date: '2026-05-20',
                    roomLabel: '观影大床房(房间1)',
                    amount: 128.5,
                },
            ],
            extraLines: [
                { title: '支出说明', primary: '微信支付保洁费 ￥128.50' },
                { title: '备注', primary: '保洁师傅结算' },
            ],
            paymentRecords: [
                {
                    id: 'manual-payment-1',
                    typeLabel: '付款',
                    roomLabel: '观影大床房(房间1)',
                    projectLabel: '保洁费',
                    paymentWayLabel: '微信',
                    amount: 128.5,
                    paymentNo: 'WX202605200001',
                    paidAt: '2026.05.20 10:08',
                    remark: '保洁师傅结算',
                    actionLabel: '查看凭证',
                },
            ],
        },
    },
];
export class OrderLedgerServiceError extends Error {
    response;
    provider;
    state;
    request;
    constructor(message, response, request) {
        super(message);
        this.name = 'OrderLedgerServiceError';
        this.response = response;
        this.provider = resolveOrderLedgerProvider();
        this.state = request.state ?? 'success';
        this.request = request;
    }
}
export function defaultOrderLedgerRequest(state = 'success') {
    return {
        campId: DEFAULT_CAMP_ID,
        pageNum: 1,
        pageSize: 10,
        beginTime: '2026-05-18',
        endTime: '2026-05-19',
        paymentTypeIds: [],
        paymentWayIds: [],
        roomIds: [],
        poiIds: [],
        keyword: '',
        isIncome: null,
        type: null,
        state,
    };
}
export function resolveOrderLedgerProvider(search = currentSearch()) {
    const params = new URLSearchParams(search);
    const urlValue = params.get('orderLedgerProvider')?.trim();
    const storageValue = typeof window !== 'undefined' ? window.localStorage.getItem(ORDER_LEDGER_PROVIDER_KEY)?.trim() : null;
    const envValue = typeof import.meta !== 'undefined' && 'env' in import.meta
        ? (import.meta.env?.VITE_ORDER_LEDGER_PROVIDER ?? '').trim()
        : '';
    const provider = urlValue || storageValue || envValue || 'mock';
    if (provider === 'mock' || provider === 'api')
        return provider;
    throw new Error(`Unsupported order ledger provider: ${provider}`);
}
export function resolveOrderLedgerMockState(search = currentSearch()) {
    const params = new URLSearchParams(search);
    const urlValue = params.get('mockState')?.trim();
    const storageValue = typeof window !== 'undefined' ? window.localStorage.getItem(ORDER_LEDGER_STATE_KEY)?.trim() : null;
    const rawValue = urlValue || storageValue;
    if (rawValue === 'empty' || rawValue === 'error')
        return rawValue;
    return 'success';
}
export async function fetchOrderLedgerDashboard(request, signal) {
    const provider = resolveOrderLedgerProvider();
    const normalizedRequest = normalizeRequest(request);
    if (provider === 'api') {
        throw new OrderLedgerServiceError('收支明细数据加载失败，请稍后重试', envelope(503, 'service unavailable', null, 'api-order-ledger-unavailable'), normalizedRequest);
    }
    await waitForMockLatency(signal);
    if (normalizedRequest.state === 'error') {
        throw new OrderLedgerServiceError('收支明细数据加载失败，请稍后重试', envelope(503, 'order ledger query failed', null, 'mock-order-ledger-error-001'), normalizedRequest);
    }
    const responses = {
        poiResponse: hudsonEnvelope(makePoiPage()),
        paymentTypeResponse: hudsonEnvelope({ paymentTypes }),
        paymentWayResponse: hudsonEnvelope({ paymentWays }),
        roomResponse: hudsonEnvelope({ roomCategoryRooms: roomGroups }),
        bookResponse: hudsonEnvelope(makeBookPage(normalizedRequest)),
    };
    return adaptDashboard(provider, normalizedRequest, responses);
}
export async function createOrderLedgerExportTask(request, signal) {
    await waitForMockLatency(signal);
    return envelope(0, 'success', {
        taskId: 'order-ledger-export-20260519-001',
        requestedAt: RESPONSE_TIMESTAMP,
        request: normalizeRequest(request),
    }, 'mock-order-ledger-export-001');
}
function normalizeRequest(request) {
    const defaults = defaultOrderLedgerRequest(resolveOrderLedgerMockState());
    return {
        ...defaults,
        ...request,
        pageNum: Number.isFinite(request.pageNum) && request.pageNum > 0 ? Math.floor(request.pageNum) : defaults.pageNum,
        pageSize: Number.isFinite(request.pageSize) && request.pageSize > 0 ? Math.floor(request.pageSize) : defaults.pageSize,
        paymentTypeIds: [...(request.paymentTypeIds ?? [])],
        paymentWayIds: [...(request.paymentWayIds ?? [])],
        roomIds: [...(request.roomIds ?? [])],
        poiIds: [...(request.poiIds ?? [])],
        keyword: request.keyword?.trim() ?? '',
        isIncome: request.isIncome === 0 || request.isIncome === 1 ? request.isIncome : null,
        type: request.type === 1 || request.type === 2 ? request.type : null,
        state: request.state === 'empty' || request.state === 'error' ? request.state : defaults.state,
    };
}
function makePoiPage() {
    return {
        total: storeOptions.length,
        size: 999,
        current: 1,
        extraInfo: {},
        pageNum: 1,
        hasNextPage: false,
        pages: 1,
        list: storeOptions,
    };
}
function makeBookPage(request) {
    const filtered = request.state === 'empty' ? [] : filterRecords(request);
    const start = (request.pageNum - 1) * request.pageSize;
    const list = filtered.slice(start, start + request.pageSize);
    const totalIncome = filtered.filter((item) => item.isIncome === 1).reduce((sum, item) => sum + item.price, 0);
    const totalExpense = filtered.filter((item) => item.isIncome === 0).reduce((sum, item) => sum + item.price, 0);
    return {
        total: filtered.length,
        size: request.pageSize,
        current: request.pageNum,
        extraInfo: {
            totalInfo: {
                totalIncomePrice: filtered.length === 0 ? null : totalIncome,
                totalExpendPrice: filtered.length === 0 ? null : totalExpense,
                netIncome: filtered.length === 0 ? null : totalIncome - totalExpense,
            },
        },
        pageNum: request.pageNum,
        hasNextPage: start + request.pageSize < filtered.length,
        pages: Math.max(1, Math.ceil(Math.max(filtered.length, 1) / request.pageSize)),
        list,
    };
}
function filterRecords(request) {
    const keyword = request.keyword.trim().toLowerCase();
    return baseRecords.filter((record) => {
        const dateMatches = record.tradeDate >= request.beginTime && record.tradeDate <= request.endTime;
        const storeMatches = request.poiIds.length === 0 || request.poiIds.includes(record.poiId);
        const incomeMatches = request.isIncome === null || record.isIncome === request.isIncome;
        const sourceMatches = request.type === null || record.type === request.type;
        const projectMatches = request.paymentTypeIds.length === 0 || request.paymentTypeIds.includes(record.paymentTypeId);
        const paymentMatches = request.paymentWayIds.length === 0 || request.paymentWayIds.includes(record.paymentWayId);
        const roomMatches = request.roomIds.length === 0 || request.roomIds.includes(record.roomId);
        const keywordMatches = keyword.length === 0 ||
            [record.orderId, record.paymentOutId, record.roomCategoryName, record.roomName].join(' ').toLowerCase().includes(keyword);
        return (dateMatches &&
            storeMatches &&
            incomeMatches &&
            sourceMatches &&
            projectMatches &&
            paymentMatches &&
            roomMatches &&
            keywordMatches);
    });
}
function adaptDashboard(provider, request, responses) {
    assertHudsonOk(responses.poiResponse);
    assertHudsonOk(responses.paymentTypeResponse);
    assertHudsonOk(responses.paymentWayResponse);
    assertHudsonOk(responses.roomResponse);
    assertHudsonOk(responses.bookResponse);
    const projectOptions = responses.paymentTypeResponse.data.paymentTypes
        .filter((item) => item.isEnable === 1)
        .filter((item) => request.isIncome === null || item.isIncome === request.isIncome)
        .map((item) => ({ value: item.paymentTypeId, label: item.paymentTypeName }));
    const summary = responses.bookResponse.data.extraInfo.totalInfo;
    return {
        provider,
        state: request.state ?? 'success',
        request,
        stores: responses.poiResponse.data.list.map((item) => ({ id: item.poiId, name: item.poiName })),
        typeOptions: [
            { value: 'all', label: '全部类型' },
            { value: 'income', label: '收入' },
            { value: 'expense', label: '支出' },
        ],
        sourceOptions: [
            { value: 'all', label: '全部来源' },
            { value: 'stayOrder', label: '住宿订单' },
            { value: 'manualEntry', label: '记一笔' },
        ],
        projectOptions,
        paymentWayOptions: responses.paymentWayResponse.data.paymentWays
            .filter((item) => item.isEnable === 1)
            .map((item) => ({ value: item.paymentWayId, label: item.paymentWayName })),
        roomOptions: responses.roomResponse.data.roomCategoryRooms,
        summary: {
            netIncome: summary.netIncome ?? 0,
            totalIncome: summary.totalIncomePrice ?? 0,
            totalExpense: summary.totalExpendPrice ?? 0,
        },
        records: responses.bookResponse.data.list.map((record) => ({
            id: record.costPriceId,
            poiId: record.poiId,
            typeLabel: record.isInComeName,
            sourceLabel: record.typeName,
            orderId: record.orderId,
            projectLabel: record.paymentTypeName,
            amount: record.price,
            debtAmount: record.debtPrice,
            paymentWayLabel: record.paymentWayName,
            paymentNo: record.paymentOutId,
            paymentTime: record.paymentTime ?? '-',
            createdAt: record.tradeTime,
            roomLabel: `${record.roomCategoryName}-${record.roomName}`,
            remark: record.remark,
            operatorName: record.operationUserName,
            detail: record.detail,
        })),
        pagination: {
            page: responses.bookResponse.data.pageNum,
            pageSize: responses.bookResponse.data.size,
            total: responses.bookResponse.data.total,
        },
        updatedAt: RESPONSE_TIMESTAMP,
        traceIds: [
            'target-select-poi-page-get',
            'target-payment-types-get',
            'target-payment-ways-get',
            'target-rooms-get',
            'target-account-book-cost-price-pages-v2',
        ],
    };
}
function assertHudsonOk(response) {
    if (!response.success) {
        throw new Error(response.errorMsg || 'Unknown hudson error');
    }
}
function hudsonEnvelope(data) {
    return {
        success: true,
        errorCode: null,
        errorMsg: null,
        errorDetail: null,
        data,
    };
}
function envelope(code, message, data, traceId) {
    return {
        code,
        message,
        data,
        traceId,
        timestamp: RESPONSE_TIMESTAMP,
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
function currentSearch() {
    return typeof window === 'undefined' ? '' : window.location.search;
}
