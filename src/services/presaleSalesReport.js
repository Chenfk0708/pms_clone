export const PRESALE_SALES_OVERVIEW_ENDPOINT = '/order/report/get';
export const PRESALE_SALES_SOURCE_ENDPOINT = '/report/store/management/get';
export const PRESALE_SALES_STORE_ENDPOINT = '/select/poi/page/get';
export const PRESALE_SALES_ROOM_CATEGORY_ENDPOINT = '/roomCategories/page/get';
export const PRESALE_SALES_REMINDER_ENDPOINT = '/orders/strongReminder/page/get';
export const PRESALE_SALES_EDITION_ENDPOINT = '/edition/resource/get';
export const PRESALE_SALES_PAYMENT_ENDPOINT = '/paymentTypes/get';
export const PRESALE_SALES_PAYMENT_GROUP_ENDPOINT = '/paymentTypes/get/v2';
const DEFAULT_CAMP_ID = '1796067693589061634';
const DEFAULT_START_DATE = '2026-05-18';
const DEFAULT_END_DATE = '2026-05-18';
const TASK_ID = 'baobiao--yushouquan-shuju--yushouquan-xiaoshou-tongji';
const MOCK_TIMESTAMP = '2026-05-19T16:57:53+08:00';
const DEFAULT_MOCK_DELAY_MS = 180;
export class PresaleSalesServiceError extends Error {
    provider;
    state;
    response;
    constructor(message, provider, state, response) {
        super(message);
        this.name = 'PresaleSalesServiceError';
        this.provider = provider;
        this.state = state;
        this.response = response;
    }
}
export function createDefaultPresaleSalesQuery() {
    return {
        campId: DEFAULT_CAMP_ID,
        startDate: DEFAULT_START_DATE,
        endDate: DEFAULT_END_DATE,
        state: 'success',
    };
}
export function createInitialPresaleSalesQuery() {
    const defaults = createDefaultPresaleSalesQuery();
    if (typeof window === 'undefined')
        return defaults;
    const params = new URLSearchParams(window.location.search);
    return {
        campId: params.get('campId') || defaults.campId,
        startDate: params.get('startDate') || defaults.startDate,
        endDate: params.get('endDate') || defaults.endDate,
        state: resolvePresaleSalesState(params.get('mockState') || window.localStorage.getItem('pms.presaleSales.state')),
    };
}
export function createPresaleSalesRequestBodies(query) {
    return [
        {
            label: '经营概览',
            path: PRESALE_SALES_OVERVIEW_ENDPOINT,
            body: {
                campId: query.campId,
            },
        },
        {
            label: '预售券销售分析',
            path: PRESALE_SALES_SOURCE_ENDPOINT,
            body: {
                campId: query.campId,
                startDate: query.startDate,
                endDate: query.endDate,
            },
        },
        {
            label: '门店列表',
            path: PRESALE_SALES_STORE_ENDPOINT,
            body: {
                campId: query.campId,
                pageSize: 999,
                pageNum: 1,
                channelId: 0,
                isAvailability: '1',
            },
        },
        {
            label: '房型列表',
            path: PRESALE_SALES_ROOM_CATEGORY_ENDPOINT,
            body: {
                campId: query.campId,
                pageSize: 999,
                pageNum: 1,
                roomCategoryName: '',
                keyword: '',
                cityIds: [],
                channelId: '',
            },
        },
        {
            label: '待办提醒',
            path: PRESALE_SALES_REMINDER_ENDPOINT,
            body: {
                campId: query.campId,
            },
        },
        {
            label: '版本资源',
            path: PRESALE_SALES_EDITION_ENDPOINT,
            body: {
                campId: query.campId,
            },
        },
        {
            label: '支付方式',
            path: PRESALE_SALES_PAYMENT_ENDPOINT,
            body: {
                campId: query.campId,
            },
        },
        {
            label: '支付分组',
            path: PRESALE_SALES_PAYMENT_GROUP_ENDPOINT,
            body: {
                campId: query.campId,
                bizTypes: [2],
                isEnable: 1,
            },
        },
    ];
}
export function resolvePresaleSalesProvider() {
    if (typeof window === 'undefined')
        return 'mock';
    const params = new URLSearchParams(window.location.search);
    const paramProvider = params.get('provider');
    if (paramProvider === 'api')
        return 'api';
    return normalizeProviderValue(window.localStorage.getItem('pms.presaleSales.provider')) === 'api' ? 'api' : 'mock';
}
export async function fetchPresaleSalesDashboard(input, signal) {
    const query = normalizePresaleSalesQuery(input);
    const provider = resolvePresaleSalesProvider();
    if (provider === 'api') {
        throw new PresaleSalesServiceError('预售券销售数据服务暂不可用，请稍后重试', provider, query.state, createNullEnvelope(503, 'service unavailable', 'api'));
    }
    await delay(resolvePresaleSalesLatency(), signal);
    validatePresaleSalesQuery(query);
    if (query.state === 'error') {
        throw new PresaleSalesServiceError('预售券销售统计加载失败，请稍后重试', provider, query.state, createNullEnvelope(500, 'mock failed', 'error'));
    }
    const envelope = createEnvelope(createMockPayload(query), query.state === 'empty' ? 'empty' : 'success');
    return adaptDashboard(provider, query.state, envelope);
}
function adaptDashboard(provider, state, envelope) {
    return {
        provider,
        state,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
        serviceRequests: envelope.data.serviceRequests,
        metricCards: envelope.data.metricCards,
        trendCharts: envelope.data.trendCharts,
        sourceSummary: envelope.data.sourceSummary,
        sourceRows: envelope.data.sourceRows,
        detailRoute: envelope.data.detailRoute,
        emptyMessage: envelope.data.emptyMessage,
    };
}
function createMockPayload(query) {
    const serviceRequests = createPresaleSalesRequestBodies(query);
    const isEmpty = query.state === 'empty';
    return {
        serviceRequests,
        metricCards: isEmpty ? buildEmptyMetricCards() : buildSuccessMetricCards(),
        trendCharts: isEmpty ? buildEmptyTrendCharts() : buildSuccessTrendCharts(),
        sourceSummary: isEmpty ? buildEmptySourceSummary() : buildSuccessSourceSummary(),
        sourceRows: isEmpty ? [] : buildSuccessSourceRows(),
        detailRoute: '/statistics/preSaleCouponMall',
        emptyMessage: '当前周期暂无预售券成交数据',
    };
}
function buildSuccessMetricCards() {
    return [
        metricCard('total', '预售券总交易额', '￥12,486', '128', '￥8,492', '￥624'),
        metricCard('room', '房券交易额', '￥5,268', '46', '￥3,712', '￥188'),
        metricCard('ticket', '门票券交易额', '￥3,124', '38', '￥2,146', '￥136'),
        metricCard('catering', '餐饮券交易额', '￥1,842', '24', '￥1,295', '￥96'),
        metricCard('package', '套餐交易额', '￥2,252', '20', '￥1,339', '￥204'),
    ];
}
function buildEmptyMetricCards() {
    return [
        metricCard('total', '预售券总交易额', '￥0', '0', '￥0', '￥0'),
        metricCard('room', '房券交易额', '￥0', '0', '￥0', '￥0'),
        metricCard('ticket', '门票券交易额', '￥0', '0', '￥0', '￥0'),
        metricCard('catering', '餐饮券交易额', '￥0', '0', '￥0', '￥0'),
        metricCard('package', '套餐交易额', '￥0', '0', '￥0', '￥0'),
    ];
}
function buildSuccessTrendCharts() {
    const series = buildTrendSeries();
    return {
        amount: {
            title: '交易额趋势',
            unit: '元',
            series,
            points: [
                trendPoint('05-12', 1320, 508, 322, 186, 304),
                trendPoint('05-13', 1456, 562, 381, 204, 309),
                trendPoint('05-14', 1562, 618, 402, 225, 317),
                trendPoint('05-15', 1718, 706, 436, 244, 332),
                trendPoint('05-16', 1686, 684, 428, 239, 335),
                trendPoint('05-17', 1832, 742, 466, 258, 366),
                trendPoint('05-18', 1912, 781, 489, 266, 376),
            ],
        },
        orders: {
            title: '订单量趋势',
            unit: '单',
            series,
            points: [
                trendPoint('05-12', 14, 5, 4, 2, 3),
                trendPoint('05-13', 15, 6, 4, 2, 3),
                trendPoint('05-14', 17, 6, 5, 3, 3),
                trendPoint('05-15', 19, 7, 5, 3, 4),
                trendPoint('05-16', 18, 7, 5, 2, 4),
                trendPoint('05-17', 21, 8, 5, 3, 5),
                trendPoint('05-18', 24, 9, 6, 4, 5),
            ],
        },
    };
}
function buildEmptyTrendCharts() {
    const series = buildTrendSeries();
    return {
        amount: { title: '交易额趋势', unit: '元', series, points: [] },
        orders: { title: '订单量趋势', unit: '单', series, points: [] },
    };
}
function buildSuccessSourceSummary() {
    return [
        { label: '成交券数', value: '128', hint: '近 7 日累计成交券数' },
        { label: '核销金额', value: '￥8,492', hint: '近 7 日累计核销金额' },
        { label: '退款率', value: '5.0%', hint: '近 7 日累计退款率' },
    ];
}
function buildEmptySourceSummary() {
    return [
        { label: '成交券数', value: '0', hint: '当前周期未产生预售券成交' },
        { label: '核销金额', value: '￥0', hint: '当前周期未产生核销金额' },
        { label: '退款率', value: '0%', hint: '当前周期未产生退款订单' },
    ];
}
function buildSuccessSourceRows() {
    return [
        sourceRow('mini-program', '小程序商城', '52', '￥4,968', '41.6%', '37', '￥3,624', '43.0%', '3', '￥132', '2.5%'),
        sourceRow('douyin', '抖音团购', '31', '￥2,884', '24.2%', '18', '￥1,973', '23.3%', '2', '￥96', '1.7%'),
        sourceRow('wechat', '企业微信', '24', '￥2,142', '18.3%', '16', '￥1,548', '18.2%', '1', '￥64', '0.8%'),
        sourceRow('front-desk', '门店前台', '21', '￥2,492', '15.9%', '13', '￥1,347', '15.5%', '4', '￥332', '3.3%'),
    ];
}
function normalizePresaleSalesQuery(input) {
    const defaults = createDefaultPresaleSalesQuery();
    return {
        campId: input.campId || defaults.campId,
        startDate: input.startDate || defaults.startDate,
        endDate: input.endDate || defaults.endDate,
        state: input.state || defaults.state,
    };
}
function validatePresaleSalesQuery(query) {
    const start = new Date(`${query.startDate}T00:00:00+08:00`);
    const end = new Date(`${query.endDate}T00:00:00+08:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('预售券销售统计查询日期无效');
    }
    if (start.getTime() > end.getTime()) {
        throw new Error('预售券销售统计开始日期不能晚于结束日期');
    }
}
function resolvePresaleSalesState(value) {
    return value === 'empty' || value === 'error' ? value : 'success';
}
function resolvePresaleSalesLatency() {
    if (typeof window === 'undefined')
        return DEFAULT_MOCK_DELAY_MS;
    const params = new URLSearchParams(window.location.search);
    const candidate = params.get('mockDelayMs') || window.localStorage.getItem('pms.presaleSales.delayMs');
    if (!candidate)
        return DEFAULT_MOCK_DELAY_MS;
    const nextDelay = Number(candidate);
    return Number.isFinite(nextDelay) && nextDelay >= 0 ? nextDelay : DEFAULT_MOCK_DELAY_MS;
}
function createEnvelope(data, suffix) {
    return {
        code: 0,
        message: 'success',
        data,
        traceId: `mock-${TASK_ID}-${suffix}-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
function createNullEnvelope(code, message, suffix) {
    return {
        code,
        message,
        data: null,
        traceId: `mock-${TASK_ID}-${suffix}-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
function metricCard(id, label, value, orderCount, writeOffAmount, refundAmount) {
    return {
        id,
        label,
        value,
        details: [
            { label: '总订单数', value: orderCount },
            { label: '总核销金额', value: writeOffAmount },
            { label: '总退款金额', value: refundAmount },
        ],
    };
}
function buildTrendSeries() {
    return [
        { key: 'total', label: '预售券总交易额', tone: 'blue' },
        { key: 'room', label: '房券交易额', tone: 'violet' },
        { key: 'ticket', label: '门票券交易额', tone: 'green' },
        { key: 'catering', label: '餐饮券交易额', tone: 'pink' },
        { key: 'package', label: '套餐交易额', tone: 'purple' },
    ];
}
function trendPoint(label, total, room, ticket, catering, packageValue) {
    return {
        label,
        total,
        room,
        ticket,
        catering,
        package: packageValue,
    };
}
function sourceRow(id, source, dealCouponCount, transactionAmount, transactionRate, writeOffCouponCount, writeOffAmount, writeOffRate, refundCouponCount, refundAmount, refundRate) {
    return {
        id,
        source,
        dealCouponCount,
        transactionAmount,
        transactionRate,
        writeOffCouponCount,
        writeOffAmount,
        writeOffRate,
        refundCouponCount,
        refundAmount,
        refundRate,
    };
}
function delay(ms, signal) {
    return new Promise((resolve, reject) => {
        const timer = globalThis.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            globalThis.clearTimeout(timer);
            reject(new DOMException('Request aborted', 'AbortError'));
        }, { once: true });
    });
}
function normalizeProviderValue(value) {
    return value === 'api' || value === 'real' ? 'api' : value === 'mock' ? 'mock' : undefined;
}
