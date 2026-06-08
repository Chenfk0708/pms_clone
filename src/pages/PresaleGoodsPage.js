import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PresaleGoodsServiceError, defaultPresaleGoodsFilters, loadPresaleGoodsData, } from '../services/presaleGoods';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './PresaleGoodsPage.css';
const filterMeta = [
    { key: 'channelId', label: '渠道', placeholder: '请选择渠道', optionKey: 'channels' },
    { key: 'ticketType', label: '卡券类型', placeholder: '全部', optionKey: 'ticketTypes' },
    { key: 'categoryId', label: '商品类目', placeholder: '请选择商品类目', optionKey: 'categories' },
    { key: 'shelfStatus', label: '上架状态', placeholder: '全部', optionKey: 'shelfStatuses' },
];
const topChannelOptions = [
    { value: '', label: '请选择渠道' },
    { value: '5', label: '携程' },
    { value: '1003', label: '美团酒店' },
    { value: '8', label: '飞猪淘酒店' },
    { value: '3', label: '美团民宿' },
    { value: '2', label: '途家' },
    { value: '21', label: '木鸟' },
    { value: '4', label: '小猪' },
    { value: '17', label: '路客云聚合' },
];
const topShelfStatusOptions = [
    { value: '', label: '全部' },
    { value: 'listed', label: '已上架' },
    { value: 'unlisted', label: '已下架' },
];
const tableColumns = [
    '全部展开',
    '商品名称',
    '商品类目',
    '商品类型',
    '关联渠道',
    '库存',
    '售价（元）',
    '原价（元）',
    '创建时间',
    '更新时间',
    '操作',
];
const editStoreOptions = [
    { value: '', label: '全部' },
    { value: '1796425098638573570', label: '天洛会宿公寓(前海壹方城宝安中心店)' },
];
const editCategoryOptions = [
    { value: '14', label: '房券' },
    { value: '16', label: '餐饮券' },
    { value: '17', label: '套餐' },
    { value: '19', label: '酒店套餐' },
];
const editBookingOptions = [
    { value: 'none', label: '无需预约' },
    { value: '1day', label: '提前1天预约' },
    { value: '2day', label: '提前2天预约' },
];
const goodsTypeOptions = [
    { value: 'virtual', label: '虚拟商品', description: '虚拟商品(无需物流)' },
    { value: 'physical', label: '实物商品', description: '实物商品(物流发货)' },
    { value: 'ecard', label: '电子卡券', description: '电子卡券(无需物流)' },
];
const ticketModeOptions = [
    { value: 'normal', label: '普通卡券' },
    { value: 'calendar', label: '日历卡券' },
];
const validityOptions = [
    { value: 'longTerm', label: '长期有效' },
    { value: 'dated', label: '有效期内可用' },
];
const refundOptions = [
    { value: 'supported', label: '支持退款申请' },
    { value: 'unsupported', label: '不支持退款申请' },
];
const inventoryDeductionOptions = [
    { value: 'placeOrder', label: '拍下减库存' },
    { value: 'pay', label: '付款减库存' },
];
const saleModeOptions = [
    { value: 'immediate', label: '立即开售' },
    { value: 'warehouse', label: '放入仓库' },
];
const maxUploadCount = 15;
export function PresaleGoodsPage() {
    const location = useLocation();
    const isEdit = location.pathname.endsWith('/edit');
    return isEdit ? _jsx(PresaleGoodsEditPage, {}) : _jsx(PresaleGoodsListPage, {});
}
function PresaleGoodsListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const scenario = readScenario(location.search);
    const [openFilter, setOpenFilter] = useState(null);
    const [filters, setFilters] = useState(defaultPresaleGoodsFilters);
    const [draftKeyword, setDraftKeyword] = useState('');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [notice, setNotice] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [detailRow, setDetailRow] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    useEffect(() => {
        let ignore = false;
        loadPresaleGoodsData(filters, scenario)
            .then((nextData) => {
            if (ignore)
                return;
            setData(nextData);
        })
            .catch((loadError) => {
            if (ignore)
                return;
            setData(null);
            setError(loadError instanceof PresaleGoodsServiceError ? loadError.message : String(loadError));
        })
            .finally(() => {
            if (!ignore)
                setIsLoading(false);
        });
        return () => {
            ignore = true;
        };
    }, [filters, scenario, reloadKey]);
    const selectedStore = data?.options.stores.find((store) => store.value === filters.poiId);
    const defaultStore = data?.options.stores.find((store) => store.value) ?? data?.options.stores[0];
    const currentStoreLabel = selectedStore?.label ?? defaultStore?.label ?? '加载门店中';
    const realStoreOptions = data?.options.stores ?? [];
    const canSwitchStore = realStoreOptions.length > 1;
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: [{ id: 'all', label: '全部门店' }, ...(data?.options.stores ?? []).map((store) => ({
                id: store.value,
                label: store.label,
            }))],
    });
    const statusTabs = data?.options.shelfStatuses ?? topShelfStatusOptions;
    const rows = data?.rows ?? [];
    function resolveFilterOptions(filter) {
        if (filter.key === 'channelId')
            return topChannelOptions;
        if (filter.key === 'shelfStatus')
            return topShelfStatusOptions;
        return data?.options[filter.optionKey] ?? [];
    }
    function chooseFilter(value) {
        if (!openFilter || openFilter === 'store')
            return;
        setIsLoading(true);
        setError('');
        setFilters((current) => ({ ...current, [openFilter]: value, page: 1 }));
        setOpenFilter(null);
    }
    function chooseStore(value) {
        setIsLoading(true);
        setError('');
        setFilters((current) => ({ ...current, poiId: value, page: 1 }));
        setOpenFilter(null);
        setNotice(value ? '已切换到当前门店' : '已切换到全部门店');
    }
    function applySearch() {
        setOpenFilter(null);
        setIsLoading(true);
        setError('');
        setNotice('已按当前条件更新预售券列表');
        setFilters((current) => ({ ...current, keyword: draftKeyword, page: 1 }));
    }
    function resetFilters() {
        setIsLoading(true);
        setError('');
        setFilters(defaultPresaleGoodsFilters);
        setDraftKeyword('');
        setExpanded(false);
        setOpenFilter(null);
        setNotice('筛选条件已重置');
    }
    function refreshData() {
        setIsLoading(true);
        setError('');
        setNotice('数据刷新中');
        setReloadKey((key) => key + 1);
    }
    function exportRows() {
        setNotice('已生成预售券导出任务');
    }
    function toggleAllRows() {
        const nextExpanded = !expanded;
        setExpanded(nextExpanded);
        setNotice(nextExpanded ? `已展开 ${rows.length} 个预售券规格` : '已收起全部预售券规格');
    }
    function toggleShelf(row) {
        setNotice(row.status === 'warehouse' ? `${row.name} 已上架` : `${row.name} 已下架`);
    }
    return (_jsxs("div", { className: "presale-goods-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u9884\u552E\u5238" }), _jsxs("section", { className: "presale-goods-query", "aria-label": "\u9884\u552E\u5238\u5546\u54C1\u7B5B\u9009", children: [_jsx(StoreSelectControl, { className: "presale-goods-storebar", label: "\u95E8\u5E97\u5207\u6362", options: storeOptions.map((option) => ({ id: option.id, name: option.label })), value: filters.poiId || 'all', disabled: storeLoading, onChange: (storeId) => chooseStore(storeId === 'all' ? '' : storeId), settingsLabel: "\u95E8\u5E97\u8BBE\u7F6E", onSettingsClick: () => navigate('/InformationMaintenance/campInfo') }), _jsxs("div", { className: "presale-goods-query__grid", children: [filterMeta.map((filter) => (_jsx(FilterSelect, { filter: filter, options: resolveFilterOptions(filter), value: filters[filter.key], isOpen: openFilter === filter.key, onToggle: () => setOpenFilter(openFilter === filter.key ? null : filter.key), onChoose: (nextValue) => chooseFilter(nextValue) }, filter.key))), _jsxs("label", { className: "presale-goods-field presale-goods-keyword", children: [_jsx("span", { children: "\u641C\u7D22" }), _jsx("input", { value: draftKeyword, placeholder: "\u8BF7\u8F93\u5165\u5546\u54C1\u7F16\u53F7/\u5546\u54C1\u540D\u79F0", onChange: (event) => setDraftKeyword(event.target.value) })] })] }), _jsxs("div", { className: "presale-goods-actions", children: [_jsx("button", { type: "button", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: applySearch, disabled: isLoading, children: "\u641C\u7D22" })] })] }), _jsxs("section", { className: "presale-goods-main", "aria-label": "\u9884\u552E\u5238\u5546\u54C1\u5217\u8868", children: [_jsxs("div", { className: "presale-goods-toolbar", children: [_jsx("div", { className: "presale-goods-tabs", role: "tablist", "aria-label": "\u4E0A\u67B6\u72B6\u6001", children: statusTabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": filters.shelfStatus === tab.value, className: filters.shelfStatus === tab.value ? 'is-active' : '', onClick: () => {
                                        setIsLoading(true);
                                        setError('');
                                        setFilters((current) => ({ ...current, shelfStatus: tab.value, page: 1 }));
                                    }, children: tab.label }, tab.value || 'all'))) }), _jsxs("div", { className: "presale-goods-toolbar__actions", children: [_jsx("button", { type: "button", onClick: () => navigate('/InformationMaintenance/campInfo'), children: "\u95E8\u5E97\u7BA1\u7406" }), _jsx("button", { type: "button", onClick: refreshData, disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: exportRows, disabled: isLoading || rows.length === 0, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => navigate('/mallManagement/goodsManagement/edit'), children: "\u65B0\u589E\u9884\u552E\u5238" }), _jsx("button", { type: "button", onClick: toggleAllRows, disabled: isLoading || rows.length === 0, children: "\u5168\u90E8\u5C55\u5F00" })] })] }), _jsxs("div", { className: "presale-goods-statebar", children: [isLoading ? _jsx("div", { className: "presale-goods-loading", role: "status", children: "\u6B63\u5728\u52A0\u8F7D\u9884\u552E\u5238\u5546\u54C1..." }) : null, notice ? (_jsx("div", { className: "presale-goods-notice", role: "status", children: notice })) : null, error ? (_jsxs("div", { className: "presale-goods-error", role: "alert", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                                            setIsLoading(true);
                                            setError('');
                                            setReloadKey((key) => key + 1);
                                        }, children: "\u91CD\u8BD5" })] })) : null] }), _jsxs("div", { className: "presale-goods-table", role: "table", "aria-label": "\u9884\u552E\u5238\u5546\u54C1\u8868\u683C", children: [_jsx("div", { className: "presale-goods-table__head", role: "row", children: tableColumns.map((column) => (_jsx("div", { role: "columnheader", children: column }, column))) }), !isLoading && !error && rows.length === 0 ? (_jsxs("div", { className: "presale-goods-empty", role: "status", "aria-label": "\u9884\u552E\u5238\u7A7A\u72B6\u6001", children: [_jsx("span", { className: "presale-goods-empty__icon", "aria-hidden": "true" }), _jsx("strong", { children: "\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u9884\u552E\u5238" })] })) : null, !isLoading && !error
                                ? rows.map((row) => (_jsx(PresaleGoodsTableRow, { row: row, expanded: expanded, onDetail: () => setDetailRow(row), onToggleShelf: () => toggleShelf(row) }, row.id)))
                                : null] }), _jsxs("footer", { className: "presale-goods-footer", children: [_jsxs("span", { children: ["\u5171 ", data?.pagination.total ?? 0, " \u6761"] }), _jsxs("span", { children: ["\u7B2C ", data?.pagination.page ?? 1, " / ", Math.max(1, Math.ceil((data?.pagination.total ?? 0) / (data?.pagination.pageSize ?? 20))), " \u9875"] }), _jsxs("span", { children: ["Trace ", data?.traceId ?? '--'] })] })] }), _jsx("output", { "data-testid": "presale-goods-request", className: "presale-goods-request-audit", "aria-hidden": "true", children: data?.requestEcho ?? '' }), detailRow ? _jsx(PresaleGoodsDetailDialog, { row: detailRow, onClose: () => setDetailRow(null) }) : null] }));
}
function PresaleGoodsTableRow({ row, expanded, onDetail, onToggleShelf, }) {
    return (_jsxs("div", { className: `presale-goods-row-wrap${expanded ? ' is-expanded' : ''}`, children: [_jsxs("div", { className: "presale-goods-row", role: "row", children: [_jsx("div", { role: "cell", children: expanded ? '已展开' : '可展开' }), _jsxs("div", { role: "cell", children: [_jsx("strong", { children: row.name }), _jsx("span", { children: row.statusLabel })] }), _jsx("div", { role: "cell", children: row.categoryName }), _jsx("div", { role: "cell", children: row.ticketTypeLabel }), _jsx("div", { role: "cell", children: row.channels }), _jsx("div", { role: "cell", children: row.stockLabel }), _jsx("div", { role: "cell", children: row.sellingPrice }), _jsx("div", { role: "cell", children: row.originalPrice }), _jsx("div", { role: "cell", children: row.createdAt }), _jsx("div", { role: "cell", children: row.updatedAt }), _jsxs("div", { role: "cell", className: "presale-goods-row-actions", children: [_jsx("button", { type: "button", onClick: onDetail, "aria-label": `查看 ${row.name}`, children: "\u67E5\u770B" }), _jsx("button", { type: "button", onClick: onToggleShelf, children: row.status === 'warehouse' ? '上架' : '下架' })] })] }), expanded ? (_jsx("div", { className: "presale-goods-skus", "aria-label": `${row.name} 规格`, children: row.products.map((product) => (_jsxs("div", { children: [_jsx("span", { children: product.name }), _jsxs("span", { children: ["\u5E93\u5B58 ", product.stock] }), _jsx("span", { children: product.sellingPrice }), _jsx("span", { children: product.originalPrice })] }, product.id))) })) : null] }));
}
function PresaleGoodsDetailDialog({ row, onClose }) {
    return (_jsx("div", { className: "presale-goods-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "presale-goods-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u9884\u552E\u5238\u8BE6\u60C5", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: row.name }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: onClose, children: "x" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u5546\u54C1\u7C7B\u76EE" }), _jsx("dd", { children: row.categoryName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5361\u5238\u7C7B\u578B" }), _jsx("dd", { children: row.ticketTypeLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5173\u8054\u6E20\u9053" }), _jsx("dd", { children: row.channels })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u9000\u6539\u89C4\u5219" }), _jsx("dd", { children: row.refundRule })] })] }), _jsx("p", { children: row.description })] }) }));
}
function PresaleGoodsEditPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [openMenu, setOpenMenu] = useState(null);
    const [notice, setNotice] = useState('');
    const [goodsType, setGoodsType] = useState('virtual');
    const [goodsName, setGoodsName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [ticketMode, setTicketMode] = useState('normal');
    const [storeValue, setStoreValue] = useState('');
    const [specCount, setSpecCount] = useState(1);
    const [validityMode, setValidityMode] = useState('longTerm');
    const [bookingValue, setBookingValue] = useState('none');
    const [refundMode, setRefundMode] = useState('supported');
    const [usageNote, setUsageNote] = useState('');
    const [inventoryDeductionMode, setInventoryDeductionMode] = useState('placeOrder');
    const [saleMode, setSaleMode] = useState('immediate');
    const [introText, setIntroText] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const categoryLabel = editCategoryOptions.find((option) => option.value === categoryId)?.label ?? '请选择';
    const storeLabel = editStoreOptions.find((option) => option.value === storeValue)?.label ?? '全部';
    const bookingLabel = editBookingOptions.find((option) => option.value === bookingValue)?.label ?? '无需预约';
    const refundHelper = refundMode === 'supported'
        ? '卡券核销前可随时退，核销后不退不换。'
        : '商品售出后不支持退款，请在商品详情中明确说明。';
    function show(message) {
        setNotice(message);
    }
    function handleUpload(event) {
        const nextFiles = Array.from(event.target.files ?? []);
        if (nextFiles.length === 0)
            return;
        setUploadedFiles((current) => [...current, ...nextFiles].slice(0, maxUploadCount));
        show(`已添加 ${Math.min(maxUploadCount, uploadedFiles.length + nextFiles.length)} 张商品图片`);
        event.target.value = '';
    }
    return (_jsxs("div", { className: "presale-goods-edit-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u9884\u552E\u5238" }), _jsxs("div", { className: "presale-goods-edit-steps", "aria-label": "\u9884\u552E\u5238\u7F16\u8F91\u6B65\u9AA4", children: [_jsx("span", { className: step === 1 ? 'is-active' : '', children: "\u7F16\u8F91\u57FA\u7840\u4FE1\u606F" }), _jsx("span", { className: step === 2 ? 'is-active' : '', children: "\u7F16\u8F91\u4EA7\u54C1\u4ECB\u7ECD" })] }), notice ? _jsx("div", { className: "presale-goods-notice", role: "status", children: notice }) : null, step === 1 ? (_jsxs("section", { className: "presale-goods-edit-card", "aria-label": "\u7F16\u8F91\u57FA\u7840\u4FE1\u606F", children: [_jsxs("fieldset", { className: "presale-goods-type-options", children: [_jsx("legend", { children: "\u5546\u54C1\u7C7B\u578B" }), goodsTypeOptions.map((option) => (_jsxs("label", { className: `presale-goods-type-option${goodsType === option.value ? ' is-active' : ''}`, children: [_jsx("input", { type: "radio", name: "goodsType", checked: goodsType === option.value, onChange: () => {
                                            setGoodsType(option.value);
                                            show(`已选择${option.label}`);
                                        } }), _jsxs("span", { children: [_jsx("strong", { children: option.label }), _jsx("small", { children: option.description })] })] }, option.value)))] }), _jsxs(FormSection, { title: "\u57FA\u7840\u4FE1\u606F", children: [_jsxs("label", { children: [_jsx("span", { children: "\u5546\u54C1\u540D\u79F0" }), _jsx("input", { "aria-label": "\u5546\u54C1\u540D\u79F0", placeholder: "\u8BF7\u8F93\u5165", value: goodsName, onChange: (event) => setGoodsName(event.target.value) })] }), _jsx(EditSelect, { label: "\u5546\u54C1\u7C7B\u76EE", valueLabel: categoryLabel, options: editCategoryOptions, isOpen: openMenu === 'category', onToggle: () => setOpenMenu(openMenu === 'category' ? null : 'category'), onChoose: (value) => {
                                    setCategoryId(value);
                                    setOpenMenu(null);
                                    show(`已选择商品类目：${editCategoryOptions.find((option) => option.value === value)?.label ?? ''}`);
                                } }), _jsxs("div", { className: "presale-goods-upload", children: [_jsx("span", { children: "\u5546\u54C1\u56FE\u7247" }), _jsxs("div", { className: "presale-goods-upload-card", children: [_jsxs("label", { className: "presale-goods-upload-trigger", children: ["\u4E0A\u4F20", _jsx("input", { className: "presale-goods-upload-input", type: "file", accept: "image/*", multiple: true, onChange: handleUpload })] }), _jsxs("div", { className: "presale-goods-upload-meta", children: [_jsx("p", { children: "\u5EFA\u8BAE\u5C3A\u5BF8\uFF1A690*310\u50CF\u7D20\uFF0C\u4F60\u53EF\u4EE5\u62D6\u62FD\u56FE\u7247\u4E0A\u4F20\uFF0C\u6700\u591A\u4E0A\u4F2015\u5F20\u3002\u6700\u5C11\u4E00\u5F20" }), _jsxs("span", { children: ["\u5DF2\u4E0A\u4F20 ", uploadedFiles.length, " / ", maxUploadCount] })] }), uploadedFiles.length ? (_jsx("ul", { className: "presale-goods-upload-list", "aria-label": "\u5DF2\u4E0A\u4F20\u56FE\u7247", children: uploadedFiles.map((file) => (_jsx("li", { children: file.name }, `${file.name}-${file.lastModified}`))) })) : null] })] }), _jsx(SegmentedField, { label: "\u5361\u5238\u7C7B\u578B", value: ticketMode, options: ticketModeOptions, onChange: (value) => {
                                    setTicketMode(value);
                                    show(`已切换为${ticketModeOptions.find((option) => option.value === value)?.label ?? ''}`);
                                }, helper: "\u5361\u5238\u7C7B\u578B\u9996\u6B21\u4E0A\u67B6\u540E\u5C06\u65E0\u6CD5\u4FEE\u6539\uFF0C\u8BF7\u8C28\u614E\u9009\u62E9\u3002" }), _jsx(EditSelect, { label: "\u9002\u7528\u95E8\u5E97", valueLabel: storeLabel, options: editStoreOptions, isOpen: openMenu === 'store', onToggle: () => setOpenMenu(openMenu === 'store' ? null : 'store'), onChoose: (value) => {
                                    setStoreValue(value);
                                    setOpenMenu(null);
                                    show(`已切换适用门店：${editStoreOptions.find((option) => option.value === value)?.label ?? '全部'}`);
                                } })] }), _jsx(FormSection, { title: "\u89C4\u683C\u5E93\u5B58", actions: _jsx("button", { type: "button", onClick: () => {
                                setSpecCount((count) => count + 1);
                                show('已添加一个新规格');
                            }, children: "\u6DFB\u52A0\u89C4\u683C" }), children: _jsxs("div", { className: "presale-goods-edit-field", children: [_jsx("span", { className: "presale-goods-edit-field__label", children: "\u5546\u54C1\u89C4\u683C" }), _jsxs("div", { className: "presale-goods-edit-inline", children: [_jsx("strong", { children: "\u9ED8\u8BA4\u89C4\u683C" }), _jsxs("span", { children: ["\u5F53\u524D\u5DF2\u521B\u5EFA ", specCount, " \u4E2A\u89C4\u683C"] })] }), _jsx("p", { className: "presale-goods-edit-helper", children: "\u53EF\u7EE7\u7EED\u6DFB\u52A0\u591A\u89C4\u683C\u5546\u54C1\uFF0C\u5F53\u524D\u5148\u4FDD\u7559\u4E0E\u76EE\u6807\u9875\u4E00\u81F4\u7684\u57FA\u7840\u5E93\u5B58\u7ED3\u6784\u3002" })] }) }), _jsxs(FormSection, { title: "\u552E\u5356\u8BBE\u7F6E", children: [_jsx(SegmentedField, { label: "\u6709\u6548\u671F", value: validityMode, options: validityOptions, onChange: (value) => {
                                    setValidityMode(value);
                                    show(`已切换有效期：${validityOptions.find((option) => option.value === value)?.label ?? ''}`);
                                } }), _jsx(EditSelect, { label: "\u63D0\u524D\u9884\u8BA2", valueLabel: bookingLabel, options: editBookingOptions, isOpen: openMenu === 'booking', onToggle: () => setOpenMenu(openMenu === 'booking' ? null : 'booking'), onChoose: (value) => {
                                    setBookingValue(value);
                                    setOpenMenu(null);
                                    show(`已设置提前预订：${editBookingOptions.find((option) => option.value === value)?.label ?? ''}`);
                                } }), _jsx(SegmentedField, { label: "\u9000\u6539\u89C4\u5219", value: refundMode, options: refundOptions, onChange: (value) => {
                                    setRefundMode(value);
                                    show(`已设置退改规则：${refundOptions.find((option) => option.value === value)?.label ?? ''}`);
                                }, helper: refundHelper }), _jsxs("label", { children: [_jsx("span", { children: "\u4F7F\u7528\u8BF4\u660E" }), _jsx("textarea", { placeholder: "\u8BF7\u8F93\u5165\u5185\u5BB9", value: usageNote, onChange: (event) => setUsageNote(event.target.value) })] }), _jsxs("div", { className: "presale-goods-edit-field", children: [_jsx("span", { className: "presale-goods-edit-field__label", children: "\u4E70\u5BB6\u586B\u5199" }), _jsx("div", { className: "presale-goods-edit-inline", children: _jsx("button", { type: "button", onClick: () => show('已添加一项买家填写内容'), children: "\u6DFB\u52A0\u5185\u5BB9" }) }), _jsx("p", { className: "presale-goods-edit-helper", children: "\u4E70\u5BB6\u8D2D\u4E70\u5546\u54C1\u65F6\uFF0C\u6240\u9700\u8981\u586B\u5199\u7684\u4FE1\u606F/\u7559\u8A00\uFF08\u4E70\u5BB6\u5FC5\u586B\u624B\u673A\u53F7\u7801\uFF09" })] })] }), _jsxs(FormSection, { title: "\u5176\u4ED6\u8BBE\u7F6E", children: [_jsx(SegmentedField, { label: "\u5E93\u5B58\u6263\u51CF\u65B9\u5F0F", value: inventoryDeductionMode, options: inventoryDeductionOptions, onChange: (value) => {
                                    setInventoryDeductionMode(value);
                                    show(`已切换库存扣减方式：${inventoryDeductionOptions.find((option) => option.value === value)?.label ?? ''}`);
                                } }), _jsx(SegmentedField, { label: "\u5F00\u552E\u65F6\u95F4", value: saleMode, options: saleModeOptions, onChange: (value) => {
                                    setSaleMode(value);
                                    show(`已切换开售时间：${saleModeOptions.find((option) => option.value === value)?.label ?? ''}`);
                                } })] }), _jsxs("footer", { className: "presale-goods-edit-footer", children: [_jsx("button", { type: "button", onClick: () => navigate('/mallManagement/goodsManagement'), children: "\u8FD4\u56DE\u5217\u8868" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setStep(2), children: "\u4E0B\u4E00\u6B65" })] })] })) : (_jsxs("section", { className: "presale-goods-edit-card", "aria-label": "\u7F16\u8F91\u4EA7\u54C1\u4ECB\u7ECD", children: [_jsxs(FormSection, { title: "\u4EA7\u54C1\u4ECB\u7ECD", children: [_jsxs("div", { className: "presale-goods-edit-field", children: [_jsx("span", { className: "presale-goods-edit-field__label", children: "\u7F16\u8F91\u5DE5\u5177" }), _jsxs("div", { className: "presale-goods-intro-tools", children: [_jsx("button", { type: "button", onClick: () => show('已添加图片模块'), children: "\u6DFB\u52A0\u56FE\u7247" }), _jsx("button", { type: "button", onClick: () => show('已添加文本模块'), children: "\u6DFB\u52A0\u6587\u672C" })] }), _jsx("p", { className: "presale-goods-edit-helper", children: "\u53EF\u7EC4\u5408\u6587\u672C\u548C\u56FE\u7247\u8BF4\u660E\u5546\u54C1\u4F7F\u7528\u65B9\u5F0F\u3001\u5151\u6362\u89C4\u5219\u548C\u6CE8\u610F\u4E8B\u9879\u3002" })] }), _jsxs("label", { children: [_jsx("span", { children: "\u8BE6\u60C5\u5185\u5BB9" }), _jsx("textarea", { placeholder: "\u8BF7\u8F93\u5165\u5185\u5BB9", value: introText, onChange: (event) => setIntroText(event.target.value) })] })] }), _jsxs("footer", { className: "presale-goods-edit-footer", children: [_jsx("button", { type: "button", onClick: () => navigate('/mallManagement/goodsManagement'), children: "\u8FD4\u56DE\u5217\u8868" }), _jsx("button", { type: "button", onClick: () => setStep(1), children: "\u4E0A\u4E00\u6B65" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => show('预售券已发布'), children: "\u53D1 \u5E03" })] })] }))] }));
}
function FormSection({ title, actions, children }) {
    return (_jsxs("section", { className: "presale-goods-form-section", children: [_jsxs("div", { className: "presale-goods-form-section__header", children: [_jsx("h2", { children: title }), actions] }), _jsx("div", { className: "presale-goods-form-grid", children: children })] }));
}
function EditSelect({ label, valueLabel, options, isOpen, onToggle, onChoose, }) {
    return (_jsxs("div", { className: "presale-goods-edit-field", children: [_jsx("span", { className: "presale-goods-edit-field__label", children: label }), _jsxs("div", { className: "presale-goods-select-wrap", children: [_jsx("button", { type: "button", className: "presale-goods-select", "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-label": `${label} ${valueLabel}`, onClick: onToggle, children: valueLabel }), isOpen ? (_jsx("div", { className: "presale-goods-options presale-goods-options--edit", role: "listbox", "aria-label": `${label}选项`, children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": valueLabel === option.label, onClick: () => onChoose(option.value), children: option.label }, option.value || option.label))) })) : null] })] }));
}
function SegmentedField({ label, value, options, onChange, helper, }) {
    return (_jsxs("div", { className: "presale-goods-edit-field presale-goods-edit-segmented", children: [_jsx("span", { className: "presale-goods-edit-field__label", children: label }), _jsx("div", { className: "presale-goods-segmented", role: "radiogroup", "aria-label": label, children: options.map((option) => (_jsx("button", { type: "button", className: option.value === value ? 'is-active' : '', "aria-pressed": option.value === value, onClick: () => onChange(option.value), children: option.label }, option.value))) }), helper ? _jsx("p", { className: "presale-goods-edit-helper", children: helper }) : null] }));
}
function FilterSelect({ filter, options, value, isOpen, onToggle, onChoose, }) {
    const displayValue = useMemo(() => {
        const option = options.find((item) => item.value === value);
        return option?.label || filter.placeholder;
    }, [filter.placeholder, options, value]);
    return (_jsxs("label", { className: "presale-goods-field presale-goods-field--select", children: [_jsx("span", { children: filter.label }), _jsxs("div", { className: "presale-goods-select-wrap", children: [_jsx("button", { type: "button", className: `presale-goods-select${filter.key === 'channelId' ? ' is-search' : ''}${filter.key === 'shelfStatus' ? ' is-status' : ''}`, "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-label": `${filter.label} ${displayValue}`, onClick: onToggle, children: displayValue }), isOpen ? (_jsx("div", { className: "presale-goods-options", role: "listbox", "aria-label": `${filter.label}选项`, children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": value === option.value, onClick: () => onChoose(option.value), children: option.label }, option.value || option.label))) })) : null] })] }));
}
function readScenario(search) {
    const value = new URLSearchParams(search).get('scenario');
    return value === 'empty' || value === 'error' ? value : 'success';
}
