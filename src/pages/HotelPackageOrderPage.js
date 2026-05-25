import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { createHotelPackageOrderRequestBody, getHotelPackageOrderMockState, loadHotelPackageOrderData, readInitialHotelPackageOrderFilters, HOTEL_PACKAGE_ORDER_DEFAULT_PAGE_SIZE, } from '../services/hotelPackageOrder';
import './PresaleOrderPage.css';
const defaultFilters = {
    orderState: 'all',
    source: '',
    afterSale: '',
    keyword: '',
    startDate: '',
    endDate: '',
    pageNum: 1,
    pageSize: HOTEL_PACKAGE_ORDER_DEFAULT_PAGE_SIZE,
};
const fallbackOptions = {
    orderStates: [
        { value: 'all', label: '全部' },
        { value: 'paid', label: '已支付' },
        { value: 'finished', label: '已完成' },
        { value: 'canceled', label: '已取消' },
    ],
    sources: [
        { value: 'brand', label: '品牌小程序' },
        { value: 'wechat', label: '微信商城' },
        { value: 'offline', label: '线下导入' },
        { value: 'distribution', label: '分销渠道' },
    ],
    afterSales: [
        { value: 'none', label: '无售后' },
        { value: 'refunding', label: '退款中' },
        { value: 'refunded', label: '退款成功' },
    ],
};
const tableColumns = ['商品', '购买数量', '商品单价(元)', '团期差价（元）', '实付金额(元)', '联系号码', '订单状态', '售后状态', '操作'];
export function HotelPackageOrderPage() {
    const [filters, setFilters] = useState(() => ({
        ...defaultFilters,
        ...readInitialHotelPackageOrderFilters(),
    }));
    const [openFilter, setOpenFilter] = useState(null);
    const [data, setData] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const initialFiltersRef = useRef(filters);
    const optionsByFilter = useMemo(() => ({
        orderState: data?.options.orderStates.length ? data.options.orderStates : fallbackOptions.orderStates,
        source: data?.options.sources.length ? data.options.sources : fallbackOptions.sources,
        afterSale: data?.options.afterSales.length ? data.options.afterSales : fallbackOptions.afterSales,
    }), [data]);
    useEffect(() => {
        const controller = new AbortController();
        void requestOrders(initialFiltersRef.current, controller.signal, '首屏加载');
        return () => controller.abort();
    }, []);
    async function requestOrders(nextFilters, signal, reason = '搜索') {
        setLoading(true);
        setError('');
        setNotice(reason === '首屏加载' ? '' : `${reason}中`);
        const result = await loadHotelPackageOrderData(nextFilters, {
            signal,
            mockState: getHotelPackageOrderMockState(),
        });
        if (result.ok) {
            setData(result.data);
            setNotice(reason === '首屏加载' ? '' : `${reason}完成，当前展示 ${result.data.rows.length} 条，共 ${result.data.pagination.total} 条`);
        }
        else {
            setError(result.message);
            setNotice(reason === '首屏加载' ? '' : `${reason}失败，可调整条件后重试`);
        }
        setLoading(false);
    }
    function updateFilter(partial) {
        setFilters((current) => ({ ...current, ...partial }));
    }
    function chooseFilter(key, option) {
        updateFilter({ [key]: option.value, pageNum: 1 });
        setOpenFilter(null);
        setNotice(`${labelForFilter(key)}已选择 ${option.label}`);
    }
    function resetFilters() {
        const nextFilters = { ...defaultFilters };
        setFilters(nextFilters);
        setOpenFilter(null);
        void requestOrders(nextFilters, undefined, '重置');
    }
    function submitSearch() {
        const nextFilters = { ...filters, pageNum: 1 };
        setFilters(nextFilters);
        setOpenFilter(null);
        void requestOrders(nextFilters, undefined, '搜索');
    }
    function changePage(offset) {
        const nextPage = Math.max(1, filters.pageNum + offset);
        const nextFilters = { ...filters, pageNum: nextPage };
        setFilters(nextFilters);
        setNotice(`已切换到第 ${nextPage} 页`);
        void requestOrders(nextFilters, undefined, `已切换到第 ${nextPage} 页`);
    }
    function createExportTask() {
        setNotice(`导出任务已创建，范围为第 ${filters.pageNum} 页、${data?.pagination.total ?? 0} 条订单`);
    }
    const requestPreview = data?.requestBody ?? createHotelPackageOrderRequestBody(filters);
    const hasNextPage = Boolean(data && filters.pageNum * filters.pageSize < data.pagination.total);
    return (_jsxs("div", { className: "presale-order-page hotel-package-order-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u9152\u5E97\u5957\u9910\u8BA2\u5355" }), _jsx("div", { hidden: true, "data-testid": "hotel-package-order-service-contract", "data-provider": data?.provider ?? 'mock', "data-trace-id": data?.traceId ?? '' }), _jsx("pre", { hidden: true, "data-testid": "hotel-package-order-request-body", children: JSON.stringify(requestPreview, null, 2) }), _jsxs("section", { className: "presale-order-query", "aria-label": "\u9152\u5E97\u5957\u9910\u8BA2\u5355\u7B5B\u9009", children: [_jsxs("div", { className: "presale-order-query__grid", children: [_jsx(FilterSelect, { filterKey: "orderState", label: "\u8BA2\u5355\u72B6\u6001", placeholder: "\u5168\u90E8", value: filters.orderState, options: optionsByFilter.orderState, isOpen: openFilter === 'orderState', onToggle: () => setOpenFilter(openFilter === 'orderState' ? null : 'orderState'), onSelect: (option) => chooseFilter('orderState', option) }), _jsx(FilterSelect, { filterKey: "source", label: "\u8BA2\u5355\u6765\u6E90", placeholder: "\u8BF7\u9009\u62E9\u8BA2\u5355\u6765\u6E90", value: filters.source, options: optionsByFilter.source, isOpen: openFilter === 'source', onToggle: () => setOpenFilter(openFilter === 'source' ? null : 'source'), onSelect: (option) => chooseFilter('source', option) }), _jsxs("div", { className: "presale-order-field presale-order-date", role: "group", "aria-label": "\u4E0B\u5355\u65F6\u95F4", children: [_jsx("span", { children: "\u4E0B\u5355\u65F6\u95F4" }), _jsxs("div", { className: "presale-order-date__range", children: [_jsx("input", { "aria-label": "\u4E0B\u5355\u5F00\u59CB\u65E5\u671F", type: "date", value: filters.startDate, onChange: (event) => updateFilter({ startDate: event.target.value, pageNum: 1 }) }), _jsx("em", { children: "\u2192" }), _jsx("input", { "aria-label": "\u4E0B\u5355\u7ED3\u675F\u65E5\u671F", type: "date", value: filters.endDate, onChange: (event) => updateFilter({ endDate: event.target.value, pageNum: 1 }) })] })] }), _jsxs("label", { className: "presale-order-field presale-order-keyword", children: [_jsx("span", { children: "\u641C\u7D22" }), _jsx("input", { value: filters.keyword, placeholder: "\u8BF7\u8F93\u5165\u8BA2\u5355\u7F16\u53F7/\u4E70\u5BB6\u8054\u7CFB\u65B9\u5F0F", onChange: (event) => updateFilter({ keyword: event.target.value, pageNum: 1 }), onKeyDown: (event) => {
                                            if (event.key === 'Enter')
                                                submitSearch();
                                        } })] }), _jsx(FilterSelect, { filterKey: "afterSale", label: "\u552E\u540E\u72B6\u6001", placeholder: "\u8BF7\u9009\u62E9\u552E\u540E\u72B6\u6001", value: filters.afterSale, options: optionsByFilter.afterSale, isOpen: openFilter === 'afterSale', onToggle: () => setOpenFilter(openFilter === 'afterSale' ? null : 'afterSale'), onSelect: (option) => chooseFilter('afterSale', option) })] }), _jsxs("div", { className: "presale-order-actions", children: [_jsx("button", { type: "button", onClick: resetFilters, disabled: loading, children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", onClick: () => void requestOrders(filters, undefined, '刷新'), disabled: loading, children: "\u5237 \u65B0" }), _jsx("button", { type: "button", className: "is-primary", onClick: submitSearch, disabled: loading, children: loading ? '加载中' : '搜 索' })] })] }), _jsx("div", { className: "presale-order-export", children: _jsx("button", { type: "button", onClick: createExportTask, disabled: loading, children: "\u5BFC\u51FA\u660E\u7EC6" }) }), notice ? (_jsx("div", { className: "presale-order-notice", role: "status", "aria-label": "\u9152\u5E97\u5957\u9910\u8BA2\u5355\u64CD\u4F5C\u53CD\u9988", children: notice })) : null, error ? (_jsx("div", { className: "presale-order-alert", role: "alert", children: error })) : null, _jsxs("section", { className: "presale-order-table", "aria-label": "\u9152\u5E97\u5957\u9910\u8BA2\u5355\u8868\u683C", children: [_jsx("div", { className: "presale-order-table__head", children: tableColumns.map((column) => (_jsx("div", { children: column }, column))) }), data?.rows.length ? (_jsx("div", { className: "presale-order-table__body", children: data.rows.map((row) => (_jsx(OrderRow, { row: row, onDetail: () => setSelectedRow(row) }, row.id))) })) : loading ? (_jsx("div", { className: "presale-order-loading", role: "status", "aria-label": "\u9152\u5E97\u5957\u9910\u8BA2\u5355\u52A0\u8F7D\u4E2D", children: _jsx("strong", { children: "\u6570\u636E\u52A0\u8F7D\u4E2D" }) })) : (_jsxs("div", { className: "presale-order-empty", role: "status", "aria-label": "\u9152\u5E97\u5957\u9910\u8BA2\u5355\u7A7A\u6001", children: [_jsx("span", { className: "presale-order-empty__icon", "aria-hidden": "true" }), _jsx("strong", { children: error ? '加载失败' : '暂无数据' }), _jsx("small", { children: error ? '请点击刷新重试' : '当前条件下暂无符合条件的订单' })] }))] }), _jsx("footer", { className: "presale-order-footer", "aria-label": "\u9152\u5E97\u5957\u9910\u8BA2\u5355\u5206\u9875", children: _jsxs("div", { className: "presale-order-pagination", children: [_jsx("button", { type: "button", disabled: loading || filters.pageNum <= 1, onClick: () => changePage(-1), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { children: ["\u7B2C ", filters.pageNum, " \u9875"] }), _jsx("button", { type: "button", disabled: loading || !hasNextPage, onClick: () => changePage(1), children: "\u4E0B\u4E00\u9875" }), _jsxs("span", { children: ["\u5171 ", data?.pagination.total ?? 0, " \u6761"] })] }) }), selectedRow ? _jsx(OrderDetailDialog, { row: selectedRow, onClose: () => setSelectedRow(null) }) : null] }));
}
function OrderRow({ row, onDetail }) {
    return (_jsxs("div", { className: "presale-order-row", role: "row", children: [_jsxs("div", { children: [_jsx("strong", { children: row.productName }), _jsx("span", { children: row.sourceName })] }), _jsx("div", { children: row.quantity }), _jsx("div", { children: row.unitPrice }), _jsx("div", { children: row.schedulePriceDiff }), _jsx("div", { children: row.paidAmount }), _jsx("div", { children: row.contact }), _jsx("div", { children: row.orderState }), _jsx("div", { children: row.afterSaleState }), _jsx("div", { children: _jsx("button", { type: "button", onClick: onDetail, children: "\u8BA2\u5355\u8BE6\u60C5" }) })] }));
}
function OrderDetailDialog({ row, onClose }) {
    return (_jsx("div", { className: "presale-order-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "presale-order-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u9152\u5E97\u5957\u9910\u8BA2\u5355\u8BE6\u60C5", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u9152\u5E97\u5957\u9910\u8BA2\u5355\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u8BA2\u5355\u7F16\u53F7" }), _jsx("dd", { children: row.id })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5546\u54C1" }), _jsx("dd", { children: row.productName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8054\u7CFB\u53F7\u7801" }), _jsx("dd", { children: row.contact })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4E0B\u5355\u65F6\u95F4" }), _jsx("dd", { children: row.bookedAt })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5B9E\u4ED8\u91D1\u989D" }), _jsx("dd", { children: row.paidAmount })] })] })] }) }));
}
function FilterSelect({ filterKey, label, placeholder, value, options, isOpen, onToggle, onSelect, }) {
    const selected = options.find((option) => option.value === value);
    const displayValue = selected?.label ?? placeholder;
    return (_jsxs("label", { className: "presale-order-field", children: [_jsx("span", { children: label }), _jsxs("div", { className: "presale-order-select-wrap", children: [_jsx("button", { type: "button", className: "presale-order-select", "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-label": `${label} ${displayValue}`, "data-filter": filterKey, onClick: onToggle, children: displayValue }), isOpen ? (_jsx("div", { className: "presale-order-options", role: "listbox", "aria-label": `${label}閫夐」`, children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": value === option.value, onClick: () => onSelect(option), children: option.label }, `${filterKey}-${option.value}`))) })) : null] })] }));
}
function labelForFilter(key) {
    const labels = {
        orderState: '订单状态',
        source: '订单来源',
        afterSale: '售后状态',
    };
    return labels[key];
}
