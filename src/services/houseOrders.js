const HUDSON_API_BASE = 'https://hudson-prod.localhome.cn';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
const DEFAULT_MOCK_CAMP_ID = 'mock-camp-qianhai-001';
const REQUEST_PATHS = ['/order/report/get', '/orders/page/get'];
export class HouseOrderRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'HouseOrderRequestError';
    }
}
export function resolveHouseOrderCampId() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('campId') ||
        window.localStorage.getItem('pmsCampId') ||
        window.localStorage.getItem('pms.currentCampId') ||
        import.meta.env.VITE_PMS_CAMP_ID ||
        '');
}
export function resolveHouseOrderProviderMode() {
    const params = new URLSearchParams(window.location.search);
    const configured = params.get('houseOrderProvider') ||
        window.localStorage.getItem('pms.houseOrderProvider') ||
        import.meta.env.VITE_HOUSE_ORDER_PROVIDER ||
        'mock';
    if (configured === 'mock' || configured === 'api')
        return configured;
    throw new HouseOrderRequestError(`住宿订单数据源配置无效：${configured}`);
}
export async function fetchHouseOrders(filters, signal) {
    const providerMode = resolveHouseOrderProviderMode();
    if (providerMode === 'mock') {
        return fetchMockHouseOrders(filters, resolveHouseOrderMockState(), signal);
    }
    if (!filters.campId) {
        throw new HouseOrderRequestError('缺少 campId：api 数据源需要明确的门店上下文');
    }
    return fetchApiHouseOrders(filters, signal);
}
function resolveHouseOrderMockState() {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('houseOrderMockState') || window.localStorage.getItem('pms.houseOrderMockState') || 'success';
    if (state === 'success' || state === 'empty' || state === 'error')
        return state;
    throw new HouseOrderRequestError(`住宿订单数据状态配置无效：${state}`);
}
async function fetchMockHouseOrders(filters, state, signal) {
    await waitForMockLatency(signal);
    const reportEnvelope = buildSuccessEnvelope('mock-dingdan--zhusu-dingdan--zhusu-dingdan-report-001', state === 'empty' ? emptyReport() : MOCK_REPORT);
    if (state === 'error') {
        const failedEnvelope = buildEnvelope(503, '住宿订单数据服务暂时不可用', { list: [], total: 0, pageNum: filters.pageNum, pageSize: filters.pageSize, pages: 0 }, 'mock-dingdan--zhusu-dingdan--zhusu-dingdan-list-error-001');
        return adaptHouseOrderEnvelopes(reportEnvelope, failedEnvelope, 'mock');
    }
    const rows = state === 'empty' ? [] : filterMockRows(filters);
    const listEnvelope = buildSuccessEnvelope('mock-dingdan--zhusu-dingdan--zhusu-dingdan-list-001', {
        list: rows,
        total: rows.length,
        pageNum: filters.pageNum,
        pageSize: filters.pageSize,
        pages: rows.length ? 1 : 0,
    });
    return adaptHouseOrderEnvelopes(reportEnvelope, listEnvelope, 'mock');
}
async function fetchApiHouseOrders(filters, signal) {
    const orderBody = {
        campId: filters.campId,
        pageNum: filters.pageNum,
        pageSize: filters.pageSize,
        orderType: filters.orderType,
        isLt: 0,
        searchContent: filters.keyword || undefined,
    };
    const [reportPayload, orderPayload] = await Promise.all([
        postHudson('/order/report/get', { campId: filters.campId }, signal),
        postHudson('/orders/page/get', orderBody, signal),
    ]);
    const reportEnvelope = buildSuccessEnvelope('api-dingdan--zhusu-dingdan--zhusu-dingdan-report-001', adaptHouseOrderReport(reportPayload));
    const listEnvelope = buildSuccessEnvelope('api-dingdan--zhusu-dingdan--zhusu-dingdan-list-001', {
        list: readArray(readPath(orderPayload, ['list'])),
        total: readNumber(readPath(orderPayload, ['total']), 0),
        pageNum: readNumber(readPath(orderPayload, ['pageNum']), filters.pageNum),
        pageSize: readNumber(readPath(orderPayload, ['pageSize']), filters.pageSize),
        pages: readNumber(readPath(orderPayload, ['pages']), 0),
    });
    return adaptHouseOrderEnvelopes(reportEnvelope, listEnvelope, 'api');
}
function adaptHouseOrderEnvelopes(reportEnvelope, listEnvelope, providerMode) {
    assertEnvelopeOk(reportEnvelope, '住宿订单统计');
    assertEnvelopeOk(listEnvelope, '住宿订单列表');
    return {
        rows: adaptHouseOrderRows(readArray(listEnvelope.data.list)),
        total: readNumber(listEnvelope.data.total, 0),
        pageNum: readNumber(listEnvelope.data.pageNum, 1),
        pageSize: readNumber(listEnvelope.data.pageSize, 20),
        pages: readNumber(listEnvelope.data.pages, 0),
        report: reportEnvelope.data,
        requestPaths: REQUEST_PATHS,
        providerMode,
        traceIds: [reportEnvelope.traceId, listEnvelope.traceId],
    };
}
function assertEnvelopeOk(envelope, label) {
    if (envelope.code !== 0) {
        throw new HouseOrderRequestError(`${label}返回失败：${envelope.message}（traceId=${envelope.traceId}）`);
    }
}
function buildSuccessEnvelope(traceId, data) {
    return buildEnvelope(0, 'success', data, traceId);
}
function buildEnvelope(code, message, data, traceId) {
    return {
        code,
        message,
        data,
        traceId,
        timestamp: MOCK_TIMESTAMP,
    };
}
async function postHudson(endpoint, body, signal) {
    let response;
    try {
        response = await fetch(`${HUDSON_API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
            signal,
        });
    }
    catch (error) {
        throw new HouseOrderRequestError(`api 数据源请求失败：${endpoint}，${error instanceof Error ? error.message : String(error)}`);
    }
    let payload;
    try {
        payload = (await response.json());
    }
    catch {
        payload = null;
    }
    if (!response.ok) {
        throw new HouseOrderRequestError(`api 数据源请求失败：${endpoint}，HTTP ${response.status}`);
    }
    if (!payload || typeof payload !== 'object') {
        throw new HouseOrderRequestError(`api 数据源响应不可解析：${endpoint}`);
    }
    if (payload.success === false) {
        throw new HouseOrderRequestError(String(payload.errorMsg || payload.errorDetail || `api 数据源业务失败：${endpoint}`));
    }
    if (payload.data === undefined || payload.data === null) {
        throw new HouseOrderRequestError(`api 数据源响应缺少 data 字段：${endpoint}`);
    }
    return payload.data;
}
function filterMockRows(filters) {
    const keyword = filters.keyword.trim().toLowerCase();
    return MOCK_ORDER_ROWS.filter((item) => {
        const detail = readArray(readPath(item, ['orderDetailViews']))[0];
        const orderType = String(readPath(item, ['mockOrderType']) ?? '');
        if (filters.orderType && orderType !== filters.orderType)
            return false;
        if (!keyword)
            return true;
        return [
            readPath(item, ['orderId']),
            readPath(item, ['outOrderId']),
            readPath(item, ['channelName']),
            readPath(item, ['guestName']),
            readPath(item, ['guestMobile']),
            readPath(detail, ['roomName']),
            readPath(detail, ['roomCategoryName']),
            readPath(detail, ['poiName']),
        ]
            .join(' ')
            .toLowerCase()
            .includes(keyword);
    });
}
function waitForMockLatency(signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }
        const timer = window.setTimeout(resolve, 80);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
function adaptHouseOrderRows(items) {
    return items.map((item) => {
        const detail = readArray(readPath(item, ['orderDetailViews']))[0];
        const checkInAt = formatDateTime(readPath(detail, ['checkInDate']));
        const leaveAt = formatDateTime(readPath(detail, ['checkOutDate']));
        const room = readString(readPath(detail, ['roomName'])) || '-';
        const needsRoomAssignment = readNumber(readPath(detail, ['isArrangeRoom']), 1) === 0;
        const status = orderStatus(readPath(item, ['orderState']));
        const liveStatus = liveStatusFor(readPath(detail, ['orderDetailDisplayState']), status);
        return {
            orderNo: readString(readPath(item, ['orderId'])) || '-',
            channel: readString(readPath(item, ['channelName'])) || readString(readPath(item, ['orderChannelName'])) || channelName(readPath(item, ['channelId'])),
            status,
            contact: readString(readPath(item, ['guestName'])) || '-',
            phone: readString(readPath(item, ['guestMobile'])) || '-',
            stayType: readString(readPath(detail, ['roomCategoryProductName'])) || '全日房',
            roomType: readString(readPath(detail, ['roomCategoryName'])) || '-',
            room,
            store: readString(readPath(detail, ['poiName'])) || '-',
            checkInAt,
            leaveAt,
            liveStatus,
            afterSaleStatus: afterSaleStatus(readPath(item, ['refundDisplayState'])),
            roomRevenueNet: formatMoney(readPath(item, ['totalRoomPrice']) ?? readPath(detail, ['roomPrice'])),
            otherExpense: formatMoney(readPath(item, ['otherPrice']) ?? readPath(detail, ['otherPrice'])),
            roomRevenueGross: formatMoney(readPath(item, ['includeCommissionRoomPrice']) ?? readPath(detail, ['includeCommissionRoomPrice'])),
            totalRevenue: formatMoney(readPath(item, ['orderTotalIncomePrice']) ?? readPath(item, ['orderTotalPrice'])),
            debt: formatMoney(readPath(item, ['debtPrice'])),
            bookedAt: formatDateTime(readPath(item, ['bookedTime']) ?? readPath(item, ['createTime'])),
            channelOrderNo: readString(readPath(item, ['outOrderId'])) || '-',
            stockFlag: readNumber(readPath(detail, ['isOccupation']), 1) ? '1' : '',
            roomFlag: needsRoomAssignment ? '未排房' : '',
            planFlag: readNumber(readPath(detail, ['isStatistics']), 1) ? '1' : '',
            needsRoomAssignment,
            collected: formatMoney(readPath(item, ['totalPayPrice'])),
            commission: formatMoney(readPath(item, ['commissionPrice'])),
            confirmNo: readString(readPath(item, ['confirmNo'])),
        };
    });
}
function adaptHouseOrderReport(data) {
    return {
        todayNewOrder: readNumber(readPath(data, ['todayNewOrder']), 0),
        todayPredictCheckIn: readNumber(readPath(data, ['todayPredictCheckIn']), 0),
        staying: readNumber(readPath(data, ['staying']), 0),
        todayPredictCheckOut: readNumber(readPath(data, ['todayPredictCheckOut']), 0),
        tomorrowCheckIn: readNumber(readPath(data, ['tomorrowCheckIn']), 0),
        tomorrowCheckOut: readNumber(readPath(data, ['tomorrowCheckOut']), 0),
        pending: readNumber(readPath(data, ['pending']), 0),
        refunding: readNumber(readPath(data, ['refunding']), 0),
        exception: readNumber(readPath(data, ['exception']), 0),
    };
}
function emptyReport() {
    return {
        todayNewOrder: 0,
        todayPredictCheckIn: 0,
        staying: 0,
        todayPredictCheckOut: 0,
        tomorrowCheckIn: 0,
        tomorrowCheckOut: 0,
        pending: 0,
        refunding: 0,
        exception: 0,
    };
}
function orderStatus(value) {
    const numeric = Number(value);
    if (numeric === 2 || numeric === 5)
        return '已完成';
    if (numeric === 3 || numeric === 9)
        return '已取消';
    if (numeric === 4)
        return '进行中';
    return '已预订';
}
function liveStatusFor(value, fallback) {
    const numeric = Number(value);
    if (numeric === 2 || fallback === '已完成')
        return '已退房';
    if (numeric === 3 || fallback === '已取消')
        return '已取消';
    if (numeric === 4 || fallback === '进行中')
        return '入住中';
    return '待入住';
}
function afterSaleStatus(value) {
    const numeric = Number(value);
    return numeric > 0 ? String(value) : '--';
}
function channelName(value) {
    const id = String(value ?? '');
    const channelMap = {
        '5': '携程',
        '6': '美团酒店',
        '8': '飞猪淘酒店',
        '17': '路客云聚合',
    };
    return channelMap[id] || '-';
}
function readPath(value, path) {
    let current = value;
    for (const segment of path) {
        if (!isRecord(current))
            return undefined;
        current = current[segment];
    }
    return current;
}
function readArray(value) {
    return Array.isArray(value) ? value : [];
}
function readString(value) {
    if (value === null || value === undefined || value === '')
        return undefined;
    return String(value);
}
function readNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}
function formatMoney(value) {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number))
        return '0';
    return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, '');
}
function formatDateTime(value) {
    const number = Number(value);
    if (!Number.isFinite(number))
        return '-';
    const date = new Date(number);
    if (Number.isNaN(date.getTime()))
        return '-';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
}
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
const MOCK_REPORT = {
    todayNewOrder: 2,
    todayPredictCheckIn: 1,
    staying: 0,
    todayPredictCheckOut: 0,
    tomorrowCheckIn: 1,
    tomorrowCheckOut: 0,
    pending: 0,
    refunding: 0,
    exception: 1,
};
const MOCK_ORDER_ROWS = [
    {
        orderId: '2055526750698446849',
        outOrderId: '1128147967607231',
        channelName: '携程',
        guestName: '蔡勇君',
        guestMobile: null,
        orderState: 1,
        refundDisplayState: 0,
        type: 1,
        isLt: 0,
        mockOrderType: '11',
        campId: DEFAULT_MOCK_CAMP_ID,
        includeCommissionRoomPrice: 395,
        totalRoomPrice: 308,
        otherPrice: 0,
        orderTotalIncomePrice: 395,
        totalPayPrice: 395,
        commissionPrice: 87,
        debtPrice: 0,
        bookedTime: 1778910741000,
        confirmNo: '1128147967607231',
        orderDetailViews: [
            {
                poiName: '天落会宿公寓(前海壹方城宝安中心店)',
                roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
                roomCategoryProductName: '全日房',
                roomName: '房间1',
                checkInDate: 1778943600000,
                checkOutDate: 1779019200000,
                duration: '1晚',
                orderDetailDisplayState: 4,
                isArrangeRoom: 1,
                isOccupation: 1,
                isStatistics: 1,
            },
        ],
    },
    {
        orderId: '2055103007337734146',
        outOrderId: '5115623835635087439',
        channelName: '飞猪淘酒店',
        guestName: '黄国辉',
        guestMobile: '+8617328513805',
        orderState: 1,
        type: 1,
        isLt: 0,
        mockOrderType: '4',
        campId: DEFAULT_MOCK_CAMP_ID,
        includeCommissionRoomPrice: 2116.53,
        totalRoomPrice: 1980.85,
        otherPrice: 0,
        orderTotalIncomePrice: 2116.53,
        totalPayPrice: 2116.53,
        commissionPrice: 135.68,
        debtPrice: 0,
        bookedTime: 1778809710000,
        orderDetailViews: [
            {
                poiName: '天落会宿公寓(前海壹方城宝安中心店)',
                roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
                roomCategoryProductName: '全日房',
                roomName: '',
                checkInDate: 1778943600000,
                checkOutDate: 1779547200000,
                duration: '7晚',
                orderDetailDisplayState: 1,
                isArrangeRoom: 0,
                isOccupation: 1,
                isStatistics: 1,
            },
        ],
    },
];
