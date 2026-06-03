export const otherPriceMockSourceLabel = '统一响应包 mock provider';
export const otherPriceRealBaseUrl = '/api';
const feeEndpoint = '/roomCategoryPricings/get';
const rulesEndpoint = '/roomCategoryRules/get';
const defaultFeeColumns = ['押金', '可加客人数', '加人费(每人)', '餐食数量', '佣金率(%)'];
const defaultActivityColumns = [
    '连住2天以上',
    '连住3天以上',
    '连住4天以上',
    '连住5天以上',
    '连住7天以上',
    '连住30天以上',
    '连住35天以上',
    '甩卖第一阶段',
    '甩卖第二阶段',
];
const mockChannels = [
    { id: '4', name: '携程' },
    { id: '2', name: '途家' },
    { id: '5', name: '美团酒店' },
];
const mockRooms = [
    { id: 'room-mock-a', name: '顶层套房（浴缸巨幕电竞麻将）' },
];
const mockFeeRows = [
    {
        roomCategoryId: 'room-mock-a',
        roomType: '顶层套房（浴缸巨幕电竞麻将）',
        channels: [
            ['途家', '设置', '设置', '设置', '设置', '设置'],
            ['途家', '设置', '设置', '设置', '设置', '设置'],
            ['小猪', '设置', '设置', '设置', '设置', '设置'],
            ['小猪', '设置', '设置', '设置', '设置', '设置'],
            ['携程', '设置', '设置', '设置', '设置', '12'],
            ['美团酒店', '设置', '设置', '设置', '设置', '15'],
            ['飞猪淘酒店', '设置', '设置', '设置', '设置', '设置'],
            ['路客云聚合', '设置', '设置', '设置', '设置', '设置'],
            ['路客云聚合', '设置', '设置', '设置', '设置', '设置'],
            ['木鸟', '设置', '设置', '设置', '设置', '设置'],
        ],
    },
];
const mockActivityRows = [
    {
        roomCategoryId: 'room-mock-a',
        roomType: '顶层套房（浴缸巨幕电竞麻将）',
        channels: [
            ['携程', '9.5折', '原价', '原价', '原价', '原价', '原价', '原价', '设置', '设置'],
            ['途家', '原价', '原价', '原价', '原价', '原价', '原价', '原价', '暂不支持', '暂不支持'],
        ],
    },
];
export async function loadOtherPriceData(query = {}, signal) {
    if (resolveOtherPriceProviderName() === 'real') {
        return loadRealOtherPriceData(query, signal);
    }
    await waitForMockLatency(signal);
    const response = buildMockOtherPriceEnvelope(query);
    if (response.code !== 0) {
        throw new Error(`${response.message}（traceId: ${response.traceId}）`);
    }
    return adaptOtherPriceEnvelope(response, query, 'mock');
}
export function getOtherPriceSourceLabel() {
    return resolveOtherPriceProviderName() === 'mock' ? otherPriceMockSourceLabel : otherPriceRealBaseUrl;
}
function resolveOtherPriceProviderName() {
    const configured = readRuntimeConfig('pms.otherPriceProvider') || import.meta.env.VITE_OTHER_PRICE_PROVIDER;
    return configured === 'real' ? 'real' : 'mock';
}
function resolveOtherPriceMockMode() {
    const configured = readRuntimeConfig('pms.otherPriceMockMode') || import.meta.env.VITE_OTHER_PRICE_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
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
function buildMockOtherPriceEnvelope(query) {
    const mode = resolveOtherPriceMockMode();
    if (mode === 'error') {
        return {
            code: 50009,
            message: 'mock 其他价格接口模拟失败',
            data: null,
            traceId: 'mock-fangtai--fangjia-guanli--qita-jiage-error-001',
            timestamp: '2026-05-18T10:00:00+08:00',
        };
    }
    const feeRows = mode === 'empty' ? [] : filterGroups(mockFeeRows, query);
    const activityRows = mode === 'empty' ? [] : filterGroups(mockActivityRows, query);
    return {
        code: 0,
        message: mode === 'empty' ? 'mock 空态' : 'success',
        data: {
            camp: {
                campId: 'mock-camp-other-price',
                campName: '路客云6TS5的店铺',
            },
            channels: mockChannels,
            rooms: mockRooms,
            fee: {
                columns: defaultFeeColumns,
                list: feeRows,
                pagination: {
                    page: 1,
                    pageSize: 20,
                    total: feeRows.reduce((sum, group) => sum + group.channels.length, 0),
                },
            },
            activity: {
                columns: defaultActivityColumns,
                list: activityRows,
                pagination: {
                    page: 1,
                    pageSize: 20,
                    total: activityRows.reduce((sum, group) => sum + group.channels.length, 0),
                },
            },
        },
        traceId: mode === 'empty' ? 'mock-fangtai--fangjia-guanli--qita-jiage-empty-001' : 'mock-fangtai--fangjia-guanli--qita-jiage-list-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function adaptOtherPriceEnvelope(response, query, provider) {
    if (response.code !== 0 || !response.data) {
        throw new Error(`${response.message}（traceId: ${response.traceId}）`);
    }
    return {
        campId: response.data.camp.campId,
        campName: response.data.camp.campName,
        provider,
        sourceLabel: provider === 'mock' ? otherPriceMockSourceLabel : otherPriceRealBaseUrl,
        channels: response.data.channels,
        rooms: response.data.rooms,
        feeColumns: response.data.fee.columns,
        feeRows: response.data.fee.list,
        activityColumns: response.data.activity.columns,
        activityRows: response.data.activity.list,
        endpoints: provider === 'mock'
            ? ['GET /api/houseManage/otherPrice/overview (mock)', 'GET /api/houseManage/otherPrice/activity (mock)']
            : [
                'POST /camps/get',
                'POST /select/calChannel4RoomCategory/get',
                'POST /roomCategories/page/get',
                `POST ${feeEndpoint}`,
                `POST ${rulesEndpoint} discountType=1`,
                `POST ${rulesEndpoint} discountType=2`,
            ],
        requestSummary: buildRequestSummary(query, response.traceId),
        requestedAt: response.timestamp,
    };
}
async function loadRealOtherPriceData(query = {}, signal) {
    const campInfo = readCampId(await postHudson('/camps/get', {}, signal));
    const campId = campInfo.campId;
    const roomCategoryIds = query.roomCategoryId ? [query.roomCategoryId] : [];
    const channelIds = query.channelId ? [query.channelId] : [];
    const [channelsData, roomsData, feeData, longStayRules, flashSaleRules] = await Promise.all([
        postHudson('/select/calChannel4RoomCategory/get', { campId }, signal),
        postHudson('/roomCategories/page/get', {
            campId,
            pageSize: 999,
            pageNum: 1,
            roomCategoryName: '',
            keyword: '',
            cityIds: [],
            channelId: '',
        }, signal),
        postHudson(feeEndpoint, { campId, roomCategoryIds, channelIds }, signal),
        postHudson(rulesEndpoint, { campId, discountType: 1 }, signal),
        postHudson(rulesEndpoint, { campId, discountType: 2 }, signal),
    ]);
    const feeColumns = readColumns(feeData, defaultFeeColumns);
    const longStayColumns = readColumns(longStayRules, defaultActivityColumns.slice(0, 7));
    const flashSaleColumns = readColumns(flashSaleRules, defaultActivityColumns.slice(7));
    const activityColumns = [...longStayColumns, ...flashSaleColumns];
    const feeRows = adaptTableRows(feeData, feeColumns, formatFeeCell);
    const activityRows = mergeActivityRows(adaptTableRows(longStayRules, longStayColumns, formatActivityCell), adaptTableRows(flashSaleRules, flashSaleColumns, formatActivityCell), longStayColumns.length);
    return {
        campId,
        campName: campInfo.campName,
        provider: 'real',
        sourceLabel: otherPriceRealBaseUrl,
        channels: adaptOptions(channelsData, 'channel'),
        rooms: adaptOptions(roomsData, 'room'),
        feeColumns,
        feeRows,
        activityColumns,
        activityRows,
        endpoints: [
            'POST /camps/get',
            'POST /select/calChannel4RoomCategory/get',
            'POST /roomCategories/page/get',
            `POST ${feeEndpoint}`,
            `POST ${rulesEndpoint} discountType=1`,
            `POST ${rulesEndpoint} discountType=2`,
        ],
        requestSummary: buildRequestSummary(query, 'real-hudson-request'),
        requestedAt: new Date().toISOString(),
    };
}
async function postHudson(endpoint, body, signal) {
    const response = await fetch(`${otherPriceRealBaseUrl}${endpoint}`, {
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
function filterGroups(rows, query) {
    return rows
        .filter((group) => !query.roomCategoryId || group.roomCategoryId === query.roomCategoryId)
        .map((group) => ({
        ...group,
        channels: group.channels.filter((row) => !query.channelId || mockChannels.find((channel) => channel.id === query.channelId)?.name === row[0]),
    }))
        .filter((group) => group.channels.length > 0);
}
function buildRequestSummary(query, traceId) {
    return [
        `traceId=${traceId}`,
        `channelId=${query.channelId ?? '全部平台'}`,
        `roomCategoryId=${query.roomCategoryId ?? '全部房型'}`,
    ];
}
function readCampId(campsData) {
    const camps = asRecord(campsData).camps?.map(asRecord) ?? [];
    const camp = camps.find((item) => item.campId);
    if (!camp?.campId)
        throw new Error('/camps/get 未返回可用 campId');
    return { campId: String(camp.campId), campName: String(camp.name ?? '当前门店') };
}
function adaptOptions(data, kind) {
    const record = asRecord(data);
    const source = Array.isArray(record.select) ? record.select : Array.isArray(record.list) ? record.list : [];
    return source.map(asRecord).map((item, index) => {
        if (kind === 'channel') {
            return {
                id: String(item.value ?? item.channelId ?? item.id ?? index),
                name: String(item.label ?? item.channelName ?? item.name ?? `渠道 ${index + 1}`),
            };
        }
        return {
            id: String(item.roomCategoryId ?? item.id ?? index),
            name: String(item.roomCategoryName ?? item.name ?? `房型 ${index + 1}`),
        };
    });
}
function readColumns(data, fallback) {
    const head = asArray(asRecord(data).head).map(asRecord);
    const columns = head.map((item) => String(item.tn ?? item.cellName ?? '')).filter(Boolean);
    return columns.length > 0 ? columns : fallback;
}
function adaptTableRows(data, columns, formatter) {
    const rows = asArray(asRecord(data).body).map(asRecord);
    const grouped = new Map();
    for (const row of rows) {
        const roomCategoryId = String(row.rcpi ?? row.roomCategoryId ?? row.rci ?? '');
        const roomType = String(row.rcn ?? row.roomCategoryName ?? '未命名房型');
        const channel = String(row.cn ?? row.channelName ?? '未知渠道');
        const cells = asArray(row.cells).map(asRecord);
        const values = columns.map((column) => formatter(cells.find((cell) => cell.cellName === column || cell.key === column) ?? null, column));
        const groupKey = roomCategoryId || roomType;
        const group = grouped.get(groupKey) ?? { roomCategoryId, roomType, channels: [] };
        group.channels.push([channel, ...values]);
        grouped.set(groupKey, group);
    }
    return Array.from(grouped.values());
}
function mergeActivityRows(longStayRows, flashSaleRows, longStayColumnCount) {
    const merged = new Map();
    for (const row of longStayRows) {
        merged.set(row.roomCategoryId || row.roomType, {
            ...row,
            channels: row.channels.map((channel) => [...channel, '暂不支持', '暂不支持']),
        });
    }
    for (const row of flashSaleRows) {
        const key = row.roomCategoryId || row.roomType;
        const existing = merged.get(key);
        if (!existing) {
            merged.set(key, {
                ...row,
                channels: row.channels.map((channel) => [channel[0], ...Array.from({ length: longStayColumnCount }, () => '暂不支持'), ...channel.slice(1)]),
            });
            continue;
        }
        for (const flashChannel of row.channels) {
            const matched = existing.channels.find((channel) => channel[0] === flashChannel[0]);
            if (matched) {
                matched.splice(1 + longStayColumnCount, flashChannel.length - 1, ...flashChannel.slice(1));
            }
            else {
                existing.channels.push([flashChannel[0], ...Array.from({ length: longStayColumnCount }, () => '暂不支持'), ...flashChannel.slice(1)]);
            }
        }
    }
    return Array.from(merged.values());
}
function formatFeeCell(cell) {
    if (!cell)
        return '设置';
    const value = cell.value;
    if (value === null || value === undefined || value === '' || value === 0)
        return '设置';
    return String(value);
}
function formatActivityCell(cell) {
    if (!cell)
        return '暂不支持';
    const value = cell.value;
    if (value === null || value === undefined || value === '')
        return '原价';
    const valueText = String(value);
    const flashSale = valueText.match(/^(\d+)-(\d+)$/);
    if (flashSale)
        return `${flashSale[1]}:00开始 ${Number(flashSale[2]) / 10}折`;
    const numeric = Number(valueText);
    if (Number.isFinite(numeric) && numeric > 0 && numeric < 100)
        return `${numeric / 10}折`;
    return valueText;
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
