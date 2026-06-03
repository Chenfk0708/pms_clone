const TASK_ID = 'scrm--huiyuan-zhongxin--huiyuan-dengji';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
export const SCRM_MEMBER_LEVEL_LIST_PATH = '/scrm/memberCenter/levels/page';
export const SCRM_MEMBER_LEVEL_SAVE_PATH = '/scrm/memberCenter/levels/save';
export const SCRM_MEMBER_LEVEL_UPGRADE_PATH = '/scrm/memberCenter/levels/upgradeRule/save';
export function createDefaultScrmMemberLevelFilters(searchParams = new URLSearchParams()) {
    return {
        storeId: searchParams.get('storeId') || 'all',
        status: searchParams.get('status') || 'all',
        keyword: searchParams.get('keyword') || '',
        page: Number(searchParams.get('page') || 1),
        pageSize: Number(searchParams.get('pageSize') || 20),
        mockState: toMockState(searchParams.get('mockState')),
    };
}
export async function fetchScrmMemberLevelDashboard(filters, providerName = getScrmMemberLevelProviderName()) {
    validateFilters(filters);
    if (providerName === 'api') {
        throw new Error('会员等级加载失败，请稍后重试');
    }
    const envelope = await fetchMockDashboard(filters);
    return adaptEnvelope(envelope, filters, providerName);
}
export async function saveScrmMemberLevel(input) {
    await delay(80);
    if (!input.name.trim()) {
        throw new Error('请输入等级名称');
    }
    return {
        code: 0,
        message: 'success',
        data: {
            id: input.id ?? 'level-new',
            savedAt: '2026-05-18 10:00:00',
        },
        traceId: `mock-${TASK_ID}-save-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
export async function saveScrmMemberUpgradeRule(ruleId) {
    await delay(80);
    if (!ruleId) {
        throw new Error('请选择升级规则');
    }
    return {
        code: 0,
        message: 'success',
        data: {
            ruleId,
            savedAt: '2026-05-18 10:00:00',
        },
        traceId: `mock-${TASK_ID}-upgrade-save-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
export function buildScrmMemberLevelRequest(filters) {
    return {
        storeId: filters.storeId,
        status: filters.status,
        keyword: filters.keyword.trim(),
        page: filters.page,
        pageSize: filters.pageSize,
    };
}
function getScrmMemberLevelProviderName() {
    if (typeof window === 'undefined')
        return 'mock';
    const configured = window.localStorage.getItem('pms.scrmMemberLevelProvider');
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
async function fetchMockDashboard(filters) {
    await delay(120);
    if (filters.mockState === 'error') {
        return {
            code: 50001,
            message: '会员等级加载失败，请稍后重试',
            data: createPayload(filters, []),
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: MOCK_TIMESTAMP,
        };
    }
    const levels = filters.mockState === 'empty' ? [] : filterLevels(mockLevels, filters);
    return {
        code: 0,
        message: 'success',
        data: createPayload(filters, levels),
        traceId: `mock-${TASK_ID}-${filters.mockState}-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
function adaptEnvelope(envelope, filters, provider) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '会员等级加载失败，请稍后重试');
    }
    const data = envelope.data;
    if (!data || !Array.isArray(data.levels) || !Array.isArray(data.upgradeRules)) {
        throw new Error('会员等级加载失败，请稍后重试');
    }
    return {
        ...data,
        filters,
        provider,
        traceId: envelope.traceId,
    };
}
function createPayload(filters, levels) {
    const enabledCount = levels.filter((level) => level.status === 'enabled').length;
    const memberTotal = levels.reduce((sum, level) => sum + level.memberCount, 0);
    return {
        stores: [
            { value: 'all', label: '全部门店' },
            { value: 'qianhai', label: '前海店' },
            { value: 'expo', label: '天落会展店' },
        ],
        statusOptions: [
            { value: 'all', label: '全部状态' },
            { value: 'enabled', label: '已启用' },
            { value: 'disabled', label: '已停用' },
        ],
        metrics: [
            { key: 'levelCount', label: '会员等级数', value: String(levels.length), description: '当前条件下配置的等级数量' },
            { key: 'enabledCount', label: '启用等级', value: String(enabledCount), description: '可在会员中心生效的等级' },
            { key: 'memberTotal', label: '覆盖会员', value: String(memberTotal), description: '等级覆盖的会员人数' },
            { key: 'upgradeRule', label: '升级规则', value: '次数+天数', description: '当前生效的自动升级口径' },
        ],
        levels,
        upgradeRules: [
            { id: 'order-count', label: '用户总计成功预订的房源次数（指用户消费成功，且无退款的订单次数）', selected: false },
            { id: 'stay-days', label: '用户总计成功预订的天数（指用户消费成功，且无退款的订单内累计的住宿天数）', selected: false },
            { id: 'count-and-days', label: '用户总计成功预订的次数与天数总和', selected: true },
        ],
        pagination: {
            page: filters.page,
            pageSize: filters.pageSize,
            total: levels.length,
        },
        requestedAt: '2026-05-18 10:00:00',
    };
}
function filterLevels(levels, filters) {
    const keyword = filters.keyword.trim();
    return levels.filter((level) => {
        const matchesKeyword = !keyword || level.name.includes(keyword) || `等级${level.rank}`.includes(keyword);
        const matchesStatus = filters.status === 'all' || level.status === filters.status;
        const matchesStore = filters.storeId === 'all' || level.id.includes(filters.storeId) || level.rank < 3;
        return matchesKeyword && matchesStatus && matchesStore;
    });
}
function validateFilters(filters) {
    if (!Number.isFinite(filters.page) || filters.page < 1) {
        throw new Error('分页参数不正确');
    }
    if (!Number.isFinite(filters.pageSize) || filters.pageSize < 1) {
        throw new Error('分页参数不正确');
    }
}
function toMockState(value) {
    if (value === 'empty' || value === 'error')
        return value;
    return 'success';
}
function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
const mockLevels = [
    {
        id: 'level-qianhai-ordinary',
        rank: 1,
        name: '普通会员',
        upgradeCondition: '无门槛',
        discount: '-',
        benefits: '-',
        cardColor: '#d3d3d3',
        status: 'enabled',
        memberCount: 1268,
        updatedAt: '2026-05-18 09:20',
    },
    {
        id: 'level-qianhai-silver',
        rank: 2,
        name: '银卡会员',
        upgradeCondition: '累计 3 次消费或 5 晚入住',
        discount: '房源 9.5 折，商品 9.8 折',
        benefits: '延迟退房、生日券',
        cardColor: '#b7c5d8',
        status: 'enabled',
        memberCount: 328,
        updatedAt: '2026-05-17 18:40',
    },
    {
        id: 'level-expo-gold',
        rank: 3,
        name: '金卡会员',
        upgradeCondition: '累计 8 次消费或 12 晚入住',
        discount: '房源 9 折，商品 9.5 折',
        benefits: '专属客服、升级券',
        cardColor: '#d7b48e',
        status: 'disabled',
        memberCount: 86,
        updatedAt: '2026-05-16 16:12',
    },
];
