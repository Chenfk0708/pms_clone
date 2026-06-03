export const PRESALE_GOODS_PROVIDER = 'mock';
export const PRESALE_GOODS_ENDPOINT = '/mallManagement/goodsManagement';
export const PRESALE_GOODS_TARGET_ENDPOINT = '/api/channelRoomCategories/page/get/v2';
export class PresaleGoodsServiceError extends Error {
    response;
    constructor(response) {
        super(response.message);
        this.name = 'PresaleGoodsServiceError';
        this.response = response;
    }
}
const timestamp = '2026-05-18T10:00:00+08:00';
const options = {
    stores: [{ value: '1796425098638573570', label: '天洛会宿公寓(前海壹方城宝安中心店)' }],
    channels: [
        { value: '17', label: '路客云聚合' },
        { value: '3', label: '美团民宿' },
        { value: '2', label: '途家' },
        { value: '4', label: '小猪' },
        { value: '8', label: '飞猪淘酒店' },
    ],
    ticketTypes: [
        { value: '', label: '全部' },
        { value: '1', label: '普通卡券' },
        { value: '2', label: '日历卡券' },
        { value: '3', label: '电子卡券' },
    ],
    categories: [
        { value: '14', label: '房券' },
        { value: '16', label: '餐饮券' },
        { value: '17', label: '套餐' },
        { value: '19', label: '酒店套餐' },
    ],
    shelfStatuses: [
        { value: '', label: '全部' },
        { value: 'listed', label: '已上架' },
        { value: 'unlisted', label: '已下架' },
    ],
};
const rows = [
    {
        channelRoomCategoryId: 'mock-presale-goods-001',
        channelRoomCategoryName: '顶层套房双人下午茶预售券',
        categoryId: '16',
        categoryName: '餐饮券',
        roomCategoryType: 1,
        goodsType: 7,
        channelIds: ['17', '3'],
        channelNames: ['路客云聚合', '美团民宿'],
        totalStock: '120',
        soldCount: 36,
        lowestSellingPrice: 19900,
        lowestOriginalPrice: 26800,
        isCanBooking: 1,
        isAvailability: '1',
        shelfStatus: 'selling',
        createdAt: '2026-05-12 09:20:00',
        updatedAt: '2026-05-18 09:40:00',
        description: '适用于顶层套房双人下午茶，含双人茶歇与延迟退房权益。',
        refundRule: '核销前可随时退',
        products: [
            {
                roomCategoryProductId: 'mock-presale-sku-001-1',
                roomCategoryProductName: '双人下午茶',
                sellingPrice: 19900,
                originalPrice: 26800,
                stock: 80,
            },
            {
                roomCategoryProductId: 'mock-presale-sku-001-2',
                roomCategoryProductName: '下午茶加房券权益',
                sellingPrice: 39900,
                originalPrice: 46800,
                stock: 40,
            },
        ],
    },
    {
        channelRoomCategoryId: 'mock-presale-goods-002',
        channelRoomCategoryName: '观影大床房周末通兑券',
        categoryId: '14',
        categoryName: '房券',
        roomCategoryType: 2,
        goodsType: 7,
        channelIds: ['2', '4'],
        channelNames: ['途家', '小猪'],
        totalStock: '64',
        soldCount: 64,
        lowestSellingPrice: 49800,
        lowestOriginalPrice: 58800,
        isCanBooking: 0,
        isAvailability: '0',
        shelfStatus: 'soldOut',
        createdAt: '2026-05-08 15:30:00',
        updatedAt: '2026-05-17 20:05:00',
        description: '周五至周日可预约观影大床房，购买后在有效期内核销。',
        refundRule: '有效期内未核销可退',
        products: [
            {
                roomCategoryProductId: 'mock-presale-sku-002-1',
                roomCategoryProductName: '周末单晚',
                sellingPrice: 49800,
                originalPrice: 58800,
                stock: 0,
            },
        ],
    },
    {
        channelRoomCategoryId: 'mock-presale-goods-003',
        channelRoomCategoryName: '总裁套间生日布置套餐券',
        categoryId: '17',
        categoryName: '套餐',
        roomCategoryType: 3,
        goodsType: 7,
        channelIds: ['17', '8'],
        channelNames: ['路客云聚合', '飞猪淘酒店'],
        totalStock: '30',
        soldCount: 3,
        lowestSellingPrice: 88800,
        lowestOriginalPrice: 108800,
        isCanBooking: 1,
        isAvailability: '1',
        shelfStatus: 'warehouse',
        createdAt: '2026-05-15 11:10:00',
        updatedAt: '2026-05-18 08:30:00',
        description: '包含总裁套间生日布置、迎宾饮品和提前入住权益。',
        refundRule: '预约前可退',
        products: [
            {
                roomCategoryProductId: 'mock-presale-sku-003-1',
                roomCategoryProductName: '生日布置基础款',
                sellingPrice: 88800,
                originalPrice: 108800,
                stock: 30,
            },
        ],
    },
];
export const defaultPresaleGoodsFilters = {
    campId: '1796067693589061634',
    poiId: '1796425098638573570',
    channelId: '',
    ticketType: '',
    categoryId: '',
    shelfStatus: '',
    keyword: '',
    page: 1,
    pageSize: 20,
};
export async function loadPresaleGoodsData(filters, scenario = 'success') {
    const response = await loadPresaleGoodsResponse(filters, scenario);
    if (response.code !== 0)
        throw new PresaleGoodsServiceError(response);
    return adaptPresaleGoodsResponse(response);
}
export function buildPresaleGoodsRequestBody(filters) {
    return {
        roomCategoryTypes: filters.ticketType ? [Number(filters.ticketType)] : [1, 2, 3],
        categoryIds: filters.categoryId ? [filters.categoryId] : [],
        searchKey: filters.keyword.trim(),
        pageNum: filters.page,
        pageSize: filters.pageSize,
        getChannelIds: [],
        isGetChannelInfo: 1,
        channelIds: filters.channelId ? [Number(filters.channelId)] : [0],
        campId: filters.campId,
        poiIds: filters.poiId ? [filters.poiId] : [],
        shelfStatuses: filters.shelfStatus === 'listed'
            ? ['selling', 'soldOut']
            : filters.shelfStatus === 'unlisted'
                ? ['warehouse']
                : [],
    };
}
async function loadPresaleGoodsResponse(filters, scenario) {
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    const request = {
        path: PRESALE_GOODS_ENDPOINT,
        provider: PRESALE_GOODS_PROVIDER,
        targetEndpoint: PRESALE_GOODS_TARGET_ENDPOINT,
        body: buildPresaleGoodsRequestBody(filters),
        scenario,
    };
    if (filters.page < 1 || filters.pageSize < 1) {
        return createResponse(400, '分页参数不合法', request, [], 0, filters);
    }
    if (scenario === 'error') {
        return createResponse(503, '预售券商品列表加载失败，请稍后重试。', request, [], 0, filters);
    }
    const filtered = scenario === 'empty' ? [] : filterRows(filters);
    return createResponse(0, 'success', request, filtered, filtered.length, filters);
}
function createResponse(code, message, request, list, total, filters) {
    return {
        code,
        message,
        data: {
            request,
            options,
            list,
            pagination: {
                page: filters.page,
                pageSize: filters.pageSize,
                total,
            },
        },
        traceId: `mock-mall-goods-presale-${code === 0 ? 'list' : 'error'}-001`,
        timestamp,
    };
}
function filterRows(filters) {
    const keyword = filters.keyword.trim().toLowerCase();
    return rows.filter((row) => {
        const matchesChannel = filters.channelId ? row.channelIds.includes(filters.channelId) : true;
        const matchesTicketType = filters.ticketType ? String(row.roomCategoryType) === filters.ticketType : true;
        const matchesCategory = filters.categoryId ? row.categoryId === filters.categoryId : true;
        const matchesStatus = filters.shelfStatus === 'listed'
            ? row.shelfStatus === 'selling' || row.shelfStatus === 'soldOut'
            : filters.shelfStatus === 'unlisted'
                ? row.shelfStatus === 'warehouse'
                : true;
        const matchesKeyword = keyword ? row.channelRoomCategoryName.toLowerCase().includes(keyword) : true;
        return matchesChannel && matchesTicketType && matchesCategory && matchesStatus && matchesKeyword;
    });
}
function adaptPresaleGoodsResponse(response) {
    return {
        request: response.data.request,
        requestEcho: JSON.stringify(response.data.request),
        options: response.data.options,
        rows: response.data.list.map(adaptRow),
        pagination: response.data.pagination,
        traceId: response.traceId,
        timestamp: response.timestamp,
    };
}
function adaptRow(row) {
    return {
        id: row.channelRoomCategoryId,
        name: row.channelRoomCategoryName,
        categoryName: row.categoryName,
        ticketTypeLabel: ticketTypeLabel(row.roomCategoryType),
        channels: row.channelNames.join('、'),
        stockLabel: `${row.totalStock} / 已售 ${row.soldCount}`,
        soldLabel: String(row.soldCount),
        sellingPrice: money(row.lowestSellingPrice),
        originalPrice: money(row.lowestOriginalPrice),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        statusLabel: statusLabel(row.shelfStatus),
        status: row.shelfStatus,
        description: row.description,
        refundRule: row.refundRule,
        products: row.products.map((product) => ({
            id: product.roomCategoryProductId,
            name: product.roomCategoryProductName,
            sellingPrice: money(product.sellingPrice),
            originalPrice: money(product.originalPrice),
            stock: product.stock,
        })),
    };
}
function ticketTypeLabel(type) {
    const map = {
        1: '普通卡券',
        2: '日历卡券',
        3: '电子卡券',
    };
    return map[type];
}
function statusLabel(status) {
    const map = {
        selling: '销售中',
        soldOut: '已售罄',
        warehouse: '仓库中',
    };
    return map[status];
}
function money(value) {
    return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value / 100);
}
