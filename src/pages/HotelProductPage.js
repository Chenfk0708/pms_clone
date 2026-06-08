import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadHotelProductData, } from '../services/hotelProduct';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './HotelProductPage.css';
const filters = [
    { key: 'roomType', label: '关联房型：', placeholder: '请选择' },
    { key: 'channel', label: '渠道：', placeholder: '请选择渠道' },
];
const tableColumns = ['', '商品标题', '关联房型', '关联渠道', '库存', '售价(元)', '加价(元)', '创建时间', '更新时间', '操作'];
const editTabs = ['商品信息', '套餐设置', '售卖规则'];
const fallbackRoomTypes = [
    { id: 'room-mock-1', name: '顶层套房(浴缸巨幕电竞麻将)' },
    { id: 'room-mock-2', name: '总裁套间(桑拿浴缸露台电竞麻将)' },
    { id: 'room-mock-3', name: '天洛大床电竞套间' },
    { id: 'room-mock-4', name: '观影大床房' },
];
const fallbackChannels = [
    { id: '4', name: '携程' },
    { id: '5', name: '美团酒店' },
    { id: '6', name: '飞猪淘酒店' },
    { id: '7', name: '美团民宿' },
    { id: '2', name: '途家' },
    { id: '8', name: '木鸟' },
    { id: '9', name: '小猪' },
    { id: '10', name: '路客云聚合' },
];
const productOverrideMap = {
    'hotel-product-001': {
        title: '电竞欢聚双晚套餐',
        roomCategoryName: '顶层套房(浴缸巨幕电竞麻将)',
        channelName: '携程',
        reservationNote: '适用于周日至周四入住，节假日需提前确认库存。',
    },
    'hotel-product-002': {
        title: '影音大床工作日套餐',
        roomCategoryName: '观影大床房',
        channelName: '美团酒店',
        reservationNote: '可预约未来30天房量，需在入住前1天确认。',
    },
    'hotel-product-003': {
        title: '总裁套间周末升级套餐',
        roomCategoryName: '总裁套间(桑拿浴缸露台电竞麻将)',
        channelName: '途家',
        reservationNote: '周末库存紧张时需要人工确认后生效。',
    },
};
export function HotelProductPage() {
    const location = useLocation();
    const isEdit = location.pathname.endsWith('/edit');
    return isEdit ? _jsx(HotelProductEditPage, {}) : _jsx(HotelProductListPage, {});
}
function HotelProductListPage() {
    const navigate = useNavigate();
    const [openFilter, setOpenFilter] = useState(null);
    const [values, setValues] = useState({ roomType: '', channel: '' });
    const [selectedStoreId, setSelectedStoreId] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [reloadSeq, setReloadSeq] = useState(0);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [operationProduct, setOperationProduct] = useState(null);
    const [isStrategyOpen, setIsStrategyOpen] = useState(false);
    const { storeOptions, storeLoading } = useStoreOptions();
    const query = useMemo(() => ({
        keyword: submittedKeyword,
        roomCategoryId: values.roomType,
        channelId: values.channel,
        page: 1,
        pageSize: 20,
    }), [submittedKeyword, values]);
    const fetchData = useCallback(async (signal) => {
        setIsLoading(true);
        setError('');
        try {
            const result = await loadHotelProductData(query, signal);
            setData(result);
        }
        catch (loadError) {
            if (loadError instanceof DOMException && loadError.name === 'AbortError')
                return;
            setError(loadError instanceof Error ? loadError.message : '酒店套餐数据加载失败，请稍后重试');
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => {
            if (!controller.signal.aborted) {
                void fetchData(controller.signal);
            }
        });
        return () => controller.abort();
    }, [fetchData, reloadSeq]);
    const roomOptions = useMemo(() => normalizeOptions(data?.roomTypes, fallbackRoomTypes), [data?.roomTypes]);
    const channelOptions = useMemo(() => normalizeOptions(data?.channels, fallbackChannels), [data?.channels]);
    const products = useMemo(() => (data?.list ?? []).map(normalizeProduct), [data?.list]);
    function chooseFilter(value) {
        if (!openFilter)
            return;
        setValues((current) => ({ ...current, [openFilter]: value }));
        setOpenFilter(null);
    }
    function resetFilters() {
        setValues({ roomType: '', channel: '' });
        setKeyword('');
        setSubmittedKeyword('');
        setSelectedStoreId('all');
        setOpenFilter(null);
    }
    function refreshData() {
        setReloadSeq((current) => current + 1);
    }
    function searchData() {
        setSubmittedKeyword(keyword);
        setOpenFilter(null);
    }
    return (_jsxs("div", { className: "hotel-product-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u9152\u5E97\u5957\u9910" }), _jsxs("section", { className: "hotel-product-query", "aria-label": "\u9152\u5E97\u5957\u9910\u7B5B\u9009", children: [_jsx(StoreSelectControl, { className: "hotel-product-storebar", label: "\u95E8\u5E97\u5207\u6362", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: selectedStoreId, disabled: storeLoading, onChange: (storeId) => {
                            setSelectedStoreId(storeId);
                            refreshData();
                        }, settingsLabel: "\u95E8\u5E97\u8BBE\u7F6E", onSettingsClick: () => navigate('/InformationMaintenance/campInfo') }), _jsxs("div", { className: "hotel-product-query__grid", children: [_jsxs("label", { className: "hotel-product-field hotel-product-keyword", children: [_jsx("span", { children: "\u641C\u7D22\uFF1A" }), _jsx("input", { value: keyword, placeholder: "\u8BF7\u8F93\u5165\u5957\u9910\u540D\u79F0", onChange: (event) => setKeyword(event.target.value) })] }), filters.map((filter) => (_jsx(FilterSelect, { filter: filter, options: filter.key === 'roomType' ? roomOptions : channelOptions, value: values[filter.key], isOpen: openFilter === filter.key, onToggle: () => setOpenFilter(openFilter === filter.key ? null : filter.key), onChoose: (nextValue) => chooseFilter(nextValue) }, filter.key))), _jsxs("div", { className: "hotel-product-actions", children: [_jsx("button", { type: "button", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: searchData, disabled: isLoading, children: "\u641C\u7D22" })] })] })] }), _jsxs("section", { className: "hotel-product-main", "aria-label": "\u9152\u5E97\u5957\u9910\u5217\u8868", children: [_jsxs("div", { className: "hotel-product-toolbar", children: [_jsx("button", { type: "button", onClick: () => refreshData(), disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", disabled: isLoading || !products.length, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", onClick: () => navigate('/setting/roomTypeInfo'), children: "\u623F\u578B\u7BA1\u7406" }), _jsx("button", { type: "button", onClick: () => setIsStrategyOpen(true), children: "\u63A5\u5355\u7B56\u7565" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => navigate('/mallManagement/hotelProduct/edit'), children: "\u521B\u5EFA\u9152\u5E97\u5957\u9910" })] }), error ? (_jsxs("div", { className: "hotel-product-alert", role: "alert", "aria-label": "\u9152\u5E97\u5957\u9910\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u9152\u5E97\u5957\u9910\u6570\u636E\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => refreshData(), children: "\u91CD\u8BD5" })] })) : null, _jsxs("div", { className: "hotel-product-table", role: "table", "aria-label": "\u9152\u5E97\u5957\u9910\u5217\u8868", children: [_jsx("div", { className: "hotel-product-table__head", role: "row", children: tableColumns.map((column, index) => (_jsx("div", { role: "columnheader", children: column }, `${column}-${index}`))) }), isLoading ? (_jsx("div", { className: "hotel-product-empty", role: "status", "aria-label": "\u9152\u5E97\u5957\u9910\u52A0\u8F7D\u4E2D", children: _jsx("div", { children: "\u6570\u636E\u52A0\u8F7D\u4E2D" }) })) : products.length ? (products.map((item, index) => (_jsxs("div", { className: "hotel-product-table__row", role: "row", children: [_jsx("div", { role: "cell", children: index + 1 }), _jsx("div", { role: "cell", children: item.title }), _jsx("div", { role: "cell", children: item.roomCategoryName }), _jsx("div", { role: "cell", children: item.channelName }), _jsx("div", { role: "cell", children: item.stock }), _jsx("div", { role: "cell", children: item.salePrice }), _jsx("div", { role: "cell", children: item.extraPrice }), _jsx("div", { role: "cell", children: item.createdAt }), _jsx("div", { role: "cell", children: item.updatedAt }), _jsxs("div", { role: "cell", className: "hotel-product-row-actions", children: [_jsx("button", { type: "button", onClick: () => setSelectedProduct(item), children: "\u67E5\u770B\u8BE6\u60C5" }), _jsx("button", { type: "button", onClick: () => setOperationProduct(item), children: "\u66F4\u591A" })] })] }, item.id)))) : (_jsx("div", { className: "hotel-product-empty", role: "status", "aria-label": "\u9152\u5E97\u5957\u9910\u7A7A\u6001", children: _jsxs("div", { role: "cell", "aria-colspan": tableColumns.length, children: [_jsx("span", { className: "hotel-product-empty__icon", "aria-hidden": "true" }), _jsx("strong", { children: "\u6682\u65E0\u7B26\u5408\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u7684\u9152\u5E97\u5957\u9910" })] }) }))] })] }), selectedProduct ? _jsx(ProductDetailDialog, { product: selectedProduct, onClose: () => setSelectedProduct(null) }) : null, operationProduct ? (_jsx(ProductOperationDialog, { product: operationProduct, onClose: () => setOperationProduct(null), onConfirm: () => setOperationProduct(null) })) : null, isStrategyOpen ? _jsx(StrategyDialog, { onCancel: () => setIsStrategyOpen(false), onConfirm: () => setIsStrategyOpen(false) }) : null] }));
}
function HotelProductEditPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('商品信息');
    const [title, setTitle] = useState('');
    const [reservationPhone, setReservationPhone] = useState('');
    const [reservationNote, setReservationNote] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
    const [packageRows, setPackageRows] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    return (_jsxs("div", { className: "hotel-product-edit-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u521B\u5EFA\u9152\u5E97\u5957\u9910" }), _jsxs("div", { className: "hotel-product-breadcrumb", children: [_jsx("button", { type: "button", className: "hotel-product-breadcrumb__link", onClick: () => navigate('/mallManagement/hotelProduct'), children: "\u9152\u5E97\u5957\u9910" }), _jsx("span", { children: "/" }), _jsx("span", { children: "\u521B\u5EFA\u9152\u5E97\u5957\u9910" })] }), _jsx("div", { className: "hotel-product-edit-tabs", role: "tablist", "aria-label": "\u9152\u5E97\u5957\u9910\u7F16\u8F91\u6B65\u9AA4", children: editTabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab, className: activeTab === tab ? 'is-active' : '', onClick: () => setActiveTab(tab), children: tab }, tab))) }), _jsxs("section", { className: "hotel-product-edit-card", children: [activeTab === '商品信息' ? (_jsx(ProductInfoForm, { title: title, reservationPhone: reservationPhone, reservationNote: reservationNote, selectedRoom: selectedRoom, uploadedImages: uploadedImages, onTitleChange: setTitle, onPhoneChange: setReservationPhone, onNoteChange: setReservationNote, onUpload: () => setUploadedImages((current) => (current.length ? current : ['酒店套餐主图.jpg'])), onSelectRoom: () => setIsRoomDialogOpen(true) })) : null, activeTab === '套餐设置' ? (_jsx(PackageSettingForm, { rows: packageRows, onAdd: () => setPackageRows((current) => [...current, { date: '2026-05-18 至 2026-05-19', stock: 10, price: 699 }]) })) : null, activeTab === '售卖规则' ? _jsx(SaleRuleForm, {}) : null, _jsxs("footer", { className: "hotel-product-edit-footer", children: [_jsx("button", { type: "button", onClick: () => navigate('/mallManagement/hotelProduct'), children: "\u8FD4\u56DE\u5217\u8868" }), activeTab === '商品信息' ? (_jsx("button", { type: "button", className: "is-primary", onClick: () => setActiveTab('套餐设置'), children: "\u4E0B\u4E00\u6B65" })) : (_jsx("button", { type: "button", className: "is-primary", onClick: () => navigate('/mallManagement/hotelProduct'), children: "\u4FDD \u5B58" }))] })] }), isRoomDialogOpen ? (_jsx(RoomSelectDialog, { onClose: () => setIsRoomDialogOpen(false), onConfirm: (roomName) => {
                    setSelectedRoom(roomName);
                    setIsRoomDialogOpen(false);
                } })) : null] }));
}
function ProductInfoForm({ title, reservationPhone, reservationNote, selectedRoom, uploadedImages, onTitleChange, onPhoneChange, onNoteChange, onUpload, onSelectRoom, }) {
    return (_jsxs(_Fragment, { children: [_jsxs(FormSection, { title: "\u57FA\u672C\u4FE1\u606F", children: [_jsxs("label", { className: "hotel-product-form-row", children: [_jsx("span", { children: "* \u5546\u54C1\u6807\u9898\uFF1A" }), _jsxs("div", { className: "hotel-product-field-box hotel-product-field-box--inline", children: [_jsx("input", { value: title, placeholder: "\u8BF7\u8F93\u5165\u5546\u54C1\u6807\u9898", maxLength: 50, onChange: (event) => onTitleChange(event.target.value) }), _jsxs("em", { className: "hotel-product-counter", children: [title.length, " / 50"] }), _jsx("small", { className: "hotel-product-inline-hint", children: "\u540D\u79F0\u4E0D\u53EF\u5305\u542B\u95E8\u5E97\u540D\u79F0" })] })] }), _jsxs("div", { className: "hotel-product-form-row hotel-product-form-row--stack", children: [_jsx("span", { children: "* \u5546\u54C1\u56FE\u7247\uFF1A" }), _jsxs("div", { className: "hotel-product-upload-card", children: [_jsxs("button", { type: "button", className: "hotel-product-upload-tile", onClick: onUpload, children: [_jsx("strong", { children: "+" }), _jsx("span", { children: "\u4E0A\u4F20" })] }), _jsx("p", { children: "\u5EFA\u8BAE\u5C3A\u5BF8\uFF1A1200*1200\u50CF\u7D20\uFF0C\u6BD4\u4F8B1:1\uFF0C\u53EF\u4E0A\u4F201-9\u5F20\uFF0C\u9ED8\u8BA4\u7B2C1\u5F20\u4E3A\u4E3B\u56FE\u3002" }), uploadedImages.length ? (_jsx("ul", { className: "hotel-product-upload-list", children: uploadedImages.map((item) => (_jsx("li", { children: item }, item))) })) : null] })] }), _jsxs("div", { className: "hotel-product-form-row hotel-product-form-row--stack", children: [_jsx("span", { children: "\u5173\u8054\u623F\u578B\uFF1A" }), _jsxs("div", { className: "hotel-product-room-group", children: [_jsxs("div", { className: "hotel-product-room-platform", children: [_jsx("strong", { children: "\u54C1\u724C\u5C0F\u7A0B\u5E8F" }), _jsx("button", { type: "button", className: "hotel-product-room-pick", onClick: onSelectRoom, children: "+ \u9009\u62E9\u623F\u578B" }), selectedRoom ? _jsx("p", { children: selectedRoom }) : null] }), _jsxs("div", { className: "hotel-product-room-platform", children: [_jsx("strong", { children: "\u89C6\u9891\u53F7" }), _jsx("button", { type: "button", className: "hotel-product-room-pick", onClick: onSelectRoom, children: "+ \u9009\u62E9\u623F\u578B" })] }), _jsx("p", { className: "hotel-product-room-hint", children: "\u2460 \u53EF\u9009\u62E9\u623F\u578B\u4F5C\u4E3A\u53EF\u9884\u8BA2\u89C4\u683C\uFF1B\u2461 \u540C\u6B65\u4E0A\u4F20\u9002\u7528\u95E8\u5E97\u4FE1\u606F" })] })] })] }), _jsxs(FormSection, { title: "\u9884\u5B9A\u4FE1\u606F", children: [_jsxs("label", { className: "hotel-product-form-row", children: [_jsx("span", { children: "* \u9884\u5B9A\u7535\u8BDD\uFF1A" }), _jsxs("div", { className: "hotel-product-field-box", children: [_jsx("input", { value: reservationPhone, placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7\u6216\u5EA7\u673A\u53F7\u7801\uFF08\u5982\uFF1A010-12345678\uFF09", maxLength: 20, onChange: (event) => onPhoneChange(event.target.value) }), _jsxs("em", { className: "hotel-product-counter", children: [reservationPhone.length, " / 20"] })] })] }), _jsxs("label", { className: "hotel-product-form-row hotel-product-form-row--stack", children: [_jsx("span", { children: "\u9884\u5B9A\u8BF4\u660E\uFF1A" }), _jsxs("div", { className: "hotel-product-field-box hotel-product-field-box--textarea", children: [_jsx("textarea", { value: reservationNote, placeholder: "\u8BF7\u8F93\u5165\u9884\u5B9A\u8BF4\u660E", maxLength: 100, onChange: (event) => onNoteChange(event.target.value) }), _jsxs("em", { className: "hotel-product-counter", children: [reservationNote.length, " / 100"] })] })] })] })] }));
}
function PackageSettingForm({ rows, onAdd, }) {
    return (_jsxs(FormSection, { title: "\u5957\u9910\u8BBE\u7F6E", children: [_jsx("div", { className: "hotel-product-package-toolbar", children: _jsx("button", { type: "button", onClick: onAdd, children: "\u6DFB\u52A0\u5957\u9910" }) }), _jsxs("div", { className: "hotel-product-package-table", role: "table", "aria-label": "\u5957\u9910\u8BBE\u7F6E\u8868\u683C", children: [_jsxs("div", { role: "row", children: [_jsx("div", { role: "columnheader", children: "\u65E5\u671F" }), _jsx("div", { role: "columnheader", children: "\u5E93\u5B58" }), _jsx("div", { role: "columnheader", children: "\u52A0\u4EF7\u91D1\u989D" }), _jsx("div", { role: "columnheader", children: "\u64CD\u4F5C" })] }), rows.length ? (rows.map((row) => (_jsxs("div", { role: "row", children: [_jsx("div", { role: "cell", children: row.date }), _jsx("div", { role: "cell", children: row.stock }), _jsx("div", { role: "cell", children: row.price }), _jsx("div", { role: "cell", children: "\u53EF\u552E" })] }, row.date)))) : (_jsx("div", { role: "row", children: _jsx("div", { role: "cell", children: "\u6682\u65E0\u5957\u9910\u5E93\u5B58" }) }))] })] }));
}
function SaleRuleForm() {
    return (_jsxs(_Fragment, { children: [_jsx(FormSection, { title: "\u9884\u7EA6\u89C4\u5219", children: _jsxs("label", { className: "hotel-product-form-row hotel-product-form-row--stack", children: [_jsx("span", { children: "\u9884\u7EA6\u8BF4\u660E\uFF1A" }), _jsx("div", { className: "hotel-product-field-box hotel-product-field-box--textarea", children: _jsx("textarea", { placeholder: "\u8BF7\u8F93\u5165\u9884\u7EA6\u89C4\u5219" }) })] }) }), _jsx(FormSection, { title: "\u9000\u6539\u89C4\u5219", children: _jsxs("label", { className: "hotel-product-form-row hotel-product-form-row--stack", children: [_jsx("span", { children: "\u9000\u6539\u8BF4\u660E\uFF1A" }), _jsx("div", { className: "hotel-product-field-box hotel-product-field-box--textarea", children: _jsx("textarea", { placeholder: "\u8BF7\u8F93\u5165\u9000\u6539\u89C4\u5219" }) })] }) })] }));
}
function FormSection({ title, children }) {
    return (_jsxs("section", { className: "hotel-product-form-section", children: [_jsx("h2", { children: title }), _jsx("div", { className: "hotel-product-form-grid", children: children })] }));
}
function FilterSelect({ filter, options, value, isOpen, onToggle, onChoose, }) {
    const displayValue = options.find((option) => option.id === value)?.name || filter.placeholder;
    return (_jsxs("label", { className: "hotel-product-field hotel-product-field--select", children: [_jsx("span", { children: filter.label }), _jsxs("div", { className: "hotel-product-select-wrap", children: [_jsx("button", { type: "button", className: "hotel-product-select", "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-label": `${filter.label} ${displayValue}`, onClick: onToggle, children: displayValue }), isOpen ? (_jsx("div", { className: "hotel-product-options", role: "listbox", "aria-label": `${filter.label}选项`, children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": value === option.id, onClick: () => onChoose(option.id), children: option.name }, option.id))) })) : null] })] }));
}
function ProductDetailDialog({ product, onClose }) {
    return (_jsx("div", { className: "hotel-product-modal-backdrop", children: _jsxs("div", { className: "hotel-product-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u9152\u5E97\u5957\u9910\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("h2", { children: product.title }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: onClose, children: "x" })] }), _jsxs("div", { className: "hotel-product-detail", children: [_jsxs("p", { children: [_jsx("strong", { children: "\u5173\u8054\u623F\u578B" }), _jsx("span", { children: product.roomCategoryName })] }), _jsxs("p", { children: [_jsx("strong", { children: "\u5173\u8054\u6E20\u9053" }), _jsx("span", { children: product.channelName })] }), _jsxs("p", { children: [_jsx("strong", { children: "\u9884\u5B9A\u7535\u8BDD" }), _jsx("span", { children: product.reservationPhone })] }), _jsxs("p", { children: [_jsx("strong", { children: "\u9884\u5B9A\u8BF4\u660E" }), _jsx("span", { children: product.reservationNote })] })] }), _jsx("footer", { children: _jsx("button", { type: "button", className: "is-primary", onClick: onClose, children: "\u5173\u95ED" }) })] }) }));
}
function ProductOperationDialog({ product, onClose, onConfirm, }) {
    return (_jsx("div", { className: "hotel-product-modal-backdrop", children: _jsxs("div", { className: "hotel-product-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u9152\u5E97\u5957\u9910\u64CD\u4F5C", children: [_jsxs("header", { children: [_jsx("h2", { children: product.title }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: onClose, children: "x" })] }), _jsx("div", { className: "hotel-product-strategy-body", children: _jsx("p", { children: "\u5E93\u5B58\u6821\u9A8C\u5C06\u68C0\u67E5\u5F53\u524D\u5957\u9910\u5728\u5173\u8054\u6E20\u9053\u548C\u623F\u578B\u4E2D\u7684\u53EF\u552E\u5E93\u5B58\u3002" }) }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: onConfirm, children: "\u6267\u884C\u6821\u9A8C" })] })] }) }));
}
function StrategyDialog({ onCancel, onConfirm }) {
    return (_jsx("div", { className: "hotel-product-modal-backdrop", children: _jsxs("div", { className: "hotel-product-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "hotel-product-strategy-title", children: [_jsxs("header", { children: [_jsx("h2", { id: "hotel-product-strategy-title", children: "\u9152\u5E97\u5957\u9910\u63A5\u5355\u7B56\u7565" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: onCancel, children: "x" })] }), _jsxs("div", { className: "hotel-product-strategy-body", children: [_jsxs("div", { className: "hotel-product-strategy-row", children: [_jsx("strong", { children: "\u89C6\u9891\u53F7" }), _jsx("span", { children: "\u624B\u52A8\u63A5\u5355" }), _jsx("span", { children: "\u81EA\u52A8\u63A5\u5355\u5E93\u5B58\u4E0D\u8DB3\u65F6\uFF0C\u9700\u624B\u52A8\u63A5\u5355" })] }), _jsxs("div", { className: "hotel-product-strategy-row", children: [_jsx("strong", { children: "\u54C1\u724C\u5C0F\u7A0B\u5E8F" }), _jsx("span", { children: "\u81EA\u52A8\u63A5\u5355" })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onCancel, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: onConfirm, children: "\u786E \u5B9A" })] })] }) }));
}
function RoomSelectDialog({ onClose, onConfirm }) {
    const selected = fallbackRoomTypes[0];
    return (_jsx("div", { className: "hotel-product-modal-backdrop", children: _jsxs("div", { className: "hotel-product-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u9009\u62E9\u623F\u578B", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u9009\u62E9\u623F\u578B" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: onClose, children: "x" })] }), _jsx("div", { className: "hotel-product-room-options", children: fallbackRoomTypes.map((room) => (_jsx("button", { type: "button", className: room.id === selected.id ? 'is-active' : '', children: room.name }, room.id))) }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => onConfirm(selected.name), children: "\u786E\u8BA4\u9009\u62E9" })] })] }) }));
}
function normalizeOptions(source, fallback) {
    if (!source?.length)
        return fallback;
    return source.map((option) => {
        const fallbackMatch = fallback.find((item) => item.id === option.id);
        return fallbackMatch ?? option;
    });
}
function normalizeProduct(product) {
    const override = productOverrideMap[product.id];
    return override ? { ...product, ...override } : product;
}
