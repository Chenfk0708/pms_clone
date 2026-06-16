import { resolveCurrentCampId } from '../utils/camp';
const HUDSON_API_BASE = '/api';
const WORKSPACE_PROVIDER_STORAGE_KEY = 'pmsWorkspaceProvider';
const WORKSPACE_MOCK_MODE_STORAGE_KEY = 'pmsWorkspaceMockMode';
const WORKSPACE_MOCK_CAMP_ID = 'mock-camp-shouye';
export function resolveWorkspaceCampId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('campId');
    const fromEnv = import.meta.env.VITE_PMS_CAMP_ID;
    const fromRuntime = resolveCurrentCampId(fromEnv || '');
    const campId = fromQuery || fromRuntime;
    if (campId)
        return campId;
    if (getWorkspaceDataProviderName() === 'mock')
        return WORKSPACE_MOCK_CAMP_ID;
    throw new Error('缺少 campId：请通过 URL query、localStorage.pmsCampId 或 VITE_PMS_CAMP_ID 提供当前门店上下文');
}
export function getWorkspaceDataProviderName() {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('workspaceProvider');
        if (fromQuery === 'real' || fromQuery === 'mock')
            return fromQuery;
        const fromStorage = window.localStorage.getItem(WORKSPACE_PROVIDER_STORAGE_KEY);
        if (fromStorage === 'real' || fromStorage === 'mock')
            return fromStorage;
    }
    const fromEnv = import.meta.env.VITE_WORKSPACE_DATA_PROVIDER;
    if (fromEnv === 'real' || fromEnv === 'mock')
        return fromEnv;
    return 'mock';
}
function getWorkspaceMockMode() {
    if (typeof window === 'undefined')
        return 'success';
    const mode = window.localStorage.getItem(WORKSPACE_MOCK_MODE_STORAGE_KEY);
    return mode === 'error' || mode === 'empty' ? mode : 'success';
}
function getWorkspaceTimestamp() {
    return '2026-05-18T10:00:00+08:00';
}
function createWorkspaceResponse(endpoint, data, traceSuffix = '001') {
    return {
        code: 0,
        message: 'success',
        data,
        traceId: `mock-shouye--shouye-${endpoint.replace(/^\//, '').replace(/[^\w]+/g, '-')}-${traceSuffix}`,
        timestamp: getWorkspaceTimestamp(),
    };
}
function createWorkspaceFailure(endpoint, message) {
    return {
        code: 500,
        message,
        data: null,
        traceId: `mock-shouye--shouye-${endpoint.replace(/^\//, '').replace(/[^\w]+/g, '-')}-error`,
        timestamp: getWorkspaceTimestamp(),
    };
}
function unwrapWorkspaceResponse(endpoint, response) {
    if (response.code !== 0) {
        throw new Error(response.message || `${endpoint} 返回业务失败`);
    }
    if (response.data === undefined || response.data === null) {
        throw new Error(`${endpoint} 响应缺少 data 字段`);
    }
    return response.data;
}
async function requestWorkspaceData(endpoint, body) {
    const response = getWorkspaceDataProviderName() === 'mock'
        ? await postWorkspaceMock(endpoint, body)
        : await postHudsonAsWorkspaceResponse(endpoint, body);
    return unwrapWorkspaceResponse(endpoint, response);
}
async function postWorkspaceMock(endpoint, body) {
    const mode = getWorkspaceMockMode();
    if (mode === 'error')
        return createWorkspaceFailure(endpoint, 'mock provider 模拟接口失败');
    const data = buildWorkspaceMockData(endpoint, body, mode === 'empty');
    return createWorkspaceResponse(endpoint, data, mode === 'empty' ? 'empty' : '001');
}
function buildWorkspaceMockData(endpoint, body, empty) {
    if (endpoint === '/report/homePage/v2') {
        return empty
            ? {
                nowPredictCheckIn: 0,
                nowAlreadyCheckIn: 0,
                nowPredictCheckOut: 0,
                nowOnSaleNum: 0,
                userBusyRepairNum: 0,
                dirtyNum: 0,
                exceptionOrderNum: 0,
                nowIncome: 0,
            }
            : {
                nowPredictCheckIn: 3,
                nowAlreadyCheckIn: 0,
                nowPredictCheckOut: 0,
                nowOnSaleNum: 0,
                userBusyRepairNum: 0,
                dirtyNum: 1,
                exceptionOrderNum: 920,
                nowIncome: 101100,
            };
    }
    if (endpoint === '/report/accommodation/management/analysis/get') {
        const startDate = String(body.startDate ?? '');
        const isMonth = startDate.endsWith('-01');
        const dates = empty ? [] : buildMockTrendDates(startDate);
        return {
            businessIncome: empty ? 0 : isMonth ? 9789.55 : 330.72,
            roomFeePriceIncludingCommission: empty ? 0 : isMonth ? 9789.55 : 330.72,
            otherOrderExpense: 0,
            writeDownIncome: 0,
            occ: empty ? 0 : isMonth ? 54.69 : 50,
            adr: empty ? 0 : isMonth ? 279.7 : 165.36,
            revPar: empty ? 0 : isMonth ? 152.97 : 82.68,
            openRoomCount: empty ? 0 : isMonth ? 35 : 2,
            roomCount: empty ? 0 : isMonth ? 64 : 4,
            allDayOpenRoomCount: empty ? 0 : isMonth ? 35 : 2,
            hourOpenRoomCount: 0,
            growthTrendAnalysisList: dates.map((date, index) => ({
                date,
                businessIncome: 100 + index * 25,
                occ: 0.5,
                adr: 165.36,
                revPar: 82.68,
                openRoomCount: 2,
            })),
            orderOriginAnalysisList: empty
                ? []
                : [
                    { channelName: '携程', orderCount: 1 },
                    { channelName: '美团酒店', orderCount: 1 },
                    { channelName: '飞猪淘酒店', orderCount: 1 },
                ],
        };
    }
    if (endpoint === '/orders/get') {
        const orderType = String(body.orderType ?? '11');
        const keyword = String(body.keyword ?? '');
        const list = empty || orderType !== '11' || keyword === '无结果'
            ? []
            : [
                {
                    channelName: '飞猪淘酒店',
                    guestName: '黄国辉',
                    guestMobile: '+8617328513805',
                    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
                    roomName: null,
                    startTime: 1778914800000,
                    endTime: 1779508800000,
                    dayNum: 7,
                    orderDetailDisplayStateName: '待入住',
                },
                {
                    channelName: '携程',
                    guestName: '闵尊海',
                    guestMobile: '-',
                    roomCategoryName: '天落大床电竞套间',
                    roomName: '1',
                    startTime: 1778914800000,
                    endTime: 1779001200000,
                    dayNum: 1,
                    orderDetailDisplayStateName: '待入住',
                },
                {
                    channelName: '美团民宿',
                    guestName: '周明',
                    guestMobile: '-',
                    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
                    roomName: '-',
                    startTime: 1779087600000,
                    endTime: 1779174000000,
                    dayNum: 1,
                    orderDetailDisplayStateName: '待入住',
                },
            ];
        return { total: list.length, list, pagination: { page: 1, pageSize: 10, total: list.length } };
    }
    if (endpoint === '/memo/page/get') {
        const isHandle = Number(body.isHandle ?? 0);
        const list = empty
            ? []
            : [
                { memoId: 'mock-memo-001', content: '核对今日预抵客人押金', isHandle: 0 },
                { memoId: 'mock-memo-002', content: '已同步夜审交接事项', isHandle: 1 },
            ].filter((item) => item.isHandle === isHandle);
        return { total: list.length, list, pagination: { page: 1, pageSize: 10, total: list.length } };
    }
    if (endpoint === '/memo/add') {
        return { memoId: 'mock-memo-created', content: String(body.content ?? ''), isHandle: 0 };
    }
    if (endpoint === '/memo/handle') {
        return { memoId: String(body.memoId ?? ''), content: String(body.content ?? ''), isHandle: Number(body.isHandle ?? 1) };
    }
    if (endpoint === '/backlogs/get') {
        return empty
            ? []
            : [
                { content: JSON.stringify({ title: '绑定微信账号', sub_title: '实时接获预定消息', button: '立即绑定' }) },
                { content: JSON.stringify({ title: '上个月报表已生成', sub_title: '来看看上个月的表现如何？', button: '查看' }) },
            ];
    }
    if (endpoint === '/campFlow/get') {
        return {
            isOpenFlow: empty ? 0 : 1,
            channelInfos: empty
                ? []
                : [
                    { channelName: '路客云聚合', isApplyOpen: 1 },
                    { channelName: '飞猪酒店直连', isApplyOpen: 1 },
                ],
        };
    }
    return {};
}
function buildMockTrendDates(startDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16', '2026-05-17'];
    }
    const start = new Date(`${startDate}T00:00:00+08:00`);
    return Array.from({ length: 7 }, (_, index) => formatDate(addDays(start, index)));
}
async function postHudsonAsWorkspaceResponse(endpoint, body) {
    const response = await fetch(`${HUDSON_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        return {
            code: response.status,
            message: `${endpoint} 返回 HTTP ${response.status}`,
            data: null,
            traceId: `real-shouye--shouye-${endpoint.replace(/^\//, '').replace(/[^\w]+/g, '-')}-http-${response.status}`,
            timestamp: new Date().toISOString(),
        };
    }
    const payload = (await response.json());
    if (payload.success === false) {
        return {
            code: 500,
            message: payload.errorMsg || `${endpoint} 返回业务失败`,
            data: null,
            traceId: `real-shouye--shouye-${endpoint.replace(/^\//, '').replace(/[^\w]+/g, '-')}-business-error`,
            timestamp: new Date().toISOString(),
        };
    }
    return {
        code: 0,
        message: 'success',
        data: payload.data ?? null,
        traceId: `real-shouye--shouye-${endpoint.replace(/^\//, '').replace(/[^\w]+/g, '-')}-001`,
        timestamp: new Date().toISOString(),
    };
}
function assertRealCampId(campId) {
    if (getWorkspaceDataProviderName() === 'real' && campId === WORKSPACE_MOCK_CAMP_ID) {
        throw new Error('real provider 需要真实 campId，不能使用 mock campId');
    }
}
function requireCampId(campId) {
    if (!campId) {
        throw new Error('缺少 campId：请通过 URL query、localStorage.pmsCampId 或 VITE_PMS_CAMP_ID 提供当前门店上下文');
    }
    return campId;
}
export async function fetchWorkspaceDashboard(campId, period, chartRange, orderTab, keyword) {
    const [summary, revenueAnalysis, chartAnalysis, lists, traffic] = await Promise.all([
        fetchWorkspaceSummary(campId),
        fetchWorkspaceAnalysis(campId, period),
        fetchWorkspaceAnalysis(campId, chartRange),
        fetchWorkspaceLists(campId, orderTab, keyword),
        fetchWorkspaceTraffic(campId),
    ]);
    return {
        summary,
        analysis: {
            revenueMetrics: revenueAnalysis.revenueMetrics,
            chartDates: chartAnalysis.chartDates,
            chartSeries: chartAnalysis.chartSeries,
            donutSlices: chartAnalysis.donutSlices,
        },
        lists,
        traffic,
    };
}
export async function fetchWorkspaceSummary(campId) {
    assertRealCampId(campId);
    const data = await requestWorkspaceData('/report/homePage/v2', { campId: requireCampId(campId) });
    return {
        metrics: [
            { label: '预抵', value: formatNumber(data.nowPredictCheckIn), testId: 'workspace-metric-arrivals' },
            { label: '在住', value: formatNumber(data.nowAlreadyCheckIn), testId: 'workspace-metric-staying', route: '/statistics/roomSituation' },
            { label: '预离', value: formatNumber(data.nowPredictCheckOut) },
            { label: '可售', value: formatNumber(data.nowOnSaleNum) },
            { label: '维修房', value: formatNumber(data.userBusyRepairNum) },
            { label: '脏房', value: formatNumber(data.dirtyNum) },
            { label: '异常', value: formatNumber(data.exceptionOrderNum), accent: 'rose' },
            { label: '总营业收入', value: formatCurrencyFromCents(data.nowIncome), testId: 'workspace-metric-revenue', accent: 'orange' },
        ],
    };
}
export async function fetchWorkspaceAnalysis(campId, range) {
    assertRealCampId(campId);
    const query = getAnalysisRange(range);
    const data = await requestWorkspaceData('/report/accommodation/management/analysis/get', { campId: requireCampId(campId), ...query });
    return {
        revenueMetrics: [
            {
                label: '营业收入',
                value: formatCurrency(data.businessIncome),
                detailLeft: `预计总收入 ${formatCurrency(0)}`,
                detailRight: `记一笔 ${formatCurrency(data.writeDownIncome)} 其他收入/支出 ${formatCurrency(data.otherOrderExpense)}`,
                accent: 'amber',
            },
            {
                label: '入住率OCC',
                value: formatPercent(data.occ),
                detailLeft: `已售房间数 ${formatNumber(data.openRoomCount)}`,
                detailRight: `总房数 ${formatNumber(data.roomCount)}`,
                accent: 'mint',
            },
            {
                label: '平均客房收益RevPAR',
                value: formatCurrency(data.revPar),
                detailLeft: `全日房 ${formatCurrency(data.roomFeePriceIncludingCommission)}`,
                detailRight: `钟点房 ${formatCurrency(0)}`,
                accent: 'peach',
            },
            {
                label: '平均房费ADR',
                value: formatCurrency(data.adr),
                detailLeft: `入住率OCC ${formatPercent(data.occ)}`,
                detailRight: `平均房费ADR ${formatCurrency(data.adr)}`,
                accent: 'sky',
            },
        ],
        chartDates: normalizeTrendDates(data.growthTrendAnalysisList),
        chartSeries: normalizeTrendPoints(data.growthTrendAnalysisList),
        donutSlices: normalizeOriginSlices(data.orderOriginAnalysisList),
    };
}
export async function fetchWorkspaceLists(campId, orderTab, keyword, memoHandle = 0) {
    assertRealCampId(campId);
    const [orderData, memoData, backlogData] = await Promise.all([
        requestWorkspaceData('/orders/get', {
            campId: requireCampId(campId),
            orderType: orderTypeByTab[orderTab],
            pageNum: 1,
            keyword,
            pageSize: 10,
        }),
        requestWorkspaceData('/memo/page/get', { campId: requireCampId(campId), pageNum: 1, pageSize: 10, isHandle: memoHandle }),
        requestWorkspaceData('/backlogs/get', { campId: requireCampId(campId) }),
    ]);
    const backlogItems = Array.isArray(backlogData) ? backlogData.map(normalizeBacklogItem).filter(isBacklogItem) : [];
    const memoItems = Array.isArray(memoData.list) ? memoData.list.map(normalizeMemoItem).filter(isMemoItem) : [];
    return {
        orders: Array.isArray(orderData.list) ? orderData.list.map(normalizeOrder) : [],
        memoCount: Number(memoData.total ?? 0),
        memoItems,
        todoItems: backlogItems.filter((item) => item.type === 'todo').map(toWorkspaceNewsItem),
        productItems: backlogItems.filter((item) => item.type === 'product').map(toWorkspaceNewsItem),
    };
}
export async function fetchWorkspaceMemos(campId, isHandle) {
    assertRealCampId(campId);
    const data = await requestWorkspaceData('/memo/page/get', {
        campId: requireCampId(campId),
        pageNum: 1,
        pageSize: 10,
        isHandle,
    });
    const memoItems = Array.isArray(data.list) ? data.list.map(normalizeMemoItem).filter(isMemoItem) : [];
    return {
        memoCount: Number(data.total ?? memoItems.length),
        memoItems,
    };
}
export async function createWorkspaceMemo(campId, content) {
    assertRealCampId(campId);
    return normalizeMemoItem(await requestWorkspaceData('/memo/add', { campId: requireCampId(campId), content }));
}
export async function handleWorkspaceMemo(campId, memoId, isHandle) {
    assertRealCampId(campId);
    return normalizeMemoItem(await requestWorkspaceData('/memo/handle', { campId: requireCampId(campId), memoId, isHandle }));
}
export async function fetchWorkspaceTraffic(campId) {
    assertRealCampId(campId);
    const data = await requestWorkspaceData('/campFlow/get', { campId: requireCampId(campId) });
    const channels = Array.isArray(data.channelInfos) ? data.channelInfos : [];
    const connectedChannels = channels.filter((item) => item.isApplyOpen).map((item) => item.channelName || '未命名渠道');
    const pendingChannels = channels.filter((item) => !item.isApplyOpen).map((item) => item.channelName || '未命名渠道');
    return {
        level: connectedChannels.length > 0 || data.isOpenFlow ? '较好' : '待开通',
        connectedChannels,
        pendingChannels,
        suggestions: [buildTrafficSuggestion(connectedChannels, pendingChannels)],
    };
}
function buildTrafficSuggestion(connectedChannels, pendingChannels) {
    if (pendingChannels.length > 0) {
        return `还有 ${pendingChannels.length} 个渠道待开通：${pendingChannels.join('、')}`;
    }
    if (connectedChannels.length > 0) {
        return `已开通 ${connectedChannels.length} 个渠道：${connectedChannels.join('、')}`;
    }
    return '暂无渠道配置，请先维护 OTA 渠道。';
}
const orderTypeByTab = {
    arrivals: '11',
    staying: '12',
    departing: '13',
};
function normalizeOrder(raw) {
    const item = raw;
    return {
        source: String(item.channelName ?? '-'),
        name: String(item.guestName ?? '-'),
        phone: String(item.guestMobile ?? '-'),
        roomType: String(item.roomCategoryName ?? '-'),
        room: item.roomName ? String(item.roomName) : '-',
        stayRange: `${formatDateTime(item.startTime)}至${formatDateTime(item.endTime)}`,
        nights: String(item.dayNum ?? 1),
        status: String(item.orderDetailDisplayStateName ?? item.statusName ?? '待确认'),
    };
}
function normalizeMemoItem(raw) {
    const item = raw;
    const memoId = item.memoId ?? item.id;
    const content = item.content ?? item.memoContent ?? item.title;
    if (memoId === undefined || memoId === null || content === undefined || content === null)
        return null;
    return {
        memoId: String(memoId),
        content: String(content),
        isHandle: Number(item.isHandle ?? item.handled ?? 0),
    };
}
function isMemoItem(value) {
    return value !== null;
}
function normalizeBacklogItem(raw) {
    const item = raw;
    const content = item.content;
    if (typeof content !== 'string')
        return null;
    try {
        const parsed = JSON.parse(content);
        return {
            type: normalizeBacklogItemType(parsed.type ?? parsed.category ?? item.type ?? item.category),
            title: parsed.title || '待办事项',
            detail: parsed.sub_title || parsed.button || '',
        };
    }
    catch {
        return { type: normalizeBacklogItemType(item.type ?? item.category), title: content, detail: '' };
    }
}
function normalizeBacklogItemType(value) {
    const normalized = String(value ?? '').trim().toLowerCase();
    return normalized === 'product' || normalized === 'product_dynamic' || normalized === 'productdynamic' ? 'product' : 'todo';
}
function toWorkspaceNewsItem(item) {
    return { title: item.title, detail: item.detail };
}
function isBacklogItem(value) {
    return value !== null;
}
function normalizeTrendDates(list) {
    if (!Array.isArray(list) || list.length === 0)
        return [];
    return list.map((item) => {
        if (typeof item === 'string')
            return item;
        const date = item.date || '';
        const [, , month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? [];
        return month && day ? `${month}/${day}` : date;
    });
}
function normalizeTrendPoints(list) {
    if (!Array.isArray(list) || list.length === 0)
        return [];
    return list.map((item) => ({
        date: item.date || '',
        label: normalizeTrendDateLabel(item.date || ''),
        businessIncome: toFiniteNumber(item.businessIncome),
        occ: normalizeOccTrendValue(item.occ),
        adr: toFiniteNumber(item.adr),
        revPar: toFiniteNumber(item.revPar),
        openRoomCount: toFiniteNumber(item.openRoomCount),
    }));
}
function normalizeTrendDateLabel(date) {
    const [, , month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? [];
    return month && day ? `${month}/${day}` : date;
}
function normalizeOccTrendValue(value) {
    const number = toFiniteNumber(value);
    return number > 0 && number <= 1 ? number * 100 : number;
}
function normalizeOriginSlices(list) {
    const palette = ['#2269df', '#ff7a2e', '#f0c56b', '#31509e'];
    if (!Array.isArray(list) || list.length === 0)
        return [];
    const total = list.reduce((sum, item) => sum + toFiniteNumber(item.orderCount), 0) || 1;
    return list.slice(0, 4).map((item, index) => ({
        label: item.channelName || '未知渠道',
        count: toFiniteNumber(item.orderCount),
        percent: (toFiniteNumber(item.orderCount) / total) * 100,
        value: `${((toFiniteNumber(item.orderCount) / total) * 100).toFixed(2)}%`,
        color: palette[index % palette.length],
    }));
}
function toFiniteNumber(value) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
}
function getAnalysisRange(range) {
    const today = startOfDay(new Date());
    const yesterday = addDays(today, -1);
    if (range === 'month') {
        return { startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: formatDate(today) };
    }
    if (range === 'week') {
        return {
            startDate: formatDate(addDays(today, -5)),
            endDate: formatDate(today),
            predictStartDate: formatDate(addDays(today, -5)),
            predictEndDate: formatDate(addDays(today, 1)),
        };
    }
    if (range === 'lastWeek') {
        return { startDate: formatDate(addDays(today, -12)), endDate: formatDate(addDays(today, -6)) };
    }
    return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
}
function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
}
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function formatDateTime(value) {
    const date = typeof value === 'number' ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime()))
        return '-';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}.${day} ${hour}:${minute}`;
}
function formatNumber(value) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? String(number) : '0';
}
function formatCurrency(value) {
    const number = Number(value ?? 0);
    const normalized = Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, '');
    return `￥${normalized}`;
}
function formatCurrencyFromCents(value) {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number))
        return '￥0';
    return formatCurrency(number / 100);
}
function formatPercent(value) {
    const number = Number(value ?? 0);
    const normalized = Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, '');
    return `${normalized}%`;
}
