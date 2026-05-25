const SHIFT_SETTING_PROVIDER_KEY = 'pms.shiftSettingProvider';
export const SHIFT_SETTING_CONFIG_PATH = '/shiftWorkConfig/page/get';
export const SHIFT_SETTING_GOODS_PATH = '/shiftWorkGoods/page/get';
export const SHIFT_SETTING_MEMBER_PATH = '/campRoles/get';
const REAL_BASE_URL = 'https://hudson-prod.localhome.cn';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_TRACE_PREFIX = 'mock-shezhi--tongyong-shezhi--jiaojieban-shezhi';
const DEFAULT_TIMESTAMP = '2026-05-23 10:18:34';
const baseMemberOptions = [
    { value: 'member-1', label: '路客云6TS5' },
    { value: 'member-2', label: '陈早班' },
    { value: 'member-3', label: '李前台' },
    { value: 'member-4', label: '王夜班' },
];
function createBasePayload() {
    return {
        shiftConfigs: [],
        goodsConfigs: [],
        memberOptions: baseMemberOptions.map((item) => ({ ...item })),
    };
}
export function createDefaultShiftSettingFilters(searchParams = new URLSearchParams()) {
    return {
        campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
        mockState: toMockState(searchParams.get('mockState')),
    };
}
export async function fetchShiftSettingDashboard(filters, providerName = getShiftSettingProviderName(), signal) {
    validateFilters(filters);
    if (providerName === 'api') {
        return fetchApiShiftSettingDashboard(filters, signal);
    }
    const envelope = await fetchMockShiftSettingDashboard(filters, signal);
    return adaptShiftSettingEnvelope(envelope, filters, providerName);
}
export async function saveShiftConfigs(filters, drafts, providerName = getShiftSettingProviderName(), signal) {
    validateFilters(filters);
    validateShiftDrafts(drafts);
    if (providerName === 'api') {
        throw new Error('交接班设置保存接口暂未接入，请稍后重试');
    }
    await delay(120, signal);
    const shiftConfigs = drafts.map((draft, index) => toShiftConfig(draft, index));
    const dashboard = adaptShiftSettingEnvelope(createMockSuccessEnvelope(filters, {
        shiftConfigs,
        goodsConfigs: [],
        memberOptions: baseMemberOptions,
    }), filters, providerName);
    return {
        provider: providerName,
        message: '已保存班次设置',
        dashboard,
    };
}
export async function saveShiftGoods(filters, drafts, providerName = getShiftSettingProviderName(), signal) {
    validateFilters(filters);
    validateGoodsDrafts(drafts);
    if (providerName === 'api') {
        throw new Error('交班物品保存接口暂未接入，请稍后重试');
    }
    await delay(120, signal);
    const goodsConfigs = drafts.map((draft, index) => toShiftGoodsItem(draft, index));
    const dashboard = adaptShiftSettingEnvelope(createMockSuccessEnvelope(filters, {
        shiftConfigs: [],
        goodsConfigs,
        memberOptions: baseMemberOptions,
    }), filters, providerName);
    return {
        provider: providerName,
        message: '已保存交班物品',
        dashboard,
    };
}
function getShiftSettingProviderName() {
    if (typeof window === 'undefined')
        return 'mock';
    const configured = window.localStorage.getItem(SHIFT_SETTING_PROVIDER_KEY)?.trim();
    return configured === 'api' ? 'api' : 'mock';
}
async function fetchMockShiftSettingDashboard(filters, signal) {
    await delay(180, signal);
    if (filters.mockState === 'error') {
        return {
            code: 50310,
            message: '交接班设置加载失败，请稍后重试',
            data: createBasePayload(),
            traceId: `${DEFAULT_TRACE_PREFIX}-error-001`,
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    if (filters.mockState === 'empty') {
        return {
            code: 0,
            message: 'success',
            data: createBasePayload(),
            traceId: `${DEFAULT_TRACE_PREFIX}-empty-001`,
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    return createMockSuccessEnvelope(filters, createBasePayload());
}
function createMockSuccessEnvelope(filters, payload) {
    return {
        code: 0,
        message: 'success',
        data: {
            shiftConfigs: cloneShiftConfigs(payload.shiftConfigs),
            goodsConfigs: cloneGoodsConfigs(payload.goodsConfigs),
            memberOptions: payload.memberOptions.map((item) => ({ ...item })),
        },
        traceId: `${DEFAULT_TRACE_PREFIX}-${filters.mockState === 'empty' ? 'empty' : 'success'}-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function adaptShiftSettingEnvelope(envelope, filters, provider) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '交接班设置加载失败，请稍后重试');
    }
    const data = envelope.data;
    if (!data || !Array.isArray(data.shiftConfigs) || !Array.isArray(data.goodsConfigs) || !Array.isArray(data.memberOptions)) {
        throw new Error('交接班设置响应结构异常，请稍后重试');
    }
    return {
        filters,
        provider,
        shiftConfigs: cloneShiftConfigs(data.shiftConfigs),
        goodsConfigs: cloneGoodsConfigs(data.goodsConfigs),
        memberOptions: data.memberOptions.map((item) => ({ ...item })),
        requestedAt: envelope.timestamp,
        shiftUpdatedAt: resolveLatestUpdatedAt(data.shiftConfigs),
        goodsUpdatedAt: resolveLatestUpdatedAt(data.goodsConfigs),
        audit: [
            `provider=${provider}`,
            `configPath=${SHIFT_SETTING_CONFIG_PATH}`,
            `goodsPath=${SHIFT_SETTING_GOODS_PATH}`,
            `memberPath=${SHIFT_SETTING_MEMBER_PATH}`,
            `campId=${filters.campId}`,
            `mockState=${filters.mockState}`,
            `shiftCount=${data.shiftConfigs.length}`,
            `goodsCount=${data.goodsConfigs.length}`,
            `memberCount=${data.memberOptions.length}`,
            `traceId=${envelope.traceId}`,
        ],
    };
}
async function fetchApiShiftSettingDashboard(filters, signal) {
    const [configPayload, goodsPayload, memberPayload] = await Promise.all([
        postHudson(SHIFT_SETTING_CONFIG_PATH, { campId: filters.campId, pageNum: 1, pageSize: 999 }, signal),
        postHudson(SHIFT_SETTING_GOODS_PATH, { campId: filters.campId, pageNum: 1, pageSize: 999 }, signal),
        postHudson(SHIFT_SETTING_MEMBER_PATH, { campId: filters.campId }, signal),
    ]);
    const memberOptions = adaptMemberOptions(memberPayload);
    const shiftConfigs = asArray(configPayload.list ?? configPayload.records ?? configPayload.data).map((item, index) => adaptApiShiftConfig(item, memberOptions, index));
    const goodsConfigs = asArray(goodsPayload.list ?? goodsPayload.records ?? goodsPayload.data).map((item, index) => adaptApiGoodsItem(item, index));
    return {
        filters,
        provider: 'api',
        shiftConfigs,
        goodsConfigs,
        memberOptions,
        requestedAt: new Date().toISOString(),
        shiftUpdatedAt: resolveLatestUpdatedAt(shiftConfigs),
        goodsUpdatedAt: resolveLatestUpdatedAt(goodsConfigs),
        audit: [
            'provider=api',
            `configPath=${SHIFT_SETTING_CONFIG_PATH}`,
            `goodsPath=${SHIFT_SETTING_GOODS_PATH}`,
            `memberPath=${SHIFT_SETTING_MEMBER_PATH}`,
            `campId=${filters.campId}`,
            `mockState=${filters.mockState}`,
            `shiftCount=${shiftConfigs.length}`,
            `goodsCount=${goodsConfigs.length}`,
            `memberCount=${memberOptions.length}`,
        ],
    };
}
async function postHudson(path, body, signal) {
    const response = await fetch(`${REAL_BASE_URL}${path}`, {
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
        throw new Error(payload?.errorMsg || payload?.errorDetail || payload?.errorCode || `${path} 请求失败，HTTP ${response.status}`);
    }
    if (!payload || payload.data === undefined || payload.data === null) {
        throw new Error(`${path} 响应缺少 data 字段`);
    }
    return payload.data;
}
function adaptApiShiftConfig(value, memberOptions, index) {
    const record = asRecord(value);
    const memberIds = asArray(record.memberIds ?? record.userIds ?? record.shiftUserIds)
        .map((item) => String(item ?? '').trim())
        .filter(Boolean);
    const fallbackMemberNames = readString(record, ['memberNames', 'memberName', 'userNames'])
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean);
    const memberNames = memberIds.length > 0
        ? memberIds
            .map((id) => memberOptions.find((option) => option.value === id)?.label || '')
            .filter(Boolean)
        : fallbackMemberNames;
    return {
        id: readString(record, ['id', 'shiftWorkConfigId']) || `api-shift-${index + 1}`,
        name: readString(record, ['shiftName', 'name', 'workName']) || `班次${index + 1}`,
        startTime: normalizeTime(readString(record, ['startTime', 'beginTime', 'workStartTime'])),
        endTime: normalizeTime(readString(record, ['endTime', 'finishTime', 'workEndTime'])),
        memberIds,
        memberNames,
        updatedAt: readString(record, ['updateTime', 'updatedAt', 'createTime']),
    };
}
function adaptApiGoodsItem(value, index) {
    const record = asRecord(value);
    return {
        id: readString(record, ['id', 'shiftWorkGoodsId']) || `api-goods-${index + 1}`,
        name: readString(record, ['goodsName', 'name']) || `物品${index + 1}`,
        updatedAt: readString(record, ['updateTime', 'updatedAt', 'createTime']),
    };
}
function adaptMemberOptions(payload) {
    const candidates = [...asArray(payload.employees), ...asArray(payload.list), ...asArray(payload.records)];
    const options = candidates
        .map((item) => {
        const record = asRecord(item);
        return {
            value: readString(record, ['userId', 'value', 'id']),
            label: readString(record, ['displayName', 'userName', 'name']),
        };
    })
        .filter((item) => item.value && item.label);
    return options.length > 0 ? options : baseMemberOptions.map((item) => ({ ...item }));
}
function toShiftConfig(draft, index) {
    const memberIds = draft.memberIds.map((item) => item.trim()).filter(Boolean);
    const memberNames = memberIds
        .map((memberId) => baseMemberOptions.find((option) => option.value === memberId)?.label || '')
        .filter(Boolean);
    return {
        id: draft.id?.trim() || `shift-${index + 1}`,
        name: draft.name.trim(),
        startTime: normalizeTime(draft.startTime),
        endTime: normalizeTime(draft.endTime),
        memberIds,
        memberNames,
        updatedAt: DEFAULT_TIMESTAMP,
    };
}
function toShiftGoodsItem(draft, index) {
    return {
        id: draft.id?.trim() || `goods-${index + 1}`,
        name: draft.name.trim(),
        updatedAt: DEFAULT_TIMESTAMP,
    };
}
function resolveLatestUpdatedAt(items) {
    return items[0]?.updatedAt || '-';
}
function validateFilters(filters) {
    if (!filters.campId.trim()) {
        throw new Error('交接班设置缺少门店营地参数');
    }
}
function validateShiftDrafts(drafts) {
    if (drafts.length === 0) {
        throw new Error('请至少保留一条班次配置');
    }
    drafts.forEach((draft, index) => {
        if (!draft.name.trim()) {
            throw new Error(`请填写第 ${index + 1} 条班次名称`);
        }
        if (!draft.startTime.trim()) {
            throw new Error(`请选择第 ${index + 1} 条开始时间`);
        }
        if (!draft.endTime.trim()) {
            throw new Error(`请选择第 ${index + 1} 条结束时间`);
        }
        if (draft.memberIds.length === 0) {
            throw new Error(`请选择第 ${index + 1} 条班次成员`);
        }
    });
}
function validateGoodsDrafts(drafts) {
    if (drafts.length === 0) {
        throw new Error('请至少保留一条交班物品');
    }
    drafts.forEach((draft, index) => {
        if (!draft.name.trim()) {
            throw new Error(`请填写第 ${index + 1} 条物品名称`);
        }
    });
}
function toMockState(value) {
    if (value === 'empty' || value === 'error')
        return value;
    return 'success';
}
function normalizeTime(value) {
    if (!value)
        return '';
    const matched = value.match(/(\d{2}):(\d{2})/);
    return matched ? `${matched[1]}:${matched[2]}` : value;
}
function readString(record, keys) {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'string' && value.trim())
            return value.trim();
    }
    return '';
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function cloneShiftConfigs(items) {
    return items.map((item) => ({
        ...item,
        memberIds: [...item.memberIds],
        memberNames: [...item.memberNames],
    }));
}
function cloneGoodsConfigs(items) {
    return items.map((item) => ({ ...item }));
}
function delay(ms, signal) {
    if (signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
