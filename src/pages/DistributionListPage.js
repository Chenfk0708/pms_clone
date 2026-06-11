import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultDistributionFilters, distributionListEndpoints, fetchDistributionDashboard, localDistributionChannelId, localDistributionStatusStorageKey, } from '../services/distributionList';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './DistributionListPage.css';
const actionButtons = [
    { label: '提现教程', route: '/statistics/distributionOrder' },
    { label: '房态管理', route: '/houseManage/months' },
    { label: '房价管理', route: '/houseManage/houseCale' },
    { label: '房型管理', route: '/setting/roomTypeInfo' },
];
export function DistributionListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [filters, setFilters] = useState(() => createDefaultDistributionFilters(new URLSearchParams(location.search)));
    const [keywordDraft, setKeywordDraft] = useState(filters.keyword);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [drawerRoomId, setDrawerRoomId] = useState(null);
    const [roomProgressMap, setRoomProgressMap] = useState({});
    const [importMenuOpen, setImportMenuOpen] = useState(false);
    const [importDialogMode, setImportDialogMode] = useState(null);
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: dashboard?.stores.map((store) => ({
            id: store.id,
            label: store.label,
        })),
        enabled: dashboard?.provider === 'api',
    });
    const updateFilters = (nextFilters) => {
        setNotice('');
        setLoading(true);
        setError('');
        setOpenMenuId(null);
        setImportMenuOpen(false);
        setFilters(nextFilters);
    };
    useEffect(() => {
        const nextFilters = createDefaultDistributionFilters(new URLSearchParams(location.search));
        setFilters((current) => ({
            ...current,
            ...nextFilters,
        }));
        setLoading(true);
        setError('');
        setOpenMenuId(null);
        setImportMenuOpen(false);
    }, [location.search]);
    useEffect(() => {
        setKeywordDraft(filters.keyword);
    }, [filters.keyword]);
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
    const allRows = useMemo(() => {
        if (!dashboard)
            return [];
        return [...dashboard.distributedRooms, ...dashboard.undistributedRooms].map((room) => ({
            ...room,
            progress: roomProgressMap[room.id] ?? room.progress,
        }));
    }, [dashboard, roomProgressMap]);
    const visibleRows = useMemo(() => {
        const targetProgress = filters.tab === 'distributed' ? 'distributing' : 'closed';
        return allRows.filter((room) => room.progress === targetProgress);
    }, [allRows, filters.tab]);
    const selectedRoom = useMemo(() => allRows.find((room) => room.id === drawerRoomId) ?? null, [allRows, drawerRoomId]);
    const requestSnapshot = dashboard ? JSON.stringify(dashboard.request) : JSON.stringify({ filters });
    const reload = (message = '分销列表已刷新') => {
        updateFilters((current) => ({ ...current, scenario: 'success', page: 1 }));
        window.setTimeout(() => setNotice(message), 120);
    };
    const selectTab = (nextTab) => {
        updateFilters((current) => ({ ...current, tab: nextTab, page: 1 }));
    };
    const applyKeywordSearch = () => {
        updateFilters((current) => ({ ...current, keyword: keywordDraft.trim(), page: 1 }));
    };
    const applyRoomProgress = (room, nextProgress, channelIds) => {
        const nextChannelIds = nextProgress === 'distributing' ? channelIds ?? room.channelIds : [];
        persistLocalDistributionStatus(room.id, nextProgress, channelIds);
        setRoomProgressMap((current) => ({ ...current, [room.id]: nextProgress }));
        setDashboard((current) => {
            if (!current)
                return current;
            const roomById = new Map();
            [...current.distributedRooms, ...current.undistributedRooms].forEach((item) => {
                roomById.set(item.id, item);
            });
            const sourceRoom = roomById.get(room.id) ?? room;
            roomById.set(room.id, { ...sourceRoom, progress: nextProgress, channelIds: nextChannelIds });
            const nextRooms = Array.from(roomById.values());
            const distributedRooms = nextRooms.filter((item) => item.progress === 'distributing');
            const undistributedRooms = nextRooms.filter((item) => item.progress === 'closed');
            const activeRows = filters.tab === 'distributed' ? distributedRooms : undistributedRooms;
            return {
                ...current,
                distributedRooms,
                undistributedRooms,
                pagination: {
                    ...current.pagination,
                    total: activeRows.length,
                },
            };
        });
        const actionText = nextProgress === 'closed' ? '关闭' : '开启';
        const channelText = channelIds ? `关联 ${nextChannelIds.length} 个渠道` : '宿银平台分销';
        setNotice(`${room.name} 已${actionText}${channelText}`);
        setOpenMenuId(null);
    };
    const toggleDistribution = (room) => {
        const currentProgress = roomProgressMap[room.id] ?? room.progress;
        applyRoomProgress(room, currentProgress === 'closed' ? 'distributing' : 'closed');
    };
    return (_jsxs("div", { className: `distribution-list-page${loading ? ' is-loading' : ''}`, "data-testid": "distribution-list-contract", "data-provider": dashboard?.provider ?? 'api', "data-endpoint-camp-flow": distributionListEndpoints.campFlow, "data-endpoint-room-categories": distributionListEndpoints.roomCategories, "data-endpoint-undistributed": distributionListEndpoints.undistributedRoomCategories, "data-request": requestSnapshot, onClick: () => {
            if (openMenuId)
                setOpenMenuId(null);
            if (importMenuOpen)
                setImportMenuOpen(false);
        }, children: [_jsxs("section", { className: "distribution-page-main", children: [_jsxs("div", { className: "distribution-page-main__header", children: [_jsxs("div", { className: "distribution-list-tabs", role: "group", "aria-label": "\u5206\u9500\u72B6\u6001", children: [_jsx("button", { type: "button", className: filters.tab === 'distributed' ? 'is-active' : '', onClick: () => selectTab('distributed'), children: "\u5DF2\u5206\u9500" }), _jsx("button", { type: "button", className: filters.tab === 'undistributed' ? 'is-active' : '', onClick: () => selectTab('undistributed'), children: "\u672A\u5206\u9500" })] }), filters.tab === 'distributed' ? (_jsxs("div", { className: "distribution-panel__actions", children: [actionButtons.map((action, index) => (_jsx("button", { type: "button", className: index === 0 ? 'is-outline' : 'is-primary', onClick: () => navigate(action.route), children: action.label }, action.label))), _jsx("button", { type: "button", className: "is-light", onClick: () => reload(), children: "\u5237\u65B0" })] })) : null] }), filters.tab === 'undistributed' ? (_jsxs("div", { className: "distribution-undistributed-toolbar", children: [_jsx(StoreSelectControl, { className: "distribution-store-switch", label: "\u672A\u5206\u9500\u95E8\u5E97\u5207\u6362", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: filters.poiId, disabled: storeLoading, onChange: (storeId) => updateFilters((current) => ({
                                    ...current,
                                    poiId: storeId,
                                    page: 1,
                                })), settingsLabel: "\u95E8\u5E97\u8BBE\u7F6E", onSettingsClick: () => navigate('/InformationMaintenance/campInfo') }), _jsxs("div", { className: "distribution-panel__actions", children: [_jsx("button", { type: "button", className: "is-disabled", disabled: true, children: "\u4E00\u952E\u4E0A\u67B6" }), _jsxs("div", { className: "distribution-import-menu", children: [_jsx("button", { type: "button", className: "is-primary", "aria-expanded": importMenuOpen, onClick: (event) => {
                                                    event.stopPropagation();
                                                    setImportMenuOpen((current) => !current);
                                                }, children: "\u6E20\u9053\u5BFC\u5165\u5B8C\u5584" }), importMenuOpen ? (_jsxs("div", { className: "distribution-import-menu__panel", role: "menu", onClick: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setImportDialogMode('store');
                                                            setImportMenuOpen(false);
                                                        }, children: "\u5B8C\u5584\u95E8\u5E97\u4FE1\u606F" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setImportDialogMode('room');
                                                            setImportMenuOpen(false);
                                                        }, children: "\u5B8C\u5584\u623F\u578B\u4FE1\u606F" })] })) : null] })] })] })) : null, _jsxs("div", { className: "distribution-filter-bar", role: "search", "aria-label": "\u5206\u9500\u623F\u578B\u7B5B\u9009", children: [_jsxs("label", { children: [_jsx("span", { children: "\u623F\u578B" }), _jsx("input", { type: "search", placeholder: "\u641C\u7D22\u623F\u578B\u6216\u539F\u56E0", value: keywordDraft, onChange: (event) => setKeywordDraft(event.target.value), onKeyDown: (event) => {
                                            if (event.key === 'Enter')
                                                applyKeywordSearch();
                                        } })] }), _jsx("button", { type: "button", className: "is-primary", onClick: applyKeywordSearch, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "is-light", onClick: () => {
                                    setKeywordDraft('');
                                    updateFilters((current) => ({ ...current, keyword: '', page: 1 }));
                                }, children: "\u91CD\u7F6E" })] }), error ? (_jsxs("section", { className: "distribution-state distribution-state--error", role: "alert", children: [_jsx("strong", { children: "\u5206\u9500\u5217\u8868\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error }), _jsx("button", { type: "button", onClick: () => reload('分销列表已恢复'), children: "\u91CD\u8BD5" })] })) : null, !error && dashboard ? (_jsx(RoomTable, { label: filters.tab === 'distributed' ? '已分销房型表' : '未分销房型表', rows: visibleRows, channels: dashboard.channels, emptyText: filters.tab === 'distributed' ? '当前条件暂无已分销房型' : '当前条件暂无未分销房型', progressHeader: filters.tab === 'distributed' ? '分销进度' : '原因', openMenuId: openMenuId, onToggleMenu: setOpenMenuId, onToggleDistribution: toggleDistribution, onEditChannel: (room) => {
                            setDrawerRoomId(room.id);
                            setOpenMenuId(null);
                        } })) : null] }), loading ? _jsx("div", { className: "distribution-loading", children: "\u5206\u9500\u5217\u8868\u52A0\u8F7D\u4E2D..." }) : null, notice ? (_jsx("div", { className: "distribution-toast", role: "status", children: notice })) : null, selectedRoom && dashboard ? (_jsx(DistributionConfigDrawer, { room: selectedRoom, channels: dashboard.channels, onClose: () => setDrawerRoomId(null), onProgressChange: applyRoomProgress })) : null, importDialogMode ? (_jsx(ChannelImportDialog, { mode: importDialogMode, channels: dashboard?.channels ?? [], onClose: () => setImportDialogMode(null) })) : null] }));
}
function RoomTable({ label, rows, channels, emptyText, progressHeader, openMenuId, onToggleMenu, onToggleDistribution, onEditChannel, }) {
    return (_jsx("div", { className: "distribution-table-wrap", children: _jsxs("table", { className: "distribution-table distribution-table--compact", "aria-label": label, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u623F\u578B" }), _jsx("th", { children: progressHeader }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: rows.length > 0 ? (rows.map((room) => {
                        const currentProgress = room.progress;
                        const progressText = formatDistributionProgress(currentProgress, room.channelIds, channels);
                        return (_jsxs("tr", { children: [_jsx("td", { children: _jsxs("div", { className: "distribution-room-cell", children: [_jsx("img", { src: room.thumbnail, alt: "" }), _jsx("div", { className: "distribution-room-cell__content", children: _jsx("strong", { children: room.name }) })] }) }), _jsx("td", { children: _jsx("span", { className: `distribution-progress distribution-progress--${currentProgress}`, "data-progress": currentProgress, children: progressText }) }), _jsx("td", { children: _jsxs("div", { className: "distribution-more", children: [_jsx("button", { type: "button", className: "distribution-more__trigger", "aria-expanded": openMenuId === room.id, onClick: (event) => {
                                                    event.stopPropagation();
                                                    onToggleMenu(openMenuId === room.id ? null : room.id);
                                                }, children: "\u66F4\u591A" }), openMenuId === room.id ? (_jsxs("div", { className: "distribution-more__menu", role: "menu", onClick: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => onToggleDistribution(room), children: currentProgress === 'closed' ? '开启分销' : '关闭分销' }), _jsx("button", { type: "button", role: "menuitem", onClick: () => onEditChannel(room), children: "\u6E20\u9053\u7F16\u8F91" })] })) : null] }) })] }, room.id));
                    })) : (_jsx("tr", { className: "distribution-empty-row", children: _jsx("td", { colSpan: 3, children: _jsxs("div", { className: "distribution-empty", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("p", { children: emptyText })] }) }) })) })] }) }));
}
function DistributionConfigDrawer({ room, channels, onClose, onProgressChange, }) {
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
    const toggleEnabled = () => {
        const nextEnabled = !enabled;
        setEnabled(nextEnabled);
        onProgressChange(room, nextEnabled ? 'distributing' : 'closed', nextEnabled ? selectedChannelIds : []);
    };
    return (_jsx("div", { ref: layerRef, className: "distribution-config-drawer-layer", role: "presentation", onMouseDown: (event) => {
            if (event.target === layerRef.current)
                onClose();
        }, children: _jsxs("aside", { className: "distribution-config-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u5206\u9500\u914D\u7F6E", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "distribution-config-drawer__header", children: [_jsx("h2", { children: "\u5206\u9500\u914D\u7F6E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5206\u9500\u914D\u7F6E", onClick: onClose, children: "x" })] }), _jsxs("div", { className: "distribution-config-drawer__body", children: [_jsxs("section", { className: "distribution-config-switch", children: [_jsxs("div", { children: [_jsx("strong", { children: enabled ? '宿银平台分销已开启' : '宿银平台分销已关闭' }), _jsx("span", { children: room.name })] }), _jsx("button", { type: "button", className: `distribution-config-switch__toggle${enabled ? ' is-active' : ''}`, "aria-pressed": enabled, "aria-label": enabled ? '宿银平台分销已开启' : '宿银平台分销已关闭', onClick: toggleEnabled, children: _jsx("span", {}) })] }), _jsxs("section", { className: "distribution-config-card", "aria-label": "\u805A\u5408\u5206\u9500\u6E20\u9053", children: [_jsxs("div", { className: "distribution-config-card__top", children: [_jsxs("div", { children: [_jsx("h3", { children: "\u805A\u5408\u5206\u9500\u6E20\u9053" }), _jsxs("p", { children: ["\u5F53\u524D\u5206\u9500\u60C5\u51B5: ", selectedChannelIds.length, "/", channels.length] })] }), isEditing ? (_jsxs("div", { className: "distribution-config-card__actions", children: [_jsx("button", { type: "button", onClick: () => {
                                                        setDraftChannelIds(selectedChannelIds);
                                                        setIsEditing(false);
                                                    }, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-strong", onClick: () => {
                                                        const nextProgress = draftChannelIds.length > 0 ? 'distributing' : 'closed';
                                                        setSelectedChannelIds(draftChannelIds);
                                                        setEnabled(nextProgress === 'distributing');
                                                        setIsEditing(false);
                                                        onProgressChange(room, nextProgress, draftChannelIds);
                                                    }, children: "\u4FDD\u5B58" })] })) : (_jsx("button", { type: "button", onClick: () => setIsEditing(true), children: "\u7F16\u8F91" }))] }), _jsx("div", { className: "distribution-config-card__grid", children: channels.map((channel) => {
                                        const active = (isEditing ? draftChannelIds : selectedChannelIds).includes(channel.id);
                                        return (_jsxs("button", { type: "button", className: `distribution-channel-chip${active ? ' is-active' : ''}${isEditing ? ' is-editable' : ''}`, onClick: () => {
                                                if (isEditing)
                                                    toggleChannel(channel.id);
                                            }, children: [_jsx("span", { style: { ['--channel-color']: channel.color }, children: channel.shortName }), _jsx("strong", { children: channel.name })] }, channel.id));
                                    }) })] })] }), _jsxs("footer", { className: "distribution-config-drawer__footer", children: ["\u672C\u671F\u5148\u8054\u901A\u672C\u5730\u6E20\u9053 ", _jsx("span", { children: "\u5BBF\u94F6\u5E73\u53F0" }), "\uFF1B\u643A\u7A0B\u3001\u7F8E\u56E2\u3001\u9014\u5BB6\u7B49\u7B2C\u4E09\u65B9\u6E20\u9053\u5B8C\u6210\u6388\u6743\u9002\u914D\u540E\uFF0C\u4F1A\u5728\u8FD9\u91CC\u8FFD\u52A0\u6E20\u9053\u5361\u7247\u548C\u540C\u6B65\u72B6\u6001\u3002"] })] }) }));
}
function ChannelImportDialog({ mode, channels, onClose, }) {
    const layerRef = useRef(null);
    const title = mode === 'store' ? '完善门店信息' : '完善房型信息';
    const visibleChannels = channels.length > 0 ? channels : [{ id: localDistributionChannelId, name: '宿银平台' }];
    return (_jsx("div", { ref: layerRef, className: "distribution-dialog-layer", role: "presentation", onMouseDown: (event) => {
            if (event.target === layerRef.current)
                onClose();
        }, children: _jsxs("section", { className: "distribution-import-dialog", role: "dialog", "aria-modal": "true", "aria-label": title, onMouseDown: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", className: "distribution-import-dialog__close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose, children: "x" }), _jsx("p", { className: "distribution-import-dialog__intro", children: title }), _jsx("div", { className: "distribution-import-dialog__channels", children: visibleChannels.map((channel, index) => (_jsx("button", { type: "button", className: index === 0 ? 'is-active' : '', disabled: index > 0, children: channel.name }, channel.id))) }), _jsx("p", { className: "distribution-import-dialog__desc", children: "\u5F53\u524D\u7CFB\u7EDF\u8FD8\u6CA1\u6709\u5BF9\u63A5\u7B2C\u4E09\u65B9\u5E73\u53F0\uFF0C\u672C\u5730\u623F\u578B\u4F1A\u5148\u4F5C\u4E3A\u5BBF\u94F6\u5E73\u53F0\u5206\u9500\u6570\u636E\u5C55\u793A\u3002\u540E\u7EED\u63A5\u5165\u7B2C\u4E09\u65B9\u540E\uFF0C\u8FD9\u91CC\u518D\u6309\u6E20\u9053\u6388\u6743\u62C9\u53D6\u95E8\u5E97\u548C\u623F\u578B\u8D44\u6599\u3002" }), _jsx("div", { className: "distribution-import-dialog__footer", children: _jsx("button", { type: "button", className: "distribution-import-dialog__confirm", onClick: onClose, children: "\u77E5\u9053\u4E86" }) })] }) }));
}
function formatDistributionProgress(progress, channelIds, channels) {
    if (progress === 'closed')
        return '已关闭';
    const activeChannels = resolveActiveChannels(channelIds, channels);
    if (activeChannels.length === 0)
        return '未关联渠道';
    if (activeChannels.length === 1)
        return `${activeChannels[0].name}分销中`;
    return `已关联 ${activeChannels.length} 个渠道`;
}
function resolveActiveChannels(channelIds, channels) {
    const channelById = new Map(channels.map((channel) => [channel.id, channel]));
    return channelIds.map((channelId) => channelById.get(channelId)).filter((channel) => Boolean(channel));
}
function persistLocalDistributionStatus(roomId, progress, channelIds) {
    if (typeof window === 'undefined')
        return;
    const nextState = channelIds
        ? { progress, channelIds: progress === 'distributing' && channelIds.length > 0 ? channelIds : [] }
        : progress;
    try {
        const current = JSON.parse(window.localStorage.getItem(localDistributionStatusStorageKey) || '{}');
        window.localStorage.setItem(localDistributionStatusStorageKey, JSON.stringify({ ...current, [roomId]: nextState }));
    }
    catch {
        window.localStorage.setItem(localDistributionStatusStorageKey, JSON.stringify({ [roomId]: nextState }));
    }
}
