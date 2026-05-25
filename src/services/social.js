export class SocialRequestError extends Error {
    constructor(message = '社媒数据加载失败') {
        super(message);
        this.name = 'SocialRequestError';
    }
}
export const socialOverviewEndpoint = 'https://hudson-prod.localhome.cn/channels/social/overview';
export const socialMockSourceLabel = '统一响应包 mock provider';
export const defaultSocialFilters = {
    date: '2026-05-18',
    campId: 'all',
    projectId: 'all',
    status: 'all',
    keyword: '',
};
export async function fetchSocialOverview(filters, signal) {
    const requestBody = createSocialRequestBody(filters);
    if (resolveSocialProviderName(filters.provider) === 'mock') {
        return fetchMockSocialOverview(filters, requestBody);
    }
    const response = await fetch(socialOverviewEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
        signal,
    });
    const payload = await readJson(response);
    if (!response.ok || isFailedResponse(payload)) {
        throw new SocialRequestError(extractErrorMessage(payload) ?? `社媒数据加载失败（HTTP ${response.status}）`);
    }
    return adaptSocialOverview(payload?.data, filters, requestBody, 'real', payload);
}
export function createSocialRequestBody(filters) {
    return {
        bizDate: filters.date,
        campId: filters.campId === 'all' ? null : filters.campId,
        projectId: filters.projectId === 'all' ? null : filters.projectId,
        channelStatus: filters.status === 'all' ? null : filters.status,
        keyword: filters.keyword.trim() || null,
        page: 1,
        pageSize: 20,
    };
}
function fetchMockSocialOverview(filters, requestBody) {
    const mode = resolveSocialMockMode();
    const response = mode === 'error'
        ? mockSocialErrorEnvelope()
        : mode === 'empty'
            ? mockSocialEmptyEnvelope(requestBody)
            : mockSocialSuccessEnvelope(requestBody);
    if (response.code !== 0) {
        throw new SocialRequestError();
    }
    return adaptSocialOverview(response.data, filters, requestBody, 'mock', response);
}
function adaptSocialOverview(data, filters, requestBody, provider, envelope) {
    const record = data && typeof data === 'object' ? data : {};
    const channels = readArray(record.channels).map(adaptSocialChannel).filter((item) => Boolean(item));
    const filteredChannels = filterChannels(channels, filters);
    const connectedChannels = filteredChannels.filter((item) => item.status === 'connected');
    const pendingChannels = filteredChannels.filter((item) => item.status === 'pending');
    const accountData = readRecord(record.accounts);
    const accountRows = readArray(accountData?.list).map(adaptSocialAccount).filter((item) => Boolean(item));
    const filteredAccounts = filterAccounts(accountRows, filters);
    return {
        filters,
        filterOptions: adaptFilterOptions(record.filterOptions),
        metrics: readArray(record.metrics).map(adaptSocialMetric).filter((item) => Boolean(item)),
        connectedChannels,
        pendingChannels,
        trend: readArray(record.trend).map(adaptTrendPoint).filter((item) => Boolean(item)),
        todos: readArray(record.todos).map(adaptTodo).filter((item) => Boolean(item)),
        accounts: {
            list: filteredAccounts,
            pagination: {
                page: readNumber(readRecord(accountData?.pagination)?.page) ?? 1,
                pageSize: readNumber(readRecord(accountData?.pagination)?.pageSize) ?? 20,
                total: filteredAccounts.length,
            },
        },
        quickLinks: readArray(record.quickLinks).map(adaptQuickLink).filter((item) => Boolean(item)),
        updatedAt: readString(record.updatedAt) ?? '2026-05-18 10:00',
        requestBody,
        endpoint: provider === 'mock' ? socialMockSourceLabel : socialOverviewEndpoint,
        provider,
        traceId: envelope?.traceId ?? `${provider}-ota--shemei--shemei-overview`,
        timestamp: envelope?.timestamp ?? '2026-05-18T10:00:00+08:00',
    };
}
function filterChannels(channels, filters) {
    const keyword = filters.keyword.trim();
    return channels.filter((item) => {
        if (filters.status !== 'all' && item.status !== filters.status)
            return false;
        if (keyword && !item.name.includes(keyword))
            return false;
        return true;
    });
}
function filterAccounts(rows, filters) {
    const keyword = filters.keyword.trim();
    return rows.filter((item) => {
        if (filters.status === 'connected' && item.auditStatus !== '已发布')
            return false;
        if (filters.status === 'pending' && item.auditStatus === '已发布')
            return false;
        if (keyword && !`${item.channel}${item.accountId}${item.store}`.includes(keyword))
            return false;
        return true;
    });
}
function adaptFilterOptions(value) {
    const record = readRecord(value);
    return {
        camps: adaptOptionList(record?.camps, [
            { label: '全部门店', value: 'all' },
            { label: '天落会宿公寓(前海壹方城宝安中心店)', value: 'camp-qianhai' },
        ]),
        projects: adaptOptionList(record?.projects, [
            { label: '全部项目', value: 'all' },
            { label: '日历房', value: 'calendar-room' },
            { label: '预售券', value: 'presale-ticket' },
        ]),
        statuses: [
            { label: '全部状态', value: 'all' },
            { label: '已直连', value: 'connected' },
            { label: '待开通', value: 'pending' },
        ],
    };
}
function adaptOptionList(value, fallback) {
    const rows = readArray(value)
        .map((item) => {
        const record = readRecord(item);
        const label = readString(record?.label);
        const optionValue = readString(record?.value);
        return label && optionValue ? { label, value: optionValue } : null;
    })
        .filter((item) => Boolean(item));
    return rows.length > 0 ? rows : fallback;
}
function adaptSocialMetric(value) {
    const record = readRecord(value);
    if (!record)
        return null;
    const label = readString(record.label);
    const metricValue = readString(record.value);
    if (!label || !metricValue)
        return null;
    return {
        label,
        value: metricValue,
        change: readString(record.change) ?? '较昨日持平',
        tone: readTone(record.tone),
    };
}
function adaptSocialChannel(value) {
    const record = readRecord(value);
    if (!record)
        return null;
    const id = readString(record.id);
    const name = readString(record.name);
    if (!id || !name)
        return null;
    return {
        id,
        name,
        status: record.status === 'connected' ? 'connected' : 'pending',
        relation: readString(record.relation) ?? '关联房型0/0',
        support: readStringArray(record.support) ?? [],
        action: readString(record.action) ?? '查看详情',
        accent: readTone(record.accent),
        conversionRate: readString(record.conversionRate) ?? '-',
        roomTypeCount: readNumber(record.roomTypeCount) ?? 0,
        linkedRoomTypeCount: readNumber(record.linkedRoomTypeCount) ?? 0,
        dailyOrders: readNumber(record.dailyOrders) ?? 0,
        pendingTasks: readStringArray(record.pendingTasks) ?? [],
    };
}
function adaptTrendPoint(value) {
    const record = readRecord(value);
    const label = readString(record?.label);
    if (!record || !label)
        return null;
    return {
        label,
        douyin: readNumber(record.douyin) ?? 0,
        xiaohongshu: readNumber(record.xiaohongshu) ?? 0,
        shipinhao: readNumber(record.shipinhao) ?? 0,
    };
}
function adaptTodo(value) {
    const record = readRecord(value);
    const id = readString(record?.id);
    const title = readString(record?.title);
    if (!record || !id || !title)
        return null;
    return {
        id,
        title,
        channel: readString(record.channel) ?? '社媒',
        priority: readString(record.priority) ?? '普通',
        dueText: readString(record.dueText) ?? '今日',
    };
}
function adaptSocialAccount(value) {
    const record = readRecord(value);
    const id = readString(record?.id);
    const channel = readString(record?.channel);
    if (!record || !id || !channel)
        return null;
    return {
        id,
        channel,
        accountId: readString(record.accountId) ?? '-',
        store: readString(record.store) ?? '-',
        authorization: readStringArray(record.authorization) ?? [],
        auditStatus: readString(record.auditStatus) ?? '-',
        syncStatus: readString(record.syncStatus) ?? '-',
        updatedAt: readString(record.updatedAt) ?? '-',
    };
}
function adaptQuickLink(value) {
    const record = readRecord(value);
    const label = readString(record?.label);
    const path = readString(record?.path);
    return label && path ? { label, path } : null;
}
function resolveSocialProviderName(explicitProvider) {
    const configured = explicitProvider ||
        readRuntimeConfig('pms.socialProvider') ||
        import.meta.env.VITE_PMS_SOCIAL_PROVIDER;
    return configured === 'real' ? 'real' : 'mock';
}
function resolveSocialMockMode() {
    const configured = readRuntimeConfig('pms.socialMockMode') ||
        import.meta.env.VITE_PMS_SOCIAL_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function mockSocialSuccessEnvelope(requestBody) {
    return {
        code: 0,
        message: 'success',
        data: {
            filterOptions: {
                camps: [
                    { label: '全部门店', value: 'all' },
                    { label: '天落会宿公寓(前海壹方城宝安中心店)', value: 'camp-qianhai' },
                ],
                projects: [
                    { label: '全部项目', value: 'all' },
                    { label: '日历房', value: 'calendar-room' },
                    { label: '预售券', value: 'presale-ticket' },
                ],
            },
            metrics: [
                { label: '已直连渠道', value: '1', change: '较昨日持平', tone: 'blue' },
                { label: '待开通渠道', value: '3', change: '本周新增 1 个意向', tone: 'orange' },
                { label: '今日渠道订单', value: '18', change: '较昨日 +12%', tone: 'green' },
                { label: '待处理事项', value: '4', change: '2 项需今日处理', tone: 'red' },
            ],
            channels: [
                {
                    id: 'douyin-lk',
                    name: '抖音来客',
                    status: 'connected',
                    relation: '关联房型2/4',
                    support: ['日历房', '预售券'],
                    action: '管理渠道',
                    accent: 'blue',
                    conversionRate: '13.6%',
                    roomTypeCount: 4,
                    linkedRoomTypeCount: 2,
                    dailyOrders: 18,
                    pendingTasks: ['2 个房型待授权', '1 个预售券待同步'],
                },
                {
                    id: 'xiaohongshu',
                    name: '小红书',
                    status: 'pending',
                    relation: '待开通',
                    support: ['内容种草', '活动引流'],
                    action: '订阅开通',
                    accent: 'red',
                    conversionRate: '-',
                    roomTypeCount: 0,
                    linkedRoomTypeCount: 0,
                    dailyOrders: 0,
                    pendingTasks: ['确认订阅方案'],
                },
                {
                    id: 'shipinhao',
                    name: '视频号',
                    status: 'pending',
                    relation: '待开通',
                    support: ['直播间', '短视频'],
                    action: '订阅开通',
                    accent: 'green',
                    conversionRate: '-',
                    roomTypeCount: 0,
                    linkedRoomTypeCount: 0,
                    dailyOrders: 0,
                    pendingTasks: ['补齐渠道资料'],
                },
                {
                    id: 'douyin-special',
                    name: '抖音特价酒店',
                    status: 'pending',
                    relation: '待开通',
                    support: ['特价房', '闪促活动'],
                    action: '订阅开通',
                    accent: 'orange',
                    conversionRate: '-',
                    roomTypeCount: 0,
                    linkedRoomTypeCount: 0,
                    dailyOrders: 0,
                    pendingTasks: ['配置特价库存'],
                },
            ],
            trend: [
                { label: '05-12', douyin: 10, xiaohongshu: 2, shipinhao: 1 },
                { label: '05-13', douyin: 13, xiaohongshu: 3, shipinhao: 2 },
                { label: '05-14', douyin: 15, xiaohongshu: 3, shipinhao: 3 },
                { label: '05-15', douyin: 12, xiaohongshu: 4, shipinhao: 2 },
                { label: '05-16', douyin: 18, xiaohongshu: 5, shipinhao: 4 },
            ],
            todos: [
                { id: 'todo-1', title: '授权日历房房型', channel: '抖音来客', priority: '高', dueText: '今日 18:00' },
                { id: 'todo-2', title: '同步预售券库存', channel: '抖音来客', priority: '中', dueText: '今日' },
                { id: 'todo-3', title: '确认小红书订阅方案', channel: '小红书', priority: '中', dueText: '本周' },
            ],
            accounts: {
                list: [
                    {
                        id: '7370207731854149643',
                        channel: '抖音来客',
                        accountId: '1820360983796908034',
                        store: '天落会宿公寓(前海壹方城宝安中心店)',
                        authorization: ['酒店行业预售券解决方案', '酒店行业日历房解决方案'],
                        auditStatus: '已发布',
                        syncStatus: '房型待同步',
                        updatedAt: '2026-05-18 09:40',
                    },
                    {
                        id: '7370207731854149650',
                        channel: '抖音来客',
                        accountId: '1820360983796908051',
                        store: '天落会宿公寓(前海壹方城宝安中心店)',
                        authorization: ['酒店行业日历房解决方案'],
                        auditStatus: '审核中',
                        syncStatus: '资料待确认',
                        updatedAt: '2026-05-17 19:20',
                    },
                ],
                pagination: { page: 1, pageSize: 20, total: 2 },
            },
            quickLinks: [
                { label: '房价管理', path: '/houseManage/houseCale' },
                { label: '住宿订单', path: '/order/house-order/list' },
                { label: '预售券订单', path: '/mallManagement/orderManagement' },
            ],
            updatedAt: '2026-05-18 10:00',
            requestEcho: requestBody,
        },
        traceId: 'mock-ota--shemei--shemei-overview-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockSocialEmptyEnvelope(requestBody) {
    return {
        ...mockSocialSuccessEnvelope(requestBody),
        data: {
            ...mockSocialSuccessEnvelope(requestBody).data,
            metrics: [
                { label: '已直连渠道', value: '0', change: '当前条件暂无数据', tone: 'blue' },
                { label: '待开通渠道', value: '0', change: '当前条件暂无数据', tone: 'orange' },
                { label: '今日渠道订单', value: '0', change: '当前条件暂无数据', tone: 'green' },
                { label: '待处理事项', value: '0', change: '当前条件暂无数据', tone: 'red' },
            ],
            channels: [],
            trend: [],
            todos: [],
            accounts: { list: [], pagination: { page: 1, pageSize: 20, total: 0 } },
            updatedAt: '2026-05-18 10:00',
        },
        traceId: 'mock-ota--shemei--shemei-empty-001',
    };
}
function mockSocialErrorEnvelope() {
    return {
        code: 50001,
        message: 'social overview failed',
        data: null,
        traceId: 'mock-ota--shemei--shemei-error-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
async function readJson(response) {
    try {
        return (await response.json());
    }
    catch {
        return null;
    }
}
function isFailedResponse(payload) {
    if (!payload)
        return false;
    if (payload.code !== undefined)
        return payload.code !== 0;
    return payload.success === false;
}
function extractErrorMessage(payload) {
    if (!payload)
        return null;
    return payload.message ?? payload.errorMsg ?? payload.errorCode ?? null;
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function readRecord(value) {
    return value && typeof value === 'object' ? value : null;
}
function readArray(value) {
    return Array.isArray(value) ? value : [];
}
function readString(value) {
    if (value === null || value === undefined || value === '')
        return null;
    return String(value);
}
function readStringArray(value) {
    if (!Array.isArray(value))
        return null;
    return value.map((item) => String(item));
}
function readNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))
        return Number(value);
    return null;
}
function readTone(value) {
    return value === 'green' || value === 'orange' || value === 'red' ? value : 'blue';
}
