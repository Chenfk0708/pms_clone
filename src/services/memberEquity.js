const MEMBER_EQUITY_PROVIDER_KEY = 'pms.memberEquityProvider';
const MEMBER_EQUITY_TIMESTAMP = '2026-05-18T10:00:00+08:00';
const DEFAULT_CAMP_ID = '1796067693589061634';
export const MEMBER_EQUITY_LIST_PATH = '/memberBenefit/page/get';
export const MEMBER_EQUITY_SORT_PATH = '/memberBenefit/seqs';
export const MEMBER_EQUITY_CREATE_PATH = '/memberBenefit/add';
export const MEMBER_EQUITY_UPDATE_PATH = '/memberBenefit/edit';
export const MEMBER_EQUITY_DELETE_PATH = '/memberBenefit/delete';
export function createDefaultMemberEquityFilters(searchParams = new URLSearchParams()) {
    return {
        campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
        page: Number(searchParams.get('page') || 1),
        pageSize: Number(searchParams.get('pageSize') || 999),
        mockState: toMockState(searchParams.get('mockState')),
    };
}
export function buildMemberEquityListRequest(filters) {
    return {
        campId: filters.campId,
        pageNum: filters.page,
        pageSize: filters.pageSize,
    };
}
export function buildMemberEquitySortRequest(filters, items) {
    return {
        campId: filters.campId,
        memberBenefitSeqs: items.map((item, index) => ({
            memberBenefitId: item.memberBenefitId,
            seq: index + 1,
        })),
    };
}
export async function fetchMemberEquityDashboard(filters, providerName = getMemberEquityProviderName()) {
    validateFilters(filters);
    if (providerName === 'api') {
        throw new Error('会员权益加载失败，请稍后重试');
    }
    const envelope = await fetchMockMemberEquityDashboard(filters);
    return adaptMemberEquityEnvelope(envelope, filters, providerName);
}
export async function createMemberEquityItem(filters, currentItems, draft) {
    validateDraft(draft);
    await delay(120);
    const nextItem = {
        memberBenefitId: `mock-benefit-${Date.now()}`,
        name: draft.name.trim(),
        logoMediaId: draft.logoMediaId,
        logoMediaUrl: draft.logoMediaUrl,
        description: draft.description.trim(),
        seq: currentItems.length + 1,
        updatedAt: '2026-05-18 10:00',
    };
    const envelope = {
        code: 0,
        message: 'success',
        data: { list: [...currentItems, nextItem] },
        traceId: `mock-scrm--huiyuan-zhongxin--huiyuan-quanyi-create-${filters.campId}`,
        timestamp: MEMBER_EQUITY_TIMESTAMP,
    };
    return adaptMutationEnvelope(envelope);
}
export async function updateMemberEquityItem(filters, currentItems, memberBenefitId, draft) {
    validateDraft(draft);
    await delay(120);
    const envelope = {
        code: 0,
        message: 'success',
        data: {
            list: currentItems.map((item) => item.memberBenefitId === memberBenefitId
                ? {
                    ...item,
                    name: draft.name.trim(),
                    logoMediaId: draft.logoMediaId,
                    logoMediaUrl: draft.logoMediaUrl,
                    description: draft.description.trim(),
                    updatedAt: '2026-05-18 10:05',
                }
                : item),
        },
        traceId: `mock-scrm--huiyuan-zhongxin--huiyuan-quanyi-edit-${filters.campId}`,
        timestamp: MEMBER_EQUITY_TIMESTAMP,
    };
    return adaptMutationEnvelope(envelope);
}
export async function deleteMemberEquityItem(filters, currentItems, memberBenefitId) {
    await delay(120);
    const envelope = {
        code: 0,
        message: 'success',
        data: {
            list: currentItems
                .filter((item) => item.memberBenefitId !== memberBenefitId)
                .map((item, index) => ({ ...item, seq: index + 1 })),
        },
        traceId: `mock-scrm--huiyuan-zhongxin--huiyuan-quanyi-delete-${filters.campId}`,
        timestamp: MEMBER_EQUITY_TIMESTAMP,
    };
    return adaptMutationEnvelope(envelope);
}
export async function saveMemberEquitySort(filters, items) {
    await delay(120);
    if (items.length === 0) {
        const envelope = {
            code: 40001,
            message: 'memberBenefitSeqs:不能为空',
            data: { list: [] },
            traceId: 'mock-scrm--huiyuan-zhongxin--huiyuan-quanyi-sort-empty-001',
            timestamp: MEMBER_EQUITY_TIMESTAMP,
        };
        return adaptMutationEnvelope(envelope);
    }
    const envelope = {
        code: 0,
        message: 'success',
        data: {
            list: items.map((item, index) => ({ ...item, seq: index + 1, updatedAt: '2026-05-18 10:10' })),
        },
        traceId: `mock-scrm--huiyuan-zhongxin--huiyuan-quanyi-sort-${filters.campId}`,
        timestamp: MEMBER_EQUITY_TIMESTAMP,
    };
    return adaptMutationEnvelope(envelope);
}
function getMemberEquityProviderName() {
    if (typeof window === 'undefined')
        return 'mock';
    const configured = window.localStorage.getItem(MEMBER_EQUITY_PROVIDER_KEY);
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
async function fetchMockMemberEquityDashboard(filters) {
    await delay(120);
    if (filters.mockState === 'error') {
        return {
            code: 50001,
            message: '会员权益加载失败，请稍后重试',
            data: createPayload(filters, []),
            traceId: 'mock-scrm--huiyuan-zhongxin--huiyuan-quanyi-error-001',
            timestamp: MEMBER_EQUITY_TIMESTAMP,
        };
    }
    if (filters.mockState === 'empty') {
        return {
            code: 0,
            message: 'success',
            data: createPayload(filters, []),
            traceId: 'mock-scrm--huiyuan-zhongxin--huiyuan-quanyi-empty-001',
            timestamp: MEMBER_EQUITY_TIMESTAMP,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: createPayload(filters, createSuccessItems()),
        traceId: 'mock-scrm--huiyuan-zhongxin--huiyuan-quanyi-list-001',
        timestamp: MEMBER_EQUITY_TIMESTAMP,
    };
}
function adaptMemberEquityEnvelope(envelope, filters, provider) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '会员权益加载失败，请稍后重试');
    }
    const data = envelope.data;
    if (!data || !Array.isArray(data.list) || !Array.isArray(data.cards)) {
        throw new Error('会员权益加载失败，请稍后重试');
    }
    return {
        filters,
        provider,
        traceId: envelope.traceId,
        requestedAt: envelope.timestamp,
        items: data.list.map(normalizeItem).sort((left, right) => left.seq - right.seq),
        cards: data.cards,
        pagination: {
            page: data.current,
            pageSize: data.size,
            total: data.total,
        },
    };
}
function adaptMutationEnvelope(envelope) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '会员权益操作失败，请稍后重试');
    }
    if (!envelope.data || !Array.isArray(envelope.data.list)) {
        throw new Error('会员权益操作失败，请稍后重试');
    }
    return envelope.data.list.map(normalizeItem).sort((left, right) => left.seq - right.seq);
}
function createPayload(filters, list) {
    return {
        total: list.length,
        size: filters.pageSize,
        current: filters.page,
        extraInfo: null,
        pageNum: filters.page,
        hasNextPage: false,
        pages: list.length > 0 ? 1 : 0,
        list,
        cards: [
            {
                memberCardId: '1796067693727473665',
                name: '普通会员',
                level: 1,
                memberBenefitCount: list.length,
            },
        ],
    };
}
function createSuccessItems() {
    return [
        {
            memberBenefitId: 'mock-benefit-late-checkout',
            name: '延迟退房',
            logoMediaId: 'mock-media-late-checkout',
            logoMediaUrl: '/favicon.svg',
            description: '会员可申请 14:00 前延迟退房，需以前台房态确认为准。',
            seq: 1,
            updatedAt: '2026-05-18 09:20',
        },
        {
            memberBenefitId: 'mock-benefit-room-upgrade',
            name: '房型升级',
            logoMediaId: 'mock-media-room-upgrade',
            logoMediaUrl: '/icons.svg',
            description: '入住当天有空房时可优先升级到同价位以上房型。',
            seq: 2,
            updatedAt: '2026-05-18 09:35',
        },
        {
            memberBenefitId: 'mock-benefit-welcome-gift',
            name: '欢迎礼遇',
            logoMediaId: 'mock-media-welcome-gift',
            logoMediaUrl: '/favicon.svg',
            description: '入住时提供饮品、一次性用品补给或门店运营配置的礼遇。',
            seq: 3,
            updatedAt: '2026-05-18 09:45',
        },
    ];
}
function normalizeItem(item) {
    return {
        memberBenefitId: item.memberBenefitId,
        name: item.name,
        logoMediaId: item.logoMediaId,
        logoMediaUrl: item.logoMediaUrl,
        description: item.description || '--',
        seq: Number(item.seq || 0),
        updatedAt: item.updatedAt || '2026-05-18 10:00',
    };
}
function validateFilters(filters) {
    if (!filters.campId.trim()) {
        throw new Error('会员权益门店参数不正确');
    }
    if (!Number.isFinite(filters.page) || filters.page < 1 || !Number.isFinite(filters.pageSize) || filters.pageSize < 1) {
        throw new Error('会员权益分页参数不正确');
    }
}
function validateDraft(draft) {
    const name = draft.name.trim();
    if (!name) {
        throw new Error('请输入权益名称');
    }
    if (name.length > 8) {
        throw new Error('最多可输入8个字符');
    }
    if (!draft.logoMediaId || !draft.logoMediaUrl) {
        throw new Error('请上传权益图标');
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
