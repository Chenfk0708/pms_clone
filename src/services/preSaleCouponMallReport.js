import { resolveCurrentCampId } from '../utils/camp';
const RESPONSE_TIMESTAMP = '2026-05-18T10:00:00+08:00';
const REAL_BASE_URL = '/api';
const PROMOTION_METRIC_ENDPOINT = '/report/promotion/get';
const PROMOTION_PRODUCT_SALE_ENDPOINT = '/report/promotion/productSale/page/get';
const stores = [
    {
        poi_id: '1796425098638573570',
        poi_name: '天落会宿公寓(前海壹方城宝安中心店)',
    },
];
const channels = [
    { value: '', label: '全部渠道' },
    { value: '17', label: '路客云聚合' },
    { value: '3', label: '美团民宿' },
    { value: '2', label: '途家' },
    { value: '1', label: '爱彼迎' },
];
const categories = [
    { value: '', label: '全部类型' },
    { value: '14', label: '房券' },
    { value: '15', label: '门票券' },
    { value: '16', label: '餐饮券' },
    { value: '17', label: '套餐' },
];
const successRows = [
    {
        id: 'pre-sale-coupon-mall-001',
        pre_sale_name: '天落电竞双人房周末通兑券',
        category_name: '房券',
        channel_name: '路客云聚合、美团民宿',
        make_bargain_count: 68,
        transaction_price: 10240,
        turnover_rate: '79.1%',
        write_off_count: 45,
        write_off_price: 7020,
        write_off_rate: '66.2%',
        refund_count: 3,
        refund_price: 420,
        refund_rate: '4.4%',
        updated_at: '2026-05-18 10:00:00',
        remark: '周末房券成交稳定，核销集中在近 7 天。',
    },
    {
        id: 'pre-sale-coupon-mall-002',
        pre_sale_name: '顶层套房生日布置套餐',
        category_name: '套餐',
        channel_name: '途家',
        make_bargain_count: 34,
        transaction_price: 8300,
        turnover_rate: '58.6%',
        write_off_count: 22,
        write_off_price: 6120,
        write_off_rate: '64.7%',
        refund_count: 1,
        refund_price: 180,
        refund_rate: '2.9%',
        updated_at: '2026-05-18 09:42:00',
        remark: '套餐客单价高，退款少但核销周期更长。',
    },
    {
        id: 'pre-sale-coupon-mall-003',
        pre_sale_name: '双人下午茶体验券',
        category_name: '餐饮券',
        channel_name: '美团民宿',
        make_bargain_count: 66,
        transaction_price: 7240,
        turnover_rate: '82.5%',
        write_off_count: 54,
        write_off_price: 12640,
        write_off_rate: '81.8%',
        refund_count: 4,
        refund_price: 520,
        refund_rate: '6.1%',
        updated_at: '2026-05-18 09:15:00',
        remark: '餐饮券核销快，适合做渠道拉新活动。',
    },
];
const descriptionRows = [
    {
        field: '成交券数',
        description: '统计周期内已下单的预售券数量，包含已核销和已退款券。',
    },
    {
        field: '核销率',
        description: '核销券数 ÷ 成交券数，用于衡量预售券转化为实际消费的效率。',
    },
    {
        field: '退款金额',
        description: '统计周期内已发生退款的金额汇总，用于评估异常退单影响。',
    },
];
export class PreSaleCouponMallServiceError extends Error {
    response;
    provider;
    state;
    request;
    constructor(message, response, request) {
        super(message);
        this.name = 'PreSaleCouponMallServiceError';
        this.response = response;
        this.provider = resolvePreSaleCouponMallProvider();
        this.state = 'error';
        this.request = request;
    }
}
export function defaultPreSaleCouponMallQuery() {
    return {
        campId: resolveCurrentCampId('10001'),
        poiId: '1796425098638573570',
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        channelId: '',
        categoryId: '',
        keyword: '',
        page: 1,
        pageSize: 20,
        state: 'success',
    };
}
export function resolvePreSaleCouponMallProvider() {
    const urlValue = readPreSaleCouponMallUrlProvider();
    const envValue = import.meta.env.VITE_PRE_SALE_COUPON_MALL_PROVIDER;
    const localValue = typeof window !== 'undefined' ? window.localStorage.getItem('pms.preSaleCouponMallProvider') : null;
    const provider = urlValue || envValue || localValue || 'mock';
    if (provider === 'mock' || provider === 'api' || provider === 'real')
        return provider === 'real' ? 'api' : provider;
    throw new Error(`Unsupported pre sale coupon mall provider: ${provider}`);
}
function readPreSaleCouponMallUrlProvider() {
    if (typeof window === 'undefined')
        return '';
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    return (searchParams.get('provider') ||
        searchParams.get('preSaleCouponMallProvider') ||
        hashParams.get('provider') ||
        hashParams.get('preSaleCouponMallProvider') ||
        '');
}
export async function fetchPreSaleCouponMallDashboard(request, signal) {
    const provider = resolvePreSaleCouponMallProvider();
    const normalizedRequest = normalizeQuery(request);
    if (provider === 'api') {
        return fetchRealDashboard(normalizedRequest, signal);
    }
    await waitForMockLatency(signal);
    if (normalizedRequest.state === 'error') {
        throw new PreSaleCouponMallServiceError('预售券核销明细加载失败，请稍后重试', envelope(503, 'pre sale coupon mall query failed', null, 'mock-pre-sale-coupon-mall-error-001'), normalizedRequest);
    }
    const dashboardEnvelope = makeDashboardEnvelope(normalizedRequest);
    return adaptDashboard(provider, normalizedRequest, dashboardEnvelope);
}
export async function createPreSaleCouponMallExportTask(request, signal) {
    await waitForMockLatency(signal);
    return envelope(0, 'success', {
        taskId: 'pre-sale-coupon-mall-export-20260518-001',
        requestedAt: RESPONSE_TIMESTAMP,
        request: normalizeQuery(request),
    }, 'mock-pre-sale-coupon-mall-export-001');
}
function normalizeQuery(request) {
    const defaults = defaultPreSaleCouponMallQuery();
    const state = request.state === 'empty' || request.state === 'error' ? request.state : 'success';
    return {
        ...defaults,
        ...request,
        poiId: request.poiId || defaults.poiId,
        poiName: request.poiName ||
            stores.find((store) => store.poi_id === request.poiId)?.poi_name ||
            defaults.poiName,
        page: Number.isFinite(request.page) && request.page > 0 ? Math.floor(request.page) : defaults.page,
        pageSize: Number.isFinite(request.pageSize) && request.pageSize > 0 ? Math.floor(request.pageSize) : defaults.pageSize,
        keyword: request.keyword.trim(),
        state,
    };
}
function makeDashboardEnvelope(request) {
    const filteredRows = request.state === 'empty' ? [] : filterRows(request);
    const metrics = request.state === 'empty'
        ? [
            metric('makeBargainCount', '总成交券数', 0, '张', '统计周期内已成交的全部预售券数量。'),
            metric('transactionPrice', '总交易金额', 0, '元', '统计周期内预售券成交金额汇总。'),
            metric('writeOffCount', '总核销券数', 0, '张', '统计周期内已完成核销的预售券数量。'),
            metric('writeOffPrice', '总核销金额', 0, '元', '统计周期内已完成核销对应的金额汇总。'),
        ]
        : [
            metric('makeBargainCount', '总成交券数', 168, '张', '统计周期内已成交的全部预售券数量。'),
            metric('transactionPrice', '总交易金额', 25780, '元', '统计周期内预售券成交金额汇总。'),
            metric('writeOffCount', '总核销券数', 121, '张', '统计周期内已完成核销的预售券数量。'),
            metric('writeOffPrice', '总核销金额', 25780, '元', '统计周期内已完成核销对应的金额汇总。'),
        ];
    return envelope(0, 'success', {
        stores,
        channels,
        categories,
        metrics,
        descriptions: descriptionRows,
        list: filteredRows,
        pagination: {
            page: request.page,
            pageSize: request.pageSize,
            total: filteredRows.length,
        },
    }, 'mock-pre-sale-coupon-mall-dashboard-001');
}
async function fetchRealDashboard(request, signal) {
    const [metricResponse, productSaleResponse] = await Promise.all([
        postHudson(PROMOTION_METRIC_ENDPOINT, createPromotionMetricRequestBody(request), signal),
        postHudson(PROMOTION_PRODUCT_SALE_ENDPOINT, createPromotionProductSaleRequestBody(request), signal),
    ]).catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError')
            throw error;
        throw new PreSaleCouponMallServiceError(error instanceof Error ? error.message : '预售券核销明细加载失败，请稍后重试', envelope(503, 'api pre sale coupon mall query failed', null, 'api-pre-sale-coupon-mall-error'), request);
    });
    const productRows = adaptPromotionProductRows(productSaleResponse.data?.list ?? []);
    const metricPayload = metricResponse.data ?? {};
    const total = readNumber(productSaleResponse.data?.total, productRows.length);
    const page = readNumber(productSaleResponse.data?.current ?? productSaleResponse.data?.pageNum, request.page);
    const pageSize = readNumber(productSaleResponse.data?.size ?? productSaleResponse.data?.pageSize, request.pageSize);
    const metricOrderCount = readNumber(metricPayload.orderCount, productRows.reduce((sum, row) => sum + row.make_bargain_count, 0));
    const metricTurnover = readNumber(metricPayload.turnover, productRows.reduce((sum, row) => sum + row.transaction_price, 0));
    const dashboardEnvelope = envelope(0, 'success', {
        stores,
        channels,
        categories,
        metrics: [
            metric('makeBargainCount', '总成交券数', metricOrderCount, '张', '来自分销预售券订单数。'),
            metric('transactionPrice', '总交易金额', metricTurnover, '元', '来自分销预售券成交金额。'),
            metric('writeOffCount', '总核销券数', 0, '张', '当前后端接口暂未返回核销字段。'),
            metric('writeOffPrice', '总核销金额', 0, '元', '当前后端接口暂未返回核销金额字段。'),
        ],
        descriptions: [
            ...descriptionRows,
            {
                field: '真实接口口径',
                description: '当前接入的是预售券分销成交接口，后端暂未提供真实核销、退款明细字段。',
            },
        ],
        list: productRows,
        pagination: {
            page,
            pageSize,
            total,
        },
    }, productSaleResponse.traceId || metricResponse.traceId || 'api-pre-sale-coupon-mall-dashboard');
    return {
        ...adaptDashboard('api', request, dashboardEnvelope),
        updatedAt: productSaleResponse.timestamp || metricResponse.timestamp || new Date().toISOString(),
        traceIds: [metricResponse.traceId, productSaleResponse.traceId].filter((traceId) => Boolean(traceId)),
    };
}
function createPromotionMetricRequestBody(request) {
    return {
        campId: request.campId,
        startDate: request.startDate,
        endDate: request.endDate,
        type: '1',
    };
}
function createPromotionProductSaleRequestBody(request) {
    return {
        campId: request.campId,
        pageNum: request.page,
        pageSize: request.pageSize,
        startDate: request.startDate,
        endDate: request.endDate,
        type: '1',
    };
}
function adaptPromotionProductRows(list) {
    return list.map((item, index) => {
        const record = asRecord(item);
        const sales = readNumber(record.sales ?? record.saleNum, 0);
        const turnover = readNumber(record.turnover ?? record.amount, 0);
        const name = readString(record.name ?? record.productName, `预售券商品${index + 1}`);
        return {
            id: readString(record.id ?? record.productId, `api-presale-${index}`),
            pre_sale_name: name,
            category_name: readString(record.categoryName ?? record.category, '预售券'),
            channel_name: readString(record.channelName ?? record.channel, '全部渠道'),
            make_bargain_count: sales,
            transaction_price: turnover,
            turnover_rate: '-',
            write_off_count: 0,
            write_off_price: 0,
            write_off_rate: '0%',
            refund_count: 0,
            refund_price: 0,
            refund_rate: '0%',
            updated_at: readString(record.updatedAt ?? record.createTime, new Date().toISOString().slice(0, 19).replace('T', ' ')),
            remark: '真实接口暂未返回核销/退款字段，当前仅展示预售券成交口径。',
        };
    });
}
function filterRows(request) {
    const keyword = request.keyword.trim().toLowerCase();
    return successRows.filter((row) => {
        const matchesChannel = request.channelId ? row.channel_name.includes(findOptionLabel(channels, request.channelId)) : true;
        const matchesCategory = request.categoryId ? row.category_name === findOptionLabel(categories, request.categoryId) : true;
        const matchesKeyword = !keyword ||
            row.pre_sale_name.toLowerCase().includes(keyword) ||
            row.category_name.toLowerCase().includes(keyword) ||
            row.channel_name.toLowerCase().includes(keyword);
        return matchesChannel && matchesCategory && matchesKeyword;
    });
}
function findOptionLabel(options, value) {
    return options.find((option) => option.value === value)?.label ?? '';
}
function metric(key, title, value, unit, detailText) {
    return {
        metric_key: key,
        metric_title: title,
        metric_value: value,
        unit,
        detail_text: detailText,
    };
}
function adaptDashboard(provider, request, response) {
    assertOk(response);
    return {
        provider,
        state: request.state ?? 'success',
        request,
        stores: response.data.stores.map((store) => ({ id: store.poi_id, name: store.poi_name })),
        channels: response.data.channels,
        categories: response.data.categories,
        metrics: response.data.metrics.map((item) => ({
            key: item.metric_key,
            title: item.metric_title,
            value: item.metric_value,
            unit: item.unit,
            detail: item.detail_text,
        })),
        rows: response.data.list.map((row) => ({
            id: row.id,
            preSaleName: row.pre_sale_name,
            categoryName: row.category_name,
            channelName: row.channel_name,
            makeBargainCount: row.make_bargain_count,
            transactionPrice: row.transaction_price,
            turnoverRate: row.turnover_rate,
            writeOffCount: row.write_off_count,
            writeOffPrice: row.write_off_price,
            writeOffRate: row.write_off_rate,
            refundCount: row.refund_count,
            refundPrice: row.refund_price,
            refundRate: row.refund_rate,
            updatedAt: row.updated_at,
            remark: row.remark,
        })),
        descriptions: response.data.descriptions,
        pagination: response.data.pagination,
        updatedAt: RESPONSE_TIMESTAMP,
        traceIds: [response.traceId],
    };
}
function assertOk(response) {
    if (response.code !== 0) {
        throw new Error(response.message);
    }
}
async function postHudson(endpoint, body, signal) {
    const response = await fetch(`${REAL_BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok || !payload || isFailedResponse(payload)) {
        throw new Error(extractErrorMessage(payload) || `预售券核销明细接口返回 HTTP ${response.status}`);
    }
    if (payload.data === undefined || payload.data === null) {
        throw new Error('预售券核销明细接口响应缺少 data 字段');
    }
    return payload;
}
function isFailedResponse(payload) {
    if (payload.code !== undefined)
        return payload.code !== 0;
    return payload.success === false;
}
function extractErrorMessage(payload) {
    if (!payload)
        return '';
    return payload.message || payload.errorMsg || payload.errorCode?.toString() || '';
}
function envelope(code, message, data, traceId) {
    return {
        code,
        message,
        data,
        traceId,
        timestamp: RESPONSE_TIMESTAMP,
    };
}
function waitForMockLatency(signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Request aborted', 'AbortError'));
            return;
        }
        const timer = window.setTimeout(resolve, 180);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Request aborted', 'AbortError'));
        }, { once: true });
    });
}
function readNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function readString(value, fallback) {
    if (typeof value === 'string' && value.trim())
        return value.trim();
    if (typeof value === 'number')
        return String(value);
    return fallback;
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
