const TASK_ID = 'shoumai-chanpin--rilifang--rilifang';
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00';
const MOCK_ENDPOINT = '/setting/localRoomTypeProductionSetting/products/page';
const REAL_ENDPOINT = 'https://hudson-prod.localhome.cn/weiRoomCategories/page/get';
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
    const configured = import.meta.env.VITE_PMS_CALENDAR_ROOM_PROVIDER?.trim();
    return configured === 'real' ? 'real' : 'mock';
}
async function fetchMockCalendarRoom(query, signal) {
    await delay(80, signal);
    const state = query.mockState ?? 'success';
    if (state === 'error') {
        return {
            code: 5001,
            message: '日历房数据加载失败，请稍后重试',
            data: createBackendData(query, []),
            traceId: `mock-${TASK_ID}-error-001`,
            timestamp: MOCK_TIMESTAMP,
        };
    }
    return {
        code: 0,
        message: 'success',
        data: createBackendData(query, state === 'empty' ? [] : filterRows(getMockRows(), query)),
        traceId: `mock-${TASK_ID}-${state}-001`,
        timestamp: MOCK_TIMESTAMP,
    };
}
async function fetchRealCalendarRoom(query, signal) {
    await delay(1, signal);
    throw new Error(`日历房数据加载失败，请稍后重试。real provider 待在服务层接入 ${REAL_ENDPOINT}，请求参数 ${JSON.stringify(buildRequestParams(query))}`);
}
function createBackendData(query, rows) {
    return {
        requestParams: buildRequestParams(query),
        storeOptions: [
            { id: 'all', name: '全部门店' },
            { id: 'poi-1796067693589061634', name: '天落会宿公寓(前海壹方城宝安中心店)' },
        ],
        channelOptions: ['途家', '美团民宿', '小猪', '携程', '美团酒店', '飞猪淘酒店', '路客云聚合', '木鸟'],
        statusOptions: ['全部', '上架', '下架'],
        rows,
        pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total: rows.length,
        },
        routeTargets: {
            roomTypeList: '/setting/roomTypeInfo',
            roomTypeEdit: '/setting/roomTypeInfo/edit',
            price: '/houseManage/channelPrice',
            createProduct: '/setting/localRoomTypeProductionSetting/channelGoodsSetting',
        },
    };
}
function buildRequestParams(query) {
    return {
        poiIds: ['1796067693589061634'],
        keyword: query.keyword.trim(),
        channel: query.channel,
        status: query.status,
        page: query.page,
        pageSize: query.pageSize,
    };
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
function getMockRows() {
    return [
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
}
function product(id, name, channel, pricePlan, status = 'online', actions) {
    return {
        id,
        name,
        channel,
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
        name: '路客云聚合',
        shortLabel: '聚',
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
