import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createWechatServiceExportTask, fetchWechatServiceDashboard, getDefaultWechatServiceOptions, resolveWechatServiceRuntimeConfig, } from '../services/wechatService';
import './WechatServicePage.css';
const defaultCampId = '1796067693589061634';
const defaultStartDate = '2026-05-18';
const defaultEndDate = '2026-05-18';
export function WechatServicePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const runtimeConfig = useMemo(() => resolveWechatServiceRuntimeConfig({ search: location.search }), [location.search]);
    const campId = new URLSearchParams(location.search).get('campId') || defaultCampId;
    const [filters, setFilters] = useState({
        channel: '',
        status: '',
        keyword: '',
    });
    const [view, setView] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const options = view?.filterOptions ?? getDefaultWechatServiceOptions();
    const buildQuery = useCallback((nextFilters) => ({
        ...runtimeConfig,
        campId,
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        channel: nextFilters.channel,
        status: nextFilters.status,
        keyword: nextFilters.keyword.trim(),
        page: 1,
        pageSize: 8,
    }), [campId, runtimeConfig]);
    const loadDashboard = useCallback(async (nextFilters, options) => {
        const controller = new AbortController();
        setIsLoading(true);
        setError('');
        try {
            const result = await fetchWechatServiceDashboard(buildQuery(nextFilters), controller.signal);
            setView(result.view);
            if (options?.feedback) {
                setFeedback({ tone: 'success', text: options.feedback });
            }
        }
        catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : '微信客服数据加载失败，请重试');
        }
        finally {
            setIsLoading(false);
        }
        return () => controller.abort();
    }, [buildQuery]);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadDashboard({ channel: '', status: '', keyword: '' });
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadDashboard]);
    const selectedChannelLabel = labelFor(options.channels, filters.channel);
    const selectedStatusLabel = labelFor(options.statuses, filters.status);
    const averageReply = formatSeconds(view?.summary.averageReplySeconds ?? 0);
    function updateFilter(key, value) {
        setFilters((current) => ({ ...current, [key]: value }));
        setOpenDropdown(null);
    }
    function handleQuery() {
        void loadDashboard(filters, { feedback: '微信客服数据已更新' });
    }
    function handleReset() {
        const nextFilters = { channel: '', status: '', keyword: '' };
        setFilters(nextFilters);
        void loadDashboard(nextFilters, { feedback: '筛选条件已重置' });
    }
    function handleRefresh() {
        void loadDashboard(filters, { feedback: '微信客服数据已刷新' });
    }
    function handleExport() {
        createWechatServiceExportTask(buildQuery(filters));
        setFeedback({ tone: 'success', text: '导出任务已创建，可在任务中心查看进度' });
    }
    function handleFollowUp() {
        setFeedback({ tone: 'success', text: '会话已标记为已跟进' });
    }
    return (_jsxs("div", { className: "wechat-service-page", "data-testid": "wechat-service-page", children: [_jsxs("header", { className: "wechat-service-header", children: [_jsxs("div", { children: [_jsx("span", { className: "wechat-service-eyebrow", children: "SCRM / \u5BA2\u6237\u6C9F\u901A" }), _jsx("h1", { children: "\u5FAE\u4FE1\u5BA2\u670D\u8FD0\u8425\u53F0" }), _jsx("p", { children: "\u7EDF\u4E00\u67E5\u770B\u4F01\u4E1A\u5FAE\u4FE1\u5BA2\u670D\u8D26\u53F7\u3001\u6E20\u9053\u54A8\u8BE2\u3001\u5F85\u5904\u7406\u4F1A\u8BDD\u548C\u5165\u4F4F\u6C9F\u901A\u72B6\u6001\u3002" })] }), _jsxs("div", { className: "wechat-service-header__actions", children: [_jsx("button", { type: "button", onClick: () => navigate('/scrm/wechatService/receptionConfig'), children: "\u63A5\u5F85\u914D\u7F6E" }), _jsx("button", { type: "button", onClick: () => navigate('/scrm/sidebar/preview'), children: "\u804A\u5929\u5DE5\u5177\u680F" })] })] }), _jsxs("section", { className: "wechat-service-filters", "aria-label": "\u5FAE\u4FE1\u5BA2\u670D\u7B5B\u9009", children: [_jsx(FilterMenu, { label: selectedChannelLabel, options: options.channels, isOpen: openDropdown === 'channel', onToggle: () => setOpenDropdown(openDropdown === 'channel' ? null : 'channel'), onSelect: (value) => updateFilter('channel', value) }), _jsx(FilterMenu, { label: selectedStatusLabel, options: options.statuses, isOpen: openDropdown === 'status', onToggle: () => setOpenDropdown(openDropdown === 'status' ? null : 'status'), onSelect: (value) => updateFilter('status', value) }), _jsxs("label", { className: "wechat-service-search", children: [_jsx("span", { children: "\u5173\u952E\u8BCD" }), _jsx("input", { "aria-label": "\u4F1A\u8BDD\u5173\u952E\u8BCD", value: filters.keyword, placeholder: "\u641C\u7D22\u5BA2\u6237\u3001\u8BA2\u5355\u6216\u6D88\u606F", onChange: (event) => setFilters((current) => ({ ...current, keyword: event.target.value })) })] }), _jsxs("div", { className: "wechat-service-filter-actions", children: [_jsx("button", { type: "button", disabled: isLoading, onClick: handleQuery, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", disabled: isLoading, onClick: handleReset, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", disabled: isLoading, onClick: handleRefresh, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: handleExport, children: "\u5BFC\u51FA" })] })] }), feedback ? (_jsx("div", { className: `wechat-service-feedback is-${feedback.tone}`, role: "status", children: feedback.text })) : null, error ? (_jsxs("section", { className: "wechat-service-alert", role: "alert", children: [_jsx("strong", { children: error }), _jsx("button", { type: "button", onClick: handleRefresh, children: "\u91CD\u8BD5" })] })) : null, _jsxs("section", { className: "wechat-service-metrics", "aria-label": "\u5FAE\u4FE1\u5BA2\u670D\u6838\u5FC3\u6307\u6807", children: [_jsx(MetricCard, { label: "\u4ECA\u65E5\u4F1A\u8BDD", value: view?.summary.todaySessions ?? 0, onClick: () => setSelectedMetric('今日会话') }), _jsx(MetricCard, { label: "\u5F85\u5904\u7406\u4F1A\u8BDD", value: view?.summary.pendingSessions ?? 0, onClick: () => setSelectedMetric('待处理会话') }), _jsx(MetricCard, { label: "\u5E73\u5747\u54CD\u5E94", value: averageReply, onClick: () => setSelectedMetric('平均响应') }), _jsx(MetricCard, { label: "\u8F6C\u5316\u7EBF\u7D22", value: view?.summary.conversionLeads ?? 0, onClick: () => setSelectedMetric('转化线索') })] }), _jsxs("main", { className: "wechat-service-grid", children: [_jsxs("section", { className: "wechat-service-section", "aria-label": "\u5BA2\u670D\u8D26\u53F7", children: [_jsxs("div", { className: "wechat-service-section__head", children: [_jsx("h2", { children: "\u5BA2\u670D\u8D26\u53F7" }), _jsxs("span", { children: [view?.summary.responseRate ?? '0%', " \u54CD\u5E94\u7387"] })] }), _jsx("div", { className: "wechat-service-account-list", children: (view?.accounts ?? []).map((account) => (_jsxs("button", { type: "button", className: "wechat-service-account", onClick: () => setSelectedAccount(account), children: [_jsxs("span", { children: [_jsx("strong", { children: account.name }), _jsx("em", { children: accountStatusText[account.status] })] }), _jsxs("span", { children: ["\u4ECA\u65E5\u4F1A\u8BDD ", account.todaySessions] }), _jsx("span", { children: formatSeconds(account.averageReplySeconds) }), _jsxs("span", { children: ["\u8BC4\u5206 ", account.serviceScore] })] }, account.id))) })] }), _jsxs("section", { className: "wechat-service-section", "aria-label": "\u5F85\u529E\u63D0\u9192", children: [_jsxs("div", { className: "wechat-service-section__head", children: [_jsx("h2", { children: "\u5F85\u529E\u63D0\u9192" }), _jsx("span", { children: defaultStartDate })] }), _jsx("div", { className: "wechat-service-todos", children: (view?.todos ?? []).map((todo) => (_jsxs("button", { type: "button", onClick: () => setFeedback({ tone: 'info', text: todo.action }), className: "wechat-service-todo", children: [_jsx("strong", { children: todo.count }), _jsx("span", { children: todo.title })] }, todo.id))) })] }), _jsxs("section", { className: "wechat-service-section wechat-service-conversations", "aria-label": "\u4F1A\u8BDD\u961F\u5217", children: [_jsxs("div", { className: "wechat-service-section__head", children: [_jsx("h2", { children: "\u4F1A\u8BDD\u961F\u5217" }), _jsxs("span", { children: [view?.pagination.total ?? 0, " \u6761"] })] }), isLoading ? _jsx("div", { className: "wechat-service-loading", children: "\u6B63\u5728\u540C\u6B65\u5FAE\u4FE1\u5BA2\u670D\u6570\u636E..." }) : null, !isLoading && view?.conversations.length === 0 ? (_jsx("div", { className: "wechat-service-empty", children: "\u6682\u65E0\u5FAE\u4FE1\u5BA2\u670D\u4F1A\u8BDD" })) : null, _jsxs("div", { className: "wechat-service-table", role: "table", "aria-label": "\u5FAE\u4FE1\u5BA2\u670D\u4F1A\u8BDD\u5217\u8868", children: [_jsxs("div", { className: "wechat-service-table__head", role: "row", children: [_jsx("div", { role: "columnheader", children: "\u5BA2\u6237" }), _jsx("div", { role: "columnheader", children: "\u6E20\u9053" }), _jsx("div", { role: "columnheader", children: "\u72B6\u6001" }), _jsx("div", { role: "columnheader", children: "\u623F\u6E90/\u5165\u4F4F" }), _jsx("div", { role: "columnheader", children: "\u6700\u540E\u6D88\u606F" }), _jsx("div", { role: "columnheader", children: "\u5BA2\u670D" }), _jsx("div", { role: "columnheader", children: "\u64CD\u4F5C" })] }), (view?.conversations ?? []).map((conversation) => (_jsxs("div", { className: "wechat-service-table__row", role: "row", children: [_jsxs("div", { role: "cell", children: [_jsx("strong", { children: conversation.customerName }), conversation.unread > 0 ? _jsx("span", { className: "wechat-service-unread", children: conversation.unread }) : null] }), _jsx("div", { role: "cell", children: conversation.channelName }), _jsx("div", { role: "cell", children: _jsx("span", { className: `wechat-service-status is-${conversation.status}`, children: conversation.statusName }) }), _jsxs("div", { role: "cell", children: [_jsx("span", { children: conversation.roomType }), _jsx("small", { children: conversation.stayDate })] }), _jsx("div", { role: "cell", children: conversation.lastMessage }), _jsx("div", { role: "cell", children: conversation.assignee }), _jsx("div", { role: "cell", children: _jsxs("button", { type: "button", onClick: () => setSelectedConversation(conversation), children: ["\u67E5\u770B\u4F1A\u8BDD ", conversation.id] }) })] }, conversation.id)))] })] })] }), selectedMetric ? (_jsx(Dialog, { title: "\u6307\u6807\u8BE6\u60C5", onClose: () => setSelectedMetric(null), children: _jsxs("p", { children: [selectedMetric, " \u5DF2\u6309\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u7EDF\u8BA1\uFF0C\u6570\u636E\u66F4\u65B0\u65F6\u95F4 ", view?.refreshedAt ?? '-'] }) })) : null, selectedAccount ? (_jsxs(Dialog, { title: "\u5BA2\u670D\u8D26\u53F7\u8BE6\u60C5", onClose: () => setSelectedAccount(null), children: [_jsxs("p", { children: [selectedAccount.name, " \u5F53\u524D\u72B6\u6001\uFF1A", accountStatusText[selectedAccount.status]] }), _jsxs("p", { children: ["\u4ECA\u65E5\u4F1A\u8BDD ", selectedAccount.todaySessions, "\uFF0C\u5E73\u5747\u54CD\u5E94 ", formatSeconds(selectedAccount.averageReplySeconds), "\u3002"] })] })) : null, selectedConversation ? (_jsxs(Dialog, { title: "\u4F1A\u8BDD\u8BE6\u60C5", onClose: () => setSelectedConversation(null), children: [_jsx("p", { children: selectedConversation.customerName }), _jsxs("p", { children: [selectedConversation.channelName, " / ", selectedConversation.statusName, " / ", selectedConversation.orderStatus] }), _jsx("p", { children: selectedConversation.roomType }), _jsx("p", { children: selectedConversation.stayDate }), _jsx("p", { children: selectedConversation.lastMessage }), _jsxs("div", { className: "wechat-service-dialog-actions", children: [_jsx("button", { type: "button", onClick: handleFollowUp, children: "\u6807\u8BB0\u5DF2\u8DDF\u8FDB" }), _jsx("button", { type: "button", onClick: () => setSelectedConversation(null), children: "\u5173\u95ED\u8BE6\u60C5" })] })] })) : null] }));
}
function FilterMenu({ label, options, isOpen, onToggle, onSelect, }) {
    return (_jsxs("div", { className: "wechat-service-menu", children: [_jsx("button", { type: "button", "aria-haspopup": "listbox", "aria-expanded": isOpen, onClick: onToggle, children: label }), isOpen ? (_jsx("div", { className: "wechat-service-menu__list", role: "listbox", children: options.map((option) => (_jsx("button", { type: "button", role: "option", onClick: () => onSelect(option.value), children: option.label }, option.value || option.label))) })) : null] }));
}
function MetricCard({ label, value, onClick }) {
    return (_jsxs("button", { type: "button", className: "wechat-service-metric", onClick: onClick, children: [_jsx("span", { children: label }), _jsx("strong", { children: value })] }));
}
function Dialog({ title, children, onClose }) {
    return (_jsx("div", { className: "wechat-service-dialog-backdrop", children: _jsxs("section", { className: "wechat-service-dialog", role: "dialog", "aria-label": title, children: [_jsxs("header", { children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", onClick: onClose, "aria-label": `关闭${title}`, children: "\u00D7" })] }), _jsx("div", { children: children })] }) }));
}
function labelFor(options, value) {
    return options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '全部';
}
function formatSeconds(seconds) {
    if (seconds <= 0)
        return '0秒';
    if (seconds < 60)
        return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const restSeconds = seconds % 60;
    return `${minutes}分${restSeconds}秒`;
}
const accountStatusText = {
    online: '在线',
    busy: '忙碌',
    offline: '离线',
};
