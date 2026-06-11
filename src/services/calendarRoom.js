const TASK_ID = 'shoumai-chanpin--rilifang--rilifang';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
const MOCK_ENDPOINT = '/setting/localRoomTypeProductionSetting/products/page';
const REAL_ENDPOINT = '/api/weiRoomCategories/page/get';
const DEFAULT_BUY_CAMP_ID = '10001';
const DEFAULT_LOCAL_CHANNEL_NAME = '宿银平台';
import { fetchStoreOptions, resolveCurrentCampId } from './storeOptions';
import { fetchEnabledChannelCatalog } from './customChannel';
import ctripIcon from '../assets/channel-icons/ctrip.png';
import meituanHomestayIcon from '../assets/channel-icons/meituan-homestay.png';
import feizhuIcon from '../assets/channel-icons/feizhu.png';
import meituanHotelIcon from '../assets/channel-icons/meituan-hotel.png';
import tujiaIcon from '../assets/channel-icons/tujia.png';
import muniaoIcon from '../assets/channel-icons/muniao.png';
import xiaozhuIcon from '../assets/channel-icons/xiaozhu.png';
import localsIcon from '../assets/channel-icons/locals.png';
import addIcon from '../assets/channel-icons/add.png';
export function resolveCalendarRoomQueryFromLocation(location) {
    const params = new URLSearchParams(location.search);
    const provider = params.get('calendarRoomProvider');
    const mockState = params.get('calendarRoomMockState');
    return {
        provider: provider === 'real' || provider === 'mock' ? provider : undefined,
        mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
    };
}
export async function fetchCalendarRoomProducts(query, signal) {
    const providerMode = query.provider ?? resolveProviderMode();
    if (providerMode === 'real') {
        return fetchRealCalendarRoom(query, signal);
    }
    const envelope = await fetchMockCalendarRoom(query, signal);
    const data = unwrapEnvelope(envelope);
    return {
        providerMode,
        responseState: query.mockState ?? 'success',
        endpoint: MOCK_ENDPOINT,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
        ...data,
    };
}
function resolveProviderMode() {
    const configured = readRuntimeConfig('pms.calendarRoomProvider') ||
        readRuntimeConfig('pmsCalendarRoomProvider') ||
        import.meta.env.VITE_PMS_CALENDAR_ROOM_PROVIDER?.trim();
    return configured === 'real' ? 'real' : 'mock';
}
async function fetchMockCalendarRoom(query, signal) {
    const [channelCatalog] = await Promise.all([
        fetchCalendarRoomChannelCatalog('mock'),
        delay(80, signal),
    ]);
    const state = query.mockState ?? 'success';
    if (state === 'error') {
        return {
            code: 5001,
            message: '日历房数据加载失败，请稍后重试',
            data: createBackendData(query, [], channelCatalog),
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: MOCK_TIMESTAMP,
        };
    }
    const allRows = getMockRows(channelCatalog);
    const rows = state === 'empty' ? [] : filterRows(allRows, query);
    return {
        code: 0,
        message: 'success',
        data: createBackendData(query, rows, channelCatalog, allRows),
        traceId: `mock-${TASK_ID}-${state}-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
async function fetchRealCalendarRoom(query, signal) {
    const requestParams = buildRealRequestParams(query);
    const [storeOptions, envelope, channelCatalog] = await Promise.all([
        fetchStoreOptions({ campId: String(requestParams.buyCampId), signal }),
        postRealCalendarRoom(REAL_ENDPOINT, requestParams, signal),
        fetchCalendarRoomChannelCatalog('api'),
    ]);
    const payload = envelope.data ?? {};
    const allRows = adaptRealCalendarRoomRows(payload.list, channelCatalog);
    const rows = filterRows(allRows, query);
    const page = readNumber(payload.pageNum ?? payload.current, query.page);
    const pageSize = readNumber(payload.size, query.pageSize);
    return {
        providerMode: 'real',
        responseState: rows.length > 0 ? 'success' : 'empty',
        endpoint: REAL_ENDPOINT,
        traceId: readString(envelope.traceId, `real-${TASK_ID}`),
        timestamp: readString(envelope.timestamp, new Date().toISOString()),
        requestParams,
        storeOptions: storeOptions.map((store) => ({ id: store.id, name: store.label })),
        channelOptions: collectChannelOptions(allRows, channelCatalog),
        channelCatalog,
        statusOptions: ['全部', '上架', '下架'],
        rows,
        pagination: {
            page,
            pageSize,
            total: readNumber(payload.total, rows.length),
        },
        routeTargets: createRouteTargets(),
    };
}
function createBackendData(query, rows, channelCatalog, optionSourceRows = rows) {
    return {
        requestParams: buildRequestParams(query),
        storeOptions: [
            { id: 'all', name: '全部门店' },
            { id: 'poi-1796067693589061634', name: '天落会宿公寓(前海壹方城宝安中心店)' },
        ],
        channelOptions: collectChannelOptions(optionSourceRows, channelCatalog),
        channelCatalog,
        statusOptions: ['全部', '上架', '下架'],
        rows,
        pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total: rows.length,
        },
        routeTargets: createRouteTargets(),
    };
}
function buildRequestParams(query) {
    return {
        poiIds: query.storeId && query.storeId !== 'all' ? [query.storeId] : [],
        keyword: query.keyword.trim(),
        channel: query.channel,
        status: query.status,
        page: query.page,
        pageSize: query.pageSize,
    };
}
function buildRealRequestParams(query) {
    const buyCampId = resolveBuyCampId();
    const storeId = query.storeId?.trim();
    return {
        campId: resolveCatalogCampId(buyCampId),
        buyCampId,
        ...(storeId && storeId !== 'all' ? { poiId: storeId } : {}),
        roomCategoryTypes: [1],
        goodsTypes: [7],
        pageNum: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword.trim(),
    };
}
async function postRealCalendarRoom(endpoint, body, signal) {
    const headers = new Headers({ 'content-type': 'application/json' });
    const token = readRuntimeConfig('pms_token');
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    let response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify(body),
            signal,
        });
    }
    catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
        }
        throw new Error(`日历房数据加载失败：${error instanceof Error ? error.message : String(error)}`);
    }
    const payload = (await response.json().catch(() => null));
    if (!response.ok) {
        throw new Error(payload?.errorMsg || payload?.message || `日历房数据加载失败：HTTP ${response.status}`);
    }
    if (!payload || payload.success === false || (payload.code !== undefined && payload.code !== 0)) {
        throw new Error(payload?.errorMsg || payload?.message || payload?.errorCode?.toString() || '日历房数据加载失败，请稍后重试');
    }
    if (payload.data === undefined || payload.data === null) {
        throw new Error('日历房数据加载失败：接口响应缺少 data 字段');
    }
    return payload;
}
function adaptRealCalendarRoomRows(input, channelCatalog) {
    return asArray(input).map((item, index) => {
        const record = asRecord(item);
        const roomName = readString(record.channelRoomCategoryName ?? record.roomCategoryName ?? record.name, `未命名日历房${index + 1}`);
        const products = adaptRealCalendarRoomProducts(record, roomName);
        return {
            id: readString(record.channelRoomCategoryId ?? record.roomCategoryId ?? record.goodsId ?? record.id, `real-calendar-room-${index}`),
            name: roomName,
            channelBadges: buildProductChannelBadges(products, channelCatalog),
            products,
        };
    });
}
function adaptRealCalendarRoomProducts(roomRecord, roomName) {
    const sourceProducts = asArray(roomRecord.roomCategoryProductGetViews);
    const rowCanBooking = readBookingStatus(roomRecord.isCanBooking ?? roomRecord.isAvailability, true);
    if (sourceProducts.length === 0) {
        const status = rowCanBooking ? 'online' : 'offline';
        return [
            {
                id: readString(roomRecord.channelRoomCategoryId ?? roomRecord.goodsId ?? roomRecord.id, `${roomName}-default-product`),
                name: roomName,
                channel: readProductChannel(roomRecord),
                breakfast: readBreakfastLabel(roomRecord.breakfastCount),
                refund: readRefundLabel(roomRecord.cancelPolicy ?? roomRecord.refundRule),
                pricePlan: readPricePlan(roomRecord, roomName),
                status,
                actions: createProductActions(status),
            },
        ];
    }
    return sourceProducts.map((product, index) => {
        const record = asRecord(product);
        const status = rowCanBooking && readBookingStatus(record.isCanBooking ?? record.isAvailability, true) ? 'online' : 'offline';
        return {
            id: readString(record.roomCategoryProductId ?? record.productId ?? record.goodsSkuId ?? record.id, `${roomName}-product-${index}`),
            name: readString(record.roomCategoryProductName ?? record.productName ?? record.skuName ?? record.name, `${roomName}-${index + 1}`),
            channel: readProductChannel(record, roomRecord),
            breakfast: readBreakfastLabel(record.breakfastCount),
            refund: readRefundLabel(record.cancelPolicy ?? roomRecord.cancelPolicy ?? record.refundRule ?? roomRecord.refundRule),
            pricePlan: readPricePlan(record, roomName),
            status,
            actions: createProductActions(status),
        };
    });
}
function filterRows(rows, query) {
    const keyword = query.keyword.trim();
    const channel = query.channel.trim();
    const status = query.status.trim();
    return rows
        .map((row) => {
        const products = row.products.filter((product) => {
            const matchesKeyword = !keyword || row.name.includes(keyword);
            const matchesChannel = !channel || product.channel === channel;
            const matchesStatus = !status ||
                status === '全部' ||
                (status === '上架' && product.status === 'online') ||
                (status === '下架' && product.status === 'offline');
            return matchesKeyword && matchesChannel && matchesStatus;
        });
        return products.length > 0 ? { ...row, products } : null;
    })
        .filter((row) => row !== null);
}
function unwrapEnvelope(envelope) {
    if (envelope.code !== 0) {
        throw new Error(envelope.message || '日历房数据加载失败，请稍后重试');
    }
    return envelope.data;
}
function resolveBuyCampId() {
    return resolveCurrentCampId() || DEFAULT_BUY_CAMP_ID;
}
function resolveCatalogCampId(buyCampId) {
    return (readRuntimeConfig('pmsCalendarRoomCatalogCampId') ||
        readRuntimeConfig('pms.calendarRoomCatalogCampId') ||
        import.meta.env.VITE_PMS_CALENDAR_ROOM_CATALOG_CAMP_ID?.trim() ||
        buyCampId);
}
function createRouteTargets() {
    return {
        roomTypeList: '/setting/roomTypeInfo',
        roomTypeEdit: '/setting/roomTypeInfo/edit',
        price: '/houseManage/channelPrice',
        createProduct: '/setting/localRoomTypeProductionSetting/channelGoodsSetting',
    };
}
function collectChannelOptions(rows, channelCatalog) {
    const channels = rows.flatMap((row) => row.products.map((product) => product.channel).filter(Boolean));
    const productChannelSet = new Set(channels.map(normalizeChannelName));
    const catalogOrdered = channelCatalog
        .filter((channel) => productChannelSet.has(normalizeChannelName(channel.name)))
        .map((channel) => channel.name);
    return Array.from(new Set([...catalogOrdered, ...channels]));
}
async function fetchCalendarRoomChannelCatalog(provider) {
    return fetchEnabledChannelCatalog({ provider, mockState: 'success' });
}
function buildProductChannelBadges(products, channelCatalog) {
    const productChannels = Array.from(new Set(products.map((product) => product.channel).filter(Boolean)));
    const badges = productChannels.map((channel) => buildChannelBadge(channel, channelCatalog));
    return [...badges, { ...CHANNEL_BADGE_LIBRARY.add }];
}
function buildChannelBadge(channelName, channelCatalog) {
    const catalogItem = findChannelCatalogItem(channelName, channelCatalog);
    const name = catalogItem?.name ?? channelName;
    if (catalogItem?.source === 'local') {
        return createGeneratedChannelBadge(catalogItem);
    }
    const key = toChannelBadgeKey(name);
    if (key) {
        return {
            ...CHANNEL_BADGE_LIBRARY[key],
            id: catalogItem?.id ?? CHANNEL_BADGE_LIBRARY[key].id,
            name,
            shortLabel: catalogItem?.shortName ?? CHANNEL_BADGE_LIBRARY[key].shortLabel,
        };
    }
    return createGeneratedChannelBadge(catalogItem ?? {
        id: `channel-${normalizeChannelName(name)}`,
        name,
        shortName: createShortName(name),
        color: '#4d65f6',
        enabled: true,
        source: 'system',
    });
}
function findChannelCatalogItem(channelName, channelCatalog) {
    const normalizedName = normalizeChannelName(channelName);
    const exact = channelCatalog.find((channel) => normalizeChannelName(channel.name) === normalizedName);
    if (exact)
        return exact;
    const key = toChannelBadgeKey(channelName);
    if (!key)
        return null;
    return channelCatalog.find((channel) => toChannelBadgeKey(channel.name) === key) ?? null;
}
function createGeneratedChannelBadge(channel) {
    const iconUrl = createChannelIcon(channel);
    return {
        id: channel.id,
        name: channel.name,
        shortLabel: channel.shortName,
        iconUrl,
        route: channel.source === 'local' ? '/channels/distribution/distributionSecond' : '/setting/customChannel',
    };
}
function createChannelIcon(channel) {
    const label = escapeXml(channel.shortName.slice(0, 2));
    const color = sanitizeColor(channel.color);
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r="25" fill="${color}" />
      <circle cx="26" cy="26" r="19" fill="rgba(255,255,255,0.12)" />
      <text x="26" y="31" text-anchor="middle" fill="#f8fbff" font-size="16" font-weight="700" font-family="Arial, sans-serif">${label}</text>
    </svg>
  `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
function sanitizeColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#4d65f6';
}
function normalizeChannelName(value) {
    return value.trim().toLowerCase();
}
function createShortName(name) {
    const trimmed = name.trim();
    if (!trimmed)
        return '渠';
    const chineseChars = Array.from(trimmed).filter((char) => /[\u4e00-\u9fff]/.test(char));
    if (chineseChars.length > 0)
        return chineseChars.slice(0, 2).join('');
    return trimmed.slice(0, 2).toUpperCase();
}
function escapeXml(value) {
    return value.replace(/[<>&'"]/g, (char) => {
        const entities = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            "'": '&apos;',
            '"': '&quot;',
        };
        return entities[char];
    });
}
function toChannelBadgeKey(channel) {
    if (channel.includes('携程'))
        return 'ctrip';
    if (channel.includes('美团酒店'))
        return 'meituanHotel';
    if (channel.includes('美团'))
        return 'meituanHomestay';
    if (channel.includes('飞猪'))
        return 'feizhu';
    if (channel.includes('途家'))
        return 'tujia';
    if (channel.includes('木鸟'))
        return 'muniao';
    if (channel.includes('小猪'))
        return 'xiaozhu';
    if (channel.includes('宿银') || channel.includes('路客') || channel.includes('聚合') || channel.includes('本地'))
        return 'locals';
    return '';
}
function readProductChannel(...records) {
    for (const record of records) {
        const channel = readString(record.channelName ?? record.channel ?? record.channelLabel, '');
        if (channel)
            return normalizeDisplayChannelName(channel);
    }
    return DEFAULT_LOCAL_CHANNEL_NAME;
}
function normalizeDisplayChannelName(channelName) {
    if (channelName.includes('路客') || channelName.includes('聚合') || channelName.includes('LocalHome')) {
        return DEFAULT_LOCAL_CHANNEL_NAME;
    }
    return channelName;
}
function readBreakfastLabel(value) {
    const count = readNumber(value, 0);
    return count > 0 ? `${count}份早餐` : '无早餐';
}
function readRefundLabel(value) {
    const text = readString(value, '');
    if (!text)
        return '-';
    const mapped = {
        '0': '不可退',
        '1': '免费取消',
        '2': '阶梯退',
    };
    return mapped[text] ?? text;
}
function readPricePlan(record, fallback) {
    const plan = readString(record.pricePlan ?? record.ratePlanName ?? record.roomCategoryProductName ?? record.productName, '');
    if (plan)
        return plan;
    const sellingPrice = readNumber(record.sellingPrice ?? record.salePrice ?? record.price, NaN);
    return Number.isFinite(sellingPrice) ? `¥${(sellingPrice / 100).toFixed(2)}` : fallback;
}
function readBookingStatus(value, fallback) {
    if (value === undefined || value === null || value === '')
        return fallback;
    if (value === true || value === 1 || value === '1' || value === 'true' || value === 'on_shelf')
        return true;
    return false;
}
function createProductActions(status) {
    return ['预览', '编辑', '修改价格', status === 'offline' ? '上架' : '下架'];
}
function readRuntimeConfig(key) {
    if (typeof window === 'undefined')
        return '';
    return window.localStorage.getItem(key)?.trim() || '';
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function asRecord(value) {
    return value && typeof value === 'object' ? value : {};
}
function readString(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
function readNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function delay(ms, signal) {
    if (signal?.aborted) {
        return Promise.reject(new DOMException('日历房请求已取消', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            window.clearTimeout(timer);
            reject(new DOMException('日历房请求已取消', 'AbortError'));
        }, { once: true });
    });
}
function getMockRows(channelCatalog) {
    const rows = [
        {
            id: 'room-top-suite',
            name: '顶层套房（浴缸巨幕电竞麻将）',
            channelBadges: buildChannelBadges(['tujia', 'meituanHomestay', 'xiaozhu', 'ctrip', 'feizhu', 'locals', 'muniao', 'add']),
            products: [
                product('top-tujia-1', '桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾｜电竞百寸电脑｜天落床｜欢乐海岸宝安中心｜会展中心', '途家', '灵活价 A'),
                product('top-tujia-2', '浴缸可观影打麻将电竞电脑/聚会派对/近湾区之光摩天轮/近地铁/万元天落床宝安中心深圳湾欢乐海岸近机场', '途家', '灵活价 B'),
                product('top-meituan-1', '浴缸可观影可打麻将电竞电脑/顶层近湾区之光摩天轮/聚会派对/近地铁/万元天落床+欧式大床/河流桌宝中深圳湾欢乐海岸近机场', '美团民宿', '阶梯退', 'offline'),
                product('top-xiaozhu-1', '天落床 真悬浮体验 70寸巨屏4K电视观影', '小猪', '标准价'),
                product('top-ctrip-1', '顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）<无早>', '携程', '标准价', 'online', ['预览', '修改价格', '下架']),
                product('top-feizhu-1', '顶层套房（浴缸巨幕电竞麻将）', '飞猪淘酒店', '未入住任意退', 'online', ['预览', '修改价格', '下架']),
                product('top-locals-1', '顶层套房（浴缸巨幕电竞麻将）', '路客云聚合', '灵活价', 'online', ['编辑', '修改价格', '下架']),
                product('top-muniao-1', '浴缸可观影打麻将电竞电脑/聚会派对/近湾区之光摩天轮/近机场深圳湾近地铁宝安中心', '木鸟', '标准价'),
                product('top-muniao-2', '顶层套房-早鸟折扣计划', '木鸟', '早鸟价'),
                product('top-meituan-hotel-1', '顶层套房-美团酒店直连价', '美团酒店', '标准价'),
                product('top-ctrip-2', '顶层套房-携程连住优惠', '携程', '连住价'),
            ],
        },
        {
            id: 'room-president-suite',
            name: '总裁套间（桑拿浴缸露台电竞麻将）',
            channelBadges: buildChannelBadges([
                'ctrip',
                'meituanHomestay',
                'feizhu',
                'meituanHotel',
                'tujia',
                'muniao',
                'xiaozhu',
                'locals',
                'add',
            ]),
            products: [
                product('president-tujia-1', '桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾｜电竞百寸电脑｜天落床｜欢乐海岸宝安中心｜会展中心', '途家', '灵活价'),
                product('president-meituan-1', '轰趴浴缸麻将桑拿观', '美团民宿', '阶梯退', 'offline'),
                product('president-xiaozhu-1', '浴缸桑拿台球乒乓环绕4米巨幕电脑 变形金刚 钢铁侠之家', '小猪', '标准价'),
                product('president-feizhu-1', '总裁套间（桑拿浴缸露台电竞麻将）', '飞猪淘酒店', '未入住任意退', 'online', ['预览', '修改价格', '下架']),
                product('president-muniao-1', '百万豪装♛台球乒乓桑拿浴缸百平露台俯瞰摩天轮深圳湾｜三联屏电竞电脑｜会展中心前海', '木鸟', '标准价'),
                product('president-locals-1', '总裁套间-路客云聚合直营', '路客云聚合', '灵活价'),
                product('president-ctrip-1', '总裁套间-携程优享', '携程', '标准价'),
                product('president-meituan-hotel-1', '总裁套间-美团酒店标准价', '美团酒店', '标准价'),
                product('president-tujia-2', '总裁套间-途家连住优惠', '途家', '连住价'),
            ],
        },
        {
            id: 'room-sky-bed',
            name: '天落大床电竞套间',
            channelBadges: buildChannelBadges(['meituanHomestay', 'xiaozhu', 'ctrip', 'feizhu', 'locals', 'muniao', 'add']),
            products: [
                product('sky-meituan-1', '万元天落床｜观影电竞房40寸4K4060显卡升降电脑｜河流桌按摩椅｜俯瞰摩天轮深圳湾欢乐海岸｜宝安中心壹方城机场会展', '美团民宿', '阶梯退', 'offline'),
                product('sky-xiaozhu-1', '天落床真悬浮体验', '小猪', '标准价'),
                product('sky-locals-1', '天落大床电竞套间', '路客云聚合', '阶梯退', 'online', ['编辑', '修改价格', '下架']),
                product('sky-muniao-1', '万元天落床｜带鱼屏40寸4K4060升降电竞电脑｜河流桌按摩椅｜俯瞰摩天轮深圳湾', '木鸟', '标准价'),
                product('sky-ctrip-1', '天落大床电竞套间-携程套餐', '携程', '标准价'),
                product('sky-feizhu-1', '天落大床电竞套间-飞猪标准价', '飞猪淘酒店', '标准价'),
                product('sky-meituan-hotel-1', '天落大床电竞套间-美团酒店标准价', '美团酒店', '标准价'),
                product('sky-tujia-1', '天落大床电竞套间-途家优享', '途家', '灵活价'),
            ],
        },
        {
            id: 'room-movie-bed',
            name: '观影大床房',
            channelBadges: buildChannelBadges(['tujia', 'meituanHomestay', 'ctrip', 'feizhu', 'locals', 'muniao', 'add']),
            products: [
                product('movie-tujia-1', '90寸4K影院｜珍藏河流桌｜深圳湾欢乐海岸宝安中心壹方城前海机场会展中心', '途家', '标准价'),
                product('movie-meituan-1', '90寸4K影院｜珍藏河流桌｜深圳湾欢乐海岸宝安中心壹方城前海机场会展中心', '美团民宿', '阶梯退'),
                product('movie-meituan-hotel-1', '观影大床房-不含早-入住当天18点前可免费取消', '美团酒店', '标准价', 'online', ['预览', '修改价格', '下架']),
                product('movie-locals-1', '观影大床房', '路客云聚合', '灵活价', 'online', ['编辑', '修改价格', '下架']),
                product('movie-muniao-1', '特工密室/90寸4K影院｜河流桌｜宝安中心深圳湾欢乐海岸机场前海湾', '木鸟', '标准价'),
                product('movie-ctrip-1', '观影大床房-携程无早', '携程', '标准价'),
                product('movie-feizhu-1', '观影大床房-飞猪基础价', '飞猪淘酒店', '标准价'),
                product('movie-tujia-2', '观影大床房-途家早鸟价', '途家', '早鸟价'),
            ],
        },
    ];
    return rows.map((row) => ({
        ...row,
        channelBadges: buildProductChannelBadges(row.products, channelCatalog),
    }));
}
function product(id, name, channel, pricePlan, status = 'online', actions) {
    return {
        id,
        name,
        channel: normalizeDisplayChannelName(channel),
        breakfast: '无早餐',
        refund: status === 'offline' ? '阶梯退' : pricePlan === '未入住任意退' ? '未入住任意退' : '-',
        pricePlan,
        status,
        actions: actions ?? ['预览', '编辑', '修改价格', status === 'offline' ? '上架' : '下架'],
    };
}
const CHANNEL_BADGE_LIBRARY = {
    ctrip: {
        id: 'ctrip',
        name: '携程',
        shortLabel: '携',
        iconUrl: ctripIcon,
        route: '/channels/ota/detail?channel=ctrip',
    },
    meituanHomestay: {
        id: 'meituanHomestay',
        name: '美团民宿',
        shortLabel: '民',
        iconUrl: meituanHomestayIcon,
        route: '/channels/ota/detail?channel=meituan-homestay',
    },
    feizhu: {
        id: 'feizhu',
        name: '飞猪',
        shortLabel: '飞',
        iconUrl: feizhuIcon,
        route: '/channels/ota/detail?channel=fliggy',
    },
    meituanHotel: {
        id: 'meituanHotel',
        name: '美团酒店',
        shortLabel: '酒',
        iconUrl: meituanHotelIcon,
        route: '/channels/ota/detail?channel=meituan-hotel',
    },
    tujia: {
        id: 'tujia',
        name: '途家',
        shortLabel: '途',
        iconUrl: tujiaIcon,
        route: '/channels/ota/detail?channel=tujia',
    },
    muniao: {
        id: 'muniao',
        name: '木鸟',
        shortLabel: '鸟',
        iconUrl: muniaoIcon,
        route: '/channels/ota/detail?channel=muniao',
    },
    xiaozhu: {
        id: 'xiaozhu',
        name: '小猪民宿',
        shortLabel: '猪',
        iconUrl: xiaozhuIcon,
        route: '/channels/ota/detail?channel=xiaozhu',
    },
    locals: {
        id: 'locals',
        name: '宿银平台',
        shortLabel: '宿',
        iconUrl: localsIcon,
        route: '/channels/ota/detail?channel=locals',
    },
    add: {
        id: 'add',
        name: '新增渠道',
        shortLabel: '+',
        iconUrl: addIcon,
        route: '/channels/ota',
    },
};
function buildChannelBadges(keys) {
    return keys.map((key) => ({
        ...CHANNEL_BADGE_LIBRARY[key],
    }));
}
