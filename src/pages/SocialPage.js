import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { defaultSocialFilters, fetchSocialOverview, } from '../services/social';
import './SocialPage.css';
function getLogoLabel(channel) {
    if (channel.id.startsWith('xiaohongshu'))
        return '小红书';
    if (channel.id.startsWith('shipinhao'))
        return '视频号';
    return '抖音';
}
export function SocialPage() {
    const navigate = useNavigate();
    const [query] = useState(defaultSocialFilters);
    const [viewModel, setViewModel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialog, setDialog] = useState(null);
    const hasLoaded = useRef(false);
    useEffect(() => {
        const controller = new AbortController();
        fetchSocialOverview(query, controller.signal)
            .then((data) => {
            setViewModel(data);
            setError('');
            hasLoaded.current = true;
        })
            .catch((loadError) => {
            if (controller.signal.aborted)
                return;
            setError(loadError.message || '社媒数据加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setIsLoading(false);
        });
        return () => controller.abort();
    }, [query]);
    const allChannels = useMemo(() => [...(viewModel?.connectedChannels ?? []), ...(viewModel?.pendingChannels ?? [])], [viewModel]);
    const requestBody = viewModel ? JSON.stringify(viewModel.requestBody) : '{}';
    function showChannelDetail(channel) {
        setDialog({ type: 'channel', channel });
    }
    function showSubscription(channel) {
        navigate('/version/applicationPayment', { state: { source: 'social-channel', channel: channel.id } });
    }
    function openChannelManage(channel) {
        if (channel.status === 'connected') {
            navigate('/channels/social/setting');
            return;
        }
        showChannelDetail(channel);
    }
    function confirmSubscription() {
        setDialog(null);
    }
    return (_jsxs("div", { className: "social-channel-page", "data-testid": "social-channel-page", "data-provider": viewModel?.provider ?? 'loading', "data-trace-id": viewModel?.traceId ?? '', "data-request-body": requestBody, children: [_jsx("h1", { className: "sr-only-heading", children: "\u793E\u5A92" }), _jsxs("section", { className: "social-channel-surface social-channel-surface--list", children: [isLoading && !hasLoaded.current ? (_jsx("div", { className: "social-feedback", role: "status", children: "\u793E\u5A92\u6570\u636E\u52A0\u8F7D\u4E2D" })) : null, error ? (_jsxs("section", { className: "social-state-panel social-state-panel--error", role: "alert", children: [_jsx("strong", { children: "\u793E\u5A92\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: "\u8BF7\u7A0D\u540E\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002" })] })) : null, viewModel ? (allChannels.length === 0 ? (_jsxs("section", { className: "social-state-panel", children: [_jsx("strong", { children: "\u6682\u65E0\u7B26\u5408\u5F53\u524D\u6761\u4EF6\u7684\u793E\u5A92\u6E20\u9053" }), _jsx("span", { children: "\u5F53\u524D\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u6E20\u9053\u5361\u7247\u3002" })] })) : (_jsxs("div", { className: "social-channel-list", children: [_jsx(ChannelSection, { title: "\u5DF2\u76F4\u8FDE\u6E20\u9053", channels: viewModel.connectedChannels, onDetail: openChannelManage }), _jsx(ChannelSection, { title: "\u672A\u76F4\u8FDE\u6E20\u9053", channels: viewModel.pendingChannels, onDetail: openChannelManage, onSubscribe: showSubscription })] }))) : null] }), dialog?.type === 'channel' ? _jsx(ChannelDialog, { channel: dialog.channel, onClose: () => setDialog(null) }) : null, dialog?.type === 'subscription' ? (_jsx(SubscriptionDialog, { channel: dialog.channel, onConfirm: confirmSubscription, onClose: () => setDialog(null) })) : null] }));
}
function PanelTitle({ title }) {
    return (_jsxs("div", { className: "social-channel-section__title", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("h2", { children: title })] }));
}
function ChannelSection({ title, channels, onDetail, onSubscribe, }) {
    if (channels.length === 0)
        return null;
    return (_jsxs("section", { className: "social-channel-section", children: [_jsx(PanelTitle, { title: title }), _jsx("div", { className: channels.length === 1 ? 'social-channel-grid social-channel-grid--single' : 'social-channel-grid', children: channels.map((channel) => (_jsxs("article", { className: `social-channel-card social-channel-card--${channel.status}`, "aria-label": channel.name, tabIndex: 0, onClick: () => onDetail(channel), onKeyDown: (event) => {
                        if (event.key === 'Enter')
                            onDetail(channel);
                    }, children: [_jsxs("div", { className: "social-channel-card__meta", children: [_jsx("strong", { children: channel.name }), channel.status === 'connected' ? (_jsxs(_Fragment, { children: [_jsx("span", { children: channel.relation }), _jsxs("span", { children: ["\u652F\u6301\uFF1A", channel.support.join('、') || '渠道运营'] })] })) : null] }), _jsx("div", { className: `social-channel-card__logo social-channel-card__logo--${channel.accent}`, children: getLogoLabel(channel) }), _jsx("div", { className: "social-channel-card__actions", children: _jsx("button", { type: "button", onClick: (event) => {
                                    event.stopPropagation();
                                    if (channel.status === 'pending' && onSubscribe)
                                        onSubscribe(channel);
                                    else
                                        onDetail(channel);
                                }, children: channel.action }) })] }, channel.id))) })] }));
}
function ChannelDialog({ channel, onClose }) {
    return (_jsx("div", { className: "social-modal-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "social-modal", role: "dialog", "aria-modal": "true", "aria-label": `${channel.name}渠道详情`, onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsxs("h3", { children: [channel.name, "\u6E20\u9053\u8BE6\u60C5"] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u6E20\u9053\u72B6\u6001" }), _jsx("dd", { children: channel.status === 'connected' ? '已直连' : '待开通' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5173\u8054\u623F\u578B" }), _jsxs("dd", { children: [channel.linkedRoomTypeCount, "/", channel.roomTypeCount] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u652F\u6301\u4E1A\u52A1" }), _jsx("dd", { children: channel.support.join('、') || '渠道运营' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4ECA\u65E5\u8BA2\u5355" }), _jsx("dd", { children: channel.dailyOrders })] })] }), _jsx("div", { className: "social-modal__tasks", children: channel.pendingTasks.map((task) => (_jsx("span", { children: task }, task))) }), _jsx("footer", { children: _jsx("button", { type: "button", onClick: onClose, children: "\u5173\u95ED\u8BE6\u60C5" }) })] }) }));
}
function SubscriptionDialog({ channel, onClose, onConfirm, }) {
    return (_jsx("div", { className: "social-modal-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "social-modal social-modal--small", role: "dialog", "aria-modal": "true", "aria-label": `${channel.name}订阅方案`, onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsxs("h3", { children: [channel.name, "\u8BA2\u9605\u65B9\u6848"] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BA2\u9605\u65B9\u6848", onClick: onClose, children: "\u00D7" })] }), _jsx("p", { children: "\u5F00\u901A\u540E\u53EF\u7BA1\u7406\u6E20\u9053\u5185\u5BB9\u3001\u6D3B\u52A8\u5E93\u5B58\u548C\u8BA2\u5355\u627F\u63A5\u3002" }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "social-modal__primary", onClick: onConfirm, children: "\u786E\u8BA4\u8BA2\u9605" })] })] }) }));
}
export function SocialSettingPage() {
    const tabs = ['账号管理', '门店管理', '日历房型', '预售房型'];
    const [activeTab, setActiveTab] = useState('账号管理');
    const [statusFilter, setStatusFilter] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [draftKeyword, setDraftKeyword] = useState('');
    const [refreshTick, setRefreshTick] = useState(0);
    const [storeAccountFilter, setStoreAccountFilter] = useState('all');
    const [storeKeyword, setStoreKeyword] = useState('');
    const [calendarChannelFilter, setCalendarChannelFilter] = useState('all');
    const [calendarAuditFilter, setCalendarAuditFilter] = useState('all');
    const [calendarShelfFilter, setCalendarShelfFilter] = useState('all');
    const [calendarKeyword, setCalendarKeyword] = useState('');
    const [presaleChannelFilter, setPresaleChannelFilter] = useState('all');
    const [presaleAuditFilter, setPresaleAuditFilter] = useState('all');
    const [presaleShelfFilter, setPresaleShelfFilter] = useState('all');
    const [presaleKeyword, setPresaleKeyword] = useState('');
    const [actionDialog, setActionDialog] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [selectedSolution, setSelectedSolution] = useState('presale');
    const accountRows = [
        {
            id: '7370207731854149643',
            accountId: '1820360983796908034',
            storeCount: '0',
            authorizations: [
                { name: '酒店行业预售券解决方案', status: '已发布' },
                { name: '酒店行业日历房解决方案', status: '审核中' },
            ],
        },
    ];
    const filteredAccountRows = accountRows.filter((row) => {
        const matchesStatus = statusFilter === 'all' ||
            row.authorizations.some((item) => (statusFilter === 'published' ? item.status === '已发布' : item.status === '审核中'));
        const matchesKeyword = keyword.trim() === '' || row.accountId.includes(keyword.trim()) || row.id.includes(keyword.trim());
        return matchesStatus && matchesKeyword;
    });
    const accountCountText = filteredAccountRows.length > 0 ? `第 1-${filteredAccountRows.length} 条/总共 ${filteredAccountRows.length} 条` : '第 0-0 条/总共 0 条';
    useEffect(() => {
        if (!toastMessage)
            return;
        const timer = window.setTimeout(() => setToastMessage(''), 1800);
        return () => window.clearTimeout(timer);
    }, [toastMessage]);
    function handleSearch() {
        setKeyword(draftKeyword.trim());
    }
    function handleReset() {
        setStatusFilter('all');
        setDraftKeyword('');
        setKeyword('');
    }
    function handlePullRoomType() {
        setToastMessage('刷新成功');
    }
    function handleDisconnect(authorizationName) {
        setActionDialog({ type: 'disconnect', authorizationName });
    }
    function confirmDisconnect() {
        setActionDialog(null);
        setToastMessage('操作成功');
    }
    const tabView = {
        账号管理: (_jsxs(_Fragment, { children: [_jsxs("div", { className: "social-detail-toolbar", children: [_jsxs("div", { className: "social-detail-toolbar__filters", children: [_jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u5BA1\u6838\u72B6\u6001\uFF1A" }), _jsxs("select", { "aria-label": "\u5BA1\u6838\u72B6\u6001", value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "all", children: "\u5168\u90E8" }), _jsx("option", { value: "published", children: "\u5DF2\u53D1\u5E03" }), _jsx("option", { value: "reviewing", children: "\u5BA1\u6838\u4E2D" })] })] }), _jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u8D26\u53F7\uFF1A" }), _jsx("input", { "aria-label": "\u8D26\u53F7", value: draftKeyword, onChange: (event) => setDraftKeyword(event.target.value) })] })] }), _jsxs("div", { className: "social-detail-toolbar__actions", children: [_jsx("button", { type: "button", className: "social-detail-toolbar__primary", onClick: () => setActionDialog({ type: 'addAccount' }), children: "\u6DFB\u52A0\u8D26\u53F7" }), _jsx("button", { type: "button", className: "social-detail-toolbar__submit", onClick: handleSearch, children: "\u67E5 \u8BE2" }), _jsx("button", { type: "button", className: "social-detail-toolbar__outline", onClick: handleReset, children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", className: "social-detail-toolbar__refresh", "aria-label": "\u5237\u65B0\u8D26\u53F7\u7BA1\u7406", onClick: () => setRefreshTick((value) => value + 1), children: "\u21BB" })] })] }), _jsx("div", { className: "social-detail-table-wrap", "data-refresh-tick": refreshTick, children: _jsxs("table", { className: "social-detail-table", "aria-label": "\u793E\u5A92\u8D26\u53F7\u7BA1\u7406\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6E20\u9053\u8D26\u53F7id" }), _jsx("th", { children: "\u8D26\u53F7ID" }), _jsx("th", { children: "\u95E8\u5E97" }), _jsx("th", { children: "\u6388\u6743\u4E1A\u52A1" }), _jsx("th", { children: "\u5BA1\u6838\u72B6\u6001" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: filteredAccountRows.length > 0 ? (filteredAccountRows.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.id }), _jsx("td", { children: row.accountId }), _jsx("td", { children: row.storeCount }), _jsx("td", { children: _jsx("div", { className: "social-detail-stack", children: row.authorizations.map((item) => (_jsx("span", { children: item.name }, item.name))) }) }), _jsx("td", { children: _jsx("div", { className: "social-detail-stack", children: row.authorizations.map((item) => (_jsx("span", { className: item.status === '审核中' ? 'social-detail-status social-detail-status--reviewing' : 'social-detail-status', children: item.status }, `${item.name}-${item.status}`))) }) }), _jsx("td", { children: _jsxs("div", { className: "social-detail-stack social-detail-stack--actions", children: [_jsxs("div", { className: "social-detail-actions", children: [_jsx("button", { type: "button", className: "social-detail-actions__danger", onClick: () => handleDisconnect(row.authorizations[0].name), children: "\u65AD\u5F00\u76F4\u8FDE" }), _jsx("button", { type: "button", onClick: handlePullRoomType, children: "\u62C9\u53D6\u623F\u578B" })] }), _jsxs("div", { className: "social-detail-actions", children: [_jsx("button", { type: "button", className: "social-detail-actions__danger", onClick: () => handleDisconnect(row.authorizations[1].name), children: "\u65AD\u5F00\u76F4\u8FDE" }), _jsx("button", { type: "button", onClick: handlePullRoomType, children: "\u62C9\u53D6\u623F\u578B" }), _jsx("button", { type: "button", children: "\u6388\u6743\u65E5\u5386\u623F" })] })] }) })] }, row.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, children: _jsx("div", { className: "social-detail-empty", children: "\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u8D26\u53F7\u8BB0\u5F55" }) }) })) })] }) }), _jsxs("footer", { className: "social-detail-pagination", children: [_jsx("span", { children: accountCountText }), _jsxs("div", { className: "social-detail-pagination__controls", children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true, children: "\u2039" }), _jsx("button", { type: "button", className: "is-active", children: "1" }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: true, children: "\u203A" }), _jsx("button", { type: "button", className: "social-detail-pagination__size", children: "10 \u6761/\u9875" })] })] })] })),
        门店管理: (_jsx(SocialDetailScaffold, { intro: "\u60A8\u5DF2\u5F00\u901A\u6296\u97F3\u6765\u5BA2\u76F4\u8FDE\uFF0C\u53EF\u5728\u4E0B\u65B9\u3010\u95E8\u5E97\u7BA1\u7406\u3011\u5904\u8BFB\u53D6\u6E20\u9053\u95E8\u5E97\uFF0C\u5E76\u548C\u8DEF\u5BA2\u4E91\u95E8\u5E97\u8FDB\u884C\u5173\u8054\u64CD\u4F5C\uFF0C\u5B8C\u6210\u3010\u95E8\u5E97\u5173\u8054\u3011\u540E\u53EF\u8FDB\u884C\u623F\u578B\u7BA1\u7406\u3002", primaryAction: "\u8BFB\u53D6\u95E8\u5E97", onPrimaryAction: handlePullRoomType, filters: _jsxs(_Fragment, { children: [_jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u5168\u90E8\u8D26\u53F7\uFF1A" }), _jsx("select", { value: storeAccountFilter, onChange: (event) => setStoreAccountFilter(event.target.value), children: _jsx("option", { value: "all", children: "\u5168\u90E8" }) })] }), _jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u95E8\u5E97\u540D\u79F0:" }), _jsx("input", { value: storeKeyword, placeholder: "\u8BF7\u8F93\u5165\u95E8\u5E97\u540D\u79F0", onChange: (event) => setStoreKeyword(event.target.value) })] })] }), columns: ['渠道门店', '渠道账号', '房型数量', '路客云门店关联状态', '关联路客云门店', '操作'] })),
        日历房型: (_jsx(SocialDetailScaffold, { intro: "\u60A8\u5DF2\u5F00\u901A\u6296\u97F3\u6765\u5BA2\u76F4\u8FDE\uFF0C\u8BF7\u5728\u3010\u95E8\u5E97\u7BA1\u7406\u3011\u5904\u5173\u8054\u95E8\u5E97\u540E\uFF0C\u5728\u4E0B\u65B9\u3010\u65E5\u5386\u623F\u578B\u3011\u5904\u64CD\u4F5C\u3010\u540C\u6B65\u623F\u578B\u3011\uFF1B", primaryAction: "\u540C\u6B65\u623F\u578B", onPrimaryAction: () => setActionDialog({ type: 'syncRoomType', tab: '日历房型' }), filters: _jsxs(_Fragment, { children: [_jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u6E20\u9053\u95E8\u5E97:" }), _jsx("select", { value: calendarChannelFilter, onChange: (event) => setCalendarChannelFilter(event.target.value), children: _jsx("option", { value: "all", children: "\u5168\u90E8" }) })] }), _jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u5BA1\u6838\u72B6\u6001:" }), _jsx("select", { value: calendarAuditFilter, onChange: (event) => setCalendarAuditFilter(event.target.value), children: _jsx("option", { value: "all", children: "\u5168\u90E8" }) })] }), _jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u4E0A\u67B6\u72B6\u6001:" }), _jsx("select", { value: calendarShelfFilter, onChange: (event) => setCalendarShelfFilter(event.target.value), children: _jsx("option", { value: "all", children: "\u5168\u90E8" }) })] }), _jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u623F\u578B\u540D\u79F0:" }), _jsx("input", { value: calendarKeyword, placeholder: "\u8BF7\u8F93\u5165\u623F\u578B\u540D\u79F0", onChange: (event) => setCalendarKeyword(event.target.value) })] })] }), columns: ['房型', '门店', '关联账号', '房型图片', '上架状态', '审核状态', '路客云房型关联状态', '关联路客云房型', '操作'] })),
        预售房型: (_jsx(SocialDetailScaffold, { intro: "\u60A8\u5DF2\u5F00\u901A\u6296\u97F3\u6765\u5BA2\u76F4\u8FDE\uFF0C\u8BF7\u5728\u3010\u95E8\u5E97\u7BA1\u7406\u3011\u5904\u5173\u8054\u95E8\u5E97\u540E\uFF0C\u5728\u4E0B\u65B9\u3010\u9884\u552E\u623F\u578B\u3011\u5904\u64CD\u4F5C\u3010\u540C\u6B65\u623F\u578B\u3011\u3002", notes: [
                '注：1. 同步预售房型至抖音来客后，需要在抖音来客创建预售券关联同步的预售房型，才可实现房态、订单同步。',
                '2. 预售房型不支持设置房型价格，因此在【价格库存】无法设置预售房型价格；',
            ], primaryAction: "\u540C\u6B65\u623F\u578B", onPrimaryAction: () => setActionDialog({ type: 'syncRoomType', tab: '预售房型' }), filters: _jsxs(_Fragment, { children: [_jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u6E20\u9053\u95E8\u5E97:" }), _jsx("select", { value: presaleChannelFilter, onChange: (event) => setPresaleChannelFilter(event.target.value), children: _jsx("option", { value: "all", children: "\u5168\u90E8" }) })] }), _jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u5BA1\u6838\u72B6\u6001:" }), _jsx("select", { value: presaleAuditFilter, onChange: (event) => setPresaleAuditFilter(event.target.value), children: _jsx("option", { value: "all", children: "\u5168\u90E8" }) })] }), _jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u4E0A\u67B6\u72B6\u6001:" }), _jsx("select", { value: presaleShelfFilter, onChange: (event) => setPresaleShelfFilter(event.target.value), children: _jsx("option", { value: "all", children: "\u5168\u90E8" }) })] }), _jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u623F\u578B\u540D\u79F0:" }), _jsx("input", { value: presaleKeyword, placeholder: "\u8BF7\u8F93\u5165\u623F\u578B\u540D\u79F0", onChange: (event) => setPresaleKeyword(event.target.value) })] })] }), columns: ['房型', '门店', '关联账号', '房型图片', '上架状态', '审核状态', '路客云房型关联状态', '关联路客云房型', '操作'] })),
    };
    return (_jsxs("div", { className: "social-channel-page social-channel-page--detail", "data-testid": "social-channel-detail", children: [_jsx("h1", { className: "sr-only-heading", children: "\u793E\u5A92" }), _jsxs("section", { className: "social-detail-surface", children: [toastMessage ? (_jsx("div", { className: "social-inline-toast", role: "status", "aria-live": "polite", children: toastMessage })) : null, _jsxs("div", { className: "social-detail-breadcrumb", children: [_jsx(Link, { to: "/channels/social", children: "\u793E\u5A92" }), _jsx("span", { children: "/" }), _jsx("strong", { children: "\u6E20\u9053\u8BE6\u60C5" })] }), _jsxs("section", { className: "social-detail-card", children: [_jsx("header", { className: "social-detail-card__head", children: _jsxs("div", { children: [_jsx("h2", { children: "\u6296\u97F3\u6765\u5BA2\u76F4\u8FDE" }), _jsx("p", { children: "\u60A8\u5DF2\u5F00\u901A\u6296\u97F3\u6765\u5BA2\u76F4\u8FDE\uFF0C\u8BF7\u5728\u8D26\u53F7\u5BA1\u6838\u901A\u8FC7\u540E\u8FDB\u884C\u95E8\u5E97\u7BA1\u7406\u3001\u623F\u578B\u7BA1\u7406\u64CD\u4F5C\u3002" })] }) }), _jsx("div", { className: "social-detail-tabs", role: "tablist", "aria-label": "\u793E\u5A92\u6E20\u9053\u8BE6\u60C5", children: tabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab, className: activeTab === tab ? 'is-active' : '', onClick: () => setActiveTab(tab), children: tab }, tab))) }), tabView[activeTab]] })] }), actionDialog?.type === 'disconnect' ? (_jsx(DisconnectConfirmDialog, { authorizationName: actionDialog.authorizationName, onClose: () => setActionDialog(null), onConfirm: confirmDisconnect })) : null, actionDialog?.type === 'addAccount' ? (_jsx(AddAccountDialog, { selectedSolution: selectedSolution, onChangeSolution: setSelectedSolution, onClose: () => setActionDialog(null), onConfirm: () => setActionDialog(null) })) : null, actionDialog?.type === 'syncRoomType' ? (_jsx(SyncRoomTypeDialog, { title: "\u540C\u6B65\u623F\u578B\u81F3\u6E20\u9053", onClose: () => setActionDialog(null), onConfirm: () => setActionDialog(null) })) : null] }));
}
function SocialDetailScaffold({ intro, notes, primaryAction, onPrimaryAction, filters, columns, }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "social-detail-subtoolbar", children: [_jsx("p", { className: "social-detail-subtoolbar__intro", children: intro }), notes?.length ? (_jsx("div", { className: "social-detail-subtoolbar__notes", children: notes.map((note) => (_jsx("p", { children: note }, note))) })) : null] }), _jsxs("div", { className: "social-detail-toolbar", children: [_jsx("div", { className: "social-detail-toolbar__filters", children: filters }), _jsxs("div", { className: "social-detail-toolbar__actions", children: [_jsx("button", { type: "button", className: "social-detail-toolbar__primary", onClick: onPrimaryAction, children: primaryAction }), _jsx("button", { type: "button", className: "social-detail-toolbar__submit", children: "\u67E5 \u8BE2" }), _jsx("button", { type: "button", className: "social-detail-toolbar__outline", children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", className: "social-detail-toolbar__refresh", "aria-label": `刷新${primaryAction}`, children: "\u21BB" })] })] }), _jsx("div", { className: "social-detail-table-wrap", children: _jsxs("table", { className: "social-detail-table", "aria-label": columns.join(' / '), children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: _jsx("tr", { children: _jsx("td", { colSpan: columns.length, children: _jsxs("div", { className: "social-detail-empty", children: [_jsx("span", { className: "social-detail-empty__icon", "aria-hidden": "true" }), _jsx("span", { className: "social-detail-empty__text", children: "\u6682\u65E0\u6570\u636E" })] }) }) }) })] }) })] }));
}
function DisconnectConfirmDialog({ authorizationName, onClose, onConfirm, }) {
    return (_jsx("div", { className: "social-confirm-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "social-confirm-dialog", role: "dialog", "aria-modal": "true", "aria-label": `断开直连确认：${authorizationName}`, onClick: (event) => event.stopPropagation(), children: [_jsx("div", { className: "social-confirm-dialog__body", children: "\u662F\u5426\u786E\u8BA4\u65AD\u5F00\u76F4\u8FDE?" }), _jsxs("footer", { className: "social-confirm-dialog__footer", children: [_jsx("button", { type: "button", className: "social-confirm-dialog__ghost", onClick: onClose, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "social-confirm-dialog__primary", onClick: onConfirm, children: "\u786E \u5B9A" })] })] }) }));
}
function AddAccountDialog({ selectedSolution, onChangeSolution, onClose, onConfirm, }) {
    return (_jsx("div", { className: "social-confirm-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "social-selection-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u9009\u62E9\u6296\u97F3\u89E3\u51B3\u65B9\u6848", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "social-selection-dialog__header", children: [_jsx("h3", { children: "\u9009\u62E9\u6296\u97F3\u89E3\u51B3\u65B9\u6848" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u9009\u62E9\u6296\u97F3\u89E3\u51B3\u65B9\u6848", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "social-selection-dialog__body", children: [_jsxs("label", { className: "social-radio-option", children: [_jsx("input", { type: "radio", name: "douyin-solution", value: "presale", checked: selectedSolution === 'presale', onChange: (event) => onChangeSolution(event.target.value) }), _jsx("span", { children: "\u9152\u5E97\u884C\u4E1A\u9884\u552E\u5238\u89E3\u51B3\u65B9\u6848" })] }), _jsxs("label", { className: "social-radio-option", children: [_jsx("input", { type: "radio", name: "douyin-solution", value: "calendar", checked: selectedSolution === 'calendar', onChange: (event) => onChangeSolution(event.target.value) }), _jsx("span", { children: "\u9152\u5E97\u884C\u4E1A\u65E5\u5386\u623F\u89E3\u51B3\u65B9\u6848" })] })] }), _jsxs("footer", { className: "social-selection-dialog__footer", children: [_jsx("button", { type: "button", className: "social-confirm-dialog__ghost", onClick: onClose, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "social-confirm-dialog__primary", onClick: onConfirm, children: "\u786E \u5B9A" })] })] }) }));
}
function SyncRoomTypeDialog({ title, onClose, onConfirm, }) {
    return (_jsx("div", { className: "social-confirm-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "social-sync-dialog", role: "dialog", "aria-modal": "true", "aria-label": title, onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "social-selection-dialog__header", children: [_jsx("h3", { children: title }), _jsx("button", { type: "button", "aria-label": `关闭${title}`, onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "social-sync-dialog__body", children: [_jsxs("div", { className: "social-sync-dialog__toolbar", children: [_jsxs("label", { className: "social-detail-field", children: [_jsx("span", { children: "\u6E20\u9053\u95E8\u5E97:" }), _jsx("select", { defaultValue: "none", children: _jsx("option", { value: "none", children: "\u8BF7\u9009\u62E9\u6E20\u9053\u95E8\u5E97" }) })] }), _jsx("span", { className: "social-sync-dialog__warning", children: "\u6682\u65E0\u6E20\u9053\u95E8\u5E97" })] }), _jsx("div", { className: "social-sync-dialog__alert", children: "\u672A\u9009\u62E9\u4EFB\u4F55\u623F\u578B" }), _jsxs("div", { className: "social-sync-dialog__table", children: [_jsxs("div", { className: "social-sync-dialog__table-head", children: [_jsx("span", {}), _jsx("span", { children: "\u623F\u578B" }), _jsx("span", { children: "\u623F\u578B\u56FE\u7247" }), _jsx("span", { children: "\u539F\u56E0" })] }), _jsxs("div", { className: "social-sync-dialog__empty", children: [_jsx("span", { className: "social-detail-empty__icon", "aria-hidden": "true" }), _jsx("span", { className: "social-detail-empty__text", children: "\u6682\u65E0\u6570\u636E" })] })] })] }), _jsxs("footer", { className: "social-sync-dialog__footer", children: [_jsx("button", { type: "button", className: "social-confirm-dialog__ghost", onClick: onClose, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "social-sync-dialog__disabled", onClick: onConfirm, disabled: true, children: "\u786E \u5B9A" })] })] }) }));
}
