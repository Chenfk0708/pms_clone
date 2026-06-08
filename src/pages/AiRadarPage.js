import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAiGlobalDataExportTask, fetchAiGlobalDataDashboard, fetchAiGlobalRoomDetail, getAiGlobalDataFallbackFilterOptions, getDefaultAiGlobalDataQuery, postponeAiGlobalReminder, resolveAiGlobalDataRuntimeConfig, resolveAiGlobalReminder, } from '../services/aiGlobalData';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './AiRadarPage.css';
export function AiRadarPage() {
    const navigate = useNavigate();
    const runtimeConfig = useMemo(() => resolveAiGlobalDataRuntimeConfig(window.location.search), []);
    const initialQuery = useMemo(() => getDefaultAiGlobalDataQuery(runtimeConfig), [runtimeConfig]);
    const [filters, setFilters] = useState(initialQuery);
    const [query, setQuery] = useState(initialQuery);
    const [viewModel, setViewModel] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [feedback, setFeedback] = useState('全域数据加载中');
    const [reminderStatusMap, setReminderStatusMap] = useState({});
    const nextSuccessFeedback = useRef('');
    const filterOptions = viewModel?.filterOptions ?? getAiGlobalDataFallbackFilterOptions();
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: filterOptions.camps.map((option) => ({ id: option.value, label: option.label })),
    });
    const filterIds = {
        camp: 'ai-global-data-filter-camp',
        channel: 'ai-global-data-filter-channel',
        attention: 'ai-global-data-filter-attention',
        roomKeyword: 'ai-global-data-filter-room-keyword',
    };
    useEffect(() => {
        const controller = new AbortController();
        fetchAiGlobalDataDashboard(query, controller.signal)
            .then((result) => {
            if (controller.signal.aborted)
                return;
            setViewModel(result);
            setErrorMessage('');
            setFeedback(nextSuccessFeedback.current || '全域数据已加载');
            nextSuccessFeedback.current = '';
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setViewModel(null);
            setErrorMessage(error instanceof Error ? error.message : '全域数据加载失败，请稍后重试');
            setFeedback('全域数据加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        });
        return () => controller.abort();
    }, [query]);
    const contractText = useMemo(() => JSON.stringify({
        traceId: viewModel?.traceId ?? '',
        provider: viewModel?.provider ?? query.provider ?? 'mock',
        requestContracts: viewModel?.requestContracts ?? {},
    }, null, 2), [query.provider, viewModel]);
    const reminders = useMemo(() => (viewModel?.reminders ?? []).map((item) => ({
        ...item,
        status: reminderStatusMap[item.id] ?? item.status,
    })), [reminderStatusMap, viewModel]);
    function updateFilter(key, value) {
        setFilters((current) => ({ ...current, [key]: value }));
    }
    function submitFilters() {
        nextSuccessFeedback.current = '已按当前条件刷新全域数据';
        setIsLoading(true);
        setErrorMessage('');
        setFeedback('全域数据加载中');
        setQuery({ ...filters, reminderPage: 1 });
    }
    function resetFilters() {
        const defaults = getDefaultAiGlobalDataQuery(runtimeConfig);
        nextSuccessFeedback.current = '筛选条件已重置';
        setIsLoading(true);
        setErrorMessage('');
        setFeedback('全域数据加载中');
        setReminderStatusMap({});
        setFilters(defaults);
        setQuery(defaults);
    }
    function refreshDashboard() {
        nextSuccessFeedback.current = '全域数据已刷新';
        setIsLoading(true);
        setErrorMessage('');
        setFeedback('全域数据加载中');
        setQuery((current) => ({ ...current }));
    }
    async function exportSnapshot() {
        try {
            const task = await createAiGlobalDataExportTask(query);
            setFeedback(`全域数据导出任务已创建：${task.taskId}`);
        }
        catch (error) {
            setFeedback(error instanceof Error ? error.message : '全域数据导出失败');
        }
    }
    function openSubscription() {
        navigate('/version/applicationPayment/detail?app=globalRadar');
    }
    async function openRoomDetail(room) {
        const detail = await fetchAiGlobalRoomDetail(room.id, query);
        setDialog({ type: 'room', detail });
    }
    async function postponeReminder(reminder) {
        try {
            const result = await postponeAiGlobalReminder(reminder, query);
            setReminderStatusMap((current) => ({ ...current, [reminder.id]: result.status }));
            setFeedback('已延后提醒并保留在今日待办');
        }
        catch (error) {
            setFeedback(error instanceof Error ? error.message : '强提醒操作失败');
        }
    }
    async function resolveReminder(reminder) {
        try {
            const result = await resolveAiGlobalReminder(reminder, query);
            setReminderStatusMap((current) => ({ ...current, [reminder.id]: result.status }));
            setFeedback('强提醒已标记完成');
        }
        catch (error) {
            setFeedback(error instanceof Error ? error.message : '强提醒操作失败');
        }
    }
    function openReminderTarget(reminder) {
        if (reminder.primaryAction === 'status') {
            navigate('/houseManage/months');
            return;
        }
        navigate('/order/house-order/list');
    }
    return (_jsxs("div", { className: "ai-global-data-page", "data-provider": viewModel?.provider ?? query.provider ?? 'mock', "data-response-state": errorMessage ? 'error' : viewModel?.state ?? query.mockState ?? 'success', "data-request-camp": query.campId, "data-request-channel": query.channel, "data-request-attention": query.attention, "data-request-room-keyword": query.roomKeyword, children: [_jsxs("section", { className: "ai-global-data-shell", children: [_jsxs("header", { className: "ai-global-data-hero", children: [_jsxs("div", { children: [_jsx("p", { children: "AI\u5168\u57DF\u96F7\u8FBE / \u6570\u636E\u4E0E\u914D\u7F6E" }), _jsx("h1", { children: "\u5168\u57DF\u6570\u636E" }), _jsx("span", { children: viewModel?.subscription.connectorProgress ?? '连接器状态加载中' })] }), _jsxs("div", { className: "ai-global-data-hero__actions", children: [_jsx("button", { type: "button", "data-testid": "ai-global-data-refresh", "aria-label": "\u5237\u65B0", onClick: refreshDashboard, disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", "data-testid": "ai-global-data-export", "aria-label": "\u5BFC\u51FA\u5FEB\u7167", onClick: () => void exportSnapshot(), disabled: isLoading || !viewModel, children: "\u5BFC\u51FA\u5FEB\u7167" }), _jsx("button", { type: "button", "data-testid": "ai-global-data-open-subscription", "aria-label": "\u7ACB\u5373\u5F00\u901A", className: "is-primary", onClick: openSubscription, children: "\u7ACB\u5373\u5F00\u901A" })] })] }), _jsxs("section", { className: "ai-global-data-filters", "aria-label": "\u5168\u57DF\u6570\u636E\u7B5B\u9009\u6761\u4EF6", children: [_jsx(StoreSelectControl, { label: "\u95E8\u5E97\u8303\u56F4", options: storeOptions.map((option) => ({ id: option.id, name: option.label })), value: filters.campId, disabled: storeLoading, onChange: (campId) => updateFilter('campId', campId) }), _jsxs("label", { htmlFor: filterIds.channel, children: [_jsx("span", { children: "\u6E20\u9053\u89C6\u56FE" }), _jsx("select", { id: filterIds.channel, "aria-label": "\u6E20\u9053\u89C6\u56FE", value: filters.channel, onChange: (event) => updateFilter('channel', event.target.value), children: filterOptions.channels.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { htmlFor: filterIds.attention, children: [_jsx("span", { children: "\u5173\u6CE8\u7EA7\u522B" }), _jsx("select", { id: filterIds.attention, "aria-label": "\u5173\u6CE8\u7EA7\u522B", value: filters.attention, onChange: (event) => updateFilter('attention', event.target.value), children: filterOptions.attentions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "is-wide", htmlFor: filterIds.roomKeyword, children: [_jsx("span", { children: "\u623F\u578B\u5173\u952E\u5B57" }), _jsx("input", { id: filterIds.roomKeyword, "aria-label": "\u623F\u578B\u5173\u952E\u5B57", value: filters.roomKeyword, placeholder: "\u623F\u578B / \u6E20\u9053\u5173\u952E\u8BCD", onChange: (event) => updateFilter('roomKeyword', event.target.value) })] }), _jsxs("div", { className: "ai-global-data-filters__actions", children: [_jsx("button", { type: "button", "aria-label": "\u67E5\u8BE2", className: "is-primary", onClick: submitFilters, disabled: isLoading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", "aria-label": "\u91CD\u7F6E", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" })] })] }), _jsx("div", { className: "ai-global-data-feedback", role: "status", "aria-label": "\u5168\u57DF\u6570\u636E\u64CD\u4F5C\u53CD\u9988", children: isLoading ? '全域数据加载中' : feedback }), _jsx("pre", { "data-testid": "ai-global-data-contract", className: "ai-global-data-contract", children: contractText }), errorMessage ? (_jsxs("section", { className: "ai-global-data-error", role: "alert", children: [_jsx("strong", { children: "\u5168\u57DF\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: errorMessage }), _jsx("button", { type: "button", "aria-label": "\u91CD\u65B0\u52A0\u8F7D", onClick: refreshDashboard, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, viewModel ? (_jsxs(_Fragment, { children: [viewModel.isEmpty ? (_jsxs("section", { className: "ai-global-data-empty", "aria-label": "\u5168\u57DF\u6570\u636E\u7A7A\u6001", children: [_jsx("strong", { children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65E0\u7ECF\u8425\u6570\u636E" }), _jsx("p", { children: "\u53EF\u4EE5\u8C03\u6574\u95E8\u5E97\u3001\u6E20\u9053\u6216\u5173\u6CE8\u7EA7\u522B\u540E\u518D\u6B21\u67E5\u8BE2\uFF0C\u4E5F\u53EF\u4EE5\u5148\u524D\u5F80\u914D\u7F6E\u4E2D\u5FC3\u68C0\u67E5\u8FDE\u63A5\u5668\u72B6\u6001\u3002" })] })) : null, _jsx("section", { className: "ai-global-data-summary", "aria-label": "\u5168\u57DF\u7ECF\u8425\u6307\u6807", children: viewModel.summary.map((metric) => (_jsxs("button", { type: "button", className: `ai-global-data-summary-card is-${metric.tone}`, onClick: () => setDialog({ type: 'metric', metric }), children: [_jsx("span", { children: metric.label }), _jsxs("strong", { children: [metric.value, _jsx("em", { children: metric.unit })] }), _jsx("small", { children: metric.description })] }, metric.id))) }), _jsxs("div", { className: "ai-global-data-grid", children: [_jsxs("section", { className: "ai-global-data-card", "aria-label": "\u5F3A\u63D0\u9192\u5217\u8868", children: [_jsx("header", { children: _jsxs("div", { children: [_jsx("h2", { children: "\u5F3A\u63D0\u9192\u5217\u8868" }), _jsx("p", { children: "\u5F85\u5904\u7406\u63D0\u9192" })] }) }), reminders.length > 0 ? (_jsx("div", { className: "ai-global-data-reminders", children: reminders.map((reminder) => (_jsxs("article", { className: `ai-global-data-reminder is-${reminder.level}`, children: [_jsxs("div", { children: [_jsx("strong", { children: reminder.title }), _jsxs("span", { children: [reminder.guestName, " \u00B7 ", reminder.roomName] }), _jsxs("small", { children: [reminder.orderNo, " \u00B7 ", reminder.dueAt, " \u00B7 ", statusText(reminder.status)] })] }), _jsx("p", { children: reminder.summary }), _jsxs("div", { className: "ai-global-data-reminder__actions", children: [_jsx("button", { type: "button", "aria-label": "\u67E5\u770B\u8BA2\u5355", onClick: () => openReminderTarget(reminder), children: "\u67E5\u770B\u8BA2\u5355" }), _jsx("button", { type: "button", "aria-label": "\u7A0D\u540E\u63D0\u9192", onClick: () => void postponeReminder(reminder), disabled: reminder.status !== 'pending', children: "\u7A0D\u540E\u63D0\u9192" }), _jsx("button", { type: "button", "aria-label": "\u6807\u8BB0\u5B8C\u6210", onClick: () => void resolveReminder(reminder), disabled: reminder.status === 'resolved', children: "\u6807\u8BB0\u5B8C\u6210" })] })] }, reminder.id))) })) : (_jsx(InlineEmpty, { text: "\u5F53\u524D\u6CA1\u6709\u5F85\u8DDF\u8FDB\u7684\u5F3A\u63D0\u9192\u3002" }))] }), _jsxs("section", { className: "ai-global-data-card", "aria-label": "\u6E20\u9053\u63A5\u5165\u72B6\u6001", children: [_jsx("header", { children: _jsxs("div", { children: [_jsx("h2", { children: "\u6E20\u9053\u63A5\u5165\u72B6\u6001" }), _jsx("p", { children: "\u8FDE\u63A5\u5668\u4E0E\u6388\u6743\u5065\u5EB7\u5EA6" })] }) }), viewModel.stores.length > 0 ? (_jsx("div", { className: "ai-global-data-stores", children: viewModel.stores.map((store) => (_jsxs("article", { children: [_jsxs("div", { children: [_jsx("strong", { children: store.name }), _jsx("span", { children: store.authorizedChannels.join(' / ') || '待配置渠道' })] }), _jsxs("div", { className: "ai-global-data-store-tags", children: [_jsx("b", { className: `is-${store.connectorStatus}`, children: connectorText(store.connectorStatus) }), _jsx("small", { children: radarText(store.radarStatus) })] }), _jsxs("footer", { children: [_jsx("span", { children: store.updatedAt }), _jsx("button", { type: "button", "aria-label": "\u67E5\u770B\u914D\u7F6E", onClick: () => navigate('/channels/globalRadar/globalSetting'), children: "\u67E5\u770B\u914D\u7F6E" })] })] }, store.id))) })) : (_jsx(InlineEmpty, { text: "\u5F53\u524D\u95E8\u5E97\u8FD8\u6CA1\u6709\u63A5\u5165\u8FDE\u63A5\u5668\u72B6\u6001\u6570\u636E\u3002" }))] })] }), _jsxs("div", { className: "ai-global-data-grid", children: [_jsxs("section", { className: "ai-global-data-card", "aria-label": "\u7ECF\u8425\u8282\u594F", children: [_jsx("header", { children: _jsxs("div", { children: [_jsx("h2", { children: "\u7ECF\u8425\u8282\u594F" }), _jsx("p", { children: "\u6309\u5173\u952E\u7ECF\u8425\u52A8\u4F5C\u805A\u5408\u7684\u4ECA\u65E5\u8282\u594F\u5206\u5E03" })] }) }), _jsx("div", { className: "ai-global-data-trend", children: viewModel.trend.map((item) => (_jsxs("button", { type: "button", className: `ai-global-data-trend__item is-${item.tone}`, onClick: () => {
                                                        const metric = viewModel.summary.find((summaryItem) => summaryItem.id === item.id);
                                                        if (metric)
                                                            setDialog({ type: 'metric', metric });
                                                    }, children: [_jsx("span", { children: item.label }), _jsx("i", { style: { height: `${Math.max(18, item.value * 6)}px` } }), _jsx("strong", { children: item.value }), _jsx("small", { children: item.caption })] }, item.id))) })] }), _jsxs("section", { className: "ai-global-data-card", children: [_jsx("header", { children: _jsxs("div", { children: [_jsx("h2", { children: "\u5FEB\u6377\u5165\u53E3" }), _jsx("p", { children: "\u7EDF\u4E00\u590D\u7528\u9879\u76EE\u5DF2\u6709\u4E1A\u52A1\u8DEF\u7531" })] }) }), _jsx("div", { className: "ai-global-data-quick-links", children: viewModel.quickLinks.map((link) => (_jsx("button", { type: "button", "aria-label": link.label, onClick: () => navigate(link.path), children: link.label }, link.path))) })] })] }), _jsxs("section", { className: "ai-global-data-card", "aria-label": "\u623F\u578B\u7ECF\u8425\u770B\u677F", children: [_jsx("header", { children: _jsxs("div", { children: [_jsx("h2", { children: "\u623F\u578B\u7ECF\u8425\u770B\u677F" }), _jsx("p", { children: "\u623F\u578B\u7ECF\u8425\u6570\u636E\u6765\u81EA\u623F\u578B\u5951\u7EA6\u3001\u6E20\u9053\u5951\u7EA6\u548C\u7ECF\u8425\u63D0\u9192\u7EDF\u4E00\u9002\u914D\u3002" })] }) }), viewModel.roomCategories.length > 0 ? (_jsxs("div", { className: "ai-global-data-table", children: [_jsxs("div", { className: "ai-global-data-table__head", children: [_jsx("div", { children: "\u623F\u578B" }), _jsx("div", { children: "\u5E93\u5B58 / \u5728\u4F4F" }), _jsx("div", { children: "\u57FA\u7840\u4EF7" }), _jsx("div", { children: "\u5468\u672B\u4EF7" }), _jsx("div", { children: "\u8282\u5047\u65E5\u4EF7" }), _jsx("div", { children: "\u5165\u4F4F\u7387" }), _jsx("div", { children: "\u5F85\u5904\u7406" }), _jsx("div", { children: "\u64CD\u4F5C" })] }), viewModel.roomCategories.map((room) => (_jsxs("div", { className: "ai-global-data-table__row", children: [_jsxs("div", { children: [_jsx("strong", { children: room.name }), _jsxs("span", { children: [room.city, " \u00B7 ", channelNames(room.channels)] })] }), _jsxs("div", { children: [room.inventory, " / ", room.staying] }), _jsxs("div", { children: ["\uFFE5", room.basePrice] }), _jsxs("div", { children: ["\uFFE5", room.weekendPrice] }), _jsxs("div", { children: ["\uFFE5", room.holidayPrice] }), _jsxs("div", { children: [room.occupancyRate, "%"] }), _jsx("div", { children: _jsxs("b", { className: `is-${room.riskLevel}`, children: [room.pendingOrders, " \u5355"] }) }), _jsxs("div", { className: "ai-global-data-table__actions", children: [_jsx("button", { type: "button", "aria-label": "\u623F\u6001", onClick: () => navigate('/houseManage/months'), children: "\u623F\u6001" }), _jsx("button", { type: "button", "aria-label": "\u67E5\u770B\u8BE6\u60C5", onClick: () => void openRoomDetail(room), children: "\u67E5\u770B\u8BE6\u60C5" })] })] }, room.id)))] })) : (_jsx(InlineEmpty, { text: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u623F\u578B\u7ECF\u8425\u6570\u636E\u3002" }))] }), _jsxs("section", { className: "ai-global-data-subscription", children: [_jsxs("div", { children: [_jsx("p", { children: viewModel.subscription.editionName }), _jsx("h2", { children: viewModel.subscription.title }), _jsx("span", { children: viewModel.subscription.priceText }), _jsx("p", { children: viewModel.subscription.description })] }), _jsxs("div", { children: [_jsx("strong", { children: viewModel.subscription.connectorProgress }), _jsxs("small", { children: ["\u652F\u4ED8\u65B9\u5F0F\uFF1A", viewModel.subscription.paymentHint] }), _jsx("button", { type: "button", "data-testid": "ai-global-data-subscription-cta", "aria-label": viewModel.subscription.actionText, className: "is-primary", onClick: openSubscription, children: viewModel.subscription.actionText })] })] })] })) : null] }), dialog ? _jsx(AiGlobalDialog, { dialog: dialog, onClose: () => setDialog(null) }) : null] }));
}
function AiGlobalDialog({ dialog, onClose }) {
    if (dialog.type === 'metric') {
        return (_jsx(DialogFrame, { title: "\u6307\u6807\u8BE6\u60C5", closeLabel: "\u5173\u95ED\u6307\u6807\u8BE6\u60C5", onClose: onClose, children: _jsx("div", { className: "ai-global-data-dialog-list", children: dialog.metric.detailLines.map((line) => (_jsx("p", { children: line }, line))) }) }));
    }
    return (_jsxs(DialogFrame, { title: "\u623F\u578B\u7ECF\u8425\u8BE6\u60C5", closeLabel: "\u5173\u95ED\u623F\u578B\u7ECF\u8425\u8BE6\u60C5", onClose: onClose, children: [_jsxs("dl", { className: "ai-global-data-room-detail", children: [_jsxs("div", { children: [_jsx("dt", { children: "\u623F\u578B" }), _jsx("dd", { children: dialog.detail.roomName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5E93\u5B58 / \u5728\u4F4F" }), _jsxs("dd", { children: [dialog.detail.inventory, " / ", dialog.detail.staying] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5165\u4F4F\u7387" }), _jsxs("dd", { children: [dialog.detail.occupancyRate, "%"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5F85\u5904\u7406\u8BA2\u5355" }), _jsxs("dd", { children: [dialog.detail.pendingOrders, " \u5355"] })] })] }), _jsxs("div", { className: "ai-global-data-dialog-section", children: [_jsx("h3", { children: "\u6E20\u9053\u4EF7\u683C" }), _jsx("ul", { children: dialog.detail.channelPrices.map((item) => (_jsxs("li", { children: [_jsx("strong", { children: item.label }), _jsxs("span", { children: ["\uFFE5", item.price] }), _jsx("small", { children: item.status })] }, item.label))) })] }), _jsxs("div", { className: "ai-global-data-dialog-section", children: [_jsx("h3", { children: "\u8DDF\u8FDB\u5EFA\u8BAE" }), _jsx("ul", { children: dialog.detail.guidance.map((item) => (_jsx("li", { children: item }, item))) })] })] }));
}
function DialogFrame({ title, closeLabel, children, onClose, }) {
    return (_jsx("div", { className: "ai-global-data-modal-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "ai-global-data-modal", role: "dialog", "aria-modal": "true", "aria-label": title, onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", "aria-label": closeLabel, onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "ai-global-data-modal__body", children: children })] }) }));
}
function InlineEmpty({ text }) {
    return (_jsxs("div", { className: "ai-global-data-inline-empty", children: [_jsx("strong", { children: "\u6682\u65E0\u6570\u636E" }), _jsx("p", { children: text })] }));
}
function statusText(status) {
    if (status === 'postponed')
        return '已延后';
    if (status === 'resolved')
        return '已处理';
    return '待处理';
}
function connectorText(status) {
    if (status === 'warning')
        return '连接器延迟';
    if (status === 'offline')
        return '离线';
    return '在线';
}
function radarText(status) {
    if (status === 'delay')
        return '采集延迟';
    if (status === 'setup')
        return '配置中';
    return '采集中';
}
function channelNames(channels) {
    if (channels.length === 0)
        return '未接渠道';
    return channels.map((item) => (item === 'ctrip' ? '携程酒店' : '美团酒店')).join(' / ');
}
