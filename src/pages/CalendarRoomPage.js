import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchCalendarRoomProducts, } from '../services/calendarRoom';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './CalendarRoomPage.css';
const DEFAULT_QUERY = {
    storeId: 'all',
    keyword: '',
    channel: '',
    status: '全部',
    page: 1,
    pageSize: 20,
};
const EDIT_CHANNEL_TABS = ['微信小程序', '小红书', '抖音来客', '自助机', '同程民宿', '途家民宿', '美团民宿', '小猪民宿', '木鸟民宿', '路客云聚合'];
const DISABLED_EDIT_CHANNELS = new Set(['同程民宿', '途家民宿', '美团民宿', '小猪民宿', '木鸟民宿', '路客云聚合']);
const CHANNEL_ROOM_EMPTY_CHANNELS = new Set(['小红书', '抖音来客', '自助机']);
const MINI_PROGRAM_CHANNELS = new Set(['微信小程序', '小红书']);
const KIOSK_CHANNELS = new Set(['自助机']);
const CHANNEL_ROOM_GROUPS = [
    { id: 'all', name: '总裁套间（桑拿浴缸露台电竞麻将）' },
    { id: 'king', name: '天荟大床电竞套间' },
    { id: 'cinema', name: '观影大床房' },
];
export function CalendarRoomPage() {
    const location = useLocation();
    if (location.pathname.endsWith('/channelGoodsSetting')) {
        return _jsx(CalendarRoomEditPage, {});
    }
    return _jsx(CalendarRoomListPage, {});
}
function CalendarRoomListPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const locationQuery = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const provider = params.get('calendarRoomProvider');
        const mockState = params.get('calendarRoomMockState');
        return {
            provider: provider === 'real' || provider === 'mock' ? provider : undefined,
            mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
        };
    }, [location.search]);
    const [openFilter, setOpenFilter] = useState(null);
    const [query, setQuery] = useState({ ...DEFAULT_QUERY, ...locationQuery });
    const [selectedStoreId, setSelectedStoreId] = useState('all');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [viewModel, setViewModel] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [notice, setNotice] = useState('');
    const [dialog, setDialog] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        fetchCalendarRoomProducts({ ...query, ...locationQuery }, controller.signal)
            .then((result) => {
            setViewModel(result);
            setNotice((current) => current || '');
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            setErrorMessage(error instanceof Error ? error.message.replace(/。real provider.*$/, '') : '日历房数据加载失败，请稍后重试');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setIsLoading(false);
        });
        return () => controller.abort();
    }, [query, locationQuery]);
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: (viewModel?.storeOptions ?? [{ id: 'all', name: '全部门店' }]).map((store) => ({
            id: store.id,
            label: store.name,
        })),
    });
    function applyFilter(key, value) {
        setIsLoading(true);
        setErrorMessage('');
        setQuery((current) => ({ ...current, [key]: value, page: 1 }));
        setOpenFilter(null);
    }
    function applyStore(storeId) {
        setSelectedStoreId(storeId);
        setIsLoading(true);
        setErrorMessage('');
        setQuery((current) => ({ ...current, storeId, page: 1 }));
        setOpenFilter(null);
    }
    function submitSearch() {
        setIsLoading(true);
        setErrorMessage('');
        setQuery((current) => ({ ...current, keyword: draftKeyword, page: 1 }));
        setNotice('已查询日历房售卖产品');
    }
    function resetFilters() {
        setDraftKeyword('');
        setIsLoading(true);
        setErrorMessage('');
        setQuery({ ...DEFAULT_QUERY, ...locationQuery });
        setSelectedStoreId('all');
        setOpenFilter(null);
        setNotice('筛选条件已重置');
    }
    function retryLoad() {
        setIsLoading(true);
        setErrorMessage('');
        setQuery((current) => ({ ...current }));
    }
    function handleProductAction(action, product) {
        if (action === '预览') {
            setDialog({ type: 'detail', product });
            return;
        }
        if (action === '编辑') {
            const target = viewModel?.routeTargets.createProduct ?? '/setting/localRoomTypeProductionSetting/channelGoodsSetting';
            const params = new URLSearchParams({
                mode: 'edit',
                channel: product.channel,
                productName: product.name,
            });
            navigate(`${target}?${params.toString()}`);
            return;
        }
        if (action === '修改价格') {
            setDialog({ type: 'price', product });
            return;
        }
        setDialog({ type: 'status', product });
    }
    const rows = viewModel?.rows ?? [];
    return (_jsxs("div", { className: "calendar-room-page", "data-provider": viewModel?.providerMode ?? query.provider ?? 'mock', "data-request-keyword": viewModel?.requestParams.keyword ?? query.keyword, "data-request-channel": viewModel?.requestParams.channel ?? query.channel, "data-request-status": viewModel?.requestParams.status ?? query.status, children: [_jsx("h1", { className: "sr-only-heading", children: "\u65E5\u5386\u623F" }), _jsxs("section", { className: "calendar-room-query", "aria-label": "\u65E5\u5386\u623F\u7B5B\u9009", children: [_jsxs("div", { className: "calendar-room-query__top", children: [_jsx(StoreSelectControl, { className: "calendar-room-storebar", label: "\u95E8\u5E97\u5207\u6362", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: selectedStoreId, disabled: storeLoading, onChange: applyStore, settingsLabel: "\u95E8\u5E97\u8BBE\u7F6E", onSettingsClick: () => navigate('/InformationMaintenance/campInfo') }), _jsxs("div", { className: "calendar-room-query__actions", children: [_jsx("button", { type: "button", onClick: () => navigate(viewModel?.routeTargets.roomTypeList ?? '/setting/roomTypeInfo'), children: "\u623F\u578B\u7BA1\u7406" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => navigate(viewModel?.routeTargets.createProduct ?? '/setting/localRoomTypeProductionSetting/channelGoodsSetting'), children: "\u65B0\u589E\u552E\u5356\u4EA7\u54C1" })] })] }), _jsxs("div", { className: "calendar-room-query__filters", children: [_jsxs("label", { className: "calendar-room-field calendar-room-search", children: [_jsx("span", { children: "\u641C\u7D22\uFF1A" }), _jsx("input", { value: draftKeyword, placeholder: "\u8BF7\u8F93\u5165\u623F\u578B\u540D\u79F0", onChange: (event) => setDraftKeyword(event.target.value), onKeyDown: (event) => {
                                            if (event.key === 'Enter')
                                                submitSearch();
                                        } })] }), _jsx(FilterButton, { label: "\u6E20\u9053", value: query.channel, placeholder: "\u8BF7\u9009\u62E9\u6E20\u9053", options: viewModel?.channelOptions ?? [], isOpen: openFilter === 'channel', onToggle: () => setOpenFilter(openFilter === 'channel' ? null : 'channel'), onChoose: (value) => applyFilter('channel', value) }), _jsx(FilterButton, { label: "\u4E0A\u67B6\u72B6\u6001", value: query.status, placeholder: "\u5168\u90E8", options: viewModel?.statusOptions ?? [], isOpen: openFilter === 'status', onToggle: () => setOpenFilter(openFilter === 'status' ? null : 'status'), onChoose: (value) => applyFilter('status', value) }), _jsx("button", { type: "button", className: "calendar-room-expand-all", onClick: () => setIsExpanded((value) => !value), children: isExpanded ? '收起' : '展开' }), _jsx("button", { type: "button", className: "calendar-room-reset", onClick: resetFilters, children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", className: "calendar-room-search-button", onClick: submitSearch, disabled: isLoading, children: isLoading ? '查询中' : '搜 索' })] })] }), errorMessage ? (_jsxs("div", { className: "calendar-room-alert", role: "alert", "aria-label": "\u65E5\u5386\u623F\u6570\u636E\u9519\u8BEF", children: [_jsx("span", { children: "\u65E5\u5386\u623F\u6570\u636E\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("button", { type: "button", onClick: retryLoad, children: "\u91CD\u8BD5" })] })) : null, _jsxs("section", { className: `calendar-room-table${isLoading ? ' is-loading' : ''}`, "aria-label": "\u65E5\u5386\u623F\u552E\u5356\u4EA7\u54C1\u5217\u8868", children: [_jsx("div", { className: "calendar-room-table__head", children: ['展开', '房型名称', '关联渠道', '产品数量', '操作'].map((column) => (_jsx("div", { children: column }, column))) }), rows.length > 0 ? (rows.map((room) => (_jsx(RoomRow, { room: room, isExpanded: isExpanded, onToggle: () => setIsExpanded((value) => !value), onProductAction: handleProductAction, onNavigateRoomType: () => navigate(viewModel?.routeTargets.roomTypeEdit ?? '/setting/roomTypeInfo/edit'), onNavigatePrice: () => navigate(viewModel?.routeTargets.price ?? '/houseManage/houseCale') }, room.id)))) : (_jsxs("div", { className: "calendar-room-empty", role: "status", children: [_jsx("strong", { children: "\u6682\u65E0\u552E\u5356\u4EA7\u54C1" }), _jsx("span", { children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u65E5\u5386\u623F\u552E\u5356\u4EA7\u54C1\uFF0C\u8BF7\u8C03\u6574\u6761\u4EF6\u540E\u91CD\u65B0\u67E5\u8BE2\u3002" })] }))] }), _jsxs("div", { className: "calendar-room-pagination", "aria-label": "\u65E5\u5386\u623F\u5206\u9875", children: [_jsxs("span", { children: ["\u7B2C ", rows.length > 0 ? 1 : 0, "-", rows.length, " \u6761/\u603B\u5171 ", viewModel?.pagination.total ?? 0, " \u6761"] }), _jsx("button", { type: "button", className: "is-active", children: query.page }), _jsxs("button", { type: "button", children: [query.pageSize, " \u6761/\u9875"] })] }), notice ? _jsx("div", { className: "calendar-room-notice", role: "status", "aria-label": "\u65E5\u5386\u623F\u64CD\u4F5C\u53CD\u9988", children: notice }) : null, dialog ? (_jsx(CalendarRoomDialog, { dialog: dialog, onClose: () => setDialog(null), onConfirm: (message) => {
                    setDialog(null);
                    setNotice(message);
                } })) : null] }));
}
function RoomRow({ room, isExpanded, onToggle, onProductAction, onNavigateRoomType, onNavigatePrice, }) {
    const navigate = useNavigate();
    return (_jsxs("article", { className: "calendar-room-table__group", children: [_jsxs("div", { className: "calendar-room-table__room-row", children: [_jsx("div", { children: _jsx("button", { type: "button", className: "calendar-room-row-toggle", onClick: onToggle, children: isExpanded ? '收起' : '展开' }) }), _jsx("div", { className: "calendar-room-name", children: room.name }), _jsx("div", { className: "calendar-room-channels", "aria-label": `${room.name}关联渠道`, children: room.channelBadges.map((channel, index) => (_jsxs("button", { type: "button", className: "calendar-room-channels__badge", style: { zIndex: room.channelBadges.length - index }, onClick: () => navigate(channel.route), title: channel.name, "aria-label": `打开${channel.name}管理渠道页`, children: [_jsx("img", { src: channel.iconUrl, alt: "", loading: "lazy", onError: (event) => {
                                        event.currentTarget.style.display = 'none';
                                        const fallback = event.currentTarget.nextElementSibling;
                                        if (fallback instanceof HTMLElement)
                                            fallback.style.display = 'inline-grid';
                                    } }), _jsx("span", { className: "calendar-room-channels__fallback", "aria-hidden": "true", children: channel.shortLabel })] }, `${room.id}-${channel.id}-${index}`))) }), _jsx("div", { children: room.products.length }), _jsxs("div", { className: "calendar-room-actions", children: [_jsx("button", { type: "button", onClick: onNavigateRoomType, children: "\u7F16\u8F91\u623F\u578B" }), _jsx("button", { type: "button", onClick: onNavigatePrice, children: "\u623F\u4EF7\u7BA1\u7406" })] })] }), isExpanded ? _jsx(ProductDetails, { room: room, onProductAction: onProductAction }) : null] }));
}
function ProductDetails({ room, onProductAction, }) {
    return (_jsx("div", { className: "calendar-room-products", "aria-label": `${room.name}产品明细`, children: room.products.map((product) => (_jsxs("article", { className: "calendar-room-product-card", children: [_jsxs("div", { className: "calendar-room-product-card__main", children: [_jsx(ProductField, { label: "\u4EA7\u54C1\u540D\u79F0\uFF1A", value: product.name }), _jsx(ProductField, { label: "\u6E20\u9053\uFF1A", value: product.channel }), _jsx(ProductField, { label: "\u65E9\u9910\u7C7B\u578B\uFF1A", value: product.breakfast }), _jsx(ProductField, { label: "\u9000\u8BA2\u653F\u7B56\uFF1A", value: product.refund })] }), _jsx("div", { className: "calendar-room-product-card__actions", children: product.actions.map((action) => (_jsx("button", { type: "button", className: action === '上架' ? 'is-offline-action' : action === '下架' ? 'is-danger-link' : '', onClick: () => onProductAction(action, product), children: action }, action))) })] }, product.id))) }));
}
function ProductField({ label, value }) {
    return (_jsxs("div", { className: "calendar-room-product-field", children: [_jsx("span", { children: label }), _jsx("strong", { children: value })] }));
}
function FilterButton({ label, value, placeholder, options, isOpen, onToggle, onChoose, }) {
    const displayValue = value || placeholder;
    return (_jsxs("label", { className: "calendar-room-field calendar-room-field--select", children: [_jsxs("span", { children: [label, "\uFF1A"] }), _jsxs("div", { className: "calendar-room-select-wrap", children: [_jsx("button", { type: "button", className: "calendar-room-select", "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-label": `${label} ${displayValue}`, onClick: onToggle, children: displayValue }), isOpen ? (_jsx("div", { className: "calendar-room-options", role: "listbox", "aria-label": `${label}选项`, children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": value === option, onClick: () => onChoose(option), children: option }, option))) })) : null] })] }));
}
function CalendarRoomDialog({ dialog, onClose, onConfirm, }) {
    if (dialog.type === 'detail') {
        return (_jsx("div", { className: "calendar-room-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "calendar-room-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u552E\u5356\u4EA7\u54C1\u8BE6\u60C5", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u552E\u5356\u4EA7\u54C1\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u552E\u5356\u4EA7\u54C1\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("dl", { children: [_jsx("dt", { children: "\u4EA7\u54C1\u540D\u79F0" }), _jsx("dd", { children: dialog.product.name }), _jsx("dt", { children: "\u6E20\u9053" }), _jsx("dd", { children: dialog.product.channel }), _jsx("dt", { children: "\u5F53\u524D\u4EF7\u683C\u8BA1\u5212" }), _jsx("dd", { children: dialog.product.pricePlan }), _jsx("dt", { children: "\u4E0A\u4E0B\u67B6\u72B6\u6001" }), _jsx("dd", { children: dialog.product.status === 'online' ? '上架中' : '已下架' })] })] }) }));
    }
    if (dialog.type === 'price') {
        return (_jsx("div", { className: "calendar-room-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "calendar-room-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u8C03\u6574\u552E\u5356\u4EF7\u683C", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u8C03\u6574\u552E\u5356\u4EF7\u683C" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8C03\u6574\u552E\u5356\u4EF7\u683C", onClick: onClose, children: "\u00D7" })] }), _jsxs("dl", { children: [_jsx("dt", { children: "\u4EA7\u54C1\u540D\u79F0" }), _jsx("dd", { children: dialog.product.name }), _jsx("dt", { children: "\u5F53\u524D\u4EF7\u683C\u8BA1\u5212" }), _jsx("dd", { children: dialog.product.pricePlan })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => onConfirm('售卖价格已保存'), children: "\u4FDD\u5B58\u4EF7\u683C" })] })] }) }));
    }
    const isOnline = dialog.product.status === 'online';
    const title = isOnline ? '是否确认下架售卖产品?' : '是否确认上架售卖产品?';
    const description = isOnline ? '确认下架后将无法进行售卖，可能会影响收益。' : '';
    return (_jsx("div", { className: "calendar-room-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "calendar-room-dialog calendar-room-dialog--status", role: "dialog", "aria-modal": "true", "aria-label": "\u8C03\u6574\u4E0A\u4E0B\u67B6\u72B6\u6001", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("span", { className: "calendar-room-dialog__warning", "aria-hidden": "true", children: "!" }), _jsxs("div", { className: "calendar-room-dialog__status-copy", children: [_jsx("strong", { children: title }), description ? _jsx("p", { children: description }) : null] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => onConfirm('售卖状态已更新'), children: "\u786E\u8BA4\u8C03\u6574" })] })] }) }));
}
function CalendarRoomEditPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const editChannel = new URLSearchParams(location.search).get('channel') || '';
    const editProductName = new URLSearchParams(location.search).get('productName') || '';
    const isEditMode = new URLSearchParams(location.search).get('mode') === 'edit';
    const initialChannel = EDIT_CHANNEL_TABS.includes(editChannel) ? editChannel : '微信小程序';
    const [activeChannel, setActiveChannel] = useState(initialChannel);
    const [notice, setNotice] = useState('');
    const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
    const [roomKeyword, setRoomKeyword] = useState('');
    const [selectedRoomIds, setSelectedRoomIds] = useState([]);
    const [roomSaleType, setRoomSaleType] = useState('calendar');
    const [productType, setProductType] = useState('fullDay');
    const [stayLimitType, setStayLimitType] = useState('unlimited');
    const [checkinPeriodType, setCheckinPeriodType] = useState('custom');
    const showDouyinFields = activeChannel === '抖音来客';
    const showKioskBrands = activeChannel === '自助机';
    const hasRoomData = !CHANNEL_ROOM_EMPTY_CHANNELS.has(activeChannel);
    const isMiniProgramChannel = MINI_PROGRAM_CHANNELS.has(activeChannel);
    const isKioskChannel = KIOSK_CHANNELS.has(activeChannel);
    const supportsHourlyRoom = isMiniProgramChannel || isKioskChannel;
    const showDouyinPresaleFields = showDouyinFields && roomSaleType === 'presale';
    const showHourlyFields = !showDouyinPresaleFields && supportsHourlyRoom && productType === 'hourly';
    const filteredRoomGroups = CHANNEL_ROOM_GROUPS.filter((group) => group.name.includes(roomKeyword.trim()));
    function openRoomDialog() {
        setRoomKeyword('');
        setIsRoomDialogOpen(true);
        setNotice('');
    }
    function closeRoomDialog() {
        setIsRoomDialogOpen(false);
    }
    function toggleRoomSelection(roomId) {
        setSelectedRoomIds((current) => current.includes(roomId) ? current.filter((id) => id !== roomId) : [...current, roomId]);
    }
    function confirmRoomSelection() {
        const summary = selectedRoomIds.length > 0 ? `已选择 ${selectedRoomIds.length} 个渠道房型` : `${activeChannel}暂未选择房型`;
        setNotice(summary);
        setIsRoomDialogOpen(false);
    }
    function handleChannelChange(channel) {
        setActiveChannel(channel);
        setIsRoomDialogOpen(false);
        setNotice('');
        setSelectedRoomIds([]);
        setRoomSaleType('calendar');
        setProductType(channel === '小红书' ? 'hourly' : 'fullDay');
        setStayLimitType(channel === '自助机' ? 'limited' : 'unlimited');
        setCheckinPeriodType('custom');
    }
    return (_jsxs("div", { className: "calendar-room-edit-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u65E5\u5386\u623F" }), _jsxs("div", { className: "calendar-room-breadcrumb", children: [_jsx("button", { type: "button", onClick: () => navigate('/setting/localRoomTypeProductionSetting'), children: "\u65E5\u5386\u623F" }), _jsx("span", { children: "/" }), _jsx("strong", { children: isEditMode ? '编辑产品' : '新增产品' })] }), _jsx("div", { className: "calendar-room-channel-tabs", role: "tablist", "aria-label": "\u552E\u5356\u6E20\u9053", children: EDIT_CHANNEL_TABS.map((channel) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeChannel === channel, className: activeChannel === channel ? 'is-active' : '', disabled: DISABLED_EDIT_CHANNELS.has(channel), onClick: () => handleChannelChange(channel), children: channel }, channel))) }), notice ? _jsx("div", { className: "calendar-room-notice", role: "status", "aria-label": "\u65E5\u5386\u623F\u64CD\u4F5C\u53CD\u9988", children: notice }) : null, _jsxs("section", { className: "calendar-room-edit-card", "aria-label": "\u65B0\u589E\u4EA7\u54C1", children: [showDouyinFields ? (_jsx(EditField, { label: "\u623F\u578B\u7C7B\u578B", children: _jsxs("div", { className: "calendar-room-radio-row", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "roomSaleType", checked: roomSaleType === 'calendar', onChange: () => setRoomSaleType('calendar') }), "\u65E5\u5386\u623F"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "roomSaleType", checked: roomSaleType === 'presale', onChange: () => {
                                                setRoomSaleType('presale');
                                                setProductType('fullDay');
                                            } }), "\u9884\u552E\u623F"] })] }) })) : null, showKioskBrands ? (_jsx(EditField, { label: "\u81EA\u52A9\u673A\u54C1\u724C", children: _jsx("div", { className: "calendar-room-radio-row calendar-room-radio-row--wide", children: ['自助机RW', '自助机YZ', '自助机ZD', '自助机PY', '自助机CQ', '自助机PC', '自助机YK', '自助机YD', '自助机KT', '自助机LM'].map((brand, index) => (_jsxs("label", { children: [_jsx("input", { type: "radio", name: "kioskBrand", defaultChecked: index === 0 }), brand] }, brand))) }) })) : null, _jsx(EditField, { label: "\u9009\u62E9\u623F\u578B", children: _jsxs("button", { type: "button", className: "calendar-room-pick-room", onClick: openRoomDialog, children: [_jsx("span", { children: "\uFF0B" }), "\u623F\u578B"] }) }), _jsxs(EditField, { label: "\u552E\u5356\u4EA7\u54C1\u540D\u79F0", children: [showDouyinPresaleFields ? (_jsxs("div", { className: "calendar-room-product-name-inline", children: [_jsx("span", { className: "calendar-room-product-name-inline__prefix", children: "\u7269\u7406\u623F\u578B\u540D\u79F0\uFF08\u7CFB\u7EDF\u751F\u6210\uFF09" }), _jsx("input", { className: "calendar-room-product-name-inline__input", "aria-label": "\u81EA\u5B9A\u4E49\u90E8\u5206", placeholder: "\u81EA\u5B9A\u4E49\u90E8\u5206\uFF08\u5FC5\u586B\uFF09", defaultValue: editProductName })] })) : (isEditMode ? (_jsx("input", { className: "calendar-room-edit-name-input", "aria-label": "\u552E\u5356\u4EA7\u54C1\u540D\u79F0", defaultValue: editProductName })) : (_jsx("p", { className: "calendar-room-readonly-text", children: showHourlyFields ? '系统自动生成，物理房型名称-入住时长-退改规则' : '系统自动生成，物理房型名称-早餐-退改规则' }))), _jsx("em", { children: showDouyinPresaleFields
                                    ? '名称会对用户展示，为避免字诉请谨慎填写，名称格式如：高级大床房-五一节预售'
                                    : showHourlyFields
                                        ? '名称仅对商家侧展示，名称格式如：高级大床房-3小时-入住前可取消'
                                        : '名称仅对商家侧展示，名称格式如：高级大床房-2份早餐-入住当天18:00前可取消' })] }), _jsx(EditField, { label: "\u4EA7\u54C1\u7C7B\u578B", children: _jsxs("div", { className: "calendar-room-radio-row", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "productType", checked: productType === 'fullDay', disabled: showDouyinPresaleFields, onChange: () => setProductType('fullDay') }), "\u5168\u65E5\u623F"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "productType", checked: productType === 'hourly', disabled: showDouyinFields || !supportsHourlyRoom || showDouyinPresaleFields, onChange: () => setProductType('hourly') }), "\u949F\u70B9\u623F"] })] }) }), showDouyinPresaleFields ? null : showHourlyFields ? (_jsx(EditField, { label: "\u5165\u4F4F\u65F6\u957F\u9650\u5236", children: _jsxs("div", { className: "calendar-room-radio-row", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "stayLimitType", checked: stayLimitType === 'limited', onChange: () => setStayLimitType('limited') }), "\u9650\u5236"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "stayLimitType", checked: stayLimitType === 'unlimited', disabled: isKioskChannel, onChange: () => setStayLimitType('unlimited') }), "\u4E0D\u9650\u5236", _jsx(HelpTooltip, { label: "\u5165\u4F4F\u65F6\u957F\u9650\u5236\u8BF4\u660E", text: "\u5982\u9009\u62E9\u4E0D\u9650\u5165\u4F4F\u65F6\u957F\uFF0C\u5219\u53EF\u4EFB\u610F\u65F6\u6BB5\u5185\u5747\u53EF\u5165\u4F4F" })] })] }) })) : (_jsx(EditField, { label: "\u65E9\u9910", children: _jsxs("div", { className: "calendar-room-breakfast", children: [_jsxs("select", { "aria-label": "\u65E9\u9910\u4EFD\u6570", defaultValue: "0", children: [_jsx("option", { value: "0", children: "0" }), _jsx("option", { value: "1", children: "1" }), _jsx("option", { value: "2", children: "2" })] }), _jsx("span", { children: "\u4EFD\u65E9\u9910" })] }) })), showDouyinPresaleFields ? null : (_jsx(EditField, { label: "\u53D6\u6D88\u89C4\u5219", children: _jsx("div", { className: "calendar-room-radio-row", children: ['未入住任意退', '阶梯退', '限时退', '不可退'].map((item, index) => (_jsxs("label", { children: [_jsx("input", { type: "radio", name: "refundRule", defaultChecked: index === 3 }), item] }, item))) }) })), showDouyinPresaleFields ? (_jsxs(_Fragment, { children: [_jsx(EditField, { label: "\u65F6\u95F4", children: _jsxs("button", { type: "button", className: "calendar-room-date-range", onClick: () => setNotice('预售时间日历组件已打开'), children: [_jsx("span", { children: "Invalid date" }), _jsx("span", { children: "\u2192" }), _jsx("span", { children: "Invalid date" }), _jsx("span", { "aria-hidden": "true", children: "\u25A1" })] }) }), _jsx(EditField, { label: "\u81EA\u52A8\u7EED\u671F", children: _jsxs("div", { className: "calendar-room-radio-row", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "presaleRenewal", defaultChecked: true }), "\u81EA\u52A8\u7EED\u671F", _jsx(HelpTooltip, { label: "\u81EA\u52A8\u7EED\u671F\u8BF4\u660E", text: "\u5F00\u542F\u540E\u4F1A\u6309\u5F53\u524D\u9884\u552E\u914D\u7F6E\u81EA\u52A8\u987A\u5EF6\u9500\u552E\u5468\u671F" })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "presaleRenewal" }), "\u4E0D\u81EA\u52A8\u7EED\u671F"] })] }) })] })) : null, showHourlyFields ? (_jsx(EditField, { label: "\u53EF\u5165\u4F4F\u65F6\u6BB5", children: _jsxs("div", { className: "calendar-room-checkin-period", children: [_jsxs("div", { className: "calendar-room-radio-row", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "checkinPeriodType", checked: checkinPeriodType === 'allDay', onChange: () => setCheckinPeriodType('allDay') }), "\u5168\u5929"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "checkinPeriodType", checked: checkinPeriodType === 'custom', onChange: () => setCheckinPeriodType('custom') }), "\u81EA\u5B9A\u4E49"] })] }), checkinPeriodType === 'custom' ? (_jsxs("div", { className: "calendar-room-checkin-period__custom", children: [_jsx("select", { "aria-label": "\u5F00\u59CB\u65F6\u95F4", defaultValue: "10", children: ['00', '06', '08', '10', '12', '14', '16', '18', '20', '22'].map((hour) => (_jsxs("option", { value: hour, children: [hour, " \u70B9"] }, hour))) }), _jsx("span", { children: "\u5230" }), _jsx("select", { "aria-label": "\u7ED3\u675F\u65F6\u95F4", defaultValue: "22", children: ['08', '10', '12', '14', '16', '18', '20', '22', '23'].map((hour) => (_jsxs("option", { value: hour, children: [hour, " \u70B9"] }, hour))) })] })) : null] }) })) : null, showDouyinFields && !showDouyinPresaleFields ? (_jsxs(_Fragment, { children: [_jsx(EditField, { label: "\u6536\u6B3E\u65B9\u5F0F", children: _jsx("div", { className: "calendar-room-radio-row", children: ['总部收款', '区域账户收款', '分店账户收款'].map((item, index) => (_jsxs("label", { children: [_jsx("input", { type: "radio", name: "paymentMethod", defaultChecked: index === 0 }), item] }, item))) }) }), _jsx(EditField, { label: "\u65F6\u95F4", children: _jsxs("button", { type: "button", className: "calendar-room-date-range", onClick: () => setNotice('售卖时间选择器已打开'), children: [_jsx("span", { children: "2026-05-21" }), _jsx("span", { children: "\u2192" }), _jsx("span", { children: "2026-06-21" }), _jsx("span", { "aria-hidden": "true", children: "\u25A1" })] }) }), _jsx(EditField, { label: "\u81EA\u52A8\u7EED\u671F", children: _jsxs("div", { className: "calendar-room-radio-row", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "renewal", defaultChecked: true }), "\u81EA\u52A8\u7EED\u671F", _jsx(HelpTooltip, { label: "\u81EA\u52A8\u7EED\u671F\u8BF4\u660E", text: "\u5F00\u542F\u540E\u4F1A\u6309\u5F53\u524D\u552E\u5356\u65F6\u95F4\u81EA\u52A8\u7EED\u671F\uFF0C\u65E0\u9700\u91CD\u590D\u624B\u52A8\u914D\u7F6E" })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "renewal" }), "\u4E0D\u81EA\u52A8\u7EED\u671F"] })] }) })] })) : null, _jsx(EditField, { label: "\u623F\u4EF7", children: _jsx("p", { children: "\u521B\u5EFA\u4E4B\u540E\u524D\u5F80\u3010\u6E20\u9053RP\u4EF7\u3011\u8BBE\u7F6E\u6216\u68C0\u67E5\u5BF9\u5E94\u4EF7\u683C" }) }), _jsx("footer", { className: "calendar-room-edit-footer", children: _jsx("button", { type: "button", className: "is-primary", onClick: () => setNotice('售卖产品已保存'), children: "\u786E \u5B9A" }) })] }), isRoomDialogOpen ? (_jsx(ChannelRoomDialog, { activeChannel: activeChannel, keyword: roomKeyword, groups: hasRoomData ? filteredRoomGroups : [], selectedRoomIds: selectedRoomIds, onClose: closeRoomDialog, onConfirm: confirmRoomSelection, onKeywordChange: setRoomKeyword, onToggleRoom: toggleRoomSelection })) : null] }));
}
function EditField({ label, children }) {
    return (_jsxs("div", { className: "calendar-room-edit-field", children: [_jsx("span", { children: label }), _jsx("div", { children: children })] }));
}
function ChannelRoomDialog({ activeChannel, keyword, groups, selectedRoomIds, onClose, onConfirm, onKeywordChange, onToggleRoom, }) {
    const isEmpty = groups.length === 0;
    return (_jsx("div", { className: "calendar-room-channel-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "calendar-room-channel-dialog", role: "dialog", "aria-modal": "true", "aria-label": `选择${activeChannel}房型`, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "calendar-room-channel-dialog__header", children: [_jsx("strong", { children: "\u9009\u62E9\u6E20\u9053\u623F\u578B" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u9009\u62E9\u6E20\u9053\u623F\u578B", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "calendar-room-channel-dialog__body", children: [_jsxs("label", { className: "calendar-room-channel-dialog__search", children: [_jsx("span", { "aria-hidden": "true", children: "\u2315" }), _jsx("input", { value: keyword, placeholder: "\u8BF7\u8F93\u5165\u540D\u79F0", "aria-label": "\u8BF7\u8F93\u5165\u540D\u79F0", onChange: (event) => onKeywordChange(event.target.value) })] }), _jsx("div", { className: "calendar-room-channel-dialog__divider" }), isEmpty ? (_jsxs("div", { className: "calendar-room-channel-dialog__empty", role: "status", "aria-live": "polite", children: [_jsxs("div", { className: "calendar-room-channel-dialog__empty-illustration", "aria-hidden": "true", children: [_jsx("span", { className: "is-back-left" }), _jsx("span", { className: "is-back-center" }), _jsx("span", { className: "is-back-right" }), _jsx("span", { className: "is-house-base" }), _jsx("span", { className: "is-house-roof" }), _jsx("span", { className: "is-house-door" }), _jsx("span", { className: "is-house-window-left" }), _jsx("span", { className: "is-house-window-right" })] }), _jsx("p", { children: "\u6682\u65E0\u6570\u636E" })] })) : (_jsx("div", { className: "calendar-room-channel-dialog__tree", role: "list", "aria-label": "\u6E20\u9053\u623F\u578B\u5217\u8868", children: groups.map((group) => {
                                const checked = selectedRoomIds.includes(group.id);
                                return (_jsxs("label", { className: "calendar-room-channel-dialog__tree-row", role: "listitem", children: [_jsx("input", { type: "checkbox", checked: checked, "aria-label": group.name, onChange: () => onToggleRoom(group.id) }), _jsx("span", { className: "calendar-room-channel-dialog__tree-label", children: group.name }), _jsx("span", { className: "calendar-room-channel-dialog__tree-arrow", "aria-hidden": "true", children: "\u25B6" })] }, group.id));
                            }) }))] }), _jsxs("footer", { className: "calendar-room-channel-dialog__footer", children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: onConfirm, children: "\u786E\u5B9A" })] })] }) }));
}
function HelpTooltip({ label, text }) {
    return (_jsxs("span", { className: "calendar-room-help-tooltip", children: [_jsx("button", { type: "button", className: "calendar-room-help", "aria-label": label, children: "?" }), _jsx("span", { className: "calendar-room-help-tooltip__bubble", role: "tooltip", children: text })] }));
}
