import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultOtaDetailFilters, createDefaultOtaLogFilters, fetchOtaChannelDetail, fetchOtaDashboard, fetchOtaOperationLogs, } from '../services/ota';
import './OtaPage.css';
export function OtaPage() {
    const location = useLocation();
    if (location.pathname.endsWith('/log'))
        return _jsx(OtaLogPage, {}, location.search);
    if (location.pathname.endsWith('/detail'))
        return _jsx(OtaDetailPage, {}, location.search);
    return _jsx(OtaDashboardPage, {}, location.search);
}
function OtaDashboardPage() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState({ kind: 'idle', message: '' });
    const [dialog, setDialog] = useState(null);
    useEffect(() => {
        let active = true;
        fetchOtaDashboard()
            .then((nextData) => {
            if (!active)
                return;
            setData(nextData);
            setError('');
            setFeedback((current) => (current.message ? current : { kind: 'success', message: 'OTA 渠道数据已更新' }));
        })
            .catch((caught) => {
            if (!active)
                return;
            setError(caught.message);
            setData(null);
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);
    function refreshDashboard() {
        setFeedback({ kind: 'success', message: '数据已刷新，最近同步时间已更新' });
        setLoading(true);
        setError('');
        fetchOtaDashboard()
            .then((nextData) => setData(nextData))
            .catch((caught) => setError(caught.message))
            .finally(() => setLoading(false));
    }
    const hasNoChannels = data && data.connectedChannels.length === 0 && data.pendingChannels.length === 0;
    return (_jsxs("div", { className: "ota-page", children: [_jsx("h1", { className: "sr-only-heading", children: "OTA" }), _jsxs("div", { className: "ota-page-header", children: [_jsx("div", { className: "ota-page-header__spacer", "aria-hidden": "true" }), _jsx("button", { type: "button", className: "ota-log-entry ota-log-entry--header", onClick: () => navigate('/channels/ota/log'), children: "\u64CD\u4F5C\u65E5\u5FD7" })] }), loading ? _jsx("div", { className: "ota-loading", children: "OTA \u6E20\u9053\u6570\u636E\u52A0\u8F7D\u4E2D..." }) : null, error ? (_jsxs("section", { className: "ota-state ota-state--error", role: "alert", children: [_jsx("strong", { children: "OTA \u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: refreshDashboard, children: "\u91CD\u8BD5" })] })) : null, data ? (_jsx(_Fragment, { children: hasNoChannels ? (_jsxs("section", { className: "ota-state", children: [_jsx("strong", { children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65E0\u6E20\u9053\u6570\u636E" }), _jsx("span", { children: "\u53EF\u4EE5\u8C03\u6574\u95E8\u5E97\u3001\u65E5\u671F\u6216\u8FD0\u8425\u7EF4\u5EA6\u540E\u91CD\u65B0\u67E5\u8BE2\u3002" })] })) : (_jsxs(_Fragment, { children: [_jsx(ChannelSection, { title: "\u5DF2\u76F4\u8FDE\u6E20\u9053", channels: data.connectedChannels, kind: "connected", onAuthorize: (channel) => setDialog({ type: 'authorization', channel }), onDetail: (channel) => navigate(`/channels/ota/detail?channel=${encodeURIComponent(toOtaDetailChannelParam(channel))}`) }), _jsx(ChannelSection, { title: "\u672A\u76F4\u8FDE\u6E20\u9053", channels: data.pendingChannels, kind: "pending", onAuthorize: (channel) => setDialog({ type: 'pending-guide', channel }), onDetail: (channel) => navigate(`/channels/ota/detail?channel=${encodeURIComponent(toOtaDetailChannelParam(channel))}`) })] })) })) : null, _jsx(FeedbackStatus, { feedback: feedback }), dialog?.type === 'authorization' ? (_jsx(AuthorizationDialog, { channel: dialog.channel, onClose: () => setDialog(null), onConfirm: () => {
                    setDialog(null);
                    setFeedback({ kind: 'success', message: `${dialog.channel.name} 授权流程已启动，请在渠道后台完成确认` });
                } })) : null, dialog?.type === 'pending-guide' ? (_jsx(PendingChannelGuideDialog, { channel: dialog.channel, onClose: () => setDialog(null) })) : null] }));
}
function OtaDetailPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const channelId = useMemo(() => new URLSearchParams(location.search).get('channel') || 'ctrip', [location.search]);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [filters, setFilters] = useState(() => createDefaultOtaDetailFilters());
    const [activeTab, setActiveTab] = useState('roomTypes');
    const [dialog, setDialog] = useState(null);
    useEffect(() => {
        let active = true;
        fetchOtaChannelDetail(channelId)
            .then((nextData) => {
            if (!active)
                return;
            setDetail(nextData);
            setError('');
        })
            .catch((caught) => {
            if (!active)
                return;
            setError(caught.message);
            setDetail(null);
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [channelId]);
    const roomRows = useMemo(() => {
        if (!detail)
            return [];
        return detail.roomRows.filter((row) => {
            const channelStoreMatches = filters.channelStoreId === 'all' || row.channelStoreId === filters.channelStoreId;
            const statusMatches = filters.status === 'all' || row.status === filters.status;
            const keyword = filters.keyword.trim();
            const keywordMatches = !keyword || row.channelRoomType.includes(keyword) || row.linkedRoomType.includes(keyword);
            return channelStoreMatches && statusMatches && keywordMatches;
        });
    }, [detail, filters]);
    const storeRows = useMemo(() => {
        if (!detail)
            return [];
        return detail.storeRows.filter((row) => {
            const accountMatches = filters.accountId === 'all' || row.accountId === filters.accountId;
            const keyword = filters.keyword.trim();
            const keywordMatches = !keyword || row.channelStoreName.includes(keyword) || row.hotelId.includes(keyword);
            return accountMatches && keywordMatches;
        });
    }, [detail, filters]);
    function resetFilters() {
        setFilters(createDefaultOtaDetailFilters());
        setFeedback('已重置渠道详情筛选条件');
    }
    function query() {
        setFeedback(`已查询${activeTab === 'roomTypes' ? '房型管理' : '门店管理'}数据`);
    }
    function refresh() {
        setFeedback('渠道详情数据已刷新');
        setLoading(true);
        setError('');
        fetchOtaChannelDetail(channelId)
            .then((nextData) => setDetail(nextData))
            .catch((caught) => {
            setError(caught.message);
            setDetail(null);
        })
            .finally(() => setLoading(false));
    }
    const currentTotal = activeTab === 'roomTypes' ? roomRows.length : storeRows.length;
    return (_jsxs("div", { className: "ota-page ota-page--detail", children: [_jsx("h1", { className: "sr-only-heading", children: "OTA" }), _jsxs("div", { className: "ota-breadcrumb ota-breadcrumb--detail", children: [_jsx("button", { type: "button", onClick: () => navigate('/channels/ota'), children: "OTA" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u6E20\u9053\u8BE6\u60C5" })] }), loading ? _jsx("div", { className: "ota-loading", children: "OTA \u6E20\u9053\u8BE6\u60C5\u52A0\u8F7D\u4E2D..." }) : null, error ? (_jsxs("section", { className: "ota-state ota-state--error", role: "alert", children: [_jsx("strong", { children: "OTA \u6E20\u9053\u8BE6\u60C5\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: refresh, children: "\u91CD\u8BD5" })] })) : null, detail ? (_jsxs("section", { className: "ota-detail-card", "aria-label": `${detail.channelName}渠道详情`, children: [_jsxs("header", { className: "ota-detail-head", children: [_jsxs("div", { className: "ota-detail-head__brand", children: [_jsx("div", { className: `ota-channel-logo ota-channel-logo--detail ota-channel-logo--${detail.logoTone}`, children: detail.logoText }), _jsxs("div", { children: [_jsx("h2", { children: detail.title }), _jsx("p", { children: detail.description })] })] }), _jsx("button", { type: "button", className: "ota-log-link", onClick: () => navigate('/channels/ota/log'), children: "\u64CD\u4F5C\u65E5\u5FD7" })] }), _jsxs("div", { className: "ota-detail-notice", role: "note", children: [_jsx("strong", { children: "\u6CE8\u610F\uFF1A" }), _jsx("span", { children: detail.noticeText }), detail.noticeLinkLabel ? (_jsx("button", { type: "button", className: "ota-detail-link", onClick: () => setFeedback(`${detail.noticeLinkLabel}入口已打开`), children: detail.noticeLinkLabel })) : null] }), _jsxs("div", { className: "ota-detail-tabs", role: "tablist", "aria-label": "OTA \u6E20\u9053\u8BE6\u60C5\u6807\u7B7E", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'roomTypes', className: activeTab === 'roomTypes' ? 'is-active' : '', onClick: () => setActiveTab('roomTypes'), children: "\u623F\u578B\u7BA1\u7406" }), _jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'stores', className: activeTab === 'stores' ? 'is-active' : '', onClick: () => setActiveTab('stores'), children: "\u95E8\u5E97\u7BA1\u7406" })] }), _jsxs("section", { className: `ota-detail-toolbar ${activeTab === 'stores' ? 'ota-detail-toolbar--stores' : ''}`, "aria-label": "OTA \u6E20\u9053\u8BE6\u60C5\u7B5B\u9009", children: [activeTab === 'stores' ? (_jsx("div", { className: "ota-detail-toolbar__topline", children: _jsx("button", { type: "button", className: "ota-button ota-button--primary ota-detail-sync-button", onClick: () => setDialog({ type: 'sync-store', detail }), children: "\u540C\u6B65\u95E8\u5E97" }) })) : null, _jsxs("div", { className: "ota-detail-toolbar__filters", children: [_jsxs("label", { className: "ota-detail-field", children: [_jsx("span", { children: activeTab === 'roomTypes' ? '渠道门店：' : '全部账号：' }), activeTab === 'roomTypes' ? (_jsx("select", { value: filters.channelStoreId, onChange: (event) => setFilters((current) => ({ ...current, channelStoreId: event.target.value })), children: detail.channelStoreOptions.map((option) => _jsx("option", { value: option.value, children: option.label }, option.value)) })) : (_jsx("select", { value: filters.accountId, onChange: (event) => setFilters((current) => ({ ...current, accountId: event.target.value })), children: detail.accountOptions.map((option) => _jsx("option", { value: option.value, children: option.label }, option.value)) }))] }), activeTab === 'roomTypes' ? (_jsxs("label", { className: "ota-detail-field", children: [_jsx("span", { children: "\u72B6\u6001\uFF1A" }), _jsx("select", { value: filters.status, onChange: (event) => setFilters((current) => ({ ...current, status: event.target.value })), children: detail.statusOptions.map((option) => _jsx("option", { value: option.value, children: option.label }, option.value)) })] })) : null, _jsxs("label", { className: "ota-detail-field ota-detail-field--wide", children: [_jsx("span", { children: activeTab === 'roomTypes' ? '房型名称：' : '门店名称：' }), _jsx("input", { value: filters.keyword, onChange: (event) => setFilters((current) => ({ ...current, keyword: event.target.value })), placeholder: activeTab === 'roomTypes' ? '请输入房型名称' : '请输入门店名称' })] })] }), _jsxs("div", { className: "ota-detail-actions", children: [_jsx("button", { type: "button", className: "ota-button ota-button--primary", onClick: query, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "ota-button", onClick: resetFilters, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "ota-icon-button", "aria-label": "\u5237\u65B0\u6E20\u9053\u8BE6\u60C5", onClick: refresh, children: "\u27F3" })] })] }), _jsx("div", { className: "ota-detail-table-wrap", children: activeTab === 'roomTypes' ? (_jsxs("table", { className: "ota-detail-table", "aria-label": "OTA \u623F\u578B\u7BA1\u7406\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6E20\u9053\u623F\u578B" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u5173\u8054\u623F\u578B" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: roomRows.map((row) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("strong", { children: row.channelRoomType }), _jsx("span", { children: row.channelStoreName })] }), _jsx("td", { children: row.statusLabel }), _jsx("td", { children: row.linkedRoomType }), _jsx("td", { children: _jsx("button", { type: "button", className: "ota-detail-action-link ota-detail-action-link--danger", onClick: () => setDialog({
                                                        type: 'confirm-danger',
                                                        confirmText: '您确认解除关联房源吗?',
                                                        successMessage: `已提交解除关联：${row.channelRoomType}`,
                                                    }), children: "\u89E3\u9664\u5173\u8054" }) })] }, row.id))) })] })) : (_jsxs("table", { className: "ota-detail-table ota-detail-table--stores", "aria-label": "OTA \u95E8\u5E97\u7BA1\u7406\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u9152\u5E97\u540D\u79F0" }), _jsx("th", { children: "\u9152\u5E97\u7C7B\u578B" }), _jsx("th", { children: "\u9152\u5E97ID" }), _jsx("th", { children: "\u5173\u8054\u623F\u578B" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: storeRows.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.channelStoreName }), _jsx("td", { children: row.hotelType }), _jsx("td", { children: row.hotelId }), _jsx("td", { children: row.relatedRoomTypeSummary }), _jsx("td", { children: _jsxs("div", { className: "ota-detail-action-group", children: [_jsx("button", { type: "button", className: "ota-detail-action-link", onClick: () => setFeedback(`已读取 ${row.channelStoreName} 的房源`), children: "\u8BFB\u53D6\u623F\u6E90" }), _jsx("button", { type: "button", className: "ota-detail-action-link ota-detail-action-link--danger", onClick: () => setDialog({
                                                                type: 'confirm-danger',
                                                                confirmText: '您确认断开直连房源吗?',
                                                                successMessage: `已提交断开直连：${row.channelStoreName}`,
                                                            }), children: "\u65AD\u5F00\u76F4\u8FDE" })] }) })] }, row.id))) })] })) }), _jsxs("footer", { className: "ota-detail-pagination", children: [_jsxs("span", { children: ["\u7B2C 1-", currentTotal, " \u6761/\u603B\u5171 ", currentTotal, " \u6761"] }), _jsxs("div", { className: "ota-detail-pagination__controls", children: [_jsx("button", { type: "button", disabled: true, "aria-label": "\u4E0A\u4E00\u9875", children: "\u3008" }), _jsx("button", { type: "button", className: "is-active", "aria-current": "page", children: "1" }), _jsx("button", { type: "button", disabled: true, "aria-label": "\u4E0B\u4E00\u9875", children: "\u3009" })] }), _jsx("label", { children: _jsx("span", { children: "10 \u6761/\u9875" }) })] })] })) : null, dialog?.type === 'sync-store' ? (_jsx(SyncStoreDialog, { detail: dialog.detail, onClose: () => setDialog(null), onConfirm: (form) => {
                    setDialog(null);
                    setFeedback(`已提交同步门店：${form.hotelName || '未填写酒店名称'}`);
                } })) : null, dialog?.type === 'confirm-danger' ? (_jsx(UnlinkRoomConfirmDialog, { confirmText: dialog.confirmText, onClose: () => setDialog(null), onConfirm: () => {
                    setFeedback(dialog.successMessage);
                    setDialog(null);
                } })) : null] }));
}
function OtaLogPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState(() => createDefaultOtaLogFilters());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [feedback, setFeedback] = useState({ kind: 'idle', message: '' });
    useEffect(() => {
        let active = true;
        fetchOtaOperationLogs(filters)
            .then((nextData) => {
            if (!active)
                return;
            setData(nextData);
        })
            .catch((caught) => {
            if (!active)
                return;
            setError(caught.message);
            setData(null);
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [filters]);
    function updateFilter(key, value) {
        setLoading(true);
        setError('');
        setFilters((current) => ({ ...current, [key]: value }));
    }
    return (_jsxs("div", { className: "ota-page ota-page--log", children: [_jsx("h1", { className: "sr-only-heading", children: "OTA" }), _jsxs("div", { className: "ota-breadcrumb", children: [_jsx("button", { type: "button", onClick: () => navigate('/channels/ota'), children: "OTA" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u64CD\u4F5C\u65E5\u5FD7" })] }), _jsx("section", { className: "ota-log-panel", children: _jsxs("div", { className: "ota-log-filter", children: [_jsxs("label", { className: "ota-field", children: [_jsx("span", { children: "\u6E20\u9053" }), _jsx("select", { value: filters.channelId, onChange: (event) => updateFilter('channelId', event.target.value), children: (data?.channelOptions ?? [{ value: 'all', label: '全部渠道' }]).map((option) => _jsx("option", { value: option.value, children: option.label }, option.value)) })] }), _jsxs("label", { className: "ota-field", children: [_jsx("span", { children: "\u5173\u952E\u5B57" }), _jsx("input", { value: filters.keyword, onChange: (event) => updateFilter('keyword', event.target.value), placeholder: "\u641C\u7D22\u5173\u952E\u5B57" })] }), _jsxs("label", { className: "ota-field", children: [_jsx("span", { children: "\u64CD\u4F5C\u4EBA" }), _jsx("input", { value: filters.operator, onChange: (event) => updateFilter('operator', event.target.value), placeholder: "\u641C\u7D22\u64CD\u4F5C\u4EBA" })] }), _jsxs("div", { className: "ota-log-actions", children: [_jsx("button", { type: "button", className: "ota-button", onClick: () => setFilters(createDefaultOtaLogFilters()), children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "ota-button ota-button--primary", onClick: () => setFilters((current) => ({ ...current, page: 1 })), children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "ota-link-button", onClick: () => setExpanded((value) => !value), children: expanded ? '收起' : '展开' })] }), expanded ? (_jsxs("div", { className: "ota-log-filter ota-log-filter--advanced", children: [_jsxs("label", { className: "ota-field", children: [_jsx("span", { children: "\u64CD\u4F5C\u7C7B\u578B" }), _jsx("select", { value: filters.operationType, onChange: (event) => updateFilter('operationType', event.target.value), children: (data?.operationTypeOptions ?? []).map((option) => _jsx("option", { value: option.value, children: option.label }, option.value)) })] }), _jsxs("label", { className: "ota-field", children: [_jsx("span", { children: "\u64CD\u4F5C\u72B6\u6001" }), _jsx("select", { value: filters.operationStatus, onChange: (event) => updateFilter('operationStatus', event.target.value), children: (data?.operationStatusOptions ?? []).map((option) => _jsx("option", { value: option.value, children: option.label }, option.value)) })] })] })) : null] }) }), loading ? _jsx("div", { className: "ota-loading", children: "OTA \u64CD\u4F5C\u65E5\u5FD7\u52A0\u8F7D\u4E2D..." }) : null, error ? _jsxs("section", { className: "ota-state ota-state--error", children: [_jsx("strong", { children: "OTA \u64CD\u4F5C\u65E5\u5FD7\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error })] }) : null, data ? (_jsxs(_Fragment, { children: [_jsx("section", { className: "ota-table-shell", children: _jsxs("table", { className: "ota-log-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6E20\u9053" }), _jsx("th", { children: "\u64CD\u4F5C\u7C7B\u578B" }), _jsx("th", { children: "\u64CD\u4F5C\u5185\u5BB9" }), _jsx("th", { children: "\u64CD\u4F5C\u72B6\u6001" }), _jsx("th", { children: "\u64CD\u4F5C\u4EBA" }), _jsx("th", { children: "\u64CD\u4F5C\u65F6\u95F4" })] }) }), _jsx("tbody", { children: data.rows.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.channel }), _jsx("td", { children: row.type }), _jsx("td", { children: row.content }), _jsx("td", { children: _jsx("span", { className: "ota-status-success", children: row.status }) }), _jsx("td", { children: row.operator }), _jsx("td", { children: row.time })] }, row.id))) })] }) }), _jsxs("nav", { className: "ota-pagination", "aria-label": "OTA \u65E5\u5FD7\u5206\u9875", children: [[1, 2, 3].map((pageNumber) => _jsx("button", { type: "button", className: filters.page === pageNumber ? 'is-active' : '', onClick: () => updateFilter('page', pageNumber), children: pageNumber }, pageNumber)), _jsxs("span", { children: ["\u5171 ", data.pagination.total, " \u6761"] })] })] })) : null, _jsx(FeedbackStatus, { feedback: feedback })] }));
}
function ChannelSection({ title, channels, kind, onAuthorize, onDetail, }) {
    if (channels.length === 0)
        return null;
    return (_jsxs("section", { className: "ota-channel-section", children: [_jsx("div", { className: "ota-section-title", children: _jsx("h2", { children: title }) }), _jsx("div", { className: "ota-card-grid", children: channels.map((channel, index) => (_jsxs("article", { className: `ota-channel-card ota-channel-card--${kind}`, children: [_jsxs("div", { className: "ota-channel-card__header", children: [_jsxs("div", { children: [_jsx("strong", { children: channel.name }), _jsx("span", { children: channel.relation })] }), _jsx("div", { className: `ota-channel-logo ota-channel-logo--${(index % 5) + 1}${kind === 'pending' ? ' ota-channel-logo--pending' : ''}`, children: channel.logoText })] }), _jsx("div", { className: "ota-channel-card__actions", children: kind === 'connected' ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => onAuthorize(channel), children: "\u65B0\u589E\u623F\u578B" }), _jsx("button", { type: "button", onClick: () => onDetail(channel), children: "\u6E20\u9053\u8BE6\u60C5" })] })) : (_jsx("button", { type: "button", className: "ota-primary-action", onClick: () => onAuthorize(channel), children: "\u7ACB\u5373\u5173\u8054" })) })] }, channel.id))) })] }));
}
function toOtaDetailChannelParam(channel) {
    return channel.accountId ? `${channel.id}|account:${channel.accountId}` : channel.id;
}
function FeedbackStatus({ feedback }) {
    return _jsx("div", { role: "status", className: `ota-live-status ${feedback.kind === 'error' ? 'is-error' : ''}`, children: feedback.message });
}
function AuthorizationDialog({ channel, onClose, onConfirm }) {
    const notice = channel.authorizationNotice;
    const [secondsLeft, setSecondsLeft] = useState(notice.countdownSeconds ?? 0);
    useEffect(() => {
        if (!notice.countdownSeconds || secondsLeft <= 0)
            return;
        const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [notice.countdownSeconds, secondsLeft]);
    const buttonDisabled = secondsLeft > 0;
    const buttonLabel = buttonDisabled ? `${notice.confirmLabel}(${secondsLeft}s)` : notice.confirmLabel;
    return (_jsx("div", { className: "ota-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "ota-auth-dialog", role: "dialog", "aria-modal": "true", "aria-label": notice.title, onMouseDown: (event) => event.stopPropagation(), children: [_jsx("header", { className: "ota-auth-dialog__header", children: _jsx("h3", { children: notice.title }) }), _jsxs("div", { className: "ota-auth-dialog__intro", children: [_jsx("div", { className: `ota-auth-dialog__badge ota-auth-dialog__badge--${notice.badgeTone}`, children: notice.badgeText }), _jsxs("p", { children: [notice.summary, notice.highlight ? _jsx("span", { children: notice.highlight }) : null, notice.summarySuffix] })] }), _jsxs("section", { className: "ota-auth-dialog__notice", children: [_jsx("h4", { children: notice.noticeTitle }), _jsx("div", { className: "ota-auth-dialog__notice-body", children: notice.noticeSections.map((section) => (_jsxs("div", { className: "ota-auth-dialog__notice-section", children: [_jsx("strong", { children: section.heading }), section.paragraphs.map((paragraph, index) => _jsx("p", { children: paragraph }, `${section.heading}-${index}`))] }, section.heading))) })] }), _jsxs("footer", { className: "ota-auth-dialog__footer", children: [_jsx("button", { type: "button", className: "ota-button", onClick: onClose, children: notice.cancelLabel }), _jsx("button", { type: "button", className: "ota-button ota-button--primary", disabled: buttonDisabled, onClick: onConfirm, children: buttonLabel })] })] }) }));
}
function SyncStoreDialog({ detail, onClose, onConfirm, }) {
    const [form, setForm] = useState(detail.syncStoreDefaults);
    return (_jsx("div", { className: "ota-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "ota-sync-dialog", role: "dialog", "aria-modal": "true", "aria-label": detail.syncStoreNotice.title, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "ota-sync-dialog__header", children: [_jsx("h3", { children: detail.syncStoreNotice.title }), _jsx("button", { type: "button", className: "ota-sync-dialog__close", "aria-label": "\u5173\u95ED", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "ota-sync-dialog__body", children: [_jsxs("div", { className: "ota-sync-dialog__notice", children: [_jsx("strong", { children: "\u76F4\u8FDE\u524D\u987B\u77E5\uFF1A" }), _jsx("div", { children: detail.syncStoreNotice.paragraphs.map((item) => _jsx("p", { children: item }, item)) })] }), _jsxs("div", { className: "ota-sync-dialog__form", children: [_jsxs("div", { className: "ota-sync-dialog__row", children: [_jsx("span", { className: "ota-sync-dialog__label", children: "\u5B50\u9152\u5E97\u7C7B\u578B\uFF1A" }), _jsxs("label", { className: "ota-sync-dialog__radio", children: [_jsx("input", { type: "radio", name: "hotelSubtype", checked: form.hotelSubtype === 'prepay', onChange: () => setForm((current) => ({ ...current, hotelSubtype: 'prepay' })) }), _jsx("span", { children: "\u9884\u4ED8" })] }), _jsxs("label", { className: "ota-sync-dialog__radio", children: [_jsx("input", { type: "radio", name: "hotelSubtype", checked: form.hotelSubtype === 'payAtHotel', onChange: () => setForm((current) => ({ ...current, hotelSubtype: 'payAtHotel' })) }), _jsx("span", { children: "\u73B0\u4ED8" })] })] }), _jsxs("label", { className: "ota-sync-dialog__row", children: [_jsx("span", { className: "ota-sync-dialog__label", children: "\u5B50\u9152\u5E97ID\uFF1A" }), _jsx("input", { value: form.subHotelId, onChange: (event) => setForm((current) => ({ ...current, subHotelId: event.target.value })), placeholder: "\u8BF7\u8F93\u5165\u5B50\u9152\u5E97ID" }), _jsx("span", { className: "ota-sync-dialog__hint", children: "?" })] }), _jsxs("label", { className: "ota-sync-dialog__row", children: [_jsx("span", { className: "ota-sync-dialog__label", children: "\u9152\u5E97\u540D\u79F0\uFF1A" }), _jsx("input", { value: form.hotelName, onChange: (event) => setForm((current) => ({ ...current, hotelName: event.target.value })), placeholder: "\u8BF7\u8F93\u5165\u9152\u5E97\u540D\u79F0" })] })] })] }), _jsx("footer", { className: "ota-sync-dialog__footer", children: _jsx("button", { type: "button", className: "ota-button ota-button--primary ota-sync-dialog__submit", onClick: () => onConfirm(form), children: "\u4E0B\u4E00\u6B65" }) })] }) }));
}
function PendingChannelGuideDialog({ channel, onClose, }) {
    return (_jsx("div", { className: "ota-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "ota-pending-guide", role: "dialog", "aria-modal": "true", "aria-label": `${channel.name}关联引导`, onMouseDown: (event) => event.stopPropagation(), children: [_jsx("div", { className: "ota-pending-guide__orb ota-pending-guide__orb--left", "aria-hidden": "true" }), _jsx("div", { className: "ota-pending-guide__orb ota-pending-guide__orb--right", "aria-hidden": "true" }), _jsx("button", { type: "button", className: "ota-pending-guide__close", "aria-label": "\u5173\u95ED", onClick: onClose, children: "\u00D7" }), _jsx("div", { className: "ota-pending-guide__avatar", "aria-hidden": "true", children: _jsx("div", { className: "ota-pending-guide__avatar-ring", children: _jsx("div", { className: "ota-pending-guide__avatar-core" }) }) }), _jsxs("p", { className: "ota-pending-guide__headline", children: ["\u8DEF\u5BA2\u4E91\u9886\u5148 \u201C\u8F6F\u4EF6\u5BA2\u670D\u670D\u52A1\u201D", _jsx("br", {}), "\u6DFB\u52A0\u5BA2\u670D\u5373\u53EF\u83B7\u5F97\uFF1A"] }), _jsxs("ol", { className: "ota-pending-guide__benefits", children: [_jsx("li", { children: "\u4E13\u4E1A\u4EBA\u5DE5\u57F9\u8BAD+\u64CD\u4F5C\u5B9D\u5178" }), _jsx("li", { children: "\u9152\u5E97\u6C11\u5BBF\u7ECF\u8425\u5B66\u4E60\u5E72\u8D27" }), _jsx("li", { children: "\u5F00\u901A22\u5927\u552E\u5356\u6E20\u9053\u76F4\u8FDE" })] }), _jsxs("div", { className: "ota-pending-guide__qr", "aria-label": "\u5BA2\u670D\u4E8C\u7EF4\u7801", children: [_jsx("div", { className: "ota-pending-guide__qr-grid", children: Array.from({ length: 121 }).map((_, index) => (_jsx("span", { className: `ota-pending-guide__qr-cell${isQrCellFilled(index) ? ' is-filled' : ''}` }, index))) }), _jsx("span", { className: "ota-pending-guide__qr-eye ota-pending-guide__qr-eye--tl" }), _jsx("span", { className: "ota-pending-guide__qr-eye ota-pending-guide__qr-eye--tr" }), _jsx("span", { className: "ota-pending-guide__qr-eye ota-pending-guide__qr-eye--bl" }), _jsx("span", { className: "ota-pending-guide__qr-center", children: "Q" })] }), _jsx("button", { type: "button", className: "ota-pending-guide__save", children: "\u4FDD\u5B58\u4E8C\u7EF4\u7801" })] }) }));
}
function UnlinkRoomConfirmDialog({ confirmText, onClose, onConfirm, }) {
    return (_jsx("div", { className: "ota-dialog-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "ota-inline-confirm", role: "dialog", "aria-modal": "true", "aria-label": "\u89E3\u9664\u5173\u8054\u786E\u8BA4", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "ota-inline-confirm__body", children: [_jsx("span", { className: "ota-inline-confirm__icon", children: "!" }), _jsx("strong", { children: confirmText })] }), _jsxs("div", { className: "ota-inline-confirm__actions", children: [_jsx("button", { type: "button", className: "ota-inline-confirm__button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "ota-inline-confirm__button ota-inline-confirm__button--primary", onClick: onConfirm, children: "\u786E\u5B9A" })] })] }) }));
}
function isQrCellFilled(index) {
    const row = Math.floor(index / 11);
    const col = index % 11;
    const finder = (row <= 2 && col <= 2) ||
        (row <= 2 && col >= 8) ||
        (row >= 8 && col <= 2);
    if (finder)
        return true;
    return (row * 7 + col * 11 + index) % 5 < 2;
}
