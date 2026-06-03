export const CUSTOMER_LIST_PATH = '/customers/page/get';
export const CUSTOMER_EXPORT_PATH = '/member/export/create';
export const CUSTOMER_SAVE_PATH = '/customers/save';
export const CUSTOMER_PROVIDER = 'mock';
const generatedAt = '2026-05-18T10:00:00+08:00';
const tracePrefix = 'mock-scrm--kehu-guanli--kehu-liebiao';
const defaultCampId = '1796067693589061634';
const defaultRealCampId = '10001';
const normalMemberCardId = '1796067693727473665';
export const customerStatusOptions = [
    { id: '', label: '全部' },
    { id: 'NORMAL', label: '正常' },
    { id: 'FROZEN', label: '冻结' },
    { id: 'BLACKLIST', label: '黑名单' },
];
export const customerIdentityOptions = [
    { id: '', label: '全部客户' },
    { id: 'MEMBER', label: '会员客户' },
    { id: 'WECHAT', label: '企微客户' },
    { id: 'CHANNEL', label: '渠道客户' },
];
export const memberCardOptions = [
    { id: '', label: '全部会员等级' },
    { id: normalMemberCardId, label: '普通会员' },
    { id: 'silver-card', label: '银卡会员' },
    { id: 'gold-card', label: '金卡会员' },
    { id: 'diamond-card', label: '钻石会员' },
];
export const customerWechatOptions = [
    { id: '', label: '全部' },
    { id: 'JOINED', label: '已添加' },
    { id: 'NOT_JOINED', label: '未添加' },
];
export const customerGenderOptions = [
    { id: '', label: '全部' },
    { id: 'MALE', label: '男' },
    { id: 'FEMALE', label: '女' },
    { id: 'UNKNOWN', label: '未知' },
];
export const customerAgeOptions = [
    { id: '', label: '全部' },
    { id: '18-25', label: '18-25' },
    { id: '26-35', label: '26-35' },
    { id: '36-45', label: '36-45' },
    { id: '46+', label: '46岁以上' },
];
const rawCustomers = [
    rawCustomer('1810493396951339010', '任清明', '13141204230', '携程', 63720, 1, '2024-07-09 09:57:17', {
        memberIdentity: 'WECHAT',
        isJoinWxCp: 1,
        isJoinWx: 1,
        isJoinGroup: 0,
        gender: 1,
        age: 31,
        lastFollowTime: '2024-07-09 13:20:00',
        remark: '高价值会员',
        tagNames: ['高净值', '近期消费'],
    }),
    rawCustomer('1862465040109776897', 'izu262346024', '0110', '美团民宿', null, null, '2024-11-29 19:54:03', {
        memberIdentity: 'CHANNEL',
        memberStatus: 'FROZEN',
        isJoinWxCp: 0,
        isJoinWx: 0,
        isJoinGroup: 0,
        gender: 2,
        age: 24,
    }),
    rawCustomer('1796067694142693378', '路客云6TS5', '18100001382', '自来客', null, null, '2024-05-30 14:34:42', {
        memberCardId: null,
        memberIdentity: 'MEMBER',
        memberStatus: 'NORMAL',
        isJoinWxCp: 0,
        isJoinWx: 0,
        isJoinGroup: 0,
        gender: 1,
        age: 42,
    }),
    rawCustomer('1801949715195166722', 'GHq721352403', '8788', '美团民宿', 1980, 3, '2024-06-15 20:07:45', {
        totalConsumePrice: 5940,
        memberIdentity: 'MEMBER',
        isJoinWxCp: 1,
        isJoinWx: 1,
        isJoinGroup: 1,
        gender: 2,
        age: 29,
        lastFollowTime: '2024-06-16 08:10:00',
    }),
    rawCustomer('1801949723525050371', 'gUM25201527', '6595', '美团民宿', 108702, 1, '2024-06-15 20:07:47', {
        memberIdentity: 'CHANNEL',
        isJoinWxCp: 0,
        isJoinWx: 0,
        isJoinGroup: 0,
        gender: 1,
        age: 37,
    }),
    rawCustomer('1801949727954239490', 'pTu748894801', '2729', '美团民宿', 1980, 1, '2024-06-15 20:07:48', {
        memberIdentity: 'MEMBER',
        isJoinWxCp: 1,
        isJoinWx: 0,
        isJoinGroup: 0,
        gender: 1,
        age: 22,
    }),
    rawCustomer('1801949777824514050', 'shB710890387', '2772', '美团民宿', 3762, 1, '2024-06-15 20:08:00', {
        memberIdentity: 'WECHAT',
        memberStatus: 'BLACKLIST',
        isJoinWxCp: 1,
        isJoinWx: 1,
        isJoinGroup: 1,
        gender: 2,
        age: 46,
    }),
    rawCustomer('1801949732022714369', 'pCG136191587', '1479', '美团民宿', 1683, 2, '2024-06-15 20:07:49', {
        totalConsumePrice: 3663,
        memberIdentity: 'MEMBER',
        isJoinWxCp: 0,
        isJoinWx: 0,
        isJoinGroup: 0,
        gender: 2,
        age: 34,
    }),
    rawCustomer('1801949753279447041', '是七啊838', '1974', '美团民宿', 1683, 1, '2024-06-15 20:07:54', {
        memberIdentity: 'CHANNEL',
        isJoinWxCp: 0,
        isJoinWx: 0,
        isJoinGroup: 0,
        gender: 2,
        age: 27,
    }),
    rawCustomer('1801949735889862657', 'bQm125435443', '7025', '美团民宿', 72720, 1, '2024-06-15 20:07:50', {
        memberIdentity: 'WECHAT',
        isJoinWxCp: 1,
        isJoinWx: 1,
        isJoinGroup: 1,
        gender: 1,
        age: 33,
        lastFollowTime: '2024-06-17 20:30:00',
    }),
    rawCustomer('1801949739694108674', 'lily937', '8231', '小猪', 32800, 2, '2024-06-18 12:10:22', {
        memberIdentity: 'MEMBER',
        isJoinWxCp: 0,
        isJoinWx: 0,
        isJoinGroup: 0,
        gender: 2,
        age: 25,
    }),
    rawCustomer('1801949743028576258', 'M614718025', '4518', '途家', 45800, 2, '2024-06-20 09:45:18', {
        memberIdentity: 'CHANNEL',
        isJoinWxCp: 1,
        isJoinWx: 0,
        isJoinGroup: 0,
        gender: 1,
        age: 39,
        lastFollowTime: '2024-06-21 09:00:00',
    }),
];
export function createDefaultCustomerListQuery() {
    return {
        campId: defaultCampId,
        pageNum: 1,
        pageSize: 20,
        memberSearchType: 'mobile',
        keyword: '',
        status: '',
        identity: '',
        memberCardId: '',
        wechatState: '',
        gender: '',
        ageRange: '',
        firstMemberStartTime: '',
        firstMemberEndTime: '',
        firstMemberCardStartTime: '',
        firstMemberCardEndTime: '',
        lastFollowStartTime: '',
        lastFollowEndTime: '',
        lastConsumeStartTime: '',
        lastConsumeEndTime: '',
        lastConsumeMin: '',
        lastConsumeMax: '',
        totalConsumeMin: '',
        totalConsumeMax: '',
        avgConsumeMin: '',
        avgConsumeMax: '',
        scenario: 'success',
    };
}
export function createCustomerListRequestBody(query) {
    return {
        campId: query.campId,
        pageNum: query.pageNum,
        pageSize: query.pageSize,
        current: query.pageNum,
        memberSearchType: query.memberSearchType,
        keyword: query.keyword.trim(),
        memberStatus: query.status,
        memberIdentity: query.identity,
        memberCardId: query.memberCardId,
        isJoinWxCp: query.wechatState === 'JOINED' ? 1 : query.wechatState === 'NOT_JOINED' ? 0 : '',
        gender: query.gender,
        ageRange: query.ageRange,
        firstMemberStartTime: query.firstMemberStartTime,
        firstMemberEndTime: query.firstMemberEndTime,
        firstMemberCardStartTime: query.firstMemberCardStartTime,
        firstMemberCardEndTime: query.firstMemberCardEndTime,
        lastFollowStartTime: query.lastFollowStartTime,
        lastFollowEndTime: query.lastFollowEndTime,
        lastConsumeStartTime: query.lastConsumeStartTime,
        lastConsumeEndTime: query.lastConsumeEndTime,
        lastConsumeMin: query.lastConsumeMin,
        lastConsumeMax: query.lastConsumeMax,
        totalConsumeMin: query.totalConsumeMin,
        totalConsumeMax: query.totalConsumeMax,
        avgConsumeMin: query.avgConsumeMin,
        avgConsumeMax: query.avgConsumeMax,
        breakTemp: false,
        memberTagIds: [],
    };
}
export async function fetchCustomerListDashboard(query, signal) {
    const provider = resolveProvider();
    const scenario = query.scenario ?? resolveScenario();
    if (provider === 'api')
        return fetchApiCustomerList(query, signal);
    return fetchMockCustomerList({ ...query, scenario }, signal);
}
export async function createCustomerListExport(query, signal) {
    await delay(120, signal);
    return createEnvelope({
        taskId: 'export-customer-list-20260518-001',
        path: CUSTOMER_EXPORT_PATH,
        requestBody: createCustomerListRequestBody(query),
    }, 'export');
}
export async function saveCustomer(input, signal) {
    if (!input.mobile.trim()) {
        throw new Error('请输入手机号');
    }
    if (resolveProvider() === 'api') {
        const requestBody = createCustomerSaveRequestBody(input);
        const response = await fetch(`/api${CUSTOMER_SAVE_PATH}`, {
            method: 'POST',
            credentials: 'include',
            headers: createJsonHeaders(),
            body: JSON.stringify(requestBody),
            signal,
        });
        const payload = (await response.json().catch(() => null));
        if (!response.ok || isFailedResponse(payload) || !payload?.data) {
            throw new Error(extractErrorMessage(payload) || `${CUSTOMER_SAVE_PATH} request failed`);
        }
        return createEnvelope({
            saved: true,
            path: CUSTOMER_SAVE_PATH,
            memberId: payload.data.customerId,
            requestBody,
        }, 'save');
    }
    await delay(120, signal);
    return createEnvelope({
        saved: true,
        path: CUSTOMER_SAVE_PATH,
        memberId: 'customer-new-20260518',
        requestBody: input,
    }, 'save');
}
async function fetchMockCustomerList(query, signal) {
    await delay(120, signal);
    validateCustomerListQuery(query);
    if (query.scenario === 'error') {
        throw new Error('客户列表加载失败：/member/page/get 返回业务失败');
    }
    const filtered = query.scenario === 'empty' ? [] : filterCustomers(query);
    const pageList = paginate(filtered, query.pageNum, query.pageSize);
    const envelope = createEnvelope({
        total: query.scenario === 'empty' ? 0 : 589,
        size: query.pageSize,
        current: query.pageNum,
        pageNum: query.pageNum,
        hasNextPage: query.pageNum * query.pageSize < 589,
        pages: 30,
        list: pageList,
    }, 'list');
    return adaptCustomerListEnvelope(envelope, createCustomerListRequestBody(query), 'mock');
}
async function fetchApiCustomerList(query, signal) {
    const requestBody = createCustomerListRequestBody({ ...query, campId: resolveRealCampId(query.campId) });
    const response = await fetch(`/api${CUSTOMER_LIST_PATH}`, {
        method: 'POST',
        credentials: 'include',
        headers: createJsonHeaders(),
        body: JSON.stringify(requestBody),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok || isFailedResponse(payload)) {
        throw new Error(extractErrorMessage(payload) || `${CUSTOMER_LIST_PATH} HTTP ${response.status}`);
    }
    if (!payload?.data) {
        throw new Error('customer list response missing data');
    }
    return adaptCustomerListEnvelope({
        code: 0,
        message: payload.message || 'success',
        data: payload.data,
        traceId: payload.traceId || 'api-customers-page-get',
        timestamp: payload.timestamp || new Date().toISOString(),
    }, requestBody, 'api');
}
function adaptCustomerListEnvelope(envelope, requestBody, provider) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '客户列表接口返回失败');
    }
    if (!envelope.data || !Array.isArray(envelope.data.list)) {
        throw new Error('客户列表响应缺少 data.list');
    }
    const rows = envelope.data.list.map(adaptCustomer);
    return {
        provider,
        endpoint: CUSTOMER_LIST_PATH,
        requestBody,
        statusOptions: customerStatusOptions,
        identityOptions: customerIdentityOptions,
        memberCardOptions,
        wechatOptions: customerWechatOptions,
        genderOptions: customerGenderOptions,
        ageOptions: customerAgeOptions,
        summary: {
            total: envelope.data.total,
            normal: envelope.data.total,
            joinedWechat: rows.filter((row) => row.isJoinWxCp === '是').length,
            highValue: rows.filter((row) => Number(row.totalConsumePrice) >= 500).length,
        },
        rows,
        pagination: {
            page: envelope.data.current || envelope.data.pageNum || 1,
            pageSize: envelope.data.size || 20,
            total: envelope.data.total || rows.length,
            hasNextPage: Boolean(envelope.data.hasNextPage),
        },
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
    };
}
function adaptCustomer(raw) {
    const profile = parseCustomerProfile(raw.profileJson);
    const id = readString(raw.memberId) || readString(raw.customerId) || '-';
    const totalConsumeCount = raw.totalConsumeCount ?? profile.totalConsumeCount;
    return {
        id,
        name: readString(raw.nickName) || readString(raw.name) || '-',
        mobile: readString(raw.mobile) || '-',
        memberNo: readString(raw.memberNo) || id,
        channelName: readString(raw.channelName) || readString(profile.channelName) || '-',
        memberCardName: readString(raw.memberCardName) || readString(profile.memberCardName) || '-',
        tagNames: readTagNames(raw.memberTagViews, profile.tagNames),
        lastConsumePrice: formatCentMoney(readNullableNumber(raw.lastConsumePrice ?? profile.lastConsumePrice)),
        totalConsumeCount: totalConsumeCount == null ? '-' : String(totalConsumeCount),
        totalConsumePrice: formatCentMoney(readNullableNumber(raw.totalConsumePrice ?? profile.totalConsumePrice)),
        avgConsumePrice: formatCentMoney(readNullableNumber(raw.avgConsumePrice ?? profile.avgConsumePrice)),
        isJoinWxCp: yesNo(readNullableNumber(raw.isJoinWxCp ?? profile.isJoinWxCp)),
        isJoinWx: yesNo(readNullableNumber(raw.isJoinWx ?? profile.isJoinWx)),
        isJoinGroup: yesNo(readNullableNumber(raw.isJoinGroup ?? profile.isJoinGroup)),
        firstMemberTime: formatTime(raw.firstMemberTime ?? profile.firstMemberTime),
        firstMemberCardTime: formatTime(raw.firstMemberCardTime ?? profile.firstMemberCardTime),
        lastConsumeTime: formatTime(raw.lastConsumeTime ?? profile.lastConsumeTime),
        lastFollowTime: formatTime(raw.lastFollowTime ?? raw.lastActiveAt ?? profile.lastFollowTime),
        remark: readString(raw.remark) || readString(profile.remark) || '-',
    };
}
function filterCustomers(query) {
    const keyword = query.keyword.trim().toLowerCase();
    return rawCustomers.filter((customer) => {
        if (query.status && customer.memberStatus !== query.status)
            return false;
        if (query.identity && customer.memberIdentity !== query.identity)
            return false;
        if (query.memberCardId && customer.memberCardId !== query.memberCardId)
            return false;
        if (query.wechatState === 'JOINED' && customer.isJoinWxCp !== 1)
            return false;
        if (query.wechatState === 'NOT_JOINED' && customer.isJoinWxCp !== 0)
            return false;
        if (query.gender && genderToEnum(customer.gender) !== query.gender)
            return false;
        if (query.ageRange && !matchesAgeRange(customer.age, query.ageRange))
            return false;
        if (!matchesDateRange(customer.firstMemberTime, query.firstMemberStartTime, query.firstMemberEndTime))
            return false;
        if (!matchesDateRange(customer.firstMemberCardTime, query.firstMemberCardStartTime, query.firstMemberCardEndTime))
            return false;
        if (!matchesDateRange(customer.lastFollowTime, query.lastFollowStartTime, query.lastFollowEndTime))
            return false;
        if (!matchesDateRange(customer.lastConsumeTime, query.lastConsumeStartTime, query.lastConsumeEndTime))
            return false;
        if (!matchesAmountRange(customer.lastConsumePrice, query.lastConsumeMin, query.lastConsumeMax))
            return false;
        if (!matchesAmountRange(customer.totalConsumePrice, query.totalConsumeMin, query.totalConsumeMax))
            return false;
        if (!matchesAmountRange(customer.avgConsumePrice, query.avgConsumeMin, query.avgConsumeMax))
            return false;
        if (keyword) {
            const source = query.memberSearchType === 'name'
                ? customer.nickName
                : query.memberSearchType === 'memberNo'
                    ? customer.memberNo
                    : customer.mobile;
            if (!String(source).toLowerCase().includes(keyword))
                return false;
        }
        return true;
    });
}
function rawCustomer(memberId, name, mobile, channelName, lastConsumePrice, totalConsumeCount, time, options = {}) {
    const memberCardId = options.memberCardId ?? normalMemberCardId;
    const totalConsumePrice = options.totalConsumePrice ?? lastConsumePrice;
    return {
        memberId,
        campId: defaultCampId,
        memberNo: memberId,
        headImage: null,
        nickName: name,
        mobile,
        name,
        gender: options.gender ?? null,
        firstMemberTime: time,
        isJoinWxCp: options.isJoinWxCp ?? null,
        memberIdentity: options.memberIdentity ?? 'MEMBER',
        lastFollowTime: options.lastFollowTime ?? null,
        isJoinWx: options.isJoinWx ?? null,
        isJoinGroup: options.isJoinGroup ?? null,
        memberCardName: memberCardId ? '普通会员' : null,
        firstMemberCardTime: memberCardId ? (options.firstMemberCardTime ?? time) : null,
        lastConsumeTime: lastConsumePrice == null ? null : (options.lastConsumeTime ?? time),
        lastConsumePrice,
        totalConsumePrice,
        totalConsumeCount,
        avgConsumePrice: totalConsumeCount && totalConsumePrice ? Math.round(totalConsumePrice / totalConsumeCount) : lastConsumePrice,
        channelId: channelName === '携程' ? '5' : channelName === '小猪' ? '7' : channelName === '途家' ? '9' : '0',
        channelName,
        memberCardId,
        memberStatus: options.memberStatus ?? 'NORMAL',
        remark: options.remark ?? null,
        age: options.age ?? null,
        memberTagViews: (options.tagNames ?? []).map((tagName) => ({ tagName })),
    };
}
function createEnvelope(data, trace) {
    return {
        code: 0,
        message: 'success',
        data,
        traceId: `${tracePrefix}-${trace}-001`,
        timestamp: generatedAt,
    };
}
function paginate(list, pageNum, pageSize) {
    const start = (pageNum - 1) * pageSize;
    return list.slice(start, start + pageSize);
}
function formatCentMoney(value) {
    if (value === null || value === undefined)
        return '-';
    return (value / 100).toFixed(2);
}
function formatTime(value) {
    if (value === null || value === undefined || value === '')
        return '-';
    if (typeof value === 'string')
        return value;
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime()))
        return '-';
    const pad = (input) => String(input).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function yesNo(value) {
    if (value === 1)
        return '是';
    if (value === 0)
        return '否';
    return '-';
}
function validateCustomerListQuery(query) {
    const amountFields = [
        ['最近消费金额下限', query.lastConsumeMin],
        ['最近消费金额上限', query.lastConsumeMax],
        ['累计消费金额下限', query.totalConsumeMin],
        ['累计消费金额上限', query.totalConsumeMax],
        ['客单价下限', query.avgConsumeMin],
        ['客单价上限', query.avgConsumeMax],
    ];
    for (const [label, value] of amountFields) {
        if (!value)
            continue;
        if (Number.isNaN(Number(value))) {
            throw new Error(`客户列表查询参数不合法：${label}必须为数字`);
        }
    }
}
function matchesAmountRange(value, min, max) {
    if (!min && !max)
        return true;
    if (value === null || value === undefined)
        return false;
    const amount = value / 100;
    if (min && amount < Number(min))
        return false;
    if (max && amount > Number(max))
        return false;
    return true;
}
function matchesDateRange(value, start, end) {
    if (!start && !end)
        return true;
    if (value === null || value === undefined || value === '')
        return false;
    const target = normalizeDateValue(value);
    if (!target)
        return false;
    const startDate = start ? normalizeDateValue(start) : null;
    const endDate = end ? normalizeDateValue(end) : null;
    if (startDate && target < startDate)
        return false;
    if (endDate && target > endDate)
        return false;
    return true;
}
function normalizeDateValue(value) {
    if (typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}
function matchesAgeRange(age, ageRange) {
    if (!ageRange)
        return true;
    if (age === null || age === undefined)
        return false;
    if (ageRange === '18-25')
        return age >= 18 && age <= 25;
    if (ageRange === '26-35')
        return age >= 26 && age <= 35;
    if (ageRange === '36-45')
        return age >= 36 && age <= 45;
    if (ageRange === '46+')
        return age >= 46;
    return true;
}
function genderToEnum(value) {
    if (value === 1)
        return 'MALE';
    if (value === 2)
        return 'FEMALE';
    return 'UNKNOWN';
}
function resolveProvider() {
    const configured = readRuntimeConfig('pms.customerList.provider') ||
        readRuntimeConfig('pmsCustomerListProvider') ||
        import.meta.env.VITE_CUSTOMER_LIST_PROVIDER ||
        import.meta.env.VITE_PMS_CUSTOMER_LIST_PROVIDER ||
        CUSTOMER_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function createCustomerSaveRequestBody(input) {
    return {
        customerId: `crm-${Date.now()}`,
        campId: resolveRealCampId(),
        name: input.name.trim() || input.mobile.trim(),
        mobile: input.mobile.trim(),
        profileJson: JSON.stringify({
            gender: input.gender,
            channelName: input.channelName,
            firstMemberTime: input.firstMemberTime,
            remark: input.remark,
        }),
    };
}
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
function resolveRealCampId(candidate) {
    return (readRuntimeConfig('pmsCampId') ||
        readRuntimeConfig('pms.currentCampId') ||
        readCampIdFromStoredObject('pms.currentCamp') ||
        readCampIdFromStoredObject('pms.camp') ||
        candidate ||
        import.meta.env.VITE_PMS_CAMP_ID ||
        defaultRealCampId);
}
function readCampIdFromStoredObject(key) {
    const raw = readRuntimeConfig(key);
    if (!raw)
        return '';
    try {
        const value = JSON.parse(raw);
        return readString(value.campId) || readString(value.id) || '';
    }
    catch {
        return '';
    }
}
function parseCustomerProfile(value) {
    if (typeof value !== 'string' || !value.trim())
        return {};
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch {
        return {};
    }
}
function readTagNames(memberTagViews, profileTagNames) {
    const fromViews = Array.isArray(memberTagViews)
        ? memberTagViews.map((item) => String(item.tagName ?? '')).filter(Boolean)
        : [];
    if (fromViews.length > 0)
        return fromViews;
    return Array.isArray(profileTagNames) ? profileTagNames.map(String).filter(Boolean) : [];
}
function readString(value) {
    return value === null || value === undefined || value === '' ? '' : String(value);
}
function readNullableNumber(value) {
    if (value === null || value === undefined || value === '')
        return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function resolveScenario() {
    if (typeof window === 'undefined')
        return 'success';
    const value = window.localStorage.getItem('pms.customerList.scenario');
    return value === 'empty' || value === 'error' ? value : 'success';
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
