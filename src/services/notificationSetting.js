export const NOTIFICATION_SETTING_PROVIDER_KEY = 'pms.notificationSetting.provider';
export const NOTIFICATION_SETTING_MOCK_STATE_KEY = 'pms.notificationSetting.mockState';
export const NOTIFICATION_SETTING_ENDPOINT = '/setting/wechatPushSetting/bootstrap';
export const NOTIFICATION_AUTHORITY_LIST_PATH = '/userAuthority/notification/get';
export const NOTIFICATION_AUTHORITY_EXCLUDE_PATH = '/userAuthority/exclude';
export const NOTIFICATION_SETTING_TARGET_URL = 'https://minsubao.localhome.cn/setting/wechatPushSetting';
const DEFAULT_TIMESTAMP = '2026-05-20T10:35:00+08:00';
const TRACE_PREFIX = 'mock-shezhi--tongyong-shezhi--tongzhi-shezhi';
const DEFAULT_CAMP_ID = '10001';
const QR_CODE_DATA_URL = 'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="136" height="136" viewBox="0 0 136 136">
      <rect width="136" height="136" rx="8" fill="#ffffff"/>
      <rect x="8" y="8" width="120" height="120" rx="6" fill="#f3f5fb" stroke="#d8deef"/>
      <rect x="18" y="18" width="28" height="28" rx="4" fill="#111827"/>
      <rect x="90" y="18" width="28" height="28" rx="4" fill="#111827"/>
      <rect x="18" y="90" width="28" height="28" rx="4" fill="#111827"/>
      <rect x="58" y="58" width="20" height="20" rx="4" fill="#4f67ff"/>
      <rect x="54" y="18" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="68" y="18" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="54" y="32" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="68" y="32" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="54" y="90" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="68" y="90" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="82" y="62" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="94" y="74" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="82" y="86" width="10" height="10" rx="2" fill="#111827"/>
    </svg>
  `);
const initialStore = {
    followedAccounts: [],
    items: [
        {
            key: 'order',
            title: '订单通知',
            description: '新订单/取消订单/待接单/退款申请等提醒;',
            toggles: {
                pcApp: true,
                wechat: true,
            },
        },
        {
            key: 'storeAlert',
            title: '门店预警',
            description: '渠道账号过期/渠道账号即将过期/退款失败/渠道房源关联异常/房态房价同步渠道失败/重单等提醒;',
            toggles: {
                pcApp: true,
                wechat: true,
            },
        },
        {
            key: 'storeUpdate',
            title: '门店动态',
            description: '人员变更/自定义设置变更/交接班等提醒',
            toggles: {
                pcApp: true,
                wechat: true,
            },
        },
        {
            key: 'im',
            title: 'IM消息通知',
            description: '有新IM会话消息时，有小红点和系统弹框提醒',
            toggles: {
                pcApp: true,
            },
        },
    ],
};
let mockStore = cloneStore(initialStore);
export class NotificationSettingServiceError extends Error {
    provider;
    request;
    response;
    constructor(provider, request, response) {
        super(response.message);
        this.name = 'NotificationSettingServiceError';
        this.provider = provider;
        this.request = request;
        this.response = response;
    }
}
export function resolveNotificationSettingRuntimeConfig(location) {
    const searchParams = new URLSearchParams(location.search);
    return {
        provider: normalizeProvider(searchParams.get('provider') ?? searchParams.get('notificationSettingProvider')) ?? readProvider(),
        mockState: normalizeMockState(searchParams.get('mockState') ?? searchParams.get('notificationSettingMockState')) ?? readMockState(),
    };
}
export function createDefaultNotificationSettingQuery(config) {
    return {
        provider: config.provider,
        mockState: config.mockState,
    };
}
export async function loadNotificationSettingViewModel(query, signal) {
    const provider = query.provider ?? 'mock';
    const request = buildRequest(query);
    const requestedState = query.mockState ?? 'success';
    if (provider === 'api') {
        return fetchApiNotificationSetting(query, signal);
    }
    await delay(180, signal);
    if (requestedState === 'error') {
        throw new NotificationSettingServiceError(provider, request, createEnvelope('error', 50001, '通知设置加载失败，请稍后重试'));
    }
    const responseState = requestedState === 'empty' ? 'empty' : 'success';
    const payload = buildPayload(responseState);
    const response = createEnvelope(responseState, 0, 'success', payload);
    return adaptEnvelope(provider, request, response, responseState);
}
export async function markNotificationAccountFollowed(query, signal) {
    await delay(120, signal);
    if (mockStore.followedAccounts.length === 0) {
        mockStore = {
            ...mockStore,
            followedAccounts: [
                {
                    accountId: 'wx-mp-001',
                    accountName: '路客云通知助手',
                    receivedAt: '2026-05-20 10:40',
                },
            ],
        };
    }
    return {
        viewModel: await loadNotificationSettingViewModel({ ...query, mockState: 'success' }, signal),
        statusMessage: '已刷新关注状态，当前可接收公众号通知。',
    };
}
export async function refreshNotificationFollowStatus(query, signal) {
    await delay(120, signal);
    return {
        viewModel: await loadNotificationSettingViewModel({ ...query, mockState: 'success' }, signal),
        statusMessage: mockStore.followedAccounts.length > 0 ? '关注状态已更新。' : '已刷新关注状态，当前暂无已关注公众号。',
    };
}
export async function toggleNotificationChannel(query, channel, nextChecked, signal) {
    if ((query.provider ?? 'mock') === 'api') {
        const current = await fetchApiNotificationSetting(query, signal);
        const authorityIds = current.items
            .filter((item) => item.toggles[channel] !== undefined)
            .map((item) => item.authorityIds?.[channel])
            .filter((authorityId) => Boolean(authorityId));
        await updateApiNotificationExcludes(authorityIds, !nextChecked, signal);
        return {
            viewModel: await fetchApiNotificationSetting(query, signal),
            statusMessage: `${channelLabelMap[channel]}总开关已${nextChecked ? '开启' : '关闭'}。`,
        };
    }
    await delay(80, signal);
    mockStore = {
        ...mockStore,
        items: mockStore.items.map((item) => item.toggles[channel] === undefined
            ? cloneItem(item)
            : {
                ...item,
                toggles: {
                    ...item.toggles,
                    [channel]: nextChecked,
                },
            }),
    };
    return {
        viewModel: await loadNotificationSettingViewModel({ ...query, mockState: 'success' }, signal),
        statusMessage: `${channelLabelMap[channel]}总开关已${nextChecked ? '开启' : '关闭'}。`,
    };
}
export async function toggleNotificationItem(query, itemKey, channel, nextChecked, signal) {
    if ((query.provider ?? 'mock') === 'api') {
        const current = await fetchApiNotificationSetting(query, signal);
        const currentItem = current.items.find((item) => item.key === itemKey);
        const authorityId = currentItem?.authorityIds?.[channel];
        if (!currentItem || !authorityId) {
            throw new NotificationSettingServiceError(query.provider ?? 'api', { ...buildRequest(query), itemKey, channel, nextChecked }, createEnvelope('error', 40404, '未找到可切换的通知项。'));
        }
        await updateApiNotificationExcludes([authorityId], !nextChecked, signal);
        return {
            viewModel: await fetchApiNotificationSetting(query, signal),
            statusMessage: `${currentItem.title}${channelLabelMap[channel]}已${nextChecked ? '开启' : '关闭'}。`,
        };
    }
    await delay(80, signal);
    const currentItem = mockStore.items.find((item) => item.key === itemKey);
    if (!currentItem || currentItem.toggles[channel] === undefined) {
        throw new NotificationSettingServiceError(query.provider ?? 'mock', { ...buildRequest(query), itemKey, channel, nextChecked }, createEnvelope('error', 40404, '未找到可切换的通知项。'));
    }
    mockStore = {
        ...mockStore,
        items: mockStore.items.map((item) => item.key !== itemKey
            ? cloneItem(item)
            : {
                ...item,
                toggles: {
                    ...item.toggles,
                    [channel]: nextChecked,
                },
            }),
    };
    return {
        viewModel: await loadNotificationSettingViewModel({ ...query, mockState: 'success' }, signal),
        statusMessage: `${currentItem.title}${channelLabelMap[channel]}已${nextChecked ? '开启' : '关闭'}。`,
    };
}
function buildRequest(query) {
    const request = {
        provider: query.provider ?? 'mock',
        mockState: query.mockState ?? 'success',
    };
    if (request.provider === 'api') {
        request.campId = resolveCampId();
    }
    return request;
}
function buildPayload(state) {
    const items = state === 'empty' ? [] : mockStore.items.map(cloneItem);
    return {
        intro: {
            title: '扫码关注公众号【路客云】，快速通过微信推送订单、房态',
            detailButtonText: '查看接受微信通知公众号',
        },
        qrCode: {
            alt: '路客云微信公众号二维码',
            imageDataUrl: QR_CODE_DATA_URL,
        },
        followSummary: {
            accounts: mockStore.followedAccounts.map(cloneAccount),
            hint: mockStore.followedAccounts.length > 0 ? '已关注的公众号会在此处展示，可直接确认接收通知状态。' : '当前暂无已关注公众号，请扫码关注后刷新状态。',
        },
        modules: [
            createChannelModule('PC\\APP推送', 'pcApp', items, {
                order: 1624,
                storeAlert: 1625,
                storeUpdate: 1626,
                im: 1627,
            }),
            createChannelModule('公众号推送', 'wechat', items, {
                order: 1628,
                storeAlert: 1629,
                storeUpdate: 1630,
            }),
        ],
    };
}
function createChannelModule(moduleName, channel, items, authorityIds) {
    return {
        moduleName,
        children: items
            .filter((item) => item.toggles[channel] !== undefined)
            .map((item) => ({
            authorityId: authorityIds[item.key] ?? 0,
            authorityName: item.title,
            remark: item.description,
            isSelected: Boolean(item.toggles[channel]),
        })),
    };
}
async function fetchApiNotificationSetting(query, signal) {
    const request = buildRequest(query);
    const response = await fetch(`/api${NOTIFICATION_AUTHORITY_LIST_PATH}`, {
        method: 'POST',
        credentials: 'include',
        headers: createJsonHeaders(),
        body: JSON.stringify({ campId: request.campId }),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok || isFailedResponse(payload) || !payload?.data) {
        throw new NotificationSettingServiceError('api', request, createEnvelope('error', payload?.code ?? response.status, extractErrorMessage(payload) || '通知设置加载失败，请稍后重试'));
    }
    return adaptEnvelope('api', request, {
        code: 0,
        message: payload.message || 'success',
        data: normalizeApiPayload(payload.data),
        traceId: payload.traceId || 'api-user-authority-notification-get',
        timestamp: payload.timestamp || new Date().toISOString(),
    }, 'success');
}
async function updateApiNotificationExcludes(authorityIds, excluded, signal) {
    if (authorityIds.length === 0)
        return;
    const requestBody = {
        campId: resolveCampId(),
        authorityIds,
    };
    const response = await fetch(`/api${NOTIFICATION_AUTHORITY_EXCLUDE_PATH}`, {
        method: excluded ? 'POST' : 'DELETE',
        credentials: 'include',
        headers: createJsonHeaders(),
        body: JSON.stringify(requestBody),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok || isFailedResponse(payload)) {
        throw new NotificationSettingServiceError('api', requestBody, createEnvelope('error', payload?.code ?? response.status, extractErrorMessage(payload) || '通知设置更新失败，请稍后重试'));
    }
}
function adaptEnvelope(provider, request, response, state) {
    if (response.code !== 0) {
        throw new NotificationSettingServiceError(provider, request, response);
    }
    const items = mapItemsFromModules(response.data.modules);
    return {
        provider,
        state,
        endpoint: provider === 'api' ? NOTIFICATION_AUTHORITY_LIST_PATH : NOTIFICATION_SETTING_ENDPOINT,
        traceId: response.traceId,
        timestamp: response.timestamp,
        request,
        intro: response.data.intro,
        qrCode: response.data.qrCode,
        followSummary: {
            accounts: response.data.followSummary.accounts.map(cloneAccount),
            hint: response.data.followSummary.hint,
        },
        channels: [
            {
                key: 'pcApp',
                title: 'PC\\APP推送',
                enabled: items.filter((item) => item.toggles.pcApp !== undefined).every((item) => item.toggles.pcApp === true),
            },
            {
                key: 'wechat',
                title: '公众号推送',
                subtitle: '（请先扫码关注公众号）',
                enabled: items.filter((item) => item.toggles.wechat !== undefined).every((item) => item.toggles.wechat === true),
            },
        ],
        items,
    };
}
function mapItemsFromModules(modules) {
    const itemMap = new Map();
    for (const item of mockStore.items) {
        itemMap.set(item.key, {
            key: item.key,
            title: item.title,
            description: item.description,
            toggles: {},
        });
    }
    for (const module of modules) {
        const channel = module.moduleName === '公众号推送' ? 'wechat' : 'pcApp';
        for (const child of module.children ?? []) {
            const itemKey = authorityNameMap[child.authorityName] ?? createAuthorityItemKey(child);
            const current = itemMap.get(itemKey) ??
                {
                    key: itemKey,
                    title: child.authorityName,
                    description: child.remark ?? '',
                    toggles: {},
                };
            current.toggles[channel] = child.isSelected;
            current.authorityIds = {
                ...current.authorityIds,
                [channel]: String(child.authorityId),
            };
            itemMap.set(itemKey, current);
        }
    }
    return Array.from(itemMap.values()).sort((left, right) => (itemOrder[left.key] ?? 999) - (itemOrder[right.key] ?? 999) || left.title.localeCompare(right.title));
}
function createAuthorityItemKey(item) {
    return String(item.authorityCode || item.authorityId || item.authorityName);
}
function normalizeApiPayload(data) {
    return {
        intro: data.intro ?? {
            title: '扫码关注公众号【路客云】，快速通过微信推送订单、房态',
            detailButtonText: '查看接受微信通知公众号',
        },
        qrCode: data.qrCode ?? {
            alt: '路客云微信公众号二维码',
            imageDataUrl: QR_CODE_DATA_URL,
        },
        followSummary: data.followSummary ?? {
            accounts: [],
            hint: '当前暂无已关注公众号，请扫码关注后刷新状态。',
        },
        modules: splitApiAuthoritiesByChannel(data.modules ?? []),
    };
}
function splitApiAuthoritiesByChannel(modules) {
    const pcApp = [];
    const wechat = [];
    for (const module of modules) {
        const children = module.items ?? module.children ?? [];
        for (const child of children) {
            const channel = resolveAuthorityChannel(child, module.moduleName);
            const normalized = {
                ...child,
                isSelected: child.isSelected ?? !Boolean(child.excluded),
                remark: child.remark ?? '',
            };
            if (channel === 'wechat') {
                wechat.push(normalized);
            }
            else {
                pcApp.push(normalized);
            }
        }
    }
    return [
        { moduleName: 'PC\\APP推送', children: pcApp },
        { moduleName: '公众号推送', children: wechat },
    ];
}
function resolveAuthorityChannel(item, moduleName) {
    const code = item.authorityCode ?? '';
    if (/wechat|weixin|wx|公众号/i.test(code) || moduleName === '公众号推送')
        return 'wechat';
    return 'pcApp';
}
function createEnvelope(state, code, message, data) {
    return {
        code,
        message,
        data: data ?? buildPayload(state === 'error' ? 'success' : state),
        traceId: `${TRACE_PREFIX}-${state}-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function cloneStore(store) {
    return {
        followedAccounts: store.followedAccounts.map(cloneAccount),
        items: store.items.map(cloneItem),
    };
}
function cloneAccount(account) {
    return { ...account };
}
function cloneItem(item) {
    return {
        ...item,
        toggles: { ...item.toggles },
    };
}
function delay(ms, signal) {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
function normalizeProvider(value) {
    if (value === 'api' || value === 'real')
        return 'api';
    return value === 'mock' ? value : undefined;
}
function normalizeMockState(value) {
    return value === 'success' || value === 'empty' || value === 'error' ? value : undefined;
}
function readProvider() {
    if (typeof window === 'undefined') {
        return 'mock';
    }
    return (normalizeProvider(window.localStorage.getItem(NOTIFICATION_SETTING_PROVIDER_KEY)) ??
        normalizeProvider(window.localStorage.getItem('pmsNotificationSettingProvider')) ??
        normalizeProvider(import.meta.env.VITE_NOTIFICATION_SETTING_PROVIDER) ??
        normalizeProvider(import.meta.env.VITE_PMS_NOTIFICATION_SETTING_PROVIDER) ??
        'mock');
}
function readMockState() {
    if (typeof window === 'undefined') {
        return 'success';
    }
    return normalizeMockState(window.localStorage.getItem(NOTIFICATION_SETTING_MOCK_STATE_KEY)) ?? 'success';
}
const channelLabelMap = {
    pcApp: 'PC\\APP推送',
    wechat: '公众号推送',
};
const authorityNameMap = {
    订单通知: 'order',
    门店预警: 'storeAlert',
    门店动态: 'storeUpdate',
    'IM消息通知': 'im',
};
const itemOrder = {
    order: 1,
    storeAlert: 2,
    storeUpdate: 3,
    im: 4,
};
function createJsonHeaders() {
    const headers = new Headers({ 'content-type': 'application/json' });
    const token = readRuntimeConfig('pms_token');
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    return headers;
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
        return '';
    return String(payload.message || payload.errorMsg || payload.errorDetail || payload.errorCode || '');
}
function resolveCampId() {
    return (readRuntimeConfig('pmsCampId') ||
        readRuntimeConfig('pms.currentCampId') ||
        readCampIdFromStoredObject('pms.currentCamp') ||
        readCampIdFromStoredObject('pms.camp') ||
        import.meta.env.VITE_PMS_CAMP_ID ||
        DEFAULT_CAMP_ID);
}
function readCampIdFromStoredObject(key) {
    const raw = readRuntimeConfig(key);
    if (!raw)
        return '';
    try {
        const value = JSON.parse(raw);
        return String(value.campId ?? value.id ?? '');
    }
    catch {
        return '';
    }
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key) || '';
}
