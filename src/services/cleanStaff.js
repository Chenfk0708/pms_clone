export const CLEAN_STAFF_LIST_PATH = '/cleaner/page/get';
export const CLEAN_STAFF_STORES_PATH = '/select/poi/page/get';
export const CLEAN_STAFF_SAVE_PATH = '/cleaner/save';
export const CLEAN_STAFF_EXPORT_PATH = '/cleaner/export';
export const CLEAN_STAFF_PROVIDER = 'api';
const tracePrefix = 'mock-fangtai--baojie-guanli--baojie-renyuan';
const generatedAt = '2026-05-18T10:00:00+08:00';
const stores = [
    { id: 'all', name: '全部门店' },
    { id: '1796425098638573570', name: '天落会宿公寓(前海壹方城宝安中心店)' },
    { id: 'poi-qianhai-002', name: '天落会宿公寓(前海湾店)' },
];
const rawMembers = [
    {
        cleanerId: 'cleaner-001',
        cleanerName: '李清清',
        mobile: '138****6120',
        poiId: '1796425098638573570',
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
        workStatus: 'onDuty',
        roleName: '店长保洁',
        roomScopes: ['观影大床房', '顶层套房'],
        todayTaskNum: 8,
        completedTaskNum: 6,
        overdueTaskNum: 0,
        serviceScore: 98,
        lastTaskTime: '2026-05-18 13:20',
    },
    {
        cleanerId: 'cleaner-002',
        cleanerName: '李小满',
        mobile: '136****9051',
        poiId: 'poi-qianhai-002',
        poiName: '天落会宿公寓(前海湾店)',
        workStatus: 'onDuty',
        roleName: '保洁员',
        roomScopes: ['商务大床房', '复式套房'],
        todayTaskNum: 5,
        completedTaskNum: 4,
        overdueTaskNum: 0,
        serviceScore: 96,
        lastTaskTime: '2026-05-18 12:45',
    },
    {
        cleanerId: 'cleaner-003',
        cleanerName: '张秀兰',
        mobile: '139****2718',
        poiId: '1796425098638573570',
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
        workStatus: 'onDuty',
        roleName: '保洁员',
        roomScopes: ['天落大床电竞套间'],
        todayTaskNum: 6,
        completedTaskNum: 5,
        overdueTaskNum: 1,
        serviceScore: 94,
        lastTaskTime: '2026-05-18 11:10',
    },
    {
        cleanerId: 'cleaner-004',
        cleanerName: '王春梅',
        mobile: '137****4386',
        poiId: '1796425098638573570',
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
        workStatus: 'onDuty',
        roleName: '保洁员',
        roomScopes: ['观影大床房', '总裁套间'],
        todayTaskNum: 4,
        completedTaskNum: 3,
        overdueTaskNum: 0,
        serviceScore: 95,
        lastTaskTime: '2026-05-18 10:38',
    },
    {
        cleanerId: 'cleaner-005',
        cleanerName: '陈丽',
        mobile: '135****3209',
        poiId: 'poi-qianhai-002',
        poiName: '天落会宿公寓(前海湾店)',
        workStatus: 'offDuty',
        roleName: '保洁员',
        roomScopes: ['影音套房'],
        todayTaskNum: 2,
        completedTaskNum: 2,
        overdueTaskNum: 0,
        serviceScore: 93,
        lastTaskTime: '2026-05-17 18:05',
    },
    {
        cleanerId: 'cleaner-006',
        cleanerName: '赵敏',
        mobile: '188****7742',
        poiId: '1796425098638573570',
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
        workStatus: 'leave',
        roleName: '兼职保洁',
        roomScopes: ['全部房源'],
        todayTaskNum: 0,
        completedTaskNum: 0,
        overdueTaskNum: 0,
        serviceScore: 91,
        lastTaskTime: '2026-05-16 17:32',
    },
];
export async function fetchCleanStaffDashboard(query, signal) {
    const provider = resolveCleanStaffProvider();
    const requestBody = createCleanStaffRequestBody(query);
    if (provider === 'api') {
        const envelope = await postJson(`/api${CLEAN_STAFF_LIST_PATH}`, requestBody, signal);
        return adaptCleanStaffEnvelope(envelope, requestBody, provider);
    }
    await delay(120, signal);
    if (query.scenario === 'error') {
        throw new Error('保洁人员数据加载失败：/cleaner/page/get 返回业务失败');
    }
    const sourceList = query.scenario === 'empty' ? [] : filterMembers(query);
    const pageList = paginate(sourceList, query.pageNum, query.pageSize);
    const envelope = createEnvelope({
        list: pageList,
        pagination: {
            page: query.pageNum,
            pageSize: query.pageSize,
            total: sourceList.length,
        },
        summary: summarizeMembers(sourceList),
        stores,
        requestBody,
    });
    return adaptCleanStaffEnvelope(envelope, requestBody, provider);
}
export async function createCleanStaffMember(payload, signal) {
    const provider = resolveCleanStaffProvider();
    if (provider === 'api') {
        const envelope = await postJson(`/api${CLEAN_STAFF_SAVE_PATH}`, payload, signal);
        const data = asRecord(envelope.data);
        return {
            saved: data.saved !== false,
            cleanerId: String(data.cleanerId ?? ''),
            traceId: envelope.traceId,
            timestamp: envelope.timestamp,
        };
    }
    await delay(120, signal);
    const envelope = createEnvelope({ saved: true, cleanerId: 'cleaner-new-preview' }, 'save');
    return {
        saved: true,
        cleanerId: String(envelope.data.cleanerId),
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
    };
}
export async function createCleanStaffExport(query, signal) {
    const provider = resolveCleanStaffProvider();
    const requestBody = createCleanStaffRequestBody(query);
    if (provider === 'api') {
        const envelope = await postJson(`/api${CLEAN_STAFF_EXPORT_PATH}`, requestBody, signal);
        const data = asRecord(envelope.data);
        return {
            taskId: data.taskId === undefined ? undefined : String(data.taskId),
            fileName: data.fileName === undefined ? undefined : String(data.fileName),
            contentType: data.contentType === undefined ? undefined : String(data.contentType),
            total: data.total === undefined ? undefined : toNumber(data.total),
            traceId: envelope.traceId,
            timestamp: envelope.timestamp,
        };
    }
    await delay(120, signal);
    const envelope = createEnvelope({
        taskId: 'export-clean-staff-20260518-001',
        requestBody,
    }, 'export');
    return {
        taskId: String(envelope.data.taskId),
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
    };
}
export function createDefaultCleanStaffQuery() {
    return {
        campId: '1796067693589061634',
        poiId: 'all',
        keyword: '',
        status: 'all',
        serviceDate: '2026-05-18',
        pageNum: 1,
        pageSize: 20,
        scenario: 'success',
    };
}
export function createCleanStaffRequestBody(query) {
    return {
        campId: query.campId,
        poiId: query.poiId === 'all' ? '' : query.poiId,
        keyword: query.keyword.trim(),
        status: query.status === 'all' ? '' : query.status,
        serviceDate: query.serviceDate,
        pageNum: query.pageNum,
        pageSize: query.pageSize,
    };
}
function adaptCleanStaffEnvelope(envelope, requestBody, provider) {
    const payload = assertEnvelope(envelope);
    if (!payload.data || !Array.isArray(payload.data.list)) {
        throw new Error('保洁人员接口响应缺少 data.list');
    }
    const list = payload.data.list;
    return {
        provider,
        endpoint: CLEAN_STAFF_LIST_PATH,
        requestBody: payload.data.requestBody ?? requestBody,
        stores: normalizeStores(payload.data.stores),
        summary: payload.data.summary ?? summarizeMembers(list),
        list: list.map(adaptMember),
        pagination: payload.data.pagination ?? {
            page: toNumber(requestBody.pageNum),
            pageSize: toNumber(requestBody.pageSize),
            total: list.length,
        },
        generatedAt: payload.timestamp,
    };
}
function adaptMember(raw) {
    const status = normalizeStaffStatus(raw.workStatus ?? raw.status);
    const rating = raw.rating === undefined ? `${toNumber(raw.serviceScore)}%` : String(raw.rating);
    return {
        id: String(raw.cleanerId ?? raw.id ?? ''),
        name: String(raw.cleanerName ?? raw.name ?? ''),
        mobile: String(raw.mobile ?? ''),
        storeName: String(raw.poiName ?? raw.storeName ?? ''),
        status,
        statusText: statusLabel(status),
        role: String(raw.roleName ?? raw.role ?? ''),
        roomScope: normalizeStringArray(raw.roomScopes ?? raw.roomScope),
        todayTasks: toNumber(raw.todayTaskNum ?? raw.todayTasks),
        completedTasks: toNumber(raw.completedTaskNum ?? raw.completedTasks),
        overdueTasks: toNumber(raw.overdueTaskNum ?? raw.overdueTasks),
        rating,
        lastTaskAt: String(raw.lastTaskTime ?? raw.lastTaskAt ?? ''),
    };
}
function filterMembers(query) {
    const keyword = query.keyword.trim().toLowerCase();
    return rawMembers.filter((member) => {
        const matchesStore = query.poiId === 'all' || member.poiId === query.poiId;
        const matchesStatus = query.status === 'all' || member.workStatus === query.status;
        const memberName = member.cleanerName ?? member.name ?? '';
        const memberMobile = member.mobile ?? '';
        const matchesKeyword = keyword.length === 0 ||
            memberName.toLowerCase().includes(keyword) ||
            memberMobile.toLowerCase().includes(keyword);
        return matchesStore && matchesStatus && matchesKeyword;
    });
}
function paginate(list, pageNum, pageSize) {
    const start = (pageNum - 1) * pageSize;
    return list.slice(start, start + pageSize);
}
function summarizeMembers(list) {
    return {
        total: list.length,
        onDuty: list.filter((member) => member.workStatus === 'onDuty').length,
        offDuty: list.filter((member) => member.workStatus === 'offDuty').length,
        leave: list.filter((member) => member.workStatus === 'leave').length,
        todayTasks: list.reduce((sum, member) => sum + toNumber(member.todayTaskNum ?? member.todayTasks), 0),
        completedTasks: list.reduce((sum, member) => sum + toNumber(member.completedTaskNum ?? member.completedTasks), 0),
        overdueTasks: list.reduce((sum, member) => sum + toNumber(member.overdueTaskNum ?? member.overdueTasks), 0),
    };
}
function statusLabel(status) {
    const labels = {
        onDuty: '在岗',
        offDuty: '休息',
        leave: '请假',
    };
    return labels[status];
}
function normalizeStaffStatus(value) {
    return value === 'offDuty' || value === 'leave' ? value : 'onDuty';
}
function normalizeStores(value) {
    if (!Array.isArray(value))
        return [];
    return value.map((store, index) => {
        const record = asRecord(store);
        return {
            id: String(record.id ?? `store-${index}`),
            name: String(record.name ?? record.label ?? `门店 ${index + 1}`),
        };
    });
}
function normalizeStringArray(value) {
    return Array.isArray(value) ? value.map(String) : [];
}
function resolveCleanStaffProvider() {
    const configured = readRuntimeValue('pms.cleanStaffProvider') ||
        import.meta.env.VITE_CLEAN_STAFF_PROVIDER ||
        CLEAN_STAFF_PROVIDER;
    if (configured === 'api' || configured === 'real')
        return 'api';
    if (configured === 'mock')
        return 'mock';
    throw new Error(`保洁人员数据源配置无效：${configured}`);
}
async function postJson(endpoint, body, signal) {
    const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        signal,
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const envelope = (await readJson(response));
    if (!response.ok) {
        throw new Error(`${endpoint} 返回 HTTP ${response.status}`);
    }
    return assertEnvelope(envelope);
}
function assertEnvelope(envelope) {
    if (!envelope || typeof envelope !== 'object') {
        throw new Error('保洁人员接口响应不是 JSON 对象');
    }
    if (envelope.success === false || (envelope.code !== undefined && envelope.code !== 0)) {
        throw new Error(envelope.errorMsg || envelope.errorDetail || envelope.message || '保洁人员接口返回失败');
    }
    if (envelope.data === undefined || envelope.data === null) {
        throw new Error('保洁人员接口响应缺少 data 字段');
    }
    return envelope;
}
async function readJson(response) {
    try {
        return await response.json();
    }
    catch {
        return null;
    }
}
function readRuntimeValue(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() ?? '';
}
function createEnvelope(data, trace = 'list') {
    return {
        code: 0,
        message: 'success',
        data,
        traceId: `${tracePrefix}-${trace}-001`,
        timestamp: generatedAt,
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
function toNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
