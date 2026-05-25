const HUDSON_BASE_URL = 'https://hudson-prod.localhome.cn';
const TASK_ID = 'shezhi--tongyong-shezhi--jiyibi-shezhi';
const DEFAULT_CAMP_ID = '1796067693589061634';
const WRITE_EXPEND_SETTING_PROVIDER_KEY = 'pms.writeExpendSetting.provider';
const WRITE_EXPEND_SETTING_STATE_KEY = 'pms.writeExpendSetting.mockState';
const WRITE_EXPEND_SETTING_DELAY_KEY = 'pms.writeExpendSetting.mockDelayMs';
const WRITE_EXPEND_SETTING_LAST_REQUEST_KEY = 'pms.writeExpendSetting.lastRequest';
const WRITE_EXPEND_SETTING_CUSTOM_ITEMS_KEY = 'pms.writeExpendSetting.customItems';
export const WRITE_EXPEND_SETTING_LIST_PATH = '/paymentTypes/get/v2';
export const WRITE_EXPEND_SETTING_CREATE_PATH = '/paymentTypes/custom/create';
const groupCatalog = [
    { groupType: 1, name: '住宿' },
    { groupType: 2, name: '餐饮' },
    { groupType: 3, name: '商超' },
    { groupType: 4, name: '娱乐' },
    { groupType: 5, name: '场地' },
];
const incomeItemNamesByGroup = {
    1: [
        '房费',
        '清洁费',
        '押金',
        '加床',
        '加人',
        '退订扣款',
        '损坏赔偿',
        '其他收入',
        '长租租金',
        '长租押金',
        '加时(延迟退房)',
        '餐饮',
        '旅游服务',
        '押金抵扣',
        '钟点房',
        '开票金额',
        '长租宽带费',
        '长租公告费',
        '长租卫生费',
        '长租物管费',
        '长租停车费',
        '长租钥匙费用',
        '长租水费',
        '长租电费',
        '长租延期费',
        '长租账单',
        '押金延期费',
    ],
    2: [],
    3: [],
    4: [],
    5: [],
};
const expenseItemNamesByGroup = {
    1: ['退款', '采购', '维修费', '水费', '电费', '燃气费', '保洁费', '物业费', '宽带费', '其他支出'],
    2: [],
    3: [],
    4: [],
    5: [],
};
const paymentWaysSeed = [
    { paymentWayId: '1', paymentWayName: '平台代收', isCustom: 0, isEnable: 1 },
    { paymentWayId: '2', paymentWayName: '微信', isCustom: 0, isEnable: 1 },
    { paymentWayId: '3', paymentWayName: '支付宝', isCustom: 0, isEnable: 1 },
    { paymentWayId: '4', paymentWayName: '现金', isCustom: 0, isEnable: 1 },
];
export function resolveWriteExpendSettingProviderName() {
    if (typeof window === 'undefined')
        return 'mock';
    return window.localStorage.getItem(WRITE_EXPEND_SETTING_PROVIDER_KEY) === 'api' ? 'api' : 'mock';
}
export function resolveWriteExpendSettingQuery(search) {
    const params = new URLSearchParams(search);
    const mockState = params.get('mockState');
    const tab = params.get('tab');
    const rawMockDelayMs = params.get('mockDelayMs');
    const mockDelayMs = rawMockDelayMs === null ? undefined : Number(rawMockDelayMs);
    return {
        mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
        tab: tab === 'income' || tab === 'expense' ? tab : undefined,
        mockDelayMs: typeof mockDelayMs === 'number' && Number.isFinite(mockDelayMs) && mockDelayMs >= 0 ? mockDelayMs : undefined,
    };
}
export function resolveWriteExpendSettingCampId() {
    if (typeof window === 'undefined')
        return DEFAULT_CAMP_ID;
    const fromQuery = new URLSearchParams(window.location.search).get('campId');
    const fromStorage = window.localStorage.getItem('pmsCampId');
    const fromEnv = import.meta.env.VITE_PMS_CAMP_ID;
    return fromQuery || fromStorage || fromEnv || DEFAULT_CAMP_ID;
}
export async function fetchWriteExpendSettingPageData(overrides = {}) {
    const provider = overrides.provider ?? resolveWriteExpendSettingProviderName();
    const requestBody = {
        campId: overrides.campId ?? resolveWriteExpendSettingCampId(),
        bizTypes: [3],
    };
    if (provider === 'api') {
        return fetchWriteExpendSettingPageDataFromApi(requestBody);
    }
    const state = overrides.mockState ?? resolveWriteExpendSettingMockState();
    const envelope = await fetchMockWriteExpendSettingEnvelope(state, overrides.mockDelayMs ?? resolveWriteExpendSettingDelayMs());
    return adaptEnvelope('list', provider, state, requestBody, envelope);
}
export async function createWriteExpendSettingItem(input) {
    const provider = input.provider ?? resolveWriteExpendSettingProviderName();
    const requestBody = {
        campId: input.campId ?? resolveWriteExpendSettingCampId(),
        groupType: input.groupType,
        groupName: input.groupName,
        paymentTypeName: input.name.trim(),
        isIncome: input.tab === 'income' ? 1 : 0,
        bizType: 3,
    };
    if (!requestBody.paymentTypeName) {
        throw new Error('请输入项目名称后再完成新增');
    }
    if (provider === 'api') {
        persistDiagnostics({
            provider,
            action: 'create',
            state: 'error',
            endpoint: `${HUDSON_BASE_URL}${WRITE_EXPEND_SETTING_CREATE_PATH}`,
            requestBody,
            traceId: `api-${TASK_ID}-create-unavailable`,
            timestamp: new Date().toISOString(),
            totalItems: 0,
            disabledCount: 0,
        });
        throw new Error('当前环境暂不支持在线新增，请稍后重试');
    }
    const storedItems = readStoredCustomItems();
    const normalizedName = normalizeName(requestBody.paymentTypeName);
    const duplicate = createMockPaymentGroups(storedItems)
        .flatMap((group) => group.paymentTypes)
        .some((item) => normalizeName(item.paymentTypeName) === normalizedName &&
        item.groupType === input.groupType &&
        Boolean(item.isIncome) === (input.tab === 'income'));
    if (duplicate) {
        throw new Error('同一业态下已存在同名项目，请更换名称后重试');
    }
    const nextCustomItem = {
        id: `custom-${input.tab}-${Date.now()}`,
        name: requestBody.paymentTypeName,
        groupType: input.groupType,
        groupName: input.groupName,
        tab: input.tab,
        createdAt: new Date().toISOString(),
        isEnabled: true,
    };
    writeStoredCustomItems([...storedItems, nextCustomItem]);
    const nextData = await fetchWriteExpendSettingPageData({
        provider: 'mock',
        mockState: input.mockState ?? 'success',
        campId: requestBody.campId,
    });
    const traceId = `mock-${TASK_ID}-create-${String(nextData.tabs[input.tab].totalItems).padStart(3, '0')}`;
    return buildPageData({
        provider: nextData.provider,
        action: 'create',
        state: nextData.state,
        endpoint: `${HUDSON_BASE_URL}${WRITE_EXPEND_SETTING_CREATE_PATH}`,
        requestBody,
        payload: buildPayloadFromPageData(nextData),
        traceId,
        timestamp: new Date().toISOString(),
    });
}
function buildPayloadFromPageData(pageData) {
    return {
        paymentGroups: pageData.availableGroups.map((group) => {
            const incomeItems = pageData.tabs.income.groups.find((item) => item.groupType === group.groupType)?.items ?? [];
            const expenseItems = pageData.tabs.expense.groups.find((item) => item.groupType === group.groupType)?.items ?? [];
            const disabledItems = pageData.disabledItems.filter((item) => item.groupType === group.groupType);
            return {
                groupType: group.groupType,
                groupTypeName: group.name,
                paymentTypes: [...incomeItems, ...expenseItems, ...disabledItems].map((item) => ({
                    paymentTypeId: item.id,
                    paymentTypeName: item.name,
                    ignoreOrderGetItem: item.ignoreOrderGetItem,
                    isCustom: item.isCustom ? 1 : 0,
                    isIncome: item.isIncome ? 1 : 0,
                    isEnable: item.isEnabled ? 1 : 0,
                    bizType: item.bizType,
                    groupType: item.groupType,
                })),
            };
        }),
        paymentWays: pageData.paymentWays.map((name, index) => ({
            paymentWayId: String(index + 1),
            paymentWayName: name,
            isCustom: 0,
            isEnable: 1,
        })),
    };
}
async function fetchWriteExpendSettingPageDataFromApi(requestBody) {
    const response = await fetch(`${HUDSON_BASE_URL}${WRITE_EXPEND_SETTING_LIST_PATH}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
    });
    const payload = (await response.json());
    if (!response.ok || payload.success === false) {
        persistDiagnostics({
            provider: 'api',
            action: 'list',
            state: 'error',
            endpoint: `${HUDSON_BASE_URL}${WRITE_EXPEND_SETTING_LIST_PATH}`,
            requestBody,
            traceId: `api-${TASK_ID}-list-http-${response.status}`,
            timestamp: new Date().toISOString(),
            totalItems: 0,
            disabledCount: 0,
        });
        throw new Error(payload.errorMsg || '记一笔设置加载失败，请稍后重试');
    }
    return buildPageData({
        provider: 'api',
        action: 'list',
        state: 'success',
        endpoint: `${HUDSON_BASE_URL}${WRITE_EXPEND_SETTING_LIST_PATH}`,
        requestBody,
        payload: {
            paymentGroups: payload.data?.paymentGroups ?? [],
            paymentWays: paymentWaysSeed,
        },
        traceId: `api-${TASK_ID}-list-001`,
        timestamp: new Date().toISOString(),
    });
}
async function fetchMockWriteExpendSettingEnvelope(state, delayMs) {
    await delay(delayMs);
    if (state === 'error') {
        return {
            code: 50001,
            message: '记一笔设置加载失败，请稍后重试',
            data: {
                paymentGroups: [],
                paymentWays: [],
            },
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: '2026-05-19T19:18:22+08:00',
        };
    }
    if (state === 'empty') {
        return {
            code: 0,
            message: 'success',
            data: {
                paymentGroups: groupCatalog.map((group) => ({
                    groupType: group.groupType,
                    groupTypeName: group.name,
                    paymentTypes: [],
                })),
                paymentWays: paymentWaysSeed,
            },
            traceId: `mock-${TASK_ID}-empty-001`,
            timestamp: '2026-05-19T19:18:22+08:00',
        };
    }
    return {
        code: 0,
        message: 'success',
        data: {
            paymentGroups: createMockPaymentGroups(readStoredCustomItems()),
            paymentWays: paymentWaysSeed,
        },
        traceId: `mock-${TASK_ID}-success-001`,
        timestamp: '2026-05-19T19:18:22+08:00',
    };
}
function createMockPaymentGroups(customItems) {
    return groupCatalog.map((group) => {
        const incomeItems = (incomeItemNamesByGroup[group.groupType] ?? []).map((name, index) => createPaymentType({
            paymentTypeId: `income-${group.groupType}-${index + 1}`,
            paymentTypeName: name,
            groupType: group.groupType,
            isIncome: 1,
            isEnable: 1,
            isCustom: 0,
            bizType: 3,
        }));
        const expenseItems = (expenseItemNamesByGroup[group.groupType] ?? []).map((name, index) => createPaymentType({
            paymentTypeId: `expense-${group.groupType}-${index + 1}`,
            paymentTypeName: name,
            groupType: group.groupType,
            isIncome: 0,
            isEnable: 1,
            isCustom: 0,
            bizType: 3,
        }));
        const groupCustomItems = customItems
            .filter((item) => item.groupType === group.groupType)
            .map((item) => createPaymentType({
            paymentTypeId: item.id,
            paymentTypeName: item.name,
            groupType: item.groupType,
            isIncome: item.tab === 'income' ? 1 : 0,
            isEnable: item.isEnabled ? 1 : 0,
            isCustom: 1,
            bizType: 3,
        }));
        return {
            groupType: group.groupType,
            groupTypeName: group.name,
            paymentTypes: [...incomeItems, ...expenseItems, ...groupCustomItems],
        };
    });
}
function createPaymentType(input) {
    return {
        paymentTypeId: input.paymentTypeId,
        paymentTypeName: input.paymentTypeName,
        ignoreOrderGetItem: 1,
        isCustom: input.isCustom,
        isIncome: input.isIncome,
        isEnable: input.isEnable,
        bizType: input.bizType,
        groupType: input.groupType,
    };
}
function adaptEnvelope(action, provider, state, requestBody, envelope) {
    if (envelope.code !== 0) {
        persistDiagnostics({
            provider,
            action,
            state: 'error',
            endpoint: `${HUDSON_BASE_URL}${WRITE_EXPEND_SETTING_LIST_PATH}`,
            requestBody,
            traceId: envelope.traceId,
            timestamp: envelope.timestamp,
            totalItems: 0,
            disabledCount: 0,
        });
        throw new Error(envelope.message || '记一笔设置请求失败');
    }
    return buildPageData({
        provider,
        action,
        state,
        endpoint: `${HUDSON_BASE_URL}${action === 'create' ? WRITE_EXPEND_SETTING_CREATE_PATH : WRITE_EXPEND_SETTING_LIST_PATH}`,
        requestBody,
        payload: envelope.data,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
    });
}
function buildPageData(input) {
    const incomeGroups = createEmptyGroups();
    const expenseGroups = createEmptyGroups();
    const disabledItems = [];
    for (const paymentGroup of input.payload.paymentGroups) {
        for (const paymentType of paymentGroup.paymentTypes) {
            const nextItem = {
                id: paymentType.paymentTypeId,
                name: paymentType.paymentTypeName,
                groupType: paymentGroup.groupType,
                groupName: paymentGroup.groupTypeName,
                isDefault: paymentType.isCustom !== 1,
                isCustom: paymentType.isCustom === 1,
                isIncome: paymentType.isIncome === 1,
                isEnabled: paymentType.isEnable === 1,
                bizType: paymentType.bizType,
                ignoreOrderGetItem: paymentType.ignoreOrderGetItem,
            };
            if (!nextItem.isEnabled) {
                disabledItems.push(nextItem);
                continue;
            }
            const targetGroups = nextItem.isIncome ? incomeGroups : expenseGroups;
            const targetGroup = targetGroups.find((group) => group.groupType === paymentGroup.groupType);
            if (targetGroup) {
                targetGroup.items.push(nextItem);
            }
        }
    }
    const diagnostics = {
        provider: input.provider,
        action: input.action,
        state: input.state,
        endpoint: input.endpoint,
        requestBody: input.requestBody,
        traceId: input.traceId,
        timestamp: input.timestamp,
        totalItems: incomeGroups.reduce((total, group) => total + group.items.length, 0) + expenseGroups.reduce((total, group) => total + group.items.length, 0),
        disabledCount: disabledItems.length,
    };
    persistDiagnostics(diagnostics);
    return {
        provider: input.provider,
        action: input.action,
        state: input.state,
        endpoint: input.endpoint,
        requestBody: input.requestBody,
        tabs: {
            income: {
                totalItems: incomeGroups.reduce((total, group) => total + group.items.length, 0),
                groups: incomeGroups,
            },
            expense: {
                totalItems: expenseGroups.reduce((total, group) => total + group.items.length, 0),
                groups: expenseGroups,
            },
        },
        disabledItems,
        availableGroups: groupCatalog.map((group) => ({ groupType: group.groupType, name: group.name })),
        paymentWays: input.payload.paymentWays.filter((item) => item.isEnable === 1).map((item) => item.paymentWayName),
        traceId: input.traceId,
        timestamp: input.timestamp,
        diagnostics,
    };
}
function createEmptyGroups() {
    return groupCatalog.map((group) => ({
        id: `group-${group.groupType}`,
        groupType: group.groupType,
        name: group.name,
        items: [],
    }));
}
function persistDiagnostics(diagnostics) {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem(WRITE_EXPEND_SETTING_LAST_REQUEST_KEY, JSON.stringify(diagnostics));
}
function readStoredCustomItems() {
    if (typeof window === 'undefined')
        return [];
    const rawText = window.localStorage.getItem(WRITE_EXPEND_SETTING_CUSTOM_ITEMS_KEY);
    if (!rawText)
        return [];
    try {
        const parsed = JSON.parse(rawText);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        throw new Error('记一笔设置本地自定义数据损坏，请清理后重试');
    }
}
function writeStoredCustomItems(items) {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem(WRITE_EXPEND_SETTING_CUSTOM_ITEMS_KEY, JSON.stringify(items));
}
function resolveWriteExpendSettingMockState() {
    if (typeof window === 'undefined')
        return 'success';
    const configured = window.localStorage.getItem(WRITE_EXPEND_SETTING_STATE_KEY);
    if (configured === 'success' || configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function resolveWriteExpendSettingDelayMs() {
    if (typeof window === 'undefined')
        return 180;
    const configured = Number(window.localStorage.getItem(WRITE_EXPEND_SETTING_DELAY_KEY) || '');
    if (Number.isFinite(configured) && configured >= 0)
        return configured;
    return 180;
}
function normalizeName(value) {
    return value.replace(/\s+/g, '').toLowerCase();
}
function delay(ms) {
    return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}
