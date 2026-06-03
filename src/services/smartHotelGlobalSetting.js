import { resolveCurrentCampId } from '../utils/camp';
const SMART_HOTEL_GLOBAL_SETTING_PROVIDER_KEY = 'pms.smartHotelGlobalSettingProvider';
const DEFAULT_MOCK_CAMP_ID = '1796067693589061634';
const DEFAULT_REAL_CAMP_ID = '10001';
const DEFAULT_CATALOG_CAMP_ID = '64';
const DEFAULT_TIMESTAMP = '2026-05-19T16:30:00+08:00';
const checkInGuideEndpoints = [
    '/systemConfigs/get',
    '/smsAccount/get',
    '/select/calChannel4Deposit/get',
    '/smsTemplateMsgConfig/page/get',
    '/roomCategories/page/get',
    '/weiRoomCategories/page/get',
    '/paymentTypes/get/v2',
    '/paymentWays/get',
    '/systemConfig/checkInGuideShowStrategy/get',
];
export function createDefaultSmartHotelGlobalSettingFilters(searchParams = new URLSearchParams()) {
    const provider = getSmartHotelGlobalSettingProviderName();
    return {
        campId: searchParams.get('campId') ||
            (provider === 'api' ? resolveCurrentCampId(DEFAULT_REAL_CAMP_ID) : DEFAULT_MOCK_CAMP_ID),
        mockState: toMockState(searchParams.get('mockState')),
    };
}
export async function fetchSmartHotelGlobalSettingDashboard(filters, signal, providerName = getSmartHotelGlobalSettingProviderName()) {
    validateFilters(filters);
    if (providerName === 'api') {
        return fetchApiSmartHotelGlobalSettingDashboard(filters, signal);
    }
    await waitForMockLatency(signal);
    const envelope = buildMockEnvelope(filters);
    return adaptEnvelope(envelope, providerName, filters.mockState);
}
function getSmartHotelGlobalSettingProviderName() {
    if (typeof window === 'undefined')
        return 'mock';
    return normalizeProviderValue(window.localStorage.getItem(SMART_HOTEL_GLOBAL_SETTING_PROVIDER_KEY)) === 'api'
        ? 'api'
        : 'mock';
}
function buildMockEnvelope(filters) {
    if (filters.mockState === 'error') {
        return {
            code: 50301,
            message: '全局设置数据加载失败，请稍后重试。',
            data: createPayload(),
            traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--quanju-shezhi-error-001',
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    if (filters.mockState === 'empty') {
        return {
            code: 0,
            message: 'success',
            data: {
                ...createPayload(),
                roomTypeSummary: '当前门店暂未同步可配置房型',
                smsTemplateSummary: '短信模板 0 条',
                emptyState: {
                    title: '当前门店暂未同步可配置房型',
                    description: '当前门店暂未同步可配置房型，请先前往房型信息完成房型与门锁绑定。',
                    actionLabel: '前往房型信息',
                    actionPath: '/setting/roomTypeInfo',
                },
            },
            traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--quanju-shezhi-empty-001',
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: createPayload(),
        traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--quanju-shezhi-success-001',
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function createPayload() {
    return {
        saveEnabled: false,
        pageTitle: '全局设置',
        versionLabel: '版本号：v4.10.7',
        tabs: [
            { id: 'rules', label: '入住规则' },
            { id: 'guide', label: '入住指引' },
            { id: 'wifi', label: 'WIFI上网' },
        ],
        alertText: '云端入住登记模式为「仅发送门锁密码」，该模式下无需配置。',
        roomTypeSummary: '4 个房型已同步门锁时效策略',
        smsTemplateSummary: '短信模板 15 条',
        syncLabel: '最近同步：2026-05-19 16:30',
        routes: {
            smartSettings: '/smartHotel/smartSettings',
            roomTypeInfo: '/setting/roomTypeInfo',
            paymentSetting: '/setting/paymentSetting',
            smsSetting: '/setting/balanceAndTemplate',
        },
        requestBody: {
            campId: DEFAULT_MOCK_CAMP_ID,
            endpoints: checkInGuideEndpoints,
        },
        identitySummary: {
            realNameBalance: '实名认证剩余 5 次',
            smsBalance: '短信剩余 50 条',
            channelName: '携程直连',
        },
        paymentMethods: ['微信', '支付宝', '银行卡'],
        smsTemplates: [
            {
                id: 'password',
                title: '获得密码（智能入住）',
                content: '【路客云】您入住的房间 {房源名称}${房间号}，门锁密码：{密码}#；点击 {小程序跳转短链接} 查看入住指引。',
            },
            {
                id: 'real-name',
                title: '实名登记（智能入住）',
                content: '【路客云】您预订的房间可智能入住，点击 {小程序跳转短链接} 完成实名登记并获取门锁密码。',
            },
            {
                id: 'deposit',
                title: '押金提醒',
                content: '【路客云】请在入住前完成押金预授权，退房当天 20:00 自动退还。',
            },
        ],
        flowSteps: ['进入智住小程序', '办理登记', '查看门锁密码', '在线续住'],
        roomPasswordStrategies: [
            {
                id: 'unified',
                title: '所有房源统一密码有效时间',
                description: '入住当天 14:00 生效，退房当天 12:00 失效。',
                selected: true,
            },
            {
                id: 'room-type',
                title: '按房型设置的可入住时间（以该房型最早入住时间、最晚退房时间为准）',
                description: '如房型未设置时间，将默认使用统一有效时间；如需设置，可前往房型信息。',
            },
        ],
        guestVerificationChoices: [
            {
                id: 'real-name',
                title: '公安系统实名认证',
                description: '填写姓名、身份证号码，公安系统实名认证比对核验成功，即可获得入住权限（密码）。',
                selected: true,
            },
            {
                id: 'upload-id-card',
                title: '上传证件正反面，即可获取入住权限（密码）',
            },
            {
                id: 'skip-register',
                title: '不登记，进入智住即可获取入住权限（密码）',
            },
        ],
        registerChoices: [
            { id: 'one-guest', title: '至少登记1人', selected: true, badge: '推荐' },
            { id: 'all-guests', title: '按住宿订单要求，登记全部入住人' },
        ],
        smsSendChoices: [
            {
                id: 'password-only',
                title: '仅发送密码',
                description: '短信示例：您入住的房间{房源名称}${房间号}，门锁密码：{密码}#',
                selected: true,
            },
            {
                id: 'password-and-guide',
                title: '同时发送密码短信和智能入住小程序链接，方便用户返回小程序',
                description: '短信示例：您入住的房间{房源名称}${房间号}，门锁密码：{密码}#，点击{小程序跳转短链接}查看入住指引。',
            },
        ],
        toggles: {
            autoInvite: {
                id: 'autoInvite',
                label: '自动发送入住邀请',
                checked: false,
                disabled: true,
                description: '下单或修改手机号后，自动发送入住登记邀请（虚拟号码需手动发送）。',
            },
            deposit: {
                id: 'deposit',
                label: '收押金',
                checked: false,
                disabled: true,
                description: '押金将在办理退房当日 20:00 自动退还。',
            },
            guestStatus: {
                id: 'guestStatus',
                label: '房客变更入住状态',
                checked: false,
                disabled: true,
                description: '开启后，房客可办理入住、办理退房，同时会更新订单的入住状态。',
            },
            dirtyRoomBlock: {
                id: 'dirtyRoomBlock',
                label: '脏房不允许入住',
                checked: false,
                disabled: true,
                description: '开启后，房间为脏房时，房客不可办理入住或查看密码。',
            },
            earlyPassword: {
                id: 'earlyPassword',
                label: '提前入住生成密码',
                checked: false,
                disabled: true,
                description: '开启后，房客在入住日提前办理入住时，将按实际入住时间生成并展示门锁密码。',
            },
        },
        guideFields: [
            { id: 'notice', label: '入住须知', value: '请确认订单信息，完成身份登记后查看门锁密码。' },
            { id: 'arrival', label: '到店指引', value: '到店后进入智住小程序，按页面提示办理登记。' },
            { id: 'renew', label: '续住说明', value: '如需续住，可在智住小程序发起续住申请。' },
        ],
        wifiFields: [
            { id: 'wifiName', label: 'WIFI名称', value: 'Locals-Guest' },
            { id: 'wifiPassword', label: 'WIFI密码', value: 'locals8888' },
            { id: 'wifiNotice', label: '上网说明', value: '房客可在智住小程序中查看 WIFI 名称与密码。' },
        ],
    };
}
function adaptEnvelope(envelope, provider, state) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '全局设置数据加载失败，请稍后重试。');
    }
    const data = envelope.data;
    if (!data || !Array.isArray(data.tabs) || !Array.isArray(data.smsTemplates)) {
        throw new Error('全局设置数据加载失败，请稍后重试。');
    }
    return {
        ...data,
        provider,
        state,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
    };
}
async function fetchApiSmartHotelGlobalSettingDashboard(filters, signal) {
    const basePayload = createPayload();
    const [systemConfigs, smsAccount, depositChannels, smsTemplates, roomCategories, weiRoomCategories, paymentTypes, paymentWays, showStrategy,] = await Promise.all([
        postHudsonEnvelope('/systemConfigs/get', { campId: filters.campId }, signal),
        postHudsonEnvelope('/smsAccount/get', { campId: filters.campId }, signal),
        postHudsonEnvelope('/select/calChannel4Deposit/get', { campId: filters.campId }, signal),
        postHudsonEnvelope('/smsTemplateMsgConfig/page/get', { campId: filters.campId, sendType: 0, pageNum: 1, pageSize: 100 }, signal),
        postHudsonEnvelope('/roomCategories/page/get', {
            campId: filters.campId,
            pageSize: 999,
            pageNum: 1,
            roomCategoryName: '',
            keyword: '',
            cityIds: [],
            channelId: '',
        }, signal),
        postHudsonEnvelope('/weiRoomCategories/page/get', {
            campId: DEFAULT_CATALOG_CAMP_ID,
            buyCampId: filters.campId,
            roomCategoryTypes: [1],
            goodsTypes: [7],
            pageNum: 1,
            pageSize: 99,
            keyword: '',
        }, signal),
        postHudsonEnvelope('/paymentTypes/get/v2', { campId: filters.campId, bizTypes: [1], isEnable: 1 }, signal),
        postHudsonEnvelope('/paymentWays/get', { campId: filters.campId }, signal),
        postHudsonEnvelope('/systemConfig/checkInGuideShowStrategy/get', { campId: filters.campId }, signal),
    ]);
    const latestMeta = pickLatestMeta([
        systemConfigs,
        smsAccount,
        depositChannels,
        smsTemplates,
        roomCategories,
        weiRoomCategories,
        paymentTypes,
        paymentWays,
        showStrategy,
    ]);
    const roomCategoryRows = asArray(roomCategories.data?.list);
    const roomCategoryCount = readNumber(roomCategories.data?.total, roomCategoryRows.length);
    const smsTemplateRows = asArray(smsTemplates.data?.list);
    const smsTemplateCount = readNumber(smsTemplates.data?.total, smsTemplateRows.length);
    const enabledPaymentWayNames = adaptPaymentWays(paymentWays.data?.paymentWays);
    const guestStatusChecked = readBooleanConfig(systemConfigs.data?.configs, 'hudson.basic.isAutoCheckInAndCheckOut', basePayload.toggles.guestStatus.checked);
    const roomTypeSummary = roomCategoryCount > 0
        ? `${roomCategoryCount} 个房型已同步门锁时效策略`
        : '当前门店暂未同步可配置房型';
    return adaptEnvelope({
        code: 0,
        message: 'success',
        traceId: latestMeta.traceId,
        timestamp: latestMeta.timestamp,
        data: {
            ...basePayload,
            requestBody: {
                campId: filters.campId,
                endpoints: checkInGuideEndpoints,
            },
            roomTypeSummary,
            smsTemplateSummary: `短信模板 ${smsTemplateCount} 条`,
            syncLabel: buildSyncLabel(latestMeta.timestamp),
            identitySummary: {
                realNameBalance: basePayload.identitySummary.realNameBalance,
                smsBalance: `短信剩余 ${readString(smsAccount.data?.curSmsCount, '0')} 条`,
                channelName: deriveChannelName(depositChannels.data?.select, basePayload.identitySummary.channelName),
            },
            paymentMethods: enabledPaymentWayNames.length > 0 ? enabledPaymentWayNames : basePayload.paymentMethods,
            smsTemplates: smsTemplateRows.length > 0
                ? smsTemplateRows.map((item, index) => ({
                    id: readString(item.smsTemplateMsgConfigId, `sms-template-${index + 1}`),
                    title: readString(item.name, basePayload.smsTemplates[index]?.title || `短信模板${index + 1}`),
                    content: readString(item.passContent, basePayload.smsTemplates[index]?.content || '模板内容以短信设置页中的配置为准'),
                }))
                : basePayload.smsTemplates,
            roomPasswordStrategies: adaptRoomPasswordStrategies(basePayload.roomPasswordStrategies, roomCategoryRows),
            smsSendChoices: adaptSmsSendChoices(basePayload.smsSendChoices, smsTemplateRows),
            toggles: {
                ...basePayload.toggles,
                guestStatus: {
                    ...basePayload.toggles.guestStatus,
                    checked: guestStatusChecked,
                },
            },
            emptyState: roomCategoryCount > 0
                ? undefined
                : {
                    title: '当前门店暂未同步可配置房型',
                    description: '当前门店暂未同步可配置房型，请先前往房型信息完成房型与门锁绑定。',
                    actionLabel: '前往房型信息',
                    actionPath: '/setting/roomTypeInfo',
                },
        },
    }, 'api', 'success');
}
async function postHudsonEnvelope(endpoint, body, signal) {
    const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: buildApiHeaders(),
        body: JSON.stringify(body),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok || !payload) {
        throw new Error(payload?.message || `${endpoint} 请求失败，HTTP ${response.status}`);
    }
    if (payload.code !== 0 || payload.data === undefined || payload.data === null) {
        throw new Error(payload.message || `${endpoint} 响应无效`);
    }
    return {
        data: payload.data,
        traceId: payload.traceId,
        timestamp: payload.timestamp,
    };
}
function buildApiHeaders() {
    const headers = { 'content-type': 'application/json' };
    if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('pms_token')?.trim();
        if (token)
            headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}
function adaptPaymentWays(items) {
    return asArray(items)
        .filter((item) => item?.isEnable !== 0)
        .map((item) => readString(item.paymentWayName, ''))
        .filter(Boolean);
}
function deriveChannelName(items, fallback) {
    const channelNames = asArray(items)
        .filter((item) => item?.isOpen === 1)
        .map((item) => readString(item.channelName, ''))
        .filter(Boolean);
    if (channelNames.some((name) => name.includes('携程')))
        return '携程直连';
    if (channelNames.some((name) => name.includes('美团')))
        return '美团直连';
    return fallback;
}
function adaptRoomPasswordStrategies(baseStrategies, roomCategoryRows) {
    const timePairs = new Set(roomCategoryRows
        .map((row) => readRoomCategoryTimePair(row))
        .filter((value) => value.length > 0));
    if (timePairs.size <= 1) {
        return baseStrategies.map((item, index) => ({
            ...item,
            selected: index === 0,
        }));
    }
    return baseStrategies.map((item, index) => ({
        ...item,
        selected: index === 1,
    }));
}
function readRoomCategoryTimePair(row) {
    const firstProduct = asArray(row.roomCategoryProductInfoViews)[0];
    const earliest = readNumber(firstProduct?.earliestCheckInTime, readNumber(row.earliestCheckInTime, -1));
    const latest = readNumber(firstProduct?.latestCheckOutTime, readNumber(row.latestCheckOutTime, -1));
    return earliest >= 0 || latest >= 0 ? `${earliest}-${latest}` : '';
}
function adaptSmsSendChoices(baseChoices, templateRows) {
    if (templateRows.length === 0)
        return baseChoices;
    const passwordTemplate = templateRows.find((item) => readString(item.name, '').includes('获得密码'));
    if (!passwordTemplate)
        return baseChoices;
    return baseChoices.map((item, index) => index === 0
        ? {
            ...item,
            description: readString(passwordTemplate.passContent, item.description || ''),
        }
        : item);
}
function readBooleanConfig(configs, configKey, fallback) {
    const config = asArray(configs).find((item) => item?.configKey === configKey);
    if (!config)
        return fallback;
    return toBoolean(config.configValue, fallback);
}
function toBoolean(value, fallback) {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().replace(/^"|"$/g, '');
        if (normalized === '1' || normalized.toLowerCase() === 'true')
            return true;
        if (normalized === '0' || normalized.toLowerCase() === 'false')
            return false;
    }
    return fallback;
}
function pickLatestMeta(responses) {
    return responses.reduce((latest, current) => {
        const latestTime = Date.parse(latest.timestamp || '');
        const currentTime = Date.parse(current.timestamp || '');
        if (Number.isNaN(latestTime))
            return current;
        if (Number.isNaN(currentTime))
            return latest;
        return currentTime >= latestTime ? current : latest;
    });
}
function buildSyncLabel(timestamp) {
    if (!timestamp)
        return '最近同步：--';
    const value = timestamp.replace('T', ' ').replace(/([+-]\d{2}:\d{2}|Z)$/, '');
    return `最近同步：${value.slice(0, 16)}`;
}
function readString(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
function readNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function validateFilters(filters) {
    if (!filters.campId.trim()) {
        throw new Error('全局设置门店参数不正确。');
    }
}
function toMockState(value) {
    return value === 'empty' || value === 'error' ? value : 'success';
}
function normalizeProviderValue(value) {
    return value === 'api' || value === 'real' ? 'api' : value === 'mock' ? 'mock' : undefined;
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
