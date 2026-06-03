export class CouponRequestError extends Error {
    constructor(message = '优惠券数据加载失败') {
        super(message);
        this.name = 'CouponRequestError';
    }
}
export const couponListEndpoint = '/api/coupons/page/get';
export const couponTaskEndpoint = '/api/couponSendConfigs/page/get';
export const defaultCouponFilters = {
    campId: '1796067693589061634',
    shelfStatus: 'all',
    pageNum: 1,
    pageSize: 20,
};
export async function fetchCouponList(filters, signal) {
    const requestBody = createCouponListRequestBody(filters);
    const provider = resolveCouponProviderName(filters.provider);
    if (provider === 'mock')
        return fetchMockCouponList(filters, requestBody);
    const response = await fetch(couponListEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
        signal,
    });
    const payload = await readJson(response);
    if (!response.ok || isFailedResponse(payload)) {
        throw new CouponRequestError(extractErrorMessage(payload) ?? `优惠券数据加载失败（HTTP ${response.status}）`);
    }
    return adaptCouponPage(payload?.data, requestBody, 'api', couponListEndpoint, payload, adaptCouponRow);
}
export async function fetchCouponTasks(filters, signal) {
    const requestBody = createCouponTaskRequestBody(filters);
    const provider = resolveCouponProviderName(filters.provider);
    if (provider === 'mock')
        return fetchMockCouponTasks(requestBody);
    const response = await fetch(couponTaskEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
        signal,
    });
    const payload = await readJson(response);
    if (!response.ok || isFailedResponse(payload)) {
        throw new CouponRequestError(extractErrorMessage(payload) ?? `派发任务数据加载失败（HTTP ${response.status}）`);
    }
    return adaptCouponPage(payload?.data, requestBody, 'api', couponTaskEndpoint, payload, adaptCouponTaskRow);
}
export function createCouponListRequestBody(filters) {
    return {
        campId: filters.campId,
        shelfStatus: filters.shelfStatus === 'all' ? null : filters.shelfStatus === 'enabled' ? 1 : 0,
        pageNum: filters.pageNum,
        pageSize: filters.pageSize,
        current: filters.pageNum,
    };
}
export function createCouponTaskRequestBody(filters) {
    return {
        campId: filters.campId,
        pageNum: filters.pageNum,
        pageSize: filters.pageSize,
        current: filters.pageNum,
    };
}
function fetchMockCouponList(filters, requestBody) {
    const mode = resolveCouponMockMode();
    const response = mode === 'error'
        ? mockCouponErrorEnvelope()
        : mode === 'empty'
            ? mockCouponListEmptyEnvelope(requestBody)
            : mockCouponListSuccessEnvelope(requestBody);
    if (response.code !== 0)
        throw new CouponRequestError();
    const adapted = adaptCouponPage(response.data, requestBody, 'mock', couponListEndpoint, response, adaptCouponRow);
    const filteredList = filters.shelfStatus === 'all' ? adapted.list : adapted.list.filter((item) => item.status === (filters.shelfStatus === 'enabled' ? '已上架' : '已下架'));
    return {
        ...adapted,
        list: filteredList,
        pagination: { ...adapted.pagination, total: filteredList.length, pages: Math.max(1, Math.ceil(filteredList.length / filters.pageSize)) },
    };
}
function fetchMockCouponTasks(requestBody) {
    const mode = resolveCouponMockMode();
    const response = mode === 'error'
        ? mockCouponErrorEnvelope()
        : mode === 'empty'
            ? mockCouponTaskEmptyEnvelope(requestBody)
            : mockCouponTaskSuccessEnvelope(requestBody);
    if (response.code !== 0)
        throw new CouponRequestError('派发任务数据加载失败');
    return adaptCouponPage(response.data, requestBody, 'mock', couponTaskEndpoint, response, adaptCouponTaskRow);
}
function adaptCouponPage(data, requestBody, provider, endpoint, envelope, adaptRow) {
    const record = readRecord(data);
    const list = readArray(record?.list).map(adaptRow).filter((item) => Boolean(item));
    const pageNum = readNumber(record?.pageNum) ?? readNumber(record?.current) ?? readNumber(requestBody.pageNum) ?? 1;
    const pageSize = readNumber(record?.size) ?? readNumber(requestBody.pageSize) ?? 20;
    const total = readNumber(record?.total) ?? list.length;
    const pages = readNumber(record?.pages) ?? Math.max(1, Math.ceil(total / pageSize));
    return {
        list,
        pagination: { pageNum, pageSize, total, pages },
        endpoint,
        requestBody,
        provider,
        traceId: envelope?.traceId ?? `${provider}-scrm--yingxiao-tuiguang--youhuiquan-${endpoint.includes('Send') ? 'tasks' : 'list'}`,
        timestamp: envelope?.timestamp ?? '2026-05-18T10:00:00+08:00',
    };
}
function adaptCouponRow(value) {
    const record = readRecord(value);
    if (!record)
        return null;
    const id = readString(record.id) ?? readString(record.couponId);
    const name = readString(record.name) ?? readString(record.couponName);
    if (!id || !name)
        return null;
    const statusValue = readNumber(record?.shelfStatus) ?? readNumber(record?.status);
    return {
        id,
        name,
        type: readString(record.typeName) ?? readString(record.type) ?? '满减券',
        discountText: readString(record.discountText) ?? formatDiscount(record),
        scopeText: readString(record.scopeText) ?? '部分房型可用',
        sendLimit: readString(record.sendLimitText) ?? `${readNumber(record.sendLimit) ?? 0} 张`,
        perUserLimit: readString(record.perUserLimitText) ?? `${readNumber(record.perUserLimit) ?? 1} 张`,
        sendTime: readString(record.sendTimeText) ?? '-',
        validityType: readString(record.validityTypeText) ?? '有效天数',
        effectiveTime: readString(record.effectiveTimeText) ?? '-',
        receiveRule: readString(record.receiveRuleText) ?? '所有人可以领',
        status: statusValue === 0 || record.status === 'disabled' ? '已下架' : '已上架',
    };
}
function adaptCouponTaskRow(value) {
    const record = readRecord(value);
    if (!record)
        return null;
    const id = readString(record.id);
    const couponName = readString(record.couponName);
    if (!id || !couponName)
        return null;
    return {
        id,
        sendMethod: readString(record.sendMethod) ?? '会员标签定向派发',
        couponName,
        sentCount: readNumber(record.sentCount) ?? 0,
        createdAt: readString(record.createdAt) ?? '-',
        recordText: readString(record.recordText) ?? '查看记录',
    };
}
function formatDiscount(record) {
    const threshold = readNumber(record.thresholdAmount) ?? 0;
    const discount = readNumber(record.discountAmount) ?? 0;
    return `满 ${threshold} 元减 ${discount} 元`;
}
function resolveCouponProviderName(explicitProvider) {
    const configured = explicitProvider ||
        readRuntimeConfig('pms.couponProvider') ||
        import.meta.env.VITE_PMS_COUPON_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function resolveCouponMockMode() {
    const configured = readRuntimeConfig('pms.couponMockMode') ||
        import.meta.env.VITE_PMS_COUPON_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
}
function mockCouponListSuccessEnvelope(requestBody) {
    return {
        code: 0,
        message: 'success',
        data: {
            total: 2,
            size: 20,
            current: readNumber(requestBody.pageNum) ?? 1,
            pageNum: readNumber(requestBody.pageNum) ?? 1,
            pages: 1,
            hasNextPage: false,
            list: [
                {
                    id: 'coupon-spring-stay',
                    name: '春季连住满减券',
                    typeName: '满减券',
                    thresholdAmount: 500,
                    discountAmount: 80,
                    scopeText: '顶层套房、总裁套间',
                    sendLimit: 500,
                    perUserLimit: 1,
                    sendTimeText: '2026-05-18 10:00',
                    validityTypeText: '有效天数',
                    effectiveTimeText: '领取后 7 天有效',
                    receiveRuleText: '所有人可以领',
                    shelfStatus: 1,
                },
                {
                    id: 'coupon-member-return',
                    name: '会员复购专享券',
                    typeName: '满减券',
                    thresholdAmount: 300,
                    discountAmount: 30,
                    scopeText: '日历房产品',
                    sendLimit: 300,
                    perUserLimit: 2,
                    sendTimeText: '2026-05-20 09:00',
                    validityTypeText: '固定时间',
                    effectiveTimeText: '2026-05-20 至 2026-06-20',
                    receiveRuleText: '仅限老用户可领取',
                    shelfStatus: 0,
                },
            ],
        },
        traceId: 'mock-scrm--yingxiao-tuiguang--youhuiquan-list-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockCouponTaskSuccessEnvelope(requestBody) {
    return {
        code: 0,
        message: 'success',
        data: {
            total: 1,
            size: 20,
            current: readNumber(requestBody.pageNum) ?? 1,
            pageNum: readNumber(requestBody.pageNum) ?? 1,
            pages: 2,
            hasNextPage: true,
            list: [
                {
                    id: 'task-member-tags',
                    sendMethod: '会员标签定向派发',
                    couponName: '春季连住满减券',
                    sentCount: 128,
                    createdAt: '2026-05-18 11:30',
                    recordText: '查看记录',
                },
            ],
        },
        traceId: 'mock-scrm--yingxiao-tuiguang--youhuiquan-tasks-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockCouponListEmptyEnvelope(requestBody) {
    return {
        ...mockCouponListSuccessEnvelope(requestBody),
        data: { total: 0, size: 20, current: 1, pageNum: 1, pages: 0, hasNextPage: false, list: [] },
        traceId: 'mock-scrm--yingxiao-tuiguang--youhuiquan-list-empty-001',
    };
}
function mockCouponTaskEmptyEnvelope(requestBody) {
    return {
        ...mockCouponTaskSuccessEnvelope(requestBody),
        data: { total: 0, size: 20, current: 1, pageNum: 1, pages: 0, hasNextPage: false, list: [] },
        traceId: 'mock-scrm--yingxiao-tuiguang--youhuiquan-tasks-empty-001',
    };
}
function mockCouponErrorEnvelope() {
    return {
        code: 50001,
        message: 'coupon request failed',
        data: null,
        traceId: 'mock-scrm--yingxiao-tuiguang--youhuiquan-error-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
async function readJson(response) {
    try {
        return (await response.json());
    }
    catch {
        return null;
    }
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
        return null;
    return payload.message ?? payload.errorMsg ?? payload.errorCode ?? null;
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function readRecord(value) {
    return value && typeof value === 'object' ? value : null;
}
function readArray(value) {
    return Array.isArray(value) ? value : [];
}
function readString(value) {
    if (value === null || value === undefined || value === '')
        return null;
    return String(value);
}
function readNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))
        return Number(value);
    return null;
}
