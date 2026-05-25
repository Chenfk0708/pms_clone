import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchHouseOrders, resolveHouseOrderCampId, } from '../services/houseOrders';
import { fetchLongRentalOrders, resolveLongRentalQueryFromLocation, } from '../services/longRentalOrders';
import './OrdersPage.css';
const quickFilters = [
    '全部',
    '今日新单',
    '今日预抵',
    '今日在住',
    '今日预离',
    '明日入住',
    '明日退房',
    '待接单',
    '待退款',
    '异常订单',
];
const houseBaseColumns = [
    '订单号',
    '渠道',
    '订单状态',
    '联系人',
    '手机号',
    '入住类型',
    '房型',
    '房间',
    '门店',
    '入住时间',
    '离开时间',
    '入住状态',
    '售后状态',
    '房费(减佣)',
    '其他消费',
    '房费(含佣)',
    '订单总收入',
    '订单欠款',
    '预订时间',
    '渠道单号',
];
const longRentalBaseColumns = [
    '订单号',
    '渠道',
    '租客姓名',
    '手机号',
    '房型',
    '房间',
    '门店',
    '入住时间',
    '离开时间',
    '入住状态',
    '房费（含佣）',
    '房费（减佣）',
    '其他消费',
    '押金',
    '订单总收入',
    '合同时间',
    '合同期限',
    '缴费方式',
    '缴费时间',
    '预订时间',
];
const collapsedTrailingColumns = ['操作'];
const expandedTrailingColumns = ['操作', '占库存', '已排房', '计入统计'];
const longRentalAdvancedFilters = [
    ['日期类型', '请选择日期类型'],
    ['订单状态', '请选择订单状态'],
    ['订单渠道', '全部'],
    ['订单房型', '全部'],
    ['入住状态', '全部'],
    ['平台账号', '全部'],
    ['订单门店', '全部'],
    ['订单标签', '全部'],
    ['排房情况', '请选择排房情况'],
    ['库存情况', '请选择占库存情况'],
    ['统计情况', '请选择统计情况'],
    ['房型标签', '全部'],
];
function statusTone(status) {
    if (status === '进行中' || status === '入住中')
        return 'is-running';
    if (status === '已完成' || status === '已退房')
        return 'is-done';
    if (status === '已预订' || status === '待入住')
        return 'is-booked';
    return 'is-canceled';
}
function formatDateRange(order) {
    const start = order.checkInAt.slice(0, 10).replace(/-/g, '.');
    const end = order.leaveAt.slice(0, 10).replace(/-/g, '.');
    return `${start}-${end} 1晚`;
}
function formatLongContractTime(order) {
    return `${order.contractStart} 至 ${order.contractEnd}`;
}
function resolveOrderFlagState(kind, value, fallbackState = false) {
    const normalized = value?.trim().toLowerCase() ?? '';
    if (['1', 'true', 'yes', '是', '√', '✓', '占库存', '已排房', '计入统计'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'no', '否', '×', '✕', '未排房', '不占库存', '不计入统计'].includes(normalized)) {
        return false;
    }
    if (kind === 'room' && normalized === '-') {
        return false;
    }
    return fallbackState;
}
function renderOrderFlagIndicator(kind, value, fallbackState = false) {
    const enabled = resolveOrderFlagState(kind, value, fallbackState);
    return (_jsx("span", { className: `order-flag-indicator ${enabled ? 'is-positive' : 'is-negative'}`, "aria-label": enabled ? '是' : '否', children: enabled ? '√' : '×' }));
}
function resolveVisibleColumns(baseColumns, expanded) {
    return [...baseColumns, ...(expanded ? expandedTrailingColumns : collapsedTrailingColumns)];
}
function resolveFixedColumnClassName(column) {
    if (column === '操作')
        return 'order-action-head order-action-head--edge';
    if (column === '占库存')
        return 'order-fixed-flag-head order-fixed-flag-head--stock';
    if (column === '已排房')
        return 'order-fixed-flag-head order-fixed-flag-head--room';
    if (column === '计入统计')
        return 'order-fixed-flag-head order-fixed-flag-head--plan';
    return undefined;
}
function OrderColumnToggle({ expanded, onToggle, }) {
    return (_jsxs("button", { type: "button", className: `order-column-toggle ${expanded ? 'is-expanded' : ''}`, "aria-label": expanded ? '隐藏操作列' : '显示操作列', "data-testid": "order-column-toggle", onClick: onToggle, children: [_jsx("span", { className: "order-column-toggle__icon", "aria-hidden": "true", children: expanded ? '‹' : '›' }), _jsx("span", { children: expanded ? '收起' : '展开' })] }));
}
function renderOrderColumnHeader(column, expanded, onToggle) {
    if (column === '操作') {
        return (_jsxs("div", { role: "columnheader", className: resolveFixedColumnClassName(column), children: [_jsx("span", { children: "\u64CD\u4F5C" }), _jsx(OrderColumnToggle, { expanded: expanded, onToggle: onToggle })] }, column));
    }
    return (_jsx("div", { role: "columnheader", className: resolveFixedColumnClassName(column), children: column }, column));
}
function OrderDetail({ order, onClose, onBlockedAction, }) {
    const collected = order.collected ?? order.totalRevenue;
    const commission = order.commission ?? '0';
    return (_jsx("div", { className: "order-detail-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "order-detail-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u8BA2\u5355\u8BE6\u60C5", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "order-detail-drawer__header", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u8BA2\u5355\u8BE6\u60C5" }), _jsx("span", { children: order.stayType })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BA2\u5355\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("nav", { className: "order-detail-tabs", "aria-label": "\u8BA2\u5355\u8BE6\u60C5\u6807\u7B7E", children: [_jsx("button", { type: "button", className: "is-active", children: "\u8BA2\u5355\u4FE1\u606F" }), _jsx("button", { type: "button", children: "\u6E20\u9053\u4FE1\u606F" }), _jsx("button", { type: "button", children: "\u64CD\u4F5C\u65E5\u5FD7" })] }), _jsxs("div", { className: "order-detail-body", children: [_jsxs("section", { className: "order-guest-card", children: [_jsxs("div", { children: [_jsx("strong", { children: order.contact }), _jsx("span", { children: "\u76F4" }), _jsx("em", { children: order.channel })] }), _jsxs("p", { children: ["\u624B\u673A\u53F7\uFF1A", order.phone === '-' ? '无' : order.phone] }), _jsxs("p", { children: ["\u6E20\u9053\u5355\u53F7\uFF1A", order.channelOrderNo] })] }), _jsxs("section", { className: "order-room-card", children: [_jsxs("div", { className: "order-room-card__title", children: [_jsxs("strong", { children: [order.roomType, "\uFF08", order.room === '-' ? '未排房' : order.room, "\uFF09"] }), _jsx("span", { className: statusTone(order.liveStatus), children: order.liveStatus })] }), _jsx("p", { children: formatDateRange(order) }), _jsxs("strong", { className: "order-room-card__total", children: ["\u00A5 ", order.totalRevenue] })] }), _jsxs("section", { className: "order-detail-section", children: [_jsx("h3", { children: "\u5165\u4F4F\u4EBA\uFF080/1\uFF09" }), _jsx("button", { type: "button", className: "order-link-button", onClick: () => onBlockedAction('登记入住人'), children: "\u767B\u8BB0\u5165\u4F4F\u4EBA" })] }), _jsxs("section", { className: "order-rate-card", children: [_jsx("header", { children: _jsxs("strong", { children: [order.roomType, "<\u65E0\u65E9>"] }) }), _jsxs("div", { className: "order-rate-grid", children: [_jsx("span", { children: "\u623F\u8D39(\u51CF\u4F63):" }), _jsxs("strong", { children: ["\u00A5", order.roomRevenueNet] }), _jsx("span", { children: "\u8BA2\u5355\u603B\u6536\u5165:" }), _jsxs("strong", { children: ["\u00A5", Number(order.totalRevenue).toFixed(2)] }), _jsx("span", { children: "\u4F63\u91D1:" }), _jsxs("strong", { children: ["\u00A5", commission] }), _jsx("span", { children: "\u623F\u8D39(\u542B\u4F63):" }), _jsxs("strong", { children: ["\u00A5", Number(order.roomRevenueGross).toFixed(2)] }), _jsx("span", { children: "\u5176\u4ED6\u6D88\u8D39:" }), _jsxs("strong", { children: ["\u00A5", Number(order.otherExpense).toFixed(2)] })] }), _jsxs("div", { className: "order-room-date-table", role: "table", "aria-label": "\u623F\u8D39\u65E5\u5386", children: [_jsxs("div", { role: "row", className: "order-room-date-table__head", children: [_jsx("div", { role: "columnheader", children: "\u623F\u95F4/\u65E5\u671F" }), _jsx("div", { role: "columnheader", children: order.checkInAt.slice(0, 10) })] }), _jsxs("div", { role: "row", children: [_jsxs("div", { role: "cell", children: [order.roomType, "(", order.room === '-' ? '未排房' : order.room, ")"] }), _jsx("div", { role: "cell", children: order.roomRevenueNet })] })] })] }), _jsxs("section", { className: "order-pay-card", children: [_jsx("h3", { children: "\u623F\u8D39\u6536\u6B3E" }), _jsxs("p", { children: ["\u6536\u6B3E\u91D1\u989D: \uFFE5", collected] }), _jsxs("p", { children: ["\u623F\u8D39\u6B20\u6B3E: \uFFE5", order.debt] })] }), _jsxs("section", { className: "order-detail-columns", children: [_jsxs("div", { children: [_jsx("h3", { children: "\u5F00\u7968\u4FE1\u606F" }), _jsx("p", { children: "\u5176\u4ED6\u6536\u5165/\u652F\u51FA 0\u9879/ \u00A50.00" })] }), _jsxs("div", { children: [_jsx("h3", { children: "\u62BC\u91D1\u4FE1\u606F" }), _jsx("p", { children: "\u62BC\u91D1\u91D1\u989D: \u00A5 0" })] }), _jsxs("div", { children: [_jsx("h3", { children: "\u8BA2\u5355\u6B20\u6B3E" }), _jsxs("p", { children: ["\u00A5", order.debt] })] })] }), _jsxs("section", { className: "order-detail-section", children: [_jsx("h3", { children: "\u8BA2\u5355\u5907\u6CE8" }), _jsxs("p", { children: ["\u8054\u7CFB\u5BA2\u4EBA\u8BF7\u62E8\u6253:02160454587(\u9A8C\u8BC1\u7801:05383);\u5982\u5BA2\u4EBA\u9700\u8981\u53D1\u7968\uFF0C\u8BF7\u8D35\u9152\u5E97\u5F00\u5177\uFF0C \u5F00\u7968\u91D1\u989D\uFF1ACNY", collected, " \u5BA2\u4EBA\u7535\u8BDD:\u8054\u7CFB\u5BA2\u4EBA\u8BF7\u62E8\u6253:02160454587; \u8BA2\u5355\u786E\u8BA4\u53F7: ", order.confirmNo ?? order.channelOrderNo] })] }), _jsxs("section", { className: "order-detail-meta", children: [_jsx("span", { children: "\u8BA2\u5355\u6807\u7B7E" }), _jsx("span", { children: "\u8BA2\u5355\u63D0\u9192" }), _jsx("span", { children: "\u8BA2\u5355\u9644\u4EF6" }), _jsx("span", { children: "\u521B\u5EFA\u4EBA \u65E0" }), _jsxs("span", { children: ["\u8BA2\u5355\u53F7 ", order.orderNo] }), _jsxs("span", { children: ["\u9884\u8BA2\u65F6\u95F4 ", order.bookedAt.replace(/-/g, '.')] })] }), _jsx("section", { className: "order-detail-actions", "aria-label": "\u8BA2\u5355\u64CD\u4F5C", children: ['邀请登记', '邀请续住', '入住人', '延迟退房', '换房', '取消排房', '不占库存', '不计入统计', '设为续住单', '取消房单', '保洁', '打印'].map((action) => (_jsx("button", { type: "button", onClick: () => onBlockedAction(action), children: action }, action))) })] }), _jsxs("footer", { className: "order-detail-footer", children: [_jsxs("div", { children: [_jsx("span", { children: "\u623F\u8D39(\u51CF\u4F63)\uFF1A" }), _jsxs("strong", { children: ["\u00A5", order.roomRevenueNet] })] }), _jsxs("div", { children: [_jsx("span", { children: "\u8BA2\u5355\u603B\u6536\u5165\uFF1A" }), _jsxs("strong", { children: ["\u00A5", Number(order.totalRevenue).toFixed(2)] })] }), _jsx("button", { type: "button", onClick: () => onBlockedAction('更多操作'), children: "\u66F4\u591A\u64CD\u4F5C" }), _jsx("button", { type: "button", onClick: () => onBlockedAction('收款'), children: "\u6536 \u6B3E" }), _jsx("button", { type: "button", onClick: () => onBlockedAction('续住'), children: "\u7EED \u4F4F" }), _jsx("button", { type: "button", onClick: () => onBlockedAction('入住'), children: "\u5165\u4F4F" }), _jsx("button", { type: "button", onClick: () => onBlockedAction('退房'), children: "\u9000\u623F" })] })] }) }));
}
function LongRentalOrderDetail({ order, onClose, onAction, }) {
    const [activeTab, setActiveTab] = useState('order');
    return (_jsx("div", { className: "order-detail-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "order-detail-drawer long-rental-detail", role: "dialog", "aria-modal": "true", "aria-label": "\u957F\u79DF\u8BA2\u5355\u8BE6\u60C5", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "order-detail-drawer__header", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u957F\u79DF\u8BA2\u5355\u8BE6\u60C5" }), _jsxs("span", { children: [order.contractTerm, " / ", order.paymentMethod] })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u957F\u79DF\u8BA2\u5355\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("nav", { className: "order-detail-tabs", "aria-label": "\u957F\u79DF\u8BA2\u5355\u8BE6\u60C5\u6807\u7B7E", children: [_jsx("button", { type: "button", className: activeTab === 'order' ? 'is-active' : '', onClick: () => setActiveTab('order'), children: "\u8BA2\u5355\u4FE1\u606F" }), _jsx("button", { type: "button", className: activeTab === 'contract' ? 'is-active' : '', onClick: () => setActiveTab('contract'), children: "\u5408\u540C\u4FE1\u606F" }), _jsx("button", { type: "button", className: activeTab === 'payment' ? 'is-active' : '', onClick: () => setActiveTab('payment'), children: "\u7F34\u8D39\u8BB0\u5F55" })] }), _jsxs("div", { className: "order-detail-body", children: [activeTab === 'order' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "order-guest-card", children: [_jsxs("div", { children: [_jsx("strong", { children: order.tenantName }), _jsx("span", { children: "\u957F" }), _jsx("em", { children: order.channel })] }), _jsxs("p", { children: ["\u624B\u673A\u53F7\uFF1A", order.phone] }), _jsxs("p", { children: ["\u8BA2\u5355\u53F7\uFF1A", order.orderNo] })] }), _jsxs("section", { className: "order-room-card", children: [_jsxs("div", { className: "order-room-card__title", children: [_jsxs("strong", { children: [order.roomType, "\uFF08", order.room === '-' ? '未排房' : order.room, "\uFF09"] }), _jsx("span", { className: `order-status ${statusTone(order.liveStatus)}`, children: order.liveStatus })] }), _jsx("p", { children: formatLongContractTime(order) }), _jsxs("strong", { className: "order-room-card__total", children: ["\u62BC\u91D1\uFF1A", order.deposit] })] }), _jsxs("section", { className: "order-rate-card", children: [_jsx("header", { children: _jsx("strong", { children: "\u5408\u540C\u4E0E\u8D39\u7528" }) }), _jsxs("div", { className: "order-rate-grid", children: [_jsx("span", { children: "\u623F\u8D39\uFF08\u542B\u4F63\uFF09\uFF1A" }), _jsx("strong", { children: order.roomRevenueGross }), _jsx("span", { children: "\u623F\u8D39\uFF08\u51CF\u4F63\uFF09\uFF1A" }), _jsx("strong", { children: order.roomRevenueNet }), _jsx("span", { children: "\u5176\u4ED6\u6D88\u8D39\uFF1A" }), _jsx("strong", { children: order.otherExpense }), _jsx("span", { children: "\u62BC\u91D1\uFF1A" }), _jsx("strong", { children: order.deposit }), _jsx("span", { children: "\u8BA2\u5355\u603B\u6536\u5165\uFF1A" }), _jsx("strong", { children: order.totalRevenue }), _jsx("span", { children: "\u7F34\u8D39\u65B9\u5F0F\uFF1A" }), _jsx("strong", { children: order.paymentMethod }), _jsx("span", { children: "\u7F34\u8D39\u65F6\u95F4\uFF1A" }), _jsx("strong", { children: order.paymentDate }), _jsx("span", { children: "\u5408\u540C\u671F\u9650\uFF1A" }), _jsx("strong", { children: order.contractTerm })] })] })] })) : null, activeTab === 'contract' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "order-detail-section", children: [_jsx("h3", { children: "\u5408\u540C\u5468\u671F" }), _jsx("p", { children: formatLongContractTime(order) }), _jsxs("p", { children: ["\u5408\u540C\u7F16\u53F7\uFF1A", order.contractNo] })] }), _jsxs("section", { className: "order-rate-card", children: [_jsx("header", { children: _jsx("strong", { children: "\u79DF\u4F4F\u7EA6\u5B9A" }) }), _jsxs("div", { className: "order-rate-grid", children: [_jsx("span", { children: "\u5408\u540C\u671F\u9650\uFF1A" }), _jsx("strong", { children: order.contractTerm }), _jsx("span", { children: "\u7F34\u8D39\u65B9\u5F0F\uFF1A" }), _jsx("strong", { children: order.paymentMethod }), _jsx("span", { children: "\u5360\u5E93\u5B58\uFF1A" }), _jsx("strong", { children: order.stockFlag || '1' }), _jsx("span", { children: "\u8BA1\u5165\u7EDF\u8BA1\uFF1A" }), _jsx("strong", { children: order.planFlag || '-' })] })] })] })) : null, activeTab === 'payment' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "order-detail-section", children: [_jsx("h3", { children: "\u7F34\u8D39\u8BA1\u5212" }), _jsxs("p", { children: ["\u4E0B\u6B21\u7F34\u8D39\u65E5\u671F\uFF1A", order.nextPaymentDate] }), _jsxs("p", { children: ["\u4E0B\u6B21\u5E94\u6536\u91D1\u989D\uFF1A", order.nextPaymentAmount] })] }), _jsxs("section", { className: "order-pay-card", children: [_jsx("h3", { children: "\u62BC\u91D1\u4E0E\u6536\u6B3E" }), _jsxs("p", { children: ["\u62BC\u91D1\uFF1A", order.deposit] }), _jsxs("p", { children: ["\u8BA2\u5355\u603B\u6536\u5165\uFF1A", order.totalRevenue] })] })] })) : null, _jsxs("section", { className: "order-detail-meta", children: [_jsxs("span", { children: ["\u79DF\u5BA2\u59D3\u540D ", order.tenantName] }), _jsxs("span", { children: ["\u9884\u8BA2\u65F6\u95F4 ", order.bookedAt] }), _jsxs("span", { children: ["\u5165\u4F4F\u72B6\u6001 ", order.liveStatus] }), _jsxs("span", { children: ["\u5360\u5E93\u5B58 ", order.stockFlag || '1'] }), _jsxs("span", { children: ["\u5DF2\u6392\u623F ", order.roomFlag || '-'] }), _jsxs("span", { children: ["\u8BA1\u5165\u7EDF\u8BA1 ", order.planFlag || '-'] })] })] }), _jsxs("footer", { className: "order-detail-footer", children: [_jsxs("div", { children: [_jsx("span", { children: "\u62BC\u91D1\uFF1A" }), _jsx("strong", { children: order.deposit })] }), _jsxs("div", { children: [_jsx("span", { children: "\u8BA2\u5355\u603B\u6536\u5165\uFF1A" }), _jsx("strong", { children: order.totalRevenue })] }), _jsx("button", { type: "button", onClick: () => onAction('更多操作'), children: "\u66F4\u591A\u64CD\u4F5C" }), _jsx("button", { type: "button", onClick: () => onAction('收款流程'), children: "\u6536 \u6B3E" }), _jsx("button", { type: "button", onClick: () => onAction('续租流程'), children: "\u7EED \u79DF" }), _jsx("button", { type: "button", onClick: () => onAction('退租流程'), children: "\u9000 \u79DF" })] })] }) }));
}
function LongRentalOrdersPage() {
    const [activeFilter, setActiveFilter] = useState('全部');
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [columnsExpanded, setColumnsExpanded] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [appliedKeyword, setAppliedKeyword] = useState('');
    const [dateType, setDateType] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [channel, setChannel] = useState('');
    const [roomType, setRoomType] = useState('');
    const [liveStatus, setLiveStatus] = useState('');
    const [store, setStore] = useState('');
    const [openSelect, setOpenSelect] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [requestError, setRequestError] = useState('');
    const [operationFeedback, setOperationFeedback] = useState('长租订单已就绪');
    const [requestRevision, setRequestRevision] = useState(0);
    const locationQuery = useMemo(() => resolveLongRentalQueryFromLocation(window.location), []);
    const orderType = orderTypeByFilter[activeFilter] ?? '';
    const query = useMemo(() => ({
        provider: locationQuery.provider,
        mockState: locationQuery.mockState,
        campId: locationQuery.campId,
        pageNum: 1,
        pageSize: 20,
        orderType,
        keyword: appliedKeyword,
        dateType,
        orderStatus,
        channel,
        roomType,
        liveStatus,
        store,
    }), [
        appliedKeyword,
        channel,
        dateType,
        liveStatus,
        locationQuery.mockState,
        locationQuery.provider,
        locationQuery.campId,
        orderStatus,
        orderType,
        roomType,
        store,
    ]);
    useEffect(() => {
        const controller = new AbortController();
        async function loadOrders() {
            setIsLoading(true);
            setRequestError('');
            try {
                const nextData = await fetchLongRentalOrders(query, controller.signal);
                if (controller.signal.aborted)
                    return;
                setData(nextData);
            }
            catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError')
                    return;
                setData(null);
                setRequestError(error instanceof Error ? error.message : String(error));
            }
            finally {
                if (!controller.signal.aborted)
                    setIsLoading(false);
            }
        }
        loadOrders();
        return () => controller.abort();
    }, [query, requestRevision]);
    const orders = data?.rows ?? [];
    const options = data?.options;
    const handleQuery = useCallback(() => {
        setAppliedKeyword(keyword.trim());
        setOperationFeedback('已按当前条件查询长租订单');
        setRequestRevision((value) => value + 1);
    }, [keyword]);
    const handleReset = useCallback(() => {
        setKeyword('');
        setAppliedKeyword('');
        setActiveFilter('全部');
        setFiltersExpanded(false);
        setColumnsExpanded(false);
        setDateType('');
        setOrderStatus('');
        setChannel('');
        setRoomType('');
        setLiveStatus('');
        setStore('');
        setOpenSelect(null);
        setOperationFeedback('筛选条件已重置');
        setRequestRevision((value) => value + 1);
    }, []);
    const handleAction = useCallback((label) => {
        setOperationFeedback(`${label}已记录`);
    }, []);
    const handleSelect = useCallback((label, value, setter) => {
        setter(value);
        setOpenSelect(null);
        setOperationFeedback(`${label}已更新`);
        setRequestRevision((revision) => revision + 1);
    }, []);
    const requestSummary = `orderType=${orderType || 'all'} keyword=${appliedKeyword || 'all'} dateType=${dateType || 'all'}`;
    const visibleColumns = useMemo(() => resolveVisibleColumns(longRentalBaseColumns, columnsExpanded), [columnsExpanded]);
    const tableClassName = `order-table order-table--long-rental ${columnsExpanded ? 'is-columns-expanded' : 'is-columns-collapsed'}`;
    return (_jsxs("div", { className: "page-stack order-page order-page--long-rental", children: [_jsx("h1", { children: "\u957F\u79DF\u8BA2\u5355" }), _jsxs("section", { className: "order-source-panel", "aria-label": "\u957F\u79DF\u8BA2\u5355\u6570\u636E\u6765\u6E90", children: [_jsx("span", { children: "\u957F\u79DF\u8BA2\u5355\u670D\u52A1 \u00B7 \u4E1A\u52A1\u6570\u636E" }), _jsx("span", { role: "status", "aria-label": "\u957F\u79DF\u8BA2\u5355\u52A0\u8F7D\u72B6\u6001", children: isLoading ? '正在加载长租订单' : `已加载 ${orders.length} 条` })] }), requestError ? (_jsxs("section", { className: "order-request-error", role: "alert", "aria-label": "\u957F\u79DF\u8BA2\u5355\u6570\u636E\u9519\u8BEF", children: [_jsx("span", { children: requestError }), _jsx("button", { type: "button", onClick: () => setRequestRevision((value) => value + 1), children: "\u91CD\u8BD5" })] })) : null, _jsxs("section", { className: "order-filter-panel", "aria-label": "\u957F\u79DF\u8BA2\u5355\u7B5B\u9009", children: [_jsx("div", { className: "order-filter-tabs", role: "radiogroup", "aria-label": "\u8BA2\u5355\u5FEB\u6377\u7B5B\u9009", children: quickFilters.map((filter) => (_jsx("button", { type: "button", role: "radio", "aria-checked": activeFilter === filter, className: activeFilter === filter ? 'is-active' : '', disabled: isLoading, onClick: () => {
                                setActiveFilter(filter);
                                setOperationFeedback(`${filter}筛选已切换`);
                            }, children: filter }, filter))) }), _jsxs("div", { className: "order-filter-row", children: [_jsx("input", { type: "text", value: keyword, onChange: (event) => setKeyword(event.target.value), placeholder: "\u8F93\u5165\u8BA2\u5355\u53F7/\u59D3\u540D/\u624B\u673A\u53F7" }), _jsxs("div", { className: "order-filter-actions", children: [_jsx("button", { type: "button", className: "order-primary-action", onClick: handleQuery, disabled: isLoading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "order-link-action", "data-testid": "order-filter-toggle", onClick: () => setFiltersExpanded((value) => !value), children: filtersExpanded ? '收起' : '展开' }), _jsx("button", { type: "button", className: "order-outline-action", onClick: handleReset, disabled: isLoading, children: "\u91CD\u7F6E\u7B5B\u9009" }), _jsx("button", { type: "button", className: "order-outline-action", onClick: () => {
                                            setOperationFeedback('长租订单已刷新');
                                            setRequestRevision((value) => value + 1);
                                        }, disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => setOperationFeedback('导出任务已创建，请在下载中心查看'), children: "\u5BFC\u51FA\u660E\u7EC6" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => setCreateDialogOpen(true), children: "\u5F55\u5165\u8BA2\u5355" })] })] }), filtersExpanded ? (_jsxs("div", { className: "order-advanced-filters order-advanced-filters--long-rental", children: [_jsx(LongRentalSelect, { label: "\u65E5\u671F\u7C7B\u578B", placeholder: "\u8BF7\u9009\u62E9\u65E5\u671F\u7C7B\u578B", value: dateType, options: options?.dateTypes ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('日期类型', value, setDateType) }), _jsx(LongRentalSelect, { label: "\u8BA2\u5355\u72B6\u6001", placeholder: "\u8BF7\u9009\u62E9\u8BA2\u5355\u72B6\u6001", value: orderStatus, options: options?.orderStatuses ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('订单状态', value, setOrderStatus) }), _jsx(LongRentalSelect, { label: "\u8BA2\u5355\u6E20\u9053", placeholder: "\u5168\u90E8", value: channel, options: options?.channels ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('订单渠道', value, setChannel) }), _jsx(LongRentalSelect, { label: "\u8BA2\u5355\u623F\u578B", placeholder: "\u5168\u90E8", value: roomType, options: options?.roomTypes ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('订单房型', value, setRoomType) }), _jsx(LongRentalSelect, { label: "\u5165\u4F4F\u72B6\u6001", placeholder: "\u5168\u90E8", value: liveStatus, options: options?.liveStatuses ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('入住状态', value, setLiveStatus) }), _jsx(LongRentalSelect, { label: "\u8BA2\u5355\u95E8\u5E97", placeholder: "\u5168\u90E8", value: store, options: options?.stores ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: (value) => handleSelect('订单门店', value, setStore) }), _jsx(LongRentalSelect, { label: "\u8BA2\u5355\u6807\u7B7E", placeholder: "\u5168\u90E8", value: "", options: options?.tags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('订单标签筛选') }), _jsx(LongRentalSelect, { label: "\u6392\u623F\u60C5\u51B5", placeholder: "\u8BF7\u9009\u62E9\u6392\u623F\u60C5\u51B5", value: "", options: options?.roomFlags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('排房情况筛选') }), _jsx(LongRentalSelect, { label: "\u5E93\u5B58\u60C5\u51B5", placeholder: "\u8BF7\u9009\u62E9\u5360\u5E93\u5B58\u60C5\u51B5", value: "", options: options?.stockFlags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('库存情况筛选') }), _jsx(LongRentalSelect, { label: "\u7EDF\u8BA1\u60C5\u51B5", placeholder: "\u8BF7\u9009\u62E9\u7EDF\u8BA1\u60C5\u51B5", value: "", options: options?.statisticsFlags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('统计情况筛选') }), longRentalAdvancedFilters.slice(5, 6).map(([label, value]) => (_jsx(LongRentalSelect, { label: label, placeholder: value, value: "", options: [{ label: value, value: '' }], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction(`${label}筛选`) }, label))), _jsx(LongRentalSelect, { label: "\u623F\u578B\u6807\u7B7E", placeholder: "\u5168\u90E8", value: "", options: options?.tags ?? [], openSelect: openSelect, setOpenSelect: setOpenSelect, onSelect: () => handleAction('房型标签筛选') })] })) : null] }), _jsx("div", { className: "order-operation-feedback", role: "status", "aria-label": "\u957F\u79DF\u8BA2\u5355\u64CD\u4F5C\u53CD\u9988", children: operationFeedback }), _jsxs("section", { className: "order-table-card", children: [_jsx("div", { className: "order-table-scroll", children: _jsxs("div", { className: tableClassName, role: "table", "aria-label": "\u957F\u79DF\u8BA2\u5355\u5217\u8868", children: [_jsx("div", { className: "order-table__head", role: "row", children: visibleColumns.map((column) => renderOrderColumnHeader(column, columnsExpanded, () => setColumnsExpanded((value) => !value))) }), isLoading ? (_jsx("div", { className: "order-table__empty", role: "row", children: _jsx("div", { role: "cell", children: "\u6B63\u5728\u52A0\u8F7D\u957F\u79DF\u8BA2\u5355..." }) })) : null, !isLoading && !requestError ? orders.map((order) => (_jsxs("div", { className: "order-table__row", role: "row", children: [_jsx("div", { role: "cell", className: "order-no", children: order.orderNo }), _jsx("div", { role: "cell", children: order.channel }), _jsx("div", { role: "cell", children: order.tenantName }), _jsx("div", { role: "cell", children: order.phone }), _jsx("div", { role: "cell", className: "order-room-type", children: order.roomType }), _jsx("div", { role: "cell", children: order.room }), _jsx("div", { role: "cell", children: order.store }), _jsx("div", { role: "cell", children: order.checkInAt }), _jsx("div", { role: "cell", children: order.leaveAt }), _jsx("div", { role: "cell", children: _jsx("span", { className: `order-status ${statusTone(order.liveStatus)}`, children: order.liveStatus }) }), _jsx("div", { role: "cell", children: order.roomRevenueGross }), _jsx("div", { role: "cell", children: order.roomRevenueNet }), _jsx("div", { role: "cell", children: order.otherExpense }), _jsx("div", { role: "cell", children: order.deposit }), _jsx("div", { role: "cell", children: order.totalRevenue }), _jsxs("div", { role: "cell", className: "order-contract-time", children: [_jsxs("span", { children: [order.contractStart, " \u81F3"] }), _jsx("span", { children: order.contractEnd })] }), _jsx("div", { role: "cell", children: order.contractTerm }), _jsx("div", { role: "cell", children: order.paymentMethod }), _jsx("div", { role: "cell", children: order.paymentDate }), _jsx("div", { role: "cell", children: order.bookedAt }), _jsx("div", { role: "cell", className: "order-action-cell order-action-cell--edge", children: _jsx("button", { type: "button", onClick: () => setSelectedOrder(order), children: "\u8BE6\u60C5" }) }), columnsExpanded ? (_jsxs(_Fragment, { children: [_jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--stock", children: renderOrderFlagIndicator('stock', order.stockFlag) }), _jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--room", children: renderOrderFlagIndicator('room', order.roomFlag, order.room !== '-') }), _jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--plan", children: renderOrderFlagIndicator('plan', order.planFlag) })] })) : null] }, order.orderNo))) : null, !isLoading && !requestError && orders.length === 0 ? (_jsx("div", { className: "order-table__empty", role: "row", children: _jsx("div", { role: "cell", children: "\u6682\u65E0\u957F\u79DF\u8BA2\u5355" }) })) : null] }) }), _jsxs("footer", { className: "order-pagination", "aria-label": "\u957F\u79DF\u8BA2\u5355\u5206\u9875\u548C\u8BF7\u6C42\u53C2\u6570", children: [_jsxs("span", { children: ["\u5171 ", data?.total ?? 0, " \u6761"] }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true, children: '<' }), _jsx("button", { type: "button", className: "is-active", children: data?.pageNum ?? 1 }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: !data || data.pageNum >= data.pages, onClick: () => handleAction('下一页'), children: '>' }), _jsx("span", { children: "20 \u6761/\u9875" }), _jsx("span", { className: "sr-only-heading", children: requestSummary })] })] }), selectedOrder ? (_jsx(LongRentalOrderDetail, { order: selectedOrder, onClose: () => setSelectedOrder(null), onAction: (label) => handleAction(label) })) : null, createDialogOpen ? (_jsxs("section", { className: "order-create-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u5F55\u5165\u957F\u79DF\u8BA2\u5355", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u5F55\u5165\u957F\u79DF\u8BA2\u5355" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5F55\u5165\u957F\u79DF\u8BA2\u5355", onClick: () => setCreateDialogOpen(false), children: "\u00D7" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u79DF\u5BA2\u59D3\u540D" }), _jsx("input", { defaultValue: "\u65B0\u79DF\u5BA2" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5408\u540C\u65F6\u95F4" }), _jsx("input", { defaultValue: "2026-05-18 \u81F3 2026-06-18" })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setCreateDialogOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => {
                                    setCreateDialogOpen(false);
                                    setOperationFeedback('长租订单已保存');
                                }, children: "\u4FDD\u5B58\u8BA2\u5355" })] })] })) : null] }));
}
function LongRentalSelect({ label, placeholder, value, options, openSelect, setOpenSelect, onSelect, }) {
    const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;
    const isOpen = openSelect === label;
    return (_jsxs("label", { className: "order-select-field", children: [_jsx("span", { children: label }), _jsx("button", { type: "button", "aria-label": label, className: "order-select-like", "aria-expanded": isOpen, onClick: () => setOpenSelect(isOpen ? null : label), children: selectedLabel }), isOpen ? (_jsx("div", { className: "order-select-menu", role: "listbox", "aria-label": `${label}选项`, children: options.map((option) => (_jsx("button", { type: "button", role: "option", onClick: () => onSelect(option.value), children: option.label }, `${label}-${option.value}-${option.label}`))) })) : null] }));
}
const orderTypeByFilter = {
    全部: '',
    今日新单: '1',
    今日预抵: '11',
    今日在住: '10',
    今日预离: '12',
    明日入住: '4',
    明日退房: '5',
    待接单: '6',
    待退款: '7',
    异常订单: '8',
};
function HouseOrdersPage() {
    const [activeFilter, setActiveFilter] = useState('全部');
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [columnsExpanded, setColumnsExpanded] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [requestRevision, setRequestRevision] = useState(0);
    const [actionMessage, setActionMessage] = useState('');
    const orderType = orderTypeByFilter[activeFilter] ?? '';
    useEffect(() => {
        const controller = new AbortController();
        async function loadOrders() {
            setIsLoading(true);
            setError('');
            try {
                const campId = resolveHouseOrderCampId();
                const nextData = await fetchHouseOrders({
                    campId,
                    pageNum: 1,
                    pageSize: 20,
                    orderType,
                    keyword: keyword.trim(),
                }, controller.signal);
                if (controller.signal.aborted)
                    return;
                setData(nextData);
            }
            catch (requestError) {
                if (controller.signal.aborted)
                    return;
                setData(null);
                setError(`数据服务请求失败：${requestError instanceof Error ? requestError.message : String(requestError)}`);
            }
            finally {
                if (!controller.signal.aborted)
                    setIsLoading(false);
            }
        }
        loadOrders();
        return () => controller.abort();
    }, [keyword, orderType, requestRevision]);
    const filteredOrders = useMemo(() => {
        const trimmedKeyword = keyword.trim().toLowerCase();
        const rows = data?.rows ?? [];
        if (!trimmedKeyword)
            return rows;
        return rows.filter((order) => [
            order.orderNo,
            order.channelOrderNo,
            order.room,
            order.roomType,
            order.contact,
            order.phone,
            order.channel,
            order.store,
        ]
            .join(' ')
            .toLowerCase()
            .includes(trimmedKeyword));
    }, [data?.rows, keyword]);
    const handleReset = useCallback(() => {
        setKeyword('');
        setActiveFilter('全部');
        setFiltersExpanded(false);
        setColumnsExpanded(false);
        setActionMessage('筛选条件已重置，正在重新请求住宿订单。');
        setRequestRevision((value) => value + 1);
    }, []);
    const handleBlockedAction = useCallback((label) => {
        const actionMessages = {
            导出明细: '导出明细任务已创建，范围为当前筛选结果。',
            录入订单: '录入订单面板已准备，可继续补充联系人、房型与入住时间。',
            排房: '排房面板已准备，可按当前订单选择可用房间。',
            登记入住人: '入住人登记面板已准备，可补充证件与联系方式。',
            更多操作: '更多操作菜单已展开，可选择订单改期、备注或标签维护。',
            收款: '收款面板已准备，可选择支付方式并核对待收金额。',
            续住: '续住面板已准备，可选择新的离店日期。',
            入住: '入住确认已打开，请核对房间与入住人信息。',
            退房: '退房确认已打开，请核对消费、押金与欠款。',
        };
        setActionMessage(actionMessages[label] ?? `${label}操作已响应，请在订单详情中继续处理。`);
    }, []);
    const requestText = data
        ? `已通过住宿订单数据服务刷新：${data.requestPaths.join('、')}，共 ${data.total} 条`
        : isLoading
            ? '正在请求住宿订单数据服务'
            : '等待住宿订单请求结果';
    const visibleColumns = useMemo(() => resolveVisibleColumns(houseBaseColumns, columnsExpanded), [columnsExpanded]);
    const tableClassName = `order-table order-table--house ${columnsExpanded ? 'is-columns-expanded' : 'is-columns-collapsed'}`;
    return (_jsxs("div", { className: "page-stack order-page", children: [_jsx("h1", { children: "\u4F4F\u5BBF\u8BA2\u5355" }), _jsxs("section", { className: "order-filter-panel", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u7B5B\u9009", children: [_jsx("div", { className: "order-filter-tabs", role: "radiogroup", "aria-label": "\u8BA2\u5355\u5FEB\u6377\u7B5B\u9009", children: quickFilters.map((filter) => (_jsx("button", { type: "button", role: "radio", "aria-checked": activeFilter === filter, className: activeFilter === filter ? 'is-active' : '', disabled: isLoading, onClick: () => setActiveFilter(filter), children: filter }, filter))) }), _jsxs("div", { className: "order-filter-row", children: [_jsx("input", { type: "text", value: keyword, onChange: (event) => setKeyword(event.target.value), placeholder: "\u8F93\u5165\u8BA2\u5355\u53F7/\u6E20\u9053\u8BA2\u5355\u53F7/\u623F\u95F4\u53F7/\u59D3\u540D/\u624B\u673A\u53F7", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u5173\u952E\u8BCD" }), _jsxs("div", { className: "order-filter-actions", children: [_jsx("button", { type: "button", className: "order-link-action", "data-testid": "order-filter-toggle", onClick: () => setFiltersExpanded((value) => !value), children: filtersExpanded ? '收起' : '展开' }), _jsx("button", { type: "button", className: "order-outline-action", onClick: handleReset, disabled: isLoading, children: "\u91CD\u7F6E\u7B5B\u9009" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => handleBlockedAction('导出明细'), children: "\u5BFC\u51FA\u660E\u7EC6" }), _jsx("button", { type: "button", className: "order-primary-action", onClick: () => handleBlockedAction('录入订单'), children: "\u5F55\u5165\u8BA2\u5355" })] })] }), filtersExpanded ? (_jsxs("div", { className: "order-advanced-filters", children: [_jsxs("label", { children: [_jsx("span", { children: "\u8BA2\u5355\u72B6\u6001" }), _jsxs("select", { defaultValue: "", onChange: () => handleBlockedAction('订单状态筛选'), children: [_jsx("option", { value: "", children: "\u5168\u90E8" }), _jsx("option", { children: "\u8FDB\u884C\u4E2D" }), _jsx("option", { children: "\u5DF2\u9884\u8BA2" }), _jsx("option", { children: "\u5DF2\u5B8C\u6210" }), _jsx("option", { children: "\u5DF2\u53D6\u6D88" })] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6E20\u9053" }), _jsxs("select", { defaultValue: "", onChange: () => handleBlockedAction('渠道筛选'), children: [_jsx("option", { value: "", children: "\u5168\u90E8\u6E20\u9053" }), _jsx("option", { children: "\u643A\u7A0B" }), _jsx("option", { children: "\u8DEF\u5BA2\u4E91\u805A\u5408" }), _jsx("option", { children: "\u98DE\u732A\u6DD8\u9152\u5E97" }), _jsx("option", { children: "\u9014\u5BB6" })] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u5165\u4F4F\u65E5\u671F" }), _jsx("input", { type: "text", placeholder: "\u5F00\u59CB\u65E5\u671F - \u7ED3\u675F\u65E5\u671F", onFocus: () => handleBlockedAction('入住日期筛选') })] }), _jsxs("label", { children: [_jsx("span", { children: "\u79BB\u5F00\u65E5\u671F" }), _jsx("input", { type: "text", placeholder: "\u5F00\u59CB\u65E5\u671F - \u7ED3\u675F\u65E5\u671F", onFocus: () => handleBlockedAction('离开日期筛选') })] })] })) : null, _jsx("div", { className: "order-request-status", role: "status", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u8BF7\u6C42\u72B6\u6001", children: requestText }), actionMessage ? (_jsx("div", { className: "order-action-feedback", role: "status", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u64CD\u4F5C\u53CD\u9988", children: actionMessage })) : null, error ? (_jsxs("div", { className: "order-request-error", role: "alert", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => setRequestRevision((value) => value + 1), children: "\u91CD\u8BD5" })] })) : null] }), _jsxs("section", { className: "order-table-card", "aria-busy": isLoading, children: [_jsx("div", { className: "order-table-scroll", children: _jsxs("div", { className: tableClassName, role: "table", "aria-label": "\u4F4F\u5BBF\u8BA2\u5355\u5217\u8868", children: [_jsx("div", { className: "order-table__head", role: "row", children: visibleColumns.map((column) => renderOrderColumnHeader(column, columnsExpanded, () => setColumnsExpanded((value) => !value))) }), isLoading ? (_jsx("div", { className: "order-table__empty", role: "row", children: _jsx("div", { role: "cell", children: "\u6B63\u5728\u52A0\u8F7D\u4F4F\u5BBF\u8BA2\u5355..." }) })) : null, !isLoading && !error
                                    ? filteredOrders.map((order) => (_jsxs("div", { className: "order-table__row", role: "row", children: [_jsx("div", { role: "cell", className: "order-no", children: order.orderNo }), _jsx("div", { role: "cell", children: order.channel }), _jsx("div", { role: "cell", children: _jsx("span", { className: `order-status ${statusTone(order.status)}`, children: order.status }) }), _jsx("div", { role: "cell", children: order.contact }), _jsx("div", { role: "cell", children: order.phone }), _jsx("div", { role: "cell", children: order.stayType }), _jsx("div", { role: "cell", className: "order-room-type", children: order.roomType }), _jsx("div", { role: "cell", className: order.needsRoomAssignment ? 'needs-room' : undefined, children: order.needsRoomAssignment ? (_jsxs(_Fragment, { children: [_jsx("span", { children: order.room }), _jsx("em", { children: "\u672A\u6392\u623F" })] })) : (order.room) }), _jsx("div", { role: "cell", children: order.store }), _jsx("div", { role: "cell", children: order.checkInAt }), _jsx("div", { role: "cell", children: order.leaveAt }), _jsx("div", { role: "cell", children: _jsx("span", { className: `order-status ${statusTone(order.liveStatus)}`, children: order.liveStatus }) }), _jsx("div", { role: "cell", children: order.afterSaleStatus }), _jsx("div", { role: "cell", children: order.roomRevenueNet }), _jsx("div", { role: "cell", children: order.otherExpense }), _jsx("div", { role: "cell", children: order.roomRevenueGross }), _jsx("div", { role: "cell", children: order.totalRevenue }), _jsx("div", { role: "cell", children: order.debt }), _jsx("div", { role: "cell", children: order.bookedAt }), _jsx("div", { role: "cell", children: order.channelOrderNo }), _jsxs("div", { role: "cell", className: "order-action-cell order-action-cell--edge", children: [order.needsRoomAssignment ? (_jsx("button", { type: "button", onClick: () => handleBlockedAction('排房'), children: "\u6392\u623F" })) : null, _jsx("button", { type: "button", onClick: () => setSelectedOrder(order), children: "\u8BE6\u60C5" })] }), columnsExpanded ? (_jsxs(_Fragment, { children: [_jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--stock", children: renderOrderFlagIndicator('stock', order.stockFlag) }), _jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--room", children: renderOrderFlagIndicator('room', order.roomFlag, !order.needsRoomAssignment) }), _jsx("div", { role: "cell", className: "order-fixed-flag-cell order-fixed-flag-cell--plan", children: renderOrderFlagIndicator('plan', order.planFlag) })] })) : null] }, order.orderNo)))
                                    : null, !isLoading && !error && filteredOrders.length === 0 ? (_jsx("div", { className: "order-table__empty", role: "row", children: _jsx("div", { role: "cell", children: "\u6682\u65E0\u6570\u636E" }) })) : null] }) }), _jsxs("footer", { className: "order-pagination", children: [_jsxs("span", { children: ["\u5171 ", data?.total ?? 0, " \u6761"] }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true, children: '<' }), _jsx("button", { type: "button", className: "is-active", children: data?.pageNum ?? 1 }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: !data?.pages || data.pageNum >= data.pages, onClick: () => handleBlockedAction('下一页'), children: '>' }), _jsxs("span", { children: [data?.pageSize ?? 20, " \u6761/\u9875"] })] })] }), selectedOrder ? (_jsx(OrderDetail, { order: selectedOrder, onClose: () => setSelectedOrder(null), onBlockedAction: handleBlockedAction })) : null] }));
}
export function OrdersPage({ variant = 'house' }) {
    return variant === 'longRental' ? _jsx(LongRentalOrdersPage, {}) : _jsx(HouseOrdersPage, {});
}
