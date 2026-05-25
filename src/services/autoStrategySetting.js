export const AUTO_STRATEGY_SETTING_PROVIDER_KEY = 'pms.autoStrategySetting.provider';
export const AUTO_STRATEGY_SETTING_MOCK_STATE_KEY = 'pms.autoStrategySetting.mockState';
export const AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT = '/systemConfigs/get';
export const AUTO_STRATEGY_SETTING_ORDER_AUTO_PENDING_ENDPOINT = '/systemConfig/orderAutoPendingStrategy';
export const AUTO_STRATEGY_SETTING_ORDER_AUTO_SETTLE_ENDPOINT = '/systemConfig/orderAutoSettleStrategy';
export const AUTO_STRATEGY_SETTING_NEGOTIATE_REFUND_ENDPOINT = '/systemConfig/negotiateRefundAutomaticAcceptStrategy';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_TIMESTAMP = '2026-05-20T10:35:00+08:00';
const TRACE_PREFIX = 'mock-shezhi--tongyong-shezhi--zidong-celue-shezhi';
const ORDER_AUTO_PENDING_CONFIG_KEY = 'hudson.basic.orderAutoPendingStrategy';
const ORDER_AUTO_SETTLE_CONFIG_KEY = 'hudson.basic.orderAutoSettleStrategy';
const NEGOTIATE_REFUND_CONFIG_KEY = 'hudson.basic.negotiateRefundAutomaticAcceptStrategy';
const PENDING_ORDER_OCCUPATION_CONFIG_KEY = 'hudson.basic.pendingOrderOccupationStrategy';
const UNPAID_ORDER_OCCUPATION_CONFIG_KEY = 'hudson.basic.unpaidOrderOccupationStrategy';
const HOURLY_ROOM_OCCUPATION_CONFIG_KEY = 'mock.autoStrategy.hourlyRoomOccupationStrategy';
const ROOM_ASSIGN_STRATEGY_CONFIG_KEY = 'mock.autoStrategy.roomAssignStrategy';
const ROOM_ASSIGN_CURRENT_DAY_EMPTY_CLEAN_CONFIG_KEY = 'mock.autoStrategy.currentDayOrderPreferVacantClean';
const ROOM_ASSIGN_SMART_CONFIG_KEY = 'mock.autoStrategy.smartRoomAssign';
const AUTO_CHECK_IN_ENABLED_CONFIG_KEY = 'mock.autoStrategy.autoCheckInEnabled';
const AUTO_CHECK_IN_TIME_CONFIG_KEY = 'mock.autoStrategy.autoCheckInTime';
const AUTO_CHECK_OUT_ENABLED_CONFIG_KEY = 'mock.autoStrategy.autoCheckOutEnabled';
const AUTO_CHECK_OUT_TIME_CONFIG_KEY = 'mock.autoStrategy.autoCheckOutTime';
const DIRTY_ROOM_STRATEGY_CONFIG_KEY = 'mock.autoStrategy.dirtyRoomStrategy';
const CLEAN_ROOM_AFTER_TASK_CONFIG_KEY = 'mock.autoStrategy.cleanRoomAfterTask';
const tabs = [
    { key: 'orderRules', label: '接单规则' },
    { key: 'roomAutomation', label: '房态自动化' },
    { key: 'inventoryOccupation', label: '库存占用规则' },
];
const orderAutoPendingOptions = [
    { label: '不操作', value: '1' },
    { label: '逾期前自动同意', value: '2' },
    { label: '逾期前自动拒绝', value: '3' },
];
const negotiateRefundOptions = [
    { label: '同意取消', value: '1' },
    { label: '不同意取消', value: '0' },
];
const roomAssignOptions = [
    { label: '不自动排房', value: '0' },
    { label: '随机均匀排房', value: '1' },
    { label: '按房间顺序排房', value: '2', actionText: '设置房间优先级' },
];
const dirtyRoomOptions = [
    { label: '手动设置', value: '1', description: '自行切换脏净，系统不自动更改' },
    { label: '全部房间定时转脏', value: '2', description: '系统将在每日 6:00 后将全部房间自动转脏' },
    {
        label: '在住订单定时转脏（酒店适用）',
        value: '3',
        description: '房间有入住中的订单，系统将在每日 6:00 后自动转脏',
    },
    {
        label: '退房日订单定时转脏（民宿适用)',
        value: '4',
        description: '房间有退房日期为当天的订单，系统将在每日 6:00 后自动转脏',
    },
    { label: '订单办理退房后变脏', value: '5', description: '当订单办理退房后，系统立即将房间自动转脏' },
];
const pendingOrderOccupationOptions = [
    { label: '待接单不占库存', value: '0' },
    { label: '待接单占库存', value: '1' },
];
const unpaidOrderOccupationOptions = [
    { label: '待支付订单不占库存', value: '0' },
    { label: '待支付订单占库存', value: '1' },
];
const hourlyRoomOccupationOptions = [
    { label: '钟点房订单不占库存', value: '0' },
    { label: '钟点房订单占库存', value: '1' },
];
const initialMockConfigs = [
    { configKey: ORDER_AUTO_PENDING_CONFIG_KEY, configValue: '1', source: 'verified' },
    { configKey: ORDER_AUTO_SETTLE_CONFIG_KEY, configValue: '0', source: 'verified' },
    { configKey: NEGOTIATE_REFUND_CONFIG_KEY, configValue: '0', source: 'verified' },
    { configKey: PENDING_ORDER_OCCUPATION_CONFIG_KEY, configValue: '0', source: 'verified' },
    { configKey: UNPAID_ORDER_OCCUPATION_CONFIG_KEY, configValue: '0', source: 'verified' },
    { configKey: HOURLY_ROOM_OCCUPATION_CONFIG_KEY, configValue: '1', source: 'assumed' },
    { configKey: ROOM_ASSIGN_STRATEGY_CONFIG_KEY, configValue: '2', source: 'assumed' },
    { configKey: ROOM_ASSIGN_CURRENT_DAY_EMPTY_CLEAN_CONFIG_KEY, configValue: '0', source: 'assumed' },
    { configKey: ROOM_ASSIGN_SMART_CONFIG_KEY, configValue: '0', source: 'assumed' },
    { configKey: AUTO_CHECK_IN_ENABLED_CONFIG_KEY, configValue: '1', source: 'assumed' },
    { configKey: AUTO_CHECK_IN_TIME_CONFIG_KEY, configValue: '15:00:00', source: 'assumed' },
    { configKey: AUTO_CHECK_OUT_ENABLED_CONFIG_KEY, configValue: '1', source: 'assumed' },
    { configKey: AUTO_CHECK_OUT_TIME_CONFIG_KEY, configValue: '12:00:00', source: 'assumed' },
    { configKey: DIRTY_ROOM_STRATEGY_CONFIG_KEY, configValue: '1', source: 'assumed' },
    { configKey: CLEAN_ROOM_AFTER_TASK_CONFIG_KEY, configValue: '1', source: 'assumed' },
];
let mockConfigs = cloneConfigItems(initialMockConfigs);
export class AutoStrategySettingServiceError extends Error {
    provider;
    endpoint;
    requestBody;
    response;
    constructor(provider, endpoint, requestBody, response) {
        super(response.message);
        this.name = 'AutoStrategySettingServiceError';
        this.provider = provider;
        this.endpoint = endpoint;
        this.requestBody = requestBody;
        this.response = response;
    }
}
export function resolveAutoStrategySettingRuntimeConfig(location) {
    const searchParams = new URLSearchParams(location.search);
    return {
        provider: normalizeProvider(searchParams.get('provider') ?? searchParams.get('autoStrategySettingProvider')) ?? readProvider(),
        mockState: normalizeMockState(searchParams.get('mockState') ?? searchParams.get('autoStrategySettingMockState')) ?? readMockState(),
    };
}
export function createDefaultAutoStrategySettingQuery(runtimeConfig) {
    return {
        campId: DEFAULT_CAMP_ID,
        provider: runtimeConfig.provider,
        mockState: runtimeConfig.mockState,
    };
}
export async function loadAutoStrategySettingViewModel(query, signal) {
    const provider = query.provider ?? 'mock';
    const requestBody = buildBootstrapRequestBody(query);
    await delay(180, signal);
    if (provider === 'api') {
        throw new AutoStrategySettingServiceError(provider, AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT, requestBody, createEnvelope('error', 50301, '自动策略设置实时接口暂未开放，请切换到 mock 数据源'));
    }
    if (query.mockState === 'error') {
        throw new AutoStrategySettingServiceError(provider, AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT, requestBody, createEnvelope('error', 50001, '自动策略设置加载失败，请稍后重试'));
    }
    const responseState = query.mockState === 'empty' ? 'empty' : 'success';
    const response = createEnvelope(responseState, 0, 'success', buildPayload(responseState === 'empty' ? [] : mockConfigs));
    return adaptEnvelope(provider, AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT, requestBody, response, responseState);
}
export async function updateOrderAutoPendingStrategy(query, value, signal) {
    return performMutation(query, AUTO_STRATEGY_SETTING_ORDER_AUTO_PENDING_ENDPOINT, {
        campId: query.campId,
        configKey: ORDER_AUTO_PENDING_CONFIG_KEY,
        configValue: value,
    }, 'update-order-auto-pending-strategy', '住宿订单接单规则已保存', [{ configKey: ORDER_AUTO_PENDING_CONFIG_KEY, configValue: value, source: 'verified' }], signal);
}
export async function updateOrderAutoSettleStrategy(query, checked, signal) {
    return performMutation(query, AUTO_STRATEGY_SETTING_ORDER_AUTO_SETTLE_ENDPOINT, {
        campId: query.campId,
        configKey: ORDER_AUTO_SETTLE_CONFIG_KEY,
        configValue: checked ? '1' : '0',
    }, 'update-order-auto-settle-strategy', '信用住自动结账已保存', [{ configKey: ORDER_AUTO_SETTLE_CONFIG_KEY, configValue: checked ? '1' : '0', source: 'verified' }], signal);
}
export async function updateNegotiateRefundAutomaticAcceptStrategy(query, value, signal) {
    return performMutation(query, AUTO_STRATEGY_SETTING_NEGOTIATE_REFUND_ENDPOINT, {
        campId: query.campId,
        configKey: NEGOTIATE_REFUND_CONFIG_KEY,
        configValue: value,
    }, 'update-negotiate-refund-automatic-accept-strategy', '规则外取消订单设置已保存', [{ configKey: NEGOTIATE_REFUND_CONFIG_KEY, configValue: value, source: 'verified' }], signal);
}
function adaptEnvelope(provider, endpoint, requestBody, response, state) {
    if (response.code !== 0) {
        throw new AutoStrategySettingServiceError(provider, endpoint, requestBody, response);
    }
    const configMap = createConfigMap(response.data.configs);
    return {
        provider,
        state,
        endpoint,
        traceId: response.traceId,
        timestamp: response.timestamp,
        requestBody,
        tabs: cloneTabs(tabs),
        configItems: cloneConfigItems(response.data.configs),
        orderRules: {
            orderAutoPending: {
                title: '住宿订单接单规则',
                description: '设置后，待处理订单过期前5分钟，系统会按照您的设定自动处理订单',
                configKey: ORDER_AUTO_PENDING_CONFIG_KEY,
                value: normalizeOrderAutoPendingValue(configMap[ORDER_AUTO_PENDING_CONFIG_KEY]),
                options: cloneOptions(orderAutoPendingOptions),
            },
            orderAutoSettle: {
                title: '飞猪自动结账',
                description: '开启设置后，客人离店当日自动发起结账',
                configKey: ORDER_AUTO_SETTLE_CONFIG_KEY,
                switchLabel: '信用住自动结账',
                checked: configMap[ORDER_AUTO_SETTLE_CONFIG_KEY] === '1',
            },
            negotiateRefund: {
                title: '携程规则外取消订单设置',
                description: '超过25分钟后未确认，将自动按设置处理',
                configKey: NEGOTIATE_REFUND_CONFIG_KEY,
                value: normalizeNegotiateRefundValue(configMap[NEGOTIATE_REFUND_CONFIG_KEY]),
                options: cloneOptions(negotiateRefundOptions),
            },
        },
        roomAutomation: {
            roomAssign: {
                title: '自动排房设置',
                strategyLabel: '排房策略',
                configKey: ROOM_ASSIGN_STRATEGY_CONFIG_KEY,
                value: normalizeRoomAssignStrategyValue(configMap[ROOM_ASSIGN_STRATEGY_CONFIG_KEY]),
                options: cloneOptions(roomAssignOptions),
                advancedOptions: [
                    {
                        label: '当日订单优先排空净',
                        checked: configMap[ROOM_ASSIGN_CURRENT_DAY_EMPTY_CLEAN_CONFIG_KEY] === '1',
                    },
                    {
                        label: '智能排房',
                        checked: configMap[ROOM_ASSIGN_SMART_CONFIG_KEY] === '1',
                    },
                ],
            },
            autoCheckIn: {
                title: '自动办理入住',
                description: '开启后，订单在入住当天到达指定时间将自助办理入住，变成【入住中】。您仍可以在触发自动操作前，手动办理入住。',
                label: '自动办理入住',
                switchLabel: '自动办理入住开关',
                checked: configMap[AUTO_CHECK_IN_ENABLED_CONFIG_KEY] !== '0',
                time: configMap[AUTO_CHECK_IN_TIME_CONFIG_KEY] ?? '15:00:00',
            },
            autoCheckOut: {
                title: '自动办理退房',
                description: '开启后，订单在离店当天到达指定时间将自助办理退房，变成【已退房】。您仍可以在触发自动操作前，手动办理退房。',
                label: '自动办理退房',
                switchLabel: '自动办理退房开关',
                checked: configMap[AUTO_CHECK_OUT_ENABLED_CONFIG_KEY] !== '0',
                time: configMap[AUTO_CHECK_OUT_TIME_CONFIG_KEY] ?? '12:00:00',
            },
            dirtyRoom: {
                title: '房间转脏策略',
                description: '选择您需要的策略，开启后下个凌晨6:00，系统会自动帮您的房间标记为【脏房】，便于管理脏净。',
                configKey: DIRTY_ROOM_STRATEGY_CONFIG_KEY,
                value: normalizeDirtyRoomStrategyValue(configMap[DIRTY_ROOM_STRATEGY_CONFIG_KEY]),
                options: cloneOptions(dirtyRoomOptions),
            },
            cleanRoom: {
                title: '房间转净策略',
                switchLabel: '保洁任务完成后房间自动转净',
                checked: configMap[CLEAN_ROOM_AFTER_TASK_CONFIG_KEY] !== '0',
            },
        },
        inventoryOccupation: {
            pendingOrder: {
                title: '待接单占库存设置',
                description: '1.可同步待接单的渠道有：美团民宿、小猪、木鸟、途家、美团酒店；\n2.设置“占库存”，待接单会占库存，但不会自动排房；\n3.设置“不占库存”，待接单不会占库存，订单量多时，可能会导致超售。',
                configKey: PENDING_ORDER_OCCUPATION_CONFIG_KEY,
                value: normalizeInventoryOccupationValue(configMap[PENDING_ORDER_OCCUPATION_CONFIG_KEY], '0'),
                options: cloneOptions(pendingOrderOccupationOptions),
            },
            unpaidOrder: {
                title: '待支付订单占库存设置',
                description: '1.可同步待支付订单的渠道有：美团民宿、途家、小猪、木鸟、飞猪、抖音来客、booking、微信小程序；\n2.设置“占库存”，待支付订单会占库存，但不会自动排房；\n3.设置“不占库存”，待支付订单不会占库存，订单量多时，可能会导致超售。',
                configKey: UNPAID_ORDER_OCCUPATION_CONFIG_KEY,
                value: normalizeInventoryOccupationValue(configMap[UNPAID_ORDER_OCCUPATION_CONFIG_KEY], '0'),
                options: cloneOptions(unpaidOrderOccupationOptions),
            },
            hourlyRoom: {
                title: '钟点房订单占库存设置',
                description: '',
                configKey: HOURLY_ROOM_OCCUPATION_CONFIG_KEY,
                value: normalizeInventoryOccupationValue(configMap[HOURLY_ROOM_OCCUPATION_CONFIG_KEY], '1'),
                options: cloneOptions(hourlyRoomOccupationOptions),
            },
        },
        emptyState: response.data.emptyState,
    };
}
async function performMutation(query, endpoint, requestBody, lastAction, statusMessage, patchItems, signal) {
    await delay(150, signal);
    const provider = query.provider ?? 'mock';
    if (provider === 'api') {
        throw new AutoStrategySettingServiceError(provider, endpoint, requestBody, createEnvelope('error', 50302, '自动策略设置保存接口暂未开放，请切换到 mock 数据源'));
    }
    mockConfigs = mergeConfigItems(mockConfigs, patchItems);
    const viewModel = adaptEnvelope(provider, endpoint, buildBootstrapRequestBody(query), createEnvelope('success', 0, 'success', buildPayload(mockConfigs)), 'success');
    return {
        viewModel,
        statusMessage,
        lastAction,
        endpoint,
        requestBody,
    };
}
function buildBootstrapRequestBody(query) {
    return {
        campId: query.campId,
    };
}
function buildPayload(configs) {
    return {
        configs: cloneConfigItems(configs),
        emptyState: {
            title: '当前暂无自动策略配置',
            description: '请稍后刷新或检查门店策略配置',
            actionText: '重新加载',
        },
    };
}
function createEnvelope(state, code, message, data = buildPayload([])) {
    return {
        code,
        message,
        data,
        traceId: `${TRACE_PREFIX}-${state}`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function createConfigMap(configs) {
    return configs.reduce((current, item) => {
        current[item.configKey] = item.configValue;
        return current;
    }, {});
}
function mergeConfigItems(currentConfigs, patchItems) {
    const currentMap = new Map(currentConfigs.map((item) => [item.configKey, item]));
    for (const patchItem of patchItems) {
        currentMap.set(patchItem.configKey, { ...patchItem });
    }
    return Array.from(currentMap.values()).map((item) => ({ ...item }));
}
function cloneTabs(source) {
    return source.map((item) => ({ ...item }));
}
function cloneConfigItems(source) {
    return source.map((item) => ({ ...item }));
}
function cloneOptions(source) {
    return source.map((item) => ({ ...item }));
}
function normalizeProvider(value) {
    if (value === 'mock' || value === 'api')
        return value;
    return null;
}
function normalizeMockState(value) {
    if (value === 'success' || value === 'empty' || value === 'error')
        return value;
    return null;
}
function normalizeOrderAutoPendingValue(value) {
    if (value === '1' || value === '2' || value === '3')
        return value;
    return '1';
}
function normalizeNegotiateRefundValue(value) {
    return value === '1' ? '1' : '0';
}
function normalizeInventoryOccupationValue(value, fallback) {
    if (value === '0' || value === '1')
        return value;
    return fallback;
}
function normalizeRoomAssignStrategyValue(value) {
    if (value === '0' || value === '1' || value === '2')
        return value;
    return '2';
}
function normalizeDirtyRoomStrategyValue(value) {
    if (value === '1' || value === '2' || value === '3' || value === '4' || value === '5')
        return value;
    return '1';
}
function readProvider() {
    if (typeof window === 'undefined')
        return 'mock';
    return normalizeProvider(window.localStorage.getItem(AUTO_STRATEGY_SETTING_PROVIDER_KEY)) ?? 'mock';
}
function readMockState() {
    if (typeof window === 'undefined')
        return 'success';
    return normalizeMockState(window.localStorage.getItem(AUTO_STRATEGY_SETTING_MOCK_STATE_KEY)) ?? 'success';
}
async function delay(ms, signal) {
    await new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        if (!signal)
            return;
        signal.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
