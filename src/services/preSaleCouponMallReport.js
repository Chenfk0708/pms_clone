const RESPONSE_TIMESTAMP = '2026-05-18T10:00:00+08:00';
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
        campId: '1796067693589061634',
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
    const localValue = typeof window !== 'undefined' ? window.localStorage.getItem('pms.preSaleCouponMallProvider') : null;
    const envValue = import.meta.env.VITE_PRE_SALE_COUPON_MALL_PROVIDER;
    const provider = localValue || envValue || 'mock';
    if (provider === 'mock' || provider === 'api')
        return provider;
    throw new Error(`Unsupported pre sale coupon mall provider: ${provider}`);
}
export async function fetchPreSaleCouponMallDashboard(request, signal) {
    const provider = resolvePreSaleCouponMallProvider();
    const normalizedRequest = normalizeQuery(request);
    if (provider === 'api') {
        throw new PreSaleCouponMallServiceError('预售券核销明细加载失败，请稍后重试', envelope(503, 'service unavailable', null, 'api-pre-sale-coupon-mall-unavailable'), normalizedRequest);
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
