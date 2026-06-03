import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHouseDays, resolveHouseDaysQueryFromLocation, } from '../services/houseDays';
import { BatchOperationDialog, createHoveredBooking, DEFAULT_ROOM_STATUS_DISPLAY_SETTINGS, MonthOrderDrawer, MonthOrderPopover, RoomStatusDisplaySettingsDrawer, RoomStatusLegendDrawer, } from './HouseMonthsPage';
import { OrderRefreshPopover } from './HouseStatusSharingPage';
import './HouseDaysPage.css';
const ROOM_TYPE_VIEW = '按房型';
const ROOM_NUMBER_VIEW = '按房间号';
const FLOOR_VIEW = '按楼层';
function getRoomBookings(room) {
    if (room.bookings?.length)
        return room.bookings;
    return room.booking ? [room.booking] : [];
}
function renderRoomBookings(room, displaySettings) {
    if (!displaySettings.showOrders)
        return null;
    return getRoomBookings(room).map((booking, index) => (_jsxs("div", { className: "day-room-booking", children: [_jsx("strong", { children: booking.guest }), _jsx("span", { children: booking.channel }), displaySettings.showOrderPrice ? _jsx("span", { children: booking.price }) : null] }, `${room.id}-booking-${index}`)));
}
function buildRoomTypeSummaryCards(rooms) {
    const grouped = new Map();
    for (const room of rooms) {
        const summary = grouped.get(room.roomType) ?? {
            roomType: room.roomType,
            rooms: [],
        };
        summary.rooms.push(room);
        grouped.set(room.roomType, summary);
    }
    return Array.from(grouped.values());
}
function FloorEmptyState({ onOpenSettings }) {
    return (_jsxs("div", { className: "day-floor-empty-state", "data-testid": "day-floor-empty-state", children: [_jsxs("div", { className: "day-floor-empty-state__illustration", "aria-hidden": "true", children: [_jsx("span", { className: "day-floor-empty-state__building" }), _jsx("span", { className: "day-floor-empty-state__bubble" })] }), _jsx("strong", { children: "\u8BF7\u5148\u8BBE\u7F6E\u697C\u5C42" }), _jsx("button", { type: "button", className: "primary-action", onClick: onOpenSettings, children: "\u524D\u5F80\u8BBE\u7F6E" })] }));
}
function RoomNumberView({ rooms, loading, error, setHoveredBooking, setSelectedBooking, setRoomActionAnchor, setFeedback, displaySettings, }) {
    return (_jsxs(_Fragment, { children: [rooms.map((room) => (_jsxs("section", { className: "day-room-group", children: [_jsx("h3", { children: room.roomType }), _jsxs("article", { className: "day-room-card", "data-tone": room.booking?.tone ?? 'empty', "aria-label": `${room.roomType} ${room.roomName}`, tabIndex: 0, onMouseEnter: (event) => {
                            if (!room.booking?.monthOrder)
                                return;
                            const rect = event.currentTarget.getBoundingClientRect();
                            setHoveredBooking(createHoveredBooking(rect, room.booking.monthOrder.cell, room.booking.monthOrder.roomType, room.booking.monthOrder.roomLabel));
                        }, onMouseLeave: () => setHoveredBooking(null), onClick: (event) => {
                            if (room.booking?.monthOrder) {
                                setSelectedBooking({
                                    cell: room.booking.monthOrder.cell,
                                    roomType: room.booking.monthOrder.roomType,
                                    roomLabel: room.booking.monthOrder.roomLabel,
                                });
                                setRoomActionAnchor(null);
                                setFeedback(`已打开 ${room.booking.monthOrder.roomLabel} 的订单详情。`);
                                return;
                            }
                            const rect = event.currentTarget.getBoundingClientRect();
                            setRoomActionAnchor({
                                room,
                                left: Math.min(window.innerWidth - 156, rect.right + 12),
                                top: Math.max(12, rect.top + rect.height / 2 - 128),
                            });
                            setFeedback(`已打开 ${room.roomName} 房间操作菜单。`);
                        }, onKeyDown: (event) => {
                            if (event.key !== 'Enter' && event.key !== ' ')
                                return;
                            event.preventDefault();
                            if (room.booking?.monthOrder) {
                                setSelectedBooking({
                                    cell: room.booking.monthOrder.cell,
                                    roomType: room.booking.monthOrder.roomType,
                                    roomLabel: room.booking.monthOrder.roomLabel,
                                });
                                setRoomActionAnchor(null);
                                setFeedback(`已打开 ${room.booking.monthOrder.roomLabel} 的订单详情。`);
                                return;
                            }
                            const rect = event.currentTarget.getBoundingClientRect();
                            setRoomActionAnchor({
                                room,
                                left: Math.min(window.innerWidth - 156, rect.right + 12),
                                top: Math.max(12, rect.top + rect.height / 2 - 128),
                            });
                            setFeedback(`已打开 ${room.roomName} 房间操作菜单。`);
                        }, children: [_jsx("strong", { children: room.roomName }), _jsx("span", { children: room.roomType }), renderRoomBookings(room, displaySettings), displaySettings.showOrderTags && room.hasTag ? _jsx("b", { "aria-label": "\u5907\u6CE8\u6807\u7B7E", children: "\u25CF" }) : null] })] }, room.id))), !loading && !error && rooms.length === 0 ? (_jsxs("div", { className: "day-empty-state", children: [_jsx("strong", { children: "\u6682\u65E0\u65E5\u623F\u6001\u6570\u636E" }), _jsx("span", { children: "\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u5C55\u793A\u623F\u95F4\uFF0C\u8BF7\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u540E\u91CD\u8BD5\u3002" })] })) : null] }));
}
function RoomTypeView({ summaries, loading, error, setHoveredBooking, setSelectedBooking, setRoomActionAnchor, setFeedback, displaySettings, }) {
    return (_jsxs("div", { className: "day-room-type-list", "data-testid": "day-room-type-grid", children: [summaries.map((summary) => (_jsxs("section", { className: "day-room-type-section", children: [_jsx("h3", { children: summary.roomType }), _jsx("div", { className: "day-room-type-section__rooms", children: summary.rooms.map((room) => (_jsxs("article", { className: "day-room-card", "data-tone": room.booking?.tone ?? 'empty', "aria-label": `${room.roomType} ${room.roomName}`, tabIndex: 0, onMouseEnter: (event) => {
                                if (!room.booking?.monthOrder)
                                    return;
                                const rect = event.currentTarget.getBoundingClientRect();
                                setHoveredBooking(createHoveredBooking(rect, room.booking.monthOrder.cell, room.booking.monthOrder.roomType, room.booking.monthOrder.roomLabel));
                            }, onMouseLeave: () => setHoveredBooking(null), onClick: (event) => {
                                if (room.booking?.monthOrder) {
                                    setSelectedBooking({
                                        cell: room.booking.monthOrder.cell,
                                        roomType: room.booking.monthOrder.roomType,
                                        roomLabel: room.booking.monthOrder.roomLabel,
                                    });
                                    setRoomActionAnchor(null);
                                    setFeedback(`已打开 ${room.booking.monthOrder.roomLabel} 的订单详情。`);
                                    return;
                                }
                                const rect = event.currentTarget.getBoundingClientRect();
                                setRoomActionAnchor({
                                    room,
                                    left: Math.min(window.innerWidth - 156, rect.right + 12),
                                    top: Math.max(12, rect.top + rect.height / 2 - 128),
                                });
                                setFeedback(`已打开 ${room.roomName} 房间操作菜单。`);
                            }, onKeyDown: (event) => {
                                if (event.key !== 'Enter' && event.key !== ' ')
                                    return;
                                event.preventDefault();
                                if (room.booking?.monthOrder) {
                                    setSelectedBooking({
                                        cell: room.booking.monthOrder.cell,
                                        roomType: room.booking.monthOrder.roomType,
                                        roomLabel: room.booking.monthOrder.roomLabel,
                                    });
                                    setRoomActionAnchor(null);
                                    setFeedback(`已打开 ${room.booking.monthOrder.roomLabel} 的订单详情。`);
                                    return;
                                }
                                const rect = event.currentTarget.getBoundingClientRect();
                                setRoomActionAnchor({
                                    room,
                                    left: Math.min(window.innerWidth - 156, rect.right + 12),
                                    top: Math.max(12, rect.top + rect.height / 2 - 128),
                                });
                                setFeedback(`已打开 ${room.roomName} 房间操作菜单。`);
                            }, children: [_jsx("strong", { children: room.roomName }), _jsx("span", { children: room.roomType }), renderRoomBookings(room, displaySettings), displaySettings.showOrderTags && room.hasTag ? _jsx("b", { "aria-label": "\u5907\u6CE8\u6807\u7B7E", children: "\u25CF" }) : null] }, room.id))) })] }, summary.roomType))), !loading && !error && summaries.length === 0 ? (_jsxs("div", { className: "day-empty-state", children: [_jsx("strong", { children: "\u6682\u65E0\u65E5\u623F\u6001\u6570\u636E" }), _jsx("span", { children: "\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u5C55\u793A\u623F\u578B\uFF0C\u8BF7\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u540E\u91CD\u8BD5\u3002" })] })) : null] }));
}
export function HouseDaysPage() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState(ROOM_NUMBER_VIEW);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [selectedRoomType, setSelectedRoomType] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [queryKeyword, setQueryKeyword] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [batchDialogMode, setBatchDialogMode] = useState(null);
    const [batchDialogState, setBatchDialogState] = useState({
        roomText: '',
        dateStart: '',
        dateEnd: '',
        channel: 'all',
        closeType: 'disabled',
        remark: '',
        mode: 'dirty',
    });
    const [statusDrawer, setStatusDrawer] = useState(null);
    const [displaySettings, setDisplaySettings] = useState(DEFAULT_ROOM_STATUS_DISPLAY_SETTINGS);
    const [roomActionAnchor, setRoomActionAnchor] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [hoveredBooking, setHoveredBooking] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [activeStoreChip, setActiveStoreChip] = useState('all');
    const [feedback, setFeedback] = useState('');
    const [refreshPopoverOpen, setRefreshPopoverOpen] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refreshTick, setRefreshTick] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        const source = resolveHouseDaysQueryFromLocation(window.location);
        void Promise.resolve()
            .then(() => {
            if (controller.signal.aborted)
                return null;
            setLoading(true);
            setError('');
            return fetchHouseDays({
                provider: source.provider,
                mockState: source.mockState,
                storeId: activeStoreChip,
                keyword: queryKeyword,
                viewMode,
                statusFilters: selectedFilters,
                channel: selectedChannel,
                roomType: selectedRoomType,
                tag: selectedTag,
            }, controller.signal);
        })
            .then((nextData) => {
            if (!nextData)
                return;
            setData(nextData);
        })
            .catch((nextError) => {
            if (nextError instanceof DOMException && nextError.name === 'AbortError')
                return;
            setError('日房态数据加载失败，请稍后重试。');
            setData(null);
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [activeStoreChip, queryKeyword, refreshTick, selectedChannel, selectedFilters, selectedRoomType, selectedTag, viewMode]);
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpenMenu(null);
                setStatusDrawer(null);
                setSelectedBooking(null);
                setBatchDialogMode(null);
                setRoomActionAnchor(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    useEffect(() => {
        const handlePointer = (event) => {
            const target = event.target;
            if (!(target instanceof Element))
                return;
            if (!target.closest('.day-toolbar__refresh-group')) {
                setRefreshPopoverOpen(false);
            }
            if (!target.closest('.day-room-actions-popover') && !target.closest('.day-room-card[data-tone=\"empty\"]')) {
                setRoomActionAnchor(null);
            }
            if (!target.closest('.month-order-drawer') && !target.closest('.day-room-card[data-tone]')) {
                setSelectedBooking(null);
            }
        };
        window.addEventListener('click', handlePointer);
        return () => window.removeEventListener('click', handlePointer);
    }, []);
    const toggleFilter = (label) => {
        setSelectedFilters((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]);
        setFeedback(`${label}筛选已更新，日房态已按当前条件刷新。`);
    };
    const blockAction = (message) => {
        setOpenMenu(null);
        setFeedback(message);
    };
    const openBatchDialog = (mode) => {
        setOpenMenu(null);
        setBatchDialogState({
            roomText: '',
            dateStart: '',
            dateEnd: '',
            channel: 'all',
            closeType: 'disabled',
            remark: '',
            mode,
        });
        setBatchDialogMode(mode);
    };
    const resetFilters = () => {
        setSelectedFilters([]);
        setKeyword('');
        setQueryKeyword('');
        setSelectedChannel('');
        setSelectedRoomType('');
        setSelectedTag('');
        setActiveStoreChip('all');
        setRefreshTick((tick) => tick + 1);
        setFeedback('日房态已刷新，筛选条件已重置。');
    };
    const handleSearchKeyDown = (event) => {
        if (event.key !== 'Enter')
            return;
        setQueryKeyword(keyword);
        setFeedback(`已按“${keyword || '全部房间'}”更新日房态。`);
    };
    const viewModes = data?.viewModes ?? [ROOM_TYPE_VIEW, ROOM_NUMBER_VIEW, FLOOR_VIEW];
    const statusGroups = data?.statusGroups ?? [];
    const roomCards = data?.rooms ?? [];
    const roomTypeSummaries = buildRoomTypeSummaryCards(roomCards);
    const storeOptions = data?.storeOptions ?? [
        { id: 'all', name: '全部门店' },
        { id: 'poi-1796067693589061634', name: '天落会宿公寓(前海壹方城宝安中心店)' },
    ];
    const routeTargets = data?.routeTargets ?? {
        months: '/houseManage/months',
        price: '/houseManage/houseCale',
        storeSettings: '/InformationMaintenance/campInfo',
    };
    const isRoomTypeView = viewMode === ROOM_TYPE_VIEW;
    const isRoomNumberView = viewMode === ROOM_NUMBER_VIEW;
    const isFloorView = viewMode === FLOOR_VIEW;
    return (_jsxs("div", { className: "page-stack day-status-page", children: [_jsxs("section", { className: "toolbar-card day-toolbar month-toolbar", children: [error ? (_jsxs("div", { className: "day-data-error", role: "alert", "aria-label": "\u65E5\u623F\u6001\u6570\u636E\u9519\u8BEF", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => setRefreshTick((tick) => tick + 1), children: "\u91CD\u8BD5" })] })) : null, _jsx("div", { className: "day-feedback-sr-only", role: "status", "aria-label": "\u65E5\u623F\u6001\u64CD\u4F5C\u53CD\u9988", "aria-live": "polite", children: feedback }), _jsxs("div", { className: "day-notice", children: [_jsx("span", { children: "\u2022" }), _jsx("p", { children: "\u667A\u80FD\u8C03\u4EF7\u76D1\u6D4B\u5230\u60A8\u5F53\u524D\u5165\u4F4F\u7387\u4F4E\u4E8E 50%\uFF0C\u5EFA\u8BAE\u8C03\u4EF7\u83B7\u5F97\u989D\u5916\u66F4\u591A\u8BA2\u5355" }), _jsx("button", { type: "button", children: "\u5FFD\u7565" }), _jsx("button", { type: "button", children: "\u7ACB\u5373\u8C03\u4EF7" })] }), _jsxs("div", { className: "month-toolbar__primary", children: [_jsxs("div", { className: "segmented", children: [_jsx("button", { type: "button", onClick: () => navigate(routeTargets.months), children: "\u6708\u623F\u6001" }), _jsx("button", { type: "button", className: "is-active", children: "\u65E5\u623F\u6001" })] }), _jsxs("div", { className: "month-toolbar__actions", children: [_jsx("input", { type: "text", placeholder: "\u8F93\u5165\u5BA2\u6237\u59D3\u540D/\u624B\u673A/\u623F\u95F4/\u6E20\u9053\u5355/\u5907\u6CE8", value: keyword, onChange: (event) => setKeyword(event.target.value), onKeyDown: handleSearchKeyDown }), _jsx("button", { type: "button", className: "primary-action", onClick: () => blockAction('请连接读卡器后重试，或手动搜索住客信息。'), children: "\u8BFB\u5361" }), _jsx("button", { type: "button", className: "primary-action", onClick: () => navigate(routeTargets.price), children: "\u623F\u4EF7\u7BA1\u7406" }), _jsxs("div", { className: "month-settings", children: [_jsx("button", { type: "button", className: "primary-action", onClick: () => setOpenMenu(openMenu === 'settings' ? null : 'settings'), children: "\u66F4\u591A\u8BBE\u7F6E" }), openMenu === 'settings' ? (_jsxs("div", { className: "day-popover-menu month-settings__menu", role: "menu", "aria-label": "\u66F4\u591A\u8BBE\u7F6E", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setStatusDrawer('legend');
                                                            setOpenMenu(null);
                                                            setFeedback('已打开图例说明。');
                                                        }, children: "\u56FE\u4F8B\u8BF4\u660E" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setStatusDrawer('display');
                                                            setOpenMenu(null);
                                                            setFeedback('已打开房态设置。');
                                                        }, children: "\u623F\u6001\u8BBE\u7F6E" })] })) : null] })] })] }), _jsxs("div", { className: "month-toolbar__filters", children: [_jsxs("div", { className: "month-store-control", children: [_jsx("div", { className: "month-store-switch", "aria-label": "\u95E8\u5E97\u5207\u6362", children: storeOptions.map((store, index) => (_jsx("button", { type: "button", className: `chip${index === 0 ? ' month-store-chip' : ''}${activeStoreChip === store.id ? ' is-active' : ''}`, "aria-pressed": activeStoreChip === store.id, onClick: () => {
                                                setActiveStoreChip(store.id);
                                                setFeedback(store.id === 'all' ? '已切换到全部门店。' : `已切换到${store.name}。`);
                                            }, children: store.name }, store.id))) }), _jsx("button", { type: "button", className: "month-store-settings", "aria-label": "\u95E8\u5E97\u8BBE\u7F6E", onClick: () => navigate(routeTargets.storeSettings), children: "\u2699" })] }), _jsxs("div", { className: "toolbar-actions", children: [_jsxs("div", { className: "day-action-popover month-batch-action month-batch-action--first", children: [_jsx("button", { type: "button", className: "month-outline-action", onClick: () => setOpenMenu(openMenu === 'clean' ? null : 'clean'), children: "\u6279\u91CF\u8BBE\u810F/\u51C0" }), openMenu === 'clean' ? (_jsxs("div", { className: "day-popover-menu day-popover-menu--batch", role: "menu", "aria-label": "\u6279\u91CF\u8BBE\u810F/\u51C0", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => blockAction('请选择房间后再批量设脏。'), children: "\u6279\u91CF\u8BBE\u810F" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => blockAction('请选择房间后再批量设净。'), children: "\u6279\u91CF\u8BBE\u51C0" })] })) : null] }), _jsxs("div", { className: "day-action-popover month-batch-action", children: [_jsx("button", { type: "button", className: "month-outline-action", onClick: () => setOpenMenu(openMenu === 'openClose' ? null : 'openClose'), children: "\u6279\u91CF\u5F00/\u5173\u623F" }), openMenu === 'openClose' ? (_jsxs("div", { className: "day-popover-menu day-popover-menu--batch", role: "menu", "aria-label": "\u6279\u91CF\u5F00/\u5173\u623F", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => blockAction('请选择房间后再批量关房。'), children: "\u6279\u91CF\u5173\u623F" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => blockAction('请选择房间后再批量开房。'), children: "\u6279\u91CF\u5F00\u623F" })] })) : null] }), _jsxs("div", { className: "day-toolbar__refresh-group", children: [_jsx("button", { type: "button", className: "month-refresh-action", "aria-label": "\u5206\u4EAB\u623F\u6001", onClick: () => navigate('/houseManage/months/sharingRoomStatus'), children: "\u21BA" }), _jsx("button", { type: "button", className: "month-refresh-action", "aria-label": "\u8BA2\u5355\u5237\u65B0", onClick: () => setRefreshPopoverOpen((current) => !current), children: "\u27F3" }), _jsx(OrderRefreshPopover, { open: refreshPopoverOpen, onRefresh: () => {
                                                    setRefreshPopoverOpen(false);
                                                    setFeedback('美团酒店订单已刷新。');
                                                } })] })] })] })] }), _jsxs("section", { className: "day-status-layout", children: [_jsxs("div", { className: `day-room-area${isFloorView ? ' day-room-area--floor' : ''}`, children: [isRoomNumberView ? (_jsx(RoomNumberView, { rooms: roomCards, loading: loading, error: error, setHoveredBooking: setHoveredBooking, setSelectedBooking: setSelectedBooking, setRoomActionAnchor: setRoomActionAnchor, setFeedback: setFeedback, displaySettings: displaySettings })) : null, isRoomTypeView ? (_jsx(RoomTypeView, { summaries: roomTypeSummaries, loading: loading, error: error, setHoveredBooking: setHoveredBooking, setSelectedBooking: setSelectedBooking, setRoomActionAnchor: setRoomActionAnchor, setFeedback: setFeedback, displaySettings: displaySettings })) : null, isFloorView ? _jsx(FloorEmptyState, { onOpenSettings: () => navigate('/setting/roomTypeInfo') }) : null] }), _jsxs("aside", { className: "day-filter-panel", children: [_jsx("div", { className: "day-filter-tabs", children: viewModes.map((mode) => (_jsx("button", { type: "button", className: viewMode === mode ? 'is-active' : '', onClick: () => {
                                        setViewMode(mode);
                                        setFeedback(`已切换为${mode}。`);
                                    }, children: mode }, mode))) }), _jsxs("div", { className: "day-filter-summary", children: [viewMode, "\u89C6\u56FE"] }), selectedFilters.length > 0 ? (_jsx("div", { className: "day-filter-tags", children: selectedFilters.map((filter) => (_jsxs("span", { children: ["\u5DF2\u7B5B\u9009\uFF1A", filter] }, filter))) })) : null, !isFloorView ? (_jsxs(_Fragment, { children: [statusGroups.map((group) => (_jsxs("section", { className: "day-filter-group", children: [_jsx("h3", { children: group.title }), _jsx("div", { className: "day-filter-options", children: group.items.map((item) => (_jsxs("label", { children: [_jsx("span", { style: { '--tag-color': item.color ?? '#eef1f6' }, children: item.label }), _jsx("strong", { children: item.value }), _jsx("input", { type: "checkbox", "aria-label": item.label, checked: selectedFilters.includes(item.label), onChange: () => {
                                                                toggleFilter(item.label);
                                                                setFeedback('');
                                                            } })] }, item.label))) })] }, group.title))), _jsxs("section", { className: "day-filter-group", children: [_jsx("h3", { children: "\u6E20\u9053" }), _jsx("select", { "aria-label": "\u6E20\u9053", value: selectedChannel, onChange: (event) => {
                                                    setSelectedChannel(event.target.value);
                                                    setFeedback(`渠道筛选已切换，${event.target.selectedOptions[0]?.text ?? event.target.value}。`);
                                                }, children: (data?.channelOptions ?? [{ id: '', name: '渠道' }]).map((option) => (_jsx("option", { value: option.id, children: option.name }, option.id))) })] }), _jsxs("section", { className: "day-filter-group", children: [_jsx("h3", { children: "\u623F\u578B" }), _jsx("select", { "aria-label": "\u623F\u578B", value: selectedRoomType, onChange: (event) => {
                                                    setSelectedRoomType(event.target.value);
                                                    setFeedback(`房型筛选已切换，${event.target.selectedOptions[0]?.text ?? event.target.value}。`);
                                                }, children: (data?.roomTypeOptions ?? [{ id: '', name: '房型' }]).map((option) => (_jsx("option", { value: option.id, children: option.name }, option.id))) })] }), _jsxs("section", { className: "day-filter-group", children: [_jsx("h3", { children: "\u6807\u7B7E" }), _jsx("select", { "aria-label": "\u6807\u7B7E", value: selectedTag, onChange: (event) => {
                                                    setSelectedTag(event.target.value);
                                                    setFeedback(`标签筛选已切换，${event.target.selectedOptions[0]?.text ?? event.target.value}。`);
                                                }, children: (data?.tagOptions ?? [{ id: '', name: '房型标签' }]).map((option) => (_jsx("option", { value: option.id, children: option.name }, option.id))) })] })] })) : null] })] }), statusDrawer === 'legend' ? _jsx(RoomStatusLegendDrawer, { onClose: () => setStatusDrawer(null) }) : null, hoveredBooking ? _jsx(MonthOrderPopover, { hoveredBooking: hoveredBooking }) : null, batchDialogMode ? (_jsx(BatchOperationDialog, { mode: batchDialogMode, state: batchDialogState, onChange: (patch) => setBatchDialogState((current) => ({ ...current, ...patch })), onClose: () => setBatchDialogMode(null), onConfirm: () => {
                    setBatchDialogMode(null);
                    setFeedback(batchDialogState.mode === 'dirty'
                        ? '批量设脏已处理。'
                        : batchDialogState.mode === 'clean'
                            ? '批量设净已处理。'
                            : batchDialogState.mode === 'close'
                                ? '批量关房已处理。'
                                : '批量开房已处理。');
                } })) : null, selectedBooking ? (_jsx(MonthOrderDrawer, { selectedBooking: selectedBooking, onClose: () => setSelectedBooking(null), onAction: blockAction })) : null, roomActionAnchor ? (_jsx("aside", { className: "day-room-actions-popover", role: "menu", "aria-label": "\u623F\u95F4\u64CD\u4F5C", style: { left: roomActionAnchor.left, top: roomActionAnchor.top }, children: [
                    ['录单', `已打开 ${roomActionAnchor.room.roomName} 的录单流程。`],
                    ['关房', `已打开 ${roomActionAnchor.room.roomName} 的关房流程。`],
                    ['设为脏房', `已将 ${roomActionAnchor.room.roomName} 设为脏房。`],
                    ['查看房态日历', `已打开 ${roomActionAnchor.room.roomName} 的房态日历。`],
                    ['房态日志', `已打开 ${roomActionAnchor.room.roomName} 的房态日志。`],
                    ['保洁', `已打开 ${roomActionAnchor.room.roomName} 的保洁操作。`],
                ].map(([label, message]) => (_jsx("button", { type: "button", role: "menuitem", onClick: () => {
                        setRoomActionAnchor(null);
                        blockAction(message);
                    }, children: label }, label))) })) : null, statusDrawer === 'display' ? (_jsx(RoomStatusDisplaySettingsDrawer, { settings: displaySettings, onClose: () => setStatusDrawer(null), onChange: setDisplaySettings })) : null] }));
}
