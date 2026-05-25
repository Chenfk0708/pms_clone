import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDefaultDistributionFilters, distributionListEndpoints, fetchDistributionDashboard, } from '../services/distributionList';
import './DistributionListPage.css';
const actionButtons = [
    { label: '提现教程', route: '/statistics/distributionOrder' },
    { label: '房态管理', route: '/houseManage/months' },
    { label: '房价管理', route: '/houseManage/houseCale' },
    { label: '房型管理', route: '/setting/roomTypeInfo' },
];
const importStoreOptions = [
    '天洛会宿公寓(前海壹方城宝安中心店)',
    '天洛会宿公寓(科技园店)',
];
export function DistributionListPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState(() => createDefaultDistributionFilters(new URLSearchParams(window.location.search)));
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [drawerRoomId, setDrawerRoomId] = useState(null);
    const [roomProgressMap, setRoomProgressMap] = useState({});
    const [importMenuOpen, setImportMenuOpen] = useState(false);
    const [importDialogMode, setImportDialogMode] = useState(null);
    const [undistributedStoreMode, setUndistributedStoreMode] = useState('all');
    const updateFilters = (nextFilters) => {
        setNotice('');
        setLoading(true);
        setError('');
        setOpenMenuId(null);
        setImportMenuOpen(false);
        setFilters(nextFilters);
    };
    useEffect(() => {
        let active = true;
        fetchDistributionDashboard(filters)
            .then((result) => {
            if (!active)
                return;
            setDashboard(result);
            setLoading(false);
        })
            .catch((reason) => {
            if (!active)
                return;
            setDashboard(null);
            setError(reason.message);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [filters]);
    useEffect(() => {
        if (!dashboard)
            return;
        const nextMap = [...dashboard.distributedRooms, ...dashboard.undistributedRooms].reduce((result, room) => {
            result[room.id] = room.progress;
            return result;
        }, {});
        setRoomProgressMap(nextMap);
    }, [dashboard]);
    useEffect(() => {
        if (!notice)
            return;
        const timer = window.setTimeout(() => setNotice(''), 2200);
        return () => window.clearTimeout(timer);
    }, [notice]);
    const currentStoreLabel = useMemo(() => {
        const matched = dashboard?.stores.find((store) => store.id === filters.poiId);
        return matched?.label ?? dashboard?.stores[1]?.label ?? '当前门店';
    }, [dashboard, filters.poiId]);
    const visibleRows = useMemo(() => {
        if (!dashboard)
            return [];
        const list = filters.tab === 'distributed' ? dashboard.distributedRooms : dashboard.undistributedRooms;
        const filteredByStore = filters.tab === 'undistributed' && undistributedStoreMode === 'current'
            ? list.filter((room) => room.storeId === filters.poiId || filters.poiId === 'ALL')
            : list;
        return filteredByStore.map((room) => ({
            ...room,
            progress: roomProgressMap[room.id] ?? room.progress,
        }));
    }, [dashboard, filters.poiId, filters.tab, roomProgressMap, undistributedStoreMode]);
    const selectedRoom = useMemo(() => visibleRows.find((room) => room.id === drawerRoomId) ?? null, [drawerRoomId, visibleRows]);
    const requestSnapshot = dashboard ? JSON.stringify(dashboard.request) : JSON.stringify({ filters });
    const reload = (message = '分销列表已刷新') => {
        updateFilters((current) => ({ ...current, scenario: 'success', page: 1 }));
        window.setTimeout(() => setNotice(message), 120);
    };
    const selectTab = (nextTab) => {
        updateFilters((current) => ({ ...current, tab: nextTab, page: 1 }));
    };
    const toggleDistribution = (room) => {
        setRoomProgressMap((current) => {
            const currentProgress = current[room.id] ?? room.progress;
            const nextProgress = currentProgress === 'closed' ? 'distributing' : 'closed';
            window.setTimeout(() => setNotice(`${room.name} 已${nextProgress === 'closed' ? '关闭' : '打开'}分销`), 0);
            return { ...current, [room.id]: nextProgress };
        });
        setOpenMenuId(null);
    };
    return (_jsxs("div", { className: `distribution-list-page${loading ? ' is-loading' : ''}`, "data-testid": "distribution-list-contract", "data-provider": dashboard?.provider ?? 'mock', "data-endpoint-camp-flow": distributionListEndpoints.campFlow, "data-endpoint-room-categories": distributionListEndpoints.roomCategories, "data-endpoint-undistributed": distributionListEndpoints.undistributedRoomCategories, "data-request": requestSnapshot, onClick: () => {
            if (openMenuId)
                setOpenMenuId(null);
            if (importMenuOpen)
                setImportMenuOpen(false);
        }, children: [_jsxs("section", { className: "distribution-page-main", children: [_jsxs("div", { className: "distribution-page-main__header", children: [_jsxs("div", { className: "distribution-list-tabs", role: "group", "aria-label": "\u5206\u9500\u72B6\u6001", children: [_jsx("button", { type: "button", className: filters.tab === 'distributed' ? 'is-active' : '', onClick: () => selectTab('distributed'), children: "\u5DF2\u5206\u9500" }), _jsx("button", { type: "button", className: filters.tab === 'undistributed' ? 'is-active' : '', onClick: () => selectTab('undistributed'), children: "\u672A\u5206\u9500" })] }), filters.tab === 'distributed' ? (_jsxs("div", { className: "distribution-panel__actions", children: [actionButtons.map((action, index) => (_jsx("button", { type: "button", className: index === 0 ? 'is-outline' : 'is-primary', onClick: () => navigate(action.route), children: action.label }, action.label))), _jsx("button", { type: "button", className: "is-light", onClick: () => reload(), children: "\u5237\u65B0" })] })) : null] }), filters.tab === 'undistributed' ? (_jsxs("div", { className: "distribution-undistributed-toolbar", children: [_jsxs("div", { className: "distribution-store-switch", "aria-label": "\u672A\u5206\u9500\u95E8\u5E97\u5207\u6362", children: [_jsx("button", { type: "button", className: undistributedStoreMode === 'all' ? 'is-active' : '', onClick: (event) => {
                                            event.stopPropagation();
                                            setUndistributedStoreMode('all');
                                        }, children: "\u5168\u90E8\u95E8\u5E97" }), _jsx("button", { type: "button", className: `is-store${undistributedStoreMode === 'current' ? ' is-active' : ''}`, title: currentStoreLabel, onClick: (event) => {
                                            event.stopPropagation();
                                            setUndistributedStoreMode('current');
                                        }, children: currentStoreLabel }), _jsx("button", { type: "button", className: "is-setting", "aria-label": "\u95E8\u5E97\u8BBE\u7F6E", onClick: (event) => {
                                            event.stopPropagation();
                                            navigate('/InformationMaintenance/campInfo');
                                        }, children: "\u2699" })] }), _jsxs("div", { className: "distribution-panel__actions", children: [_jsx("button", { type: "button", className: "is-disabled", disabled: true, children: "\u4E00\u952E\u4E0A\u67B6" }), _jsxs("div", { className: "distribution-import-menu", children: [_jsx("button", { type: "button", className: "is-primary", "aria-expanded": importMenuOpen, onClick: (event) => {
                                                    event.stopPropagation();
                                                    setImportMenuOpen((current) => !current);
                                                }, children: "\u6E20\u9053\u5BFC\u5165\u5B8C\u5584" }), importMenuOpen ? (_jsxs("div", { className: "distribution-import-menu__panel", role: "menu", onClick: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setImportDialogMode('store');
                                                            setImportMenuOpen(false);
                                                        }, children: "\u5B8C\u5584\u95E8\u5E97\u4FE1\u606F" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setImportDialogMode('room');
                                                            setImportMenuOpen(false);
                                                        }, children: "\u5B8C\u5584\u623F\u578B\u4FE1\u606F" })] })) : null] })] })] })) : null, error ? (_jsxs("section", { className: "distribution-state distribution-state--error", role: "alert", children: [_jsx("strong", { children: "\u5206\u9500\u5217\u8868\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error }), _jsx("button", { type: "button", onClick: () => reload('分销列表已恢复'), children: "\u91CD\u8BD5" })] })) : null, !error && dashboard ? (_jsx(RoomTable, { label: filters.tab === 'distributed' ? '已分销房型表' : '未分销房型表', rows: visibleRows, emptyText: filters.tab === 'distributed' ? '当前条件暂无房型数据' : '暂无数据', progressHeader: filters.tab === 'distributed' ? '分销进度' : '原因', openMenuId: openMenuId, onToggleMenu: setOpenMenuId, onToggleDistribution: toggleDistribution, onEditChannel: (room) => {
                            setDrawerRoomId(room.id);
                            setOpenMenuId(null);
                        } })) : null] }), loading ? _jsx("div", { className: "distribution-loading", children: "\u5206\u9500\u5217\u8868\u52A0\u8F7D\u4E2D..." }) : null, notice ? (_jsx("div", { className: "distribution-toast", role: "status", children: notice })) : null, selectedRoom && dashboard ? (_jsx(DistributionConfigDrawer, { room: selectedRoom, channels: dashboard.channels, onClose: () => setDrawerRoomId(null) })) : null, importDialogMode ? (_jsx(ChannelImportDialog, { mode: importDialogMode, onClose: () => setImportDialogMode(null) })) : null] }));
}
function RoomTable({ label, rows, emptyText, progressHeader, openMenuId, onToggleMenu, onToggleDistribution, onEditChannel, }) {
    return (_jsx("div", { className: "distribution-table-wrap", children: _jsxs("table", { className: "distribution-table distribution-table--compact", "aria-label": label, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u623F\u578B" }), _jsx("th", { children: progressHeader }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: rows.length > 0 ? (rows.map((room) => {
                        const currentProgress = room.progress;
                        return (_jsxs("tr", { children: [_jsx("td", { children: _jsxs("div", { className: "distribution-room-cell", children: [_jsx("img", { src: room.thumbnail, alt: "" }), _jsx("div", { className: "distribution-room-cell__content", children: _jsx("strong", { children: room.name }) })] }) }), _jsx("td", { children: _jsx("span", { className: `distribution-progress distribution-progress--${currentProgress}`, "data-progress": currentProgress, children: currentProgress === 'distributing' ? '分销中' : '关闭' }) }), _jsx("td", { children: _jsxs("div", { className: "distribution-more", children: [_jsx("button", { type: "button", className: "distribution-more__trigger", "aria-expanded": openMenuId === room.id, onClick: (event) => {
                                                    event.stopPropagation();
                                                    onToggleMenu(openMenuId === room.id ? null : room.id);
                                                }, children: "\u66F4\u591A" }), openMenuId === room.id ? (_jsxs("div", { className: "distribution-more__menu", role: "menu", onClick: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => onToggleDistribution(room), children: currentProgress === 'closed' ? '打开' : '关闭' }), _jsx("button", { type: "button", role: "menuitem", onClick: () => onEditChannel(room), children: "\u6E20\u9053\u7F16\u8F91" })] })) : null] }) })] }, room.id));
                    })) : (_jsx("tr", { className: "distribution-empty-row", children: _jsx("td", { colSpan: 3, children: _jsxs("div", { className: "distribution-empty", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("p", { children: emptyText })] }) }) })) })] }) }));
}
function DistributionConfigDrawer({ room, channels, onClose, }) {
    const [enabled, setEnabled] = useState(room.progress === 'distributing');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedChannelIds, setSelectedChannelIds] = useState(room.channelIds);
    const [draftChannelIds, setDraftChannelIds] = useState(room.channelIds);
    const layerRef = useRef(null);
    useEffect(() => {
        setEnabled(room.progress === 'distributing');
        setSelectedChannelIds(room.channelIds);
        setDraftChannelIds(room.channelIds);
        setIsEditing(false);
    }, [room]);
    const toggleChannel = (channelId) => {
        setDraftChannelIds((current) => current.includes(channelId) ? current.filter((item) => item !== channelId) : [...current, channelId]);
    };
    return (_jsx("div", { ref: layerRef, className: "distribution-config-drawer-layer", role: "presentation", onMouseDown: (event) => {
            if (event.target === layerRef.current)
                onClose();
        }, children: _jsxs("aside", { className: "distribution-config-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u5206\u9500\u914D\u7F6E", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "distribution-config-drawer__header", children: [_jsx("h2", { children: "\u5206\u9500\u914D\u7F6E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5206\u9500\u914D\u7F6E", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "distribution-config-drawer__body", children: [_jsxs("section", { className: "distribution-config-switch", children: [_jsxs("div", { children: [_jsx("strong", { children: enabled ? '聚合分销已开启' : '聚合分销已关闭' }), _jsx("span", { children: room.name })] }), _jsx("button", { type: "button", className: `distribution-config-switch__toggle${enabled ? ' is-active' : ''}`, "aria-pressed": enabled, "aria-label": enabled ? '聚合分销已开启' : '聚合分销已关闭', onClick: () => setEnabled((current) => !current), children: _jsx("span", {}) })] }), _jsxs("section", { className: "distribution-config-card", "aria-label": "\u805A\u5408\u5206\u9500\u6E20\u9053", children: [_jsxs("div", { className: "distribution-config-card__top", children: [_jsxs("div", { children: [_jsx("h3", { children: "\u805A\u5408\u5206\u9500\u6E20\u9053" }), _jsxs("p", { children: ["\u5F53\u524D\u5206\u9500\u60C5\u51B5: ", selectedChannelIds.length, "/", channels.length] })] }), isEditing ? (_jsxs("div", { className: "distribution-config-card__actions", children: [_jsx("button", { type: "button", onClick: () => {
                                                        setDraftChannelIds(selectedChannelIds);
                                                        setIsEditing(false);
                                                    }, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-strong", onClick: () => {
                                                        setSelectedChannelIds(draftChannelIds);
                                                        setIsEditing(false);
                                                    }, children: "\u4FDD\u5B58" })] })) : (_jsx("button", { type: "button", onClick: () => setIsEditing(true), children: "\u7F16\u8F91" }))] }), _jsx("div", { className: "distribution-config-card__grid", children: channels.map((channel) => {
                                        const active = (isEditing ? draftChannelIds : selectedChannelIds).includes(channel.id);
                                        return (_jsxs("button", { type: "button", className: `distribution-channel-chip${active ? ' is-active' : ''}${isEditing ? ' is-editable' : ''}`, onClick: () => {
                                                if (isEditing)
                                                    toggleChannel(channel.id);
                                            }, children: [_jsx("span", { style: { ['--channel-color']: channel.color }, children: channel.shortName }), _jsx("strong", { children: channel.name })] }, channel.id));
                                    }) })] })] }), _jsxs("footer", { className: "distribution-config-drawer__footer", children: ["\u5F00\u901A\u805A\u5408\u5206\u9500\u65F6\uFF0C\u60A8\u5DF2\u9605\u8BFB\u5E76\u540C\u610F", _jsx("span", { children: "\u300A\u8DEF\u5BA2\u4E91\u5206\u9500\u534F\u8BAE\u300B" }), "\uFF0C\u5982\u6709\u7591\u95EE\uFF0C\u60A8\u53EF", _jsx("a", { href: "/", onClick: (event) => event.preventDefault(), children: "\u8054\u7CFB\u5BA2\u670D" })] })] }) }));
}
function ChannelImportDialog({ mode, onClose, }) {
    const layerRef = useRef(null);
    const [roomType, setRoomType] = useState('prepay');
    const [connectEnabled, setConnectEnabled] = useState(true);
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState(importStoreOptions[0]);
    return (_jsx("div", { ref: layerRef, className: "distribution-dialog-layer", role: "presentation", onMouseDown: (event) => {
            if (event.target === layerRef.current)
                onClose();
        }, children: _jsxs("section", { className: "distribution-import-dialog", role: "dialog", "aria-modal": "true", "aria-label": mode === 'store' ? '完善门店信息' : '完善房型信息', onMouseDown: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", className: "distribution-import-dialog__close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose, children: "\u00D7" }), _jsx("p", { className: "distribution-import-dialog__intro", children: "\u8BF7\u9009\u62E9\u60A8\u4E0A\u7EBF\u7684\u6E20\u9053(\u5355\u9009)\uFF0C\u9152\u5E97\u6E20\u9053\u80FD\u5BFC\u5165\u7684\u4FE1\u606F\u80FD\u5B8C\u5584\u3002" }), _jsxs("div", { className: "distribution-import-dialog__channels", children: [_jsx("button", { type: "button", className: "is-active", children: "\u643A\u7A0B\u9152\u5E97" }), mode === 'room' ? _jsx("button", { type: "button", children: "\u7F8E\u56E2\u6C11\u5BBF" }) : null] }), _jsx("p", { className: "distribution-import-dialog__desc", children: "\u8BF7\u6388\u6743\u6E20\u9053\uFF0C\u6211\u4EEC\u5C06\u4F1A\u4E3A\u60A8\u81EA\u52A8\u76F4\u8FDE\u5E76\u5B8C\u5584\u95E8\u5E97\u4FE1\u606F\u3002" }), _jsxs("div", { className: "distribution-import-form", children: [_jsxs("label", { className: "distribution-import-form__row", children: [_jsx("span", { children: "\u5F53\u524D\u95E8\u5E97:" }), _jsxs("div", { className: "distribution-import-form__field-wrap", children: [_jsxs("div", { className: "distribution-import-form__select-wrap", children: [_jsxs("button", { type: "button", className: "distribution-import-form__select", "aria-expanded": storeDropdownOpen, onClick: () => setStoreDropdownOpen((current) => !current), children: [_jsx("span", { children: selectedStore }), _jsx("em", { children: "\u2304" })] }), storeDropdownOpen ? (_jsx("div", { className: "distribution-import-form__dropdown", role: "listbox", children: importStoreOptions.map((store) => (_jsx("button", { type: "button", role: "option", className: selectedStore === store ? 'is-selected' : '', onClick: () => {
                                                            setSelectedStore(store);
                                                            setStoreDropdownOpen(false);
                                                        }, children: store }, store))) })) : null] }), _jsx("button", { type: "button", className: "distribution-import-form__link", children: "\u65B0\u589E\u95E8\u5E97" })] })] }), _jsxs("div", { className: "distribution-import-form__row", children: [_jsx("span", { children: "\u5B50\u9152\u5E97\u7C7B\u578B" }), _jsxs("div", { className: "distribution-import-form__radios", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", checked: roomType === 'prepay', onChange: () => setRoomType('prepay') }), _jsx("span", { children: "\u9884\u4ED8" })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", checked: roomType === 'cash', onChange: () => setRoomType('cash') }), _jsx("span", { children: "\u73B0\u4ED8" })] })] })] }), _jsxs("label", { className: "distribution-import-form__row", children: [_jsx("span", { children: "\u5B50\u9152\u5E97ID:" }), _jsxs("div", { className: "distribution-import-form__input-wrap", children: [_jsx("input", { type: "text", placeholder: "\u8BF7\u8F93\u5165\u5B50\u9152\u5E97ID" }), _jsx("button", { type: "button", className: "distribution-import-form__help", "aria-label": "\u67E5\u770B\u5E2E\u52A9", children: "?" })] })] }), _jsxs("label", { className: "distribution-import-form__row", children: [_jsx("span", { children: "\u9152\u5E97\u540D\u79F0:" }), _jsx("input", { type: "text", placeholder: "\u8BF7\u786E\u8BA4\u8F93\u5165\u4E0E\u643A\u7A0B\u4E00\u81F4\u7684\u9152\u5E97\u540D\u79F0" })] }), _jsxs("label", { className: "distribution-import-form__checkbox", children: [_jsx("input", { type: "checkbox", checked: connectEnabled, onChange: () => setConnectEnabled((current) => !current) }), _jsx("span", { children: "\u540C\u65F6\u5B8C\u6210\u643A\u7A0B\u76F4\u8FDE" })] })] }), _jsx("div", { className: "distribution-import-dialog__footer", children: _jsx("button", { type: "button", className: "distribution-import-dialog__confirm", onClick: onClose, children: "\u786E\u8BA4" }) })] }) }));
}
