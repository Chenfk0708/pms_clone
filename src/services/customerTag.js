export const customerTagProvider = 'mock';
export const customerTagListEndpoint = 'https://hudson-prod.localhome.cn/memberTagGroup/page/get';
export const customerTagSyncEndpoint = 'https://hudson-prod.localhome.cn/wxCpOpen/accounts/get';
export const customerTagSaveEndpoint = 'https://hudson-prod.localhome.cn/memberTagGroup/save';
export const customerTagExportEndpoint = 'https://hudson-prod.localhome.cn/memberTagGroup/export';
export class CustomerTagServiceError extends Error {
    response;
    constructor(response) {
        super(response.message);
        this.name = 'CustomerTagServiceError';
        this.response = response;
    }
}
export const defaultCustomerTagFilters = {
    campId: '1796067693589061634',
    keyword: '',
    page: 1,
    pageSize: 20,
};
const timestamp = '2026-05-18T10:00:00+08:00';
const mockLatencyMs = 260;
const rows = [
    {
        tagGroupId: 'tag-group-001',
        tagGroupName: '高价值住客',
        tagNames: ['高消费', '复购潜力', '生日礼遇'],
        memberCount: 326,
        recentlyAddedCount: 18,
        createdBy: 'SCRM运营',
        createdAt: '2026-05-10 09:30:00',
        updatedAt: '2026-05-18 09:20:00',
        source: 'rule',
        status: 'enabled',
        description: '近 180 天消费金额超过 3000 元或复购 3 次以上的客户。',
    },
    {
        tagGroupId: 'tag-group-002',
        tagGroupName: '会员关怀',
        tagNames: ['会员', '待回访', '权益提醒'],
        memberCount: 584,
        recentlyAddedCount: 26,
        createdBy: '会员中心',
        createdAt: '2026-05-08 14:12:00',
        updatedAt: '2026-05-18 08:40:00',
        source: 'manual',
        status: 'enabled',
        description: '用于会员权益发放、复购提醒和人工回访的运营标签组。',
    },
    {
        tagGroupId: 'tag-group-003',
        tagGroupName: '企微同步标签',
        tagNames: ['已加企微', '待建群', '社群活跃'],
        memberCount: 218,
        recentlyAddedCount: 9,
        createdBy: '企微助手',
        createdAt: '2026-05-15 11:05:00',
        updatedAt: '2026-05-18 09:05:00',
        source: 'wechat',
        status: 'syncing',
        description: '承接企微客户标签同步，便于客服跟进与社群运营。',
    },
];
export async function loadCustomerTagData(filters, state = 'success') {
    const response = await loadCustomerTagResponse(filters, state);
    if (response.code !== 0)
        throw new CustomerTagServiceError(response);
    return adaptCustomerTagResponse(response);
}
export function buildCustomerTagRequestBody(filters) {
    return {
        campId: filters.campId,
        tagGroupName: filters.keyword.trim(),
        pageNum: filters.page,
        pageSize: filters.pageSize,
    };
}
async function loadCustomerTagResponse(filters, state) {
    await delay(mockLatencyMs);
    const request = {
        provider: customerTagProvider,
        targetEndpoint: customerTagListEndpoint,
        body: buildCustomerTagRequestBody(filters),
        state,
    };
    if (filters.page < 1 || filters.pageSize < 1) {
        return createResponse(400, '客户标签分页参数不合法', request, [], filters);
    }
    if (state === 'error') {
        return createResponse(503, '客户标签数据加载失败，请稍后重试。', request, [], filters);
    }
    const filteredRows = state === 'empty' ? [] : filterRows(filters.keyword);
    return createResponse(0, 'success', request, filteredRows, filters);
}
function createResponse(code, message, request, list, filters) {
    return {
        code,
        message,
        data: {
            request,
            summary: summarize(list),
            list,
            pagination: {
                page: filters.page,
                pageSize: filters.pageSize,
                total: list.length,
            },
        },
        traceId: `mock-scrm--kehu-guanli--kehu-biaoqian-${code === 0 ? 'list' : 'error'}-001`,
        timestamp,
    };
}
function filterRows(keyword) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized)
        return rows;
    return rows.filter((row) => {
        const haystack = `${row.tagGroupName} ${row.tagNames.join(' ')} ${row.description}`.toLowerCase();
        return haystack.includes(normalized);
    });
}
function summarize(list) {
    return {
        groupCount: list.length === 0 ? 0 : 18,
        tagCount: list.length === 0 ? 0 : 62,
        coveredMembers: list.reduce((total, row) => total + row.memberCount, 0),
        syncingGroups: list.filter((row) => row.status === 'syncing').length,
    };
}
function adaptCustomerTagResponse(response) {
    return {
        provider: customerTagProvider,
        responseCode: response.code,
        requestBody: response.data.request.body,
        requestEcho: JSON.stringify({
            provider: customerTagProvider,
            responseCode: response.code,
            state: response.data.request.state,
            keyword: response.data.request.body.tagGroupName,
            endpoint: response.data.request.targetEndpoint,
            requestBody: response.data.request.body,
            traceId: response.traceId,
        }),
        state: response.data.request.state,
        summary: response.data.summary,
        rows: response.data.list.map(adaptRow),
        pagination: response.data.pagination,
        traceId: response.traceId,
        timestamp: response.timestamp,
    };
}
function adaptRow(row) {
    return {
        id: row.tagGroupId,
        groupName: row.tagGroupName,
        tagNames: row.tagNames.join('、'),
        memberCount: row.memberCount,
        recentlyAddedCount: row.recentlyAddedCount,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        sourceLabel: sourceLabel(row.source),
        statusLabel: row.status === 'syncing' ? '同步中' : '启用',
        description: row.description,
    };
}
function sourceLabel(source) {
    if (source === 'wechat')
        return '企微同步';
    if (source === 'rule')
        return '规则生成';
    return '手动维护';
}
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
