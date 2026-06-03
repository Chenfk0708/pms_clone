export const LONG_RENTAL_ORDER_ENDPOINT = '/api/orders/page/get';
export const LONG_RENTAL_MOCK_ENDPOINT = '/order/house-longRental-order/list';
const TASK_ID = 'dingdan--zhusu-dingdan--changzu-dingdan';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
export async function fetchLongRentalOrders(query, signal) {
    const providerMode = query.provider ?? resolveLongRentalProviderMode();
    if (providerMode === 'api') {
        return fetchApiLongRentalOrders(query, signal);
    }
    const envelope = await fetchMockLongRentalOrders(query, signal);
    const data = unwrapEnvelope(envelope);
    return adaptPageData({
        providerMode,
        responseState: query.mockState ?? 'success',
        endpoint: LONG_RENTAL_MOCK_ENDPOINT,
        envelope,
        data,
    });
}
export function resolveLongRentalQueryFromLocation(location) {
    const params = new URLSearchParams(location.search);
    const provider = params.get('longRentalProvider');
    const mockState = params.get('longRentalMockState');
    const campId = params.get('campId')?.trim();
    return {
        provider: provider === 'api' || provider === 'mock' ? provider : undefined,
        mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
        campId: campId || undefined,
    };
}
export function createLongRentalOrderRequestBody(query) {
    const keyword = query.keyword?.trim();
    return {
        campId: query.campId ?? '1796067693589061634',
        pageNum: query.pageNum,
        pageSize: query.pageSize,
        current: query.pageNum,
        orderType: query.orderType,
        isLt: 1,
        ...(keyword ? { keyword, searchCode: keyword } : {}),
        ...(query.dateType ? { dateType: query.dateType } : {}),
        ...(query.orderStatus ? { orderStatus: query.orderStatus } : {}),
        ...(query.channel ? { channelId: query.channel } : {}),
        ...(query.roomType ? { roomCategoryId: query.roomType } : {}),
        ...(query.liveStatus ? { liveStatus: query.liveStatus } : {}),
        ...(query.store ? { poiId: query.store } : {}),
    };
}
function resolveLongRentalProviderMode() {
    const configured = import.meta.env.VITE_PMS_LONG_RENTAL_PROVIDER?.trim();
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
async function fetchMockLongRentalOrders(query, signal) {
    await delay(80, signal);
    const requestParams = createLongRentalOrderRequestBody(query);
    const responseState = query.mockState ?? 'success';
    const filteredRows = responseState === 'empty' ? [] : filterRows(mockLongRentalRows, query);
    if (responseState === 'error') {
        return {
            code: 5001,
            message: '长租订单数据加载失败，请稍后重试。',
            data: createBackendData(requestParams, []),
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: MOCK_TIMESTAMP,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: createBackendData(requestParams, filteredRows),
        traceId: `mock-${TASK_ID}-${responseState}-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
async function fetchApiLongRentalOrders(query, signal) {
    const requestParams = createLongRentalOrderRequestBody(query);
    const response = await fetch(LONG_RENTAL_ORDER_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestParams),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok) {
        const message = payload?.errorMsg ?? payload?.errorDetail ?? `HTTP ${response.status}`;
        throw new Error(message);
    }
    if (!payload || typeof payload !== 'object') {
        throw new Error('长租订单数据加载失败，请稍后重试。');
    }
    if (payload.success === false) {
        throw new Error(payload.errorMsg || payload.errorDetail || '长租订单数据加载失败，请稍后重试。');
    }
    if (!payload.data || !Array.isArray(payload.data.list)) {
        throw new Error('长租订单数据加载失败，请稍后重试。');
    }
    const envelope = {
        code: 0,
        message: 'success',
        data: {
            requestParams,
            list: payload.data.list,
            pagination: {
                page: toNumber(payload.data.pageNum ?? payload.data.current, query.pageNum),
                pageSize: toNumber(payload.data.size, query.pageSize),
                total: toNumber(payload.data.total, payload.data.list.length),
                pages: toNumber(payload.data.pages, 1),
            },
            options: mockOptions,
            routeTargets,
        },
        traceId: `api-${TASK_ID}-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    return adaptPageData({
        providerMode: 'api',
        responseState: 'success',
        endpoint: LONG_RENTAL_ORDER_ENDPOINT,
        envelope,
        data: envelope.data,
    });
}
function createBackendData(requestParams, list) {
    return {
        requestParams,
        list,
        pagination: {
            page: toNumber(requestParams.pageNum, 1),
            pageSize: toNumber(requestParams.pageSize, 20),
            total: list.length,
            pages: Math.max(1, Math.ceil(list.length / toNumber(requestParams.pageSize, 20))),
        },
        options: mockOptions,
        routeTargets,
    };
}
function adaptPageData(input) {
    return {
        providerMode: input.providerMode,
        responseState: input.responseState,
        endpoint: input.endpoint,
        traceId: input.envelope.traceId,
        timestamp: input.envelope.timestamp,
        requestParams: input.data.requestParams,
        total: input.data.pagination.total,
        pageNum: input.data.pagination.page,
        pageSize: input.data.pagination.pageSize,
        pages: input.data.pagination.pages,
        rows: input.data.list.map(adaptLongRentalOrderRow),
        options: input.data.options,
        routeTargets: input.data.routeTargets,
    };
}
function unwrapEnvelope(envelope) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message);
    }
    return envelope.data;
}
function filterRows(rows, query) {
    const requestParams = createLongRentalOrderRequestBody(query);
    const keyword = String(requestParams.keyword ?? '').trim().toLowerCase();
    return rows.filter((value) => {
        const row = asRecord(value);
        const orderType = String(requestParams.orderType ?? '');
        const matchesOrderType = !orderType || String(row.orderType ?? '') === orderType;
        const matchesKeyword = !keyword ||
            [
                row.orderId,
                row.outOrderId,
                row.guestName,
                row.guestMobile,
                row.roomCategoryName,
                row.roomName,
                row.channelName,
                row.poiName,
            ]
                .join(' ')
                .toLowerCase()
                .includes(keyword);
        const matchesDateType = !query.dateType || query.dateType === 'checkIn';
        const matchesStatus = !query.orderStatus || String(row.orderState ?? '') === query.orderStatus;
        const matchesChannel = !query.channel || String(row.orderChannelId ?? '') === query.channel;
        const matchesRoomType = !query.roomType || String(row.roomCategoryId ?? '') === query.roomType;
        const matchesLiveStatus = !query.liveStatus || String(row.liveStatusCode ?? '') === query.liveStatus;
        const matchesStore = !query.store || String(row.poiId ?? '') === query.store;
        return (matchesOrderType &&
            matchesKeyword &&
            matchesDateType &&
            matchesStatus &&
            matchesChannel &&
            matchesRoomType &&
            matchesLiveStatus &&
            matchesStore);
    });
}
function adaptLongRentalOrderRow(value, index) {
    const row = asRecord(value);
    return {
        orderNo: pickString(row, ['orderId', 'orderNo', 'id']) ?? `long-rental-${index + 1}`,
        channel: pickString(row, ['channelName', 'orderChannelName', 'channel']) ?? '-',
        tenantName: pickString(row, ['guestName', 'contactName', 'tenantName', 'name']) ?? '-',
        phone: pickString(row, ['guestMobile', 'contactPhone', 'phone', 'mobile']) ?? '-',
        roomType: pickString(row, ['roomCategoryName', 'roomTypeName']) ?? '-',
        room: pickString(row, ['roomName', 'roomNo']) ?? '-',
        store: pickString(row, ['poiName', 'campName', 'storeName']) ?? '-',
        checkInAt: pickString(row, ['checkInTime', 'checkInDate']) ?? '-',
        leaveAt: pickString(row, ['checkOutTime', 'checkOutDate']) ?? '-',
        liveStatus: normalizeLiveStatus(pickString(row, ['liveStatusName', 'orderDetailDisplayStateName'])),
        roomRevenueGross: formatMoney(firstExisting(row, ['ltGrossRevenuePrice', 'roomRevenue', 'includeCommissionRoomPrice'])),
        roomRevenueNet: formatMoney(firstExisting(row, ['ltGrossProceedPrice', 'roomRevenueWithoutCommission', 'totalRoomPrice'])),
        otherExpense: formatMoney(firstExisting(row, ['ltOtherPrice', 'otherExpense', 'otherPrice'])),
        deposit: formatMoney(firstExisting(row, ['ltDepositPrice', 'deposit', 'depositPrice'])),
        totalRevenue: formatMoney(firstExisting(row, ['orderTotalIncomePrice', 'orderTotalRevenue', 'totalRevenue'])),
        contractStart: pickString(row, ['ltRentStartDate', 'contractStartDate']) ?? '-',
        contractEnd: pickString(row, ['ltRentEndDate', 'contractEndDate']) ?? '-',
        contractTerm: pickString(row, ['ltPeriodOfContract', 'contractTerm']) ?? '-',
        paymentMethod: pickString(row, ['ltPaymentCycleName', 'paymentWayName']) ?? '-',
        paymentDate: pickString(row, ['paymentTime', 'paymentDateDesc']) ?? '-',
        bookedAt: pickString(row, ['bookedAtText', 'createTimeText', 'createTime']) ?? '-',
        stockFlag: formatStockFlag(firstExisting(row, ['isOccupyStock', 'stockFlag'])),
        roomFlag: pickString(row, ['arrangeRoomStatusName', 'roomFlag']) ?? '',
        planFlag: pickString(row, ['includeStatisticsName', 'planFlag']) ?? '',
        orderType: pickString(row, ['orderType']) ?? '',
        contractNo: pickString(row, ['contractNo']) ?? '-',
        nextPaymentAmount: formatMoney(firstExisting(row, ['nextPaymentAmount'])),
        nextPaymentDate: pickString(row, ['nextPaymentDate']) ?? '-',
    };
}
function normalizeLiveStatus(value) {
    if (value === '入住中' || value === '已退房' || value === '待入住')
        return value;
    return '已取消';
}
function formatStockFlag(value) {
    if (value === null || value === undefined || value === '')
        return '';
    return String(value);
}
function formatMoney(value) {
    if (value === null || value === undefined || value === '')
        return '--';
    const numeric = Number(value);
    if (!Number.isFinite(numeric))
        return String(value);
    return String(numeric);
}
function firstExisting(record, keys) {
    for (const key of keys) {
        if (record[key] !== undefined && record[key] !== null && record[key] !== '')
            return record[key];
    }
    return undefined;
}
function pickString(record, keys) {
    const value = firstExisting(record, keys);
    if (value === undefined)
        return undefined;
    return String(value);
}
function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function delay(ms, signal) {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('长租订单请求已取消', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('长租订单请求已取消', 'AbortError'));
        }, { once: true });
    });
}
const routeTargets = {
    houseOrders: '/order/house-order/list',
    houseStatus: '/houseManage/days',
    report: '/statistics/report',
    settings: '/setting/writeExpendSetting',
};
const mockOptions = {
    dateTypes: [
        { label: '入住时间', value: 'checkIn' },
        { label: '离开时间', value: 'checkOut' },
        { label: '预订时间', value: 'booked' },
    ],
    orderStatuses: [
        { label: '全部', value: '' },
        { label: '已取消', value: '5' },
        { label: '进行中', value: '2' },
    ],
    channels: [
        { label: '全部', value: '' },
        { label: '美团民宿', value: '1004' },
        { label: '途家', value: '1002' },
    ],
    roomTypes: [
        { label: '全部', value: '' },
        { label: '总裁套间（桑拿浴缸露台电竞麻将）', value: 'room-category-president' },
        { label: '顶层套房（浴缸巨幕电竞麻将）', value: 'room-category-top' },
    ],
    liveStatuses: [
        { label: '全部', value: '' },
        { label: '已取消', value: 'cancelled' },
        { label: '入住中', value: 'living' },
        { label: '待入住', value: 'pending' },
    ],
    stores: [
        { label: '全部', value: '' },
        { label: '天落会宿公寓(前海壹方城宝安中心店)', value: 'poi-1796067693589061634' },
    ],
    tags: [
        { label: '全部', value: '' },
        { label: '长租客户', value: 'long-rental' },
    ],
    roomFlags: [
        { label: '请选择排房情况', value: '' },
        { label: '已排房', value: 'arranged' },
        { label: '未排房', value: 'pending' },
    ],
    stockFlags: [
        { label: '请选择占库存情况', value: '' },
        { label: '占库存', value: '1' },
        { label: '不占库存', value: '0' },
    ],
    statisticsFlags: [
        { label: '请选择统计情况', value: '' },
        { label: '计入统计', value: '1' },
        { label: '不计入统计', value: '0' },
    ],
};
const mockLongRentalRows = [
    {
        orderId: '1871589898539520001',
        outOrderId: 'MT-LR-202412250012',
        channelId: '1004',
        orderChannelId: '1004',
        channelName: '美团民宿',
        guestName: '佟扬',
        guestMobile: '+8613701374866',
        roomCategoryId: 'room-category-president',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomName: '-',
        poiId: 'poi-1796067693589061634',
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
        checkInTime: '2025-01-12 15:00',
        checkOutTime: '2025-01-27 12:00',
        liveStatusName: '已取消',
        liveStatusCode: 'cancelled',
        orderState: 5,
        orderType: '11',
        includeCommissionRoomPrice: null,
        totalRoomPrice: null,
        otherPrice: null,
        ltDepositPrice: 200,
        orderTotalIncomePrice: null,
        ltRentStartDate: '2025-01-12',
        ltRentEndDate: '2025-01-27',
        ltPeriodOfContract: '15日',
        ltPaymentCycleName: '一次性付清',
        paymentTime: '本月11号',
        createTimeText: '2024-12-25 00:12:54',
        isOccupyStock: 1,
        arrangeRoomStatusName: '',
        includeStatisticsName: '',
        contractNo: 'HT-LR-20250112001',
        nextPaymentAmount: 0,
        nextPaymentDate: '2025-01-11',
    },
];
