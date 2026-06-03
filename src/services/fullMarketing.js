export class FullMarketingRequestError extends Error {
    constructor(message = '全员营销数据加载失败') {
        super(message);
        this.name = 'FullMarketingRequestError';
    }
}
export const defaultFullMarketingCommissionFilters = {
    productType: 'calendar',
    keyword: '',
    page: 1,
    pageSize: 20,
};
export const defaultFullMarketingDistributionFilters = {
    productType: 'all',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    page: 1,
    pageSize: 10,
};
export const fullMarketingCommissionEndpoint = '/api/promotionPlanProducts/page/get';
export const fullMarketingDistributionMetricEndpoint = '/api/report/promotion/get';
export const fullMarketingProductSaleEndpoint = '/api/report/promotion/productSale/page/get';
const campId = '1796067693589061634';
export async function fetchFullMarketingCommission(filters, signal) {
    const requestBody = createCommissionRequestBody(filters);
    const provider = resolveFullMarketingProviderName(filters.provider);
    if (provider === 'mock') {
        return fetchMockCommission(filters, requestBody);
    }
    const response = await fetch(fullMarketingCommissionEndpoint, {
        method: 'POST',
        headers: createJsonHeaders(),
        credentials: 'include',
        body: JSON.stringify(requestBody),
        signal,
    });
    const payload = await readJson(response);
    if (!response.ok || isFailedResponse(payload)) {
        throw new FullMarketingRequestError(extractErrorMessage(payload) ?? `全员营销数据加载失败（HTTP ${response.status}）`);
    }
    return adaptCommission(payload?.data, filters, requestBody, 'api', payload);
}
export async function fetchFullMarketingDistribution(filters, signal) {
    const requestBody = createDistributionRequestBody(filters);
    const provider = resolveFullMarketingProviderName(filters.provider);
    if (provider === 'mock') {
        return fetchMockDistribution(filters, requestBody);
    }
    const [metricResponse, productResponse] = await Promise.all([
        fetch(fullMarketingDistributionMetricEndpoint, {
            method: 'POST',
            headers: createJsonHeaders(),
            credentials: 'include',
            body: JSON.stringify(requestBody.metric),
            signal,
        }),
        fetch(fullMarketingProductSaleEndpoint, {
            method: 'POST',
            headers: createJsonHeaders(),
            credentials: 'include',
            body: JSON.stringify(requestBody.productSale),
            signal,
        }),
    ]);
    const [metricPayload, productPayload] = await Promise.all([readJson(metricResponse), readJson(productResponse)]);
    if (!metricResponse.ok || isFailedResponse(metricPayload)) {
        throw new FullMarketingRequestError(extractErrorMessage(metricPayload) ?? '全员营销数据加载失败');
    }
    if (!productResponse.ok || isFailedResponse(productPayload)) {
        throw new FullMarketingRequestError(extractErrorMessage(productPayload) ?? '全员营销数据加载失败');
    }
    return adaptDistribution({ metric: metricPayload?.data, productSale: productPayload?.data, distributors: { list: [] } }, filters, requestBody, 'api', productPayload);
}
export async function saveFullMarketingCommissionPlan(input) {
    const ratio = Number(input.directRatio);
    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 100) {
        throw new FullMarketingRequestError('佣金比例需在 0 至 100 之间');
    }
    return {
        ...input.row,
        directRatio: `${ratio}%`,
        indirectRatio: input.row.indirectRatio === '-%' ? '-%' : input.row.indirectRatio,
        enabled: input.enabled,
    };
}
export function createCommissionRequestBody(filters) {
    return {
        campId,
        pageNum: filters.page,
        pageSize: filters.pageSize,
        current: filters.page,
        type: filters.productType === 'calendar' ? '0' : '1',
        keyword: filters.keyword.trim() || null,
    };
}
export function createDistributionRequestBody(filters) {
    const type = filters.productType === 'calendar' ? '0' : filters.productType === 'presale' ? '1' : null;
    const endDate = toExclusiveEndDate(filters.endDate);
    return {
        metric: {
            campId,
            startDate: filters.startDate,
            endDate,
            type,
        },
        productSale: {
            campId,
            pageNum: filters.page,
            pageSize: filters.pageSize,
            startDate: filters.startDate,
            endDate,
            type,
        },
    };
}
function fetchMockCommission(filters, requestBody) {
    const mode = resolveFullMarketingMockMode();
    const response = mode === 'error'
        ? mockCommissionErrorEnvelope()
        : mode === 'empty'
            ? mockCommissionEmptyEnvelope(requestBody)
            : mockCommissionSuccessEnvelope(requestBody);
    if (response.code !== 0)
        throw new FullMarketingRequestError(response.message);
    return adaptCommission(response.data, filters, requestBody, 'mock', response);
}
function fetchMockDistribution(filters, requestBody) {
    const mode = resolveFullMarketingMockMode();
    const response = mode === 'error'
        ? mockDistributionErrorEnvelope()
        : mode === 'empty'
            ? mockDistributionEmptyEnvelope(requestBody)
            : mockDistributionSuccessEnvelope(requestBody);
    if (response.code !== 0)
        throw new FullMarketingRequestError(response.message);
    return adaptDistribution(response.data, filters, requestBody, 'mock', response);
}
function adaptCommission(data, filters, requestBody, provider, envelope) {
    const record = readRecord(data);
    const list = readArray(record?.list).map(adaptCommissionRow).filter((row) => Boolean(row));
    const filteredRows = filterCommissionRows(list, filters);
    const pagination = {
        page: readNumber(record?.current) ?? readNumber(record?.pageNum) ?? filters.page,
        pageSize: readNumber(record?.size) ?? filters.pageSize,
        total: filteredRows.length,
    };
    return {
        tab: 'commission',
        provider,
        endpoint: fullMarketingCommissionEndpoint,
        requestBody,
        traceId: readString(envelope?.traceId) ?? `${provider}-scrm--yingxiao-tuiguang--quanyuan-yingxiao-commission`,
        timestamp: readString(envelope?.timestamp) ?? '2026-05-18T10:00:00+08:00',
        commission: {
            filters,
            rows: filteredRows,
            pagination,
        },
    };
}
function adaptDistribution(data, filters, requestBody, provider, envelope) {
    const record = readRecord(data);
    const metric = readRecord(record?.metric);
    const productSale = readRecord(record?.productSale);
    const distributors = readRecord(record?.distributors);
    const productRows = readArray(productSale?.list)
        .map(adaptDistributionRow)
        .filter((row) => Boolean(row));
    const distributorRows = readArray(distributors?.list)
        .map(adaptDistributorRow)
        .filter((row) => Boolean(row));
    return {
        tab: 'distribution',
        provider,
        endpoint: fullMarketingDistributionMetricEndpoint,
        requestBody,
        traceId: readString(envelope?.traceId) ?? `${provider}-scrm--yingxiao-tuiguang--quanyuan-yingxiao-distribution`,
        timestamp: readString(envelope?.timestamp) ?? '2026-05-18T10:00:00+08:00',
        distribution: {
            filters,
            metrics: {
                turnover: formatMoney(readNumber(metric?.turnover) ?? 0),
                commission: formatMoney(readNumber(metric?.commission) ?? 0),
            },
            productRows,
            distributorRows,
            pagination: {
                page: readNumber(productSale?.current) ?? readNumber(productSale?.pageNum) ?? filters.page,
                pageSize: readNumber(productSale?.size) ?? filters.pageSize,
                total: readNumber(productSale?.total) ?? productRows.length,
            },
        },
    };
}
function filterCommissionRows(rows, filters) {
    const keyword = filters.keyword.trim();
    return rows.filter((row) => {
        if (row.type !== filters.productType)
            return false;
        if (keyword && !row.name.includes(keyword))
            return false;
        return true;
    });
}
function adaptCommissionRow(value) {
    const record = readRecord(value);
    if (!record)
        return null;
    const id = readString(record.productId) ?? readString(record.id);
    const name = readString(record.name);
    if (!id || !name)
        return null;
    return {
        id,
        name,
        level: readString(record.level) ?? '-',
        indirectRatio: formatRatio(record.parentRatio),
        directRatio: formatRatio(record.directRatio),
        enabled: readBoolean(record.state),
        type: readProductType(record.type),
    };
}
function adaptDistributionRow(value) {
    const record = readRecord(value);
    if (!record)
        return null;
    const id = readString(record.id) ?? readString(record.productId) ?? readString(record.name);
    const name = readString(record.name) ?? readString(record.productName);
    if (!id || !name)
        return null;
    return {
        id,
        name,
        sales: readNumber(record.sales) ?? readNumber(record.saleNum) ?? 0,
        turnover: formatMoney(readNumber(record.turnover) ?? readNumber(record.amount) ?? 0),
        commission: formatMoney(readNumber(record.commission) ?? 0),
    };
}
function adaptDistributorRow(value) {
    const record = readRecord(value);
    if (!record)
        return null;
    const id = readString(record.id) ?? readString(record.name);
    const name = readString(record.name) ?? readString(record.distributorName);
    if (!id || !name)
        return null;
    return {
        id,
        name,
        sales: readNumber(record.sales) ?? 0,
        turnover: formatMoney(readNumber(record.turnover) ?? 0),
        commission: formatMoney(readNumber(record.commission) ?? 0),
    };
}
function mockCommissionSuccessEnvelope(requestBody) {
    return {
        code: 0,
        message: 'success',
        data: {
            total: 4,
            size: 20,
            current: 1,
            pageNum: 1,
            hasNextPage: false,
            pages: 1,
            list: [
                {
                    productId: 'calendar-top-suite',
                    campId,
                    promotionPlanProductId: null,
                    name: '顶层套房（浴缸巨幕电竞麻将）',
                    mainPhotoMediaUrl: '',
                    directRatio: null,
                    parentRatio: null,
                    type: 0,
                    state: 0,
                },
                {
                    productId: 'calendar-president-suite',
                    campId,
                    promotionPlanProductId: null,
                    name: '总裁套间（桑拿浴缸露台电竞麻将）',
                    mainPhotoMediaUrl: '',
                    directRatio: null,
                    parentRatio: null,
                    type: 0,
                    state: 0,
                },
                {
                    productId: 'calendar-tianluo-suite',
                    campId,
                    promotionPlanProductId: null,
                    name: '天落大床电竞套间',
                    mainPhotoMediaUrl: '',
                    directRatio: null,
                    parentRatio: null,
                    type: 0,
                    state: 0,
                },
                {
                    productId: 'calendar-cinema-room',
                    campId,
                    promotionPlanProductId: null,
                    name: '观影大床房',
                    mainPhotoMediaUrl: '',
                    directRatio: null,
                    parentRatio: null,
                    type: 0,
                    state: 0,
                },
                {
                    productId: 'presale-tianluo-ticket',
                    campId,
                    promotionPlanProductId: null,
                    name: '天落电竞套房预售券',
                    mainPhotoMediaUrl: '',
                    directRatio: 5,
                    parentRatio: 2,
                    type: 1,
                    state: 1,
                },
            ],
            requestEcho: requestBody,
        },
        traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-commission-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockCommissionEmptyEnvelope(requestBody) {
    return {
        ...mockCommissionSuccessEnvelope(requestBody),
        data: {
            ...mockCommissionSuccessEnvelope(requestBody).data,
            total: 0,
            list: [],
        },
        traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-commission-empty-001',
    };
}
function mockCommissionErrorEnvelope() {
    return {
        code: 50001,
        message: '全员营销数据加载失败',
        data: null,
        traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-commission-error-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockDistributionSuccessEnvelope(requestBody) {
    return {
        code: 0,
        message: 'success',
        data: {
            metric: { turnover: 0, commission: 0 },
            productSale: {
                total: 0,
                size: 10,
                current: 1,
                pageNum: 1,
                hasNextPage: false,
                pages: 0,
                list: [],
            },
            distributors: {
                total: 0,
                size: 10,
                current: 1,
                pageNum: 1,
                hasNextPage: false,
                pages: 0,
                list: [],
            },
            requestEcho: requestBody,
        },
        traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-distribution-001',
        timestamp: '2026-05-18T10:00:00+08:00',
    };
}
function mockDistributionEmptyEnvelope(requestBody) {
    return {
        ...mockDistributionSuccessEnvelope(requestBody),
        traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-distribution-empty-001',
    };
}
function mockDistributionErrorEnvelope() {
    return {
        code: 50002,
        message: '全员营销数据加载失败',
        data: null,
        traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-distribution-error-001',
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
function resolveFullMarketingProviderName(explicitProvider) {
    const configured = explicitProvider ||
        readRuntimeConfig('pms.fullMarketingProvider') ||
        readRuntimeConfig('pmsFullMarketingProvider') ||
        import.meta.env.VITE_FULL_MARKETING_PROVIDER ||
        import.meta.env.VITE_PMS_FULL_MARKETING_PROVIDER;
    return configured === 'api' || configured === 'real' ? 'api' : 'mock';
}
function createJsonHeaders() {
    const headers = new Headers({ 'content-type': 'application/json' });
    const token = readRuntimeConfig('pms_token');
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    return headers;
}
function resolveFullMarketingMockMode() {
    const configured = readRuntimeConfig('pms.fullMarketingMockMode') ||
        import.meta.env.VITE_PMS_FULL_MARKETING_MOCK_MODE;
    if (configured === 'empty' || configured === 'error')
        return configured;
    return 'success';
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
function readBoolean(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
}
function readProductType(value) {
    return value === 1 || value === '1' || value === 'presale' ? 'presale' : 'calendar';
}
function formatRatio(value) {
    const numberValue = readNumber(value);
    return numberValue === null ? '-%' : `${numberValue}%`;
}
function formatMoney(value) {
    return value === 0 ? '0' : `¥${value.toLocaleString('zh-CN')}`;
}
function toExclusiveEndDate(date) {
    const parsed = new Date(`${date}T00:00:00+08:00`);
    if (Number.isNaN(parsed.getTime()))
        return date;
    parsed.setDate(parsed.getDate() + 1);
    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const day = `${parsed.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}
