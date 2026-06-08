const HUDSON_API_BASE = '/api';
const CAMPS_PATH = '/camps/get';
const DEFAULT_MONTH_STORE_ID = 'poi-1796067693589061634';
const DEFAULT_MONTH_STORE_NAME = '天落会宿公寓(前海壹方城宝安中心店)';
const REQUEST_PATHS = [
    '/roomStatuses/rooms/get',
    '/roomStatuses/occ/get',
    '/roomStatuses/inv/get',
    '/roomStatuses/block/get',
    '/roomStatuses/dailyMonitor/get',
    '/roomStatuses/redDot/get',
    '/roomStatuses/orderDetails/get',
];
export async function fetchHouseMonthsSnapshot(filters, columns) {
    const providerName = filters.provider ?? resolveHouseMonthsProviderName();
    if (providerName === 'mock') {
        return fetchMockHouseMonthsSnapshot(filters, columns);
    }
    const payload = buildPayload(filters);
    const [rooms, occ, inv, block, dailyMonitor, redDot, orderDetails] = await Promise.all(REQUEST_PATHS.map((requestPath) => postHudsonJson(requestPath, payload)));
    const rows = adaptHouseMonthsRows({ rooms, occ, inv, block, dailyMonitor, redDot, orderDetails }, columns);
    return {
        rows,
        columns: adaptHouseMonthsColumns(dailyMonitor, columns, rows),
        requestPaths: [...REQUEST_PATHS],
    };
}
export async function fetchHouseMonthsDefaultCampId() {
    if (resolveHouseMonthsProviderName() === 'mock') {
        const response = unwrapHouseMonthsEnvelope(mockHouseMonthsDefaultCampResponse());
        const campId = pickString(toArray(readPath(response, ['camps']))[0], ['campId', 'id']);
        if (!campId)
            throw new Error('/camps/get 缺少可用 campId');
        return campId;
    }
    const data = await postHudsonJson(CAMPS_PATH, {});
    const camps = toArray(readPath(data, ['camps']));
    const campId = pickString(camps[0], ['campId', 'id']);
    if (!campId) {
        throw new Error('/camps/get 缺少可用 campId');
    }
    return campId;
}
export async function closeHouseMonthRoom(request) {
    const data = await postHudsonJson('/roomStatuses/close/save', {
        campId: request.campId,
        roomCategoryId: request.roomCategoryId,
        roomId: request.roomId,
        date: request.date,
        reason: request.reason,
    });
    if (!isRecord(data)) {
        throw new Error('/roomStatuses/close/save 响应缺少 data');
    }
    return {
        roomCategoryId: pickString(data, ['roomCategoryId']) || request.roomCategoryId,
        roomId: pickString(data, ['roomId']) || request.roomId,
        date: pickString(data, ['date']) || request.date,
        reason: pickString(data, ['reason']) || request.reason,
        message: pickString(data, ['message']) || '关房成功',
    };
}
export async function openHouseMonthRoom(request) {
    const data = await postHudsonJson('/roomStatuses/open/save', {
        campId: request.campId,
        roomCategoryId: request.roomCategoryId,
        roomId: request.roomId,
        date: request.date,
        reason: request.reason,
    });
    if (!isRecord(data)) {
        throw new Error('/roomStatuses/open/save 响应缺少 data');
    }
    return {
        roomCategoryId: pickString(data, ['roomCategoryId']) || request.roomCategoryId,
        roomId: pickString(data, ['roomId']) || request.roomId,
        date: pickString(data, ['date']) || request.date,
        reason: pickString(data, ['reason']) || request.reason,
        message: pickString(data, ['message']) || '开房成功',
    };
}
export async function saveHouseMonthOrderGuests(request) {
    const data = await postHudsonJson(`/orders/${encodeURIComponent(request.orderId)}/guests/save`, {
        campId: request.campId,
        guests: request.guests,
    });
    return adaptHouseMonthOrderActionResponse(data, request.orderId, '入住人保存成功');
}
export async function checkInHouseMonthOrder(request) {
    const data = await postHudsonJson(`/orders/${encodeURIComponent(request.orderId)}/check-in`, {
        campId: request.campId,
    });
    return adaptHouseMonthOrderActionResponse(data, request.orderId, '办理入住成功');
}
export async function checkOutHouseMonthOrder(request) {
    const data = await postHudsonJson(`/orders/${encodeURIComponent(request.orderId)}/check-out`, {
        campId: request.campId,
    });
    return adaptHouseMonthOrderActionResponse(data, request.orderId, '办理退房成功');
}
export async function cancelHouseMonthOrder(request) {
    const data = await postHudsonJson(`/orders/${encodeURIComponent(request.orderId)}/cancel`, {
        campId: request.campId,
        reason: request.reason,
    });
    return adaptHouseMonthOrderActionResponse(data, request.orderId, '订单取消成功');
}
export async function skipStockHouseMonthOrder(request) {
    const data = await postHudsonJson(`/orders/${encodeURIComponent(request.orderId)}/skip-stock`, {
        campId: request.campId,
        reason: request.reason,
    });
    return adaptHouseMonthOrderActionResponse(data, request.orderId, '订单已释放库存并取消排房');
}
export async function fetchHouseMonthChangeRoomOptions(request) {
    const data = await postHudsonJson(`/orders/${encodeURIComponent(request.orderId)}/change-room/options`, {
        campId: request.campId,
    });
    if (!isRecord(data)) {
        throw new Error('换房房间响应缺少 data');
    }
    return {
        orderId: pickString(data, ['orderId', 'id']) || request.orderId,
        roomId: pickString(data, ['roomId']),
        roomName: pickString(data, ['roomName']),
        roomCategoryId: pickString(data, ['roomCategoryId']),
        roomCategoryName: pickString(data, ['roomCategoryName']),
        rooms: toArray(data.rooms).map((room) => ({
            roomId: pickString(room, ['roomId', 'id']) || '',
            roomName: pickString(room, ['roomName', 'name']) || '',
            roomCategoryId: pickString(room, ['roomCategoryId']),
            roomCategoryName: pickString(room, ['roomCategoryName']),
            poiId: pickString(room, ['poiId', 'storeId']),
            poiName: pickString(room, ['poiName', 'storeName']),
        })).filter((room) => room.roomId && room.roomName),
    };
}
export async function changeHouseMonthOrderRoom(request) {
    const data = await postHudsonJson(`/orders/${encodeURIComponent(request.orderId)}/change-room`, {
        campId: request.campId,
        roomId: request.roomId,
        reason: request.reason,
    });
    return adaptHouseMonthOrderActionResponse(data, request.orderId, '换房成功');
}
function adaptHouseMonthOrderActionResponse(data, fallbackOrderId, fallbackMessage) {
    if (!isRecord(data)) {
        throw new Error('订单操作响应缺少 data');
    }
    return {
        orderId: pickString(data, ['orderId', 'id']) || fallbackOrderId,
        status: pickString(data, ['status', 'orderStatus', 'liveStatus']),
        guestCount: pickNumber(data, ['guestCount']),
        roomId: pickString(data, ['roomId']),
        roomName: pickString(data, ['roomName']),
        roomCategoryId: pickString(data, ['roomCategoryId']),
        roomCategoryName: pickString(data, ['roomCategoryName']),
        guestRegisteredAt: pickString(data, ['guestRegisteredAt', 'guest_registered_at']),
        checkedOutAt: pickString(data, ['checkedOutAt', 'checked_out_at']),
        message: pickString(data, ['message']) || fallbackMessage,
    };
}
function buildPayload(filters) {
    return {
        campId: filters.campId,
        startDate: filters.startDate,
        days: filters.days,
        queryCode: filters.queryCode || undefined,
        roomCategoryIds: filters.roomCategoryId ? [filters.roomCategoryId] : undefined,
    };
}
function resolveHouseMonthsProviderName() {
    const configured = readRuntimeConfig('pms.houseMonthsProvider') || import.meta.env.VITE_HOUSE_MONTHS_PROVIDER;
    return configured === 'real' ? 'real' : 'mock';
}
function resolveMockMode() {
    const configured = readRuntimeConfig('pms.houseMonthsMockMode') || import.meta.env.VITE_HOUSE_MONTHS_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function unwrapHouseMonthsEnvelope(response) {
    if (response.code !== 0) {
        throw new Error(`${response.message}（traceId: ${response.traceId}）`);
    }
    return response.data;
}
async function fetchMockHouseMonthsSnapshot(filters, columns) {
    const mode = resolveMockMode();
    if (mode === 'error') {
        unwrapHouseMonthsEnvelope(mockErrorEnvelope());
    }
    const payload = buildPayload(filters);
    const bundle = mode === 'empty'
        ? mockEmptyHouseMonthsBundle()
        : mockSuccessHouseMonthsBundle(payload, columns);
    const dailyMonitor = unwrapHouseMonthsEnvelope(bundle.dailyMonitor);
    const rows = adaptHouseMonthsRows({
        rooms: unwrapHouseMonthsEnvelope(bundle.rooms),
        occ: unwrapHouseMonthsEnvelope(bundle.occ),
        inv: unwrapHouseMonthsEnvelope(bundle.inv),
        block: unwrapHouseMonthsEnvelope(bundle.block),
        dailyMonitor,
        redDot: unwrapHouseMonthsEnvelope(bundle.redDot),
        orderDetails: unwrapHouseMonthsEnvelope(bundle.orderDetails),
    }, columns);
    return {
        rows,
        columns: adaptHouseMonthsColumns(dailyMonitor, columns, rows),
        requestPaths: ['统一响应包', ...REQUEST_PATHS],
    };
}
function successEnvelope(traceId, data) {
    return {
        code: 0,
        message: 'success',
        data,
        traceId,
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockErrorEnvelope() {
    return {
        code: 50001,
        message: '月房态数据加载失败，请稍后重试',
        data: null,
        traceId: 'mock-fangtai--fangtai-guanli--yuefangtai-error-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockHouseMonthsDefaultCampResponse() {
    return successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-camps-001', {
        camps: [{ campId: 'camp-001', name: '天落会宿公寓' }],
    });
}
function mockEmptyHouseMonthsBundle() {
    return {
        rooms: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-rooms-empty-001', {
            isSingleInventory: 0,
            list: [],
            pagination: { page: 1, pageSize: 20, total: 0 },
        }),
        occ: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-occ-empty-001', { list: [] }),
        inv: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-inv-empty-001', { list: [] }),
        block: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-block-empty-001', { list: [] }),
        dailyMonitor: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-daily-empty-001', { list: [] }),
        redDot: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-red-dot-empty-001', { list: [] }),
        orderDetails: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-orders-empty-001', {
            list: [],
            orderArrangementInfos: [],
            pagination: { page: 1, pageSize: 20, total: 0 },
        }),
    };
}
function mockSuccessHouseMonthsBundle(payload, columns) {
    const roomCategories = [
        {
            storeId: DEFAULT_MONTH_STORE_ID,
            storeName: DEFAULT_MONTH_STORE_NAME,
            roomCategoryId: 'room-category-deluxe',
            roomCategoryName: '豪华大床房',
            roomId: 'room-801',
            roomName: '801',
            price: 288,
            monthlyRent: 6800,
        },
        {
            storeId: DEFAULT_MONTH_STORE_ID,
            storeName: DEFAULT_MONTH_STORE_NAME,
            roomCategoryId: 'room-category-president',
            roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
            roomId: 'room-902',
            roomName: '902',
            price: 668,
            monthlyRent: 12800,
        },
        {
            storeId: 'poi-other-demo-store',
            storeName: '天落会宿公寓(演示分店)',
            roomCategoryId: 'room-category-sky',
            roomCategoryName: '天落大床电竞套间',
            roomId: 'room-1206',
            roomName: '1206',
            price: 398,
            monthlyRent: 9800,
        },
        {
            storeId: 'poi-other-demo-store',
            storeName: '天落会宿公寓(演示分店)',
            roomCategoryId: 'room-category-movie',
            roomCategoryName: '观影大床房',
            roomId: 'room-706',
            roomName: '706',
            price: 218,
            monthlyRent: 5800,
        },
    ];
    const orderDate = (index) => columns[index]?.isoDate ?? payload.startDate;
    const stayRange = (startIndex, endIndex) => {
        const start = orderDate(startIndex);
        const end = orderDate(endIndex);
        return `${start}-${end.slice(5)}`;
    };
    return {
        rooms: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-rooms-001', {
            isSingleInventory: 0,
            list: roomCategories.map((category) => ({
                storeId: category.storeId,
                storeName: category.storeName,
                roomCategoryId: category.roomCategoryId,
                roomCategoryName: category.roomCategoryName,
                rooms: [{ roomId: category.roomId, roomName: category.roomName }],
            })),
            pagination: { page: 1, pageSize: 20, total: roomCategories.length },
        }),
        occ: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-occ-001', { list: [] }),
        inv: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-inv-001', {
            list: roomCategories.flatMap((category, categoryIndex) => columns.map((column, columnIndex) => ({
                roomCategoryId: category.roomCategoryId,
                date: column.isoDate,
                inventory: categoryInventoryForIndex(categoryIndex, columnIndex),
            }))),
        }),
        block: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-block-001', {
            list: [
                {
                    roomCategoryId: 'room-category-president',
                    roomId: 'room-902',
                    date: orderDate(8),
                    reason: '设备维护',
                },
                {
                    roomCategoryId: 'room-category-sky',
                    roomId: 'room-1206',
                    date: orderDate(12),
                    reason: '保养停用',
                },
            ],
        }),
        dailyMonitor: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-daily-001', {
            list: columns.map((column, index) => ({
                date: column.isoDate,
                remain: `余${dailyRemainForIndex(index)}间`,
            })),
        }),
        redDot: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-red-dot-001', { list: [] }),
        orderDetails: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-orders-001', {
            list: [
                {
                    roomCategoryId: 'room-category-deluxe',
                    roomId: 'room-801',
                    date: orderDate(3),
                    guestName: '李思思',
                    channelName: '携程旅行',
                    roomFee: 288,
                    totalIncome: 318,
                    stayRange: stayRange(3, 4),
                    phone: '13800000000',
                    remark: '已确认到店时间',
                    orderId: 'order-001',
                },
                {
                    roomCategoryId: 'room-category-president',
                    roomId: 'room-902',
                    date: orderDate(6),
                    guestName: '王欣怡',
                    channelName: '美团酒店',
                    roomFee: 668,
                    totalIncome: 728,
                    stayRange: stayRange(6, 8),
                    phone: '13900000001',
                    remark: '需提前开空调',
                    orderId: 'order-002',
                    hasRemark: true,
                },
                {
                    roomCategoryId: 'room-category-sky',
                    roomId: 'room-1206',
                    date: orderDate(3),
                    guestName: '赵晨',
                    channelName: '飞猪旅行',
                    roomFee: 398,
                    totalIncome: 428,
                    stayRange: stayRange(9, 10),
                    phone: '13700000002',
                    remark: '高楼层偏好',
                    orderId: 'order-003',
                },
                {
                    roomCategoryId: 'room-category-movie',
                    roomId: 'room-706',
                    date: orderDate(3),
                    guestName: '张张',
                    channelName: '去哪儿旅行',
                    roomFee: 218,
                    totalIncome: 236,
                    stayRange: stayRange(5, 6),
                    phone: '13600000003',
                    remark: '到店后补押金',
                    orderId: 'order-004',
                    hasRemark: true,
                },
            ],
            orderArrangementInfos: [],
            pagination: { page: 1, pageSize: 20, total: 4 },
        }),
    };
}
function dailyRemainForIndex(index) {
    const targetLikeRemain = [2, 0, 3, 2, 4, 4, 3];
    return targetLikeRemain[index] ?? 4;
}
function categoryInventoryForIndex(categoryIndex, columnIndex) {
    const inventoryPattern = [
        [1, 0, 0, 1, 2, 2, 1],
        [2, 0, 1, 1, 1, 2, 2],
        [0, 0, 1, 0, 1, 1, 2],
        [1, 1, 1, 1, 0, 1, 1],
    ];
    return inventoryPattern[categoryIndex]?.[columnIndex % 7] ?? 1;
}
async function postHudsonJson(pathname, body) {
    let response;
    try {
        response = await fetch(`${HUDSON_API_BASE}${pathname}`, {
            method: 'POST',
            credentials: 'include',
            headers: buildHudsonHeaders(),
            body: JSON.stringify(body),
        });
    }
    catch (error) {
        throw new Error(`接口请求失败：${pathname}，${error instanceof Error ? error.message : String(error)}`, {
            cause: error,
        });
    }
    if (!response.ok) {
        throw new Error(`接口请求失败：${pathname}，HTTP ${response.status}`);
    }
    const json = (await response.json().catch(() => null));
    if (!json || typeof json !== 'object') {
        throw new Error(`接口响应不可解析：${pathname}`);
    }
    if (json.success === false) {
        throw new Error(String(json.errorMsg || json.errorDetail || `接口业务失败：${pathname}`));
    }
    return json.data;
}
function buildHudsonHeaders() {
    const headers = {
        'content-type': 'application/json',
        app_device: 'web',
        app_platform: '2',
        app_source: '1',
        app_system: 'v4.10.7',
        app_version: '4.10.7',
    };
    const token = readHudsonAccessToken();
    if (token)
        headers['hudson-access-token'] = token;
    return headers;
}
function readHudsonAccessToken() {
    if (typeof window === 'undefined')
        return '';
    const tokenKeys = ['pms.hudsonAccessToken', 'hudson-access-token', 'hudsonAccessToken'];
    for (const key of tokenKeys) {
        const token = window.localStorage.getItem(key)?.trim();
        if (token)
            return token;
    }
    return '';
}
export function adaptHouseMonthsRows(bundle, columns) {
    const roomCategories = toArray(readPath(bundle.rooms, ['list']));
    const orderRecords = toArray(readPath(bundle.orderDetails, ['list']));
    const orderArrangementRecords = toArray(readPath(bundle.orderDetails, ['orderArrangementInfos']));
    const inventoryRecords = toArray(readPath(bundle.inv, ['list']));
    const blockRecords = toArray(readPath(bundle.block, ['list']));
    const fallbackStoreId = pickString(bundle.rooms, ['storeId', 'campId']) ||
        pickString(roomCategories[0], ['storeId', 'campId', 'poiId']) ||
        DEFAULT_MONTH_STORE_ID;
    const fallbackStoreName = pickString(bundle.rooms, ['storeName', 'campName']) ||
        pickString(roomCategories[0], ['storeName', 'campName', 'poiName']) ||
        DEFAULT_MONTH_STORE_NAME;
    const rows = roomCategories.flatMap((category, categoryIndex) => {
        const categoryId = pickString(category, ['roomCategoryId', 'categoryId', 'id', 'rcId', 'i']) || `category-${categoryIndex}`;
        const storeId = pickString(category, ['storeId', 'campId', 'poiId']) || fallbackStoreId;
        const storeName = pickString(category, ['storeName', 'campName', 'poiName']) || fallbackStoreName;
        const label = pickString(category, ['roomCategoryName', 'categoryName', 'name', 'label', 'title', 'n']) || `未识别房型 ${categoryIndex + 1}`;
        const rooms = toArray(firstExisting(category, ['rooms', 'roomList', 'roomViews', 'children', 'roomInfos', 'rs']));
        const normalizedRooms = rooms.length ? rooms : [{ roomId: `${categoryId}-room`, roomName: '房间1' }];
        return normalizedRooms.map((room, roomIndex) => {
            const roomId = pickString(room, ['roomId', 'id', 'roomInfoId', 'i']) || `${categoryId}-room-${roomIndex}`;
            const roomLabel = pickString(room, ['roomName', 'name', 'label', 'title', 'n']) || `房间${roomIndex + 1}`;
            const price = pickMoney(room, ['price', 'salePrice', 'roomPrice', 'basePrice', 'marketPrice'], []) ??
                pickMoney(category, ['price', 'salePrice', 'roomPrice', 'basePrice', 'marketPrice'], []);
            const monthlyRent = pickMoney(room, ['monthlyRent', 'monthRent', 'rent'], []) ??
                pickMoney(category, ['monthlyRent', 'monthRent', 'rent'], []);
            return {
                id: `${categoryId}-${roomId}`,
                storeId,
                storeName,
                label,
                roomCategoryId: categoryId,
                roomLabel,
                roomId,
                price: typeof price === 'number' ? formatPlainMoney(price) : undefined,
                monthlyRent: typeof monthlyRent === 'number' ? formatPlainMoney(monthlyRent) : undefined,
                typeCells: [],
                roomCells: columns.map((column) => buildRoomCell(categoryId, roomId, column.isoDate, orderRecords, orderArrangementRecords, blockRecords)),
            };
        });
    });
    return rows.map((row) => ({
        ...row,
        typeCells: columns.map((column, columnIndex) => buildTypeCell(row.roomCategoryId ?? row.id, column.isoDate, columnIndex, inventoryRecords, deriveAvailableRoomCount(rows, columnIndex, row.roomCategoryId))),
    }));
}
export function adaptHouseMonthsColumns(dailyMonitor, columns, rows = []) {
    const monitorRecords = toArray(readPath(dailyMonitor, ['list']));
    return columns.map((column, columnIndex) => {
        const derivedRemain = deriveAvailableRoomCount(rows, columnIndex);
        if (typeof derivedRemain === 'number')
            return { ...column, remain: `余${derivedRemain}间` };
        const record = monitorRecords.find((item) => normalizeDate(firstExisting(item, ['date', 'day', 'bizDate', 'd'])) === column.isoDate);
        const remainText = pickString(record, ['remain', 'remainText', 'remainDesc']);
        const remainNumber = pickNumber(record, ['remainNum', 'remainRoomNum', 'availableNum', 'num']);
        if (remainText)
            return { ...column, remain: remainText };
        if (typeof remainNumber === 'number')
            return { ...column, remain: `余${remainNumber}间` };
        return column;
    });
}
function buildTypeCell(categoryId, isoDate, columnIndex, inventoryRecords, derivedInventory) {
    const record = findDatedRecord(inventoryRecords, categoryId, undefined, isoDate);
    const compactRecord = inventoryRecords.find((item) => pickString(item, ['rci']) === categoryId);
    const compactInventory = pickIndexedNumber(firstExisting(compactRecord, ['ivs']), columnIndex);
    const inventory = derivedInventory ?? compactInventory ?? pickNumber(record, ['inventory', 'inv', 'remain', 'remainNum', 'availableNum', 'num']);
    if (inventory === 0)
        return { title: '售罄', tone: 'sold' };
    if (typeof inventory === 'number')
        return { title: `余${inventory}`, tone: 'free' };
    return { title: '售罄', tone: 'sold' };
}
function deriveAvailableRoomCount(rows, columnIndex, categoryId) {
    const scopedRows = categoryId ? rows.filter((row) => row.roomCategoryId === categoryId) : rows;
    if (!scopedRows.length)
        return undefined;
    return scopedRows.reduce((total, row) => {
        const cell = row.roomCells[columnIndex];
        return cell?.tone === 'blank' ? total + 1 : total;
    }, 0);
}
function buildRoomCell(categoryId, roomId, isoDate, orderRecords, orderArrangementRecords, blockRecords) {
    const block = findDatedRecord(blockRecords, categoryId, roomId, isoDate);
    if (block)
        return { title: '停用', tone: 'disabled' };
    const orders = findOrdersForRoomDate(orderRecords, orderArrangementRecords, categoryId, roomId, isoDate);
    const order = orders[0];
    if (!order)
        return { title: '', tone: 'blank' };
    const guest = pickString(order, ['guestName', 'customerName', 'reserveName', 'name', 'orderName', 'contactName', 'gn']) || '未命名订单';
    const channel = pickString(order, [
        'channelName',
        'orderChannelName',
        'shortChannelName',
        'sourceLabelSnapshot',
        'source_label_snapshot',
        'otaName',
        'sourceName',
        'orderSourceName',
        'sourceTypeName',
        'channel',
        'source',
        'ocn',
    ]) || undefined;
    const amount = pickMoney(order, ['roomFee', 'roomPrice', 'price', 'amount', 'totalRoomFee'], ['rp']);
    const totalIncome = pickMoney(order, ['totalIncome', 'orderTotalIncome', 'totalAmount', 'income'], ['oep', 'otp']);
    const stayRange = formatStayRangeForDisplay(order);
    const liveStatus = normalizeMonthLiveStatus(pickString(order, ['liveStatusName', 'statusName', 'roomStatusName', 'liveName', 'lsn']) ??
        inferLiveStatus(order) ??
        pickString(order, ['liveStatus']));
    const duplicate = orders.length > 1;
    return {
        title: guest,
        subtitle: channel,
        amount: typeof amount === 'number' ? formatMoney(amount) : undefined,
        totalIncome: typeof totalIncome === 'number' ? formatMoney(totalIncome) : undefined,
        liveStatus,
        stayRange,
        createdAt: pickString(order, ['createdAt', 'created_at', 'createTime', 'createdTime', 'gmtCreate', 'orderCreateTime', 'orderCreatedAt']),
        bookingAt: pickString(order, ['bookingAt', 'booking_at', 'createdAt', 'created_at', 'createTime', 'createdTime', 'gmtCreate', 'orderCreateTime', 'orderCreatedAt', 'reserveAt', 'orderTime']),
        checkInAt: pickString(order, ['checkInAt', 'check_in_at', 'actualCheckInAt', 'actualCheckinAt', 'actualCheckInTime', 'startAt', 'start_at']),
        checkOutAt: pickString(order, ['checkOutAt', 'check_out_at', 'actualCheckOutAt', 'actualCheckoutAt', 'actualCheckOutTime', 'endAt', 'end_at']),
        guestRegisteredAt: pickString(order, ['guestRegisteredAt', 'guest_registered_at']),
        checkedOutAt: pickString(order, ['checkedOutAt', 'checked_out_at']),
        phone: pickString(order, ['phone', 'mobile', 'contactPhone', 'gm']),
        remark: pickString(order, ['remark', 'orderRemark', 'rmk']),
        orderId: pickString(order, ['orderId', 'id', 'orderNo', 'oi', 'odi']),
        badge: pickBooleanLike(order, ['hasRemark', 'remarkFlag', 'isRemark', 'rmk']) ? '备' : undefined,
        tone: toneForMonthLiveStatus(liveStatus, duplicate),
        channelTone: toneForChannel(channel),
    };
}
function findOrdersForRoomDate(orderRecords, orderArrangementRecords, categoryId, roomId, isoDate) {
    const arrangedOrderIds = findDatedRecords(orderArrangementRecords, categoryId, roomId, isoDate).flatMap(resolveArrangementOrderIds);
    const arrangedIdSet = new Set(arrangedOrderIds);
    const arrangedOrders = arrangedIdSet.size > 0
        ? orderRecords.filter((record) => isOrderInArrangement(record, arrangedIdSet))
        : [];
    const datedOrders = orderRecords.filter((record) => isOrderForRoomDate(record, categoryId, roomId, isoDate));
    const orders = [...arrangedOrders, ...datedOrders];
    return uniqueOrders(orders);
}
function isOrderForRoomDate(record, categoryId, roomId, isoDate) {
    const recordCategoryId = pickString(record, ['roomCategoryId', 'categoryId', 'rcId', 'rci']);
    const recordRoomId = pickString(record, ['roomId', 'roomInfoId', 'ri']);
    const recordDate = normalizeDate(firstExisting(record, ['date', 'day', 'bizDate', 'roomDate', 'startDate', 'd']));
    if (recordCategoryId && recordCategoryId !== categoryId)
        return false;
    if (recordRoomId && recordRoomId !== roomId)
        return false;
    return recordDate === isoDate || isDateInsideOrderRange(record, isoDate);
}
function resolveArrangementOrderIds(arrangement) {
    return [
        ...toArray(firstExisting(arrangement, ['odis'])),
        ...toArray(firstExisting(arrangement, ['ecodis'])),
    ].map((item) => String(item));
}
function isOrderInArrangement(order, orderIds) {
    const detailId = pickString(order, ['orderDetailId', 'odi', 'id']);
    const orderId = pickString(order, ['orderId', 'oi']);
    return Boolean((detailId && orderIds.has(detailId)) || (orderId && orderIds.has(orderId)));
}
function uniqueOrders(orders) {
    const seen = new Set();
    return orders.filter((order, index) => {
        const id = pickString(order, ['orderDetailId', 'odi', 'orderId', 'oi', 'id', 'orderNo']);
        const key = id || `index-${index}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
function isDateInsideOrderRange(order, isoDate) {
    const range = resolveOrderDateRange(order);
    if (!range)
        return false;
    return isoDate >= range.start && isoDate < range.end;
}
function resolveOrderDateRange(order) {
    const textRange = pickString(order, ['stayRange', 'dateRange', 'checkInOutDate']);
    const parsedRange = parseStayRangeText(textRange);
    const start = normalizeDate(firstExisting(order, ['checkInDate', 'cid', 'ecit', 'startAt', 'start_at', 'startDate', 'date', 'day', 'bizDate', 'roomDate', 'd'])) ??
        parsedRange?.start;
    const end = normalizeDate(firstExisting(order, ['checkOutDate', 'cod', 'ecot', 'endAt', 'end_at', 'endDate'])) ??
        parsedRange?.end;
    if (!start)
        return undefined;
    const normalizedEnd = end && end > start ? end : formatDateInShanghai(new Date(parseIsoDateValue(start).getTime() + 24 * 60 * 60 * 1000));
    return { start, end: normalizedEnd };
}
function parseStayRangeText(value) {
    if (!value)
        return undefined;
    const match = value.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*(?:-|~|至|到)\s*(?:(\d{4})[.\-/])?(\d{1,2})[.\-/](\d{1,2})/);
    if (!match)
        return undefined;
    const startYear = Number(match[1]);
    const startMonth = Number(match[2]);
    const startDay = Number(match[3]);
    const endMonth = Number(match[5]);
    const endDay = Number(match[6]);
    const endYear = match[4] ? Number(match[4]) : endMonth < startMonth ? startYear + 1 : startYear;
    if (![startYear, startMonth, startDay, endYear, endMonth, endDay].every(Number.isFinite))
        return undefined;
    return {
        start: formatIsoDateParts(startYear, startMonth, startDay),
        end: formatIsoDateParts(endYear, endMonth, endDay),
    };
}
function parseIsoDateValue(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
}
function formatIsoDateParts(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function findDatedRecord(records, categoryId, roomId, isoDate) {
    return findDatedRecords(records, categoryId, roomId, isoDate)[0];
}
function findDatedRecords(records, categoryId, roomId, isoDate) {
    return records.filter((record) => {
        const recordCategoryId = pickString(record, ['roomCategoryId', 'categoryId', 'rcId', 'rci']);
        const recordRoomId = pickString(record, ['roomId', 'roomInfoId', 'ri']);
        const recordDate = normalizeDate(firstExisting(record, ['date', 'day', 'bizDate', 'roomDate', 'startDate', 'd']));
        if (recordCategoryId && recordCategoryId !== categoryId)
            return false;
        if (roomId && recordRoomId && recordRoomId !== roomId)
            return false;
        return recordDate === isoDate;
    });
}
function firstExisting(value, keys) {
    if (!isRecord(value))
        return undefined;
    for (const key of keys) {
        if (value[key] !== undefined)
            return value[key];
    }
    return undefined;
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
function pickString(value, keys) {
    if (!isRecord(value))
        return undefined;
    for (const key of keys) {
        const candidate = value[key];
        if (typeof candidate === 'string' && candidate.trim())
            return candidate.trim();
        if (typeof candidate === 'number')
            return String(candidate);
    }
    return undefined;
}
function pickNumber(value, keys) {
    if (!isRecord(value))
        return undefined;
    for (const key of keys) {
        const candidate = value[key];
        if (typeof candidate === 'number' && Number.isFinite(candidate))
            return candidate;
        if (typeof candidate === 'string' && candidate.trim() && Number.isFinite(Number(candidate)))
            return Number(candidate);
    }
    return undefined;
}
function pickIndexedNumber(value, index) {
    if (!Array.isArray(value))
        return undefined;
    const candidate = value[index];
    if (typeof candidate === 'number' && Number.isFinite(candidate))
        return candidate;
    if (typeof candidate === 'string' && candidate.trim() && Number.isFinite(Number(candidate)))
        return Number(candidate);
    return undefined;
}
function pickMoney(value, yuanKeys, centKeys) {
    const yuanValue = pickNumber(value, yuanKeys);
    if (typeof yuanValue === 'number')
        return yuanValue;
    const centValue = pickNumber(value, centKeys);
    if (typeof centValue === 'number')
        return centValue / 100;
    return undefined;
}
function pickBooleanLike(value, keys) {
    if (!isRecord(value))
        return false;
    return keys.some((key) => Boolean(value[key]));
}
function toArray(value) {
    return Array.isArray(value) ? value : [];
}
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function normalizeDate(value) {
    if (!value)
        return undefined;
    if (typeof value === 'number' && Number.isFinite(value)) {
        return formatDateInShanghai(new Date(value));
    }
    if (value instanceof Date)
        return formatDateInShanghai(value);
    if (typeof value !== 'string')
        return undefined;
    return value.slice(0, 10).replace(/\./g, '-').replace(/\//g, '-');
}
function formatDateInShanghai(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
        .formatToParts(date)
        .reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
}
function formatStayRange(order) {
    const checkIn = normalizeDate(firstExisting(order, ['checkInDate', 'cid', 'ecit']));
    const checkOut = normalizeDate(firstExisting(order, ['checkOutDate', 'cod', 'ecot']));
    if (!checkIn || !checkOut)
        return undefined;
    return `${checkIn}-${checkOut.slice(5)}`;
}
function formatStayRangeForDisplay(order) {
    return formatHourlyStayRange(order) ?? pickString(order, ['stayRange', 'dateRange', 'checkInOutDate']) ?? formatStayRange(order);
}
function formatHourlyStayRange(order) {
    if (!isHourlyOrder(order))
        return undefined;
    const checkInDateTime = readDateTimeParts(firstExisting(order, ['startAt', 'start_at', 'checkInAt', 'checkInTime', 'checkInDateTime']));
    const checkOutDateTime = readDateTimeParts(firstExisting(order, ['endAt', 'end_at', 'checkOutAt', 'checkOutTime', 'checkOutDateTime']));
    const checkInDate = checkInDateTime?.date ?? normalizeDate(firstExisting(order, ['checkInDate', 'cid', 'ecit']));
    const checkInTime = checkInDateTime?.time ?? normalizeTime(firstExisting(order, ['startTime', 'start_time', 'checkInHour', 'checkInTimeText']));
    const checkOutTime = checkOutDateTime?.time ?? normalizeTime(firstExisting(order, ['endTime', 'end_time', 'checkOutHour', 'checkOutTimeText']));
    if (!checkInDate || !checkInTime || !checkOutTime)
        return undefined;
    return `${checkInDate} ${checkInTime}-${checkOutTime}`;
}
function isHourlyOrder(order) {
    const typeText = [
        pickString(order, ['orderType', 'order_type', 'stayType', 'roomType', 'saleType', 'productType', 'goodsTypeName']),
        pickString(order, ['orderTypeName', 'order_type_name', 'roomTypeName', 'productTypeName']),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    const goodsType = pickNumber(order, ['goodsType', 'goods_type']);
    const isHourFlag = pickBooleanLike(order, ['isHourRoomOrder', 'isHourlyOrder', 'hourRoomOrder', 'hourlyOrder']);
    return isHourFlag || goodsType === 7 || typeText.includes('hour') || typeText.includes('钟点') || typeText.includes('閽熺偣');
}
function readDateTimeParts(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return splitDateTime(formatDateTimeInShanghai(new Date(value)));
    }
    if (value instanceof Date)
        return splitDateTime(formatDateTimeInShanghai(value));
    if (typeof value !== 'string')
        return undefined;
    return splitDateTime(value);
}
function splitDateTime(value) {
    const match = value.trim().match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?/);
    if (!match)
        return undefined;
    return {
        date: formatIsoDateParts(Number(match[1]), Number(match[2]), Number(match[3])),
        time: match[4] && match[5] ? `${match[4].padStart(2, '0')}:${match[5]}` : undefined,
    };
}
function normalizeTime(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return `${String(value).padStart(2, '0')}:00`;
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,2})(?::(\d{1,2}))?/);
    if (!match)
        return undefined;
    const hour = Number(match[1]);
    const minute = match[2] === undefined ? 0 : Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59)
        return undefined;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
function formatDateTimeInShanghai(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    })
        .formatToParts(date)
        .reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
function formatMoney(value) {
    return `¥${Number.isInteger(value) ? value : Number(value.toFixed(2))}`;
}
function formatPlainMoney(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}
function inferLiveStatus(order) {
    const statusText = pickString(order, ['liveStatusText', 'statusText', 'statusDesc', 'orderStatusText', 'oss']);
    if (statusText)
        return statusText;
    const orderStateCode = pickNumber(order, ['orderState']);
    if (orderStateCode === 3)
        return '入住中';
    if (orderStateCode === 4)
        return '已退房';
    if (orderStateCode === 1 || orderStateCode === 2)
        return '待入住';
    const detailStateCode = pickNumber(order, ['orderDetailDisplayState', 'liveStatus', 'checkStatus', 'ls']);
    if (detailStateCode === 2)
        return '入住中';
    if (detailStateCode === 3 || detailStateCode === 4)
        return '已退房';
    if (detailStateCode === 1)
        return '待入住';
    const orderStatusCode = pickNumber(order, ['status', 'orderStatus']);
    if (orderStatusCode === 3)
        return '入住中';
    if (orderStatusCode === 4)
        return '已退房';
    if (orderStatusCode === 1 || orderStatusCode === 2)
        return '待入住';
    return undefined;
}
function normalizeMonthLiveStatus(value) {
    const normalized = value?.trim().toLowerCase() ?? '';
    if (normalized === 'checked_in' ||
        normalized === 'checked-in' ||
        normalized === 'living' ||
        normalized.includes('入住中') ||
        normalized.includes('进行中') ||
        normalized.includes('在住'))
        return '入住中';
    if (normalized === 'completed' ||
        normalized === 'checked_out' ||
        normalized === 'checked-out' ||
        normalized.includes('已退房') ||
        normalized.includes('已完成'))
        return '已退房';
    return '待入住';
}
function toneForMonthLiveStatus(liveStatus, duplicate) {
    if (duplicate)
        return 'booking-duplicate';
    if (liveStatus.includes('入住中'))
        return 'booking-live';
    if (liveStatus.includes('已退房'))
        return 'booking-checkout';
    return 'booking-pending';
}
function toneForChannel(channel) {
    if (!channel)
        return 'booking-blue';
    if (channel.includes('飞猪'))
        return 'booking-gold';
    if (channel.includes('美团') || channel.includes('路客云'))
        return 'booking-teal';
    return 'booking-blue';
}
