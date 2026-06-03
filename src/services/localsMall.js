import { resolveCurrentCampId } from '../utils/camp';
const LOCALS_MALL_PROVIDER_KEY = 'pms.localsMall.provider';
const DEFAULT_CATALOG_CAMP_ID = '64';
const DEFAULT_REAL_CAMP_ID = '10001';
const DEFAULT_MOCK_CAMP_ID = '1796067693589061634';
const DEFAULT_TIMESTAMP = '2026-05-19T11:28:54+08:00';
const DEFAULT_ROUTE_AFTER_SUBMIT = '/smartHotel/smartHardware/smartLook';
const DEFAULT_AGREEMENT_LABEL = '我已经阅读并同意《路客云产品服务购买协议》';
const DEFAULT_PURCHASE_NOTICE = '提交后会创建采购申请，并同步到智能酒店后续配置流程。';
const defaultProductId = 'door-card-system';
const defaultRoomCategoryIds = [
    '1796425099729092609',
    '1796425099485822977',
    '1796425099242553345',
    '1796425098965729282',
];
const mallProducts = [
    {
        id: 'door-card-system',
        sectionId: 'system',
        name: '门卡管理系统',
        description: '支持门卡制卡、发卡和房卡管理，目标站已取证一年期购买入口。',
        image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0017687596945558.png',
        priceLabel: '¥ 800',
        tag: '系统功能',
    },
    {
        id: 'cpe-p5',
        sectionId: 'hardware',
        name: '蜂助手 CPE 路由器 P5(5G 门店版)',
        description: '适合高并发门店联网部署，当前按商城统一采购链路承接。',
        image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/Frlt8ag-VDbNxOh89eJ1VdLMUa89.png',
        priceLabel: '¥ 1,643',
        tag: '智能硬件',
    },
    {
        id: 'cpe-s1',
        sectionId: 'hardware',
        name: '蜂助手 CPE 路由器 S1(4G 版)',
        description: '适合轻量门店联网与备用链路场景。',
        image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/Fj94TEpC_LcsFp5VvAjmtvNZxsEu.jpg',
        priceLabel: '¥ 896',
        tag: '智能硬件',
    },
    {
        id: 'box-s2',
        sectionId: 'hardware',
        name: '蜂助手 4G 盒子 S2(极光 TV 版)',
        description: '客房多媒体与轻部署场景的统一采购入口。',
        image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/FrJO5s4hR7Rv7WZizAXeUrsVDW6j.jpg',
        priceLabel: '¥ 1,195',
        tag: '智能硬件',
    },
    {
        id: 'uifi-u1',
        sectionId: 'hardware',
        name: '蜂助手随身 WiFi U1',
        description: '适用于移动补点和短期门店布点。',
        image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/FoqI8nd05yB3budBt9VZt9BI8NGw.png',
        priceLabel: '¥ 341',
        tag: '智能硬件',
    },
    {
        id: 'smart-lock',
        sectionId: 'hardware',
        name: '指定款【智能密码锁/门锁】',
        description: '适合智慧酒店门锁改造，与既有智能门锁页面联动。',
        image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/zdkms.webp',
        priceLabel: '¥ 998',
        tag: '智能硬件',
    },
    {
        id: 'd12-lock',
        sectionId: 'hardware',
        name: '无人入住智能门锁 D12',
        description: '适合无人入住场景的硬件采购入口。',
        image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/wrrzms.webp',
        priceLabel: '¥ 299',
        tag: '智能硬件',
    },
];
const quickEntries = [
    {
        id: 'smart-lock',
        label: '智能门锁',
        path: '/smartHotel/smartHardware/smartLook',
        description: '继续配置门锁品牌与门店接入信息。',
    },
    {
        id: 'self-checkin',
        label: '自助入住',
        path: '/smartHotel/smartHome',
        description: '查看自助入住与门锁联动方案。',
    },
    {
        id: 'global-setting',
        label: '全局设置',
        path: '/smartHotel/checkInGuide',
        description: '进入智慧酒店全局配置与策略设置。',
    },
];
const roomGroups = [
    {
        roomCategoryId: '1796425099729092609',
        roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
        rooms: ['房间1'],
    },
    {
        roomCategoryId: '1796425099485822977',
        roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
        rooms: ['房间1'],
    },
    {
        roomCategoryId: '1796425099242553345',
        roomCategoryName: '天际大床电竞套间',
        rooms: ['房间1'],
    },
    {
        roomCategoryId: '1796425098965729282',
        roomCategoryName: '观影大床房',
        rooms: ['房间1'],
    },
];
const paymentGroups = [
    {
        groupType: 1,
        groupTypeName: '住宿',
        paymentTypes: ['加床', '加人', '损坏赔偿', '其他收入', '退房费'],
    },
];
export function createDefaultLocalsMallQuery(searchParams = new URLSearchParams(), page = 'mall') {
    const provider = getLocalsMallProviderName();
    const fallbackCampId = provider === 'api' ? resolveCurrentCampId(DEFAULT_REAL_CAMP_ID) : DEFAULT_MOCK_CAMP_ID;
    const campId = searchParams.get('campId')?.trim() || fallbackCampId;
    const buyCampId = searchParams.get('buyCampId')?.trim() || campId;
    return {
        campId,
        buyCampId,
        page,
        mockState: toMockState(searchParams.get('mockState')),
        productId: searchParams.get('productId') || defaultProductId,
    };
}
export function getLocalsMallContract(query, provider, state, traceId = '') {
    return {
        provider,
        state,
        traceId,
        overviewRequest: {
            method: 'POST',
            path: '/weiRoomCategories/page/get',
            body: {
                campId: DEFAULT_CATALOG_CAMP_ID,
                buyCampId: query.buyCampId,
                roomCategoryTypes: [1],
                goodsTypes: [6],
            },
        },
        commodityRequest: {
            method: 'POST',
            path: '/youzan/commodity/get',
            body: {
                campId: query.campId,
                commodityId: query.productId,
            },
        },
        roomsRequest: {
            method: 'POST',
            path: '/rooms/get',
            body: {
                campId: query.campId,
                roomCategoryIds: defaultRoomCategoryIds,
                saleType: 1,
            },
        },
        paymentRequest: {
            method: 'POST',
            path: '/paymentTypes/get/v2',
            body: {
                campId: query.campId,
                bizTypes: [2],
                isEnable: 1,
            },
        },
        paymentWayRequest: {
            method: 'POST',
            path: '/paymentWays/get',
            body: {
                campId: query.campId,
            },
        },
    };
}
export async function fetchLocalsMallOverview(query, signal, providerName = getLocalsMallProviderName()) {
    validateQuery(query);
    if (providerName === 'api') {
        return fetchApiLocalsMallOverview(query, signal);
    }
    await waitForMockLatency(signal);
    return adaptOverviewEnvelope(buildOverviewEnvelope(query), providerName);
}
export async function fetchLocalsMallDetail(query, signal, providerName = getLocalsMallProviderName()) {
    validateQuery(query);
    if (providerName === 'api') {
        return fetchApiLocalsMallDetail(query, signal);
    }
    await waitForMockLatency(signal);
    return adaptDetailEnvelope(buildDetailEnvelope(query), providerName);
}
export async function fetchLocalsMallApplicableRooms(query, signal, providerName = getLocalsMallProviderName()) {
    validateQuery(query);
    if (providerName === 'api') {
        const detail = await fetchApiLocalsMallComposite(query, signal);
        return detail.roomGroups;
    }
    await waitForMockLatency(signal);
    if (query.mockState === 'error') {
        throw new Error('适用房型加载失败，请稍后重试');
    }
    return roomGroups;
}
export async function fetchLocalsMallPaymentGroups(query, signal, providerName = getLocalsMallProviderName()) {
    validateQuery(query);
    if (providerName === 'api') {
        const detail = await fetchApiLocalsMallComposite(query, signal);
        return detail.paymentGroups;
    }
    await waitForMockLatency(signal);
    if (query.mockState === 'error') {
        throw new Error('支付方式加载失败，请稍后重试');
    }
    return paymentGroups;
}
function getLocalsMallProviderName() {
    if (typeof window === 'undefined')
        return 'mock';
    return normalizeProviderValue(window.localStorage.getItem(LOCALS_MALL_PROVIDER_KEY)) === 'api' ? 'api' : 'mock';
}
async function fetchApiLocalsMallOverview(query, signal) {
    const response = await postHudsonEnvelope('/weiRoomCategories/page/get', {
        campId: DEFAULT_CATALOG_CAMP_ID,
        buyCampId: query.buyCampId,
        roomCategoryTypes: [1],
        goodsTypes: [6],
        pageNum: 1,
        pageSize: 99,
        keyword: '',
    }, signal);
    const items = asArray(response.data?.list);
    const products = items.map(adaptOverviewItem);
    const sections = buildOverviewSections(products);
    return {
        provider: 'api',
        traceId: response.traceId,
        requestedAt: response.timestamp,
        requestedAtLabel: buildRequestedAtLabel(response.timestamp),
        sections,
        quickEntries,
        emptyState: products.length === 0
            ? {
                title: '当前门店暂无可采购的商品',
                description: '可先完成智慧酒店基础设置，再回到路客商城统一发起采购。',
                actionLabel: '前往全局设置',
                actionPath: '/smartHotel/checkInGuide',
            }
            : undefined,
    };
}
async function fetchApiLocalsMallDetail(query, signal) {
    const composite = await fetchApiLocalsMallComposite(query, signal);
    const commodity = composite.commodity;
    const roomGroupsList = composite.roomGroups;
    const paymentGroupsList = composite.paymentGroups;
    return {
        provider: 'api',
        traceId: commodity.traceId,
        requestedAt: commodity.timestamp,
        requestedAtLabel: buildRequestedAtLabel(commodity.timestamp),
        productId: commodity.data.commodityId || query.productId,
        productName: commodity.data.commodityName || fallbackProductName(query.productId),
        productDescription: commodity.data.description || '',
        purchaseTermLabel: commodity.data.purchaseTermLabel || '1年',
        buyerName: readBuyerName(),
        totalAmountLabel: formatMoneyLabel(commodity.data.sellingPriceCent),
        agreementLabel: DEFAULT_AGREEMENT_LABEL,
        purchaseNotice: DEFAULT_PURCHASE_NOTICE,
        routeAfterSubmit: DEFAULT_ROUTE_AFTER_SUBMIT,
        roomSummary: buildRoomSummary(roomGroupsList),
        paymentSummary: buildPaymentSummary(paymentGroupsList),
        roomCategoryIds: commodity.data.roomCategoryIds?.length ? commodity.data.roomCategoryIds : roomGroupsList.map((group) => group.roomCategoryId),
    };
}
async function fetchApiLocalsMallComposite(query, signal) {
    const commodity = await postHudsonEnvelope('/youzan/commodity/get', {
        campId: query.campId,
        commodityId: query.productId,
    }, signal);
    const roomCategoryIds = asArray(commodity.data?.roomCategoryIds).filter(Boolean);
    const [roomsResponse, paymentResponse] = await Promise.all([
        postHudsonEnvelope('/rooms/get', {
            campId: query.campId,
            roomCategoryIds,
            saleType: 1,
        }, signal),
        postHudsonEnvelope('/paymentTypes/get/v2', {
            campId: query.campId,
            bizTypes: [2],
            isEnable: 1,
        }, signal),
    ]);
    return {
        commodity,
        roomGroups: adaptRoomGroups(roomsResponse.data),
        paymentGroups: adaptPaymentGroups(paymentResponse.data),
    };
}
function buildOverviewEnvelope(query) {
    if (query.mockState === 'error') {
        return {
            code: 50301,
            message: '路客商城数据加载失败，请稍后重试',
            data: createEmptyOverviewPayload(),
            traceId: 'mock-locals-mall-overview-error-001',
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    if (query.mockState === 'empty') {
        return {
            code: 0,
            message: 'success',
            data: {
                ...createEmptyOverviewPayload(),
                emptyState: {
                    title: '当前门店暂无可采购的商品',
                    description: '可先完成智慧酒店基础设置，再回到路客商城统一发起采购。',
                    actionLabel: '前往全局设置',
                    actionPath: '/smartHotel/checkInGuide',
                },
            },
            traceId: 'mock-locals-mall-overview-empty-001',
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: {
            requestedAt: DEFAULT_TIMESTAMP,
            requestedAtLabel: '最近同步：2026-05-19 11:28',
            sections: buildOverviewSections(mallProducts),
            quickEntries,
        },
        traceId: 'mock-locals-mall-overview-success-001',
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function buildDetailEnvelope(query) {
    if (query.mockState === 'error') {
        return {
            code: 50302,
            message: '路客商城详情加载失败，请稍后重试',
            data: createEmptyDetailPayload(),
            traceId: 'mock-locals-mall-detail-error-001',
            timestamp: DEFAULT_TIMESTAMP,
        };
    }
    const product = mallProducts.find((item) => item.id === query.productId) ?? mallProducts[0];
    return {
        code: 0,
        message: 'success',
        data: {
            requestedAt: DEFAULT_TIMESTAMP,
            requestedAtLabel: '最近同步：2026-05-19 11:28',
            productId: product.id,
            productName: product.name,
            productDescription: '已按目标站取证补齐购买、适用房型和支付方式闭环。',
            purchaseTermLabel: '1年',
            buyerName: '路客云 TS5',
            totalAmountLabel: '¥ 800',
            agreementLabel: DEFAULT_AGREEMENT_LABEL,
            purchaseNotice: DEFAULT_PURCHASE_NOTICE,
            routeAfterSubmit: DEFAULT_ROUTE_AFTER_SUBMIT,
            roomSummary: '4 个适用房型 / 4 间房',
            paymentSummary: '住宿分组 / 5 个支付项',
            roomCategoryIds: defaultRoomCategoryIds,
        },
        traceId: 'mock-locals-mall-detail-success-001',
        timestamp: DEFAULT_TIMESTAMP,
    };
}
function createEmptyOverviewPayload() {
    return {
        requestedAt: DEFAULT_TIMESTAMP,
        requestedAtLabel: '最近同步：2026-05-19 11:28',
        sections: [
            { id: 'system', title: '系统功能', products: [] },
            { id: 'hardware', title: '智能硬件', products: [] },
        ],
        quickEntries,
    };
}
function createEmptyDetailPayload() {
    return {
        requestedAt: DEFAULT_TIMESTAMP,
        requestedAtLabel: '最近同步：2026-05-19 11:28',
        productId: defaultProductId,
        productName: '门卡管理系统',
        productDescription: '',
        purchaseTermLabel: '1年',
        buyerName: '路客云 TS5',
        totalAmountLabel: '¥ 800',
        agreementLabel: DEFAULT_AGREEMENT_LABEL,
        purchaseNotice: '',
        routeAfterSubmit: DEFAULT_ROUTE_AFTER_SUBMIT,
        roomSummary: '0 个适用房型',
        paymentSummary: '0 个支付项',
        roomCategoryIds: [],
    };
}
function adaptOverviewEnvelope(envelope, provider) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '路客商城数据加载失败，请稍后重试');
    }
    const data = envelope.data;
    if (!data || !Array.isArray(data.sections) || !Array.isArray(data.quickEntries)) {
        throw new Error('路客商城数据加载失败，请稍后重试');
    }
    return {
        ...data,
        provider,
        traceId: envelope.traceId,
    };
}
function adaptDetailEnvelope(envelope, provider) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '路客商城详情加载失败，请稍后重试');
    }
    const data = envelope.data;
    if (!data || !data.productId || !Array.isArray(data.roomCategoryIds)) {
        throw new Error('路客商城详情加载失败，请稍后重试');
    }
    return {
        ...data,
        provider,
        traceId: envelope.traceId,
    };
}
async function postHudsonEnvelope(endpoint, body, signal) {
    const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: buildApiHeaders(),
        body: JSON.stringify(body),
        signal,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok || !payload) {
        throw new Error(payload?.message || `${endpoint} 请求失败，HTTP ${response.status}`);
    }
    if (payload.code !== 0 || payload.data === undefined || payload.data === null) {
        throw new Error(payload.message || `${endpoint} 响应无效`);
    }
    return {
        data: payload.data,
        traceId: payload.traceId,
        timestamp: payload.timestamp,
    };
}
function buildApiHeaders() {
    const headers = { 'content-type': 'application/json' };
    if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('pms_token')?.trim();
        if (token)
            headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}
