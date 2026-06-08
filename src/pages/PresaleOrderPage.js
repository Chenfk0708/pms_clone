import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import { createPresaleOrderRequestBody, loadPresaleOrderData, } from '../services/presaleOrder';
import './PresaleOrderPage.css';
const defaultFilters = {
    orderState: '0',
    productType: '',
    source: '',
    category: '',
    payment: '',
    afterSale: '',
    keyword: '',
    startDate: '',
    endDate: '',
    pageNum: 1,
    pageSize: 20,
};
const orderStateOptions = [
    { value: '0', label: '全部' },
    { value: '1', label: '待支付' },
    { value: '3', label: '已发货' },
    { value: '4', label: '已完成' },
    { value: '5', label: '已取消' },
];
const productTypeOptions = [
    { value: '1', label: '虚拟商品' },
    { value: '2', label: '实物商品' },
    { value: '3', label: '电子卡券' },
];
const sourceFallbackOptions = [
    { value: '33', label: '抖音小程序' },
    { value: '34', label: '微信小程序' },
    { value: '35', label: '百度小程序' },
    { value: '36', label: '小红书' },
];
const afterSaleOptions = [
    { value: '1', label: '申请退款中' },
    { value: '2', label: '部分退款' },
    { value: '3', label: '已退款' },
];
const tableColumns = [
    '商品',
    '商品类型(商品类目)',
    '单价(元)/数量',
    '商品总价(元)',
    '实付金额(元)',
    '买家/联系人',
    '订单状态',
    '售后状态',
    '操作',
];
const quickLinks = [
    { label: '预售券商品', path: '/mallManagement/goodsManagement' },
    { label: '卡券核销', path: '/mallManagement/verificationManagement' },
    { label: '销售统计', path: '/statistics/presale' },
];
export function PresaleOrderPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState(() => readInitialFilters());
    const [openFilter, setOpenFilter] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [serviceContract, setServiceContract] = useState({
        provider: '',
        responseState: '',
        traceId: '',
    });
    const initialFiltersRef = useRef(filters);
    const { storeOptions, storeLoading } = useStoreOptions();
    const optionsByFilter = useMemo(() => ({
        orderState: orderStateOptions,
        productType: productTypeOptions,
        source: data?.options.sources.length ? data.options.sources : sourceFallbackOptions,
        category: data?.options.categories ?? [],
        payment: data?.options.payments ?? [],
        afterSale: afterSaleOptions,
    }), [data]);
    useEffect(() => {
        const controller = new AbortController();
        void requestOrders(initialFiltersRef.current, controller.signal, '首屏加载');
        return () => controller.abort();
    }, []);
    async function requestOrders(nextFilters, signal, reason = '查询') {
        setLoading(true);
        setError('');
        setNotice(reason === '首屏加载' ? '' : `${reason}中`);
        try {
            const result = await loadPresaleOrderData(nextFilters, signal);
            if (result.ok) {
                setData(result.data);
                setServiceContract({
                    provider: result.data.providerName,
                    responseState: result.data.responseState,
                    traceId: result.data.traceId,
                });
                setNotice(reason === '首屏加载' ? '' : `${reason}完成：展示 ${result.data.rows.length} 条订单`);
            }
            else {
                setServiceContract({
                    provider: result.providerName,
                    responseState: 'error',
                    traceId: result.traceId,
                });
                setError(`预售券订单加载失败：${toBusinessMessage(result.message)}`);
                setNotice('请调整筛选条件或刷新后重试');
            }
        }
        finally {
            setLoading(false);
        }
    }
    function updateFilter(partial) {
        setFilters((current) => ({ ...current, ...partial }));
    }
    function chooseFilter(key, option) {
        updateFilter({ [key]: option.value });
        setOpenFilter(null);
        setNotice(`${labelForFilter(key)}已选择：${option.label}`);
    }
    function resetFilters() {
        const nextFilters = { ...defaultFilters, campId: filters.campId, poiIds: filters.poiIds };
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
        void requestOrders(nextFilters, undefined, `分页到第 ${nextPage} 页`);
    }
    function handleExport() {
        setNotice('导出任务已创建，可在消息中心查看进度');
    }
    function switchStore(storeId) {
        const nextFilters = {
            ...filters,
            poiIds: storeId === 'all' ? [] : [storeId],
            pageNum: 1,
        };
        setFilters(nextFilters);
        setOpenFilter(null);
        void requestOrders(nextFilters, undefined, '闂ㄥ簵鍒囨崲');
    }
    function handleQuickLink(path, label) {
        setNotice(`正在前往${label}`);
        navigate(path);
    }
    const requestPreview = createPresaleOrderRequestBody(filters, data?.campId ?? filters.campId ?? '待获取');
    return (_jsxs("div", { className: "presale-order-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u9884\u552E\u5238\u8BA2\u5355" }), _jsx("div", { hidden: true, "data-testid": "presale-order-service-contract", "data-provider": serviceContract.provider, "data-response-state": serviceContract.responseState, "data-trace-id": serviceContract.traceId, "data-request-body": JSON.stringify(requestPreview) }), _jsxs("section", { className: "presale-order-query", "aria-label": "\u9884\u552E\u5238\u8BA2\u5355\u7B5B\u9009", children: [_jsxs("div", { className: "presale-order-query__grid", children: [_jsxs("div", { className: "presale-order-field presale-order-store-field", children: [_jsx("span", { children: "\u95C2\u3125\u7C35" }), _jsx(StoreSelectControl, { className: "presale-order-store", label: "\u95C2\u3125\u7C35\u947C\u51A8\u6D3F", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: filters.poiIds?.[0] ?? 'all', disabled: storeLoading || loading, onChange: (storeId) => switchStore(storeId) })] }), _jsx(FilterSelect, { filterKey: "orderState", label: "\u8BA2\u5355\u72B6\u6001", placeholder: "\u5168\u90E8", value: filters.orderState, options: orderStateOptions, isOpen: openFilter === 'orderState', onToggle: () => setOpenFilter(openFilter === 'orderState' ? null : 'orderState'), onSelect: (option) => chooseFilter('orderState', option) }), _jsx(FilterSelect, { filterKey: "productType", label: "\u5546\u54C1\u7C7B\u578B", placeholder: "\u8BF7\u9009\u62E9\u5546\u54C1\u7C7B\u578B", value: filters.productType, options: productTypeOptions, isOpen: openFilter === 'productType', onToggle: () => setOpenFilter(openFilter === 'productType' ? null : 'productType'), onSelect: (option) => chooseFilter('productType', option) }), _jsx(FilterSelect, { filterKey: "source", label: "\u8BA2\u5355\u6765\u6E90", placeholder: "\u8BF7\u9009\u62E9\u8BA2\u5355\u6765\u6E90", value: filters.source, options: optionsByFilter.source, isOpen: openFilter === 'source', onToggle: () => setOpenFilter(openFilter === 'source' ? null : 'source'), onSelect: (option) => chooseFilter('source', option) }), _jsx(FilterSelect, { filterKey: "category", label: "\u5546\u54C1\u7C7B\u76EE", placeholder: "\u8BF7\u9009\u62E9\u5546\u54C1\u7C7B\u76EE", value: filters.category, options: optionsByFilter.category, isOpen: openFilter === 'category', onToggle: () => setOpenFilter(openFilter === 'category' ? null : 'category'), onSelect: (option) => chooseFilter('category', option) }), _jsx(FilterSelect, { filterKey: "payment", label: "\u652F\u4ED8\u65B9\u5F0F", placeholder: "\u8BF7\u9009\u62E9\u652F\u4ED8\u65B9\u5F0F", value: filters.payment, options: optionsByFilter.payment, isOpen: openFilter === 'payment', onToggle: () => setOpenFilter(openFilter === 'payment' ? null : 'payment'), onSelect: (option) => chooseFilter('payment', option) }), _jsxs("div", { className: "presale-order-field presale-order-date", role: "group", "aria-label": "\u4E0B\u5355\u65F6\u95F4", children: [_jsx("span", { children: "\u4E0B\u5355\u65F6\u95F4" }), _jsxs("div", { className: "presale-order-date__range", children: [_jsx("input", { "aria-label": "\u4E0B\u5355\u5F00\u59CB\u65E5\u671F", type: "date", value: filters.startDate, onChange: (event) => updateFilter({ startDate: event.target.value }) }), _jsx("em", { children: "\u2192" }), _jsx("input", { "aria-label": "\u4E0B\u5355\u7ED3\u675F\u65E5\u671F", type: "date", value: filters.endDate, onChange: (event) => updateFilter({ endDate: event.target.value }) })] })] }), _jsxs("label", { className: "presale-order-field presale-order-keyword", children: [_jsx("span", { children: "\u641C\u7D22" }), _jsx("input", { value: filters.keyword, placeholder: "\u8BF7\u8F93\u5165\u8BA2\u5355\u7F16\u53F7/\u4E70\u5BB6\u8054\u7CFB\u65B9\u5F0F", onChange: (event) => updateFilter({ keyword: event.target.value }), onKeyDown: (event) => {
                                            if (event.key === 'Enter')
                                                submitSearch();
                                        } })] }), _jsx(FilterSelect, { filterKey: "afterSale", label: "\u552E\u540E\u72B6\u6001", placeholder: "\u8BF7\u9009\u62E9\u552E\u540E\u72B6\u6001", value: filters.afterSale, options: afterSaleOptions, isOpen: openFilter === 'afterSale', onToggle: () => setOpenFilter(openFilter === 'afterSale' ? null : 'afterSale'), onSelect: (option) => chooseFilter('afterSale', option), emptyText: "\u93C6\u509B\u68E4\u9359\uE21E\u20AC\u5910\u300D" })] }), _jsxs("div", { className: "presale-order-actions", children: [_jsx("button", { type: "button", onClick: resetFilters, disabled: loading, children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", onClick: () => void requestOrders(filters, undefined, '刷新'), disabled: loading, children: "\u5237 \u65B0" }), _jsx("button", { type: "button", className: "is-primary", onClick: submitSearch, disabled: loading, children: loading ? '加载中' : '搜 索' })] })] }), _jsx("section", { className: "presale-order-summary", "aria-label": "\u9884\u552E\u5238\u8BA2\u5355\u6307\u6807", children: (data?.metrics ?? []).map((metric) => (_jsxs("button", { type: "button", onClick: () => setNotice(`${metric.label}已选中`), children: [_jsx("span", { children: metric.label }), _jsx("strong", { children: metric.value }), _jsx("em", { children: metric.hint })] }, metric.label))) }), error || notice ? (_jsx("section", { className: "presale-order-source", "aria-label": "\u9884\u552E\u5238\u6570\u636E\u52A0\u8F7D", children: _jsxs("div", { children: [_jsx("strong", { children: loading ? '订单加载中' : error ? '加载失败' : '订单数据' }), _jsx("span", { role: error ? 'alert' : 'status', "aria-label": "\u9884\u552E\u5238\u8BA2\u5355\u64CD\u4F5C\u53CD\u9988", children: error || notice })] }) })) : null, _jsxs("div", { className: "presale-order-toolbar", "aria-label": "\u9884\u552E\u5238\u8BA2\u5355\u5FEB\u6377\u64CD\u4F5C", children: [_jsx("button", { type: "button", onClick: handleExport, children: "\u5BFC\u51FA\u660E\u7EC6" }), quickLinks.map((link) => (_jsx("button", { type: "button", onClick: () => handleQuickLink(link.path, link.label), children: link.label }, link.path)))] }), _jsxs("section", { className: "presale-order-table", "aria-label": "\u9884\u552E\u5238\u8BA2\u5355\u8868\u683C", children: [_jsx("div", { className: "presale-order-table__head", children: tableColumns.map((column) => (_jsx("div", { children: column }, column))) }), data?.rows.length ? (_jsx("div", { className: "presale-order-table__body", children: data.rows.map((row) => (_jsx(OrderRow, { row: row, onDetail: () => setSelectedOrder(row) }, row.id))) })) : (_jsxs("div", { className: "presale-order-empty", role: "status", "aria-label": "\u9884\u552E\u5238\u8BA2\u5355\u7A7A\u6001", children: [_jsx("span", { className: "presale-order-empty__icon", "aria-hidden": "true" }), _jsx("strong", { children: error ? '暂无符合条件的订单' : '暂无数据' }), error ? _jsx("small", { children: "\u8BF7\u5237\u65B0\u91CD\u8BD5\uFF0C\u6216\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u540E\u91CD\u65B0\u641C\u7D22\u3002" }) : null] }))] }), _jsx("footer", { className: "presale-order-footer", "aria-label": "\u9884\u552E\u5238\u8BA2\u5355\u5206\u9875", children: _jsxs("div", { className: "presale-order-pagination", children: [_jsx("button", { type: "button", disabled: loading || filters.pageNum <= 1, onClick: () => changePage(-1), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { children: ["\u7B2C ", filters.pageNum, " \u9875"] }), _jsx("button", { type: "button", disabled: loading || !data?.hasNextPage, onClick: () => changePage(1), children: "\u4E0B\u4E00\u9875" }), _jsxs("span", { children: ["\u5171 ", data?.total ?? 0, " \u6761"] })] }) }), selectedOrder ? (_jsx(OrderDetailDialog, { order: selectedOrder, onClose: () => setSelectedOrder(null) })) : null] }));
}
function OrderRow({ row, onDetail }) {
    return (_jsxs("div", { className: "presale-order-row", role: "row", children: [_jsxs("div", { children: [_jsx("strong", { children: row.productName }), _jsx("span", { children: row.productSubName })] }), _jsxs("div", { children: [row.productType, _jsx("span", { children: row.categoryName })] }), _jsxs("div", { children: [row.unitPrice, _jsxs("span", { children: ["\u6570\u91CF ", row.quantity] })] }), _jsx("div", { children: row.totalAmount }), _jsx("div", { children: row.paidAmount }), _jsxs("div", { children: [row.buyer, _jsx("span", { children: row.contact })] }), _jsx("div", { children: row.orderState }), _jsx("div", { children: row.afterSaleState }), _jsx("div", { children: _jsx("button", { type: "button", onClick: onDetail, children: "\u8BA2\u5355\u8BE6\u60C5" }) })] }));
}
function OrderDetailDialog({ order, onClose }) {
    return (_jsx("div", { className: "presale-order-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "presale-order-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u9884\u552E\u5238\u8BA2\u5355\u8BE6\u60C5", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u9884\u552E\u5238\u8BA2\u5355\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5\u5F39\u7A97", onClick: onClose, children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u8BA2\u5355\u7F16\u53F7" }), _jsx("dd", { children: order.id })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5546\u54C1" }), _jsx("dd", { children: order.productName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4E70\u5BB6" }), _jsxs("dd", { children: [order.buyer, " ", order.contact] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6765\u6E90" }), _jsx("dd", { children: order.sourceName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5B9E\u4ED8\u91D1\u989D" }), _jsxs("dd", { children: [order.paidAmount, " \u5143"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4E0B\u5355\u65F6\u95F4" }), _jsx("dd", { children: order.createdAt })] })] }), _jsx("footer", { children: _jsx("button", { type: "button", onClick: onClose, children: "\u5173\u95ED\u8BE6\u60C5" }) })] }) }));
}
function FilterSelect({ filterKey, label, placeholder, value, options, isOpen, onToggle, onSelect, emptyText = '鏆傛棤鍙€夐」', }) {
    const selected = options.find((option) => option.value === value);
    const displayValue = selected?.label ?? placeholder;
    return (_jsxs("label", { className: "presale-order-field", children: [_jsx("span", { children: label }), _jsxs("div", { className: "presale-order-select-wrap", children: [_jsx("button", { type: "button", className: "presale-order-select", "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-label": `${label} ${displayValue}`, "data-filter": filterKey, onClick: onToggle, children: displayValue }), isOpen ? (_jsx("div", { className: "presale-order-options", role: "listbox", "aria-label": `${label}閫夐」`, children: options.length ? (options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": value === option.value, onClick: () => onSelect(option), children: option.label }, `${filterKey}-${option.value}`)))) : (_jsx("span", { className: "presale-order-options__empty", children: emptyText })) })) : null] })] }));
}
function labelForFilter(key) {
    const labels = {
        orderState: '订单状态',
        productType: '商品类型',
        source: '订单来源',
        category: '商品类目',
        payment: '支付方式',
        afterSale: '售后状态',
    };
    return labels[key];
}
function toBusinessMessage(message) {
    return message
        .replace(/https?:\/\/\S+/g, '')
        .replace(/mock|provider|traceId|后端|接口未完成|阻塞|未接入/gi, '')
        .replace(/\s+/g, ' ')
        .trim() || '请稍后重试';
}
function readInitialFilters() {
    const params = new URLSearchParams(window.location.search);
    return {
        ...defaultFilters,
        campId: params.get('campId') ?? undefined,
        keyword: params.get('keyword') ?? '',
        pageNum: Number(params.get('pageNum') ?? '1') || 1,
    };
}
