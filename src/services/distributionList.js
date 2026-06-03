const fixedTimestamp = '2026-05-21T10:00:00+08:00';
export const distributionListEndpoints = {
    campFlow: '/api/campFlow/get',
    roomCategories: '/api/roomCategories/page/get',
    undistributedRoomCategories: '/api/select/roomCategory/page/get',
    importedRoomCategories: '/api/weiRoomCategories/page/get',
    stores: '/api/select/poi/page/get',
};
const stores = [
    { id: 'ALL', label: '全部门店' },
    { id: 'store-1', label: '天落会宿公寓(前海壹方城宝安中心店)' },
    { id: 'store-2', label: '天落会宿公寓(科技园店)' },
];
const channels = [
    { id: 'lk', name: '路客云聚合', shortName: '路', color: '#4d65f6' },
    { id: 'xc', name: '携程民宿', shortName: '携', color: '#ff7a45' },
    { id: 'tj', name: '途家', shortName: '途', color: '#00b578' },
    { id: 'xz', name: '小猪', shortName: '猪', color: '#ff4d6d' },
    { id: 'mz', name: '美团民宿', shortName: '美', color: '#ffb400' },
    { id: 'db', name: '订单宝', shortName: '订', color: '#722ed1' },
    { id: 'dy', name: '抖音', shortName: '抖', color: '#111827' },
    { id: 'fliggy', name: '飞猪', shortName: '飞', color: '#13c2c2' },
    { id: 'qunar', name: '去哪儿', shortName: '哪', color: '#1677ff' },
    { id: 'ks', name: '快手', shortName: '快', color: '#f5222d' },
    { id: 'wx', name: '微信小店', shortName: '微', color: '#52c41a' },
    { id: 'wb', name: '微博', shortName: '博', color: '#eb2f96' },
    { id: 'red', name: '小红书', shortName: '红', color: '#fa541c' },
];
const distributedRooms = [
    createRoom('room-1', '顶层套房(浴缸巨幕电竞麻将)', 'store-1', 'distributing', ['lk', 'xc', 'tj', 'xz', 'mz', 'db']),
    createRoom('room-2', '总统套间(桑拿浴缸露台电竞麻将)', 'store-1', 'distributing', ['lk', 'xc', 'tj', 'xz', 'dy']),
    createRoom('room-3', '天落大床电竞套间', 'store-2', 'distributing', ['lk', 'fliggy', 'qunar', 'wx']),
    createRoom('room-4', '观影大床房', 'store-1', 'closed', ['lk', 'xc', 'tj']),
];
const undistributedRooms = [
    createRoom('room-5', '复式观景双床房', 'store-1', 'distributing', ['lk', 'xc']),
    createRoom('room-6', '城市景观大床房', 'store-2', 'closed', ['lk']),
];
export function createDefaultDistributionFilters(searchParams = new URLSearchParams()) {
    return {
        campId: '1796067693589061634',
        buyCampId: '1796067693589061634',
        poiId: searchParams.get('poiId') || 'ALL',
        keyword: searchParams.get('keyword') || '',
        tab: searchParams.get('tab') === 'undistributed' ? 'undistributed' : 'distributed',
        page: Number(searchParams.get('page') || 1),
        pageSize: Number(searchParams.get('pageSize') || 20),
        scenario: toScenario(searchParams.get('state')),
    };
}
export async function fetchDistributionDashboard(filters, provider = getDistributionProvider()) {
    validateFilters(filters);
    if (provider === 'api') {
        throw new Error('分销列表加载失败，请稍后重试');
    }
    const envelope = await fetchMockDistributionDashboard(filters);
    return adaptDistributionDashboard(envelope, filters, provider);
}
export function buildDistributionRequests(filters) {
    const poiId = filters.poiId === 'ALL' ? '' : filters.poiId;
    return {
        campFlow: { campId: filters.campId },
        roomCategories: {
            campId: filters.campId,
            pageSize: 999,
            pageNum: 1,
            roomCategoryName: filters.keyword,
            keyword: filters.keyword,
            cityIds: [],
            channelId: '',
        },
        undistributedRoomCategories: {
            campId: filters.campId,
            pageNum: filters.page,
            pageSize: filters.pageSize,
            current: filters.page,
            poiId,
            filterSyncChannelId: 17,
            isAvailability: 1,
            channelId: 0,
            isFilterAlreadyFlow: 1,
        },
        importedRoomCategories: {
            campId: '64',
            buyCampId: filters.buyCampId,
            roomCategoryTypes: [1],
            goodsTypes: [7],
        },
        stores: {
            campId: filters.campId,
            pageSize: 999,
            pageNum: 1,
            channelId: 0,
            isAvailability: '1',
        },
    };
}
function getDistributionProvider() {
    if (typeof window === 'undefined')
        return 'mock';
    return normalizeProviderValue(window.localStorage.getItem('pms.distributionListProvider')) === 'api' ? 'api' : 'mock';
}
async function fetchMockDistributionDashboard(filters) {
    await delay(120);
    if (filters.scenario === 'error') {
        return {
            code: 50001,
            message: '分销列表加载失败，请稍后重试',
            data: createPayload(filters, true),
            traceId: 'mock-distribution-list-error-001',
            timestamp: fixedTimestamp,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: createPayload(filters, filters.scenario === 'empty'),
        traceId: `mock-distribution-list-${filters.scenario}-001`,
        timestamp: fixedTimestamp,
    };
}
function createPayload(filters, empty) {
    const filteredDistributed = empty ? [] : filterRooms(distributedRooms, filters);
    const filteredUndistributed = empty ? [] : filterRooms(undistributedRooms, filters);
    return {
        stores,
        channels,
        distributedRooms: filteredDistributed,
        undistributedRooms: filteredUndistributed,
        pagination: {
            page: filters.page,
            pageSize: filters.pageSize,
            total: filters.tab === 'distributed' ? filteredDistributed.length : filteredUndistributed.length,
        },
        updatedAt: fixedTimestamp,
    };
}
function adaptDistributionDashboard(envelope, filters, provider) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '分销列表加载失败，请稍后重试');
    }
    return {
        ...envelope.data,
        provider,
        filters,
        request: buildDistributionRequests(filters),
        traceId: envelope.traceId,
    };
}
function filterRooms(rooms, filters) {
    return rooms.filter((room) => {
        const keywordMatched = !filters.keyword || room.name.includes(filters.keyword);
        const storeMatched = filters.poiId === 'ALL' || room.storeId === filters.poiId;
        return keywordMatched && storeMatched;
    });
}
function createRoom(id, name, storeId, progress, channelIds) {
    const storeName = stores.find((store) => store.id === storeId)?.label ?? stores[1].label;
    return {
        id,
        name,
        storeId,
        storeName,
        progress,
        channelIds,
        thumbnail: createRoomThumbnail(name),
    };
}
function createRoomThumbnail(name) {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="144" height="84" viewBox="0 0 144 84">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#dbeafe" />
          <stop offset="100%" stop-color="#bfdbfe" />
        </linearGradient>
      </defs>
      <rect width="144" height="84" rx="12" fill="url(#g)" />
      <rect x="10" y="12" width="60" height="42" rx="8" fill="#ffffff" opacity="0.72" />
      <rect x="77" y="20" width="54" height="8" rx="4" fill="#ffffff" opacity="0.92" />
      <rect x="77" y="36" width="40" height="8" rx="4" fill="#ffffff" opacity="0.7" />
      <rect x="10" y="62" width="124" height="10" rx="5" fill="#eff6ff" opacity="0.96" />
      <text x="12" y="76" fill="#1e3a8a" font-size="10" font-family="Arial, sans-serif">${escapeXml(name.slice(0, 10))}</text>
    </svg>
  `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
function escapeXml(value) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
function validateFilters(filters) {
    if (!Number.isFinite(filters.page) || filters.page < 1)
        throw new Error('分页参数不正确');
    if (!Number.isFinite(filters.pageSize) || filters.pageSize < 1)
        throw new Error('分页参数不正确');
}
function toScenario(value) {
    if (value === 'empty' || value === 'error')
        return value;
    return 'success';
}
function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function normalizeProviderValue(value) {
    return value === 'api' || value === 'real' ? 'api' : value === 'mock' ? 'mock' : undefined;
}
