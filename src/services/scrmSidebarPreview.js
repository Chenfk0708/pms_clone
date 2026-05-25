export const scrmSidebarDashboardEndpoint = 'https://hudson-prod.localhome.cn/scrm/sidebarPreview/dashboard';
export const scrmSidebarExportEndpoint = 'https://hudson-prod.localhome.cn/scrm/sidebarPreview/export';
export const scrmSidebarProviderMode = 'mock';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
const stores = [
    { id: 'ALL', label: '全部门店' },
    { id: 'qianhai', label: '天落会宿公寓(前海壹方城宝安中心店)' },
];
const channels = [
    { id: 'ALL', label: '全部渠道' },
    { id: 'tujia', label: '途家' },
    { id: 'ctrip', label: '携程民宿' },
    { id: 'meituan', label: '美团民宿' },
    { id: 'xiaozhu', label: '小猪' },
];
const conversations = [
    {
        id: 'conv-001',
        guestName: '携程民宿-【M335275070】',
        channel: 'ctrip',
        roomName: '顶层套房（浴缸巨幕电竞麻将）',
        status: '咨询中',
        lastMessage: '房: 已加绿色号，稍后发送入住指引',
        lastSender: '前台小李',
        lastMessageAt: '2026-05-18 10:24',
        responseSla: '1 分钟内',
        orderNo: 'HO202605180301',
        stayRange: '05.18-05.20（2晚）',
        tags: ['复购客', '偏好高楼层', '可引导续住'],
        preference: '偏好电竞设备和浴缸，曾购买周末延住券',
        orderAmount: '664.00',
    },
    {
        id: 'conv-002',
        guestName: '去哪民宿-【去哪儿用户】',
        channel: 'tujia',
        roomName: '总裁套间（桑拿浴缸露台电竞麻将）',
        status: '待回复',
        lastMessage: '客: 今天还有同房型可以续住吗？',
        lastSender: '客人',
        lastMessageAt: '2026-05-18 10:17',
        responseSla: '超时 3 分钟',
        orderNo: 'HO202605180417',
        stayRange: '05.18-05.19（1晚）',
        tags: ['续住意向', '高价值订单'],
        preference: '关注退房时间和停车便利',
        orderAmount: '468.00',
    },
    {
        id: 'conv-003',
        guestName: '美团民宿-【Ludwig】',
        channel: 'meituan',
        roomName: '天落大床电竞套间',
        status: '已转订单',
        lastMessage: '房: 请问有什么可以帮到您',
        lastSender: '前台小王',
        lastMessageAt: '2026-05-18 09:58',
        responseSla: '已响应',
        orderNo: 'HO202605180512',
        stayRange: '05.18-05.21（3晚）',
        tags: ['新客', '已发优惠券'],
        preference: '首次咨询，已发送品牌小程序券包',
        orderAmount: '912.00',
    },
];
const replyTemplates = [
    {
        id: 'reply-renew',
        title: '续住引导',
        content: '今天同房型仍有可售库存，可为您保留当前房间并同步续住价格。',
    },
    {
        id: 'reply-checkin',
        title: '入住指引',
        content: '订单确认后会发送门锁密码、停车位置和房间设施说明，请留意平台消息。',
    },
    {
        id: 'reply-coupon',
        title: '复购优惠',
        content: '已为您发送品牌小程序优惠券，下次预订可直接抵扣房费。',
    },
];
const roomSuggestions = [
    { id: 'room-president', roomName: '总裁套间', status: '今晚可售', availableTonight: 2, action: '查看房态' },
    { id: 'room-top', roomName: '顶层套房', status: '仅剩 1 间', availableTonight: 1, action: '锁定房源' },
    { id: 'room-sky', roomName: '天落大床电竞套间', status: '可升级', availableTonight: 3, action: '推荐升级' },
];
const pendingItems = [
    { id: 'pending-001', title: '跟进续住咨询', owner: '前台小李', dueTime: '10:40', priority: 'high' },
    { id: 'pending-002', title: '发送入住指引', owner: '前台小王', dueTime: '11:00', priority: 'normal' },
    { id: 'pending-003', title: '确认优惠券领取', owner: '运营小周', dueTime: '14:30', priority: 'normal' },
];
const trend = [
    { label: '09:00', sessions: 18, orders: 3 },
    { label: '10:00', sessions: 27, orders: 5 },
    { label: '11:00', sessions: 21, orders: 4 },
    { label: '12:00', sessions: 16, orders: 2 },
];
export function createScrmSidebarRequestBody(filters) {
    return {
        campId: filters.campId,
        poiId: filters.poiId === 'ALL' ? '' : filters.poiId,
        statDate: filters.date,
        channel: filters.channel === 'ALL' ? '' : filters.channel,
        keyword: filters.keyword.trim(),
        page: filters.page,
        pageSize: filters.pageSize,
    };
}
export async function fetchScrmSidebarDashboard(filters) {
    return getScrmSidebarProvider(scrmSidebarProviderMode).fetchDashboard(filters);
}
function getScrmSidebarProvider(mode) {
    if (mode === 'api')
        return apiScrmSidebarProvider;
    return mockScrmSidebarProvider;
}
const mockScrmSidebarProvider = {
    async fetchDashboard(filters) {
        await delay(120);
        if (filters.scenario === 'error') {
            throw new Error('聊天工具栏数据加载失败，请稍后重试');
        }
        const requestBody = createScrmSidebarRequestBody(filters);
        const list = filters.scenario === 'empty' ? [] : filterConversations(filters);
        const envelope = createEnvelope('dashboard', {
            stores,
            channels,
            metrics: createMetrics(list),
            conversations: list,
            pendingItems: filters.scenario === 'empty' ? [] : pendingItems,
            replyTemplates,
            roomSuggestions,
            trend,
            pagination: {
                page: filters.page,
                pageSize: filters.pageSize,
                total: list.length,
            },
        });
        return adaptScrmSidebarDashboard(envelope, requestBody);
    },
};
const apiScrmSidebarProvider = {
    async fetchDashboard(filters) {
        const requestBody = createScrmSidebarRequestBody(filters);
        const response = await fetch(scrmSidebarDashboardEndpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        const envelope = (await readJson(response));
        if (!response.ok) {
            throw new Error(`${scrmSidebarDashboardEndpoint} 返回 HTTP ${response.status}`);
        }
        return adaptScrmSidebarDashboard(assertEnvelope(envelope), requestBody, 'api');
    },
};
function filterConversations(filters) {
    const keyword = filters.keyword.trim();
    return conversations.filter((item) => {
        if (filters.channel !== 'ALL' && item.channel !== filters.channel)
            return false;
        if (!keyword)
            return true;
        return [item.guestName, item.roomName, item.lastMessage, item.orderNo, item.preference].some((value) => value.includes(keyword));
    });
}
function createMetrics(list) {
    const waiting = list.filter((item) => item.status === '待回复').length;
    const converted = list.filter((item) => item.status === '已转订单').length;
    return [
        { id: 'sessions', label: '今日会话', value: String(list.length), change: '+12%', tone: 'blue', detail: '较昨日同时段提升' },
        { id: 'waiting', label: '待回复', value: String(waiting), change: waiting > 0 ? '需处理' : '已清空', tone: waiting > 0 ? 'red' : 'green', detail: '按响应 SLA 排序' },
        { id: 'orders', label: '转化订单', value: String(converted), change: '订单联动', tone: 'green', detail: '可跳转住宿订单核对' },
        { id: 'response', label: '平均响应', value: '2分18秒', change: '达标', tone: 'orange', detail: '统计在线客服首响' },
    ];
}
function createEnvelope(traceId, data) {
    return {
        code: 0,
        message: 'success',
        data,
        traceId: `mock-scrm--kehu-goutong--liaotian-gongjulan-${traceId}-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
function adaptScrmSidebarDashboard(envelope, requestBody, providerMode = scrmSidebarProviderMode) {
    const payload = assertEnvelope(envelope);
    const data = payload.data;
    return {
        providerMode,
        endpoint: scrmSidebarDashboardEndpoint,
        requestBody,
        stores: normalizeOptions(data.stores),
        channels: normalizeOptions(data.channels),
        metrics: Array.isArray(data.metrics) ? data.metrics : [],
        conversations: Array.isArray(data.conversations) ? data.conversations.map(adaptConversation) : [],
        pendingItems: Array.isArray(data.pendingItems) ? data.pendingItems : [],
        replyTemplates: Array.isArray(data.replyTemplates) ? data.replyTemplates : [],
        roomSuggestions: Array.isArray(data.roomSuggestions) ? data.roomSuggestions : [],
        trend: Array.isArray(data.trend) ? data.trend : [],
        pagination: {
            page: toNumber(data.pagination?.page, 1),
            pageSize: toNumber(data.pagination?.pageSize, 20),
            total: toNumber(data.pagination?.total, 0),
        },
        traceId: payload.traceId,
        updatedAt: payload.timestamp,
    };
}
function adaptConversation(item, index) {
    return {
        id: String(item.id ?? `conversation-${index}`),
        guestName: String(item.guestName ?? '-'),
        channel: String(item.channel ?? ''),
        roomName: String(item.roomName ?? '-'),
        status: String(item.status ?? '-'),
        lastMessage: String(item.lastMessage ?? ''),
        lastSender: String(item.lastSender ?? '-'),
        lastMessageAt: String(item.lastMessageAt ?? '-'),
        responseSla: String(item.responseSla ?? '-'),
        orderNo: String(item.orderNo ?? '-'),
        stayRange: String(item.stayRange ?? '-'),
        tags: Array.isArray(item.tags) ? item.tags : [],
        preference: String(item.preference ?? '-'),
        orderAmount: String(item.orderAmount ?? '0.00'),
    };
}
function assertEnvelope(envelope) {
    if (!envelope || typeof envelope !== 'object') {
        throw new Error('聊天工具栏响应不是 JSON 对象');
    }
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '聊天工具栏响应返回失败');
    }
    if (envelope.data === undefined || envelope.data === null) {
        throw new Error('聊天工具栏响应缺少 data 字段');
    }
    return envelope;
}
async function readJson(response) {
    try {
        return await response.json();
    }
    catch {
        return null;
    }
}
function normalizeOptions(options) {
    if (!Array.isArray(options))
        return [];
    return options.map((option, index) => {
        const record = asRecord(option);
        return {
            id: String(record.id ?? `option-${index}`),
            label: String(record.label ?? record.name ?? `选项 ${index + 1}`),
        };
    });
}
function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function delay(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}
