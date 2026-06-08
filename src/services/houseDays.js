import { fetchDayOrderCardsFromMonthSource } from './houseDaysShared';
const MOCK_ENDPOINT = '/houseManage/days/overview';
const REAL_ENDPOINT = '/api/roomStatuses/*';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
const TASK_ID = 'fangtai--fangtai-guanli--rifangtai';
const DIRECT_CHANNEL_LABELS = new Set(['直营渠道', '自来客']);
export async function fetchHouseDays(query, signal) {
    const providerMode = query.provider ?? resolveHouseDaysProviderMode();
    if (providerMode === 'real') {
        return fetchRealHouseDays(query, signal);
    }
    const envelope = await fetchMockHouseDays(query, signal);
    const data = unwrapEnvelope(envelope, 'mock provider');
    return {
        providerMode,
        responseState: query.mockState ?? 'success',
        endpoint: MOCK_ENDPOINT,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
        ...data,
    };
}
export function resolveHouseDaysQueryFromLocation(location) {
    const params = new URLSearchParams(location.search);
    const provider = params.get('houseDaysProvider');
    const mockState = params.get('houseDaysMockState');
    return {
        provider: provider === 'real' || provider === 'mock' ? provider : undefined,
        mockState: mockState === 'empty' || mockState === 'error' || mockState === 'success' ? mockState : undefined,
    };
}
function resolveHouseDaysProviderMode() {
    const configured = import.meta.env.VITE_PMS_HOUSE_DAYS_PROVIDER?.trim();
    return configured === 'real' ? 'real' : 'mock';
}
async function fetchMockHouseDays(query, signal) {
    await delay(80, signal);
    const responseState = query.mockState ?? 'success';
    if (responseState === 'error') {
        return {
            code: 5001,
            message: 'mock provider 返回业务失败：日房态接口模拟错误',
            data: createMockData(query, [], []),
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: MOCK_TIMESTAMP,
        };
    }
    const sharedRooms = responseState === 'empty' ? [] : await fetchDayOrderCardsFromMonthSource(query.keyword);
    const baseRooms = responseState === 'empty' ? [] : filterRooms(sharedRooms.map(adaptSharedCardToHouseDayRoom), query, false);
    const rooms = responseState === 'empty' ? [] : filterRooms(baseRooms, query, true);
    return {
        code: 0,
        message: 'success',
        data: createMockData(query, rooms, baseRooms),
        traceId: `mock-${TASK_ID}-${responseState}-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
async function fetchRealHouseDays(query, signal) {
    const campId = resolveRealHouseDaysCampId();
    throwIfAborted(signal);
    const sharedRooms = await fetchDayOrderCardsFromMonthSource(query.keyword, { campId, provider: 'real' });
    throwIfAborted(signal);
    const baseRooms = filterRooms(sharedRooms.map(adaptSharedCardToHouseDayRoom), query, false);
    const rooms = filterRooms(baseRooms, query, true);
    return {
        providerMode: 'real',
        responseState: 'success',
        endpoint: REAL_ENDPOINT,
        traceId: `real-${TASK_ID}-month-today-column`,
        timestamp: new Date().toISOString(),
        requestParams: {
            campId,
            ...buildRequestParams(query),
        },
        statusGroups: buildStatusGroups(baseRooms),
        rooms,
        viewModes: ['按房型', '按房间号', '按楼层'],
        storeOptions: buildStoreOptions(baseRooms),
        channelOptions: [
            { id: '', name: '渠道' },
            { id: 'direct', name: '直营渠道' },
            { id: 'ota', name: 'OTA' },
        ],
        roomTypeOptions: [
            { id: '', name: '房型' },
            ...Array.from(new Set(baseRooms.map((room) => room.roomType))).map((roomType) => ({
                id: roomType,
                name: roomType,
            })),
        ],
        tagOptions: [
            { id: '', name: '房型标签' },
            { id: 'remark', name: '备注' },
            { id: 'debt', name: '欠费' },
            { id: 'hourRoom', name: '钟点房' },
        ],
        routeTargets: {
            months: '/houseManage/months',
            price: '/houseManage/houseCale',
            storeSettings: '/InformationMaintenance/campInfo',
        },
        sourceNotes: [
            `real provider 复用月房态接口 ${REAL_ENDPOINT}`,
            '日房态直接展示月房态日历表今天日期列，前端只做字段适配和筛选。',
        ],
    };
}
function createMockData(query, rooms, statusGroupRooms) {
    return {
        requestParams: buildRequestParams(query),
        statusGroups: buildStatusGroups(statusGroupRooms),
        rooms,
        viewModes: ['按房型', '按房间号', '按楼层'],
        storeOptions: [
            { id: 'all', name: '全部门店' },
            { id: 'poi-1796067693589061634', name: '天落会宿公寓(前海壹方城宝安中心店)' },
        ],
        channelOptions: [
            { id: '', name: '渠道' },
            { id: 'direct', name: '直营渠道' },
            { id: 'ota', name: 'OTA' },
        ],
        roomTypeOptions: [
            { id: '', name: '房型' },
            ...Array.from(new Set(statusGroupRooms.map((room) => room.roomType))).map((roomType) => ({
                id: roomType,
                name: roomType,
            })),
        ],
        tagOptions: [
            { id: '', name: '房型标签' },
            { id: 'remark', name: '备注' },
        ],
        routeTargets: {
            months: '/houseManage/months',
            price: '/houseManage/houseCale',
            storeSettings: '/InformationMaintenance/campInfo',
        },
        sourceNotes: [
            'mock provider 使用统一响应包 code/message/data/traceId/timestamp。',
            '组件只消费适配后的 HouseDaysViewModel，后端就绪后集中切换 provider。',
            '页面正文只展示业务态反馈，provider、traceId 与后端接入状态仅写入开发文档和取证产物。',
        ],
    };
}
function buildRequestParams(query) {
    return {
        date: formatDateInShanghai(new Date()),
        storeId: query.storeId || 'all',
        keyword: query.keyword,
        viewMode: query.viewMode,
        statusFilters: query.statusFilters,
        channel: query.channel,
        roomType: query.roomType,
        tag: query.tag,
    };
}
function buildStoreOptions(rooms) {
    const stores = new Map();
    for (const room of rooms) {
        if (room.storeId && room.storeId !== 'all')
            stores.set(room.storeId, room.storeName || `门店 ${stores.size + 1}`);
    }
    return [{ id: 'all', name: '全部门店' }, ...Array.from(stores, ([id, name]) => ({ id, name }))];
}
function resolveRealHouseDaysCampId() {
    return (window.localStorage.getItem('pmsCampId')?.trim() ||
        window.localStorage.getItem('pms.currentCampId')?.trim() ||
        import.meta.env.VITE_PMS_CAMP_ID?.trim() ||
        '10001');
}
function adaptSharedCardToHouseDayRoom(card) {
    const booking = card.booking
        ? {
            guest: card.booking.cell.title,
            channel: card.booking.cell.subtitle ?? '-',
            price: card.booking.cell.amount ?? '-',
            tone: resolveDayBookingTone(card.booking.cell.tone),
            monthOrder: card.booking,
        }
        : undefined;
    return {
        id: card.id,
        storeId: card.storeId,
        storeName: card.storeName,
        roomType: card.roomType,
        roomName: card.roomName,
        status: card.status,
        hasTag: card.hasTag,
        filterLabels: card.filterLabels,
        bookings: booking ? [booking] : undefined,
        booking,
    };
}
function resolveDayBookingTone(tone) {
    if (tone === 'booking-duplicate')
        return 'duplicate';
    if (tone === 'booking-live')
        return 'live';
    if (tone === 'booking-checkout')
        return 'checkout';
    return 'pending';
}
function filterRooms(rooms, query, includeStatusFilters) {
    return rooms.filter((room) => {
        const bookings = getRoomBookings(room);
        const matchesStore = !query.storeId || query.storeId === 'all' || room.storeId === query.storeId;
        const keyword = query.keyword.trim();
        const matchesKeyword = !keyword ||
            room.roomType.includes(keyword) ||
            room.roomName.includes(keyword) ||
            bookings.some((booking) => [booking.guest, booking.channel, booking.monthOrder?.cell.phone, booking.monthOrder?.cell.remark, booking.monthOrder?.cell.orderId]
                .filter(Boolean)
                .some((value) => value?.includes(keyword)));
        const matchesChannel = !query.channel ||
            (query.channel === 'direct'
                ? bookings.some((booking) => DIRECT_CHANNEL_LABELS.has(booking.channel))
                : bookings.some((booking) => !DIRECT_CHANNEL_LABELS.has(booking.channel) && booking.channel !== '-'));
        const matchesRoomType = !query.roomType || room.roomType === query.roomType;
        const matchesTag = !query.tag || room.hasTag;
        const matchesStatus = !includeStatusFilters ||
            query.statusFilters.length === 0 ||
            query.statusFilters.some((filterLabel) => room.filterLabels?.includes(filterLabel));
        return matchesStore && matchesKeyword && matchesChannel && matchesRoomType && matchesTag && matchesStatus;
    });
}
function getRoomBookings(room) {
    if (room.bookings?.length)
        return room.bookings;
    return room.booking ? [room.booking] : [];
}
function buildStatusGroups(rooms, basic) {
    const countByLabel = (label) => rooms.filter((room) => room.filterLabels?.includes(label)).length;
    const countByTone = (tone) => rooms.filter((room) => getRoomBookings(room).some((booking) => booking.tone === tone)).length;
    const occupied = countByLabel('在住');
    const vacant = countByLabel('空净') + countByLabel('空脏');
    const remark = countByLabel('备注');
    const duplicate = countByTone('duplicate');
    const count = (key, fallback) => readNumber(basic?.[key], fallback);
    return [
        {
            title: '入离',
            items: [
                { label: '预抵', value: count('preComeNum', countByLabel('预抵')), color: '#5c8df6' },
                { label: '预离', value: count('preLeaveNum', countByLabel('预离')), color: '#ff9d2e' },
                { label: '在住', value: count('liveNum', occupied), color: '#48bf62' },
                { label: '重单', value: count('repeatOrderNum', duplicate), color: '#f95a54' },
            ],
        },
        {
            title: '房态',
            items: [
                { label: '空净', value: count('idleCleanNum', countByLabel('空净')) },
                { label: '空脏', value: count('idleDirtyNum', countByLabel('空脏')) },
                { label: '住净', value: count('liveCleanNum', countByLabel('住净')) },
                { label: '住脏', value: count('liveDirtyNum', countByLabel('住脏')) },
                { label: '关房', value: countByLabel('关房') },
            ],
        },
        {
            title: '保洁状态',
            items: [
                { label: '未开始', value: 0 },
                { label: '进行中', value: 0 },
                { label: '已完成', value: 0 },
                { label: '已过期', value: 0 },
            ],
        },
        {
            title: '其他标签',
            items: [
                { label: '钟点房', value: count('hourRoomOrderNum', countByLabel('钟点房')) },
                { label: '长租房', value: count('ltNum', countByLabel('长租房')) },
                { label: '欠费', value: count('debtNum', countByLabel('欠费')) },
                { label: '续住', value: count('extendStayNum', countByLabel('续住')) },
                { label: '备注', value: remark },
            ],
        },
    ];
}
function readNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function unwrapEnvelope(envelope, providerName) {
    if (envelope.code !== 0) {
        throw new Error(`${providerName} 返回业务失败：${envelope.message}`);
    }
    return envelope.data;
}
function delay(ms, signal) {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('日房态请求已取消', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('日房态请求已取消', 'AbortError'));
        }, { once: true });
    });
}
function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw new DOMException('日房态请求已取消', 'AbortError');
    }
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
const mockRooms = [
    {
        id: 'room-top-1',
        storeId: 'poi-1796067693589061634',
        storeName: '天落会宿公寓(前海壹方城宝安中心店)',
        roomType: '顶层套房（浴缸巨幕电竞麻将）',
        roomName: '房间1',
        status: 'cleanVacant',
        hasTag: true,
        filterLabels: ['绌哄噣', '澶囨敞'],
    },
    {
        id: 'room-president-1',
        storeId: 'poi-1796067693589061634',
        storeName: '天落会宿公寓(前海壹方城宝安中心店)',
        roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
        roomName: '房间1',
        status: 'cleanVacant',
        hasTag: true,
        filterLabels: ['绌哄噣', '澶囨敞'],
    },
    {
        id: 'room-sky-1',
        storeId: 'poi-1796067693589061634',
        storeName: '天落会宿公寓(前海壹方城宝安中心店)',
        roomType: '天落大床电竞套间',
        roomName: '1',
        status: 'occupiedClean',
        filterLabels: ['棰勬姷', '浣忓噣'],
        booking: {
            guest: '张祯',
            channel: '携程',
            price: '¥136.62',
            tone: 'live',
        },
    },
    {
        id: 'room-movie-1',
        storeId: 'poi-1796067693589061634',
        storeName: '天落会宿公寓(前海壹方城宝安中心店)',
        roomType: '观影大床房',
        roomName: '房间1',
        status: 'occupiedDirty',
        hasTag: true,
        filterLabels: ['鍦ㄤ綇', '棰勭', '浣忚剰', '澶囨敞'],
        booking: {
            guest: '胡志深',
            channel: '美团酒店',
            price: '¥112.9',
            tone: 'live',
        },
    },
];
mockRooms[0].filterLabels = ['\u7a7a\u51c0', '\u5907\u6ce8'];
mockRooms[1].filterLabels = ['\u7a7a\u51c0', '\u5907\u6ce8'];
mockRooms[2].filterLabels = ['\u9884\u62b5', '\u4f4f\u51c0'];
mockRooms[3].filterLabels = ['\u5728\u4f4f', '\u9884\u79bb', '\u4f4f\u810f', '\u5907\u6ce8'];