function buildOverviewSections(products) {
    return [
        { id: 'system', title: '系统功能', products: products.filter((product) => product.sectionId === 'system') },
        { id: 'hardware', title: '智能硬件', products: products.filter((product) => product.sectionId === 'hardware') },
    ];
}
function adaptOverviewItem(item) {
    const productId = readString(item.channelRoomCategoryId, '');
    const fallback = mallProducts.find((product) => product.id === productId);
    const name = readString(item.channelRoomCategoryName, fallback?.name || '未命名商品');
    const description = readString(item.description, fallback?.description || '');
    const image = readString(item.mainPhoto, fallback?.image || '');
    const lowestSellingPrice = readNumber(item.lowestSellingPrice, 0);
    return {
        id: productId || slugify(name) || defaultProductId,
        sectionId: resolveSectionId(item.goodsType, fallback?.sectionId),
        name,
        description,
        image,
        priceLabel: lowestSellingPrice > 0 ? formatMoneyLabel(lowestSellingPrice) : fallback?.priceLabel || '¥ 0',
        tag: fallback?.tag || resolveTag(item.goodsType),
    };
}
function adaptRoomGroups(data) {
    return asArray(data?.roomCategoryRooms).map((group) => ({
        roomCategoryId: readString(group.roomCategoryId, ''),
        roomCategoryName: readString(group.roomCategoryName, '未命名房型'),
        rooms: asArray(group.rooms).map((room) => readString(room.roomName, '')).filter(Boolean),
    }));
}
function adaptPaymentGroups(data) {
    return asArray(data?.paymentGroups).map((group) => ({
        groupType: readNumber(group.groupType, 0),
        groupTypeName: readString(group.groupTypeName, '未命名分组'),
        paymentTypes: asArray(group.paymentTypes).map((item) => readString(item.paymentTypeName, '')).filter(Boolean),
    }));
}
function buildRoomSummary(groups) {
    const roomCount = groups.reduce((sum, group) => sum + group.rooms.length, 0);
    return `${groups.length} 个适用房型${roomCount > 0 ? ` / ${roomCount} 间房` : ''}`;
}
function buildPaymentSummary(groups) {
    const itemCount = groups.reduce((sum, group) => sum + group.paymentTypes.length, 0);
    const groupLabel = groups.length > 0 ? `${groups[0].groupTypeName}分组` : '0 个分组';
    return `${groupLabel} / ${itemCount} 个支付项`;
}
function buildRequestedAtLabel(timestamp) {
    if (!timestamp)
        return '最近同步：--';
    const value = timestamp.replace('T', ' ').replace(/([+-]\d{2}:\d{2}|Z)$/, '');
    return `最近同步：${value.slice(0, 16)}`;
}
function readBuyerName() {
    if (typeof window === 'undefined')
        return '当前门店';
    try {
        const raw = window.localStorage.getItem('pms_user');
        if (!raw)
            return '当前门店';
        const user = JSON.parse(raw);
        return user.campName || user.name || '当前门店';
    }
    catch {
        return '当前门店';
    }
}
function fallbackProductName(productId) {
    return mallProducts.find((item) => item.id === productId)?.name || '未命名商品';
}
function resolveSectionId(goodsType, fallback) {
    if (fallback)
        return fallback;
    return goodsType === 6 ? 'system' : 'hardware';
}
function resolveTag(goodsType) {
    return goodsType === 6 ? '系统功能' : '智能硬件';
}
function formatMoneyLabel(value) {
    const amount = readNumber(value, 0);
    return `¥ ${formatMoney(amount / 100)}`;
}
function formatMoney(value) {
    const numberFormat = new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    });
    return numberFormat.format(value);
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function readString(value, fallback) {
    if (typeof value === 'string' && value.trim())
        return value.trim();
    if (typeof value === 'number')
        return String(value);
    return fallback;
}
function readNumber(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return fallback;
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function validateQuery(query) {
    if (!query.campId.trim()) {
        throw new Error('路客商城门店参数不正确');
    }
}
function toMockState(value) {
    return value === 'empty' || value === 'error' ? value : 'success';
}
async function waitForMockLatency(signal) {
    if (signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');
    await new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, 180);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}
function normalizeProviderValue(value) {
    return value === 'api' || value === 'real' ? 'api' : value === 'mock' ? 'mock' : undefined;
}
