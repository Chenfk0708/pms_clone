export const CLEAN_STAFF_LIST_PATH = '/cleaner/page/get';
export const CLEAN_STAFF_STORES_PATH = '/select/poi/page/get';
export const CLEAN_STAFF_PROVIDER = 'mock';
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
    await delay(120, signal);
    if (query.scenario === 'error') {
        throw new Error('保洁人员数据加载失败：/cleaner/page/get 返回业务失败');
    }
    const requestBody = createCleanStaffRequestBody(query);
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
    return adaptCleanStaffEnvelope(envelope);
}
export async function createCleanStaffMember(signal) {
    await delay(120, signal);
    return createEnvelope({ saved: true, cleanerId: 'cleaner-new-preview' }, 'save');
}
export async function createCleanStaffExport(query, signal) {
    await delay(120, signal);
    return createEnvelope({
        taskId: 'export-clean-staff-20260518-001',
        requestBody: createCleanStaffRequestBody(query),
    }, 'export');
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
function adaptCleanStaffEnvelope(envelope) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '保洁人员接口返回失败');
    }
    if (!envelope.data || !Array.isArray(envelope.data.list)) {
        throw new Error('保洁人员接口响应缺少 data.list');
    }
    return {
        provider: CLEAN_STAFF_PROVIDER,
        endpoint: CLEAN_STAFF_LIST_PATH,
        requestBody: envelope.data.requestBody,
        stores: envelope.data.stores,
        summary: envelope.data.summary,
        list: envelope.data.list.map(adaptMember),
        pagination: envelope.data.pagination,
        generatedAt: envelope.timestamp,
    };
}
function adaptMember(raw) {
    return {
        id: String(raw.cleanerId),
        name: String(raw.cleanerName),
        mobile: String(raw.mobile),
        storeName: String(raw.poiName),
        status: raw.workStatus,
        statusText: statusLabel(raw.workStatus),
        role: String(raw.roleName),
        roomScope: Array.isArray(raw.roomScopes) ? raw.roomScopes.map(String) : [],
        todayTasks: toNumber(raw.todayTaskNum),
        completedTasks: toNumber(raw.completedTaskNum),
        overdueTasks: toNumber(raw.overdueTaskNum),
        rating: `${toNumber(raw.serviceScore)}%`,
        lastTaskAt: String(raw.lastTaskTime),
    };
}
function filterMembers(query) {
    const keyword = query.keyword.trim().toLowerCase();
    return rawMembers.filter((member) => {
        const matchesStore = query.poiId === 'all' || member.poiId === query.poiId;
        const matchesStatus = query.status === 'all' || member.workStatus === query.status;
        const matchesKeyword = keyword.length === 0 ||
            member.cleanerName.toLowerCase().includes(keyword) ||
            member.mobile.toLowerCase().includes(keyword);
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
        todayTasks: list.reduce((sum, member) => sum + member.todayTaskNum, 0),
        completedTasks: list.reduce((sum, member) => sum + member.completedTaskNum, 0),
        overdueTasks: list.reduce((sum, member) => sum + member.overdueTaskNum, 0),
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
