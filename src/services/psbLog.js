export const PSB_LOG_ENDPOINT = 'https://hudson-prod.localhome.cn/checkinGuestPsbLog/page/get';
export const PSB_LOG_STORE_ENDPOINT = 'https://hudson-prod.localhome.cn/select/poi/page/get';
export const PSB_LOG_MOCK_ENDPOINT = '/psb/log/mock/page/get';
const TASK_ID = 'zhihui-jiudian--zhizhu-yu-yingjian--shangbao-rizhi';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_TIMESTAMP = '2026-05-19T18:30:00+08:00';
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PSB_TYPES = ['4', '5'];
export async function fetchPsbLogPageData(query, signal) {
    const provider = query.provider ?? resolvePsbLogProvider();
    const state = query.mockState ?? readPsbLogMockState();
    const request = buildPsbLogRequest(query);
    const storeRequest = buildPsbStoreRequest(query.campId);
    const [storeResult, logResult] = await Promise.allSettled([
        fetchPsbStoreOptions({ campId: query.campId, provider, mockState: state }, signal),
        fetchPsbLogs(query, signal),
    ]);
    if (logResult.status === 'rejected')
        throw logResult.reason;
    if (storeResult.status === 'rejected')
        throw storeResult.reason;
    const logs = unwrapEnvelope(logResult.value);
    const stores = unwrapEnvelope(storeResult.value);
    const diagnostics = {
        endpoint: provider === 'api' ? PSB_LOG_ENDPOINT : PSB_LOG_MOCK_ENDPOINT,
        provider,
        state,
        traceId: logResult.value.traceId,
        request,
        storeRequest,
    };
    writeDiagnostics(diagnostics);
    return {
        view: {
            stores,
            rows: logs.list.map(adaptPsbLogRow),
            pagination: logs.pagination,
            refreshedAt: logResult.value.timestamp,
        },
        diagnostics,
    };
}
export async function fetchPsbLogs(query, signal) {
    const provider = query.provider ?? resolvePsbLogProvider();
    const request = buildPsbLogRequest(query);
    return provider === 'api'
        ? fetchApiPsbLogs(query, request, signal)
        : fetchMockPsbLogs(query, request, signal);
}
export async function fetchPsbStoreOptions(input, signal) {
    const provider = input.provider ?? resolvePsbLogProvider();
    const request = buildPsbStoreRequest(input.campId);
    return provider === 'api'
        ? fetchApiPsbStores(input, request, signal)
        : fetchMockPsbStores(input, request, signal);
}
export async function retryPsbLogReport(row, query, signal) {
    const provider = query.provider ?? resolvePsbLogProvider();
    if (provider === 'api') {
        throw new Error('重新上报接口待后端确认，请先使用当前页面查询链路复核。');
    }
    await delay(180, signal);
    if ((query.mockState ?? readPsbLogMockState()) === 'error') {
        throw new Error('重新上报失败，请稍后重试');
    }
    return {
        ...row,
        stateCode: '1',
        stateLabel: '成功',
        remark: '重新上报成功，公安回执已更新',
        receiptMessage: '公安回执：重新上报成功',
        reportTime: '2026-05-19 18:42:10',
    };
}
export function resolvePsbLogRuntimeConfig(location) {
    const params = readLocationParams(location);
    const provider = params.get('psbLogProvider');
    const mockState = params.get('mockState');
    return {
        provider: provider === 'api' || provider === 'mock' ? provider : undefined,
        mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error'
            ? mockState
            : undefined,
    };
}
export function resolvePsbLogProvider() {
    const configured = readRuntimeConfig('pms.psbLogProvider') || import.meta.env.VITE_PSB_LOG_PROVIDER;
    return configured === 'api' ? 'api' : 'mock';
}
export function createDefaultPsbLogQuery(location) {
    const params = readLocationParams(location);
    return {
        campId: params.get('campId') || DEFAULT_CAMP_ID,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
    };
}
function readLocationParams(location) {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.toString())
        return searchParams;
    const hashQueryIndex = location.hash.indexOf('?');
    if (hashQueryIndex === -1)
        return searchParams;
    return new URLSearchParams(location.hash.slice(hashQueryIndex + 1));
}
export const psbLogBizTypeOptions = [
    { label: '入住', value: '1' },
    { label: '续住', value: '2' },
    { label: '换房', value: '3' },
    { label: '退房', value: '4' },
    { label: '未知', value: '5' },
    { label: '删除入住登记', value: '6' },
];
export const psbLogStateOptions = [
    { label: '失败', value: '0' },
    { label: '成功', value: '1' },
];
function readPsbLogMockState() {
    const configured = readRuntimeConfig('pms.psbLogMockState') || import.meta.env.VITE_PSB_LOG_MOCK_STATE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
async function fetchMockPsbStores(input, _request, signal) {
    await delay(80, signal);
    if ((input.mockState ?? readPsbLogMockState()) === 'error') {
        return {
            code: 50001,
            message: '门店列表加载失败，请稍后重试',
            data: [],
            traceId: `mock-${TASK_ID}-store-error-001`,
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: mockStores,
        traceId: `mock-${TASK_ID}-store-list-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
async function fetchApiPsbStores(_input, request, signal) {
    let response;
    try {
        response = await fetch(PSB_LOG_STORE_ENDPOINT, {
            method: 'POST',
            credentials: 'include',
            signal,
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(request),
        });
    }
    catch (error) {
        throw new Error(`门店列表加载失败，请稍后重试：${readErrorMessage(error)}`, { cause: error });
    }
    if (!response.ok) {
        throw new Error(`门店列表加载失败，请稍后重试：HTTP ${response.status}`);
    }
    const payload = (await response.json());
    if (payload.success !== true) {
        return {
            code: 50001,
            message: payload.errorMsg || payload.errorDetail || '门店列表加载失败，请稍后重试',
            data: [],
            traceId: `api-${TASK_ID}-store-error`,
            timestamp: new Date().toISOString(),
        };
    }
    const stores = Array.isArray(payload.data?.list)
        ? payload.data.list.map((row) => ({
            label: readString(row.poiName, '未命名门店'),
            value: readString(row.poiId, ''),
        }))
        : [];
    return {
        code: 0,
        message: 'success',
        data: stores,
        traceId: `api-${TASK_ID}-store-list`,
        timestamp: new Date().toISOString(),
    };
}
async function fetchMockPsbLogs(query, _request, signal) {
    await delay(120, signal);
    const state = query.mockState ?? readPsbLogMockState();
    if (state === 'error') {
        return {
            code: 50001,
            message: '上报日志加载失败，请稍后重试',
            data: createBackendData([], query),
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    const rows = state === 'empty' ? [] : filterMockRows(mockRows, query);
    return {
        code: 0,
        message: 'success',
        data: createBackendData(rows, query),
        traceId: `mock-${TASK_ID}-${state === 'empty' ? 'empty' : 'list'}-001`,
        timestamp: DEFAULT_TIMESTAMP,
    };
}
async function fetchApiPsbLogs(query, request, signal) {
    let response;
    try {
        response = await fetch(PSB_LOG_ENDPOINT, {
            method: 'POST',
            credentials: 'include',
            signal,
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(request),
        });
    }
    catch (error) {
        throw new Error(`上报日志加载失败，请稍后重试：${readErrorMessage(error)}`, { cause: error });
    }
    if (!response.ok) {
        throw new Error(`上报日志加载失败，请稍后重试：HTTP ${response.status}`);
    }
    const payload = (await response.json());
    if (payload.success !== true) {
        return {
            code: 50001,
            message: payload.errorMsg || payload.errorDetail || '上报日志加载失败，请稍后重试',
            data: createBackendData([], query),
            traceId: `api-${TASK_ID}-business-error`,
            timestamp: new Date().toISOString(),
        };
    }
    const rows = Array.isArray(payload.data?.list) ? payload.data.list : [];
    return {
        code: 0,
        message: 'success',
        data: {
            list: rows,
            pagination: {
                page: Number(payload.data?.pageNum ?? payload.data?.current ?? query.page),
                pageSize: Number(payload.data?.size ?? query.pageSize),
                total: Number(payload.data?.total ?? rows.length),
            },
        },
        traceId: `api-${TASK_ID}-list`,
        timestamp: new Date().toISOString(),
    };
}
function createBackendData(rows, query) {
    return {
        list: rows,
        pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total: rows.length,
        },
    };
}
function buildPsbLogRequest(query) {
    const request = {
        campId: query.campId,
        pageNum: query.page,
        pageSize: query.pageSize,
        current: query.page,
        psbType: DEFAULT_PSB_TYPES,
    };
    if (query.storeId)
        request.poiId = query.storeId;
    if (query.keyword.trim())
        request.keyword = query.keyword.trim();
    if (query.bizType)
        request.bizType = query.bizType;
    if (query.state)
        request.state = query.state;
    return request;
}
function buildPsbStoreRequest(campId) {
    return {
        campId,
        pageSize: 999,
        pageNum: 1,
        channelId: 0,
        isAvailability: '1',
    };
}
function unwrapEnvelope(envelope) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '上报日志加载失败，请稍后重试');
    }
    return envelope.data;
}
function adaptPsbLogRow(row) {
    const bizTypeCode = readString(row.bizType, '5');
    const stateCode = readString(row.state, '0');
    return {
        id: readString(row.id, `psb-log-${readString(row.orderNo, 'unknown')}`),
        guestName: readString(row.name ?? row.guestName, '-'),
        phone: readString(row.mobile ?? row.phone, '-'),
        idCard: readString(row.idCard ?? row.cardNo, '-'),
        roomNo: readString(row.roomNo, '-'),
        orderSource: readString(row.channelName ?? row.orderSource, '-'),
        orderNo: readString(row.orderNo, '-'),
        channelOrderNo: readString(row.channelOrderNo, '-'),
        reportTime: readString(row.uploadTime ?? row.reportTime, '-'),
        bizTypeCode,
        bizTypeLabel: readString(bizTypeLabelMap[bizTypeCode], '未知'),
        stateCode,
        stateLabel: readString(stateLabelMap[stateCode], '失败'),
        remark: readString(row.remark, '-'),
        receiptMessage: readString(row.receiptMessage ?? row.remark, '-'),
        storeId: readString(row.poiId, ''),
    };
}
function filterMockRows(rows, query) {
    return rows.filter((row) => {
        if (query.storeId && readString(row.poiId, '') !== query.storeId)
            return false;
        if (query.keyword.trim()) {
            const keyword = query.keyword.trim();
            const haystack = [
                row.name,
                row.guestName,
                row.mobile,
                row.phone,
                row.roomNo,
                row.orderNo,
                row.channelOrderNo,
            ]
                .map((value) => readString(value, ''))
                .join(' ');
            if (!haystack.includes(keyword))
                return false;
        }
        if (query.bizType && readString(row.bizType, '') !== query.bizType)
            return false;
        if (query.state && readString(row.state, '') !== query.state)
            return false;
        if (query.startDate || query.endDate) {
            const rowDate = readString(row.uploadTime ?? row.reportTime, '').slice(0, 10);
            if (query.startDate && rowDate < query.startDate)
                return false;
            if (query.endDate && rowDate > query.endDate)
                return false;
        }
        return true;
    });
}
function writeDiagnostics(diagnostics) {
    if (typeof window === 'undefined')
        return;
    window.localStorage.setItem('pms.psbLog.lastRequest', JSON.stringify(diagnostics));
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function readString(value, fallback) {
    if (value === null || value === undefined || value === '')
        return fallback;
    return String(value);
}
function readErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function delay(ms, signal) {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('请求已取消', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('请求已取消', 'AbortError'));
        }, { once: true });
    });
}
const bizTypeLabelMap = {
    '1': '入住',
    '2': '续住',
    '3': '换房',
    '4': '退房',
    '5': '未知',
    '6': '删除入住登记',
};
const stateLabelMap = {
    '0': '失败',
    '1': '成功',
};
const mockStores = [
    { label: '全部门店', value: '' },
    { label: '天蓉名宿公寓(前海壹方城宝安中心店)', value: '1796425098638573570' },
];
const mockRows = [
    {
        id: 'psb-log-001',
        guestName: '刘诗雨',
        mobile: '13800138001',
        idCard: '440301199401011286',
        roomNo: 'A-1801',
        channelName: '携程',
        orderNo: '2053550785075990529',
        channelOrderNo: 'ctrip-2053550785075990529',
        uploadTime: '2026-05-18 09:12:44',
        bizType: '4',
        state: '0',
        remark: '公安回执：证件照片缺失',
        receiptMessage: '公安回执：证件照片缺失',
        poiId: '1796425098638573570',
    },
    {
        id: 'psb-log-002',
        guestName: '周醒醒',
        mobile: '13800138002',
        idCard: '440301199210193218',
        roomNo: 'A-1203',
        channelName: '美团民宿',
        orderNo: '2053550785075990530',
        channelOrderNo: 'meituan-2053550785075990530',
        uploadTime: '2026-05-19 11:30:00',
        bizType: '1',
        state: '1',
        remark: '公安回执：上报成功',
        receiptMessage: '公安回执：上报成功',
        poiId: '1796425098638573570',
    },
    {
        id: 'psb-log-003',
        guestName: '陈北木',
        mobile: '13800138003',
        idCard: '440301198805265419',
        roomNo: 'A-903',
        channelName: '路客云',
        orderNo: '2053550785075990531',
        channelOrderNo: 'lk-2053550785075990531',
        uploadTime: '2026-05-17 20:18:09',
        bizType: '2',
        state: '1',
        remark: '公安回执：续住同步完成',
        receiptMessage: '公安回执：续住同步完成',
        poiId: '1796425098638573570',
    },
];
