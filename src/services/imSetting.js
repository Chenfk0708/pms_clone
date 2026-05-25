export const IM_PHRASE_GROUP_ENDPOINT = 'https://hudson-prod.localhome.cn/imWordsGroup/tree/get';
export const IM_PHRASE_LIST_ENDPOINT = 'https://hudson-prod.localhome.cn/imWords/page/get';
export const IM_SHORTCUT_GET_ENDPOINT = 'https://hudson-prod.localhome.cn/systemConfigs/user/shortcut/get';
export const IM_SHORTCUT_SAVE_ENDPOINT = '/systemConfigs/user/shortcut/save';
export const IM_COMMONS_ENDPOINT = 'https://hudson-prod.localhome.cn/commons/get';
export const IM_ACCOUNT_ENDPOINT = 'https://hudson-prod.localhome.cn/imYunxinUser/get';
export const IM_EDITION_ENDPOINT = 'https://hudson-prod.localhome.cn/edition/resource/get';
export const IM_MENU_OPTION_ENDPOINT = 'https://hudson-prod.localhome.cn/menu/optionJsons/get';
const MENU_ID = '1848317056370487297';
const DIAGNOSTICS_KEY = 'pms.imSetting.diagnostics';
export async function fetchImSettingView(query, signal) {
    const provider = query.provider ?? resolveImSettingProvider();
    const state = query.mockState ?? resolveImSettingMockState();
    const phraseGroupRequest = { campId: query.campId };
    const phraseListRequest = buildPhraseListRequest(query);
    const shortcutRequest = { userId: query.userId };
    const commonsRequest = { campId: query.campId, code: 'hudson.im.picture.support.channels' };
    const imAccountRequest = { campId: query.campId };
    const editionRequest = { campId: query.campId };
    const menuOptionRequest = { menuIds: [MENU_ID] };
    if (provider === 'mock') {
        await delay(40, signal);
        if (state === 'error') {
            updateImSettingDiagnostics({
                provider,
                state,
                requestSummary: buildRequestSummary(query),
                requests: {
                    phraseGroups: { endpoint: '/imWordsGroup/tree/get', request: phraseGroupRequest },
                    phraseList: { endpoint: '/imWords/page/get', request: phraseListRequest },
                    shortcuts: { endpoint: '/systemConfigs/user/shortcut/get', request: shortcutRequest },
                    commons: { endpoint: '/commons/get', request: commonsRequest },
                    imAccount: { endpoint: '/imYunxinUser/get', request: imAccountRequest },
                    edition: { endpoint: '/edition/resource/get', request: editionRequest },
                    menuOptions: { endpoint: '/menu/optionJsons/get', request: menuOptionRequest },
                },
            });
            throw new Error('会话设置数据加载失败，请重试');
        }
        const filteredPhrases = filterMockPhrases(query, state);
        const normalizedState = state === 'empty' || filteredPhrases.length === 0 ? 'empty' : 'success';
        const view = {
            provider,
            state: normalizedState,
            phraseGroups: mockPhraseGroups,
            phrases: filteredPhrases,
            shortcuts: mockShortcuts,
            supportedChannels: mockSupportedChannels,
            imAccount: mockImAccount,
            version: mockVersion,
        };
        updateImSettingDiagnostics({
            provider,
            state: normalizedState,
            requestSummary: buildRequestSummary(query),
            requests: {
                phraseGroups: { endpoint: '/imWordsGroup/tree/get', request: phraseGroupRequest },
                phraseList: { endpoint: '/imWords/page/get', request: phraseListRequest },
                shortcuts: { endpoint: '/systemConfigs/user/shortcut/get', request: shortcutRequest },
                commons: { endpoint: '/commons/get', request: commonsRequest },
                imAccount: { endpoint: '/imYunxinUser/get', request: imAccountRequest },
                edition: { endpoint: '/edition/resource/get', request: editionRequest },
                menuOptions: { endpoint: '/menu/optionJsons/get', request: menuOptionRequest },
            },
        });
        return view;
    }
    const [groupPayload, phrasePayload, shortcutPayload, commonsPayload, accountPayload, editionPayload, menuPayload] = await Promise.all([
        postJson(IM_PHRASE_GROUP_ENDPOINT, phraseGroupRequest, signal),
        postJson(IM_PHRASE_LIST_ENDPOINT, phraseListRequest, signal),
        postJson(IM_SHORTCUT_GET_ENDPOINT, shortcutRequest, signal),
        postJson(IM_COMMONS_ENDPOINT, commonsRequest, signal),
        postJson(IM_ACCOUNT_ENDPOINT, imAccountRequest, signal),
        postJson(IM_EDITION_ENDPOINT, editionRequest, signal),
        postJson(IM_MENU_OPTION_ENDPOINT, menuOptionRequest, signal),
    ]);
    const groupData = unwrapBusiness(groupPayload);
    const phraseData = unwrapBusiness(phrasePayload);
    const shortcutData = unwrapBusiness(shortcutPayload);
    const commonsData = unwrapBusiness(commonsPayload);
    const accountData = unwrapBusiness(accountPayload);
    const editionData = unwrapBusiness(editionPayload);
    const menuData = unwrapBusiness(menuPayload);
    const phraseGroups = adaptPhraseGroups(groupData);
    const phrases = adaptPhrases(phraseData);
    const shortcuts = adaptShortcuts(shortcutData);
    const supportedChannels = readArray(commonsData.commons).map((item) => readString(item?.codeName, ''));
    const versionModal = readArray(menuData.optionJsonViews)[0]?.optionJson?.versionModals;
    const view = {
        provider,
        state: phrases.length === 0 ? 'empty' : 'success',
        phraseGroups,
        phrases,
        shortcuts,
        supportedChannels: supportedChannels.filter(Boolean),
        imAccount: {
            appKey: readString(accountData.appKey, '-'),
            accid: readString(accountData.accid, '-'),
        },
        version: {
            editionId: readString(editionData.editionId, '-'),
            editionName: readString(editionData.editionName, '-'),
            modalTitle: readString(versionModal?.title, '版本升级提示'),
            modalInfo: readString(versionModal?.info, '当前版本暂无额外说明。'),
            buttons: readArray(versionModal?.buttons).map((button) => ({
                text: readString(button?.buttonText, '查看'),
                type: readString(button?.type, 'default'),
                action: readString(button?.action, ''),
            })),
        },
    };
    updateImSettingDiagnostics({
        provider,
        state: view.state,
        requestSummary: buildRequestSummary(query),
        requests: {
            phraseGroups: { endpoint: '/imWordsGroup/tree/get', request: phraseGroupRequest },
            phraseList: { endpoint: '/imWords/page/get', request: phraseListRequest },
            shortcuts: { endpoint: '/systemConfigs/user/shortcut/get', request: shortcutRequest },
            commons: { endpoint: '/commons/get', request: commonsRequest },
            imAccount: { endpoint: '/imYunxinUser/get', request: imAccountRequest },
            edition: { endpoint: '/edition/resource/get', request: editionRequest },
            menuOptions: { endpoint: '/menu/optionJsons/get', request: menuOptionRequest },
        },
    });
    return view;
}
export async function saveImShortcutSettings(query, shortcuts, signal) {
    await delay(20, signal);
    updateImSettingDiagnostics({
        lastAction: {
            endpoint: IM_SHORTCUT_SAVE_ENDPOINT,
            request: {
                userId: query.userId,
                userShortcuts: shortcuts.map((item) => ({
                    code: item.code,
                    name: item.name,
                    win: item.win,
                    mac: item.mac,
                    isOpen: item.isOpen ? 1 : 0,
                })),
            },
        },
    });
}
export function resolveImSettingProvider() {
    return readRuntimeConfig('pms.imSettingProvider') === 'api' ? 'api' : 'mock';
}
export function resolveImSettingMockState() {
    const state = readRuntimeConfig('pms.imSettingMockState');
    if (state === 'empty' || state === 'error')
        return state;
    return 'success';
}
export function updateImSettingDiagnostics(patch) {
    if (typeof window === 'undefined')
        return;
    const current = readImSettingDiagnostics();
    const next = {
        provider: patch.provider ?? current?.provider ?? resolveImSettingProvider(),
        state: patch.state ?? current?.state ?? resolveImSettingMockState(),
        currentTab: patch.currentTab ?? current?.currentTab ?? 'phrases',
        requestSummary: {
            ...(current?.requestSummary ?? {}),
            ...(patch.requestSummary ?? {}),
        },
        requests: {
            ...(current?.requests ?? {}),
            ...(patch.requests ?? {}),
        },
        lastAction: patch.lastAction ?? current?.lastAction,
    };
    window.localStorage.setItem(DIAGNOSTICS_KEY, JSON.stringify(next));
}
export function readImSettingDiagnostics() {
    if (typeof window === 'undefined')
        return null;
    const raw = window.localStorage.getItem(DIAGNOSTICS_KEY);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function buildPhraseListRequest(query) {
    return {
        campId: query.campId,
        pageNum: 1,
        pageSize: 10,
        keyword: query.keyword.trim(),
        isTemplate: 0,
        imWordsGroupId: query.groupId ?? null,
        scope: 1,
    };
}
function buildRequestSummary(query) {
    return {
        campId: query.campId,
        userId: query.userId,
        keyword: query.keyword.trim(),
        groupId: query.groupId ?? null,
    };
}
function filterMockPhrases(query, state) {
    if (state === 'empty')
        return [];
    const keyword = query.keyword.trim();
    return mockPhrases.filter((item) => {
        if (query.groupId && item.groupId !== query.groupId)
            return false;
        if (!keyword)
            return true;
        return `${item.title}${item.content}${item.groupName}`.includes(keyword);
    });
}
function adaptPhraseGroups(data) {
    const rows = readArray(data.imWordsGroupGetViews);
    return rows.map((item, index) => ({
        id: readString(item?.imWordsGroupId, `api-group-${index + 1}`),
        name: readString(item?.name, `分类${index + 1}`),
        count: readArray(item?.children).length,
    }));
}
function adaptPhrases(data) {
    return readArray(data.list).map((item, index) => ({
        id: readString(item?.imWordsId, `api-phrase-${index + 1}`),
        title: readString(item?.title, `接口常用语 ${index + 1}`),
        content: readString(item?.content, ''),
        groupId: readString(item?.imWordsGroupId, ''),
        groupName: readString(item?.groupName, '未分类'),
        updatedAt: readString(item?.updatedAt, '-'),
    }));
}
function adaptShortcuts(data) {
    return readArray(data.userShortcuts).map((item, index) => ({
        code: readNumber(item?.code, index),
        name: readString(item?.name, `快捷键 ${index + 1}`),
        win: readString(item?.win, '-'),
        mac: readString(item?.mac, '-'),
        isOpen: Number(item?.isOpen) === 1,
    }));
}
async function postJson(url, body, signal) {
    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            signal,
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    }
    catch (error) {
        throw new Error('会话设置数据加载失败，请重试', { cause: error });
    }
    if (!response.ok) {
        throw new Error('会话设置数据加载失败，请重试');
    }
    return (await response.json());
}
function unwrapBusiness(payload) {
    if (payload.success !== true || !payload.data) {
        throw new Error(payload.errorMsg || payload.errorDetail || '会话设置数据加载失败，请重试');
    }
    return payload.data;
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() ?? '';
}
function readArray(value) {
    return Array.isArray(value) ? value : [];
}
function readString(value, fallback) {
    if (typeof value === 'string' && value.trim())
        return value;
    return fallback;
}
function readNumber(value, fallback) {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
}
function delay(ms, signal) {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('会话设置请求已取消', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('会话设置请求已取消', 'AbortError'));
        }, { once: true });
    });
}
const mockPhraseGroups = [
    { id: 'group-checkin', name: '入住前沟通', count: 1 },
    { id: 'group-night', name: '深夜入住', count: 1 },
    { id: 'group-checkout', name: '退房追评', count: 1 },
];
const mockPhrases = [
    {
        id: 'phrase-checkin-parking',
        title: '入住前停车指引',
        content: '停车场位于 3 层，夜间请从东侧电梯厅刷预留门禁码直达前台。',
        groupId: 'group-checkin',
        groupName: '入住前沟通',
        updatedAt: '2026-05-19 18:20:00',
    },
    {
        id: 'phrase-night-checkin',
        title: '深夜入住须知',
        content: '22:00 后请提前发送到店时间，我们会同步门锁密码与夜班接待电话。',
        groupId: 'group-night',
        groupName: '深夜入住',
        updatedAt: '2026-05-19 17:40:00',
    },
    {
        id: 'phrase-checkout-review',
        title: '退房追评邀请',
        content: '感谢入住，欢迎在离店后留下点评，回传截图可领取复住券。',
        groupId: 'group-checkout',
        groupName: '退房追评',
        updatedAt: '2026-05-19 16:55:00',
    },
];
const mockShortcuts = [
    { code: 0, name: '推荐激活键', win: 'Ctrl+Shift+1', mac: 'Command+Shift+1', isOpen: true },
    { code: 1, name: '上一条对话', win: 'Ctrl+Up', mac: 'Command+Up', isOpen: true },
    { code: 2, name: '下一条对话', win: 'Ctrl+Down', mac: 'Command+Down', isOpen: true },
    { code: 9, name: '推荐房源', win: 'Ctrl+Shift+9', mac: 'Command+Shift+9', isOpen: false },
    { code: 10, name: '房态', win: 'Ctrl+Shift+0', mac: 'Command+Shift+0', isOpen: false },
    { code: 11, name: '历史消息', win: 'Ctrl+Shift+H', mac: 'Command+Shift+H', isOpen: true },
];
const mockSupportedChannels = ['爱彼迎 IM 支持发图', '途家 IM 支持发图', '企微 IM 支持发图'];
const mockImAccount = {
    appKey: '8d0514326dbd437d73cf9dc837543884',
    accid: 'prod_0_1796067702522908674',
};
const mockVersion = {
    editionId: '9',
    editionName: '畅享版',
    modalTitle: '畅享版全新上线',
    modalInfo: '升级后可获得更完整的会话设置、快捷键与版本能力编排。',
    buttons: [
        { text: '咨询优惠', type: 'default', action: '2' },
        { text: '续费/升级', type: 'primary', action: '1' },
    ],
};
