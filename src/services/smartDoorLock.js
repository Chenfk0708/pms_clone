const SMART_DOOR_LOCK_PROVIDER_KEY = 'pms.smartDoorLock.provider';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_TIMESTAMP = '2026-05-19T16:03:00+08:00';
const text = {
    loadError: '\u667a\u80fd\u95e8\u9501\u6570\u636e\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
    submitError: '\u95e8\u9501\u8d26\u53f7\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
    accountError: '\u95e8\u9501\u8d26\u53f7\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u8d26\u53f7\u6216\u5bc6\u7801',
    missingCamp: '\u667a\u80fd\u95e8\u9501\u95e8\u5e97\u53c2\u6570\u4e0d\u6b63\u786e',
    missingBrand: '\u8bf7\u9009\u62e9\u95e8\u9501\u54c1\u724c',
    missingUserName: '\u8bf7\u8f93\u5165\u8d26\u53f7',
    missingPassword: '\u8bf7\u8f93\u5165\u5bc6\u7801',
    chooseBrand: '\u8bf7\u9009\u62e9\u95e8\u9501\u54c1\u724c\u6dfb\u52a0\u8d26\u53f7',
    passwordLock: '\u5bc6\u7801\u95e8\u9501',
    cardLock: '\u623f\u5361\u95e8\u9501',
    linkedAccounts: '\u5df2\u7ed1\u5b9a\u8d26\u53f7',
    cardAccounts: '\u623f\u5361\u8054\u52a8\u8d26\u53f7',
    continueBrands: '\u7ee7\u7eed\u65b0\u589e\u54c1\u724c',
    availableBrands: '\u53ef\u63a5\u5165\u54c1\u724c',
    ttlock: '\u901a\u901a\u9501',
    techXia: '\u79d1\u6280\u4fa0',
    guojia: '\u679c\u52a0',
    guomin: '\u56fd\u6c11\u9501',
    ut: '\u4f18\u7279',
    loock: '\u9e7f\u5ba2/\u4e91\u4e01',
    cardSystem: '\u95e8\u5361\u7ba1\u7406\u7cfb\u7edf',
    huixiangjia: '\u6167\u4eab\u4f73',
    huixiangjiaAccount: '\u51e1\u5355/\u6167\u4eab\u4f73\u8d26\u53f7',
    huixiangjiaPassword: '\u51e1\u5355/\u6167\u4eab\u4f73\u5bc6\u7801',
    requestedAt: '\u6700\u8fd1\u540c\u6b65\uff1a2026-05-19 16:03',
    storeMatrix: '\u8def\u5ba2 TS5 \u4e3b\u5e97\u95e8\u9501\u77e9\u9635',
    storeMatrixSummary: '\u540c\u6b65\u5230 26 \u95f4\u623f / \u6700\u8fd1\u540c\u6b65\uff1a2026-05-19 16:03',
    storeMatrixDetail: '\u8d26\u53f7\u72b6\u6001\u7a33\u5b9a\uff0c\u652f\u6301\u5237\u65b0\u5bc6\u7801\u4e0e\u67e5\u770b\u540c\u6b65\u8bb0\u5f55\u3002',
    storeMatrixStatus: '\u8fd0\u884c\u4e2d',
    storeLinkedBy: '\u95e8\u5e97\u7ba1\u7406\u5458\uff1a18123941382',
    guojiaLink: '\u679c\u52a0\u5165\u4f4f\u8054\u52a8',
    guojiaSummary: '\u540c\u6b65\u5230 8 \u95f4\u623f / \u6700\u8fd1\u540c\u6b65\uff1a2026-05-19 11:28',
    guojiaDetail: '\u8bbe\u5907\u79bb\u7ebf\u65f6\u6682\u505c\u540c\u6b65\uff0c\u5f85\u95e8\u9501\u7f51\u5173\u4e0a\u7ebf\u540e\u6062\u590d\u3002',
    guojiaStatus: '\u5f85\u8bbe\u5907\u4e0a\u7ebf',
    deliveryGroup: '\u667a\u6167\u9152\u5e97\u4e13\u5bb6\u4ea4\u4ed8\u7ec4',
    cardDescription: '\u5df2\u5f00\u901a\u540e\u53ef\u7edf\u4e00\u540c\u6b65\u5236\u5361\u8bbe\u5907\u3001\u524d\u53f0\u6388\u6743\u548c\u623f\u5361\u5e93\u5b58\u4fe1\u606f\u3002',
    cardDeviceCount: '\u5df2\u63a5\u5165 3 \u53f0\u5236\u5361\u8bbe\u5907 / 2 \u4e2a\u524d\u53f0\u70b9\u4f4d',
    cardSyncAt: '\u6700\u8fd1\u540c\u6b65\uff1a2026-05-19 15:41',
    cardNotOpened: '\u6682\u672a\u5f00\u901a',
    cardFirstSync: '\u6700\u8fd1\u540c\u6b65\uff1a\u5f85\u9996\u6b21\u63a5\u5165',
    huixiangjiaLinked: '\u6167\u4eab\u4f73\u623f\u5361\u8054\u52a8',
    linkedSummaryCard: '\u540c\u6b65\u5230 12 \u95f4\u623f / \u6700\u8fd1\u540c\u6b65\uff1a2026-05-19 16:03',
    linkedSummaryPassword: '\u540c\u6b65\u5230 18 \u95f4\u623f / \u6700\u8fd1\u540c\u6b65\uff1a2026-05-19 16:03',
    linkedDetailCard: '\u8d26\u53f7\u5df2\u7ed1\u5b9a\uff0c\u53ef\u7ee7\u7eed\u540c\u6b65\u623f\u5361\u548c\u5165\u4f4f\u4fe1\u606f\u3002',
    linkedDetailPassword: '\u8d26\u53f7\u5df2\u7ed1\u5b9a\uff0c\u53ef\u7ee7\u7eed\u540c\u6b65\u95e8\u9501\u5bc6\u7801\u548c\u72b6\u6001\u3002',
    linkedStatus: '\u5df2\u7ed1\u5b9a',
    linkedByPrefix: '\u7ed1\u5b9a\u8d26\u53f7\uff1a',
};
const passwordBrands = [
    { id: 'ttlock', tab: 'password', label: text.ttlock, logo: 'TT', tone: 'blue', action: 'login' },
    { id: 'technology-xia', tab: 'password', label: text.techXia, logo: 'K', tone: 'cyan', action: 'login' },
    { id: 'guojia', tab: 'password', label: text.guojia, logo: 'GJ', tone: 'black', action: 'login' },
    { id: 'guomin', tab: 'password', label: text.guomin, logo: 'GM', tone: 'dark', action: 'login' },
    { id: 'ut-password', tab: 'password', label: text.ut, logo: 'UT', tone: 'red', action: 'login' },
    { id: 'loock', tab: 'password', label: text.loock, logo: 'LK', tone: 'red', action: 'login' },
];
const cardBrands = [
    { id: '999', tab: 'card', label: text.cardSystem, logo: 'CARD', tone: 'blue', action: 'activate' },
    {
        id: '61',
        tab: 'card',
        label: text.huixiangjia,
        logo: 'HXJ',
        tone: 'sky',
        action: 'login',
        accountLabel: text.huixiangjiaAccount,
        passwordLabel: text.huixiangjiaPassword,
    },
];
const successPasswordAccounts = [
    {
        id: 'password-account-ttlock',
        tab: 'password',
        brandId: 'ttlock',
        brandLabel: text.ttlock,
        displayName: text.storeMatrix,
        roomSummary: text.storeMatrixSummary,
        lastSyncLabel: text.storeMatrixDetail,
        statusLabel: text.storeMatrixStatus,
        statusTone: 'connected',
        syncDisabled: false,
        linkedBy: text.storeLinkedBy,
    },
    {
        id: 'password-account-guojia',
        tab: 'password',
        brandId: 'guojia',
        brandLabel: text.guojia,
        displayName: text.guojiaLink,
        roomSummary: text.guojiaSummary,
        lastSyncLabel: text.guojiaDetail,
        statusLabel: text.guojiaStatus,
        statusTone: 'attention',
        syncDisabled: true,
        syncDisabledReason: text.guojiaStatus,
        linkedBy: text.deliveryGroup,
    },
];
export function createDefaultSmartDoorLockQuery(searchParams = new URLSearchParams()) {
    return {
        campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
        tab: toTab(searchParams.get('tab')),
        mockState: toMockState(searchParams.get('mockState')),
    };
}
export async function fetchSmartDoorLockDashboard(query, signal, providerName = getSmartDoorLockProviderName()) {
    validateQuery(query);
    if (providerName === 'api') {
        throw new Error(text.loadError);
    }
    await waitForMockLatency(signal);
    return adaptDashboardEnvelope(buildDashboardEnvelope(query), providerName);
}
export async function submitSmartDoorLockAccount(payload, signal, providerName = getSmartDoorLockProviderName()) {
    validateLoginPayload(payload);
    if (providerName === 'api') {
        throw new Error(text.submitError);
    }
    await waitForMockLatency(signal);
    return adaptAccountEnvelope(buildAccountEnvelope(payload));
}
function getSmartDoorLockProviderName() {
    if (typeof window === 'undefined')
        return 'mock';
    return window.localStorage.getItem(SMART_DOOR_LOCK_PROVIDER_KEY) === 'api' ? 'api' : 'mock';
}
function buildDashboardEnvelope(query) {
    if (query.mockState === 'error') {
        return {
            code: 50301,
            message: text.loadError,
            data: createDashboardPayload(query.tab, 'empty'),
            traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-mensuo-error-001',
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: createDashboardPayload(query.tab, query.mockState === 'empty' ? 'empty' : 'ready'),
        traceId: query.mockState === 'empty'
            ? 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-mensuo-empty-001'
            : 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-mensuo-success-001',
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function createDashboardPayload(activeTab, state) {
    return {
        requestedAt: DEFAULT_TIMESTAMP,
        requestedAtLabel: text.requestedAt,
        activeTab,
        state,
        tabs: [
            {
                key: 'password',
                label: text.passwordLock,
                leadText: text.chooseBrand,
                accountsTitle: text.linkedAccounts,
                accounts: state === 'ready' ? successPasswordAccounts : [],
                brandsTitle: state === 'ready' ? text.continueBrands : text.availableBrands,
                brands: passwordBrands,
            },
            {
                key: 'card',
                label: text.cardLock,
                leadText: text.chooseBrand,
                accountsTitle: text.cardAccounts,
                accounts: [],
                brandsTitle: state === 'ready' ? text.continueBrands : text.availableBrands,
                brands: cardBrands,
            },
        ],
        cardSystemEnabled: false,
        cardSystemSummary: {
            title: text.cardSystem,
            description: text.cardDescription,
            deviceCountLabel: state === 'ready' ? text.cardDeviceCount : text.cardNotOpened,
            lastSyncLabel: state === 'ready' ? text.cardSyncAt : text.cardFirstSync,
        },
        routes: {
            localsMall: '/version/localsMall',
            hardwareMall: '/smartHotel/smartHardware/mall',
            selfCheckin: '/smartHotel/smartHome',
        },
    };
}
function buildAccountEnvelope(payload) {
    const brand = [...passwordBrands, ...cardBrands].find((item) => item.id === payload.brandId);
    if (!brand) {
        return {
            code: 40404,
            message: text.submitError,
            data: createSubmittedAccountPayload(cardBrands[1], payload),
            traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-mensuo-submit-missing-001',
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    if (payload.userName.trim().toLowerCase() === 'error') {
        return {
            code: 42201,
            message: text.accountError,
            data: createSubmittedAccountPayload(brand, payload),
            traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-mensuo-submit-error-001',
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: createSubmittedAccountPayload(brand, payload),
        traceId: `mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-mensuo-submit-${brand.id}-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function createSubmittedAccountPayload(brand, payload) {
    return {
        tab: payload.tab,
        brandId: brand.id,
        brandLabel: brand.label,
        displayName: brand.id === '61' ? text.huixiangjiaLinked : `${brand.label}\u95e8\u9501\u8d26\u53f7`,
        roomSummary: payload.tab === 'card' ? text.linkedSummaryCard : text.linkedSummaryPassword,
        lastSyncLabel: brand.id === '61' ? text.linkedDetailCard : text.linkedDetailPassword,
        statusLabel: text.linkedStatus,
        statusTone: 'connected',
        syncDisabled: false,
        linkedBy: `${text.linkedByPrefix}${payload.userName.trim()}`,
    };
}
function adaptDashboardEnvelope(envelope, provider) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || text.loadError);
    }
    const data = envelope.data;
    if (!data || !Array.isArray(data.tabs) || !data.routes) {
        throw new Error(text.loadError);
    }
    return {
        ...data,
        provider,
        traceId: envelope.traceId,
    };
}
function adaptAccountEnvelope(envelope) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || text.submitError);
    }
    if (!envelope.data || !envelope.data.brandId || !envelope.data.displayName) {
        throw new Error(text.submitError);
    }
    return {
        id: `${envelope.data.brandId}-${envelope.data.tab}-linked`,
        ...envelope.data,
    };
}
function validateQuery(query) {
    if (!query.campId.trim()) {
        throw new Error(text.missingCamp);
    }
}
function validateLoginPayload(payload) {
    if (!payload.brandId.trim())
        throw new Error(text.missingBrand);
    if (!payload.userName.trim())
        throw new Error(text.missingUserName);
    if (!payload.password.trim())
        throw new Error(text.missingPassword);
}
function toMockState(value) {
    return value === 'empty' || value === 'error' ? value : 'success';
}
function toTab(value) {
    return value === 'card' ? 'card' : 'password';
}
async function waitForMockLatency(signal) {
    if (signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');
    await new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, 160);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
